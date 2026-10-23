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

// Synthetic consent-configuration data for specs (feature 002). Never import from production code.
import {
  ConsentConfigMasters,
  ContextConfig,
  ProjectConsentConfig,
  ResolvedConsentConfig,
} from '../consent-config.models';
import { ConsentContextType } from '../consent.models';

export function mockFullContext(): ContextConfig {
  return {
    enabled: true,
    mandatory: true,
    modes: [
      { mode: 'WITNESSED', rank: 2, settings: { witnessRelationshipRequired: false } },
      { mode: 'OTP', rank: 1, settings: { otpTarget: 'PATIENT' } },
    ],
    defaultMode: 'OTP',
    purposes: [
      { purposeCode: 'P-REG', shown: true, rank: 1, isMandatory: true },
      { purposeCode: 'P-REM', shown: true, rank: 2, isMandatory: true },
      { purposeCode: 'P-TRT', shown: true, rank: 3, isMandatory: true },
      { purposeCode: 'P-SHR', shown: false, rank: 4, isMandatory: false },
    ],
    languages: ['en', 'hi'],
    guardian: { enabled: true, ageThreshold: 18 },
  };
}

export function mockSingleContext(): ContextConfig {
  return {
    ...mockFullContext(),
    modes: [{ mode: 'WITNESSED', rank: 1, settings: { witnessRelationshipRequired: false } }],
    defaultMode: 'WITNESSED',
    purposes: [],
    languages: [],
  };
}

export function mockResolvedConfig(
  variant: 'full' | 'single' | 'off',
  context: ConsentContextType = 'REGISTRATION'
): ResolvedConsentConfig {
  if (variant === 'single') {
    return { projectId: 7, version: 1, context, config: mockSingleContext(), source: 'PROJECT' };
  }
  if (variant === 'off') {
    return { projectId: 9, version: 2, context, config: { ...mockFullContext(), enabled: false }, source: 'PROJECT' };
  }
  return { projectId: 12, version: 4, context, config: mockFullContext(), source: 'PROJECT' };
}

export function mockProjectConfig(): ProjectConsentConfig {
  return {
    projectId: 12,
    projectName: 'Test Project A',
    serviceProviderId: 1,
    version: 4,
    savedBy: 'padmin1',
    savedAt: '2026-10-20T11:02:00+05:30',
    registration: mockFullContext(),
    revisit: null,
  };
}

export function mockMasters(): ConsentConfigMasters {
  return {
    modes: [
      { mode: 'SELF_READ', name: 'Patient read it' },
      { mode: 'READ_ALOUD', name: 'Read aloud to patient' },
      { mode: 'VOICE_CLIP', name: 'Voice recording' },
      { mode: 'WITNESSED', name: 'Witnessed' },
      { mode: 'SIGNATURE_PHOTO', name: 'Signature / thumb + photo' },
      { mode: 'OTP', name: "OTP to patient's phone" },
    ],
    purposes: [
      { purposeCode: 'P-REG', name: 'Registration', isMandatory: true },
      { purposeCode: 'P-REM', name: 'SMS reminders', isMandatory: false },
    ],
    languages: [
      { languageCode: 'en', languageName: 'English', hasNotice: true },
      { languageCode: 'kn', languageName: 'Kannada', hasNotice: false },
    ],
    projects: [{ projectId: 12, version: 4 }],
  };
}
