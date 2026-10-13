---

description: "Task list for Consent Management UI (Common-UI)"
---

# Tasks: Consent Management UI (Common-UI)

**Input**: Design documents from `specs/001-consent-management-ui/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: REQUIRED.

- Constitution VI and SC-007 require a co-located `*.spec.ts` for every new file, mock data only, and
  ≥ 99 % coverage.
- Write each spec task first and see it fail, then do the implementation task that follows it.

**Organization**: Tasks are grouped by user story; each story is delivered on both UI tracks.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task).
- **[Story]**: US1–US7 from spec.md.

## Path conventions

- Paths without a prefix are relative to the **Common-UI repository root**.
- Host paths are prefixed with the host repo, e.g. `FE/MMU-UI/...` (relative to `/Users/sneha/ND`).
- **Core** (`src/consent/core/`) has no UI-library imports. It MUST compile on Angular 16 and 20: no
  `input()`/`output()` functions, no `@if`/`@for`, no `inject()` inside plain functions.
- **`v2` track** (`v2/consent/`, MMU-UI, Angular 20):
  - standalone components; Zard primitives from `v2/ui`; Tailwind utilities only;
  - no `.css`/`styleUrls`, no Material, no Bootstrap, no inline `style=`; no text in bare `<h1>`–`<h6>`;
  - imports the core by relative path `../../src/consent/core/...` (adjust depth per file).
- **`src` track** (`src/consent/`, HWC-UI and TM-UI, Angular 16):
  - standalone components; Angular Material (`MatDialogModule`, `MatButtonModule`,
    `MatSlideToggleModule`, `MatRadioModule`, `MatFormFieldModule`, `MatInputModule`, `MatSelectModule`);
  - `*ngIf`/`*ngFor`; component `.css` allowed, matching the existing `registrar/` components.
- **Every new file**:
  - starts with the AMRIT GPL-3.0 licence header, copied from `src/registrar/services/registrar.service.ts`;
  - gets interface text through the existing pattern, `assignSelectedLanguage()` with
    `SetLanguageComponent` + `HttpServiceService`, called in `ngOnInit` and `ngDoCheck`, reading
    `currentLanguageSet?.consent?.<key>` (keys in [contracts/i18n-keys.md](./contracts/i18n-keys.md)).
- **Every component spec** uses:
  - `TestBed` with the standalone component in `imports`;
  - `jasmine.createSpyObj` for `ConsentApiService`, `HttpServiceService`, `SessionStorageService` and
    the dialog services;
  - mock data from `src/consent/core/testing/consent.mock.ts`;
  - `fakeAsync`/`tick`/`flush` for timers and observers;
  - errors thrown in a synchronous `subscribe` tested with `fakeAsync` + `flush()`.
- **Spec content**: each spec covers the happy path, invalid input, API error, empty/null data, every
  branch, and template-bound behaviour (rendering, disabled state, emitted outputs).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Decisions, branch, folders and test wiring.

- [X] T001 Agree the branch strategy with the Common-UI maintainers. The choice is between building on `angular-zard-migration` (has both `src/` and `v2/`), or a `main`-based PR for `src/` plus a zard-based PR for `v2/`. Record the decision in `specs/001-consent-management-ui/plan.md` under "Open risk". **Blocks T003.**
- [ ] T002 Get FE tech lead approval for the Constitution I exception: one `consentManagement.apiBase` env key plus path constants in code (research R5). Record the approver and date in `specs/001-consent-management-ui/plan.md` Complexity Tracking row 4. If refused, switch R5 to per-URL env keys before T009. _2026-10-13: approval still pending; the user chose to proceed with the R5 design meanwhile (plan.md Complexity Tracking row 4)._
- [ ] T003 Per T001 (split): in `FE/MMU-UI/Common-UI`, run `git fetch origin` and `git checkout -b 001-consent-management-ui origin/main`. Commit the untracked `specs/001-consent-management-ui/` and `.specify/` as `docs: add consent management spec, plan and tasks`. The `v2` branch `001-consent-management-ui-v2` is cut from `origin/angular-zard-migration` when US1's `v2` track starts, and gets the docs and core commits cherry-picked.
- [ ] T004 Create empty barrels with the licence header only: `src/consent/public-api.ts` and `v2/consent/public-api.ts`. Do NOT add them to `src/public-api.ts` or `v2/public-api.ts` (Constitution IV).
- [ ] T005 [P] In `FE/MMU-UI/tsconfig.spec.json`, append `"Common-UI/src/consent/core/**/*.spec.ts"` and `"Common-UI/v2/consent/**/*.spec.ts"` to `include`. Change nothing else.
- [ ] T006 [P] In `FE/HWC-UI/tsconfig.spec.json` and `FE/TM-UI/tsconfig.spec.json`, append `"Common-UI/src/consent/**/*.spec.ts"` to `include`. Change nothing else.
- [ ] T007 Record the regression baseline with the feature off in `specs/001-consent-management-ui/baseline.md`. For each of FE/MMU-UI, FE/HWC-UI and FE/TM-UI, run `npm run lint`, `npx ng test --watch=false --browsers=ChromeHeadless` (stop Karma once `TOTAL` prints) and `npm run build`. For each of FE/Admin-UI, FE/ECD-UI, FE/Inventory-UI, FE/HWC-Inventory-UI, FE/HWC-UI-integration and FE/Helpline1097-UI-NEXT, run `npx ng test --watch=false --browsers=ChromeHeadless` and `npm run build` with Common-UI at its currently pinned commit. Record pass/fail counts and warnings exactly.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared consent core used by every story on both tracks, plus host config and text keys.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T008 [P] Create `src/consent/core/consent.models.ts` with every enum (string union types) and interface in [data-model.md](./data-model.md): `Purpose`, `Notice`, `NoticeLanguage`, `ConsentDraft`, `ProofDraft`, `GuardianDraft`, `ConsentRecord`, `PurposeState`, `PendingAction`, `AccessGrant`, `ConsentDialogResult`, `ConsentRefusal`, `OutputResponse<T>` (`statusCode`, `status`, `errorMessage`, `data`), and the save/change/withdraw/OTP/evidence request and response shapes from [contracts/consent-api.md](./contracts/consent-api.md). Types only; no logic, so no spec.
- [ ] T009 [P] Create `src/consent/core/consent-api.paths.ts` exporting `CONSENT_PATHS`, one function or constant per row of the endpoint table in contracts/consent-api.md, e.g. `pendingActions: (benRegId: number) => \`/consent/v1/principals/${benRegId}/pending-actions\``. Add `src/consent/core/consent-api.paths.spec.ts` asserting every path string.
- [ ] T010 [P] Write `src/consent/core/consent-feature.spec.ts`. Cover:
    - `isConsentFeatureEnabled()` is false when `environment.consentManagement` is undefined, when `enabled` is false, and when it is `'true'` (a string); true only when `enabled === true`.
    - `consentApiBase()` returns `apiBase` with any trailing `/` removed, or `''` when absent.

  Spy on the environment object by temporarily assigning `(environment as any).consentManagement` in `beforeEach`/`afterEach`.
