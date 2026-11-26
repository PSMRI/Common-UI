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

import {
  ChangeDetectorRef,
  Directive,
  DoCheck,
  OnInit,
  inject,
} from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { ConsentApiService } from '../consent-api.service';
import { ConsentConfigService } from '../consent-config.service';
import { ConsentContextService } from '../consent-context.service';
import {
  ChangeContext,
  ConsentApiError,
  ConsentMode,
  GrievanceContact,
  PatientConsents,
  PurposeState,
  PurposeStatus,
  SyncStatus,
} from '../consent.models';
import { uuidV4 } from '../evidence.util';
import { CONSENT_MODES } from './proof-step.base';

/** What the patient header passes when it opens the preference centre. */
export interface PreferenceCentreOptions {
  beneficiaryRegId: number;
  /** Used for the OTP when a purpose is turned on; staff can type it when absent. */
  patientPhone?: string | null;
}

/** changed: something was saved, so the caller may refresh its consent state. */
export interface PreferenceCentreResult {
  changed: boolean;
}

/** The change waiting for staff to confirm it with the patient. */
export type PreferenceAction = { kind: 'GRANT' | 'DENY'; purpose: PurposeState };

/** Consent is withdrawn through the grievance officer: the contact shown instead of a withdrawal. */
export interface WithdrawContact {
  loading: boolean;
  grievance: GrievanceContact | null;
  grievanceText: string;
}

/** One purpose's outcome in one consent event, for the history list. */
export interface HistoryRow {
  key: string;
  capturedAt: string;
  purposeCode: string;
  purposeName: string;
  status: PurposeStatus;
  mode: ConsentMode;
  modeKey: string;
  capturedBy: number | null;
  languageCode: string;
  syncStatus: SyncStatus;
}

export type PreferenceError =
  | 'staleReload'
  | 'otpInvalid'
  | 'prefNeedsConsent'
  | 'serviceUnavailable';

// Consent-API rejects device, facility and service-line codes with spaces or other characters.
const CODE_PATTERN = /^[A-Za-z0-9_.:-]+$/;

/** Statuses a purpose can be switched from, without the full consent dialog. */
const SWITCHABLE: PurposeStatus[] = ['GRANTED', 'DENIED', 'WITHDRAWN'];

/**
 * Preference centre shared by both tracks (AMM-2522, FR-021a to FR-027): current consents, change one
 * purpose, withdraw one or all, and the consent history.
 */
@Directive()
export abstract class PreferenceCentreBase implements OnInit, DoCheck {
  currentLanguageSet: any;
  consents: PatientConsents | null = null;
  history: HistoryRow[] = [];
  loading = false;
  loadFailed = false;
  /** The change shown for confirmation; null when none. */
  action: PreferenceAction | null = null;
  /** Verified OTP for turning a purpose on. */
  otpChallengeId: string | null = null;
  busy = false;
  error: PreferenceError | null = null;
  /** Shown after Withdraw or Withdraw all: the patient contacts the grievance officer; null when hidden. */
  withdrawContact: WithdrawContact | null = null;
  /** Set after a successful change, until the next action starts. */
  saved = false;
  /** Something was saved while the preference centre was open. */
  changed = false;
  /** Reused when a failed confirmation is retried, so the server writes it once. */
  private actionKey = '';

  /** Options passed by the caller through the track's dialog data token. */
  abstract options: PreferenceCentreOptions;

  protected consentApi = inject(ConsentApiService);
  protected consentContext = inject(ConsentContextService);
  protected consentConfig = inject(ConsentConfigService);
  httpServiceService = inject(HttpServiceService);
  // Zard's dialog container is OnPush: async updates must mark this view for checking.
  protected cdr = inject(ChangeDetectorRef);

  /** Closes the track's dialog with the result. */
  protected abstract closeDialog(result: PreferenceCentreResult): void;

  ngOnInit(): void {
    this.assignSelectedLanguage();
    this.load();
  }

