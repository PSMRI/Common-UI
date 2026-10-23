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

import { ConsentContextType, ConsentMode } from './consent.models';

// Per-project consent configuration (feature 002, data-model.md). Shared by both UI tracks.

export type OtpTarget = 'PATIENT' | 'GUARDIAN';
export type PhotoRequirement = 'BOTH' | 'SIGNED_FORM_ONLY';

/** Settings of one allowed mode; absent fields use the feature 001 defaults. */
export interface ModeSettings {
  /** VOICE_CLIP only, 10–60, default 30. */
  voiceMinSeconds?: number;
  /** OTP only, default PATIENT. */
  otpTarget?: OtpTarget;
  /** WITNESSED only, default true. */
  witnessRelationshipRequired?: boolean;
  /** SIGNATURE_PHOTO only, default BOTH. */
  photos?: PhotoRequirement;
}

export interface ModeConfig {
  mode: ConsentMode;
  /** 1-based display order. */
  rank: number;
  settings: ModeSettings;
}

export interface PurposeConfig {
  purposeCode: string;
  shown: boolean;
  rank: number;
  /** May only raise the central mandatory flag, never lower it. */
  isMandatory: boolean;
}

export interface GuardianConfig {
  enabled: boolean;
  /** Guardian step when the patient's age is below this. */
  ageThreshold: number;
}

/** One project's consent rules for one context. */
export interface ContextConfig {
  /** false: the legacy consent pop-up is used (FR-023). */
  enabled: boolean;
  mandatory: boolean;
  /** Allowed modes only. */
  modes: ModeConfig[];
  defaultMode: ConsentMode | null;
  /** Empty: the central purpose list as it is. */
  purposes: PurposeConfig[];
  /** Language codes; empty: every published language. */
  languages: string[];
  guardian: GuardianConfig;
}

/** Admin view of one project. */
export interface ProjectConsentConfig {
  projectId: number;
  projectName: string;
  serviceProviderId: number;
  /** 0: never saved. */
  version: number;
  savedBy: string | null;
  savedAt: string | null;
  registration: ContextConfig;
  /** null: same as registration. */
  revisit: ContextConfig | null;
}

export type ConsentConfigSource = 'PROJECT' | 'DEFAULT' | 'SESSION_CACHE';

/** Field-app view: one context, already resolved. projectId and version are null for the default. */
export interface ResolvedConsentConfig {
  projectId: number | null;
  version: number | null;
  context: ConsentContextType;
  config: ContextConfig;
  source: ConsentConfigSource;
}

export interface ConsentConfigMasters {
  modes: { mode: ConsentMode; name: string }[];
  purposes: { purposeCode: string; name: string; isMandatory: boolean }[];
  languages: { languageCode: string; languageName: string; hasNotice: boolean }[];
  /** Configured projects only. */
  projects: { projectId: number; version: number }[];
}

/** The configuration could not be loaded and no copy from this login session exists (FR-020). */
export class ConsentConfigUnavailable extends Error {
  constructor() {
    super('Consent configuration unavailable');
    this.name = 'ConsentConfigUnavailable';
    Object.setPrototypeOf(this, ConsentConfigUnavailable.prototype);
  }
}