- [ ] T011 Implement `src/consent/core/consent-feature.ts` (`isConsentFeatureEnabled`, `consentApiBase`), importing `environment` from `'src/environments/environment'` like `src/registrar/services/registrar.service.ts`.
- [ ] T012 [P] Create `src/consent/core/testing/consent.mock.ts`. It is shared test data only, imported only by specs, and every export is a factory returning a fresh object. Exports:
    - `mockLanguages`: `en`, `hi`, `as`, `ur`, `ks`, `sd`; `hasAudio` true for `hi`.
    - `mockNotice(lang)`, with purposes:
        - `P-REG`: mandatory, not withdrawable.
        - `P-TRT`: mandatory, withdrawable.
        - `P-REM`: optional.
        - `P-SHR`: optional.
        - `P-FAM`: optional.
        - `P-TELE`: optional.
    - `mockNoticeNoAudio`.
    - `mockSaveResponse` (`consentId: 'c-1'`, `syncStatus: 'SYNCED'`) and `mockSaveResponseOffline` (`NOT_SYNCED`).
    - `mockConsents` (current + history of 3 records, newest first).
    - `mockPendingActions` (one of each `PendingReason`) and `mockNoPending = []`.
    - `mockAccessGrants` (one `PENDING`, one `ACTIVE`).
    - `mockOtpChallenge` (`maskedPhone '98******12'`).
    - `mockEvidenceResponse`.
    - Error bodies: `mock403(reason, crossFacility?)`, `mock409Stale`, `mock422NotWithdrawable`, `mockServerError` (`statusCode 5000`).
    - `mockSession`: `userID 4521`, `userName 'nurse1'`, `providerServiceID 1714`, `facilityID 33`, `servicePointID 7`, `serviceName 'MMU'`.
- [ ] T013 [P] Write `src/consent/core/evidence.util.spec.ts`. Cover:
    - `uuidV4()` matches the v4 regex and two calls differ.
    - `sha256Hex(blob)` returns the known hex for `'abc'` when `crypto.subtle` exists, and resolves `null` when `crypto.subtle` is undefined (stub with `spyOnProperty`/temporary override).
    - `isVoiceDurationValid` is true at 30 and 60, false at 29.9 and 60.1.
    - `maskPhone('9876543212')` gives `'98******12'`; null or short input gives `''`.
    - `getDeviceId()` creates and stores `amrit.consent.deviceId` in localStorage once, returns the same value next time, and still returns a UUID when `localStorage` throws.
- [ ] T014 Implement `src/consent/core/evidence.util.ts`:
    - `uuidV4` via `crypto.getRandomValues`;
    - `sha256Hex` via `crypto.subtle.digest('SHA-256')` when available, else `null` (research R8);
    - `isVoiceDurationValid`, `maskPhone`, and `getDeviceId` with try/catch around localStorage.
- [ ] T015 [P] Write `src/consent/core/consent-api.service.spec.ts` with `HttpClientTestingModule` + `HttpTestingController`, the base mocked to `'http://api'`. For each of the 13 calls in contracts/consent-api.md, assert the method, full URL and body.
  Also cover:
    - write calls (save, evidence, change, withdraw, approve, revoke, OTP send) send an `Idempotency-Key` header equal to the key passed in;
    - `statusCode 200` unwraps to `data`;
    - non-200 `statusCode` errors with `errorMessage`;
    - HTTP 409 with `STALE_VERSION` maps to `{ kind: 'STALE' }`;
    - HTTP 422 with `NOT_WITHDRAWABLE` maps to `{ kind: 'NOT_WITHDRAWABLE' }`;
    - network error maps to `{ kind: 'UNAVAILABLE' }`;
    - evidence upload sends `FormData` with `file`, `type`, `sha256`, `durationSec`.
- [ ] T016 Implement `src/consent/core/consent-api.service.ts` (`@Injectable({ providedIn: 'root' })`, `HttpClient`, URLs from `consentApiBase()` + `CONSENT_PATHS`) with methods:
    - `getLanguages(context)`, `getNotice(context, lang)`
    - `saveConsent(req, key)`
    - `uploadEvidence(file, type, sha256, durationSec, key)`
    - `sendOtp(req, key)`, `verifyOtp(challengeId, otp)`
    - `getConsents(benRegId)`, `getPendingActions(benRegId)`
    - `changePreference(benRegId, req, key)`, `withdraw(benRegId, req, key)`
    - `getAccessGrants(benRegId)`, `approveAccess(grantId, otpChallengeId, key)`, `revokeAccess(grantId, key)`

  Each method returns a typed `Observable`, unwraps `OutputResponse`, and maps errors to `ConsentApiError` (`{ kind: 'STALE' | 'NOT_WITHDRAWABLE' | 'UNAVAILABLE' | 'FAILED', message }`).
- [ ] T017 [P] Write `src/consent/core/consent-context.service.spec.ts`, mocking `SessionStorageService` with `mockSession`. `context()` returns:
    - `capturedBy` = `userID` (number)
    - `providerServiceMapId` = `providerServiceID`
    - `facilityId`, `servicePointId`
    - `serviceLine` = `serviceName`
    - `deviceId` from `getDeviceId()`
    - `capturedAt` as ISO with offset, using a mocked clock

  Missing session keys give `null`, never `NaN`.
