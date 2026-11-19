# Data Model: Consent Management UI (Common-UI)

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-10-13

These are the front-end view models in `src/consent/core/consent.models.ts`. They mirror the API
contract in [contracts/consent-api.md](./contracts/consent-api.md). The back end owns persistence; the UI
never stores consent data beyond the open dialog, except the device ID (research R13).

## Enumerations

| Type | Values |
| --- | --- |
| `PurposeStatus` | `GRANTED`, `DENIED`, `WITHDRAWN`, `EXPIRED`, `RECONSENT_REQUIRED`, `SUPERSEDED` |
| `ConsentMode` | `SELF_READ`, `READ_ALOUD`, `VOICE_CLIP`, `WITNESSED`, `SIGNATURE_PHOTO`, `OTP` |
| `ConsentingParty` | `SELF`, `GUARDIAN` |
| `GuardianType` | `PARENT`, `DISABILITY_GUARDIAN` |
| `GuardianVerification` | `OTP`, `ID_SIGHTED`, `UNVERIFIED` |
| `PendingReason` | `CONSENT_MISSING`, `LEGACY`, `RECONSENT_REQUIRED`, `GUARDIAN_TO_SELF` |
| `RefusalReason` | `CONSENT_NOT_FOUND`, `CONSENT_DENIED`, `CONSENT_WITHDRAWN`, `CONSENT_EXPIRED`, `RECONSENT_REQUIRED`, `GUARDIAN_REQUIRED` |
| `DialogOutcome` | `GRANTED`, `PARTIAL`, `BLOCKED`, `NO_DECISION` |
| `SyncStatus` | `SYNCED`, `NOT_SYNCED` |
| `EvidenceType` | `VOICE_CLIP`, `PATIENT_PHOTO`, `SIGNED_FORM_PHOTO` |
| `AccessGrantStatus` | `PENDING`, `ACTIVE`, `REVOKED`, `EXPIRED` |
| `AccessGrantType` | `CONSENTED`, `BREAK_GLASS` |

## Entities

### Purpose

| Field | Type | Rules |
| --- | --- | --- |
| `purposeCode` | string | e.g. `P-REG`, `P-TRT`, `P-REM`, `P-SHR`, `P-FAM`, `P-TELE` |
| `name` | string | Already in the notice language |
| `description` | string | Why it is used |
| `isMandatory` | boolean | Mandatory purposes are listed first (FR-006) |
| `isWithdrawable` | boolean | `false` blocks withdrawal (FR-025) |
| `validityDays` | number \| null | |

### Notice

| Field | Type | Rules |
| --- | --- | --- |
| `noticeVersionId` | number | Sent back with the consent |
| `languageCode` | string | ISO 639; `ur`, `ks` and `sd` are filtered out (FR-002) |
| `body` | string | Sanitised HTML; rendered with Angular sanitisation, never `bypassSecurityTrust*` |
| `textHash` | string | Server SHA-256; sent back as proof (R8) |
| `audioUrl` | string \| null | Absent means scroll-only unlock |
| `purposes` | Purpose[] | |
| `dataItems`, `retention`, `recipients`, `withdrawalInfo`, `grievanceInfo` | string | All shown in the notice (FR-003) |

### ConsentDraft (client-only dialog state)

| Field | Type | Rules |
| --- | --- | --- |
| `languageCode` | string \| null | Required first (FR-002) |
| `notice` | Notice \| null | Reloaded when the language changes (FR-010) |
| `noticeReadComplete` | boolean | Set when scrolled to the end OR audio played to the end (FR-005) |
| `decisions` | `Record<purposeCode, boolean>` | All `false` at start (FR-006) |
| `mode` | ConsentMode \| null | Required (FR-013) |
| `proof` | ProofDraft | Must be valid for the mode (FR-014) |
| `guardian` | GuardianDraft \| null | Present when `needsGuardian` |
| `idempotencyKey` | string | UUID v4, made once per decision, reused on retry (FR-011) |

**Derived values**

- `needsGuardian` = age from DOB < 18, or the registrar's guardian flag (FR-017).
- `mandatoryAllGranted` = every mandatory purpose's decision is `true`.
- `canAccept` = `languageCode` and `noticeReadComplete` and `mandatoryAllGranted` and `proofValid`
  and (`!needsGuardian` or `guardianValid`) and not saving.

**Accept vs Decline**

- Accept is enabled only when `canAccept` is true.
- Decline is always enabled once a notice is shown.
- Decline, or Accept with a mandatory purpose off, leads to the "cannot continue" confirmation, then
  `BLOCKED` (FR-009).

