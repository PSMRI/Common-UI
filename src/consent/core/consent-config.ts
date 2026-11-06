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

// Per-project consent configuration rules (feature 002, research R7). Pure functions, no Angular.
import {
  ContextConfig,
  ModeSettings,
  ResolvedConsentConfig,
} from './consent-config.models';
import {
  ConsentContextType,
  ConsentMode,
  NoticeLanguage,
  Purpose,
} from './consent.models';
import { ACTIVE_CONSENT_MODES } from './ui/proof-step.base';

/** Feature 001 proof rules, used when a mode has no setting. */
export const DEFAULT_MODE_SETTINGS: Required<ModeSettings> = {
  voiceMinSeconds: 30,
  otpTarget: 'PATIENT',
  witnessRelationshipRequired: true,
  photos: 'BOTH',
};

/**
 * No project configuration (fetchConsentConfig returned null): nothing is invented, so consent is
 * off for the project and registration keeps the old consent pop-up until an admin configures it.
 */
export const NOT_CONFIGURED_CONTEXT: ContextConfig = {
  enabled: false,
  mandatory: false,
  modes: [],
  defaultMode: null,
  purposes: [],
  languages: [],
  guardian: { enabled: false, ageThreshold: 18 },
};

export function notConfiguredConfig(context: ConsentContextType): ResolvedConsentConfig {
  return {
    projectId: null,
    version: null,
    context,
    config: NOT_CONFIGURED_CONTEXT,
    source: 'NOT_CONFIGURED',
  };
}

/** A mode saved by an older configuration as offered today (feature 003): voice clip is Read aloud. */
export function activeMode(mode: ConsentMode | null): ConsentMode | null {
  return mode === 'VOICE_CLIP' ? 'READ_ALOUD' : mode;
}

/** Exactly the configured modes in display order; unknown and retired modes are dropped. */
export function allowedModes(config: ContextConfig): { mode: ConsentMode; key: string }[] {
  const ordered = (config.modes || []).slice().sort((a, b) => a.rank - b.rank);
  const result: { mode: ConsentMode; key: string }[] = [];
  ordered.forEach((m) => {
    const found = ACTIVE_CONSENT_MODES.find((c) => c.mode === activeMode(m.mode));
    if (found && result.indexOf(found) === -1) {
      result.push(found);
    }
  });
  return result;
}

/** The chosen mode's settings over the feature 001 defaults. */
export function modeSettings(config: ContextConfig, mode: ConsentMode | null): Required<ModeSettings> {
  const found = (config.modes || []).find((m) => m.mode === mode);
  return { ...DEFAULT_MODE_SETTINGS, ...(found ? found.settings : {}) };
}

/**
 * The project's purposes in its order (FR-017). Hidden or unlisted purposes are dropped unless the
 * central list makes them mandatory; the project can make a purpose mandatory but never optional.
 */
export function applyPurposes(purposes: Purpose[], config: ContextConfig): Purpose[] {
  const rules = config.purposes || [];
  if (rules.length === 0) {
    return purposes;
  }
  const rank = (code: string): number => {
    const rule = rules.find((r) => r.purposeCode === code);
    return rule ? rule.rank : Number.MAX_SAFE_INTEGER;
  };
  return purposes
    .filter((p) => {
      const rule = rules.find((r) => r.purposeCode === p.purposeCode);
      return p.isMandatory || (!!rule && rule.shown);
    })
    .map((p) => {
      const rule = rules.find((r) => r.purposeCode === p.purposeCode);
      return { ...p, isMandatory: p.isMandatory || (!!rule && rule.isMandatory) };
    })
    .sort((a, b) => rank(a.purposeCode) - rank(b.purposeCode));
}

/** Published languages the project offers, in the server's order; none configured means all. */
export function allowedLanguages(languages: NoticeLanguage[], config: ContextConfig): NoticeLanguage[] {
  const codes = config.languages || [];
  return codes.length === 0
    ? languages
    : languages.filter((l) => codes.indexOf(l.languageCode) !== -1);
}