- [ ] T018 Implement `src/consent/core/consent-context.service.ts` (`providedIn: 'root'`), injecting `SessionStorageService` from `src/registrar/services/session-storage.service`.
- [ ] T019 [P] Write `src/consent/core/consent-draft.spec.ts` covering every exported function and branch:
    - `createDraft()`: all decisions false, new `idempotencyKey`.
    - `sortPurposes()`: mandatory first, otherwise stable.
    - `filterRtl(languages)`: drops `ur`, `ks`, `sd`.
    - `needsGuardian({ dob, under18Flag, guardianFlag }, today)`: age below 18 by DOB on and around the birthday, either flag set, all null.
    - `mandatoryAllGranted()`.
    - `proofValid(mode, proof, ctx)` for all 6 modes per the data-model table:
        - `READ_ALOUD` needs `workerConfirmed` and, when the notice has audio, `audioPlayedToEnd`;
        - `VOICE_CLIP` uses the 30–60 s duration rule;
        - `WITNESSED` needs a non-blank name and relationship of ≤ 100 characters;
        - `SIGNATURE_PHOTO` needs both blobs;
        - `OTP` needs `otpVerified`.
    - `guardianValid()`: OTP verified, `ID_SIGHTED` with `idSighted`, and `UNVERIFIED` with witness + photo.
    - `canAccept()`: true only when every condition holds; false while `saving`.
    - `outcomeOf(decisions, purposes)`: `GRANTED` when all are true, `PARTIAL` when mandatory are true and some optional false, `BLOCKED` when any mandatory is false.
    - `toSaveRequest(draft, ctx, beneficiaryRegId)`: builds the exact request in contracts/consent-api.md, with `GRANT`/`DENY` per purpose, guardian block and `evidenceIds`.
- [ ] T020 Implement `src/consent/core/consent-draft.ts` as pure functions (no Angular imports) per T019.
- [ ] T021 [P] Write `src/consent/core/consent-refusal.spec.ts`. `consentRefusalFrom(err)`:
    - returns `null` for non-`HttpErrorResponse`, for non-403, and for a 403 with no or unknown `data.reason`;
    - for each of the 6 reasons, returns `messageKey 'refusal<REASON>'`;
    - `action` is `OPEN_CONSENT` for `CONSENT_NOT_FOUND`, `RECONSENT_REQUIRED`, `GUARDIAN_REQUIRED`, and `REQUEST_ACCESS` when `crossFacility: true`;
    - otherwise `action` is `null`.
- [ ] T022 Implement `src/consent/core/consent-refusal.ts` per T021.
- [ ] T023 [P] Add the `consent` key group, all keys and English values from [contracts/i18n-keys.md](./contracts/i18n-keys.md), as a new top-level property, appended without reordering existing keys, to:
    - `FE/MMU-UI/src/assets/English.json`, `Hindi.json`, `Assamese.json`
    - `FE/HWC-UI/src/assets/English.json`, `Hindi.json`, `Assamese.json`, `Kannada.json`
    - `FE/TM-UI/src/assets/English.json`, `Hindi.json`, `Assamese.json`

  Non-English files get English values for now (SC-008). Validate each file with `node -e "JSON.parse(require('fs').readFileSync(f))"`.
- [ ] T024 [P] Add `consentManagement: { enabled: false, apiBase: '' }` next to the existing `tracking` block in:
    - `FE/MMU-UI/src/environments/environment.ts` and every other `environment*.ts` in that folder;
    - `FE/MMU-UI/src/environments/environment.ci.ts.template`, following how `tracking` is templated there (`CONSENT_ENABLED`, `CONSENT_API_BASE` env vars);
    - the same in `FE/HWC-UI/src/environments/` and `FE/TM-UI/src/environments/`. TM-UI's `environment.ts` is gitignored, so edit `environment.local.ts` and the CI template.

  Do NOT add the key to the other 6 consumers; absent means off.
- [ ] T025 Export the core from `src/consent/public-api.ts`: `consent.models`, `consent-feature`, `consent-refusal`, `ConsentApiService`. Do not export `testing/`.

**Checkpoint**: Run the core specs (quickstart §1, MMU-UI command). All pass, and coverage of `src/consent/core/**` is ≥ 99 %.

---

## Phase 3: User Story 1 - New patient gives informed, per-purpose consent at registration (Priority: P1) 🎯 MVP

**Goal**:

- The consent dialog opens over new registration: language, then notice (text or audio), then purpose
  switches (all off), then Self-read proof, then Accept or Decline.
- The real outcome and `consentId` reach the registration payload.
- With the feature off, nothing changes.

**Independent Test**: Quickstart §3 rows 1–8 on MMU-UI (v2), then on HWC-UI (src), plus the US1
specs.

### v2 track (MMU-UI)

- [ ] T026 [P] [US1] Write `v2/consent/consent-dialog/language-step/language-step.component.spec.ts`. Cover:
    - On init it calls `getLanguages('REGISTRATION')`.
    - It renders only non-RTL languages, so `ur`, `ks`, `sd` are absent.
    - Selecting one emits `languageSelected` with the code.
    - An empty list shows the `serviceUnavailable` text.
    - An API error shows the `serviceUnavailable` text with a retry button that reloads.
- [ ] T027 [P] [US1] Implement `v2/consent/consent-dialog/language-step/language-step.component.{ts,html}` (standalone; Zard `z-select` or a list of `z-button` options; `@Output() languageSelected`), using `filterRtl` from the core.
- [ ] T028 [P] [US1] Write `v2/consent/consent-dialog/notice-step/notice-step.component.spec.ts`. Cover:
    - It renders `body`, `dataItems`, `retention`, `recipients`, `withdrawalInfo` and `grievanceInfo`.
    - The body goes through Angular sanitisation: a `<script>` in the mock is not executed or rendered.
    - `readComplete` is emitted once when the end sentinel intersects (mock `IntersectionObserver` on `window`).
    - It falls back to the scroll check when `IntersectionObserver` is undefined.
    - The audio player is shown only when `audioUrl` is set. The `ended` event emits `readComplete` and `audioPlayedToEnd`. Seeking to the end without playing does not count (`timeupdate` furthest-point tracking).
    - An audio `error` event hides the player and leaves the scroll rule active.
- [ ] T029 [P] [US1] Implement `v2/consent/consent-dialog/notice-step/notice-step.component.{ts,html}` per research R9. It has `@Input() notice` and `@Output() readComplete` / `audioPlayedToEnd`, and disconnects the observer in `ngOnDestroy`.
- [ ] T030 [P] [US1] Write `v2/consent/consent-dialog/purposes-step/purposes-step.component.spec.ts`. Cover:
    - Mandatory purposes render first with the `mandatory` label; optional ones with `optional`.
    - Every switch is initially off.
    - Each switch has `role="switch"` and its `aria-checked` reflects state.
    - Toggling emits `decisionsChange` with the full map.
    - An input change of `purposes` (language reload) resets all switches to off.