### ProofDraft (per mode, FR-014 / FR-014a / FR-015)

| Mode | Required fields | Validation |
| --- | --- | --- |
| `SELF_READ` | none from user | Auto-attached: `noticeVersionId`, `languageCode`, `textHash`, `capturedAt`, `deviceId`, `capturedBy` |
| `READ_ALOUD` | `workerConfirmed: true` | And the audio was played to the end, if audio exists |
| `VOICE_CLIP` | `voiceClip: Blob` | Duration 30–60 s, inclusive |
| `WITNESSED` | `witnessName`, `witnessRelationship` | Non-blank, ≤ 100 characters |
| `SIGNATURE_PHOTO` | `patientPhoto: Blob`, `signedFormPhoto: Blob` | Both present; retake allowed before Accept |
| `OTP` | `otpChallengeId`, `otpVerified: true` | Phone shown masked (FR-016) |

Blobs are held in memory only and released when the dialog closes (FR-015).

### GuardianDraft (FR-017 to FR-019)

| Field | Type | Rules |
| --- | --- | --- |
| `guardianType` | GuardianType | `DISABILITY_GUARDIAN` when the registrar flags it |
| `name` | string | Required, ≤ 100 characters |
| `relationship` | string | Required |
| `phone` | string \| null | 10-digit Indian mobile when present |
| `verification` | GuardianVerification | `OTP` after verify; `ID_SIGHTED` or `UNVERIFIED` via fallback |
| `otpChallengeId` | string \| null | |
| `fallbackEvidence` | `{ idSighted: true }` or `{ witnessName, signedFormPhoto }` | Required when not `OTP` |

### NoticeLanguage

`languageCode`, `languageName` (in that language), `hasAudio: boolean`.

### ConsentRecord (saved event, read in history)

`consentId`, `beneficiaryRegId` (null until linked, R4), `eventType`, `consentingParty`,
`noticeVersionId`, `languageCode`, `mode`, `capturedBy`, `capturedAt`, `facilityId`, `serviceLine`,
`deviceId`, `syncStatus`, `purposes: { purposeCode, decision, status }[]`.

### PurposeState (preference centre row, FR-022)

`purposeCode`, `name`, `isMandatory`, `isWithdrawable`, `status: PurposeStatus`,
`validUntil: string | null`, `versionNo: number` (sent back for stale checks, FR-033).

### PendingAction (FR-020)

`reason: PendingReason`, `purposeCodes: string[]`, `dueSince: string`.

### AccessGrant (FR-026, FR-028)

`grantId`, `grantee` (doctor name and facility), `purposes: string[]`, `type: AccessGrantType`,
`status: AccessGrantStatus`, `validUntil: string`.

### ConsentDialogResult (returned to the consuming service, FR-012)

| Field | Type |
| --- | --- |
| `outcome` | DialogOutcome |
| `consentId` | string \| null (`null` when `NO_DECISION`) |
| `consentingParty` | ConsentingParty \| null (`null` when `NO_DECISION`; used by the FR-017a re-check) |
| `decisions` | `{ purposeCode, granted }[]` |
| `syncStatus` | SyncStatus \| null |

`beneficiaryConsent` sent by registration is `outcome === 'GRANTED' || outcome === 'PARTIAL'`.

### ConsentRefusal (FR-029)

`reason: RefusalReason`, `messageKey: string`, `action: 'OPEN_CONSENT' | 'REQUEST_ACCESS' | null`.

- `OPEN_CONSENT` for `CONSENT_NOT_FOUND`, `RECONSENT_REQUIRED`, `GUARDIAN_REQUIRED`.
- `REQUEST_ACCESS` when the 403 body says `crossFacility: true`.
- `null` otherwise.

## State transitions (consent dialog)

```text
LANGUAGE ─pick─▶ NOTICE ─read complete─▶ DECIDE ─Accept (canAccept)─▶ SAVING ─ok─▶ CLOSED(GRANTED|PARTIAL)
   │               │  ▲                     │                           │
   │               │  └─language change─────┘                           ├─409 stale─▶ STALE ─reload─▶ NOTICE
   │               │                        ├─Decline / mandatory off─▶ CONFIRM_BLOCK ─confirm─▶ SAVING ─ok─▶ CLOSED(BLOCKED)
   │               │                        └─needsGuardian─▶ GUARDIAN ─verified/fallback─▶ DECIDE
   └─close─────────┴─────────close──────────────────────────────────────────────────────────▶ CLOSED(NO_DECISION)
SAVING ─network/5xx─▶ ERROR ─retry (same idempotencyKey)─▶ SAVING
```

`NO_DECISION` never calls the save API (FR-008).
