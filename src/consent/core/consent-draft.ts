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
  ConsentDeclaration,
  ConsentDialogResult,
  ConsentDraft,
  ConsentEventType,
  ConsentMode,
  DeclarationWording,
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

/** Read aloud agreement recording limits in seconds (feature 003, research R4). */
export const AGREEMENT_MIN_SECONDS = 2;
export const AGREEMENT_MAX_SECONDS = 60;
/** Read aloud records staff reading the declaration and the patient's answer, so it may run longer. */
export const READ_ALOUD_MAX_SECONDS = 120;

/** Extra save values from the dialog (feature 003). */
export interface SaveExtras {
  /** The declaration as shown; omitted when none was shown. */
  declarationText?: string;
  /** Patient phone for the Consent ID SMS. */
  notifyPhone?: string | null;
  /** From fetchConsentConfig (projectId, version); null when the platform default was used. */
  projectId?: number | null;
  configVersion?: number | null;
}

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

/** The patient's spoken agreement is recorded, 2–60 s (Self-read and Read aloud). */
function agreementRecorded(proof: ProofDraft, maxSeconds = AGREEMENT_MAX_SECONDS): boolean {
  return (
    !!proof.voiceClip &&
    isVoiceDurationValid(proof.voiceDurationSec, AGREEMENT_MIN_SECONDS, maxSeconds)
  );
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
      return proof.declarationAgreed === true && agreementRecorded(proof);
    case 'READ_ALOUD':
      // Staff read the declaration and asked; the patient answered Yes; the conversation is recorded.
      return proof.declarationAgreed === true && agreementRecorded(proof, READ_ALOUD_MAX_SECONDS);
    case 'VOICE_CLIP':
      return !!proof.voiceClip && isVoiceDurationValid(proof.voiceDurationSec);
    case 'WITNESSED':
      return (
        filled(proof.witnessName) &&
        filled(proof.witnessRelationship) &&
        proof.declarationAgreed === true
      );
    case 'SIGNATURE_PHOTO':
      // Feature 003: the signed / thumb-printed form only; no photo of the patient's face (FR-011).
      return !!proof.signedFormPhoto;
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

/** Guardian / Representative consent is given on the patient's behalf (feature 003). */
export function declarationWording(mode: ConsentMode | null): DeclarationWording {
  return mode === 'WITNESSED' ? 'REPRESENTATIVE' : 'PATIENT';
}

/**
 * The declaration to show, only as the notice publishes it: the representative wording for a
 * guardian / representative (the notice's patient wording when it has none). Empty when the notice
 * publishes no declaration; Accept then stays blocked.
 */
export function declarationText(notice: Notice, wording: DeclarationWording): string {
  if (wording === 'REPRESENTATIVE') {
    return notice.representativeDeclaration || notice.declaration || '';
  }
  return notice.declaration || '';
}

/** The notice's grievance text for the confirmation; empty when it has none. */
export function grievanceText(notice: Notice): string {
  return (notice.grievanceInfo || '').trim();
}

function anyGranted(draft: ConsentDraft): boolean {
  return Object.keys(draft.decisions).some((code) => draft.decisions[code] === true);
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
  guardianEvidenceIds: string[],
  eventType: ConsentEventType = 'NEW',
  extras: SaveExtras = {}
): SaveConsentRequest {
  const notice = draft.notice as Notice;
  const proof = draft.proof;
  const guardian = draft.guardian;
  const granted = anyGranted(draft);
  const declaration: ConsentDeclaration | null =
    granted && extras.declarationText
      ? {
          text: extras.declarationText,
          languageCode: notice.languageCode,
          noticeVersionId: notice.noticeVersionId,
          wording: declarationWording(draft.mode),
        }
      : null;
  return {
    beneficiaryRegId,
    eventType,
    consentingParty: guardian || draft.mode === 'WITNESSED' ? 'GUARDIAN' : 'SELF',
    noticeVersionId: notice.noticeVersionId,
    languageCode: notice.languageCode,
    textHash: notice.textHash,
    channel: 'FACILITY',
    // A full decline leaves out mode, proof and declaration (Consent-API save rules).
    mode: granted ? draft.mode : null,
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
      // Read aloud: the worker confirms reading the declaration by ticking the patient's Yes.
      workerConfirmed:
        granted && draft.mode === 'READ_ALOUD'
          ? proof.workerConfirmed === true || proof.declarationAgreed === true
          : null,
      witnessName: granted && draft.mode === 'WITNESSED' ? proof.witnessName || null : null,
      witnessRelationship:
        granted && draft.mode === 'WITNESSED' ? proof.witnessRelationship || null : null,
      otpChallengeId: granted && draft.mode === 'OTP' ? proof.otpChallengeId || null : null,
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
    projectId: extras.projectId ?? null,
    configVersion: extras.configVersion ?? null,
    declaration,
    notify:
      granted && extras.notifyPhone ? { channel: 'SMS', phone: extras.notifyPhone } : null,
  };
}

/** Result for a dialog closed without Accept or Decline: nothing was saved (FR-008). */
export function noDecisionResult(): ConsentDialogResult {
  return {
    outcome: 'NO_DECISION',
    consentId: null,
    consentingParty: null,
    decisions: [],
    syncStatus: null,
  };
}

/** Same notice and proof, every purpose declined. */
export function declineAll(draft: ConsentDraft): ConsentDraft {
  const decisions: { [code: string]: boolean } = {};
  Object.keys(draft.decisions).forEach((code) => (decisions[code] = false));
  return { ...draft, decisions };
}