- [ ] T031 [P] [US1] Implement `v2/consent/consent-dialog/purposes-step/purposes-step.component.{ts,html}` using `z-checkbox` with `role="switch"` and `aria-checked` (research R10), with `sortPurposes` from the core.
- [ ] T032 [P] [US1] Write `v2/consent/consent-dialog/proof-step/proof-step.component.spec.ts` for US1 scope. Cover:
    - It renders the mode picker with all 6 modes.
    - Selecting `SELF_READ` emits `proofChange` with a valid empty proof and needs no input.
    - The other modes are covered in US2.
- [ ] T033 [P] [US1] Implement `v2/consent/consent-dialog/proof-step/proof-step.component.{ts,html}` with a mode picker (`z-radio-group`), `@Input() notice`, `@Input() audioPlayedToEnd`, and `@Output() modeChange` / `proofChange`. Render the `SELF_READ` branch only, leaving one `@switch` case per mode for US2.
- [ ] T034 [US1] Write `v2/consent/consent-dialog/consent-dialog.component.spec.ts` (inject `Z_MODAL_DATA` and a `ZardDialogRef` spy). Cover:
    - The step flow is LANGUAGE → NOTICE/DECIDE.
    - A language change reloads the notice and resets decisions (FR-010).
    - Accept is disabled until `canAccept`.
    - Decline is always enabled once the notice shows; it has the same `z-button` size as Accept, with a different variant only.
    - Accept with all mandatory on calls `saveConsent` once with `beneficiaryRegId: null`, the draft key and `toSaveRequest` output. It closes with `{ outcome: 'GRANTED' | 'PARTIAL', consentId, decisions, syncStatus }`.
    - A double click while saving does not call save twice.
    - On a retry after `UNAVAILABLE`, the same `Idempotency-Key` is reused.
    - Decline, or Accept with a mandatory purpose off, calls the host `ConfirmationService.confirm(consent.title, consent.cannotContinue, consent.confirmDecline, consent.close)` (spy; research R14). `true` saves the DENY decisions and closes `BLOCKED`; `false` returns to the decision view.
    - The close button closes `{ outcome: 'NO_DECISION', consentId: null }` with no API call.
    - `STALE` calls `ConfirmationService.alert(consent.staleReload)`, then re-fetches the notice with the current language.
    - `UNAVAILABLE` shows `serviceUnavailable` and `retry`.
    - `NOT_SYNCED` in the response is carried into the result (FR-034).
- [ ] T035 [US1] Implement `v2/consent/consent-dialog/consent-dialog.component.{ts,html}`. It is the shell with the state machine from data-model.md and hosts the steps from T027–T033. It holds the `ConsentDraft`, calls `ConsentApiService` and `ConsentContextService`, and has its own close button. All text comes from `currentLanguageSet.consent`. Layout: content scrolls inside the dialog at 1024 px wide (FR-001b).
- [ ] T036 [US1] Write `v2/consent/consent-dialog.service.spec.ts`. `open(options)`:
    - calls `ZardDialogService.create` with `zContent: ConsentDialogComponent`, `zData: options`, `zMaskClosable: false`, `zClosable: false`, `zHideFooter: true`, `zWidth: 'min(960px, 95vw)'`;
    - returns an Observable emitting the `afterClosed` value;
    - maps an `undefined` close to `{ outcome: 'NO_DECISION', consentId: null, decisions: [], syncStatus: null }`.
- [ ] T037 [US1] Implement `v2/consent/consent-dialog.service.ts` (`providedIn: 'root'`) with `open()` only. `openPreferenceCentre` and `openAccessApproval` are added in US5/US6.
- [ ] T038 [US1] Add a registration hook spec to the existing `v2/registrar/registration/registration.component.spec.ts`, adding cases only and leaving existing ones untouched.
  With the feature off:
    - the old `ConsentFormComponent` dialog opens exactly as before;
    - the payload has `beneficiaryConsent: true` and no `consentId` key.

  With the feature on:
    - `ConsentDialogService.open` is called with `{ context: 'REGISTRATION', beneficiaryRegId: null }`;
    - `GRANTED`/`PARTIAL` store the `consentId`, and the payload has `beneficiaryConsent: true` + `consentId`;
    - `BLOCKED` and `NO_DECISION` call the existing `redirectToSearch()`.

  Revisit (`patientRevisit === true`) opens nothing, as today.
- [ ] T039 [US1] Edit `v2/registrar/registration/registration.component.ts` minimally:
    - In `openConsent()` (around L313), wrap the existing body in `if (!isConsentFeatureEnabled()) { …existing code unchanged… } else { this.consentDialog.open({ context: 'REGISTRATION', beneficiaryRegId: null }).subscribe(r => { this.consentResult = r; if (r.outcome === 'BLOCKED' || r.outcome === 'NO_DECISION') { this.redirectToSearch(); } }); }`.
    - In the final payload (around L569), keep `beneficiaryConsent: true` and add, only when enabled, `beneficiaryConsent` from the result plus `consentId`, using a conditional spread so the off-path object is identical.
    - Add the `ConsentDialogService` constructor injection.

  Touch no other lines. Note every changed line for the PR description.

### src track (HWC-UI, TM-UI)

- [ ] T040 [P] [US1] Write `src/consent/consent-dialog/language-step/language-step.component.spec.ts` with the same cases as T026.
- [ ] T041 [P] [US1] Implement `src/consent/consent-dialog/language-step/language-step.component.{ts,html,css}` with Material `mat-select`.
- [ ] T042 [P] [US1] Write `src/consent/consent-dialog/notice-step/notice-step.component.spec.ts` with the same cases as T028.
- [ ] T043 [P] [US1] Implement `src/consent/consent-dialog/notice-step/notice-step.component.{ts,html,css}`.
- [ ] T044 [P] [US1] Write `src/consent/consent-dialog/purposes-step/purposes-step.component.spec.ts` with the same cases as T030, using `mat-slide-toggle`.
- [ ] T045 [P] [US1] Implement `src/consent/consent-dialog/purposes-step/purposes-step.component.{ts,html,css}` with `mat-slide-toggle`.
- [ ] T046 [P] [US1] Write `src/consent/consent-dialog/proof-step/proof-step.component.spec.ts` with the same cases as T032.
- [ ] T047 [P] [US1] Implement `src/consent/consent-dialog/proof-step/proof-step.component.{ts,html,css}` with `mat-radio-group` and an `[ngSwitch]` per mode.
- [ ] T048 [US1] Write `src/consent/consent-dialog/consent-dialog.component.spec.ts` with the same cases as T034, injecting `MAT_DIALOG_DATA` and a `MatDialogRef` spy.
- [ ] T049 [US1] Implement `src/consent/consent-dialog/consent-dialog.component.{ts,html,css}`, mirroring T035 with Material.
- [ ] T050 [US1] Write `src/consent/consent-dialog.service.spec.ts`. `open()` calls `MatDialog.open(ConsentDialogComponent, { data, disableClose: true, width: 'min(960px, 95vw)', maxHeight: '90vh' })`; the remaining cases are the same as T036.
- [ ] T051 [US1] Implement `src/consent/consent-dialog.service.ts` (`providedIn: 'root'`).
- [ ] T052 [US1] Add a spec for the `src` registration hook to `src/registrar/registration/registration.component.spec.ts`, with the same cases as T038.
  - If the existing spec file does not compile, create `src/registrar/registration/registration.consent-hook.spec.ts` instead.
  - Never edit the stale existing spec (Constitution IV).
