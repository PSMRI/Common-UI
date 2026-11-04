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

import { ChangeDetectorRef, Directive, EventEmitter, Input, NgZone, OnDestroy, Output, inject } from '@angular/core';
import { AGREEMENT_MAX_SECONDS, AGREEMENT_MIN_SECONDS, READ_ALOUD_MAX_SECONDS } from '../consent-draft';
import { ConsentMode, Notice, ProofDraft, RecordingUploadState } from '../consent.models';
import { canSpeak, speak, stopSpeaking } from '../speech.util';
import { CapturedMedia } from './media-capture.base';

export const CONSENT_MODES: { mode: ConsentMode; key: string }[] = [
  { mode: 'SELF_READ', key: 'modeSelfRead' },
  { mode: 'READ_ALOUD', key: 'modeReadAloud' },
  { mode: 'VOICE_CLIP', key: 'modeVoiceClip' },
  { mode: 'WITNESSED', key: 'modeWitnessed' },
  { mode: 'SIGNATURE_PHOTO', key: 'modeSignaturePhoto' },
  { mode: 'OTP', key: 'modeOtp' },
];

/**
 * Feature 003: voice clip merged into Read aloud (clarification Q5). The signature mode stays but takes
 * only the signed form photo, never a photo of the patient's face (FR-011).
 */
export const RETIRED_MODES: ConsentMode[] = ['VOICE_CLIP'];

/** The modes offered from feature 003 on, in display order. */
export const ACTIVE_CONSENT_MODES = CONSENT_MODES.filter(
  (m) => RETIRED_MODES.indexOf(m.mode) === -1
);

/** Consent mode picker and the proof each mode needs, shared by both tracks (FR-013 to FR-016). */
@Directive()
export abstract class ProofStepBase implements OnDestroy {
  @Input() text: any;
  @Input() notice: Notice | null = null;
  @Input() audioPlayedToEnd = false;
  @Input() mode: ConsentMode | null = null;
  @Input() patientPhone: string | null = null;
  @Output() modeChange = new EventEmitter<ConsentMode | null>();
  @Output() proofChange = new EventEmitter<ProofDraft>();
  /** Read aloud: the patient answered No to the declaration. */
  @Output() declarationRefused = new EventEmitter<void>();
  /** Feature 003: "Upload to server" pressed for the recorded agreement; the dialog uploads it. */
  @Output() uploadRecording = new EventEmitter<void>();
  @Input() recordingUpload: RecordingUploadState = 'IDLE';

  /** Feature 002: the project's allowed modes in order; all six by default. */
  @Input() modes: { mode: ConsentMode; key: string }[] = ACTIVE_CONSENT_MODES;
  proof: ProofDraft = {};

  /** Feature 003: the declaration to show and agree to (patient or representative wording). */
  @Input() declaration = '';
  /** Feature 003: language of the declaration, for the browser voice. */
  @Input() languageCode = 'en';
  /** Feature 003: configured declaration audio for Read aloud. */
  @Input() declarationAudioUrl: string | null = null;

  readonly agreementMinSeconds = AGREEMENT_MIN_SECONDS;
  readonly agreementMaxSeconds = AGREEMENT_MAX_SECONDS;
  readonly readAloudMaxSeconds = READ_ALOUD_MAX_SECONDS;
  speaking = false;
  audioFailed = false;
  private utterance: SpeechSynthesisUtterance | null = null;
  // Zard's dialog container is OnPush: speech callbacks must mark this view for checking.
  protected cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

  /** Read aloud can play the declaration: configured audio that loads, or the browser voice. */
  get canPlayDeclaration(): boolean {
    return (!!this.declarationAudioUrl && !this.audioFailed) || this.speechAvailable();
  }

  /** The browser voice is available; a method so tests can switch it off. */
  speechAvailable(): boolean {
    return canSpeak();
  }

  ngOnDestroy(): void {
    this.stopDeclaration();
  }

  /** Modes are single-choice checkboxes: ticking one picks it, unticking the picked one clears it. */
  toggleMode(mode: ConsentMode, checked: boolean): void {
    if (checked) {
      this.selectMode(mode);
    } else if (this.mode === mode) {
      this.selectMode(null);
    }
  }

  selectMode(mode: ConsentMode | null): void {
    this.stopDeclaration();
    this.proof = {};
    this.modeChange.emit(mode);
    this.proofChange.emit(this.proof);
  }

  setDeclarationAgreed(checked: boolean): void {
    this.update({ declarationAgreed: checked });
  }

  /** Speaks the declaration with the browser voice (configured audio plays in its own element). */
  playDeclaration(): void {
    if (!this.speechAvailable()) {
      return;
    }
    const utterance = speak(this.declaration, this.languageCode, (completed) =>
      this.zone.run(() => this.finishSpeech(utterance, completed))
    );
    this.utterance = utterance;
    this.speaking = true;
  }

  /** Read aloud: the patient's answer when staff ask for consent; No starts the decline. */
  answerDeclaration(agree: boolean): void {
    this.update({ declarationAgreed: agree });
    if (!agree) {
      this.declarationRefused.emit();
    }
  }

  stopDeclaration(): void {
    if (this.utterance) {
      this.utterance = null;
      this.speaking = false;
      stopSpeaking();
    }
  }

  onDeclarationAudioEnded(): void {
    this.update({ declarationPlayed: true });
  }

  onDeclarationAudioError(): void {
    this.audioFailed = true;
  }

  setWorkerConfirmed(checked: boolean): void {
    this.update({ workerConfirmed: checked });
  }

  setWitness(field: 'witnessName' | 'witnessRelationship', value: string): void {
    this.update({ [field]: value });
  }

  onVoice(media: CapturedMedia | null): void {
    this.update({
      voiceClip: media ? media.blob : null,
      voiceDurationSec: media ? media.durationSec : null,
    });
  }

  onPhoto(field: 'patientPhoto' | 'signedFormPhoto', media: CapturedMedia | null): void {
    this.update({ [field]: media ? media.blob : null });
  }

  onOtpVerified(event: { challengeId: string }): void {
    this.update({ otpChallengeId: event.challengeId, otpVerified: true });
  }

  private finishSpeech(utterance: SpeechSynthesisUtterance, completed: boolean): void {
    if (this.utterance !== utterance) {
      return; // stopped or replaced
    }
    this.utterance = null;
    this.speaking = false;
    if (completed) {
      this.update({ declarationPlayed: true });
    }
    this.cdr.markForCheck();
  }

  private update(change: Partial<ProofDraft>): void {
    this.proof = { ...this.proof, ...change };
    this.proofChange.emit(this.proof);
  }
}
