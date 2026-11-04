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
  activeMode,
  allowedLanguages,
  allowedModes,
  applyPurposes,
  DEFAULT_CONTEXT_CONFIG,
  defaultResolvedConfig,
  modeSettings,
} from './consent-config';
import { ContextConfig } from './consent-config.models';
import { ConsentMode } from './consent.models';
import { mockFullContext, mockSingleContext } from './testing/consent-config.mock';
import { mockLanguages, mockPurposes } from './testing/consent.mock';
import { ACTIVE_CONSENT_MODES, CONSENT_MODES, RETIRED_MODES } from './ui/proof-step.base';

describe('consent-config', () => {
  describe('platform default', () => {
    it('allows the four active modes in order with nothing pre-ticked (feature 003)', () => {
      expect(allowedModes(DEFAULT_CONTEXT_CONFIG).map((m) => m.mode)).toEqual([
        'SELF_READ',
        'READ_ALOUD',
        'WITNESSED',
        'SIGNATURE_PHOTO',
        'OTP',
      ]);
      expect(DEFAULT_CONTEXT_CONFIG.defaultMode).toBeNull();
      expect(DEFAULT_CONTEXT_CONFIG.enabled).toBeTrue();
      expect(DEFAULT_CONTEXT_CONFIG.guardian).toEqual({ enabled: true, ageThreshold: 18 });
    });

    it('resolves to the default with no project or version', () => {
      expect(defaultResolvedConfig('REVISIT')).toEqual({
        projectId: null,
        version: null,
        context: 'REVISIT',
        config: DEFAULT_CONTEXT_CONFIG,
        source: 'DEFAULT',
      });
    });
  });

  describe('allowedModes', () => {
    it('returns the configured modes sorted by rank', () => {
      expect(allowedModes(mockFullContext()).map((m) => m.mode)).toEqual(['OTP', 'WITNESSED']);
      expect(allowedModes(mockFullContext())[0].key).toBe('modeOtp');
    });

    it('drops modes the client does not know', () => {
      const config: ContextConfig = {
        ...mockSingleContext(),
        modes: [
          { mode: 'FACE_SCAN' as ConsentMode, rank: 1, settings: {} },
          { mode: 'WITNESSED', rank: 2, settings: {} },
        ],
      };
      expect(allowedModes(config).map((m) => m.mode)).toEqual(['WITNESSED']);
    });

    it('falls back to the active modes when no known mode is left', () => {
      const unknown: ContextConfig = {
        ...mockSingleContext(),
        modes: [{ mode: 'FACE_SCAN' as ConsentMode, rank: 1, settings: {} }],
      };
      expect(allowedModes(unknown)).toEqual(ACTIVE_CONSENT_MODES);
      expect(allowedModes({ ...mockSingleContext(), modes: undefined as never })).toEqual(ACTIVE_CONSENT_MODES);
    });

    it('offers voice clip as Read aloud once and keeps the signature mode (feature 003)', () => {
      const old: ContextConfig = {
        ...mockSingleContext(),
        modes: [
          { mode: 'SIGNATURE_PHOTO', rank: 1, settings: {} },
          { mode: 'VOICE_CLIP', rank: 2, settings: {} },
          { mode: 'READ_ALOUD', rank: 3, settings: {} },
          { mode: 'OTP', rank: 4, settings: {} },
        ],
      };
      expect(allowedModes(old).map((m) => m.mode)).toEqual(['SIGNATURE_PHOTO', 'READ_ALOUD', 'OTP']);
      const clipOnly: ContextConfig = { ...mockSingleContext(), modes: [{ mode: 'VOICE_CLIP', rank: 1, settings: {} }] };
      expect(allowedModes(clipOnly).map((m) => m.mode)).toEqual(['READ_ALOUD']);
    });
  });

  describe('retired modes (feature 003)', () => {
    it('keeps every mode code but offers only the active ones', () => {
      expect(CONSENT_MODES.length).toBe(6);
      expect(RETIRED_MODES).toEqual(['VOICE_CLIP']);
      expect(ACTIVE_CONSENT_MODES.map((m) => m.mode)).toEqual([
        'SELF_READ',
        'READ_ALOUD',
        'WITNESSED',
        'SIGNATURE_PHOTO',
        'OTP',
      ]);
    });

    it('activeMode maps voice clip to Read aloud and keeps the rest', () => {
      expect(activeMode('VOICE_CLIP')).toBe('READ_ALOUD');
      expect(activeMode('SIGNATURE_PHOTO')).toBe('SIGNATURE_PHOTO');
      expect(activeMode('OTP')).toBe('OTP');
      expect(activeMode(null)).toBeNull();
    });
  });

  describe('modeSettings', () => {
    it('uses the feature 001 rules when the mode has no settings', () => {
      expect(modeSettings(DEFAULT_CONTEXT_CONFIG, 'VOICE_CLIP')).toEqual({
        voiceMinSeconds: 30,
        otpTarget: 'PATIENT',
        witnessRelationshipRequired: true,
        photos: 'BOTH',
      });
    });

    it('merges the configured settings over the defaults', () => {
      const settings = modeSettings(mockFullContext(), 'WITNESSED');
      expect(settings.witnessRelationshipRequired).toBeFalse();
      expect(settings.voiceMinSeconds).toBe(30);
    });

    it('returns the defaults for no mode or a mode that is not configured', () => {
      expect(modeSettings(mockFullContext(), null).witnessRelationshipRequired).toBeTrue();
      expect(modeSettings(mockFullContext(), 'VOICE_CLIP').voiceMinSeconds).toBe(30);
      expect(modeSettings({ ...mockFullContext(), modes: undefined as never }, 'OTP').otpTarget).toBe('PATIENT');
    });
  });

  describe('applyPurposes', () => {
    it('returns the central list unchanged when the project lists no purposes', () => {
      const purposes = mockPurposes();
      expect(applyPurposes(purposes, DEFAULT_CONTEXT_CONFIG)).toBe(purposes);
      expect(applyPurposes(purposes, { ...DEFAULT_CONTEXT_CONFIG, purposes: undefined as never })).toBe(purposes);
    });

    it('hides hidden and unlisted optional purposes and orders the rest by rank', () => {
      const codes = applyPurposes(mockPurposes(), mockFullContext()).map((p) => p.purposeCode);
      expect(codes).toEqual(['P-REG', 'P-REM', 'P-TRT']);
    });

    it('raises a purpose to mandatory but never lowers a centrally mandatory one', () => {
      const config: ContextConfig = {
        ...mockFullContext(),
        purposes: [
          { purposeCode: 'P-REM', shown: true, rank: 1, isMandatory: true },
          { purposeCode: 'P-TRT', shown: true, rank: 2, isMandatory: false },
        ],
      };
      const result = applyPurposes(mockPurposes(), config);
      expect(result.find((p) => p.purposeCode === 'P-REM')?.isMandatory).toBeTrue();
      expect(result.find((p) => p.purposeCode === 'P-TRT')?.isMandatory).toBeTrue();
    });

    it('keeps centrally mandatory purposes even when hidden or unlisted, after the listed ones', () => {
      const config: ContextConfig = {
        ...mockFullContext(),
        purposes: [
          { purposeCode: 'P-REG', shown: false, rank: 1, isMandatory: false },
          { purposeCode: 'P-FAM', shown: true, rank: 2, isMandatory: false },
        ],
      };
      expect(applyPurposes(mockPurposes(), config).map((p) => p.purposeCode)).toEqual([
        'P-REG',
        'P-FAM',
        'P-TRT',
      ]);
    });

    it('does not change the input purposes', () => {
      const purposes = mockPurposes();
      applyPurposes(purposes, mockFullContext());
      expect(purposes.find((p) => p.purposeCode === 'P-REM')?.isMandatory).toBeFalse();
    });
  });

  describe('allowedLanguages', () => {
    it('keeps only the configured languages in the server order', () => {
      const config = { ...mockFullContext(), languages: ['as', 'en'] };
      expect(allowedLanguages(mockLanguages(), config).map((l) => l.languageCode)).toEqual(['en', 'as']);
    });

    it('returns every language when none is configured', () => {
      const languages = mockLanguages();
      expect(allowedLanguages(languages, DEFAULT_CONTEXT_CONFIG)).toBe(languages);
      expect(allowedLanguages(languages, { ...DEFAULT_CONTEXT_CONFIG, languages: undefined as never })).toBe(languages);
    });

    it('returns an empty list when no published language is configured', () => {
      expect(allowedLanguages(mockLanguages(), { ...mockFullContext(), languages: ['kn'] })).toEqual([]);
    });
  });
});
