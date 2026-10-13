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

// Shared synthetic test data for consent specs (both UI tracks). Never import from production code.
import { HttpErrorResponse } from '@angular/common/http';
import {
  AccessGrant,
  EvidenceResponse,
  Notice,
  NoticeLanguage,
  OtpChallenge,
  PatientConsents,
  PendingAction,
  Purpose,
  RefusalReason,
  SaveConsentResponse,
} from '../consent.models';

export function mockPurposes(): Purpose[] {
  return [
    { purposeCode: 'P-REM', name: 'SMS reminders', description: 'Visit reminders', isMandatory: false, isWithdrawable: true, validityDays: 365 },
    { purposeCode: 'P-REG', name: 'Registration', description: 'Create your record', isMandatory: true, isWithdrawable: false, validityDays: null },
    { purposeCode: 'P-SHR', name: 'Share with facilities', description: 'Referral history', isMandatory: false, isWithdrawable: true, validityDays: 365 },
    { purposeCode: 'P-TRT', name: 'Treatment', description: 'Clinical care', isMandatory: true, isWithdrawable: true, validityDays: null },
    { purposeCode: 'P-FAM', name: 'Share with family', description: 'Spouse and family', isMandatory: false, isWithdrawable: true, validityDays: 365 },
    { purposeCode: 'P-TELE', name: 'Teleconsultation', description: 'Remote doctor', isMandatory: false, isWithdrawable: true, validityDays: 365 },
  ];
}

export function mockLanguages(): NoticeLanguage[] {
  return [
    { languageCode: 'en', languageName: 'English', hasAudio: false },
    { languageCode: 'hi', languageName: 'हिन्दी', hasAudio: true },
    { languageCode: 'as', languageName: 'অসমীয়া', hasAudio: false },
    { languageCode: 'ur', languageName: 'اردو', hasAudio: false },
    { languageCode: 'ks', languageName: 'کٲشُر', hasAudio: false },
    { languageCode: 'sd', languageName: 'سنڌي', hasAudio: false },
  ];
}

export function mockNotice(lang = 'hi'): Notice {
  return {
    noticeVersionId: 12,
    languageCode: lang,
    context: 'REGISTRATION',
    body: '<p>Notice body</p><script>window.hacked = true</script>',
    textHash: 'hash-' + lang,
    audioUrl: lang === 'hi' ? 'https://example.test/n12-hi.mp3' : null,
    dataItems: 'Name, age, phone',
    retention: 'Kept for 5 years',
    recipients: 'Treating facility',
    withdrawalInfo: 'Ask staff or call 104',
    grievanceInfo: 'Contact the DPO',
    purposes: mockPurposes(),
  };
}

export function mockNoticeNoAudio(lang = 'en'): Notice {
  return { ...mockNotice(lang), audioUrl: null };
}

export function mockSaveResponse(): SaveConsentResponse {
  return {
    consentId: 'c-1',
    syncStatus: 'SYNCED',
    purposes: [{ purposeCode: 'P-REG', status: 'GRANTED', versionNo: 1 }],
  };
}

export function mockSaveResponseOffline(): SaveConsentResponse {
  return { ...mockSaveResponse(), syncStatus: 'NOT_SYNCED' };
}

