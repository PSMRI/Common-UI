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

import { Directive, DoCheck, OnDestroy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { forkJoin, from, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { activeMode, allowedModes, DEFAULT_CONTEXT_CONFIG } from '../consent-config';
import { ContextConfig, ResolvedConsentConfig } from '../consent-config.models';
import { ConsentConfigService } from '../consent-config.service';
import { ConsentApiService } from '../consent-api.service';
import { ConsentContextService } from '../consent-context.service';
import {
  canAccept,
  createDraft,
  declarationText,
  declarationWording,
  declineAll,
  decisionList,
  grievanceText,
  mandatoryAllGranted,
  noDecisionResult,
  outcomeOf,
  proofValid,
  toSaveRequest,
  withNotice,
} from '../consent-draft';
import {
  ConsentApiError,
  ConsentConfirmation,
  ConsentDialogOptions,
  ConsentDialogResult,
  ConsentDraft,
  ConsentMode,
  EvidenceType,
  ProofDraft,
  RecordingUploadState,
} from '../consent.models';
import { maskPhone, sha256Hex, uuidV4 } from '../evidence.util';
import { ACTIVE_CONSENT_MODES } from './proof-step.base';

interface EvidenceItem {
  type: EvidenceType;
  blob: Blob;
  durationSec: number | null;
}

/** Consent dialog state machine shared by both tracks (FR-001 to FR-012, data-model.md). */
@Directive()
export abstract class ConsentDialogBase implements OnInit, DoCheck, OnDestroy {
  currentLanguageSet: any;
  draft: ConsentDraft = createDraft();
  step: 'LANGUAGE' | 'DECIDE' | 'DONE' = 'LANGUAGE';
  /** Feature 003: shown after a granted save until Done (FR-012). */
  confirmation: ConsentConfirmation | null = null;
  private doneResult: ConsentDialogResult | null = null;
  loadingNotice = false;
  saving = false;
  failed = false;
  /** Feature 002: configuration frozen for this opening (FR-022); null while loading. */
  config: ResolvedConsentConfig | null = null;
  configFailed = false;
  /** Allowed modes in order, set once per configuration so bindings stay stable. */
  modes: { mode: ConsentMode; key: string }[] = ACTIVE_CONSENT_MODES;
  private retryAction: (() => void) | null = null;
  // Keyed by the captured file, so a retry re-uploads only failed files and a retake uploads anew.
  private evidenceIds = new WeakMap<Blob, string>();
  /** Feature 003: the recording being sent, or that failed, through "Upload to server". */
  private uploadingClip: Blob | null = null;
  private failedClip: Blob | null = null;
  private uploadKeys = new WeakMap<Blob, string>();

  /** Options passed by the caller through the track's dialog data token. */
  abstract options: ConsentDialogOptions;

  protected consentApi = inject(ConsentApiService);
  protected consentContext = inject(ConsentContextService);
  protected consentConfig = inject(ConsentConfigService);
  protected confirmationService = inject(ConfirmationService);
  httpServiceService = inject(HttpServiceService);
  // Zard's dialog container is OnPush: async updates must mark this view for checking.
  protected cdr = inject(ChangeDetectorRef);

  /** Closes the track's dialog with the result. */
  protected abstract closeDialog(result: ConsentDialogResult): void;

  ngOnInit(): void {
    this.assignSelectedLanguage();
    this.resolveConfig();
  }

  /** Uses the caller's configuration, or loads it once (FR-013, FR-020). */
  resolveConfig(): void {
    if (this.options.config) {
      this.setConfig(this.options.config);
      return;
    }
    this.configFailed = false;
    this.consentConfig.load(this.options.context).subscribe({
      next: (config) => {
        this.setConfig(config);
        this.cdr.markForCheck();
      },
      error: () => {
        this.configFailed = true;
        this.cdr.markForCheck();
      },
    });
  }

  get contextConfig(): ContextConfig {
    return this.config ? this.config.config : DEFAULT_CONTEXT_CONFIG;
  }

  /** OTP is the only allowed mode but there is no phone to send it to. */
  get otpNoPhone(): boolean {
    return (
      this.modes.length === 1 &&
      this.modes[0].mode === 'OTP' &&
      !this.options.patientPhone
    );
  }

  private setConfig(config: ResolvedConsentConfig): void {
    this.config = config;
    this.modes = allowedModes(config.config);
  }

  /** The configured default, or the only allowed mode (FR-014, FR-015). */
  private defaultMode(): ConsentMode | null {
    const configured = activeMode(this.contextConfig.defaultMode);
    if (configured && this.modes.some((m) => m.mode === configured)) {
      return configured;
    }
    return this.modes.length === 1 ? this.modes[0].mode : null;
  }

  ngOnDestroy(): void {
    // Drop captured proof from memory when the dialog closes (FR-015).
    this.draft = createDraft();
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

  get acceptEnabled(): boolean {
    return !!this.config && !this.otpNoPhone && canAccept(this.draft, false, this.saving);
  }

  /** Text key for the first thing still blocking Accept, so staff know what is missing. */
  get pendingKey(): string | null {
    const draft = this.draft;
    if (!draft.notice || this.saving || this.acceptEnabled) {
      return null;
    }
    if (!draft.noticeReadComplete) {
      return 'pendingReadNotice';
    }
    if (!mandatoryAllGranted(draft.notice.purposes, draft.decisions)) {
      return 'pendingRequiredPurposes';
    }
    if (!draft.mode) {
      return 'pendingMode';
    }
    const ctx = { notice: draft.notice, audioPlayedToEnd: draft.audioPlayedToEnd };
    if (proofValid(draft.mode, draft.proof, ctx)) {
      return null;
    }
    const proof = draft.proof;
    if (draft.mode === 'SELF_READ' || draft.mode === 'READ_ALOUD') {
      if (proof.declarationAgreed) {
        return 'pendingRecording';
      }
      return draft.mode === 'READ_ALOUD' ? 'pendingPatientAnswer' : 'pendingDeclaration';
    }
    const agreementOnly =
      draft.mode === 'WITNESSED' && proofValid('WITNESSED', { ...proof, declarationAgreed: true }, ctx);
    return agreementOnly ? 'pendingDeclaration' : 'pendingProof';
  }

  /** Feature 003: the declaration for the chosen mode in the notice language (FR-001, FR-003). */
  get declaration(): string {
    if (!this.draft.notice) {
      return '';
    }
    return declarationText(this.draft.notice, declarationWording(this.draft.mode), {
      patient: this.text?.defaultDeclaration || '',
      representative: this.text?.defaultRepresentativeDeclaration || '',
    });
  }

  loadNotice(languageCode: string): void {
    this.loadingNotice = true;
    this.failed = false;
    const projectId = this.config ? this.config.projectId : null;
    this.consentApi.getNotice(this.options.context, languageCode, projectId).subscribe({
      next: (notice) => {
        this.draft = withNotice(this.draft, notice);
        if (!this.draft.mode) {
          this.draft = { ...this.draft, mode: this.defaultMode() };
        }
        this.step = 'DECIDE';
        this.loadingNotice = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingNotice = false;
        this.fail(() => this.loadNotice(languageCode));
      },
    });
  }

  changeLanguage(): void {
    this.step = 'LANGUAGE';
  }

  onReadComplete(): void {
    this.draft = { ...this.draft, noticeReadComplete: true };
  }

  onAudioPlayed(): void {
    this.draft = { ...this.draft, audioPlayedToEnd: true };
  }

  onDecisions(decisions: { [purposeCode: string]: boolean }): void {
    this.draft = { ...this.draft, decisions };
  }

  onMode(mode: ConsentMode | null): void {
    this.draft = { ...this.draft, mode };
  }

  onProof(proof: ProofDraft): void {
    this.draft = { ...this.draft, proof };
  }

  accept(): void {
    if (this.acceptEnabled) {
      this.save(this.draft);
    }
  }

  decline(): void {
    this.confirmationService
      // The shared confirm dialog reads its title as a status: 'warn' gives the red Warning header.
      .confirm('warn', this.text?.cannotContinue, this.text?.confirmDecline, this.text?.close)
      .subscribe((confirmed) => {
        if (confirmed) {
          this.save(declineAll(this.draft), false);
        }
      });
  }

  retry(): void {
    const action = this.retryAction;
    this.retryAction = null;
    this.failed = false;
    if (action) {
      action();
    }
  }

  close(): void {
    if (this.step === 'DONE') {
      this.done();
      return;
    }
    this.closeDialog(noDecisionResult());
  }

  /** The SMS line of the confirmation (FR-014). */
  get smsMessage(): string {
    const c = this.confirmation;
    if (!c) {
      return '';
    }
    const status = c.notification ? c.notification.status : 'NOT_REQUESTED';
    let key = 'smsNoPhone';
    if (c.hasPhone) {
      key = { SENT: 'smsSent', QUEUED: 'smsQueued', FAILED: 'smsFailed', NOT_REQUESTED: 'smsFailed' }[status];
    }
    const phone = c.notification?.maskedPhone || maskPhone(this.options.patientPhone);
    return ((this.text?.[key] as string) || '').replace('{phone}', phone);
  }

  /** Upload state of the current recording, shown next to it. */
  get recordingUpload(): RecordingUploadState {
    const clip = this.draft.proof.voiceClip;
    if (!clip) {
      return 'IDLE';
    }
    if (this.evidenceIds.has(clip)) {
      return 'DONE';
    }
    if (clip === this.uploadingClip) {
      return 'UPLOADING';
    }
    return clip === this.failedClip ? 'FAILED' : 'IDLE';
  }

  /** Sends the recorded agreement to the server now; Accept then reuses its evidence id. */
  uploadRecording(): void {
    const clip = this.draft.proof.voiceClip;
    if (!clip || this.recordingUpload === 'UPLOADING' || this.recordingUpload === 'DONE') {
      return;
    }
    this.uploadingClip = clip;
    this.failedClip = null;
    this.uploadAll([{ type: 'VOICE_CLIP', blob: clip, durationSec: this.draft.proof.voiceDurationSec ?? null }]).subscribe({
      next: () => {
        this.uploadingClip = null;
        this.cdr.markForCheck();
      },
      error: () => {
        this.uploadingClip = null;
        this.failedClip = clip;
        this.cdr.markForCheck();
      },
    });
  }

  /** Closes the confirmation with the saved consent's result. */
  done(): void {
    if (this.doneResult) {
      this.closeDialog(this.doneResult);
    }
  }

  private save(draft: ConsentDraft, withEvidence = true): void {
    if (this.saving || !draft.notice) {
      return;
    }
    const notice = draft.notice;
    const evidence = withEvidence ? this.evidenceItems(draft) : [];
    this.saving = true;
    this.failed = false;
    this.cdr.markForCheck();
    this.uploadAll(evidence)
      .pipe(
        switchMap((evidenceIds) => {
          const request = toSaveRequest(
            draft,
            this.consentContext.context(),
            this.options.beneficiaryRegId,
            evidenceIds,
            [],
            this.options.eventType || 'NEW',
            {
              declarationText: withEvidence ? this.declaration : undefined,
              notifyPhone: this.options.patientPhone || null,
            }
          );
          return this.consentApi
            .saveConsent(request, draft.idempotencyKey)
            .pipe(map((response) => ({ request, response })));
        })
      )
      .subscribe({
        next: ({ request, response }) => {
          this.saving = false;
          const result: ConsentDialogResult = {
            outcome: outcomeOf(notice.purposes, draft.decisions),
            consentId: response.consentId,
            consentingParty: request.consentingParty,
            decisions: decisionList(notice.purposes, draft.decisions),
            syncStatus: response.syncStatus,
          };
          // Declines, blocked and nothing-granted saves close at once, as before feature 003.
          if (result.outcome === 'BLOCKED' || !result.decisions.some((d) => d.granted)) {
            this.closeDialog(result);
            return;
          }
          this.doneResult = result;
          this.confirmation = {
            consentId: response.consentId,
            capturedAt: request.capturedAt,
            syncStatus: response.syncStatus,
            grievance: notice.grievance || null,
            grievanceText: grievanceText(notice, this.text?.defaultGrievance || ''),
            notification: response.notification || null,
            hasPhone: !!request.notify,
          };
          this.step = 'DONE';
          this.cdr.markForCheck();
        },
        error: (err: ConsentApiError) => {
          this.saving = false;
          if (err.kind === 'STALE') {
            this.confirmationService.alert(this.text?.staleReload, 'info');
            this.loadNotice(notice.languageCode);
          } else {
            this.fail(() => this.save(draft, withEvidence));
          }
        },
      });
  }

  /** Files to upload before the consent: the recorded agreement (Self-read, Read aloud) or the signed form. */
  private evidenceItems(draft: ConsentDraft): EvidenceItem[] {
    const proof = draft.proof;
    const recorded = ['VOICE_CLIP', 'READ_ALOUD', 'SELF_READ'].indexOf(draft.mode as string) !== -1;
    if (recorded && proof.voiceClip) {
      return [{ type: 'VOICE_CLIP', blob: proof.voiceClip, durationSec: proof.voiceDurationSec ?? null }];
    }
    if (draft.mode === 'SIGNATURE_PHOTO' && proof.signedFormPhoto) {
      return [{ type: 'SIGNED_FORM_PHOTO', blob: proof.signedFormPhoto, durationSec: null }];
    }
    return [];
  }

  /** Uploads files not uploaded yet; resolves to all evidence ids in order. */
  private uploadAll(items: EvidenceItem[]): Observable<string[]> {
    const pending = items.filter((item) => !this.evidenceIds.has(item.blob));
    const uploads = pending.map((item) => {
      if (!this.uploadKeys.has(item.blob)) {
        this.uploadKeys.set(item.blob, uuidV4());
      }
      return from(sha256Hex(item.blob)).pipe(
        switchMap((hash) =>
          this.consentApi.uploadEvidence(
            item.blob,
            item.type,
            hash,
            item.durationSec,
            this.uploadKeys.get(item.blob) as string
          )
        ),
        tap((res) => this.evidenceIds.set(item.blob, res.evidenceId))
      );
    });
    return (uploads.length ? forkJoin(uploads) : of([])).pipe(
      map(() => items.map((item) => this.evidenceIds.get(item.blob) as string))
    );
  }

  private fail(retryAction: () => void): void {
    this.failed = true;
    this.retryAction = retryAction;
    this.cdr.markForCheck();
  }
}
