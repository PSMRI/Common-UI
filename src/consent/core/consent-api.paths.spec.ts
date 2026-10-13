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

import { CONSENT_PATHS } from './consent-api.paths';

describe('CONSENT_PATHS', () => {
  it('builds notice paths with encoded query values', () => {
    expect(CONSENT_PATHS.noticeLanguages('REGISTRATION')).toBe(
      '/consent/v1/notices/active/languages?context=REGISTRATION'
    );
    expect(CONSENT_PATHS.activeNotice('REGISTRATION', 'hi')).toBe(
      '/consent/v1/notices/active?context=REGISTRATION&lang=hi'
    );
    expect(CONSENT_PATHS.activeNotice('A B', 'x&y')).toBe(
      '/consent/v1/notices/active?context=A%20B&lang=x%26y'
    );
  });

  it('has fixed write paths', () => {
    expect(CONSENT_PATHS.consents).toBe('/consent/v1/consents');
    expect(CONSENT_PATHS.evidence).toBe('/consent/v1/evidence');
    expect(CONSENT_PATHS.otpChallenges).toBe('/consent/v1/otp/challenges');
  });

  it('builds id-based paths', () => {
    expect(CONSENT_PATHS.otpVerify('c/1')).toBe(
      '/consent/v1/otp/challenges/c%2F1/verify'
    );
    expect(CONSENT_PATHS.principalConsents(42)).toBe(
      '/consent/v1/principals/42/consents'
    );
    expect(CONSENT_PATHS.pendingActions(42)).toBe(
      '/consent/v1/principals/42/pending-actions'
    );
    expect(CONSENT_PATHS.preferences(42)).toBe(
      '/consent/v1/principals/42/preferences'
    );
    expect(CONSENT_PATHS.withdrawals(42)).toBe(
      '/consent/v1/principals/42/withdrawals'
    );
    expect(CONSENT_PATHS.accessGrants(42)).toBe(
      '/consent/v1/principals/42/access-grants?status=ACTIVE,PENDING'
    );
    expect(CONSENT_PATHS.approveAccess('g1')).toBe(
      '/consent/v1/access-grants/g1/approve'
    );
    expect(CONSENT_PATHS.revokeAccess('g1')).toBe(
      '/consent/v1/access-grants/g1/revoke'
    );
  });
});
