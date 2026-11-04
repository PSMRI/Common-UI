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
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CameraService } from 'src/app/app-modules/core/services';
import { of, Subject, throwError } from 'rxjs';
import { Notice } from '../consent.models';
import { createInOnPushHost } from './on-push-host';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { ConsentApiService } from '../consent-api.service';
import { ConsentContextService } from '../consent-context.service';
import { ConsentCaptureContext, SaveConsentResponse } from '../consent.models';
import {
  mockEvidenceResponse,
  mockLanguages,
  mockNotice,
  mockSaveResponse,
  mockSaveResponseOffline,
} from './consent.mock';
import { InjectionToken, Type } from '@angular/core';
import { ConsentDialogBase } from '../ui/consent-dialog.base';
import { DEFAULT_CONTEXT_CONFIG, defaultResolvedConfig } from '../consent-config';
import { ConsentConfigUnavailable, ResolvedConsentConfig } from '../consent-config.models';
import { ConsentConfigService } from '../consent-config.service';
import { mockResolvedConfig } from './consent-config.mock';

/** The dialog data token and dialog ref class of a track. */
export interface DialogTokens {
  data: InjectionToken<unknown>;
  ref: Type<unknown>;
}

/** Behaviour suite run by each track's consent dialog spec. */
/** onPushContainer: the track's dialog container is OnPush (Zard), so async updates must call markForCheck. */
export function consentDialogSuite(
  ConsentDialogComponent: Type<ConsentDialogBase>,
  track: string,
  tokens: DialogTokens,
  options: { onPushContainer?: boolean } = {}
): void {
describe(`ConsentDialogComponent (${track})`, () => {
  let fixture: ComponentFixture<ConsentDialogBase>;
  let component: ConsentDialogBase;
  let api: jasmine.SpyObj<ConsentApiService>;
  let dialogRef: jasmine.SpyObj<{ close: (r?: unknown) => void }>;
  let confirmation: jasmine.SpyObj<ConfirmationService>;
  let configService: jasmine.SpyObj<ConsentConfigService>;
  const text = {
    configLoadFailed: 'Settings failed',
    configOtpNoPhone: 'OTP needs a phone',
    title: 'Consent',
    cannotContinue: 'Cannot continue',
    confirmDecline: 'Confirm decline',
    close: 'Close',
    staleReload: 'Changed elsewhere',
    serviceUnavailable: 'Unavailable',
    retry: 'Retry',
    accept: 'Accept',
    decline: 'Decline',
    defaultDeclaration: 'Default patient declaration',
    defaultRepresentativeDeclaration: 'Default representative declaration',
    defaultGrievance: 'Call 104',
    smsSent: 'Sent to {phone}',
    smsQueued: 'Queued to {phone}',
    smsFailed: 'SMS failed',
    smsNoPhone: 'No phone',
    done: 'Done',
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
    // OTP proof has no file to upload, so the save stays synchronous in these tests.
    component.onMode('OTP');
    component.onProof({ otpVerified: true, otpChallengeId: 'otp-1' });
    fixture.detectChanges();
  }

  function buttonByText(label: string): HTMLButtonElement {
    return Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(
      (b) => b.textContent!.trim() === label
    )!;
  }

  beforeEach(() => {
    api = jasmine.createSpyObj<ConsentApiService>('ConsentApiService', ['getLanguages', 'getNotice', 'saveConsent', 'uploadEvidence']);
    api.getLanguages.and.returnValue(of(mockLanguages()));
    api.getNotice.and.callFake((_c, lang) => of(mockNotice(lang)));
    api.saveConsent.and.returnValue(of(mockSaveResponse()));
    dialogRef = jasmine.createSpyObj('DialogRef', ['close']);
    confirmation = jasmine.createSpyObj<ConfirmationService>('ConfirmationService', ['confirm', 'alert']);
    configService = jasmine.createSpyObj<ConsentConfigService>('ConsentConfigService', ['load']);
    configService.load.and.returnValue(of(defaultResolvedConfig('REGISTRATION')));
    const context = jasmine.createSpyObj<ConsentContextService>('ConsentContextService', ['context']);
    context.context.and.returnValue(ctx);
    TestBed.configureTestingModule({
      imports: [ConsentDialogComponent],
      providers: [
        // The OTP and Guardian / Representative proof render Material form fields.
        provideNoopAnimations(),
        { provide: tokens.data, useValue: { context: 'REGISTRATION', beneficiaryRegId: null } },
        { provide: tokens.ref, useValue: dialogRef },
        { provide: ConsentApiService, useValue: api },
        { provide: ConsentContextService, useValue: context },
        { provide: ConsentConfigService, useValue: configService },
        { provide: ConfirmationService, useValue: confirmation },
        { provide: CameraService, useValue: jasmine.createSpyObj('CameraService', ['capture']) },
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
    expect(api.getNotice).toHaveBeenCalledWith('REGISTRATION', 'hi', null);
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

  it('names the first thing still blocking Accept', () => {
    component.loadNotice('hi');
    fixture.detectChanges();
    expect(component.pendingKey).toBe('pendingReadNotice');
    component.onReadComplete();
    expect(component.pendingKey).toBe('pendingRequiredPurposes');
    const decisions: { [k: string]: boolean } = {};
    mockNotice('hi').purposes.forEach((p) => (decisions[p.purposeCode] = true));
    component.onDecisions(decisions);
    component.onMode(null);
    expect(component.pendingKey).toBe('pendingMode');
    component.onMode('WITNESSED');
    component.onProof({ witnessName: 'Asha' });
    expect(component.pendingKey).toBe('pendingProof');
    component.onProof({ witnessName: 'Asha', witnessRelationship: 'Sister' });
    expect(component.pendingKey).toBe('pendingDeclaration');
    component.onProof({ witnessName: 'Asha', witnessRelationship: 'Sister', declarationAgreed: true });
    expect(component.pendingKey).toBeNull();
    expect(component.acceptEnabled).toBeTrue();
    component.onMode('SELF_READ');
    component.onProof({});
    expect(component.pendingKey).toBe('pendingDeclaration');
    component.onProof({ declarationAgreed: true });
    expect(component.pendingKey).toBe('pendingRecording');
    component.onMode('READ_ALOUD');
    component.onProof({});
    expect(component.pendingKey).toBe('pendingPatientAnswer');
    component.onProof({ declarationAgreed: true });
    expect(component.pendingKey).toBe('pendingRecording');
    component.onMode('OTP');
    component.onProof({});
    expect(component.pendingKey).toBe('pendingProof');
  });

  it('accepts: saves once with the draft key and closes with the outcome', () => {
    ready();
    expect(component.acceptEnabled).toBeTrue();
    buttonByText('Accept').click();
    expect(api.saveConsent).toHaveBeenCalledTimes(1);
    const [req, key] = api.saveConsent.calls.mostRecent().args;
    expect(req.beneficiaryRegId).toBeNull();
    expect(req.eventType).toBe('NEW');
    expect(req.mode).toBe('OTP');
    expect(req.capturedBy).toBe(4521);
    expect(key).toBe(component.draft.idempotencyKey);
    expect(req.declaration).toEqual({
      text: 'Default patient declaration',
      languageCode: 'hi',
      noticeVersionId: 12,
      wording: 'PATIENT',
    });
    expect(req.notify).toBeNull();
    // Feature 003: the confirmation stays open until Done.
    fixture.detectChanges();
    expect(component.step).toBe('DONE');
    expect(dialogRef.close).not.toHaveBeenCalled();
    buttonByText('Done').click();
    expect(dialogRef.close).toHaveBeenCalledWith(
      jasmine.objectContaining({ outcome: 'GRANTED', consentId: 'c-1', consentingParty: 'SELF', syncStatus: 'SYNCED' })
    );
  });

  it('reports a partial consent and the offline sync status', () => {
    api.saveConsent.and.returnValue(of(mockSaveResponseOffline()));
    ready();
    component.onDecisions({ ...component.draft.decisions, 'P-REM': false });
    component.accept();
    component.done();
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
    expect(component.step).toBe('DONE');
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
    expect(confirmation.confirm).toHaveBeenCalledWith('warn', 'Cannot continue', 'Confirm decline', 'Close');
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

  describe('evidence', () => {
    const voice = new Blob(['voice']);
    const face = new Blob(['face']);
    const form = new Blob(['form']);

    async function settle(): Promise<void> {
      for (let i = 0; i < 50 && api.saveConsent.calls.count() === 0 && !component.failed; i++) {
        await new Promise((r) => setTimeout(r, 10));
      }
    }

    function withProof(mode: 'VOICE_CLIP' | 'SIGNATURE_PHOTO', proof: object): void {
      ready();
      component.onMode(mode);
      component.onProof(proof);
    }

    beforeEach(() => {
      let n = 0;
      api.uploadEvidence.and.callFake(() => of(mockEvidenceResponse('e-' + ++n)));
    });

    it('uploads a voice clip first, then saves with its evidence id', async () => {
      withProof('VOICE_CLIP', { voiceClip: voice, voiceDurationSec: 45 });
      component.accept();
      await settle();
      const [file, type, hash, duration, key] = api.uploadEvidence.calls.mostRecent().args;
      expect(file).toBe(voice);
      expect(type).toBe('VOICE_CLIP');
      expect(hash === null || /^[0-9a-f]{64}$/.test(hash as string)).toBeTrue();
      expect(duration).toBe(45);
      expect(key).not.toBe(component.draft.idempotencyKey);
      expect(api.saveConsent.calls.mostRecent().args[0].evidenceIds).toEqual(['e-1']);
    });

    it('uploads only the signed form photo for signature/thumb, never a face photo', async () => {
      withProof('SIGNATURE_PHOTO', { patientPhoto: face, signedFormPhoto: form });
      component.accept();
      await settle();
      expect(api.uploadEvidence.calls.allArgs().map((a) => a[1])).toEqual(['SIGNED_FORM_PHOTO']);
      expect(api.uploadEvidence.calls.mostRecent().args[0]).toBe(form);
      expect(api.saveConsent.calls.mostRecent().args[0].evidenceIds).toEqual(['e-1']);
    });

    it('stops on an upload failure and retries the file with the same key', async () => {
      let calls = 0;
      api.uploadEvidence.and.callFake(() => {
        calls++;
        return calls === 1 ? throwError(() => ({ kind: 'UNAVAILABLE', message: 'x' })) : of(mockEvidenceResponse('e-form'));
      });
      withProof('SIGNATURE_PHOTO', { signedFormPhoto: form });
      component.accept();
      await settle();
      expect(component.failed).toBeTrue();
      expect(api.saveConsent).not.toHaveBeenCalled();
      const failedKey = api.uploadEvidence.calls.argsFor(0)[4];
      component.retry();
      await settle();
      expect(api.uploadEvidence.calls.count()).toBe(2);
      expect(api.uploadEvidence.calls.argsFor(1)[0]).toBe(form);
      expect(api.uploadEvidence.calls.argsFor(1)[4]).toBe(failedKey);
      expect(api.saveConsent.calls.mostRecent().args[0].evidenceIds).toEqual(['e-form']);
    });

    it('uploads nothing for a decline or for modes without files', async () => {
      confirmation.confirm.and.returnValue(of(true));
      withProof('VOICE_CLIP', { voiceClip: voice, voiceDurationSec: 45 });
      component.decline();
      await settle();
      expect(api.uploadEvidence).not.toHaveBeenCalled();
      expect(api.saveConsent.calls.mostRecent().args[0].evidenceIds).toEqual([]);
    });

    it('sends no evidence when a photo is missing', async () => {
      withProof('SIGNATURE_PHOTO', { patientPhoto: face });
      (component as any).save(component.draft);
      await settle();
      expect(api.uploadEvidence).not.toHaveBeenCalled();
      withProof('VOICE_CLIP', { voiceDurationSec: 45 });
      expect((component as any).evidenceItems(component.draft)).toEqual([]);
      withProof('VOICE_CLIP', { voiceClip: voice });
      expect((component as any).evidenceItems(component.draft)[0].durationSec).toBeNull();
    });

    it('uploads the Read aloud agreement recording (feature 003)', async () => {
      ready();
      component.onMode('READ_ALOUD');
      component.onProof({ declarationAgreed: true, voiceClip: voice, voiceDurationSec: 100 });
      expect(component.acceptEnabled).toBeTrue();
      component.accept();
      await settle();
      expect(api.uploadEvidence.calls.mostRecent().args[1]).toBe('VOICE_CLIP');
      expect(api.saveConsent.calls.mostRecent().args[0].evidenceIds).toEqual(['e-1']);
    });

    it('uploads the recording on "Upload to server" and reuses it on Accept', async () => {
      ready();
      expect(component.recordingUpload).toBe('IDLE');
      component.uploadRecording();
      expect(api.uploadEvidence).not.toHaveBeenCalled();
      component.onMode('SELF_READ');
      component.onProof({ declarationAgreed: true, voiceClip: voice, voiceDurationSec: 6 });
      component.uploadRecording();
      expect(component.recordingUpload).toBe('UPLOADING');
      component.uploadRecording();
      for (let i = 0; i < 50 && component.recordingUpload !== 'DONE'; i++) {
        await new Promise((r) => setTimeout(r, 10));
      }
      expect(component.recordingUpload).toBe('DONE');
      expect(api.uploadEvidence).toHaveBeenCalledTimes(1);
      expect(api.uploadEvidence.calls.mostRecent().args[3]).toBe(6);
      component.uploadRecording();
      component.accept();
      await settle();
      expect(api.uploadEvidence).toHaveBeenCalledTimes(1);
      expect(api.saveConsent.calls.mostRecent().args[0].evidenceIds).toEqual(['e-1']);
    });

    it('shows a failed upload and lets staff try again', async () => {
      api.uploadEvidence.and.returnValue(throwError(() => ({ kind: 'UNAVAILABLE', message: 'x' })));
      ready();
      component.onMode('READ_ALOUD');
      component.onProof({ declarationAgreed: true, voiceClip: voice });
      component.uploadRecording();
      for (let i = 0; i < 50 && component.recordingUpload !== 'FAILED'; i++) {
        await new Promise((r) => setTimeout(r, 10));
      }
      expect(component.recordingUpload).toBe('FAILED');
      expect(api.uploadEvidence.calls.mostRecent().args[3]).toBeNull();
      api.uploadEvidence.and.returnValue(of(mockEvidenceResponse('e-7')));
      component.uploadRecording();
      expect(component.recordingUpload).toBe('UPLOADING');
    });

    it('uploads the Self-read agreement recording', async () => {
      ready();
      component.onMode('SELF_READ');
      component.onProof({ declarationAgreed: true, voiceClip: voice, voiceDurationSec: 6 });
      expect(component.acceptEnabled).toBeTrue();
      component.accept();
      await settle();
      expect(api.uploadEvidence.calls.mostRecent().args[0]).toBe(voice);
      expect(api.saveConsent.calls.mostRecent().args[0].mode).toBe('SELF_READ');
      expect(api.saveConsent.calls.mostRecent().args[0].evidenceIds).toEqual(['e-1']);
    });

    it('a No to the read-aloud declaration asks to decline', () => {
      confirmation.confirm.and.returnValue(of(false));
      ready();
      component.onMode('READ_ALOUD');
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('.consent-declaration-no') as HTMLButtonElement).click();
      expect(confirmation.confirm).toHaveBeenCalledWith('warn', 'Cannot continue', 'Confirm decline', 'Close');
    });

    it('drops captured proof when the dialog is destroyed', () => {
      withProof('VOICE_CLIP', { voiceClip: voice, voiceDurationSec: 45 });
      fixture.destroy();
      expect(component.draft.proof).toEqual({});
      expect(component.draft.notice).toBeNull();
    });
  });

  describe('declaration and confirmation (feature 003)', () => {
    function accept(response: SaveConsentResponse = mockSaveResponse()): void {
      api.saveConsent.and.returnValue(of(response));
      ready();
      component.accept();
      fixture.detectChanges();
    }

    afterEach(() => {
      delete component.options.patientPhone;
    });

    it('shows the declaration for the mode: project wording, representative wording, defaults', () => {
      expect(component.declaration).toBe('');
      api.getNotice.and.returnValue(
        of({ ...mockNotice('hi'), declaration: 'Project patient', representativeDeclaration: 'Project rep' })
      );
      ready();
      expect(component.declaration).toBe('Project patient');
      expect(fixture.nativeElement.querySelector('.consent-declaration-text').textContent).toContain('Project patient');
      component.onMode('WITNESSED');
      expect(component.declaration).toBe('Project rep');
      api.getNotice.and.returnValue(of(mockNotice('hi')));
      component.loadNotice('hi');
      expect(component.declaration).toBe('Default representative declaration');
    });

    it('saves Guardian / Representative consent as the guardian with the representative wording', () => {
      ready();
      component.onMode('WITNESSED');
      component.onProof({ witnessName: 'Asha', witnessRelationship: 'Mother', declarationAgreed: true });
      component.accept();
      const req = api.saveConsent.calls.mostRecent().args[0];
      expect(req.consentingParty).toBe('GUARDIAN');
      expect(req.declaration!.wording).toBe('REPRESENTATIVE');
      expect(req.declaration!.text).toBe('Default representative declaration');
    });

    it('shows the Consent ID, structured grievance contact and SMS sent', () => {
      component.options.patientPhone = '9876543212';
      api.getNotice.and.returnValue(
        of({
          ...mockNotice('hi'),
          grievance: { officerName: 'Officer', phone: '1800', email: 'g@x.org', address: 'Addr', officeHours: '10-5' },
        })
      );
      accept({ ...mockSaveResponse(), notification: { status: 'SENT', maskedPhone: '98******12' } });
      expect(api.saveConsent.calls.mostRecent().args[0].notify).toEqual({ channel: 'SMS', phone: '9876543212' });
      const view = fixture.nativeElement.querySelector('.consent-done') as HTMLElement;
      expect(view.textContent).toContain('c-1');
      ['Officer', '1800', 'g@x.org', 'Addr', '10-5'].forEach((t) => expect(view.textContent).toContain(t));
      expect(component.smsMessage).toBe('Sent to 98******12');
      expect(view.querySelector('.consent-done-grievance-text')).toBeNull();
    });

    it('hides empty grievance fields', () => {
      api.getNotice.and.returnValue(
        of({ ...mockNotice('hi'), grievance: { officerName: '', phone: '1800', email: null, address: null, officeHours: null } })
      );
      accept();
      expect(fixture.nativeElement.querySelectorAll('.consent-done-grievance dt').length).toBe(1);
    });

    it('falls back to the notice grievance text, then the default', () => {
      accept();
      expect(fixture.nativeElement.querySelector('.consent-done-grievance-text').textContent).toContain('Contact the DPO');
      expect(component.smsMessage).toBe('No phone');
      expect(component.confirmation!.grievanceText).toBe('Contact the DPO');
    });

    it('uses the default grievance text when the notice has none', () => {
      api.getNotice.and.returnValue(of({ ...mockNotice('hi'), grievanceInfo: '' }));
      accept();
      expect(component.confirmation!.grievanceText).toBe('Call 104');
    });

    it('notes an offline save and a queued SMS', () => {
      component.options.patientPhone = '9876543212';
      accept({ ...mockSaveResponseOffline(), notification: { status: 'QUEUED', maskedPhone: null } });
      expect(fixture.nativeElement.querySelector('.consent-done-offline')).not.toBeNull();
      expect(component.smsMessage).toBe('Queued to 98******12');
    });

    it('reports a failed or missing SMS status', () => {
      component.options.patientPhone = '9876543212';
      accept({ ...mockSaveResponse(), notification: { status: 'FAILED', maskedPhone: '98******12' } });
      expect(component.smsMessage).toBe('SMS failed');
      component.confirmation = { ...component.confirmation!, notification: null };
      expect(component.smsMessage).toBe('SMS failed');
      component.confirmation = null;
      expect(component.smsMessage).toBe('');
    });

    it('the close button on the confirmation closes with the saved result', () => {
      accept();
      fixture.nativeElement.querySelector('button[aria-label="Close"]').click();
      expect(dialogRef.close).toHaveBeenCalledWith(jasmine.objectContaining({ outcome: 'GRANTED', consentId: 'c-1' }));
    });

    it('done does nothing before a consent is saved', () => {
      component.done();
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('closes at once when nothing was granted', () => {
      const notice = mockNotice('hi');
      api.getNotice.and.returnValue(of({ ...notice, purposes: notice.purposes.map((p) => ({ ...p, isMandatory: false })) }));
      ready();
      const none: { [k: string]: boolean } = {};
      Object.keys(component.draft.decisions).forEach((k) => (none[k] = false));
      (component as any).save({ ...component.draft, decisions: none });
      expect(component.step).not.toBe('DONE');
      expect(dialogRef.close).toHaveBeenCalled();
    });

    it('shows the representative-free SMS line without a text set', () => {
      accept();
      component.currentLanguageSet = {};
      expect(component.smsMessage).toBe('');
      expect(component.declaration).toBe('');
    });
  });

  (options.onPushContainer ? it : xit)('shows a notice that arrives later inside an OnPush dialog container', () => {
    const later = new Subject<Notice>();
    api.getNotice.and.returnValue(later);
    const { host, ref } = createInOnPushHost(ConsentDialogComponent);
    host.detectChanges();
    host.detectChanges();
    expect(host.nativeElement.querySelector('app-consent-language-step')).not.toBeNull();
    ref.instance.loadNotice('hi');
    later.next(mockNotice('hi'));
    host.detectChanges();
    expect(host.nativeElement.querySelector('app-consent-notice-step')).not.toBeNull();
  });
  describe('project configuration (feature 002)', () => {
    function useConfig(config: ResolvedConsentConfig, patientPhone: string | null = '9876543212'): void {
      component.options.config = config;
      component.options.patientPhone = patientPhone;
      component.resolveConfig();
      fixture.detectChanges();
    }

    afterEach(() => {
      delete component.options.config;
      delete component.options.patientPhone;
    });

    it('loads the configuration once for the dialog context', () => {
      expect(configService.load).toHaveBeenCalledOnceWith('REGISTRATION');
      expect(component.config?.source).toBe('DEFAULT');
      expect(component.modes.length).toBe(5);
    });

    it("uses the caller's configuration without loading it again", () => {
      useConfig(mockResolvedConfig('full'));
      expect(configService.load).toHaveBeenCalledTimes(1);
      expect(component.config?.version).toBe(4);
      expect(component.modes.map((m) => m.mode)).toEqual(['OTP', 'WITNESSED']);
    });

    it("loads the project's own notice (feature 003)", () => {
      useConfig(mockResolvedConfig('full'));
      component.loadNotice('hi');
      expect(api.getNotice).toHaveBeenCalledWith('REGISTRATION', 'hi', 12);
    });

    it('pre-ticks the default mode when the notice loads', () => {
      useConfig(mockResolvedConfig('full'));
      component.loadNotice('hi');
      expect(component.draft.mode).toBe('OTP');
    });

    it("keeps the registrar's mode when the language changes", () => {
      useConfig(mockResolvedConfig('full'));
      component.loadNotice('hi');
      component.onMode('WITNESSED');
      component.loadNotice('en');
      expect(component.draft.mode).toBe('WITNESSED');
    });

    it('uses the only allowed mode when no default is set', () => {
      const single = mockResolvedConfig('single');
      useConfig({ ...single, config: { ...single.config, defaultMode: null } });
      component.loadNotice('hi');
      expect(component.draft.mode).toBe('WITNESSED');
      expect(fixture.nativeElement.querySelector('.consent-modes')).toBeNull();
    });

    it('ignores a default mode that is not allowed', () => {
      const full = mockResolvedConfig('full');
      useConfig({ ...full, config: { ...full.config, defaultMode: 'VOICE_CLIP' } });
      component.loadNotice('hi');
      expect(component.draft.mode).toBeNull();
    });

    it('pre-ticks nothing with the platform default', () => {
      component.loadNotice('hi');
      expect(component.draft.mode).toBeNull();
    });

    it('blocks Accept when OTP is the only mode and there is no phone', () => {
      const full = mockResolvedConfig('full');
      useConfig({ ...full, config: { ...full.config, modes: [{ mode: 'OTP', rank: 1, settings: {} }] } }, null);
      expect(component.otpNoPhone).toBeTrue();
      expect(fixture.nativeElement.textContent).toContain('OTP needs a phone');
      ready();
      component.onProof({ otpVerified: true, otpChallengeId: 'c-1' });
      component.onMode('OTP');
      expect(component.acceptEnabled).toBeFalse();
      component.options.patientPhone = '9876543212';
      expect(component.otpNoPhone).toBeFalse();
      expect(component.acceptEnabled).toBeTrue();
    });

    it('shows a load error with Retry and no language step when nothing can be loaded', () => {
      configService.load.and.returnValue(throwError(() => new ConsentConfigUnavailable()));
      const failed = TestBed.createComponent(ConsentDialogComponent);
      failed.detectChanges();
      const dialog = failed.componentInstance;
      expect(dialog.configFailed).toBeTrue();
      expect(dialog.config).toBeNull();
      expect(dialog.contextConfig).toBe(DEFAULT_CONTEXT_CONFIG);
      expect(dialog.acceptEnabled).toBeFalse();
      expect(failed.nativeElement.textContent).toContain('Settings failed');
      expect(failed.nativeElement.querySelector('app-consent-language-step')).toBeNull();
      configService.load.and.returnValue(of(mockResolvedConfig('full')));
      const retry = Array.from(failed.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(
        (b) => b.textContent!.trim() === 'Retry'
      )!;
      retry.click();
      failed.detectChanges();
      expect(dialog.configFailed).toBeFalse();
      expect(dialog.config?.version).toBe(4);
      expect(failed.nativeElement.querySelector('app-consent-language-step')).not.toBeNull();
    });
  });
});
}
