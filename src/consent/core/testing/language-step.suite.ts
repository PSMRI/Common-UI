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
import { of, Subject, throwError } from 'rxjs';
import { NoticeLanguage } from '../consent.models';
import { createInOnPushHost } from './on-push-host';
import { ConsentApiService } from '../consent-api.service';
import { mockLanguages } from './consent.mock';
import { Type } from '@angular/core';
import { LanguageStepBase } from '../ui/language-step.base';

/** Behaviour suite run by each track's language step spec. */
export function languageStepSuite(LanguageStepComponent: Type<LanguageStepBase>, track: string): void {
describe(`LanguageStepComponent (${track})`, () => {
  let fixture: ComponentFixture<LanguageStepBase>;
  let component: LanguageStepBase;
  let api: jasmine.SpyObj<ConsentApiService>;
  const text = { chooseLanguage: 'Choose', serviceUnavailable: 'Unavailable', retry: 'Retry' };

  function create(): void {
    fixture = TestBed.createComponent(LanguageStepComponent);
    component = fixture.componentInstance;
    component.text = text;
    fixture.detectChanges();
  }

  function buttons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button'));
  }

  beforeEach(() => {
    api = jasmine.createSpyObj<ConsentApiService>('ConsentApiService', ['getLanguages']);
    TestBed.configureTestingModule({
      imports: [LanguageStepComponent],
      providers: [{ provide: ConsentApiService, useValue: api }],
    });
  });

  it('loads languages and hides right-to-left ones', () => {
    api.getLanguages.and.returnValue(of(mockLanguages()));
    create();
    expect(api.getLanguages).toHaveBeenCalledWith('REGISTRATION');
    expect(buttons().map((b) => b.getAttribute('lang'))).toEqual(['en', 'hi', 'as']);
  });

  it('emits the chosen language and marks the selected one', () => {
    api.getLanguages.and.returnValue(of(mockLanguages()));
    create();
    const emitted: string[] = [];
    component.languageSelected.subscribe((c) => emitted.push(c));
    buttons()[1].click();
    expect(emitted).toEqual(['hi']);
    component.selected = 'hi';
    fixture.detectChanges();
    expect(buttons()[1].getAttribute('aria-pressed')).toBe('true');
    expect(buttons()[0].getAttribute('aria-pressed')).toBe('false');
  });

  it('shows unavailable when the list is empty after filtering', () => {
    api.getLanguages.and.returnValue(of(mockLanguages().slice(3)));
    create();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Unavailable');
  });

  it('shows unavailable with a retry that reloads after an error', () => {
    api.getLanguages.and.returnValue(throwError(() => ({ kind: 'UNAVAILABLE', message: 'x' })));
    create();
    expect(component.failed).toBeTrue();
    api.getLanguages.and.returnValue(of(mockLanguages()));
    buttons()[0].click();
    fixture.detectChanges();
    expect(api.getLanguages).toHaveBeenCalledTimes(2);
    expect(component.failed).toBeFalse();
    expect(buttons().length).toBe(3);
  });

  it('renders languages that arrive later inside an OnPush dialog container', () => {
    const later = new Subject<NoticeLanguage[]>();
    api.getLanguages.and.returnValue(later);
    const { host, ref } = createInOnPushHost(LanguageStepComponent);
    ref.instance.text = text;
    host.detectChanges();
    later.next(mockLanguages());
    host.detectChanges();
    expect(host.nativeElement.querySelectorAll('button[lang]').length).toBe(3);
  });
});
}
