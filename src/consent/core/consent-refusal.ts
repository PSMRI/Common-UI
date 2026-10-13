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

import { HttpErrorResponse } from '@angular/common/http';
import { ConsentRefusal, RefusalAction, RefusalReason } from './consent.models';

const REASONS: RefusalReason[] = [
  'CONSENT_NOT_FOUND',
  'CONSENT_DENIED',
  'CONSENT_WITHDRAWN',
  'CONSENT_EXPIRED',
  'RECONSENT_REQUIRED',
  'GUARDIAN_REQUIRED',
];

const OPEN_CONSENT_REASONS: RefusalReason[] = [
  'CONSENT_NOT_FOUND',
  'RECONSENT_REQUIRED',
  'GUARDIAN_REQUIRED',
];

/** Reads a consent refusal from a 403 response; null for anything else (FR-029). */
export function consentRefusalFrom(err: unknown): ConsentRefusal | null {
  if (!(err instanceof HttpErrorResponse) || err.status !== 403) {
    return null;
  }
  const data = err.error?.data;
  const reason = data?.reason as RefusalReason;
  if (REASONS.indexOf(reason) === -1) {
    return null;
  }
  let action: RefusalAction = null;
  if (data.crossFacility === true) {
    action = 'REQUEST_ACCESS';
  } else if (OPEN_CONSENT_REASONS.indexOf(reason) !== -1) {
    action = 'OPEN_CONSENT';
  }
  return {
    reason,
    messageKey: 'refusal' + reason,
    action,
    purposeCode: data.purposeCode || null,
  };
}
