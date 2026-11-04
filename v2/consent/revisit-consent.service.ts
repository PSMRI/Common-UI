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

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ConsentApiService } from '../../src/consent/core/consent-api.service';
import { ResolvedConsentConfig } from '../../src/consent/core/consent-config.models';
import { ConsentConfigService } from '../../src/consent/core/consent-config.service';
import { isConsentFeatureEnabled } from '../../src/consent/core/consent-feature';
import { ConsentEventType, PendingAction } from '../../src/consent/core/consent.models';
import { ConsentDialogService } from './consent-dialog.service';

/** The patient being opened from search. */
export interface RevisitPatient {
  beneficiaryRegId: number;
  phone?: string | null;
  dob?: string | null;
}

/** proceed: the visit may go ahead; pending: consent is still not taken. */
export interface RevisitConsentResult {
  proceed: boolean;
  pending: boolean;
}

/** Saved event type for the first pending reason: re-consent is an UPDATE, expiry a RENEWAL. */
export function eventTypeFor(actions: PendingAction[]): ConsentEventType {
  const reasons = actions.map((a) => a.reason);
  if (reasons.includes('EXPIRED')) {
    return 'RENEWAL';
  }
  return reasons.includes('RECONSENT_REQUIRED') ? 'UPDATE' : 'NEW';
}

/**
 * Consent for patients who are already registered (feature 003). A consent-service outage never
 * blocks care: on any failure the visit goes ahead and the patient stays marked as pending.
 */
@Injectable({ providedIn: 'root' })
export class RevisitConsentService {
  constructor(
    private consentApi: ConsentApiService,
    private consentConfig: ConsentConfigService,
    private consentDialog: ConsentDialogService
  ) {}

  /** The patients among these whose consent is pending; empty when revisit consent is off. */
  pendingIds(benRegIds: number[]): Observable<Set<number>> {
    const ids = benRegIds.filter((id) => typeof id === 'number' && !isNaN(id));
    if (!isConsentFeatureEnabled() || ids.length === 0) {
      return of(new Set<number>());
    }
    return this.consentConfig.load('REVISIT').pipe(
      switchMap((config) =>
        config.config.enabled ? this.consentApi.getPendingActionsBatch(ids) : of({})
      ),
      map(
        (byId: { [benRegId: string]: PendingAction[] }) =>
          new Set(ids.filter((id) => (byId[String(id)] || []).length > 0))
      ),
      catchError(() => of(new Set<number>()))
    );
  }

  /** Opens the consent dialog when the patient's consent is pending. */
  ensureConsent(patient: RevisitPatient): Observable<RevisitConsentResult> {
    const goAhead: RevisitConsentResult = { proceed: true, pending: false };
    if (!isConsentFeatureEnabled()) {
      return of(goAhead);
    }
    return this.consentConfig.load('REVISIT').pipe(
      switchMap((config) => {
        if (!config.config.enabled) {
          return of(goAhead);
        }
        return this.consentApi
          .getPendingActions(patient.beneficiaryRegId)
          .pipe(
            switchMap((actions) =>
              actions.length > 0 ? this.takeConsent(patient, config, actions) : of(goAhead)
            )
          );
      }),
      catchError(() => of({ proceed: true, pending: true }))
    );
  }

  private takeConsent(
    patient: RevisitPatient,
    config: ResolvedConsentConfig,
    actions: PendingAction[]
  ): Observable<RevisitConsentResult> {
    return this.consentDialog
      .open({
        context: 'REVISIT',
        beneficiaryRegId: patient.beneficiaryRegId,
        patientPhone: patient.phone || null,
        dob: patient.dob || null,
        config,
        eventType: eventTypeFor(actions),
      })
      .pipe(
        map((result) => {
          const consented = result.outcome === 'GRANTED' || result.outcome === 'PARTIAL';
          return { proceed: consented || !config.config.mandatory, pending: !consented };
        })
      );
  }
}
