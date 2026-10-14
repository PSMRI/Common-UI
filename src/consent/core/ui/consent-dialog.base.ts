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

import { Directive, DoCheck, OnDestroy, OnInit, inject } from '@angular/core';
import { forkJoin, from, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { SetLanguageComponent } from 'src/app/app-modules/core/components/set-language.component';
import { ConfirmationService } from 'src/app/app-modules/core/services/confirmation.service';
import { HttpServiceService } from 'src/app/app-modules/core/services/http-service.service';
import { ConsentApiService } from '../consent-api.service';
import { ConsentContextService } from '../consent-context.service';
import {
  canAccept,
  createDraft,
  declineAll,
  decisionList,
  noDecisionResult,
  outcomeOf,
  toSaveRequest,
  withNotice,
} from '../consent-draft';
import {
  ConsentApiError,
  ConsentDialogOptions,
  ConsentDialogResult,
  ConsentDraft,
  ConsentMode,
  EvidenceType,
  ProofDraft,
} from '../consent.models';
import { sha256Hex, uuidV4 } from '../evidence.util';

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
  step: 'LANGUAGE' | 'DECIDE' = 'LANGUAGE';
  loadingNotice = false;
  saving = false;
  failed = false;
  private retryAction: (() => void) | null = null;
  // Keyed by the captured file, so a retry re-uploads only failed files and a retake uploads anew.
  private evidenceIds = new WeakMap<Blob, string>();
  private uploadKeys = new WeakMap<Blob, string>();

  /** Options passed by the caller through the track's dialog data token. */
  abstract options: ConsentDialogOptions;

  protected consentApi = inject(ConsentApiService);
  protected consentContext = inject(ConsentContextService);
  protected confirmationService = inject(ConfirmationService);
  httpServiceService = inject(HttpServiceService);

  /** Closes the track's dialog with the result. */
  protected abstract closeDialog(result: ConsentDialogResult): void;

  ngOnInit(): void {
    this.assignSelectedLanguage();
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
    return canAccept(this.draft, false, this.saving);
  }

  loadNotice(languageCode: string): void {
    this.loadingNotice = true;
    this.failed = false;
    this.consentApi.getNotice('REGISTRATION', languageCode).subscribe({
      next: (notice) => {
        this.draft = withNotice(this.draft, notice);
        this.step = 'DECIDE';
        this.loadingNotice = false;
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

  onMode(mode: ConsentMode): void {
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
      .confirm(this.text?.title, this.text?.cannotContinue, this.text?.confirmDecline, this.text?.close)
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
    this.closeDialog(noDecisionResult());
  }

  private save(draft: ConsentDraft, withEvidence = true): void {
    if (this.saving || !draft.notice) {
      return;
    }
    const notice = draft.notice;
    const evidence = withEvidence ? this.evidenceItems(draft) : [];
    this.saving = true;
    this.failed = false;
    this.uploadAll(evidence)
      .pipe(
        switchMap((evidenceIds) => {
          const request = toSaveRequest(
            draft,
            this.consentContext.context(),
            this.options.beneficiaryRegId,
            evidenceIds,
            []
          );
          return this.consentApi
            .saveConsent(request, draft.idempotencyKey)
            .pipe(map((response) => ({ request, response })));
        })
      )
      .subscribe({
        next: ({ request, response }) => {
          this.saving = false;
          this.closeDialog({
            outcome: outcomeOf(notice.purposes, draft.decisions),
            consentId: response.consentId,
            consentingParty: request.consentingParty,
            decisions: decisionList(notice.purposes, draft.decisions),
            syncStatus: response.syncStatus,
          });
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

  /** Files to upload before the consent: voice clip, or patient photo + signed form photo. */
  private evidenceItems(draft: ConsentDraft): EvidenceItem[] {
    const proof = draft.proof;
    if (draft.mode === 'VOICE_CLIP' && proof.voiceClip) {
      return [{ type: 'VOICE_CLIP', blob: proof.voiceClip, durationSec: proof.voiceDurationSec ?? null }];
    }
    if (draft.mode === 'SIGNATURE_PHOTO' && proof.patientPhoto && proof.signedFormPhoto) {
      return [
        { type: 'PATIENT_PHOTO', blob: proof.patientPhoto, durationSec: null },
        { type: 'SIGNED_FORM_PHOTO', blob: proof.signedFormPhoto, durationSec: null },
      ];
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
  }
}
