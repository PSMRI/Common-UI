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

import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { ConsentMode, Notice, ProofDraft } from '../consent.models';
import { CapturedMedia } from './media-capture.base';

export const CONSENT_MODES: { mode: ConsentMode; key: string }[] = [
  { mode: 'SELF_READ', key: 'modeSelfRead' },
  { mode: 'READ_ALOUD', key: 'modeReadAloud' },
  { mode: 'VOICE_CLIP', key: 'modeVoiceClip' },
  { mode: 'WITNESSED', key: 'modeWitnessed' },
  { mode: 'SIGNATURE_PHOTO', key: 'modeSignaturePhoto' },
  { mode: 'OTP', key: 'modeOtp' },
];

/** Consent mode picker and the proof each mode needs, shared by both tracks (FR-013 to FR-016). */
@Directive()
export abstract class ProofStepBase {
  @Input() text: any;
  @Input() notice: Notice | null = null;
  @Input() audioPlayedToEnd = false;
  @Input() mode: ConsentMode | null = null;
  @Input() patientPhone: string | null = null;
  @Output() modeChange = new EventEmitter<ConsentMode | null>();
  @Output() proofChange = new EventEmitter<ProofDraft>();

  readonly modes = CONSENT_MODES;
  proof: ProofDraft = {};

  /** Modes are single-choice checkboxes: ticking one picks it, unticking the picked one clears it. */
  toggleMode(mode: ConsentMode, checked: boolean): void {
    if (checked) {
      this.selectMode(mode);
    } else if (this.mode === mode) {
      this.selectMode(null);
    }
  }

  selectMode(mode: ConsentMode | null): void {
    this.proof = {};
    this.modeChange.emit(mode);
    this.proofChange.emit(this.proof);
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

  private update(change: Partial<ProofDraft>): void {
    this.proof = { ...this.proof, ...change };
    this.proofChange.emit(this.proof);
  }
}