- [ ] T053 [US1] Edit `src/registrar/registration/registration.component.ts` minimally: `openConsent()` around L163-178 and the payload around L405, the same as T039 but using `MatDialog`.
- [ ] T054 [US1] Export `ConsentDialogService` and `ConsentDialogComponent` from `src/consent/public-api.ts` and `v2/consent/public-api.ts`. The `v2` barrel re-exports the core models, feature and refusal from `../../src/consent/core/...`.

**Checkpoint**:

- US1 specs pass on MMU-UI (v2 + core) and HWC-UI (src + core) with ≥ 99 % coverage.
- Quickstart §3 rows 1–8 pass.
- With the feature off, results match `baseline.md`.

---

## Phase 4: User Story 2 - Registrar captures proof matching the consent mode (Priority: P1)

**Goal**: All 6 consent modes with the proof each requires. Evidence is uploaded before the consent is
saved.

**Independent Test**: Quickstart §3 rows 10–11 and the US2 specs for each mode.

### Shared building blocks

- [ ] T055 [P] [US2] Write `v2/consent/otp-verify/otp-verify.component.spec.ts`. Cover:
    - Inputs: `phone`, `purpose` (`'CONSENT' | 'GUARDIAN' | 'ACCESS_GRANT'`), `refId`.
    - Send calls `sendOtp` with a key and shows `otpSentTo` with `maskedPhone`, never the raw phone.
    - Verify with a 6-digit OTP calls `verifyOtp` and emits `verified(challengeId)`.
    - Fewer than 6 digits keeps Verify disabled.
    - A wrong OTP shows `otpInvalid`.
    - Resend is disabled for 30 s (fakeAsync `tick(30000)`).
    - `UNAVAILABLE` shows the error.
- [ ] T056 [P] [US2] Implement `v2/consent/otp-verify/otp-verify.component.{ts,html}`.
- [ ] T057 [P] [US2] Write `src/consent/otp-verify/otp-verify.component.spec.ts` with the same cases as T055.
- [ ] T058 [P] [US2] Implement `src/consent/otp-verify/otp-verify.component.{ts,html,css}`.
- [ ] T059 [P] [US2] Check the host `camera-dialog` in FE/HWC-UI, FE/MMU-UI and FE/TM-UI (`src/app/app-modules/core/components/camera-dialog/camera-dialog.component.ts`): confirm the import path, how it is opened (MatDialog or ZardDialogService) and the shape of its `close(result)` value in each host (expected: `imageAsDataUrl`). Record the result in `specs/001-consent-management-ui/research.md` R7. If a host differs, record the fallback: that track's `media-capture` uses `ngx-webcam` directly.
- [ ] T060 [P] [US2] Write `v2/consent/media-capture/media-capture.component.spec.ts`. Cover:
    - `kind: 'photo'`:
        - opens the host `CameraDialogComponent` through a dialog-service spy and converts the returned data URL into a `Blob` emitted via `captured`;
        - an empty result emits nothing, and when no camera is found it shows a file input with `accept="image/*"`;
        - retake clears the blob.
    - `kind: 'voice'`:
        - start and stop use a mocked `RecordRTC` `StereoAudioRecorder`;
        - duration is measured with fakeAsync; out-of-range durations show `voiceTooShort` or `voiceTooLong` and emit nothing;
        - when the microphone is denied, it falls back to a file input with `accept="audio/*"`, and the duration is read from audio metadata.
    - Object URLs are revoked on destroy.
- [ ] T061 [P] [US2] Implement `v2/consent/media-capture/media-capture.component.{ts,html}`, opening the host `CameraDialogComponent` for photos (as recorded in T059) and using `RecordRTC` from `recordrtc` for voice (already an MMU-UI dependency; research R7).
- [ ] T062 [P] [US2] Write `src/consent/media-capture/media-capture.component.spec.ts` with the same cases as T060.
- [ ] T063 [P] [US2] Implement `src/consent/media-capture/media-capture.component.{ts,html,css}`.

### Proof step and dialog wiring

- [ ] T064 [US2] Extend `v2/consent/consent-dialog/proof-step/proof-step.component.spec.ts` with one `describe` per mode:
    - `READ_ALOUD`: requires `workerConfirm`, and `audioPlayedToEnd` when the notice has audio.
    - `VOICE_CLIP`: a `media-capture` voice emits a blob and duration.
    - `WITNESSED`: name and relationship are required, ≤ 100 characters.
    - `SIGNATURE_PHOTO`: two `media-capture` photos (`patientPhoto`, `signedFormPhoto`) are both required; retake clears validity.
    - `OTP`: `otp-verify` with the patient phone input; verified sets `otpVerified`.
    - A mode change clears the previous proof.
- [ ] T065 [US2] Implement the remaining mode branches in `v2/consent/consent-dialog/proof-step/proof-step.component.{ts,html}`. Validity comes from `proofValid` in the core.
- [ ] T066 [US2] Extend `src/consent/consent-dialog/proof-step/proof-step.component.spec.ts` with the same cases as T064.
- [ ] T067 [US2] Implement the remaining mode branches in `src/consent/consent-dialog/proof-step/proof-step.component.{ts,html,css}`.
- [ ] T068 [US2] Extend both `consent-dialog.component.spec.ts` files (v2 and src). On Accept with `VOICE_CLIP` or `SIGNATURE_PHOTO`:
    - each blob is uploaded first via `uploadEvidence` (type, `sha256Hex` result or `''`, `durationSec`, own key);
    - then `saveConsent` is called with the returned `evidenceIds`;
    - an upload failure stops the save and shows `retry`;
    - a retry re-uploads only the failed files;
    - blobs and object URLs are released on close (FR-015).
