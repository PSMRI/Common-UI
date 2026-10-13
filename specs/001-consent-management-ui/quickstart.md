# Quickstart: validate Consent Management UI

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Prerequisites

- Node and npm versions used by each host; dependencies installed (`npm ci`) in MMU-UI, HWC-UI and TM-UI.
- Common-UI on the feature branch `001-consent-management-ui`, cut from
  `origin/angular-zard-migration` (research R1), in each host's `Common-UI/` submodule:

  ```bash
  git -C <host>/Common-UI fetch && git -C <host>/Common-UI checkout 001-consent-management-ui
  ```

- No Consent-API needed. All tests use mocks from `Common-UI/src/consent/core/testing/consent.mock.ts`.

## 1. Unit tests and coverage (Constitution VI: ≥ 99 %)

Two Angular CLI details shape these commands:

- `--include` globs are resolved from the project's `sourceRoot` (`src/`), so Common-UI specs need a
  `../` prefix.
- Coverage is only instrumented for files under `sourceRoot`, so Common-UI code is never measured by a
  plain `ng test --code-coverage`. `scripts/consent-coverage.sh` sets `sourceRoot` to `""` for the run
  only and always restores `angular.json`.

The host `tsconfig.spec.json` include line (T005/T006) is a test-only change (research R12). Karma can
hang after printing the summary; `scripts/karma-run.sh` stops it once `TOTAL` appears.

**Specs only** (fast check), from the Common-UI spec folder:

```bash
scripts/karma-run.sh ../../../HWC-UI /tmp/consent.log --include='../Common-UI/src/consent/**/*.spec.ts'
```

**Coverage — core + src track** (HWC-UI or TM-UI):

```bash
scripts/consent-coverage.sh <path-to>/FE/HWC-UI /tmp/consent-cov.log \
  'Common-UI/src/consent/**/*.spec.ts' --code-coverage-exclude='Common-UI/src/registrar/**'
```

**Coverage — core + v2 track** (MMU-UI, with Common-UI on `001-consent-management-ui-v2`):

```bash
scripts/consent-coverage.sh <path-to>/FE/MMU-UI /tmp/consent-cov.log \
  'Common-UI/{src/consent/core,v2/consent}/**/*.spec.ts' \
  --code-coverage-exclude='Common-UI/src/registrar/**' --code-coverage-exclude='Common-UI/v2/registrar/**'
```

**Expected**:

- All specs pass.
- The coverage summary shows ≥ 99 % statements, branches, functions and lines.
- Record each run in `baseline.md` (coverage log).

## 2. No-regression gate (Constitution III, VII)

For each consumer, with the feature **off** (no `consentManagement` key):

| Repo | Commands | Expected |
| --- | --- | --- |
| MMU-UI, HWC-UI, TM-UI | `npm run lint && npx ng test --watch=false --browsers=ChromeHeadless && npm run build` | Same pass/fail counts as before the branch; build succeeds |
| Admin-UI, ECD-UI, Inventory-UI, HWC-Inventory-UI, HWC-UI-integration, Helpline1097-UI-NEXT | `npx ng test --watch=false --browsers=ChromeHeadless && npm run build`, with Common-UI on the feature branch | Same pass/fail counts as `baseline.md`; build succeeds; no consent code reached |

Then manually register a new patient in MMU-UI with the feature off. Expected:

- The old consent pop-up appears.
- The registration payload still has `beneficiaryConsent: true` and no `consentId`.

## 3. Feature on, mocked back end (manual walkthrough)

1. In the host's `src/environments/environment.local.ts` (not committed), add:

   ```ts
   consentManagement: { enabled: true, apiBase: 'http://localhost:3999' }
   ```

2. Serve the contract mocks with any static mock server on port 3999, returning the JSON in
   [contracts/consent-api.md](./contracts/consent-api.md).
3. Run `npm start`.

| # | Do | Expect | Spec |
| --- | --- | --- | --- |
| 1 | Open new registration | Consent dialog over the page; form behind locked; backdrop and Esc do nothing | FR-001, FR-001a |
| 2 | Look at the language list | Languages from the mock; no Urdu, Kashmiri or Sindhi | FR-002 |
| 3 | Choose Hindi | Hindi notice; all switches off; Accept disabled | FR-003, FR-005, FR-006 |
| 4 | Scroll the notice to the end | Accept still disabled until mandatory purposes are on and proof is valid | FR-005 |
| 5 | Turn on mandatory purposes, mode Self-read, Accept | One `POST /consents` with an `Idempotency-Key`; dialog closes; form unlocks | US1, FR-011 |
| 6 | Register | Payload has `beneficiaryConsent: true` and `consentId` | FR-035 |
| 7 | Repeat; press Decline, then confirm | Explanation, then `BLOCKED`; back to search; nothing registered | FR-009 |
| 8 | Repeat; press the close button | No API call; back to search | FR-008 |
| 9 | Enter DOB for a 10-year-old | Guardian step; OTP to guardian; fallback options available | US3 |
| 10 | Mode Signature/thumb + photo | Two camera captures required; retake works; upload when no camera | FR-014a |
| 11 | Mode Voice clip, record 20 s | "At least 30 seconds" error | FR-015 |
| 12 | Open a patient workarea with the pending-actions mock = `[LEGACY]` | "Consent pending" banner with reason; it opens the dialog | US4 |
| 13 | Press Consent in the patient header | Preference centre: statuses, change, withdraw, history, doctor access | US5 |
| 14 | Withdraw `P-REG` (non-withdrawable mock) | Explanation; not withdrawn | FR-025 |
| 15 | Mock a 409 on save | "Changed elsewhere, reload and confirm" | FR-033 |
| 16 | Mock a 403 `CONSENT_WITHDRAWN` on any API (interceptor on) | `ConfirmationService` message for that reason | US7 |
