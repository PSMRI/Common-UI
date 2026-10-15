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
import { NoticeStepBase, speechLang } from '../ui/notice-step.base';

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
    component.text = { playAudio: 'Play', stopAudio: 'Stop', readToEnd: 'Read to end', title: 'Consent' };
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

  describe('read aloud (text to speech)', () => {
    class FakeUtterance {
      static last: FakeUtterance;
      lang = '';
      voice: unknown = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public text: string) {
        FakeUtterance.last = this;
      }
    }
    let synth: jasmine.SpyObj<SpeechSynthesis>;
    let realUtterance: unknown;
    let speechGetter: jasmine.Spy;

    function speakButton(): HTMLButtonElement | null {
      return fixture.nativeElement.querySelector('button.consent-notice-speak');
    }

    beforeEach(() => {
      synth = jasmine.createSpyObj<SpeechSynthesis>('speechSynthesis', ['speak', 'cancel', 'getVoices']);
      synth.getVoices.and.returnValue([{ lang: 'en-IN' }, { lang: 'hi-IN' }] as SpeechSynthesisVoice[]);
      speechGetter = spyOnProperty(window, 'speechSynthesis', 'get').and.returnValue(synth);
      realUtterance = (window as any).SpeechSynthesisUtterance;
      (window as any).SpeechSynthesisUtterance = FakeUtterance;
    });

    afterEach(() => {
      (window as any).SpeechSynthesisUtterance = realUtterance;
    });

    it('offers to read the notice aloud when there is no audio file', () => {
      create(mockNoticeNoAudio('en'));
      expect(speakButton()).not.toBeNull();
      expect(speakButton()!.textContent).toContain('Play');
    });

    it('uses the audio file instead when there is one, and speech if it fails', () => {
      create(mockNotice('hi'));
      expect(speakButton()).toBeNull();
      component.onAudioError();
      fixture.detectChanges();
      expect(speakButton()).not.toBeNull();
    });

    it('hides the button when the browser cannot speak', () => {
      speechGetter.and.returnValue(undefined);
      create(mockNoticeNoAudio('en'));
      expect(component.canSpeak).toBeFalse();
      expect(speakButton()).toBeNull();
    });

    it('speaks the displayed text in the notice language and unlocks when finished', () => {
      create(mockNoticeNoAudio('en'));
      speakButton()!.click();
      fixture.detectChanges();
      const spoken = FakeUtterance.last;
      expect(synth.speak).toHaveBeenCalledWith(spoken as unknown as SpeechSynthesisUtterance);
      expect(spoken.text).toContain('Notice body');
      expect(spoken.text).toContain('Kept for 5 years');
      expect(spoken.lang).toBe('en-IN');
      expect(spoken.voice).toEqual({ lang: 'en-IN' });
      expect(component.speaking).toBeTrue();
      expect(speakButton()!.getAttribute('aria-pressed')).toBe('true');
      expect(speakButton()!.textContent).toContain('Stop');
      spoken.onend!();
      fixture.detectChanges();
      expect(played).toBe(1);
      expect(reads).toBe(1);
      expect(component.speaking).toBeFalse();
    });

    it('picks a voice by language prefix, or none', () => {
      synth.getVoices.and.returnValue([{ lang: 'as' }] as SpeechSynthesisVoice[]);
      create(mockNoticeNoAudio('as'));
      component.playNotice();
      expect(FakeUtterance.last.voice).toEqual({ lang: 'as' });
      synth.getVoices.and.returnValue([]);
      component.playNotice();
      expect(FakeUtterance.last.voice).toBeNull();
    });

    it('stops on demand and ignores the cancelled utterance', () => {
      create(mockNoticeNoAudio('en'));
      speakButton()!.click();
      const first = FakeUtterance.last;
      speakButton()!.click();
      fixture.detectChanges();
      expect(synth.cancel).toHaveBeenCalled();
      expect(component.speaking).toBeFalse();
      first.onend!();
      expect(played).toBe(0);
      component.stopNotice();
      expect(synth.cancel).toHaveBeenCalledTimes(1);
    });

    it('does not unlock on a speech error', () => {
      create(mockNoticeNoAudio('en'));
      component.playNotice();
      FakeUtterance.last.onerror!();
      expect(component.speaking).toBeFalse();
      expect(played).toBe(0);
    });

    it('stops speaking when the notice changes or the step is destroyed', () => {
      create(mockNoticeNoAudio('en'));
      component.playNotice();
      component.notice = mockNoticeNoAudio('hi');
      component.ngOnChanges({
        notice: { previousValue: null, currentValue: component.notice, firstChange: false, isFirstChange: () => false },
      });
      expect(synth.cancel).toHaveBeenCalledTimes(1);
      component.playNotice();
      fixture.destroy();
      expect(synth.cancel).toHaveBeenCalledTimes(2);
    });

    it('does nothing without the notice box', () => {
      create(mockNoticeNoAudio('en'));
      component.scrollBox = undefined;
      component.playNotice();
      expect(synth.speak).not.toHaveBeenCalled();
    });

    it('speechLang adds the India region unless one is given', () => {
      expect(speechLang('hi')).toBe('hi-IN');
      expect(speechLang('en-GB')).toBe('en-GB');
    });
  });
});
}
