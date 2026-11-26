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

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { notConfiguredConfig } from './core/consent-config';
import { ConsentApiService } from './core/consent-api.service';
import { ConsentConfigService } from './core/consent-config.service';
import { ConsentDialogResult, PendingAction } from './core/consent.models';
import { mockResolvedConfig } from './core/testing/consent-config.mock';
import { ConsentDialogService } from './consent-dialog.service';
import {
  ConsentFlag,
  eventTypeFor,
  flagFor,
  RevisitConsentResult,
  RevisitConsentService,
  withdrawalOf,
} from './revisit-consent.service';
import { PatientConsents } from './core/consent.models';
import { mockConsents } from './core/testing/consent.mock';

describe('RevisitConsentService (feature 003)', () => {
  const env = environment as { consentManagement?: unknown };
  let original: unknown;
  let api: jasmine.SpyObj<ConsentApiService>;
  let config: jasmine.SpyObj<ConsentConfigService>;
  let dialog: jasmine.SpyObj<ConsentDialogService>;
  let service: RevisitConsentService;
  const missing: PendingAction[] = [
    { reason: 'CONSENT_MISSING', purposeCodes: ['P-REG'], dueSince: '2026-10-01' },
  ];
  const patient = { beneficiaryRegId: 101, phone: '9876543210', dob: '1990-01-01' };

  function closedWith(outcome: ConsentDialogResult['outcome']): ConsentDialogResult {
    return { outcome, consentId: null, consentingParty: null, decisions: [], syncStatus: null };
  }

  function ensure(): RevisitConsentResult | undefined {
    let out: RevisitConsentResult | undefined;
    service.ensureConsent(patient).subscribe((r) => (out = r));
    return out;
  }

  beforeEach(() => {
    original = env.consentManagement;
    env.consentManagement = { enabled: true, apiBase: 'http://api' };
    api = jasmine.createSpyObj<ConsentApiService>('ConsentApiService', [
      'getPendingActions',
      'getPendingActionsBatch',
      'getConsents',
    ]);
    api.getConsents.and.returnValue(of(mockConsents()));
    config = jasmine.createSpyObj<ConsentConfigService>('ConsentConfigService', ['load']);
    config.load.and.returnValue(of(mockResolvedConfig('full', 'REVISIT')));
    dialog = jasmine.createSpyObj<ConsentDialogService>('ConsentDialogService', ['open']);
    TestBed.configureTestingModule({
      providers: [
        { provide: ConsentApiService, useValue: api },
        { provide: ConsentConfigService, useValue: config },
        { provide: ConsentDialogService, useValue: dialog },
      ],
    });
    service = TestBed.inject(RevisitConsentService);
  });

  afterEach(() => {
    env.consentManagement = original;
  });

  it('maps pending reasons to the saved event type', () => {
    expect(eventTypeFor(missing)).toBe('NEW');
    expect(eventTypeFor([{ ...missing[0], reason: 'LEGACY' }])).toBe('NEW');
    expect(eventTypeFor([{ ...missing[0], reason: 'RECONSENT_REQUIRED' }])).toBe('UPDATE');
    expect(eventTypeFor([{ ...missing[0], reason: 'EXPIRED' }])).toBe('RENEWAL');
    expect(eventTypeFor([{ ...missing[0], reason: 'WITHDRAWN' }])).toBe('UPDATE');
  });

  it('flags a withdrawal ahead of any other pending reason', () => {
    expect(flagFor(undefined)).toBeNull();
    expect(flagFor([])).toBeNull();
    expect(flagFor(missing)).toBe('PENDING');
    expect(flagFor([...missing, { ...missing[0], reason: 'WITHDRAWN' }])).toBe('WITHDRAWN');
  });

  /** mockConsents with SMS reminders withdrawn on 2026-11-20 by the grievance officer. */
  function withdrawnConsents(): PatientConsents {
    const consents = mockConsents();
    consents.current = consents.current.map((p) =>
      p.purposeCode === 'P-REM' ? { ...p, status: 'WITHDRAWN' as const } : p
    );
    consents.history = [
      { ...consents.history[0], consentId: 'c-4', capturedAt: '2026-11-20T11:00:00+05:30',
        purposes: [{ purposeCode: 'P-REM', status: 'WITHDRAWN', versionNo: 3 }] },
      ...consents.history,
    ];
    return consents;
  }

  describe('withdrawalOf', () => {
    it('lists the withdrawn purposes and when they were withdrawn', () => {
      expect(withdrawalOf(withdrawnConsents())).toEqual({
        purposeCodes: ['P-REM'],
        since: '2026-11-20T11:00:00+05:30',
      });
    });

    it('is null when nothing is withdrawn', () => {
      expect(withdrawalOf(mockConsents())).toBeNull();
      expect(withdrawalOf(null)).toBeNull();
    });

    it('has no date when the history does not show the withdrawal', () => {
      const consents = withdrawnConsents();
      consents.history = [];
      expect(withdrawalOf(consents)!.since).toBeNull();
    });
  });

  describe('consentFlags', () => {
    it('marks a patient withdrawn from their current consents, even with revisit consent off', () => {
      config.load.and.returnValue(of(mockResolvedConfig('off', 'REVISIT')));
      api.getConsents.and.callFake((id: number) => of(id === 102 ? withdrawnConsents() : mockConsents()));
      let out: Map<number, ConsentFlag> | undefined;
      service.consentFlags([101, 102]).subscribe((m) => (out = m));
      expect(api.getPendingActionsBatch).not.toHaveBeenCalled();
      expect(Array.from(out!.entries())).toEqual([[102, 'WITHDRAWN']]);
    });

    it('still marks pending patients when a consents read fails', () => {
      api.getPendingActionsBatch.and.returnValue(of({ '101': missing }));
      api.getConsents.and.returnValue(throwError(() => ({ kind: 'UNAVAILABLE' })));
      let out: Map<number, ConsentFlag> | undefined;
      service.consentFlags([101]).subscribe((m) => (out = m));
      expect(Array.from(out!.entries())).toEqual([[101, 'PENDING']]);
    });

    it('marks withdrawn and pending patients from one batch call', () => {
      api.getPendingActionsBatch.and.returnValue(
        of({
          '101': [{ reason: 'WITHDRAWN', purposeCodes: ['P-REG'], dueSince: '2026-11-20' }],
          '102': missing,
          '103': [],
        })
      );
      let out: Map<number, ConsentFlag> | undefined;
      service.consentFlags([101, 102, 103]).subscribe((m) => (out = m));
      expect(api.getPendingActionsBatch).toHaveBeenCalledOnceWith([101, 102, 103]);
      expect(Array.from(out!.entries())).toEqual([
        [101, 'WITHDRAWN'],
        [102, 'PENDING'],
      ]);
    });

    it('marks no one when the service fails', () => {
      api.getPendingActionsBatch.and.returnValue(throwError(() => ({ kind: 'UNAVAILABLE' })));
      let out: Map<number, ConsentFlag> | undefined;
      service.consentFlags([101]).subscribe((m) => (out = m));
      expect(out!.size).toBe(0);
    });
  });

  describe('pendingIds', () => {
    it('returns the patients with any pending action, in one call', () => {
      api.getPendingActionsBatch.and.returnValue(of({ '101': missing, '102': [] }));
      let out: Set<number> | undefined;
      service.pendingIds([101, 102, NaN]).subscribe((s) => (out = s));
      expect(config.load).toHaveBeenCalledWith('REVISIT');
      expect(api.getPendingActionsBatch).toHaveBeenCalledOnceWith([101, 102]);
      expect(Array.from(out!)).toEqual([101]);
    });

    it('marks no one when revisit consent is off for the project', () => {
      config.load.and.returnValue(of(mockResolvedConfig('off', 'REVISIT')));
      let out: Set<number> | undefined;
      service.pendingIds([101]).subscribe((s) => (out = s));
      expect(api.getPendingActionsBatch).not.toHaveBeenCalled();
      expect(out!.size).toBe(0);
    });

    it('marks no one when the feature is off or the service fails', () => {
      api.getPendingActionsBatch.and.returnValue(throwError(() => ({ kind: 'UNAVAILABLE' })));
      let out: Set<number> | undefined;
      service.pendingIds([101]).subscribe((s) => (out = s));
      expect(out!.size).toBe(0);
      env.consentManagement = { enabled: false };
      service.pendingIds([101]).subscribe((s) => (out = s));
      expect(config.load).toHaveBeenCalledTimes(1);
    });
  });

  describe('ensureConsent', () => {
    it('goes ahead without a dialog when nothing is pending', () => {
      api.getPendingActions.and.returnValue(of([]));
      expect(ensure()).toEqual({ proceed: true, pending: false });
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('opens the revisit dialog for the patient with the project configuration', () => {
      api.getPendingActions.and.returnValue(of([{ ...missing[0], reason: 'RECONSENT_REQUIRED' }]));
      dialog.open.and.returnValue(of(closedWith('GRANTED')));
      expect(ensure()).toEqual({ proceed: true, pending: false });
      expect(api.getPendingActions).toHaveBeenCalledWith(101, 'REVISIT');
      expect(dialog.open).toHaveBeenCalledWith(
        jasmine.objectContaining({
          context: 'REVISIT',
          beneficiaryRegId: 101,
          patientPhone: '9876543210',
          dob: '1990-01-01',
          eventType: 'UPDATE',
        })
      );
      expect(dialog.open.calls.mostRecent().args[0].config!.projectId).toBe(12);
    });

    it('asks again when a purpose was withdrawn in Admin, saying when', () => {
      api.getPendingActions.and.returnValue(of([]));
      api.getConsents.and.returnValue(of(withdrawnConsents()));
      dialog.open.and.returnValue(of(closedWith('GRANTED')));
      expect(ensure()).toEqual({ proceed: true, pending: false, withdrawn: false });
      expect(api.getConsents).toHaveBeenCalledWith(101);
      expect(dialog.open).toHaveBeenCalledWith(
        jasmine.objectContaining({
          eventType: 'UPDATE',
          withdrawal: { since: '2026-11-20T11:00:00+05:30' },
        })
      );
    });

    it('uses the server\'s WITHDRAWN action when it sends one', () => {
      api.getPendingActions.and.returnValue(
        of([{ reason: 'WITHDRAWN', purposeCodes: ['P-REM'], dueSince: '2026-11-21' }])
      );
      api.getConsents.and.returnValue(of(withdrawnConsents()));
      dialog.open.and.returnValue(of(closedWith('GRANTED')));
      ensure();
      expect(dialog.open.calls.mostRecent().args[0].withdrawal).toEqual({ since: '2026-11-21' });
    });

    it('lets the visit go ahead, still withdrawn, when the patient does not decide', () => {
      api.getPendingActions.and.returnValue(of([]));
      api.getConsents.and.returnValue(of(withdrawnConsents()));
      dialog.open.and.returnValue(of(closedWith('NO_DECISION')));
      expect(ensure()).toEqual({ proceed: true, pending: true, withdrawn: true });
    });

    it('still stops the visit when required consent is also pending and not given', () => {
      api.getPendingActions.and.returnValue(of(missing));
      api.getConsents.and.returnValue(of(withdrawnConsents()));
      dialog.open.and.returnValue(of(closedWith('NO_DECISION')));
      expect(ensure()).toEqual({ proceed: false, pending: true, withdrawn: true });
    });

    it('asks only for the pending consent when a consents read fails', () => {
      api.getPendingActions.and.returnValue(of(missing));
      api.getConsents.and.returnValue(throwError(() => ({ kind: 'UNAVAILABLE' })));
      dialog.open.and.returnValue(of(closedWith('GRANTED')));
      expect(ensure()).toEqual({ proceed: true, pending: false });
      expect(dialog.open.calls.mostRecent().args[0].withdrawal).toBeNull();
    });

    it('opens the dialog without a withdrawal note for other reasons', () => {
      api.getPendingActions.and.returnValue(of(missing));
      dialog.open.and.returnValue(of(closedWith('GRANTED')));
      ensure();
      expect(dialog.open.calls.mostRecent().args[0].withdrawal).toBeNull();
    });

    it('stops the visit when consent is mandatory and not given', () => {
      api.getPendingActions.and.returnValue(of(missing));
      dialog.open.and.returnValue(of(closedWith('NO_DECISION')));
      expect(ensure()).toEqual({ proceed: false, pending: true });
      dialog.open.and.returnValue(of(closedWith('BLOCKED')));
      expect(ensure()).toEqual({ proceed: false, pending: true });
    });

    it('lets the visit go ahead when consent is not mandatory', () => {
      const optional = mockResolvedConfig('full', 'REVISIT');
      config.load.and.returnValue(of({ ...optional, config: { ...optional.config, mandatory: false } }));
      api.getPendingActions.and.returnValue(of(missing));
      dialog.open.and.returnValue(of(closedWith('NO_DECISION')));
      expect(ensure()).toEqual({ proceed: true, pending: true });
    });

    it('goes ahead when revisit consent is off, the feature is off or the service fails', () => {
      config.load.and.returnValue(of(mockResolvedConfig('off', 'REVISIT')));
      expect(ensure()).toEqual({ proceed: true, pending: false });
      config.load.and.returnValue(of(notConfiguredConfig('REVISIT')));
      expect(ensure()).toEqual({ proceed: true, pending: false });
      config.load.and.returnValue(of(mockResolvedConfig('full', 'REVISIT')));
      api.getPendingActions.and.returnValue(throwError(() => ({ kind: 'UNAVAILABLE' })));
      expect(ensure()).toEqual({ proceed: true, pending: true });
      env.consentManagement = { enabled: false };
      expect(ensure()).toEqual({ proceed: true, pending: false });
      expect(dialog.open).not.toHaveBeenCalled();
    });
  });
});