  ngDoCheck(): void {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage(): void {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.currentLanguageSet = getLanguageJson.currentLanguageObject;
  }

  get text(): any {
    return this.currentLanguageSet?.consent;
  }

  /** A text with its {name} placeholders filled in. */
  fill(key: string, values: { [name: string]: string | number }): string {
    let result: string = this.text?.[key] || '';
    Object.keys(values).forEach(name => {
      result = result.split('{' + name + '}').join(String(values[name]));
    });
    return result;
  }

  get current(): PurposeState[] {
    return this.consents?.current || [];
  }

  /** Granted purposes that can be withdrawn; Withdraw all is offered only when there is one. */
  get withdrawable(): PurposeState[] {
    return this.current.filter(p => p.status === 'GRANTED' && p.isWithdrawable);
  }

  /** Confirm is allowed once a purpose being turned on has a verified OTP. */
  get confirmEnabled(): boolean {
    if (!this.action || this.busy) {
      return false;
    }
    return this.action.kind !== 'GRANT' || !!this.otpChallengeId;
  }

  load(): void {
    const id = this.options.beneficiaryRegId;
    this.loading = true;
    this.loadFailed = false;
    this.consentApi.getConsents(id).subscribe({
      next: consents => {
        this.loading = false;
        this.consents = consents;
        this.history = this.toHistory(consents);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.loadFailed = true;
        this.cdr.markForCheck();
      },
    });
  }

  /** Optional purposes can be switched; expired or re-consent ones need the consent dialog. */
  canSwitch(purpose: PurposeState): boolean {
    return !purpose.isMandatory && SWITCHABLE.includes(purpose.status);
  }

  isOn(purpose: PurposeState): boolean {
    return purpose.status === 'GRANTED';
  }

  canWithdraw(purpose: PurposeState): boolean {
    return purpose.status === 'GRANTED' && purpose.isWithdrawable;
  }

  /** A granted purpose the law requires: shown with the "cannot be withdrawn" explanation. */
  requiredByLaw(purpose: PurposeState): boolean {
    return purpose.status === 'GRANTED' && !purpose.isWithdrawable;
  }

  statusType(
    status: string
  ): 'success' | 'secondary' | 'destructive' | 'warning' | 'outline' {
    switch (status) {
      case 'GRANTED':
        return 'success';
      case 'WITHDRAWN':
        return 'destructive';
      case 'EXPIRED':
      case 'RECONSENT_REQUIRED':
        return 'warning';
      case 'DENIED':
        return 'secondary';
      default:
        return 'outline';
    }
  }

  purposeName(code: string): string {
    const found = this.current.find(p => p.purposeCode === code);
    return found ? found.name : code;
  }

  switchPurpose(purpose: PurposeState): void {
    if (this.canSwitch(purpose)) {
      this.startAction({
        kind: this.isOn(purpose) ? 'DENY' : 'GRANT',
        purpose,
      });
    }
  }

  /** Withdraw is not done here: shows the grievance officer the patient contacts instead. */
  withdrawOne(purpose: PurposeState): void {
    if (this.canWithdraw(purpose)) {
      this.showWithdrawContact();
    }
  }

  /** Withdraw all is not done here either: shows the grievance officer. */
  withdrawAll(): void {
    if (this.withdrawable.length > 0) {
      this.showWithdrawContact();
    }
  }

  closeWithdrawContact(): void {
    this.withdrawContact = null;
  }

  /**
   * Nurses and doctors do not withdraw consent: the patient contacts the grievance officer. Shows the
   * officer from the project's published notice, in the language of the patient's latest consent.
   */
  private showWithdrawContact(): void {
    this.startAction(null);
    const languageCode = this.history.length > 0 ? this.history[0].languageCode : '';
    if (!languageCode) {
      this.withdrawContact = { loading: false, grievance: null, grievanceText: '' };
      return;
    }
    this.withdrawContact = { loading: true, grievance: null, grievanceText: '' };
    this.consentConfig
      .load('REGISTRATION')
      .pipe(
        switchMap(config =>
          this.consentApi.getNotice('REGISTRATION', languageCode, config.projectId)
        )
      )
      .subscribe({
        next: notice => {
          // CENTRAL: the project has no notice of its own, so no officer of its own either.
          const own = notice.source !== 'CENTRAL';
          this.withdrawContact = {
            loading: false,
            grievance: own ? notice.grievance || null : null,
            grievanceText: own ? (notice.grievanceInfo || '').trim() : '',
          };
          this.cdr.markForCheck();
        },
        error: () => {
          this.withdrawContact = { loading: false, grievance: null, grievanceText: '' };
          this.cdr.markForCheck();
        },
      });
  }

  onOtpVerified(event: { challengeId: string }): void {
    this.otpChallengeId = event.challengeId;
  }

  cancelAction(): void {
    this.action = null;
    this.otpChallengeId = null;
    this.error = null;
  }

  confirmAction(): void {
    const action = this.action;
    if (!action || !this.confirmEnabled) {
      return;
    }
    this.busy = true;
    this.error = null;
    this.request(action).subscribe({
      next: () => {
        this.busy = false;
        this.action = null;
        this.otpChallengeId = null;
        this.saved = true;
        this.changed = true;
        this.load();
      },
      error: (err: ConsentApiError) => {
        this.busy = false;
        this.onActionError(err);
        this.cdr.markForCheck();
      },
    });
  }

  close(): void {
    this.closeDialog({ changed: this.changed });
  }

  private startAction(action: PreferenceAction | null): void {
    this.action = action;
    this.actionKey = uuidV4();
    this.otpChallengeId = null;
    this.error = null;
    this.saved = false;
    this.withdrawContact = null;
  }

  private request(action: PreferenceAction): Observable<PatientConsents> {
    const id = this.options.beneficiaryRegId;
    const purpose = action.purpose;
    return this.consentApi.changePreference(
      id,
      {
        purposeCodes: [purpose.purposeCode],
        decision: action.kind,
        versions: this.versionsOf([purpose]),
        ...(action.kind === 'GRANT'
          ? { otpChallengeId: this.otpChallengeId }
          : {}),
        ...this.changeContext(),
      },
      this.actionKey
    );
  }

  private onActionError(err: ConsentApiError): void {
    const kind = err && err.kind;
    const reason = err && err.message;
    if (
      kind === 'STALE' ||
      kind === 'NOT_FOUND' ||
      reason === 'STATE_CONFLICT'
    ) {
      // Someone changed it meanwhile, or it is already done: show the latest state.
      this.error = 'staleReload';
      this.action = null;
      this.otpChallengeId = null;
      this.load();
    } else if (reason === 'OTP_INVALID') {
      this.error = 'otpInvalid';
      this.otpChallengeId = null;
    } else if (reason === 'BUSINESS_RULE_VIOLATION') {
      this.error = 'prefNeedsConsent';
    } else {
      this.error = 'serviceUnavailable';
    }
  }

  private versionsOf(purposes: PurposeState[]): {
    [purposeCode: string]: number;
  } {
    const versions: { [purposeCode: string]: number } = {};
    purposes.forEach(p => (versions[p.purposeCode] = p.versionNo));
    return versions;
  }

  private changeContext(): ChangeContext {
    const ctx = this.consentContext.context();
    const change: ChangeContext = {
      facilityId: ctx.facilityId,
      providerServiceMapId: ctx.providerServiceMapId,
    };
    if (CODE_PATTERN.test(ctx.deviceId || '')) {
      change.deviceId = ctx.deviceId;
    }
    if (ctx.serviceLine && CODE_PATTERN.test(ctx.serviceLine)) {
      change.serviceLine = ctx.serviceLine;
    }
    return change;
  }

  /** One row per purpose per event, newest first (FR-027). */
  private toHistory(consents: PatientConsents): HistoryRow[] {
    const rows: HistoryRow[] = [];
    (consents.history || []).forEach(record => {
      (record.purposes || []).forEach(p => {
        rows.push({
          key: record.consentId + ':' + p.purposeCode,
          capturedAt: record.capturedAt,
          purposeCode: p.purposeCode,
          purposeName: this.nameIn(consents, p.purposeCode),
          status: p.status,
          mode: record.mode,
          modeKey: CONSENT_MODES.find(m => m.mode === record.mode)?.key || '',
          capturedBy: record.capturedBy,
          languageCode: record.languageCode,
          syncStatus: record.syncStatus,
        });
      });
    });
    return rows.sort(
      (a, b) => Date.parse(b.capturedAt) - Date.parse(a.capturedAt)
    );
  }

  private nameIn(consents: PatientConsents, code: string): string {
    const found = (consents.current || []).find(p => p.purposeCode === code);
    return found ? found.name : code;
  }
}