export function mockConsents(): PatientConsents {
  return {
    current: [
      { purposeCode: 'P-REG', name: 'Registration', isMandatory: true, isWithdrawable: false, status: 'GRANTED', validUntil: null, versionNo: 1 },
      { purposeCode: 'P-REM', name: 'SMS reminders', isMandatory: false, isWithdrawable: true, status: 'DENIED', validUntil: '2027-10-13', versionNo: 3 },
      { purposeCode: 'P-SHR', name: 'Share with facilities', isMandatory: false, isWithdrawable: true, status: 'GRANTED', validUntil: '2027-10-13', versionNo: 2 },
    ],
    history: [
      { consentId: 'c-3', beneficiaryRegId: 42, eventType: 'UPDATE', consentingParty: 'SELF', noticeVersionId: 12, languageCode: 'hi', mode: 'SELF_READ', capturedBy: 'nurse1', capturedAt: '2026-10-12T10:00:00+05:30', facilityId: 33, serviceLine: 'MMU', deviceId: 'd-1', syncStatus: 'NOT_SYNCED', purposes: [{ purposeCode: 'P-REM', decision: 'DENY', status: 'DENIED' }] },
      { consentId: 'c-2', beneficiaryRegId: 42, eventType: 'UPDATE', consentingParty: 'SELF', noticeVersionId: 12, languageCode: 'hi', mode: 'OTP', capturedBy: 'nurse1', capturedAt: '2026-09-01T10:00:00+05:30', facilityId: 33, serviceLine: 'MMU', deviceId: 'd-1', syncStatus: 'SYNCED', purposes: [{ purposeCode: 'P-SHR', decision: 'GRANT', status: 'GRANTED' }] },
      { consentId: 'c-1', beneficiaryRegId: 42, eventType: 'NEW', consentingParty: 'SELF', noticeVersionId: 11, languageCode: 'en', mode: 'READ_ALOUD', capturedBy: 'reg1', capturedAt: '2026-01-05T10:00:00+05:30', facilityId: 33, serviceLine: 'MMU', deviceId: 'd-1', syncStatus: 'SYNCED', purposes: [{ purposeCode: 'P-REG', decision: 'GRANT', status: 'GRANTED' }] },
    ],
  };
}

export function mockPendingActions(): PendingAction[] {
  return [
    { reason: 'CONSENT_MISSING', purposeCodes: ['P-REG'], dueSince: '2026-10-01' },
    { reason: 'LEGACY', purposeCodes: ['P-REM'], dueSince: '2026-10-01' },
    { reason: 'RECONSENT_REQUIRED', purposeCodes: ['P-SHR'], dueSince: '2026-10-01' },
    { reason: 'GUARDIAN_TO_SELF', purposeCodes: ['P-REG'], dueSince: '2026-10-01' },
  ];
}

export function mockNoPending(): PendingAction[] {
  return [];
}

export function mockAccessGrants(): AccessGrant[] {
  return [
    { grantId: 'g-1', grantee: 'Dr. Test, Hub Hospital', purposes: ['P-TELE'], type: 'CONSENTED', status: 'PENDING', validUntil: '2026-10-20' },
    { grantId: 'g-2', grantee: 'Dr. Demo, District Hospital', purposes: ['P-SHR'], type: 'CONSENTED', status: 'ACTIVE', validUntil: '2026-10-30' },
  ];
}

export function mockOtpChallenge(): OtpChallenge {
  return { challengeId: 'otp-1', maskedPhone: '98******12', expiresAt: '2026-10-13T10:10:00+05:30' };
}

export function mockEvidenceResponse(id = 'e-1'): EvidenceResponse {
  return { evidenceId: id, sha256: 'abc123' };
}

export function mockSession(): { [key: string]: string } {
  return {
    userID: '4521',
    userName: 'nurse1',
    providerServiceID: '1714',
    facilityID: '33',
    servicePointID: '7',
    serviceName: 'MMU',
  };
}

export function mockOk<T>(data: T) {
  return { statusCode: 200, status: 'Success', errorMessage: 'Success', data };
}

export function mockServerError(message = 'Something failed') {
  return { statusCode: 5000, status: 'Failure', errorMessage: message, data: null };
}

export function mock403(reason: RefusalReason | string, crossFacility = false, purposeCode = 'P-SHR'): HttpErrorResponse {
  return new HttpErrorResponse({
    status: 403,
    error: { statusCode: 403, data: { reason, purposeCode, crossFacility } },
  });
}

export function mock409Stale(): HttpErrorResponse {
  return new HttpErrorResponse({ status: 409, error: { statusCode: 409, data: { reason: 'STALE_VERSION' } } });
}

export function mock422NotWithdrawable(): HttpErrorResponse {
  return new HttpErrorResponse({ status: 422, error: { statusCode: 422, data: { reason: 'NOT_WITHDRAWABLE' } } });
}
