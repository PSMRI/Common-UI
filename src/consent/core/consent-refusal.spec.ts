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
import { consentRefusalFrom } from './consent-refusal';
import { mock403 } from './testing/consent.mock';

describe('consentRefusalFrom', () => {
  it('ignores non-HTTP errors and non-403 statuses', () => {
    expect(consentRefusalFrom(new Error('x'))).toBeNull();
    expect(consentRefusalFrom(new HttpErrorResponse({ status: 500 }))).toBeNull();
  });

  it('ignores a 403 without a known reason', () => {
    expect(consentRefusalFrom(new HttpErrorResponse({ status: 403, error: null }))).toBeNull();
    expect(consentRefusalFrom(mock403('SOMETHING_ELSE'))).toBeNull();
  });

  it('offers to open consent for missing, re-consent and guardian reasons', () => {
    ['CONSENT_NOT_FOUND', 'RECONSENT_REQUIRED', 'GUARDIAN_REQUIRED'].forEach((reason) => {
      const r = consentRefusalFrom(mock403(reason));
      expect(r).toEqual({
        reason: reason as never,
        messageKey: 'refusal' + reason,
        action: 'OPEN_CONSENT',
        purposeCode: 'P-SHR',
      });
    });
  });

  it('has no action for denied, withdrawn and expired', () => {
    ['CONSENT_DENIED', 'CONSENT_WITHDRAWN', 'CONSENT_EXPIRED'].forEach((reason) => {
      expect(consentRefusalFrom(mock403(reason))!.action).toBeNull();
    });
  });

  it('points to requesting access for another facility', () => {
    const r = consentRefusalFrom(mock403('CONSENT_NOT_FOUND', true));
    expect(r!.action).toBe('REQUEST_ACCESS');
  });

  it('returns a null purpose code when absent', () => {
    const err = new HttpErrorResponse({
      status: 403,
      error: { data: { reason: 'CONSENT_DENIED' } },
    });
    expect(consentRefusalFrom(err)!.purposeCode).toBeNull();
  });
});
