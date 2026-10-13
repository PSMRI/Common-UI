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
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { ConsentApiService } from '../consent-api.service';
import { ConsentContextService } from '../consent-context.service';
import { ConsentCaptureContext, SaveConsentResponse } from '../consent.models';
import {
  mockLanguages,
  mockNotice,
  mockSaveResponse,
  mockSaveResponseOffline,
} from './consent.mock';
import { InjectionToken, Type } from '@angular/core';
import { ConsentDialogBase } from '../ui/consent-dialog.base';

/** The dialog data token and dialog ref class of a track. */
export interface DialogTokens {
  data: InjectionToken<unknown>;
  ref: Type<unknown>;
}

/** Behaviour suite run by each track's consent dialog spec. */
export function consentDialogSuite(ConsentDialogComponent: Type<ConsentDialogBase>, track: string, tokens: DialogTokens): void {
describe(`ConsentDialogComponent (${track})`, () => {
  let fixture: ComponentFixture<ConsentDialogBase>;
  let component: ConsentDialogBase;
  let api: jasmine.SpyObj<ConsentApiService>;
  let dialogRef: jasmine.SpyObj<{ close: (r?: unknown) => void }>;
  let confirmation: jasmine.SpyObj<ConfirmationService>;
  const text = {
    title: 'Consent',
    cannotContinue: 'Cannot continue',
    confirmDecline: 'Confirm decline',
    close: 'Close',
    staleReload: 'Changed elsewhere',
    serviceUnavailable: 'Unavailable',
    retry: 'Retry',
    accept: 'Accept',
    decline: 'Decline',
  };
  const ctx: ConsentCaptureContext = {
    capturedBy: 4521,
    providerServiceMapId: 1714,
    facilityId: 33,
    servicePointId: 7,
    serviceLine: 'MMU',
    deviceId: 'd-1',
    capturedAt: '2026-10-13T10:15:00+05:30',
  };

  function ready(): void {
    component.loadNotice('hi');
    component.onReadComplete();
    component.onAudioPlayed();
    const decisions: { [k: string]: boolean } = {};
    mockNotice('hi').purposes.forEach((p) => (decisions[p.purposeCode] = true));
    component.onDecisions(decisions);
    component.onMode('SELF_READ');
    component.onProof({});
    fixture.detectChanges();
  }

  function buttonByText(label: string): HTMLButtonElement {
    return Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(
      (b) => b.textContent!.trim() === label
    )!;
  }

  beforeEach(() => {
    api = jasmine.createSpyObj<ConsentApiService>('ConsentApiService', ['getLanguages', 'getNotice', 'saveConsent']);
    api.getLanguages.and.returnValue(of(mockLanguages()));
    api.getNotice.and.callFake((_c, lang) => of(mockNotice(lang)));
    api.saveConsent.and.returnValue(of(mockSaveResponse()));
    dialogRef = jasmine.createSpyObj('DialogRef', ['close']);
    confirmation = jasmine.createSpyObj<ConfirmationService>('ConfirmationService', ['confirm', 'alert']);
    const context = jasmine.createSpyObj<ConsentContextService>('ConsentContextService', ['context']);
    context.context.and.returnValue(ctx);
    TestBed.configureTestingModule({
      imports: [ConsentDialogComponent],
      providers: [
        { provide: tokens.data, useValue: { context: 'REGISTRATION', beneficiaryRegId: null } },
        { provide: tokens.ref, useValue: dialogRef },
        { provide: ConsentApiService, useValue: api },
        { provide: ConsentContextService, useValue: context },
        { provide: ConfirmationService, useValue: confirmation },
        { provide: HttpServiceService, useValue: { currentLangugae$: of({ consent: text }) } },
      ],
    });
    fixture = TestBed.createComponent(ConsentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts at the language step with interface text', () => {
    expect(component.step).toBe('LANGUAGE');
    expect(component.text).toEqual(text);
    expect(fixture.nativeElement.querySelector('app-consent-language-step')).not.toBeNull();
    expect(buttonByText('Accept')).toBeUndefined();
  });

  it('loads the notice in the chosen language with every switch off', () => {
    component.loadNotice('hi');
    fixture.detectChanges();
    expect(api.getNotice).toHaveBeenCalledWith('REGISTRATION', 'hi');
    expect(component.step).toBe('DECIDE');
    expect(Object.values(component.draft.decisions).every((v) => !v)).toBeTrue();
    expect(buttonByText('Accept').disabled).toBeTrue();
    expect(buttonByText('Decline').disabled).toBeFalse();
  });

  it('gives Accept and Decline the same size', () => {
    component.loadNotice('hi');
    fixture.detectChanges();
    const size = (b: HTMLElement) => b.className.split(' ').filter((c) => /^(h|px|py)-/.test(c)).sort().join(' ');
    expect(size(buttonByText('Accept'))).toBe(size(buttonByText('Decline')));
  });

  it('reloads the notice and resets on language change', () => {
    ready();
    const firstKey = component.draft.idempotencyKey;
    component.changeLanguage();
    fixture.detectChanges();
    expect(component.step).toBe('LANGUAGE');
    component.loadNotice('en');
    expect(component.draft.languageCode).toBe('en');
    expect(component.draft.noticeReadComplete).toBeFalse();
    expect(component.draft.idempotencyKey).not.toBe(firstKey);
  });

  it('shows unavailable and retries a failed notice load', () => {
    api.getNotice.and.returnValue(throwError(() => ({ kind: 'UNAVAILABLE', message: 'x' })));
    component.loadNotice('hi');
    fixture.detectChanges();
    expect(component.failed).toBeTrue();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Unavailable');
    api.getNotice.and.returnValue(of(mockNotice('hi')));
    buttonByText('Retry').click();
    expect(api.getNotice).toHaveBeenCalledTimes(2);
    expect(component.step).toBe('DECIDE');
  });

  it('accepts: saves once with the draft key and closes with the outcome', () => {
    ready();
    expect(component.acceptEnabled).toBeTrue();
    buttonByText('Accept').click();
    expect(api.saveConsent).toHaveBeenCalledTimes(1);
    const [req, key] = api.saveConsent.calls.mostRecent().args;
    expect(req.beneficiaryRegId).toBeNull();
    expect(req.mode).toBe('SELF_READ');
    expect(req.capturedBy).toBe(4521);
    expect(key).toBe(component.draft.idempotencyKey);
    expect(dialogRef.close).toHaveBeenCalledWith(
      jasmine.objectContaining({ outcome: 'GRANTED', consentId: 'c-1', consentingParty: 'SELF', syncStatus: 'SYNCED' })
    );
  });

  it('reports a partial consent and the offline sync status', () => {
    api.saveConsent.and.returnValue(of(mockSaveResponseOffline()));
    ready();
    component.onDecisions({ ...component.draft.decisions, 'P-REM': false });
    component.accept();
    expect(dialogRef.close).toHaveBeenCalledWith(
      jasmine.objectContaining({ outcome: 'PARTIAL', syncStatus: 'NOT_SYNCED' })
    );
  });

  it('does nothing when Accept is not allowed', () => {
    component.loadNotice('hi');
    component.accept();
    expect(api.saveConsent).not.toHaveBeenCalled();
  });

  it('ignores a second Accept while saving', () => {
    const pending = new Subject<SaveConsentResponse>();
    api.saveConsent.and.returnValue(pending);
    ready();
    component.accept();
    component.accept();
    (component as any).save(component.draft);
    expect(api.saveConsent).toHaveBeenCalledTimes(1);
    expect(component.acceptEnabled).toBeFalse();
  });

  it('retries a failed save with the same request key', () => {
    api.saveConsent.and.returnValue(throwError(() => ({ kind: 'UNAVAILABLE', message: 'x' })));
    ready();
    component.accept();
    fixture.detectChanges();
    expect(component.failed).toBeTrue();
    const firstKey = api.saveConsent.calls.mostRecent().args[1];
    api.saveConsent.and.returnValue(of(mockSaveResponse()));
    component.retry();
    expect(api.saveConsent.calls.mostRecent().args[1]).toBe(firstKey);
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('alerts and reloads the notice on a stale save', () => {
    api.saveConsent.and.returnValue(throwError(() => ({ kind: 'STALE', message: 'x' })));
    ready();
    component.accept();
    expect(confirmation.alert).toHaveBeenCalledWith('Changed elsewhere', 'info');
    expect(api.getNotice).toHaveBeenCalledTimes(2);
    expect(component.draft.noticeReadComplete).toBeFalse();
  });

  it('declines after confirmation: saves all DENY and closes BLOCKED', () => {
    confirmation.confirm.and.returnValue(of(true));
    ready();
    buttonByText('Decline').click();
    expect(confirmation.confirm).toHaveBeenCalledWith('Consent', 'Cannot continue', 'Confirm decline', 'Close');
    const req = api.saveConsent.calls.mostRecent().args[0];
    expect(req.decisions.every((d) => d.decision === 'DENY')).toBeTrue();
    expect(dialogRef.close).toHaveBeenCalledWith(jasmine.objectContaining({ outcome: 'BLOCKED' }));
  });

  it('returns to the decision view when the decline is cancelled', () => {
    confirmation.confirm.and.returnValue(of(false));
    ready();
    component.decline();
    expect(api.saveConsent).not.toHaveBeenCalled();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('saves nothing when declining before a notice is loaded', () => {
    confirmation.confirm.and.returnValue(of(true));
    component.decline();
    expect(api.saveConsent).not.toHaveBeenCalled();
  });

  it('closes with NO_DECISION and no API call', () => {
    fixture.nativeElement.querySelector('button[aria-label="Close"]').click();
    expect(dialogRef.close).toHaveBeenCalledWith(jasmine.objectContaining({ outcome: 'NO_DECISION', consentId: null }));
    expect(api.saveConsent).not.toHaveBeenCalled();
  });

  it('retry without a pending action only clears the error', () => {
    component.failed = true;
    component.retry();
    expect(component.failed).toBeFalse();
  });
});
}
