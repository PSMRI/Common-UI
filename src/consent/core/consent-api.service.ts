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

import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CONSENT_PATHS } from './consent-api.paths';
import { consentApiBase } from './consent-feature';
import {
  AccessGrant,
  ChangePreferenceRequest,
  ConsentApiError,
  ConsentContextType,
  EvidenceResponse,
  EvidenceType,
  Notice,
  NoticeLanguage,
  OtpChallenge,
  OtpSendRequest,
  OtpVerifyResponse,
  OutputResponse,
  PatientConsents,
  PendingAction,
  RequestAccessRequest,
  SaveConsentRequest,
  SaveConsentResponse,
  WithdrawRequest,
} from './consent.models';

/** Maps any HTTP or envelope failure to a ConsentApiError the screens can act on. */
export function toConsentApiError(err: unknown): ConsentApiError {
  if (err && typeof err === 'object' && 'kind' in err) {
    return err as ConsentApiError;
  }
  if (err instanceof HttpErrorResponse) {
    // Consent-API sends { error: { code } }; the AMRIT envelope sends { data: { reason } }.
    const reason = err.error?.error?.code || err.error?.data?.reason;
    if (err.status === 409 && reason === 'STALE_VERSION') {
      return { kind: 'STALE', message: 'STALE_VERSION' };
    }
    // Consent-API names it PURPOSE_NOT_WITHDRAWABLE; NOT_WITHDRAWABLE is the older name.
    if (
      err.status === 422 &&
      (reason === 'PURPOSE_NOT_WITHDRAWABLE' || reason === 'NOT_WITHDRAWABLE')
    ) {
      return { kind: 'NOT_WITHDRAWABLE', message: 'NOT_WITHDRAWABLE' };
    }
    // e.g. no notice published for that context and language.
    if (err.status === 404) {
      return { kind: 'NOT_FOUND', message: reason || 'NOT_FOUND' };
    }
    if (err.status === 0 || err.status >= 500) {
      return { kind: 'UNAVAILABLE', message: err.message };
    }
    // The server's reason code (OTP_INVALID, RATE_LIMITED, ...) when it sends one.
    return {
      kind: 'FAILED',
      message: reason || err.error?.errorMessage || err.error?.message || err.message,
    };
  }
  return { kind: 'FAILED', message: 'Request failed' };
}

/** Most beneficiary ids one pending-actions batch call takes. */
export const PENDING_BATCH_MAX = 100;

/** The only client for Consent-API calls made by Common-UI screens (FR-030). */
@Injectable({ providedIn: 'root' })
export class ConsentApiService {
  constructor(private http: HttpClient) {}

  /** projectId: the project's own notice languages; without it, the central notice's. */
  getLanguages(
    context: ConsentContextType,
    projectId?: number | null
  ): Observable<NoticeLanguage[]> {
    return this.unwrap(
      this.http.get<OutputResponse<NoticeLanguage[]>>(
        this.url(CONSENT_PATHS.noticeLanguages(context, projectId))
      )
    );
  }

  /** projectId: the project's published notice, or the central one when it has none. */
  getNotice(
    context: ConsentContextType,
    lang: string,
    projectId?: number | null
  ): Observable<Notice> {
    return this.unwrap(
      this.http.get<OutputResponse<Notice>>(
        this.url(CONSENT_PATHS.activeNotice(context, lang, projectId))
      )
    );
  }

  saveConsent(
    req: SaveConsentRequest,
    idempotencyKey: string
  ): Observable<SaveConsentResponse> {
    return this.unwrap(
      this.http.post<OutputResponse<SaveConsentResponse>>(
        this.url(CONSENT_PATHS.consents),
        req,
        { headers: this.keyHeader(idempotencyKey) }
      )
    );
  }

  uploadEvidence(
    file: Blob,
    type: EvidenceType,
    sha256: string | null,
    durationSec: number | null,
    idempotencyKey: string
  ): Observable<EvidenceResponse> {
    const form = new FormData();
    form.append('file', file);
    form.append('type', type);
    form.append('sha256', sha256 || '');
    if (durationSec !== null) {
      form.append('durationSec', String(durationSec));
    }
    return this.unwrap(
      this.http.post<OutputResponse<EvidenceResponse>>(
        this.url(CONSENT_PATHS.evidence),
        form,
        { headers: this.keyHeader(idempotencyKey) }
      )
    );
  }

  /** API 16: the stored recording or photo, for playback during an audit or grievance. */
  getEvidenceFile(evidenceId: string): Observable<Blob> {
    return this.http
      .get(this.url(CONSENT_PATHS.evidenceFile(evidenceId)), { responseType: 'blob' })
      .pipe(catchError((err) => throwError(() => toConsentApiError(err))));
  }

  sendOtp(req: OtpSendRequest, idempotencyKey: string): Observable<OtpChallenge> {
    return this.unwrap(
      this.http.post<OutputResponse<OtpChallenge>>(
        this.url(CONSENT_PATHS.otpChallenges),
        req,
        { headers: this.keyHeader(idempotencyKey) }
      )
    );
  }

