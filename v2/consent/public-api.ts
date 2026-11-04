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

// Consent management public API for MMU-UI (contracts/ui-components.md).
export * from '../../src/consent/core/consent.models';
export { isConsentFeatureEnabled } from '../../src/consent/core/consent-feature';
export { consentRefusalFrom } from '../../src/consent/core/consent-refusal';
export { ConsentApiService } from '../../src/consent/core/consent-api.service';
export { ConsentDialogService } from './consent-dialog.service';
export { ConsentDialogComponent } from './consent-dialog/consent-dialog.component';
// Feature 003: consent for patients who are already registered.
export {
  RevisitConsentService,
  RevisitConsentResult,
  RevisitPatient,
  eventTypeFor,
} from './revisit-consent.service';
// Feature 002: per-project consent configuration.
export * from '../../src/consent/core/consent-config.models';
export { DEFAULT_CONTEXT_CONFIG } from '../../src/consent/core/consent-config';
export { ConsentConfigService } from '../../src/consent/core/consent-config.service';
