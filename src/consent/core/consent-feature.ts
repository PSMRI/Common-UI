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

import { environment } from 'src/environments/environment';

/** Shape of the optional `consentManagement` block in a host environment (research R5). */
export interface ConsentEnvironment {
  enabled?: boolean;
  apiBase?: string;
}

// Hosts that never add the key must still compile, so the key is read through a cast.
function consentEnvironment(): ConsentEnvironment | undefined {
  return (environment as { consentManagement?: ConsentEnvironment })
    .consentManagement;
}

/** True only when the host sets `consentManagement.enabled` to boolean true. */
export function isConsentFeatureEnabled(): boolean {
  return consentEnvironment()?.enabled === true;
}

/** Consent-API base URL without a trailing slash, or '' when not configured. */
export function consentApiBase(): string {
  const base = consentEnvironment()?.apiBase;
  return typeof base === 'string' ? base.replace(/\/+$/, '') : '';
}
