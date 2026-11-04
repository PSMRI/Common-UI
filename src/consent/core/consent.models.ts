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

// View models for consent management (specs/001-consent-management-ui/data-model.md).

import { ModeSettings, ResolvedConsentConfig } from './consent-config.models';

export type PurposeStatus =
  | 'GRANTED'
  | 'DENIED'
  | 'WITHDRAWN'
  | 'EXPIRED'
  | 'RECONSENT_REQUIRED'
  | 'SUPERSEDED';
export type ConsentMode =
  | 'SELF_READ'
  | 'READ_ALOUD'
  | 'VOICE_CLIP'
  | 'WITNESSED'
  | 'SIGNATURE_PHOTO'
  | 'OTP';
export type ConsentingParty = 'SELF' | 'GUARDIAN';
export type GuardianType = 'PARENT' | 'DISABILITY_GUARDIAN';
export type GuardianVerification = 'OTP' | 'ID_SIGHTED' | 'UNVERIFIED';
export type PendingReason =
  | 'CONSENT_MISSING'
  | 'LEGACY'
  | 'RECONSENT_REQUIRED'
  | 'GUARDIAN_TO_SELF'
  | 'EXPIRED';
export type RefusalReason =
  | 'CONSENT_NOT_FOUND'
  | 'CONSENT_DENIED'
  | 'CONSENT_WITHDRAWN'
  | 'CONSENT_EXPIRED'
  | 'RECONSENT_REQUIRED'
  | 'GUARDIAN_REQUIRED';
export type DialogOutcome = 'GRANTED' | 'PARTIAL' | 'BLOCKED' | 'NO_DECISION';
export type SyncStatus = 'SYNCED' | 'NOT_SYNCED';
export type EvidenceType = 'VOICE_CLIP' | 'PATIENT_PHOTO' | 'SIGNED_FORM_PHOTO';
export type AccessGrantStatus = 'PENDING' | 'ACTIVE' | 'REVOKED' | 'EXPIRED';
export type AccessGrantType = 'CONSENTED' | 'BREAK_GLASS';
export type ConsentContextType = 'REGISTRATION' | 'REVISIT';
/** NEW: first consent; UPDATE: re-consent after a notice change; RENEWAL: after expiry. */
export type ConsentEventType = 'NEW' | 'UPDATE' | 'RENEWAL';
export type OtpPurpose = 'CONSENT' | 'GUARDIAN' | 'ACCESS_GRANT';
export type RefusalAction = 'OPEN_CONSENT' | 'REQUEST_ACCESS' | null;

/** Standard AMRIT API envelope. */
export interface OutputResponse<T> {
  statusCode: number;
  status: string;
  errorMessage: string;
  data: T;
}

export interface Purpose {
  purposeCode: string;
  name: string;
  description: string;
  isMandatory: boolean;
  isWithdrawable: boolean;
  validityDays: number | null;
}

export interface NoticeLanguage {
  languageCode: string;
  languageName: string;
  hasAudio: boolean;
}

/** Feature 003: who to contact for questions or complaints (FR-012, FR-013). */
export interface GrievanceContact {
  officerName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  officeHours: string | null;
}

export interface Notice {
  noticeVersionId: number;
  languageCode: string;
  context: ConsentContextType;
  body: string;
  textHash: string;
  audioUrl: string | null;
  dataItems: string;
  retention: string;
  recipients: string;
  withdrawalInfo: string;
  grievanceInfo: string;
  purposes: Purpose[];
  /** Feature 003: patient agreement declaration; absent means the default text. */
  declaration?: string;
  /** Feature 003: wording for a guardian / representative; absent means the patient wording. */
  representativeDeclaration?: string;
  declarationAudioUrl?: string | null;
  grievance?: GrievanceContact | null;
}

