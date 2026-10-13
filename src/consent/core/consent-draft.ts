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

// Pure consent-dialog rules shared by both UI tracks (data-model.md). No Angular imports.
import {
  ConsentCaptureContext,
  ConsentDraft,
  ConsentMode,
  DialogOutcome,
  GuardianDraft,
  GuardianNeedInput,
  Notice,
  NoticeLanguage,
  ProofContext,
  ProofDraft,
  Purpose,
  SaveConsentRequest,
} from './consent.models';
import { isVoiceDurationValid, uuidV4 } from './evidence.util';

/** Right-to-left notice languages not offered in this release (FR-002). */
export const RTL_LANGUAGE_CODES = ['ur', 'ks', 'sd'];

const MAX_TEXT = 100;
const INDIAN_MOBILE = /^[6-9]\d{9}$/;

export function createDraft(): ConsentDraft {
  return {
    languageCode: null,
    notice: null,
    noticeReadComplete: false,
    audioPlayedToEnd: false,
    decisions: {},
    mode: null,
    proof: {},
    guardian: null,
    idempotencyKey: uuidV4(),
  };
}

/** A new notice (first load or language change) resets reading, switches and proof (FR-006, FR-010). */
export function withNotice(draft: ConsentDraft, notice: Notice): ConsentDraft {
  const decisions: { [code: string]: boolean } = {};
  notice.purposes.forEach((p) => (decisions[p.purposeCode] = false));
  return {
    ...draft,
    languageCode: notice.languageCode,
    notice,
    noticeReadComplete: false,
    audioPlayedToEnd: false,
    decisions,
    proof: {},
    idempotencyKey: uuidV4(),
  };
}

export function sortPurposes(purposes: Purpose[]): Purpose[] {
  return purposes
    .filter((p) => p.isMandatory)
    .concat(purposes.filter((p) => !p.isMandatory));
}

export function filterRtl(languages: NoticeLanguage[]): NoticeLanguage[] {
  return languages.filter(
    (l) => RTL_LANGUAGE_CODES.indexOf(l.languageCode) === -1
  );
}

/** Whole years between an ISO date of birth (YYYY-MM-DD…) and today, in local time. */
export function ageInYears(dob: string, today: Date): number {
  const parts = dob.substring(0, 10).split('-').map(Number);
  const birth = new Date(parts[0], parts[1] - 1, parts[2]);
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) {
    age--;
  }
  return age;
}

/** FR-017: guardian needed for disability, for age under 18 by DOB, or by the registrar's tick when no DOB is known. */
export function needsGuardian(input: GuardianNeedInput, today: Date): boolean {
  if (input.guardianFlag) {
    return true;
  }
  if (input.dob) {
    return ageInYears(input.dob, today) < 18;
  }
  return input.under18Flag;
}

export function mandatoryAllGranted(
  purposes: Purpose[],
  decisions: { [code: string]: boolean }
): boolean {
  return purposes.every((p) => !p.isMandatory || decisions[p.purposeCode] === true);
}

function filled(value: string | undefined | null): boolean {
  return !!value && value.trim().length > 0 && value.length <= MAX_TEXT;
}

/** FR-014 / FR-014a / FR-015: proof required for each consent mode. */
export function proofValid(
  mode: ConsentMode | null,
  proof: ProofDraft,
  ctx: ProofContext
): boolean {
  switch (mode) {
    case 'SELF_READ':
      return true;
    case 'READ_ALOUD':
      return (
        proof.workerConfirmed === true &&
        (!ctx.notice || !ctx.notice.audioUrl || ctx.audioPlayedToEnd)
      );
    case 'VOICE_CLIP':
      return !!proof.voiceClip && isVoiceDurationValid(proof.voiceDurationSec);
    case 'WITNESSED':
      return filled(proof.witnessName) && filled(proof.witnessRelationship);
    case 'SIGNATURE_PHOTO':
      return !!proof.patientPhoto && !!proof.signedFormPhoto;
    case 'OTP':
      return proof.otpVerified === true && !!proof.otpChallengeId;
    default:
      return false;
  }
}

