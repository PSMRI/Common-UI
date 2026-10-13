# Contract: Consent-API as used by Common-UI

**Status**: Assumed contract. The FE builds and tests against it with mocks; the BE team must confirm.
Source: Solution Overview §4.2. Items marked **[FE ask]** are not in the source doc.

## Conventions

- **Base URL**: `environment.consentManagement.apiBase` (e.g. `https://<host>/consent-api`); paths below
  are appended. On MMU vans the base points at the van's local server.
- **Auth**: The existing host interceptor adds the `Authorization` JWT. Common-UI adds no auth headers.
- **Response envelope**: The standard AMRIT `OutputResponse`:
  `{ statusCode: number, status: string, errorMessage: string, data: T }`. Success is `statusCode === 200`.
- **Write calls** send an `Idempotency-Key: <uuid>` header. A repeat with the same key returns the first
  result.
- **Stale update**: HTTP 409 with `data.reason = "STALE_VERSION"`.
- **Consent refusal from any AMRIT API**: HTTP 403 with a body of
  `{ statusCode: 403, data: { reason: RefusalReason, purposeCode?: string, crossFacility?: boolean } }`.

## Endpoints used

| # | Call | Method & path | Used by | FR |
| --- | --- | --- | --- | --- |
| 1 | Get notice | `GET /consent/v1/notices/active?context=REGISTRATION&lang={code}` | Consent dialog | FR-003, FR-010 |
| 2 | List notice languages **[FE ask]** | `GET /consent/v1/notices/active/languages?context=REGISTRATION` | Language step | FR-002 |
| 3 | Save consent | `POST /consent/v1/consents` | Consent dialog | FR-011, FR-012 |
| 4 | Upload evidence | `POST /consent/v1/evidence` (multipart) | Proof capture | FR-014a, FR-015 |
| 5 | Send OTP | `POST /consent/v1/otp/challenges` | OTP mode, guardian, access approval | FR-014, FR-018, FR-028 |
| 6 | Verify OTP | `POST /consent/v1/otp/challenges/{id}/verify` | Same | Same |
| 7 | Patient's consents | `GET /consent/v1/principals/{benRegId}/consents` | Preference centre (current + history) | FR-022, FR-027 |
| 8 | Pending actions | `GET /consent/v1/principals/{benRegId}/pending-actions` | Consent entry banner | FR-020 |
| 9 | Change preference | `POST /consent/v1/principals/{benRegId}/preferences` | Preference centre | FR-023 |
| 10 | Withdraw | `POST /consent/v1/principals/{benRegId}/withdrawals` | Preference centre | FR-024, FR-025 |
| 11 | List access grants **[FE ask]** | `GET /consent/v1/principals/{benRegId}/access-grants?status=ACTIVE,PENDING` | Preference centre, approval | FR-026, FR-028 |
| 12 | Approve access | `POST /consent/v1/access-grants/{id}/approve` | Access approval | FR-028 |
| 13 | Revoke access | `POST /consent/v1/access-grants/{id}/revoke` | Preference centre | FR-026 |

## Payloads

### 1. Get notice: response `data`

```json
{
  "noticeVersionId": 12, "languageCode": "hi", "context": "REGISTRATION",
  "body": "<p>…</p>", "textHash": "9f86d0…", "audioUrl": "https://…/n12-hi.mp3",
  "dataItems": "…", "retention": "…", "recipients": "…",
  "withdrawalInfo": "…", "grievanceInfo": "…",
  "purposes": [
    { "purposeCode": "P-REG", "name": "…", "description": "…", "isMandatory": true,
      "isWithdrawable": false, "validityDays": null }
  ]
}
```

### 2. Languages: response `data`

`[{ "languageCode": "hi", "languageName": "हिन्दी", "hasAudio": true }]`

### 3. Save consent: request

```json
{
  "beneficiaryRegId": null,
  "eventType": "NEW",
  "consentingParty": "SELF",
  "noticeVersionId": 12, "languageCode": "hi", "textHash": "9f86d0…",
  "channel": "FACILITY", "mode": "SELF_READ",
  "capturedBy": 4521, "providerServiceMapId": 1714, "facilityId": 33, "servicePointId": 7,
  "serviceLine": "MMU", "deviceId": "3c1e…", "capturedAt": "2026-10-13T10:15:00+05:30",
  "decisions": [ { "purposeCode": "P-REG", "decision": "GRANT" }, { "purposeCode": "P-REM", "decision": "DENY" } ],
  "evidenceIds": [],
  "proof": { "workerConfirmed": null, "witnessName": null, "witnessRelationship": null, "otpChallengeId": null },
  "guardian": null
}
```

`guardian`, when present:
`{ "guardianType", "name", "relationship", "phone", "verification", "otpChallengeId", "witnessName", "evidenceIds" }`.

### 3. Save consent: response `data`

```json
{ "consentId": "a7c2…", "syncStatus": "SYNCED",
  "purposes": [ { "purposeCode": "P-REG", "status": "GRANTED", "versionNo": 1 } ] }
```

`beneficiaryRegId: null` is accepted **[FE ask]**. `mode` may be `null` only for a decline where every decision is `DENY` and no consent mode was chosen **[FE ask]**. The consent stays unlinked until registration links
it (see Identity-API below).

### 4. Upload evidence

- **Request**: multipart with `file`, `type` (EvidenceType), `sha256` (may be empty, R8), `durationSec`
  (voice only).
- **Response `data`**: `{ "evidenceId": "e1…", "sha256": "…" }`.

### 5–6. OTP

- **Send**: `{ "purpose": "CONSENT" | "GUARDIAN" | "ACCESS_GRANT", "phone": "98xxxxxx12", "refId"?: "…" }`
  returns `{ "challengeId", "maskedPhone": "98******12", "expiresAt" }`.
- **Verify**: `{ "otp": "123456" }` returns `{ "verified": true }`. A wrong OTP returns
  `statusCode 5000`, `errorMessage`.

### 7. Consents: response `data`

`{ "current": PurposeState[], "history": ConsentRecord[] }`, history newest first.

### 8. Pending actions: response `data`

`PendingAction[]`; an empty list means no banner.

### 9–10. Change and withdraw: request

`{ "purposeCodes": ["P-REM"], "decision": "GRANT" | "DENY", "versions": { "P-REM": 3 } }`

Withdraw sends `{ "purposeCodes": [...] | "ALL", "versions": {...} }`. A non-withdrawable purpose
returns 422 with `data.reason = "NOT_WITHDRAWABLE"`.

### 11–13. Access grants

- **List**: returns `AccessGrant[]`.
- **Approve**: `{ "otpChallengeId": "…" }`.
- **Revoke**: `{}`.

## Identity-API change **[FE ask]**

When the feature is on, the existing registration call (`environment.registerBeneficiaryUrl`) payload
carries two fields:

- `beneficiaryConsent: boolean`: the real outcome, replacing the hard-coded `true`.
- `consentId: string | null`.

The back end links the consent to the new `beneficiaryRegID`. With the feature off, the payload is
unchanged.