export interface ProofDraft {
  workerConfirmed?: boolean;
  voiceClip?: Blob | null;
  voiceDurationSec?: number | null;
  witnessName?: string;
  witnessRelationship?: string;
  patientPhoto?: Blob | null;
  signedFormPhoto?: Blob | null;
  otpChallengeId?: string | null;
  otpVerified?: boolean;
  /** Feature 003: the declaration was agreed (Self-read, Guardian / Representative). */
  declarationAgreed?: boolean;
  /** Feature 003: Read aloud declaration audio or voice played to the end. */
  declarationPlayed?: boolean;
}

export interface GuardianFallbackEvidence {
  idSighted?: boolean;
  witnessName?: string;
  signedFormPhoto?: Blob | null;
}

export interface GuardianDraft {
  guardianType: GuardianType;
  name: string;
  relationship: string;
  phone: string | null;
  verification: GuardianVerification | null;
  otpChallengeId: string | null;
  fallbackEvidence: GuardianFallbackEvidence | null;
}

export interface ConsentDraft {
  languageCode: string | null;
  notice: Notice | null;
  noticeReadComplete: boolean;
  audioPlayedToEnd: boolean;
  decisions: { [purposeCode: string]: boolean };
  mode: ConsentMode | null;
  proof: ProofDraft;
  guardian: GuardianDraft | null;
  idempotencyKey: string;
}

/** Inputs that decide whether the guardian step is needed (FR-017). */
export interface GuardianNeedInput {
  dob: string | null;
  under18Flag: boolean;
  guardianFlag: boolean;
}

export interface PurposeDecision {
  purposeCode: string;
  decision: 'GRANT' | 'DENY';
}

export interface PurposeResult {
  purposeCode: string;
  status: PurposeStatus;
  versionNo: number;
}

export interface SaveConsentGuardian {
  guardianType: GuardianType;
  name: string;
  relationship: string;
  phone: string | null;
  verification: GuardianVerification | null;
  otpChallengeId: string | null;
  witnessName: string | null;
  evidenceIds: string[];
}

export type DeclarationWording = 'PATIENT' | 'REPRESENTATIVE';

/** Feature 003: the declaration exactly as shown (FR-004). */
export interface ConsentDeclaration {
  text: string;
  languageCode: string;
  noticeVersionId: number;
  wording: DeclarationWording;
}

/** Feature 003: state of the recorded agreement's upload to the server. */
export type RecordingUploadState = 'IDLE' | 'UPLOADING' | 'DONE' | 'FAILED';

export type NotificationStatus = 'SENT' | 'QUEUED' | 'FAILED' | 'NOT_REQUESTED';

export interface ConsentNotification {
  status: NotificationStatus;
  maskedPhone: string | null;
}

export interface SaveConsentRequest {
  beneficiaryRegId: number | null;
  eventType: ConsentEventType;
  consentingParty: ConsentingParty;
  noticeVersionId: number;
  languageCode: string;
  textHash: string;
  channel: 'FACILITY';
  /** null only for a decline where no mode was chosen. */
  mode: ConsentMode | null;
  capturedBy: number | null;
  providerServiceMapId: number | null;
  facilityId: number | null;
  servicePointId: number | null;
  serviceLine: string | null;
  deviceId: string;
  capturedAt: string;
  decisions: PurposeDecision[];
  evidenceIds: string[];
  proof: {
    workerConfirmed: boolean | null;
    witnessName: string | null;
    witnessRelationship: string | null;
    otpChallengeId: string | null;
  };
  guardian: SaveConsentGuardian | null;
  /** Feature 002: project configuration in force; both null when the platform default was used. */
  projectId?: number | null;
  configVersion?: number | null;
  /** Feature 003: null on a decline. */
  declaration?: ConsentDeclaration | null;
  /** Feature 003: SMS the Consent ID and grievance contact (FR-014). */
  notify?: { channel: 'SMS'; phone: string } | null;
}

