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

export const CONSENT_MODES: { mode: ConsentMode; key: string }[] = [
  { mode: 'SELF_READ', key: 'modeSelfRead' },
  { mode: 'READ_ALOUD', key: 'modeReadAloud' },
  { mode: 'VOICE_CLIP', key: 'modeVoiceClip' },
  { mode: 'WITNESSED', key: 'modeWitnessed' },
  { mode: 'SIGNATURE_PHOTO', key: 'modeSignaturePhoto' },
  { mode: 'OTP', key: 'modeOtp' },
];

/** Consent mode picker and proof capture shared by both tracks (FR-013, FR-014). */
@Directive()
export abstract class ProofStepBase {
  @Input() text: any;
  @Input() notice: Notice | null = null;
  @Input() audioPlayedToEnd = false;
  @Input() mode: ConsentMode | null = null;
  @Output() modeChange = new EventEmitter<ConsentMode>();
  @Output() proofChange = new EventEmitter<ProofDraft>();

  readonly modes = CONSENT_MODES;

  selectMode(mode: unknown): void {
    this.modeChange.emit(mode as ConsentMode);
    this.proofChange.emit({});
  }
}
