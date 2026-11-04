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
  ageInYears,
  canAccept,
  createDraft,
  declarationText,
  declarationWording,
  declineAll,
  decisionList,
  filterRtl,
  grievanceText,
  guardianValid,
  mandatoryAllGranted,
  needsGuardian,
  noDecisionResult,
  outcomeOf,
  proofValid,
  sortPurposes,
  toSaveRequest,
  withNotice,
} from './consent-draft';
import { ConsentCaptureContext, ConsentDraft, GuardianDraft } from './consent.models';
import { mockLanguages, mockNotice, mockNoticeNoAudio, mockPurposes } from './testing/consent.mock';

describe('consent-draft', () => {
  const today = new Date(2026, 9, 13);
  const blob = new Blob(['x']);
  const ctx: ConsentCaptureContext = {
    capturedBy: 4521,
    providerServiceMapId: 1714,
    facilityId: 33,
    servicePointId: 7,
    serviceLine: 'MMU',
    deviceId: 'd-1',
    capturedAt: '2026-10-13T10:15:00+05:30',
  };

  function grantAll(draft: ConsentDraft): ConsentDraft {
    const decisions: { [k: string]: boolean } = {};
    draft.notice!.purposes.forEach((p) => (decisions[p.purposeCode] = true));
    return { ...draft, decisions };
  }

  function guardian(over: Partial<GuardianDraft> = {}): GuardianDraft {
    return {
      guardianType: 'PARENT',
      name: 'Asha',
      relationship: 'Mother',
      phone: '9876543212',
      verification: 'OTP',
      otpChallengeId: 'otp-1',
      fallbackEvidence: null,
      ...over,
    };
  }

  it('createDraft starts empty with a key', () => {
    const d = createDraft();
    expect(d.languageCode).toBeNull();
    expect(d.notice).toBeNull();
    expect(d.decisions).toEqual({});
    expect(d.mode).toBeNull();
    expect(d.idempotencyKey).toBeTruthy();
  });

  it('withNotice turns every switch off and renews the key', () => {
    const d0 = { ...createDraft(), noticeReadComplete: true, proof: { workerConfirmed: true } };
    const d1 = withNotice(d0, mockNotice('hi'));
    expect(d1.languageCode).toBe('hi');
    expect(d1.noticeReadComplete).toBeFalse();
    expect(d1.proof).toEqual({});
    expect(Object.keys(d1.decisions).length).toBe(6);
    expect(Object.values(d1.decisions).every((v) => v === false)).toBeTrue();
    expect(d1.idempotencyKey).not.toBe(d0.idempotencyKey);
  });

  it('sortPurposes puts mandatory first and keeps order otherwise', () => {
    expect(sortPurposes(mockPurposes()).map((p) => p.purposeCode)).toEqual([
      'P-REG', 'P-TRT', 'P-REM', 'P-SHR', 'P-FAM', 'P-TELE',
    ]);
  });

  it('filterRtl drops Urdu, Kashmiri and Sindhi', () => {
    expect(filterRtl(mockLanguages()).map((l) => l.languageCode)).toEqual(['en', 'hi', 'as']);
  });

  describe('ageInYears / needsGuardian', () => {
    it('counts whole years around the birthday', () => {
      expect(ageInYears('2008-10-13', today)).toBe(18);
      expect(ageInYears('2008-10-14', today)).toBe(17);
      expect(ageInYears('2008-11-01', today)).toBe(17);
      expect(ageInYears('2008-09-30', today)).toBe(18);
    });

    it('uses the disability flag first', () => {
      expect(needsGuardian({ dob: '1990-01-01', under18Flag: false, guardianFlag: true }, today)).toBeTrue();
    });

    it('uses DOB when known', () => {
      expect(needsGuardian({ dob: '2016-01-01', under18Flag: false, guardianFlag: false }, today)).toBeTrue();
      expect(needsGuardian({ dob: '1990-01-01', under18Flag: true, guardianFlag: false }, today)).toBeFalse();
    });

    it('uses the under-18 tick when DOB is unknown', () => {
      expect(needsGuardian({ dob: null, under18Flag: true, guardianFlag: false }, today)).toBeTrue();
      expect(needsGuardian({ dob: null, under18Flag: false, guardianFlag: false }, today)).toBeFalse();
    });
  });

  it('mandatoryAllGranted checks only mandatory purposes', () => {
    const purposes = mockPurposes();
    expect(mandatoryAllGranted(purposes, { 'P-REG': true, 'P-TRT': true })).toBeTrue();
    expect(mandatoryAllGranted(purposes, { 'P-REG': true })).toBeFalse();
  });

  describe('proofValid', () => {
    const withAudio = { notice: mockNotice('hi'), audioPlayedToEnd: false };
    const noAudio = { notice: mockNoticeNoAudio(), audioPlayedToEnd: false };

    it('SELF_READ needs the declaration agreed and a 2-60 s agreement recording (feature 003)', () => {
      const clip = { voiceClip: blob, voiceDurationSec: 3 };
      expect(proofValid('SELF_READ', {}, noAudio)).toBeFalse();
      expect(proofValid('SELF_READ', { declarationAgreed: true }, noAudio)).toBeFalse();
      expect(proofValid('SELF_READ', { ...clip, declarationAgreed: false }, noAudio)).toBeFalse();
      expect(proofValid('SELF_READ', { ...clip, declarationAgreed: true }, noAudio)).toBeTrue();
      expect(proofValid('SELF_READ', { declarationAgreed: true, voiceClip: blob, voiceDurationSec: 1 }, noAudio)).toBeFalse();
    });

    it('READ_ALOUD needs the patient\'s Yes and a 2-120 s recording of the conversation', () => {
      const yes = { voiceClip: blob, voiceDurationSec: 90, declarationAgreed: true };
      expect(proofValid('READ_ALOUD', {}, noAudio)).toBeFalse();
      expect(proofValid('READ_ALOUD', { declarationAgreed: true }, noAudio)).toBeFalse();
      expect(proofValid('READ_ALOUD', { ...yes, declarationAgreed: false }, noAudio)).toBeFalse();
      expect(proofValid('READ_ALOUD', { ...yes }, withAudio)).toBeTrue();
      expect(proofValid('READ_ALOUD', { ...yes, voiceDurationSec: 1 }, noAudio)).toBeFalse();
      expect(proofValid('READ_ALOUD', { ...yes, voiceDurationSec: 121 }, noAudio)).toBeFalse();
      expect(proofValid('READ_ALOUD', { ...yes, voiceClip: null }, noAudio)).toBeFalse();
    });

    it('VOICE_CLIP needs a 30-60 s clip', () => {
      expect(proofValid('VOICE_CLIP', { voiceClip: blob, voiceDurationSec: 45 }, noAudio)).toBeTrue();
      expect(proofValid('VOICE_CLIP', { voiceClip: blob, voiceDurationSec: 20 }, noAudio)).toBeFalse();
      expect(proofValid('VOICE_CLIP', { voiceClip: null, voiceDurationSec: 45 }, noAudio)).toBeFalse();
    });

    it('WITNESSED (Guardian / Representative) needs name, relationship up to 100 chars and agreement', () => {
      const agreed = { declarationAgreed: true };
      expect(proofValid('WITNESSED', { witnessName: 'Ravi', witnessRelationship: 'Neighbour', ...agreed }, noAudio)).toBeTrue();
      expect(proofValid('WITNESSED', { witnessName: 'Ravi', witnessRelationship: 'Neighbour' }, noAudio)).toBeFalse();
      expect(proofValid('WITNESSED', { witnessName: '  ', witnessRelationship: 'Neighbour', ...agreed }, noAudio)).toBeFalse();
      expect(proofValid('WITNESSED', { witnessName: 'a'.repeat(101), witnessRelationship: 'N', ...agreed }, noAudio)).toBeFalse();
      expect(proofValid('WITNESSED', { witnessName: 'Ravi', ...agreed }, noAudio)).toBeFalse();
    });

    it('SIGNATURE_PHOTO needs only the signed form photo, never the face (feature 003)', () => {
      expect(proofValid('SIGNATURE_PHOTO', { signedFormPhoto: blob }, noAudio)).toBeTrue();
      expect(proofValid('SIGNATURE_PHOTO', { patientPhoto: blob }, noAudio)).toBeFalse();
    });

    it('OTP needs a verified challenge', () => {
      expect(proofValid('OTP', { otpVerified: true, otpChallengeId: 'otp-1' }, noAudio)).toBeTrue();
      expect(proofValid('OTP', { otpVerified: true }, noAudio)).toBeFalse();
      expect(proofValid('OTP', { otpChallengeId: 'otp-1' }, noAudio)).toBeFalse();
    });

    it('no mode is never valid', () => {
      expect(proofValid(null, {}, noAudio)).toBeFalse();
    });
  });

  describe('guardianValid', () => {
    it('accepts OTP-verified guardians with a valid phone', () => {
      expect(guardianValid(guardian())).toBeTrue();
    });

    it('rejects missing guardian, blank fields or a bad phone', () => {
      expect(guardianValid(null)).toBeFalse();
      expect(guardianValid(guardian({ name: ' ' }))).toBeFalse();
      expect(guardianValid(guardian({ relationship: '' }))).toBeFalse();
      expect(guardianValid(guardian({ phone: '12345' }))).toBeFalse();
    });

    it('OTP needs a phone and a challenge', () => {
      expect(guardianValid(guardian({ phone: null }))).toBeFalse();
      expect(guardianValid(guardian({ otpChallengeId: null }))).toBeFalse();
    });

    it('ID_SIGHTED needs the tick', () => {
      expect(guardianValid(guardian({ verification: 'ID_SIGHTED', phone: null, fallbackEvidence: { idSighted: true } }))).toBeTrue();
      expect(guardianValid(guardian({ verification: 'ID_SIGHTED', fallbackEvidence: null }))).toBeFalse();
      expect(guardianValid(guardian({ verification: 'ID_SIGHTED', fallbackEvidence: { idSighted: false } }))).toBeFalse();
    });

    it('UNVERIFIED needs a representative name and a signed form photo', () => {
      expect(
        guardianValid(guardian({ verification: 'UNVERIFIED', fallbackEvidence: { witnessName: 'Ravi', signedFormPhoto: blob } }))
      ).toBeTrue();
      expect(guardianValid(guardian({ verification: 'UNVERIFIED', fallbackEvidence: { witnessName: 'Ravi' } }))).toBeFalse();
      expect(
        guardianValid(guardian({ verification: 'UNVERIFIED', fallbackEvidence: { witnessName: ' ', signedFormPhoto: blob } }))
      ).toBeFalse();
      expect(guardianValid(guardian({ verification: 'UNVERIFIED', fallbackEvidence: null }))).toBeFalse();
    });

    it('no verification is invalid', () => {
      expect(guardianValid(guardian({ verification: null }))).toBeFalse();
    });
  });

  describe('canAccept', () => {
    function ready(): ConsentDraft {
      const d = grantAll(withNotice(createDraft(), mockNoticeNoAudio()));
      return {
        ...d,
        noticeReadComplete: true,
        mode: 'SELF_READ',
        proof: { declarationAgreed: true, voiceClip: blob, voiceDurationSec: 5 },
      };
    }

    it('is true only when every condition holds', () => {
      expect(canAccept(ready(), false, false)).toBeTrue();
    });

    it('is false while saving, before reading, without notice or language', () => {
      expect(canAccept(ready(), false, true)).toBeFalse();
      expect(canAccept({ ...ready(), noticeReadComplete: false }, false, false)).toBeFalse();
      expect(canAccept({ ...ready(), notice: null }, false, false)).toBeFalse();
      expect(canAccept({ ...ready(), languageCode: null }, false, false)).toBeFalse();
    });

    it('is false when a mandatory purpose is off or proof is invalid', () => {
      expect(canAccept({ ...ready(), decisions: { 'P-REG': true } }, false, false)).toBeFalse();
      expect(canAccept({ ...ready(), mode: 'WITNESSED' }, false, false)).toBeFalse();
    });

    it('needs a valid guardian when one is required', () => {
      expect(canAccept(ready(), true, false)).toBeFalse();
      expect(canAccept({ ...ready(), guardian: guardian() }, true, false)).toBeTrue();
    });
  });

  it('outcomeOf distinguishes granted, partial and blocked', () => {
    const purposes = mockPurposes();
    const all: { [k: string]: boolean } = {};
    purposes.forEach((p) => (all[p.purposeCode] = true));
    expect(outcomeOf(purposes, all)).toBe('GRANTED');
    expect(outcomeOf(purposes, { ...all, 'P-REM': false })).toBe('PARTIAL');
    expect(outcomeOf(purposes, { ...all, 'P-REG': false })).toBe('BLOCKED');
  });

  it('decisionList maps every purpose to granted or not', () => {
    expect(decisionList(mockPurposes().slice(0, 2), { 'P-REG': true })).toEqual([
      { purposeCode: 'P-REM', granted: false },
      { purposeCode: 'P-REG', granted: true },
    ]);
  });

  describe('toSaveRequest', () => {
    it('builds a self consent', () => {
      const d = { ...grantAll(withNotice(createDraft(), mockNotice('hi'))), mode: 'SELF_READ' as const };
      d.decisions['P-REM'] = false;
      const req = toSaveRequest(d, ctx, null, [], []);
      expect(req.beneficiaryRegId).toBeNull();
      expect(req.consentingParty).toBe('SELF');
      expect(req.noticeVersionId).toBe(12);
      expect(req.languageCode).toBe('hi');
      expect(req.textHash).toBe('hash-hi');
      expect(req.mode).toBe('SELF_READ');
      expect(req.capturedBy).toBe(4521);
      expect(req.deviceId).toBe('d-1');
      expect(req.decisions.find((x) => x.purposeCode === 'P-REM')!.decision).toBe('DENY');
      expect(req.decisions.find((x) => x.purposeCode === 'P-REG')!.decision).toBe('GRANT');
      expect(req.proof).toEqual({ workerConfirmed: null, witnessName: null, witnessRelationship: null, otpChallengeId: null });
      expect(req.guardian).toBeNull();
      expect(req.eventType).toBe('NEW');
      expect(toSaveRequest(d, ctx, 42, [], [], 'RENEWAL').eventType).toBe('RENEWAL');
    });

    it('fills mode-specific proof fields', () => {
      const base = grantAll(withNotice(createDraft(), mockNotice('hi')));
      expect(toSaveRequest({ ...base, mode: 'READ_ALOUD', proof: { workerConfirmed: true } }, ctx, 42, [], []).proof.workerConfirmed).toBeTrue();
      const w = toSaveRequest({ ...base, mode: 'WITNESSED', proof: { witnessName: 'Ravi', witnessRelationship: 'N' } }, ctx, 42, [], []);
      expect(w.proof.witnessName).toBe('Ravi');
      expect(w.proof.witnessRelationship).toBe('N');
      const wEmpty = toSaveRequest({ ...base, mode: 'WITNESSED', proof: {} }, ctx, 42, [], []);
      expect(wEmpty.proof.witnessName).toBeNull();
      expect(wEmpty.proof.witnessRelationship).toBeNull();
      expect(toSaveRequest({ ...base, mode: 'OTP', proof: { otpChallengeId: 'otp-1' } }, ctx, 42, [], []).proof.otpChallengeId).toBe('otp-1');
      expect(toSaveRequest({ ...base, mode: 'OTP', proof: {} }, ctx, 42, [], []).proof.otpChallengeId).toBeNull();
      expect(toSaveRequest({ ...base, mode: 'VOICE_CLIP' }, ctx, 42, ['e-1'], []).evidenceIds).toEqual(['e-1']);
    });

    it('sends a decline with no mode and all DENY', () => {
      const req = toSaveRequest(withNotice(createDraft(), mockNotice('hi')), ctx, null, [], [], 'NEW', {
        declarationText: 'I agree',
        notifyPhone: '9876543212',
      });
      expect(req.mode).toBeNull();
      expect(req.decisions.every((x) => x.decision === 'DENY')).toBeTrue();
      expect(req.declaration).toBeNull();
      expect(req.notify).toBeNull();
    });

    it('carries the declaration as shown and asks for the SMS (feature 003)', () => {
      const d = { ...grantAll(withNotice(createDraft(), mockNotice('hi'))), mode: 'SELF_READ' as const };
      const req = toSaveRequest(d, ctx, 42, [], [], 'NEW', { declarationText: 'I agree', notifyPhone: '9876543212' });
      expect(req.declaration).toEqual({ text: 'I agree', languageCode: 'hi', noticeVersionId: 12, wording: 'PATIENT' });
      expect(req.notify).toEqual({ channel: 'SMS', phone: '9876543212' });
      const bare = toSaveRequest(d, ctx, 42, [], []);
      expect(bare.declaration).toBeNull();
      expect(bare.notify).toBeNull();
    });

    it('saves Guardian / Representative consent as the guardian\'s', () => {
      const d = { ...grantAll(withNotice(createDraft(), mockNotice('hi'))), mode: 'WITNESSED' as const };
      const req = toSaveRequest(d, ctx, 42, [], [], 'NEW', { declarationText: 'On behalf' });
      expect(req.consentingParty).toBe('GUARDIAN');
      expect(req.declaration!.wording).toBe('REPRESENTATIVE');
    });

    it('adds the guardian block', () => {
      const d = { ...grantAll(withNotice(createDraft(), mockNotice('hi'))), mode: 'SELF_READ' as const };
      const g = toSaveRequest({ ...d, guardian: guardian() }, ctx, null, [], ['e-9']);
      expect(g.consentingParty).toBe('GUARDIAN');
      expect(g.guardian).toEqual({
        guardianType: 'PARENT',
        name: 'Asha',
        relationship: 'Mother',
        phone: '9876543212',
        verification: 'OTP',
        otpChallengeId: 'otp-1',
        witnessName: null,
        evidenceIds: ['e-9'],
      });
      const u = toSaveRequest(
        { ...d, guardian: guardian({ verification: 'UNVERIFIED', fallbackEvidence: { witnessName: 'Ravi', signedFormPhoto: blob } }) },
        ctx, null, [], []
      );
      expect(u.guardian!.witnessName).toBe('Ravi');
    });
  });

  describe('declaration and grievance (feature 003)', () => {
    const defaults = { patient: 'Default patient', representative: 'Default representative' };

    it('declarationWording is representative only for the Guardian / Representative mode', () => {
      expect(declarationWording('WITNESSED')).toBe('REPRESENTATIVE');
      expect(declarationWording('SELF_READ')).toBe('PATIENT');
      expect(declarationWording(null)).toBe('PATIENT');
    });

    it('declarationText prefers the project wording and falls back', () => {
      const plain = mockNotice('hi');
      const own = { ...plain, declaration: 'Patient text', representativeDeclaration: 'Rep text' };
      expect(declarationText(own, 'PATIENT', defaults)).toBe('Patient text');
      expect(declarationText(own, 'REPRESENTATIVE', defaults)).toBe('Rep text');
      expect(declarationText({ ...own, representativeDeclaration: undefined }, 'REPRESENTATIVE', defaults)).toBe('Patient text');
      expect(declarationText({ ...plain, declaration: undefined }, 'PATIENT', defaults)).toBe('Default patient');
      expect(declarationText({ ...plain, declaration: undefined }, 'REPRESENTATIVE', defaults)).toBe('Default representative');
    });

    it('grievanceText uses the notice text, else the fallback', () => {
      expect(grievanceText({ ...mockNotice('hi'), grievanceInfo: 'Call 104' }, 'fb')).toBe('Call 104');
      expect(grievanceText({ ...mockNotice('hi'), grievanceInfo: '  ' }, 'fb')).toBe('fb');
      expect(grievanceText({ ...mockNotice('hi'), grievanceInfo: undefined as unknown as string }, 'fb')).toBe('fb');
    });
  });

  it('noDecisionResult saves nothing', () => {
    expect(noDecisionResult()).toEqual({
      outcome: 'NO_DECISION',
      consentId: null,
      consentingParty: null,
      decisions: [],
      syncStatus: null,
    });
  });

  it('declineAll turns every decision off and keeps the rest', () => {
    const d = grantAll(withNotice(createDraft(), mockNotice('hi')));
    const declined = declineAll(d);
    expect(Object.values(declined.decisions).every((v) => v === false)).toBeTrue();
    expect(Object.keys(declined.decisions).length).toBe(6);
    expect(declined.idempotencyKey).toBe(d.idempotencyKey);
    expect(d.decisions['P-REG']).toBeTrue();
  });
});