/** FR-018 / FR-019: guardian details plus OTP, or one of the two fallbacks. */
export function guardianValid(guardian: GuardianDraft | null): boolean {
  if (!guardian || !filled(guardian.name) || !filled(guardian.relationship)) {
    return false;
  }
  if (guardian.phone && !INDIAN_MOBILE.test(guardian.phone)) {
    return false;
  }
  const fallback = guardian.fallbackEvidence;
  switch (guardian.verification) {
    case 'OTP':
      return !!guardian.phone && !!guardian.otpChallengeId;
    case 'ID_SIGHTED':
      return !!fallback && fallback.idSighted === true;
    case 'UNVERIFIED':
      return !!fallback && filled(fallback.witnessName) && !!fallback.signedFormPhoto;
    default:
      return false;
  }
}

export function canAccept(
  draft: ConsentDraft,
  guardianNeeded: boolean,
  saving: boolean
): boolean {
  return (
    !saving &&
    !!draft.languageCode &&
    !!draft.notice &&
    draft.noticeReadComplete &&
    mandatoryAllGranted(draft.notice.purposes, draft.decisions) &&
    proofValid(draft.mode, draft.proof, {
      notice: draft.notice,
      audioPlayedToEnd: draft.audioPlayedToEnd,
    }) &&
    (!guardianNeeded || guardianValid(draft.guardian))
  );
}

export function outcomeOf(
  purposes: Purpose[],
  decisions: { [code: string]: boolean }
): DialogOutcome {
  if (!mandatoryAllGranted(purposes, decisions)) {
    return 'BLOCKED';
  }
  return purposes.every((p) => decisions[p.purposeCode] === true)
    ? 'GRANTED'
    : 'PARTIAL';
}

export function decisionList(
  purposes: Purpose[],
  decisions: { [code: string]: boolean }
): { purposeCode: string; granted: boolean }[] {
  return purposes.map((p) => ({
    purposeCode: p.purposeCode,
    granted: decisions[p.purposeCode] === true,
  }));
}

/**
 * Builds the save request (contracts/consent-api.md). A decline may have no mode chosen;
 * `mode` is then null and every purpose is DENY.
 */
export function toSaveRequest(
  draft: ConsentDraft,
  ctx: ConsentCaptureContext,
  beneficiaryRegId: number | null,
  evidenceIds: string[],
  guardianEvidenceIds: string[]
): SaveConsentRequest {
  const notice = draft.notice as Notice;
  const proof = draft.proof;
  const guardian = draft.guardian;
  return {
    beneficiaryRegId,
    eventType: 'NEW',
    consentingParty: guardian ? 'GUARDIAN' : 'SELF',
    noticeVersionId: notice.noticeVersionId,
    languageCode: notice.languageCode,
    textHash: notice.textHash,
    channel: 'FACILITY',
    mode: draft.mode,
    capturedBy: ctx.capturedBy,
    providerServiceMapId: ctx.providerServiceMapId,
    facilityId: ctx.facilityId,
    servicePointId: ctx.servicePointId,
    serviceLine: ctx.serviceLine,
    deviceId: ctx.deviceId,
    capturedAt: ctx.capturedAt,
    decisions: notice.purposes.map((p) => ({
      purposeCode: p.purposeCode,
      decision: draft.decisions[p.purposeCode] === true ? 'GRANT' : 'DENY',
    })),
    evidenceIds,
    proof: {
      workerConfirmed: draft.mode === 'READ_ALOUD' ? proof.workerConfirmed === true : null,
      witnessName: draft.mode === 'WITNESSED' ? proof.witnessName || null : null,
      witnessRelationship:
        draft.mode === 'WITNESSED' ? proof.witnessRelationship || null : null,
      otpChallengeId: draft.mode === 'OTP' ? proof.otpChallengeId || null : null,
    },
    guardian: guardian
      ? {
          guardianType: guardian.guardianType,
          name: guardian.name,
          relationship: guardian.relationship,
          phone: guardian.phone,
          verification: guardian.verification,
          otpChallengeId: guardian.otpChallengeId,
          witnessName: guardian.fallbackEvidence?.witnessName || null,
          evidenceIds: guardianEvidenceIds,
        }
      : null,
  };
}