export interface SaveConsentResponse {
  consentId: string;
  syncStatus: SyncStatus;
  purposes: PurposeResult[];
  /** Feature 003: absent from older servers. */
  notification?: ConsentNotification;
}

/** Feature 003: what the confirmation step shows after a granted save. */
export interface ConsentConfirmation {
  consentId: string;
  capturedAt: string;
  syncStatus: SyncStatus;
  grievance: GrievanceContact | null;
  grievanceText: string;
  notification: ConsentNotification | null;
  hasPhone: boolean;
}

export interface EvidenceResponse {
  evidenceId: string;
  sha256: string;
}

export interface OtpSendRequest {
  purpose: OtpPurpose;
  phone: string;
  refId?: string;
}

export interface OtpChallenge {
  challengeId: string;
  maskedPhone: string;
  expiresAt: string;
}

export interface OtpVerifyResponse {
  verified: boolean;
}

export interface ConsentRecord {
  consentId: string;
  beneficiaryRegId: number | null;
  eventType: string;
  consentingParty: ConsentingParty;
  noticeVersionId: number;
  languageCode: string;
  mode: ConsentMode;
  capturedBy: string;
  capturedAt: string;
  facilityId: number | null;
  serviceLine: string | null;
  deviceId: string | null;
  syncStatus: SyncStatus;
  purposes: { purposeCode: string; decision: string; status: PurposeStatus }[];
}

export interface PurposeState {
  purposeCode: string;
  name: string;
  isMandatory: boolean;
  isWithdrawable: boolean;
  status: PurposeStatus;
  validUntil: string | null;
  versionNo: number;
}

export interface PatientConsents {
  current: PurposeState[];
  history: ConsentRecord[];
}

export interface PendingAction {
  reason: PendingReason;
  purposeCodes: string[];
  dueSince: string;
}

export interface AccessGrant {
  grantId: string;
  grantee: string;
  purposes: string[];
  type: AccessGrantType;
  status: AccessGrantStatus;
  validUntil: string;
}

export interface ChangePreferenceRequest {
  purposeCodes: string[];
  decision: 'GRANT' | 'DENY';
  versions: { [purposeCode: string]: number };
}

export interface WithdrawRequest {
  purposeCodes: string[] | 'ALL';
  versions: { [purposeCode: string]: number };
}

export interface ConsentDialogOptions {
  context: ConsentContextType;
  beneficiaryRegId: number | null;
  dob?: string | null;
  guardianRequired?: boolean;
  patientPhone?: string | null;
  /** Feature 002: configuration already loaded by the caller; the dialog loads it when absent. */
  config?: ResolvedConsentConfig;
  /** Feature 003: why consent is taken (revisit pending actions); default NEW. */
  eventType?: ConsentEventType;
}

export interface ConsentDialogResult {
  outcome: DialogOutcome;
  consentId: string | null;
  consentingParty: ConsentingParty | null;
  decisions: { purposeCode: string; granted: boolean }[];
  syncStatus: SyncStatus | null;
}

export interface ConsentRefusal {
  reason: RefusalReason;
  messageKey: string;
  action: RefusalAction;
  purposeCode: string | null;
}

export type ConsentApiErrorKind =
  | 'STALE'
  | 'NOT_WITHDRAWABLE'
  | 'UNAVAILABLE'
  | 'FAILED';

export interface ConsentApiError {
  kind: ConsentApiErrorKind;
  message: string;
}

/** Proof context used by consent-draft rules. */
export interface ProofContext {
  notice: Notice | null;
  audioPlayedToEnd: boolean;
  /** Feature 002: settings of the chosen mode; absent means the feature 001 rules. */
  settings?: ModeSettings;
}

/** Session-derived values attached to every consent (research R13). */
export interface ConsentCaptureContext {
  capturedBy: number | null;
  providerServiceMapId: number | null;
  facilityId: number | null;
  servicePointId: number | null;
  serviceLine: string | null;
  deviceId: string;
  capturedAt: string;
}