- [ ] T069 [US2] Implement the evidence-upload-then-save sequence in `v2/consent/consent-dialog/consent-dialog.component.ts` and `src/consent/consent-dialog/consent-dialog.component.ts`.

**Checkpoint**: All 6 modes are covered by passing specs on both tracks; quickstart rows 10–11 pass.

---

## Phase 5: User Story 3 - Guardian gives consent for a child or a person with disability (Priority: P1)

**Goal**: The guardian step with OTP, and the "ID seen" or "witness + signature" fallback. Consent is
recorded as given by a guardian.

**Note**: For new registration the DOB is not known when the dialog opens. The language step therefore
asks two questions, "Patient is under 18" and "Needs a guardian (disability)", whenever `dob` is null.
Registration re-checks the entered DOB on submit (T076).

**Independent Test**: Quickstart §3 row 9 and the US3 specs.

- [ ] T070 [P] [US3] Write `v2/consent/consent-dialog/guardian-step/guardian-step.component.spec.ts`. Cover:
    - Name, relationship and phone are required; phone must be a 10-digit Indian mobile.
    - `otp-verify` with purpose `GUARDIAN`; verified sets `verification: 'OTP'`.
    - `guardianNoPhone` reveals the fallback choice:
        - `ID_SIGHTED` needs the `guardianIdSighted` tick;
        - `UNVERIFIED` needs a witness name and a `media-capture` photo of the signed form.
    - `guardianType` is `DISABILITY_GUARDIAN` when the input `guardianFlag` is true, else `PARENT`.
    - `guardianChange` is emitted with `guardianValid` from the core.
- [ ] T071 [P] [US3] Implement `v2/consent/consent-dialog/guardian-step/guardian-step.component.{ts,html}`.
- [ ] T072 [P] [US3] Write `src/consent/consent-dialog/guardian-step/guardian-step.component.spec.ts` with the same cases as T070.
- [ ] T073 [P] [US3] Implement `src/consent/consent-dialog/guardian-step/guardian-step.component.{ts,html,css}`.
- [ ] T074 [US3] Extend both language-step specs and components (v2 and src):
    - When `dob` is null, show two checkboxes, `under18` and `guardianRequired`, and emit them with the language.
    - When `dob` is given, hide them.
- [ ] T075 [US3] Extend both `consent-dialog.component.spec.ts` files and components:
    - When `needsGuardian(...)`, show the guardian step before the decision view.
    - `canAccept` also needs `guardianValid`.
    - The save request has `consentingParty: 'GUARDIAN'` and the `guardian` block (including fallback `evidenceIds` uploaded first).
    - With `dob` under 18, the patient cannot choose `SELF`.
- [ ] T076 [US3] Extend both registration hook specs (T038, T052) and edits (T039, T053). On final submit with the feature on, compute the age from the entered DOB. If the patient is under 18 and `consentResult` was not a guardian consent:
    - block the submit;
    - show the existing `ConfirmationService.alert` with `currentLanguageSet.consent.guardianTitle`;
    - reopen `ConsentDialogService.open({ context: 'REGISTRATION', beneficiaryRegId: null, dob })`.

  This needs `consentingParty` added to `ConsentDialogResult`; add the field in `src/consent/core/consent.models.ts` and set it in both dialogs. Feature off: unchanged.

**Checkpoint**: The guardian flow, the fallback and the DOB re-check are covered on both tracks.

---

## Phase 6: User Story 4 - Existing patient with missing or outdated consent is prompted on revisit (Priority: P2)

**Goal**: A "Consent pending" banner in the patient header that opens the consent dialog and tells the
host the pending state.

**Independent Test**: Quickstart §3 row 12 with each `mockPendingActions` reason.

- [ ] T077 [P] [US4] Write `v2/consent/consent-entry/consent-entry.component.spec.ts` (US4 scope). Cover:
    - It renders nothing when the feature is off, or when `beneficiaryRegID` is null, undefined or `''`.
    - It calls `getPendingActions(+beneficiaryRegID)` on init and on input change, and emits `pendingChange` with the list.
    - An empty list shows no banner.
    - Each reason shows `pendingBanner` + `pending<REASON>`.
    - The banner action calls `ConsentDialogService.open({ context: 'REGISTRATION', beneficiaryRegId, dob })`. After `GRANTED`/`PARTIAL` it reloads pending actions and emits `consentUpdated`.
    - An API error hides the banner and emits nothing.
    - It unsubscribes on destroy.
- [ ] T078 [P] [US4] Implement `v2/consent/consent-entry/consent-entry.component.{ts,html}` (selector `app-consent-entry`, `@Input() beneficiaryRegID`, `@Input() dob`, `@Output() pendingChange`, `@Output() consentUpdated`) per [contracts/ui-components.md](./contracts/ui-components.md).
- [ ] T079 [P] [US4] Write `src/consent/consent-entry/consent-entry.component.spec.ts` with the same cases as T077.
- [ ] T080 [P] [US4] Implement `src/consent/consent-entry/consent-entry.component.{ts,html,css}`.
- [ ] T081 [US4] Export `ConsentEntryComponent` from both `public-api.ts` barrels.
- [ ] T082 [US4] In `FE/MMU-UI/src/app/app-modules/core/components/beneficiary-details/`:
    - add `ConsentEntryComponent` (from `Common-UI/v2/consent/public-api`) to the component's `imports`;
    - add one line `<app-consent-entry [beneficiaryRegID]="<existing beneficiaryRegID field>" [dob]="<existing dob field or null>"></app-consent-entry>` at the end of the header in `beneficiary-details.component.html`, using the field the component already reads (route param `beneficiaryRegID` or session).

  Change nothing else. Add one spec case to the existing host spec: the element is present and gets the ID.
- [ ] T083 [P] [US4] Do the same as T082 in `FE/HWC-UI/src/app/app-modules/core/components/beneficiary-details/` and `FE/TM-UI/src/app/app-modules/core/components/beneficiary-details/`. Import from `Common-UI/src/consent/public-api`. If the host component is NgModule-declared, add the standalone `ConsentEntryComponent` to that module's `imports` (`core.module.ts`).

**Checkpoint**:

- The banner shows for each pending reason in all three hosts with the feature on.
- With the feature off, the hosts' existing specs and builds match `baseline.md`.

---

## Phase 7: User Story 5 - Patient views and changes consent in the preference centre (Priority: P2)

