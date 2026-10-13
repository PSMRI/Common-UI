/*
 * AMRIT – Accessible Medical Records via Integrated Technology
 * Integrated EHR (Electronic Health Records) Solution
 *
 * Copyright (C) "Piramal Swasthya Management and Research Institute"
 *
 * This file is part of AMRIT.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see https://www.gnu.org/licenses/.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { mockNotice, mockNoticeNoAudio } from './consent.mock';
import { Type } from '@angular/core';
import { NoticeStepBase } from '../ui/notice-step.base';

class FakeIntersectionObserver {
  static last: FakeIntersectionObserver;
  observed: Element[] = [];
  disconnected = false;
  constructor(public callback: IntersectionObserverCallback, public options?: IntersectionObserverInit) {
    FakeIntersectionObserver.last = this;
  }
  observe(el: Element): void {
    this.observed.push(el);
  }
  disconnect(): void {
    this.disconnected = true;
  }
  fire(isIntersecting: boolean): void {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

/** Behaviour suite run by each track's notice step spec. */
export function noticeStepSuite(NoticeStepComponent: Type<NoticeStepBase>, track: string): void {
describe(`NoticeStepComponent (${track})`, () => {
  let fixture: ComponentFixture<NoticeStepBase>;
  let component: NoticeStepBase;
  let realObserver: typeof IntersectionObserver;
  let reads: number;
  let played: number;

  function create(notice = mockNotice('hi')): void {
    fixture = TestBed.createComponent(NoticeStepComponent);
    component = fixture.componentInstance;
    component.notice = notice;
    component.text = { playAudio: 'Play', readToEnd: 'Read to end', title: 'Consent' };
    reads = 0;
    played = 0;
    component.readComplete.subscribe(() => reads++);
    component.audioPlayedToEnd.subscribe(() => played++);
    fixture.detectChanges();
  }

  function audio(currentTime: number, duration = 60): HTMLAudioElement {
    return { currentTime, duration } as HTMLAudioElement;
  }

  beforeEach(() => {
    realObserver = window.IntersectionObserver;
    (window as any).IntersectionObserver = FakeIntersectionObserver;
    TestBed.configureTestingModule({ imports: [NoticeStepComponent] });
  });

  afterEach(() => {
    (window as any).IntersectionObserver = realObserver;
  });

  it('renders the notice details and strips scripts from the body', () => {
    create();
    const el: HTMLElement = fixture.nativeElement;
    ['Notice body', 'Name, age, phone', 'Kept for 5 years', 'Treating facility', 'Ask staff', 'Contact the DPO'].forEach(
      (t) => expect(el.textContent).toContain(t)
    );
    expect(el.querySelector('script')).toBeNull();
    expect((window as any).hacked).toBeUndefined();
  });

  it('reports read once when the end marker becomes visible', () => {
    create();
    const observer = FakeIntersectionObserver.last;
    expect(observer.observed.length).toBe(1);
    observer.fire(false);
    expect(reads).toBe(0);
    observer.fire(true);
    observer.fire(true);
    expect(reads).toBe(1);
  });

  it('falls back to a scroll check when IntersectionObserver is missing', () => {
    (window as any).IntersectionObserver = undefined;
    fixture = TestBed.createComponent(NoticeStepComponent);
    component = fixture.componentInstance;
    component.notice = mockNotice('hi');
    const onScroll = spyOn(component, 'onScroll');
    fixture.detectChanges();
    expect(onScroll).toHaveBeenCalled();
  });

  it('reports read on scroll only at the bottom', () => {
    create();
    const box = { scrollTop: 0, clientHeight: 200, scrollHeight: 1000 };
    component.scrollBox = { nativeElement: box } as never;
    component.onScroll();
    expect(reads).toBe(0);
    box.scrollTop = 799;
    component.onScroll();
    expect(reads).toBe(1);
    component.scrollBox = undefined;
    component.onScroll();
    expect(reads).toBe(1);
  });

  it('shows the audio player only when the notice has audio', () => {
    create(mockNoticeNoAudio());
    expect(fixture.nativeElement.querySelector('audio')).toBeNull();
    fixture.destroy();
    create(mockNotice('hi'));
    expect(fixture.nativeElement.querySelector('audio')).not.toBeNull();
  });

  it('counts audio as heard only when it was played, not skipped', () => {
    create();
    for (let t = 1; t <= 60; t++) {
      component.onTimeUpdate(audio(t));
    }
    component.onEnded(audio(60));
    expect(played).toBe(1);
    expect(reads).toBe(1);
  });

  it('does not count a seek to the end', () => {
    create();
    component.onTimeUpdate(audio(1));
    component.onTimeUpdate(audio(59));
    component.onTimeUpdate(audio(60));
    component.onEnded(audio(60));
    expect(played).toBe(0);
    expect(reads).toBe(0);
  });

  it('hides a failed audio player and keeps the scroll rule', () => {
    create();
    component.onAudioError();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('audio')).toBeNull();
    FakeIntersectionObserver.last.fire(true);
    expect(reads).toBe(1);
  });

  it('resets and re-watches when the notice changes, and disconnects on destroy', () => {
    create();
    const first = FakeIntersectionObserver.last;
    first.fire(true);
    component.notice = mockNotice('en');
    component.ngOnChanges({
      notice: { previousValue: null, currentValue: component.notice, firstChange: false, isFirstChange: () => false },
    });
    expect(first.disconnected).toBeTrue();
    const second = FakeIntersectionObserver.last;
    expect(second).not.toBe(first);
    second.fire(true);
    expect(reads).toBe(2);
    component.ngOnChanges({});
    fixture.destroy();
    expect(second.disconnected).toBeTrue();
  });

  it('observes against the viewport when there is no scroll box', () => {
    create();
    component.scrollBox = undefined;
    (component as any).watchEnd();
    expect(FakeIntersectionObserver.last.options!.root).toBeNull();
  });

  it('does nothing when there is no end marker', () => {
    create();
    component.endMarker = undefined;
    (component as any).watchEnd();
    expect(component).toBeTruthy();
  });
});
}
