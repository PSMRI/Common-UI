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
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ConsentApiService } from './core/consent-api.service';
import { ResolvedConsentConfig } from './core/consent-config.models';
import { ConsentConfigService } from './core/consent-config.service';
import { isConsentFeatureEnabled } from './core/consent-feature';
import { ConsentEventType, PatientConsents, PendingAction } from './core/consent.models';
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
  /** Set only when the patient had withdrawn consent: true while they have not given it again. */
  withdrawn?: boolean;
}

/** What a patient in a search list is marked with: consent withdrawn, or otherwise pending. */
export type ConsentFlag = 'WITHDRAWN' | 'PENDING';

/** WITHDRAWN when any pending action is a withdrawal, PENDING for any other, null for none. */
export function flagFor(actions: PendingAction[] | undefined): ConsentFlag | null {
  if (!actions || actions.length === 0) {
    return null;
  }
  return actions.some((a) => a.reason === 'WITHDRAWN') ? 'WITHDRAWN' : 'PENDING';
}

/**
 * Saved event type for the pending reasons: expiry is a RENEWAL; re-consent, and consent given again
 * after a withdrawal, an UPDATE.
 */
export function eventTypeFor(actions: PendingAction[]): ConsentEventType {
  const reasons = actions.map((a) => a.reason);
  if (reasons.includes('EXPIRED')) {
    return 'RENEWAL';
  }
  return reasons.includes('RECONSENT_REQUIRED') || reasons.includes('WITHDRAWN') ? 'UPDATE' : 'NEW';
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

  /** The patients among these whose consent is pending (withdrawn included); empty when revisit consent is off. */
  pendingIds(benRegIds: number[]): Observable<Set<number>> {
    return this.consentFlags(benRegIds).pipe(map((flags) => new Set(flags.keys())));
  }

  /**
   * Each listed patient whose consent is withdrawn or otherwise pending. Withdrawn comes from the
   * patient's current consents (any purpose WITHDRAWN, e.g. by the grievance officer in Admin) and is
   * shown whatever the revisit setting; pending comes from one batch call when revisit consent is on.
   * Empty on failure: the list never waits on consent.
   */
  consentFlags(benRegIds: number[]): Observable<Map<number, ConsentFlag>> {
    const ids = benRegIds.filter((id) => typeof id === 'number' && !isNaN(id));
    if (!isConsentFeatureEnabled() || ids.length === 0) {
      return of(new Map<number, ConsentFlag>());
    }
    const pending$ = this.consentConfig.load('REVISIT').pipe(
      switchMap((config) =>
        config.config.enabled ? this.consentApi.getPendingActionsBatch(ids) : of({})
      ),
      catchError(() => of({}))
    );
    return forkJoin({ pending: pending$, withdrawn: this.withdrawnIds(ids) }).pipe(
      map(({ pending, withdrawn }) => {
        const byId = pending as { [benRegId: string]: PendingAction[] };
        const flags = new Map<number, ConsentFlag>();
        ids.forEach((id) => {
          const flag = withdrawn.has(id) ? 'WITHDRAWN' : flagFor(byId[String(id)]);
          if (flag) {
            flags.set(id, flag);
          }
        });
        return flags;
      }),
      catchError(() => of(new Map<number, ConsentFlag>()))
    );
  }

  /**
   * Opens the consent dialog when the patient's consent is pending or was withdrawn. A withdrawal
   * alone never stops the visit: only optional purposes can be withdrawn.
   */
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
        return forkJoin({
          actions: this.consentApi.getPendingActions(patient.beneficiaryRegId, 'REVISIT'),
          consents: this.consentApi
            .getConsents(patient.beneficiaryRegId)
            .pipe(catchError(() => of(null))),
        }).pipe(
          switchMap(({ actions, consents }) => {
            const all = withWithdrawal(actions, withdrawalOf(consents));
            return all.length > 0 ? this.takeConsent(patient, config, all) : of(goAhead);
          })
        );
      }),
      catchError(() => of({ proceed: true, pending: true }))
    );
  }

  /** The patients among these with any withdrawn purpose; a failed read marks no one. */
  private withdrawnIds(ids: number[]): Observable<Set<number>> {
    return forkJoin(
      ids.map((id) =>
        this.consentApi.getConsents(id).pipe(
          map((consents) => (withdrawalOf(consents) ? id : null)),
          catchError(() => of(null))
        )
      )
    ).pipe(map((found) => new Set(found.filter((id): id is number => id !== null))));
  }

  private takeConsent(
    patient: RevisitPatient,
    config: ResolvedConsentConfig,
    actions: PendingAction[]
  ): Observable<RevisitConsentResult> {
    const withdrawnAction = actions.find((a) => a.reason === 'WITHDRAWN');
    // Only these can stop the visit; a withdrawal (optional purposes only) cannot.
    const blocking = actions.some((a) => a.reason !== 'WITHDRAWN');
    return this.consentDialog
      .open({
        context: 'REVISIT',
        beneficiaryRegId: patient.beneficiaryRegId,
        patientPhone: patient.phone || null,
        dob: patient.dob || null,
        config,
        eventType: eventTypeFor(actions),
        withdrawal: withdrawnAction ? { since: withdrawnAction.dueSince } : null,
      })
      .pipe(
        map((result) => {
          const consented = result.outcome === 'GRANTED' || result.outcome === 'PARTIAL';
          const outcome: RevisitConsentResult = {
            proceed: consented || !config.config.mandatory || !blocking,
            pending: !consented,
          };
          if (withdrawnAction) {
            outcome.withdrawn = !consented;
          }
          return outcome;
        })
      );
  }
}

/**
 * The patient's withdrawn purposes and when they were withdrawn (the newest consent event that
 * withdrew one of them), or null when nothing is withdrawn.
 */
export function withdrawalOf(
  consents: PatientConsents | null | undefined
): { purposeCodes: string[]; since: string | null } | null {
  const codes = (consents?.current || [])
    .filter((p) => p.status === 'WITHDRAWN')
    .map((p) => p.purposeCode);
  if (codes.length === 0) {
    return null;
  }
  const times = (consents?.history || [])
    .filter((record) =>
      (record.purposes || []).some((p) => p.status === 'WITHDRAWN' && codes.includes(p.purposeCode))
    )
    .map((record) => record.capturedAt)
    .filter((at) => !!at && !isNaN(Date.parse(at)))
    .sort((a, b) => Date.parse(b) - Date.parse(a));
  return { purposeCodes: codes, since: times[0] || null };
}

/** The pending actions plus a WITHDRAWN one for the withdrawal, unless the server already sent one. */
function withWithdrawal(
  actions: PendingAction[],
  withdrawal: { purposeCodes: string[]; since: string | null } | null
): PendingAction[] {
  if (!withdrawal || actions.some((a) => a.reason === 'WITHDRAWN')) {
    return actions;
  }
  return [
    ...actions,
    { reason: 'WITHDRAWN', purposeCodes: withdrawal.purposeCodes, dueSince: withdrawal.since },
  ];
}