**Goal**: A "Consent" button in the patient header opens the preference centre dialog: status list,
change, withdraw, history and doctor-access cancel.

**Independent Test**: Quickstart §3 rows 13–14.

- [ ] T084 [P] [US5] Write `v2/consent/preference-centre/preference-centre.component.spec.ts`. Cover:
    - It loads `getConsents` and `getAccessGrants` on init.
    - Each `current` row shows the name, `status<STATUS>`, `validUntil` (or nothing when null) and the mandatory/optional label.
    - Changing an optional purpose leads to `ConfirmationService.confirm(...)`, then `changePreference` with only that purpose, its `versions` and a key, then a reload.
    - Mandatory purposes have no change switch.
    - Withdraw one:
        - calls `ConfirmationService.confirm(consent.withdraw, consent.withdrawImplications, ...)`; `true` calls `withdraw` with `[code]`, `false` does nothing;
        - a non-withdrawable purpose shows `notWithdrawable` and the withdraw button is disabled;
        - a 422 `NOT_WITHDRAWABLE` from the server also shows `notWithdrawable`.
    - Withdraw all sends `'ALL'`; when any purpose is non-withdrawable, the implications list names it as kept.
    - `STALE` calls `ConfirmationService.alert(consent.staleReload)` and reloads.
    - The history tab lists `history` newest first with date, purpose, decision, mode, `capturedBy` and language, plus a `notSynced` marker when `syncStatus` is `NOT_SYNCED` (FR-034).
    - Doctor access lists the `ACTIVE` grants. Cancel leads to `ConfirmationService.confirm(...)`, then `revokeAccess`, then a reload that shows `REVOKED`.
    - Empty data shows empty states, and an API error shows `serviceUnavailable`.
    - The close button closes the dialog.
    - It emits `consentUpdated` after any successful change.
- [ ] T085 [P] [US5] Implement `v2/consent/preference-centre/preference-centre.component.{ts,html}` with Zard `z-card`, `z-checkbox[role=switch]`, `z-button` and `z-tabs` (if present in `v2/ui`; otherwise two `z-button` toggles).
- [ ] T086 [P] [US5] Write `src/consent/preference-centre/preference-centre.component.spec.ts` with the same cases as T084.
- [ ] T087 [P] [US5] Implement `src/consent/preference-centre/preference-centre.component.{ts,html,css}` with `mat-slide-toggle` and `mat-tab-group`.
- [ ] T088 [US5] Add `openPreferenceCentre(beneficiaryRegId)` to `v2/consent/consent-dialog.service.ts` and `src/consent/consent-dialog.service.ts`. It uses the same dialog options as `open()`, with `zMaskClosable: false` / `disableClose: true`. Add spec cases to both service specs.
- [ ] T089 [US5] Extend both `consent-entry` specs and components:
    - render the `consentButton` `z-button` / `mat-stroked-button`;
    - clicking it calls `openPreferenceCentre(+beneficiaryRegID)`;
    - on close, reload pending actions and emit `consentUpdated`.

**Checkpoint**: Preference centre flows pass on both tracks; quickstart rows 13–14 pass.

---

## Phase 8: User Story 6 - Patient approves a doctor's time-limited access by OTP (Priority: P3)

**Goal**: Approve a pending access request by OTP to the patient, or to the guardian for a child.

**Independent Test**: The US6 specs using `mockAccessGrants` (`PENDING`) with correct and wrong OTP.

- [ ] T090 [P] [US6] Write `v2/consent/access-approval/access-approval.component.spec.ts`. Cover:
    - It shows the grantee, purposes and `approveAccess` with the days computed from `validUntil`.
    - It embeds `otp-verify` with purpose `ACCESS_GRANT` and `refId = grantId`.
    - After verification, Approve calls `approveAccess(grantId, challengeId, key)` and closes with the updated `ACTIVE` grant.
    - A wrong OTP shows `otpInvalid`.
    - Close returns `null`.
- [ ] T091 [P] [US6] Implement `v2/consent/access-approval/access-approval.component.{ts,html}`.
- [ ] T092 [P] [US6] Write `src/consent/access-approval/access-approval.component.spec.ts` with the same cases as T090.
- [ ] T093 [P] [US6] Implement `src/consent/access-approval/access-approval.component.{ts,html,css}`.
- [ ] T094 [US6] Add `openAccessApproval(beneficiaryRegId, grantId)` to both `consent-dialog.service.ts` files, with spec cases.
- [ ] T095 [US6] Extend both `consent-entry` specs and components:
    - when `getAccessGrants` returns a `PENDING` grant, show the `accessRequest` link;
    - clicking it calls `openAccessApproval`;
    - on close, reload.

  For a child patient (pending actions or grant data says the guardian is required), the OTP goes to the guardian phone returned by the grant.

**Checkpoint**: The approval flow is covered on both tracks.

---

## Phase 9: User Story 7 - Staff see a clear reason when an action is blocked for consent (Priority: P3)

**Goal**: One plain message per refusal reason, shown through the host `ConfirmationService`, with an
"Open consent" action where it applies (research R14). The host turns it on with one provider line.

**Independent Test**: Quickstart §3 row 16 and the US7 specs for all 6 reasons.

- [ ] T096 [P] [US7] Write `v2/consent/consent-refusal/consent-refusal.interceptor.spec.ts` (`provideHttpClient(withInterceptors([consentRefusalInterceptor]))` + `HttpTestingController`, `ConfirmationService` as a `jasmine.createSpyObj` with `confirm` and `alert`). Cover:
    - A 200 passes through.
    - A 403 without a known reason passes through with no message.
    - A 403 with a reason shows one message and re-throws the same `HttpErrorResponse`:
        - for `OPEN_CONSENT` reasons, `confirm(consent.title, consent.refusal<REASON>, consent.openConsent, consent.close)`;
        - for others, `alert(consent.refusal<REASON>, 'error')`.
    - With the feature off, no message is ever shown.
    - `confirm` returning `true` calls `ConsentDialogService.open` with the `beneficiaryRegID` from session; `false` does nothing.
    - A cross-facility refusal uses `alert` with `consent.requestAccess` appended (spec US7 scenario 3).