  verifyOtp(challengeId: string, otp: string): Observable<OtpVerifyResponse> {
    return this.unwrap(
      this.http.post<OutputResponse<OtpVerifyResponse>>(
        this.url(CONSENT_PATHS.otpVerify(challengeId)),
        { otp }
      )
    );
  }

  getConsents(benRegId: number): Observable<PatientConsents> {
    return this.unwrap(
      this.http.get<OutputResponse<PatientConsents>>(
        this.url(CONSENT_PATHS.principalConsents(benRegId))
      )
    );
  }

  /** context: REVISIT for a returning patient; the server defaults to REGISTRATION. */
  getPendingActions(
    benRegId: number,
    context?: ConsentContextType
  ): Observable<PendingAction[]> {
    return this.unwrap(
      this.http.get<OutputResponse<PendingAction[]>>(
        this.url(CONSENT_PATHS.pendingActions(benRegId, context))
      )
    );
  }

  /**
   * Pending actions of many patients, keyed by beneficiaryRegId. The API takes at most
   * PENDING_BATCH_MAX ids, so longer lists go in several calls and the results are merged.
   */
  getPendingActionsBatch(
    benRegIds: number[]
  ): Observable<{ [benRegId: string]: PendingAction[] }> {
    if (benRegIds.length === 0) {
      return of({});
    }
    const calls: Observable<{ [benRegId: string]: PendingAction[] }>[] = [];
    for (let i = 0; i < benRegIds.length; i += PENDING_BATCH_MAX) {
      calls.push(
        this.unwrap(
          this.http.post<OutputResponse<{ [benRegId: string]: PendingAction[] }>>(
            this.url(CONSENT_PATHS.pendingActionsBatch),
            { beneficiaryRegIds: benRegIds.slice(i, i + PENDING_BATCH_MAX) }
          )
        )
      );
    }
    return forkJoin(calls).pipe(map((parts) => Object.assign({}, ...parts)));
  }

  changePreference(
    benRegId: number,
    req: ChangePreferenceRequest,
    idempotencyKey: string
  ): Observable<PatientConsents> {
    return this.unwrap(
      this.http.post<OutputResponse<PatientConsents>>(
        this.url(CONSENT_PATHS.preferences(benRegId)),
        req,
        { headers: this.keyHeader(idempotencyKey) }
      )
    );
  }

  withdraw(
    benRegId: number,
    req: WithdrawRequest,
    idempotencyKey: string
  ): Observable<PatientConsents> {
    return this.unwrap(
      this.http.post<OutputResponse<PatientConsents>>(
        this.url(CONSENT_PATHS.withdrawals(benRegId)),
        req,
        { headers: this.keyHeader(idempotencyKey) }
      )
    );
  }

  getAccessGrants(benRegId: number): Observable<AccessGrant[]> {
    return this.unwrap(
      this.http.get<OutputResponse<AccessGrant[]>>(
        this.url(CONSENT_PATHS.accessGrants(benRegId))
      )
    );
  }

  /** The logged-in doctor asks for access; the grant starts PENDING until the patient approves. */
  requestAccess(req: RequestAccessRequest, idempotencyKey: string): Observable<AccessGrant> {
    return this.unwrap(
      this.http.post<OutputResponse<AccessGrant>>(this.url(CONSENT_PATHS.requestAccess), req, {
        headers: this.keyHeader(idempotencyKey),
      })
    );
  }

  approveAccess(
    grantId: string,
    otpChallengeId: string,
    idempotencyKey: string
  ): Observable<AccessGrant> {
    return this.unwrap(
      this.http.post<OutputResponse<AccessGrant>>(
        this.url(CONSENT_PATHS.approveAccess(grantId)),
        { otpChallengeId },
        { headers: this.keyHeader(idempotencyKey) }
      )
    );
  }

  revokeAccess(grantId: string, idempotencyKey: string): Observable<AccessGrant> {
    return this.unwrap(
      this.http.post<OutputResponse<AccessGrant>>(
        this.url(CONSENT_PATHS.revokeAccess(grantId)),
        {},
        { headers: this.keyHeader(idempotencyKey) }
      )
    );
  }

  private url(path: string): string {
    return consentApiBase() + path;
  }

  private keyHeader(idempotencyKey: string): HttpHeaders {
    return new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
  }

  private unwrap<T>(source: Observable<OutputResponse<T>>): Observable<T> {
    return source.pipe(
      map((res) => {
        // Creating calls (OTP, evidence, save, access request) answer 201.
        if (!res || res.statusCode < 200 || res.statusCode > 299) {
          throw {
            kind: 'FAILED',
            message: (res && res.errorMessage) || 'Request failed',
          } as ConsentApiError;
        }
        return res.data;
      }),
      catchError((err) => throwError(() => toConsentApiError(err)))
    );
  }
}
