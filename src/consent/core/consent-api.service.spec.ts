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

import { HttpErrorResponse } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { ConsentApiService, toConsentApiError } from './consent-api.service';
import { ConsentApiError, SaveConsentRequest } from './consent.models';
import {
  mockAccessGrants,
  mockConsents,
  mockEvidenceResponse,
  mockLanguages,
  mockNotice,
  mockOk,
  mockOtpChallenge,
  mockPendingActions,
  mockSaveResponse,
  mockServerError,
} from './testing/consent.mock';

describe('ConsentApiService', () => {
  const env = environment as { consentManagement?: unknown };
  let original: unknown;
  let service: ConsentApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    original = env.consentManagement;
    env.consentManagement = { enabled: true, apiBase: 'http://api/' };
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ConsentApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    env.consentManagement = original;
  });

  it('gets notice languages', () => {
    let out: unknown;
    service.getLanguages('REGISTRATION').subscribe((v) => (out = v));
    const req = http.expectOne(
      'http://api/consent/v1/notices/active/languages?context=REGISTRATION'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockOk(mockLanguages()));
    expect(out).toEqual(mockLanguages());
  });

  it('gets the active notice', () => {
    let out: unknown;
    service.getNotice('REGISTRATION', 'hi').subscribe((v) => (out = v));
    http
      .expectOne('http://api/consent/v1/notices/active?context=REGISTRATION&lang=hi')
      .flush(mockOk(mockNotice('hi')));
    expect(out).toEqual(mockNotice('hi'));
  });

  it('saves a consent with an Idempotency-Key header', () => {
    const body = { beneficiaryRegId: null } as unknown as SaveConsentRequest;
    let out: unknown;
    service.saveConsent(body, 'key-1').subscribe((v) => (out = v));
    const req = http.expectOne('http://api/consent/v1/consents');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(body);
    expect(req.request.headers.get('Idempotency-Key')).toBe('key-1');
    req.flush(mockOk(mockSaveResponse()));
    expect(out).toEqual(mockSaveResponse());
  });

  it('uploads evidence as form data with duration', () => {
    const blob = new Blob(['x']);
    service.uploadEvidence(blob, 'VOICE_CLIP', 'abc', 42, 'key-2').subscribe();
    const req = http.expectOne('http://api/consent/v1/evidence');
    const form = req.request.body as FormData;
    expect(form.get('type')).toBe('VOICE_CLIP');
    expect(form.get('sha256')).toBe('abc');
    expect(form.get('durationSec')).toBe('42');
    expect(form.get('file')).toBeTruthy();
    expect(req.request.headers.get('Idempotency-Key')).toBe('key-2');
    req.flush(mockOk(mockEvidenceResponse()));
  });

  it('uploads evidence without hash or duration', () => {
    service
      .uploadEvidence(new Blob(['x']), 'PATIENT_PHOTO', null, null, 'k')
      .subscribe();
    const form = http.expectOne('http://api/consent/v1/evidence').request
      .body as FormData;
    expect(form.get('sha256')).toBe('');
    expect(form.has('durationSec')).toBeFalse();
  });

  it('sends and verifies an OTP', () => {
    service.sendOtp({ purpose: 'GUARDIAN', phone: '9876543212' }, 'k3').subscribe();
    const send = http.expectOne('http://api/consent/v1/otp/challenges');
    expect(send.request.body).toEqual({ purpose: 'GUARDIAN', phone: '9876543212' });
    expect(send.request.headers.get('Idempotency-Key')).toBe('k3');
    send.flush(mockOk(mockOtpChallenge()));

    let verified: unknown;
    service.verifyOtp('otp-1', '123456').subscribe((v) => (verified = v));
    const verify = http.expectOne('http://api/consent/v1/otp/challenges/otp-1/verify');
    expect(verify.request.body).toEqual({ otp: '123456' });
    verify.flush(mockOk({ verified: true }));
    expect(verified).toEqual({ verified: true });
  });

  it('reads consents, pending actions and access grants', () => {
    service.getConsents(42).subscribe();
    http.expectOne('http://api/consent/v1/principals/42/consents').flush(mockOk(mockConsents()));
    service.getPendingActions(42).subscribe();
    http
      .expectOne('http://api/consent/v1/principals/42/pending-actions')
      .flush(mockOk(mockPendingActions()));
    service.getAccessGrants(42).subscribe();
    http
      .expectOne('http://api/consent/v1/principals/42/access-grants?status=ACTIVE,PENDING')
      .flush(mockOk(mockAccessGrants()));
  });

  it('changes a preference and withdraws with keys', () => {
    const change = { purposeCodes: ['P-REM'], decision: 'GRANT' as const, versions: { 'P-REM': 3 } };
    service.changePreference(42, change, 'k4').subscribe();
    const c = http.expectOne('http://api/consent/v1/principals/42/preferences');
    expect(c.request.body).toEqual(change);
    expect(c.request.headers.get('Idempotency-Key')).toBe('k4');
    c.flush(mockOk(mockConsents()));

    service.withdraw(42, { purposeCodes: 'ALL', versions: {} }, 'k5').subscribe();
    const w = http.expectOne('http://api/consent/v1/principals/42/withdrawals');
    expect(w.request.body).toEqual({ purposeCodes: 'ALL', versions: {} });
    expect(w.request.headers.get('Idempotency-Key')).toBe('k5');
    w.flush(mockOk(mockConsents()));
  });

  it('approves and revokes access grants', () => {
    service.approveAccess('g-1', 'otp-1', 'k6').subscribe();
    const a = http.expectOne('http://api/consent/v1/access-grants/g-1/approve');
    expect(a.request.body).toEqual({ otpChallengeId: 'otp-1' });
    expect(a.request.headers.get('Idempotency-Key')).toBe('k6');
    a.flush(mockOk(mockAccessGrants()[0]));

    service.revokeAccess('g-2', 'k7').subscribe();
    const r = http.expectOne('http://api/consent/v1/access-grants/g-2/revoke');
    expect(r.request.body).toEqual({});
    expect(r.request.headers.get('Idempotency-Key')).toBe('k7');
    r.flush(mockOk(mockAccessGrants()[1]));
  });

  it('maps a non-200 envelope to FAILED with the server message', () => {
    let err: ConsentApiError | undefined;
    service.verifyOtp('otp-1', '000000').subscribe({ error: (e) => (err = e) });
    http
      .expectOne('http://api/consent/v1/otp/challenges/otp-1/verify')
      .flush(mockServerError('Invalid OTP'));
    expect(err).toEqual({ kind: 'FAILED', message: 'Invalid OTP' });
  });

  it('maps an empty envelope to FAILED', () => {
    let err: ConsentApiError | undefined;
    service.getConsents(42).subscribe({ error: (e) => (err = e) });
    http.expectOne('http://api/consent/v1/principals/42/consents').flush(null);
    expect(err).toEqual({ kind: 'FAILED', message: 'Request failed' });
  });

  it('maps HTTP errors through toConsentApiError', () => {
    let err: ConsentApiError | undefined;
    service.getPendingActions(42).subscribe({ error: (e) => (err = e) });
    http
      .expectOne('http://api/consent/v1/principals/42/pending-actions')
      .flush({ statusCode: 409, data: { reason: 'STALE_VERSION' } }, { status: 409, statusText: 'Conflict' });
    expect(err?.kind).toBe('STALE');
  });

  describe('toConsentApiError', () => {
    const httpErr = (status: number, error: unknown) =>
      new HttpErrorResponse({ status, error });

    it('passes through an existing ConsentApiError', () => {
      const e: ConsentApiError = { kind: 'STALE', message: 'x' };
      expect(toConsentApiError(e)).toBe(e);
    });

    it('maps 409 STALE_VERSION and 422 NOT_WITHDRAWABLE', () => {
      expect(toConsentApiError(httpErr(409, { data: { reason: 'STALE_VERSION' } })).kind).toBe('STALE');
      expect(toConsentApiError(httpErr(422, { data: { reason: 'NOT_WITHDRAWABLE' } })).kind).toBe(
        'NOT_WITHDRAWABLE'
      );
    });

    it('maps network and server errors to UNAVAILABLE', () => {
      expect(toConsentApiError(httpErr(0, null)).kind).toBe('UNAVAILABLE');
      expect(toConsentApiError(httpErr(503, null)).kind).toBe('UNAVAILABLE');
    });

    it('maps other HTTP errors to FAILED with the best message', () => {
      expect(toConsentApiError(httpErr(409, { data: {} })).kind).toBe('FAILED');
      expect(toConsentApiError(httpErr(400, { errorMessage: 'Bad input' })).message).toBe(
        'Bad input'
      );
      expect(toConsentApiError(httpErr(400, null)).message).toContain('400');
    });

    it('maps unknown values to FAILED', () => {
      expect(toConsentApiError('boom')).toEqual({ kind: 'FAILED', message: 'Request failed' });
      expect(toConsentApiError(null)).toEqual({ kind: 'FAILED', message: 'Request failed' });
    });
  });
});
