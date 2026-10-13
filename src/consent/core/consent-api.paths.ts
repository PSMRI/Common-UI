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

// Consent-API paths, appended to consentApiBase() (research R5).
export const CONSENT_PATHS = {
  noticeLanguages: (context: string) =>
    `/consent/v1/notices/active/languages?context=${encodeURIComponent(context)}`,
  activeNotice: (context: string, lang: string) =>
    `/consent/v1/notices/active?context=${encodeURIComponent(
      context
    )}&lang=${encodeURIComponent(lang)}`,
  consents: '/consent/v1/consents',
  evidence: '/consent/v1/evidence',
  otpChallenges: '/consent/v1/otp/challenges',
  otpVerify: (challengeId: string) =>
    `/consent/v1/otp/challenges/${encodeURIComponent(challengeId)}/verify`,
  principalConsents: (benRegId: number) =>
    `/consent/v1/principals/${benRegId}/consents`,
  pendingActions: (benRegId: number) =>
    `/consent/v1/principals/${benRegId}/pending-actions`,
  preferences: (benRegId: number) =>
    `/consent/v1/principals/${benRegId}/preferences`,
  withdrawals: (benRegId: number) =>
    `/consent/v1/principals/${benRegId}/withdrawals`,
  accessGrants: (benRegId: number) =>
    `/consent/v1/principals/${benRegId}/access-grants?status=ACTIVE,PENDING`,
  approveAccess: (grantId: string) =>
    `/consent/v1/access-grants/${encodeURIComponent(grantId)}/approve`,
  revokeAccess: (grantId: string) =>
    `/consent/v1/access-grants/${encodeURIComponent(grantId)}/revoke`,
};