- [ ] T097 [P] [US7] Implement `v2/consent/consent-refusal/consent-refusal.interceptor.ts` as a functional `HttpInterceptorFn` that uses `consentRefusalFrom` from the core and the host `ConfirmationService`.
- [ ] T098 [P] [US7] Write `src/consent/consent-refusal/consent-refusal.interceptor.spec.ts`, covering both the class `ConsentRefusalInterceptor` via `HTTP_INTERCEPTORS` and the functional form, with the same cases as T096.
- [ ] T099 [P] [US7] Implement `src/consent/consent-refusal/consent-refusal.interceptor.ts`, exporting both the functional `consentRefusalInterceptor` and the class `ConsentRefusalInterceptor`.
- [ ] T100 [US7] Export the interceptor from both `public-api.ts` barrels.
- [ ] T101 [US7] Opt the three hosts in with one provider line each, placed after the existing interceptor so existing error handling runs unchanged:
    - `FE/MMU-UI/src/main.ts`: add `consentRefusalInterceptor` to the existing `provideHttpClient(withInterceptors([...]))` call, or to `withInterceptorsFromDi` if that is used.
    - `FE/HWC-UI` and `FE/TM-UI` `core.module.ts`: add `{ provide: HTTP_INTERCEPTORS, useClass: ConsentRefusalInterceptor, multi: true }`.

**Checkpoint**: All 6 reasons are covered on both tracks; hosts behave identically with the feature off.

---

## Phase 10: Polish & Cross-Cutting Concerns

- [ ] T102 [P] Accessibility pass on both tracks, adding spec assertions where missing:
    - every control has a label or `aria-label`;
    - the dialogs trap focus and return it on close;
    - purpose switches expose `role="switch"` + `aria-checked`;
    - Accept/Decline are reachable by keyboard;
    - error messages use `role="alert"`.
- [ ] T103 [P] Run `npm run lint` in FE/MMU-UI, FE/HWC-UI and FE/TM-UI. Fix lint issues in new consent files only; there are no new warnings versus `baseline.md`.
- [ ] T104 Run quickstart §1 coverage in FE/MMU-UI and FE/HWC-UI. Coverage for `Common-UI/src/consent/**` and `Common-UI/v2/consent/**` must be ≥ 99 % on all four metrics. Add spec cases until it is, and record the numbers in `specs/001-consent-management-ui/baseline.md`.
- [ ] T105 Run the no-regression gate from quickstart §2 with the feature off:
    - Full `npm run lint`, `ng test` and `npm run build` in FE/MMU-UI, FE/HWC-UI and FE/TM-UI must match `baseline.md`.
    - In FE/Admin-UI, FE/ECD-UI, FE/Inventory-UI, FE/HWC-Inventory-UI, FE/HWC-UI-integration and FE/Helpline1097-UI-NEXT, each with its `Common-UI` checked out at the feature branch, `npx ng test --watch=false --browsers=ChromeHeadless` and `npm run build` must give the same pass/fail counts as `baseline.md` (Constitution VII).

  Record the results in `baseline.md`.
- [ ] T106 Run the quickstart §3 manual walkthrough (rows 1–16) on MMU-UI and HWC-UI with the mock server, and note any failures in `baseline.md`.
- [ ] T107 [P] Write the Common-UI PR description in `specs/001-consent-management-ui/pr-description.md`. Include:
    - what was added;
    - every changed line in existing files with its reason (T039, T053, T076);
    - the host changes per repo;
    - the coverage numbers;
    - the Common-UI impact list for all 9 consumers (Constitution VII);
    - the back-end **[FE ask]** items from contracts/consent-api.md.
- [ ] T108 [P] In `specs/001-consent-management-ui/checklists/requirements.md`, delete the stale note "Open: FR-036 …".

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: none. T001 and T002 first (decisions; T001 blocks T003, T002 blocks T009); then T003; then T004–T007.
- **Foundational (Phase 2)**: needs Phase 1. It blocks every user story.
- **US1 (Phase 3)**: needs Phase 2. **MVP.**
- **US2 (Phase 4)**: needs US1 (it extends proof-step and consent-dialog).
- **US3 (Phase 5)**:
    - needs US1, and US2's `otp-verify` and `media-capture` (T055–T063);
    - T076 extends the US1 registration hook.
- **US4 (Phase 6)**: needs US1 (`ConsentDialogService.open`). It is independent of US2 and US3.
- **US5 (Phase 7)**: needs US4 (`consent-entry` hosts the button).
- **US6 (Phase 8)**: needs US2 (`otp-verify`) and US4 (`consent-entry`).
- **US7 (Phase 9)**: needs Phase 2 and US1 (`ConsentDialogService`). It can run alongside US2–US6.
- **Polish (Phase 10)**: after all the stories you want to ship.

### Within each story

The spec task comes before its implementation task. The `v2` and `src` tracks touch different files, so
the matching pairs (e.g. T026/T027 and T040/T041) can run in parallel.

### Parallel opportunities

- **Phase 2**: T008, T009, T010, T012, T013, T015, T017, T019, T021, T023 and T024 are all different
  files.
- **US1**: T026–T033 (v2 steps) alongside T040–T047 (src steps). The shells (T034–T039, T048–T053) follow
  their steps.
- **US2**: T055–T063 (4 component pairs) in parallel.
- **US4, US5, US6 and US7**: each story's v2 and src pairs in parallel. US7 can start once US1 is done.

## Parallel Example: User Story 1

```text
# Steps, both tracks at once (8 developers or agents):
T026+T027  v2 language-step      | T040+T041  src language-step
T028+T029  v2 notice-step        | T042+T043  src notice-step
T030+T031  v2 purposes-step      | T044+T045  src purposes-step
T032+T033  v2 proof-step         | T046+T047  src proof-step
# Then, per track: dialog shell → dialog service → registration hook
T034→T035→T036→T037→T038→T039    | T048→T049→T050→T051→T052→T053
```

## Implementation Strategy

### MVP first (US1 on MMU-UI)

1. Phase 1 (Setup), then Phase 2 (core) and its checkpoint.
2. US1 `v2` track (T026–T039) and T054 (barrel), giving MMU-UI new-registration consent with Self-read
   proof.
3. Validate with quickstart §3 rows 1–8 and the §2 regression gate on MMU-UI. Demo.
4. US1 `src` track (T040–T053) for HWC-UI and TM-UI.

### Incremental delivery

- US1, then US2 + US3: the P1 set completes the legal minimum for new patients.
- US4 + US5: existing patients and withdrawal (P2).
- US6 + US7: doctor access and refusal messages (P3).
- Each increment re-runs T104 and T105 before merge.

### Ship gate (every increment)

Constitution gates 1–8:

- Reuse and placement checks.
- Diff limited to new files plus the listed hook lines.
- Lint, tests at ≥ 99 % coverage and build pass.
- Common-UI consumers built.
- PR description complete.
