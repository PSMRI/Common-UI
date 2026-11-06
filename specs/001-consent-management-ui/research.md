# Research: Consent Management UI (Common-UI)

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-10-13

Findings come from a read-only survey of `FE/MMU-UI/Common-UI` (`main` @ 100f09a and
`origin/angular-zard-migration` @ 7b6094a) and the consumers HWC-UI, MMU-UI and TM-UI.

## R1. Common-UI has two UI tracks; consumers are split across them

- **Decision**: Build one framework-light **consent core** (models, API client, refusal mapper,
  validators, dialog state) once, in `src/consent/core/`, written to compile on Angular 16, 20 and 21.
  Build two thin UI layers on top of it:
  - `src/consent/` with standalone components on Angular Material, for **HWC-UI** and **TM-UI**.
  - `v2/consent/` with standalone components on Zard UI + Tailwind, for **MMU-UI**.
- **Rationale**:
  - HWC-UI and TM-UI (Angular 16, Material) import `Common-UI/src/...`.
  - MMU-UI (Angular 20, no Material, Zard + Tailwind) imports `Common-UI/v2/...`.
  - One shared core avoids duplicating logic (Constitution I); only markup and styling differ per track.
- **Alternatives considered**:
  - Build only in `src/`: MMU-UI forbids Material in migrated screens (MMU-UI CLAUDE.md).
  - Build only in `v2/`: HWC-UI and TM-UI do not consume `v2` and have no Zard or Tailwind.
  - Full copy per track, as `v2/registrar` does today: rejected as duplication.
- **Constraint**: `v2/` exists only on `origin/angular-zard-migration`. MMU-UI already pins Common-UI
  to e42a0a2 on that line. The local MMU-UI checkout of Common-UI is on `main` (`+100f09a`, a mismatch).
  The feature branch is therefore cut from `origin/angular-zard-migration`, the only line that contains
  both `src/` and `v2/`.

## R2. Delivery order

- **Decision**: Build the core first, then the `v2` track (MMU-UI), then the `src` track
  (HWC-UI and TM-UI).
- **Rationale**: MMU-UI is the active workspace and already pins the zard line. The core is fully
  testable without any UI. The `src` track then reuses the same core and test fixtures.
- **Alternatives considered**: `src` first, which would need the zard line merged for HWC and TM anyway.

## R3. Where the preference centre and pending banner are opened

- **Finding**: Common-UI's `app-beneficiary-details` is used only by `family-tagging-details`. The patient
  header seen in HWC, MMU and TM workareas is each host's own component with the **same selector**:
  - `src/app/app-modules/core/components/beneficiary-details/` in each host.
  - Used in nurse-doctor and lab workareas.
- **Decision**: Common-UI ships one standalone `app-consent-entry` component (input `beneficiaryRegID`).
  It shows:
  - the "Consent" button, which opens the preference-centre dialog;
  - a "Consent pending" banner with its reason, when pending actions exist; the banner opens the consent
    dialog.

  It also emits `pendingChange` so the host can apply its own D-02 treatment rule. Each host adds
  `<app-consent-entry>` once to its own beneficiary-details header, behind the feature flag.
- **Rationale**:
  - This matches the clarified intent: a "Consent" button in the patient header shown on every patient
    screen, opening a dialog.
  - Editing Common-UI's beneficiary-details would not reach any workarea.
  - It also covers the revisit banner (spec Story 4) without touching `search.component.ts`.
- **Alternatives considered**:
  - Edit Common-UI `beneficiary-details`: has no effect on workareas.
  - A hook in `search.component.ts` revisit: modifies more existing shared code (Constitution IV).
- **Spec impact**: FR-021a was reworded to say the button sits in the patient header shown by each
  service. Recorded in spec Clarifications.

## R4. Linking consent to a new patient who has no ID yet

- **Finding**: Consent is captured before registration (FR-001). The registration response returns only a
  text `res.data.response` from which the beneficiary ID is parsed; `beneficiaryRegID` is not available
  (`registration.component.ts` L331-337). `beneficiaryConsent: true` is hard-coded at L405 (v2 L569).
- **Decision**:
  1. The consent dialog saves the consent with `beneficiaryRegId: null` and receives a `consentId`.
  2. When the feature is on, registration sends `beneficiaryConsent` (the real outcome as a boolean)
     plus `consentId` in its existing payload.
  3. The back end links the consent to the new patient.
  4. With the feature off, the payload is byte-for-byte unchanged.
- **Rationale**: Consent must exist before any personal data (FR-001, FR-009). The back end already
  receives the registration call, so it is the only place that knows both IDs.
- **Alternatives considered**:
  - Keep consent in memory and save after registration: data would be collected before the consent is
    recorded, and a failed save would leave a registered patient with no consent.
  - A second link call from the UI after registration: the UI has no `beneficiaryRegID` to send.
- **Back-end dependency**:
  - Consent-API accepts an unlinked consent.
  - Identity-API reads `consentId` in the registration payload.
  - Both are listed in [contracts/consent-api.md](./contracts/consent-api.md) and must be agreed with
    the BE team. Per team practice the FE builds against this assumed contract with mocks.

## R5. Feature switch and API base URL

- **Decision**:
  - Common-UI reads `environment.consentManagement?.enabled`. When the key is absent, the feature is off,
    so consumers that do not add it (Admin, ECD, Inventory, HWC-Inventory, 1097-NEXT) need no change.
  - Endpoints are built from one base, `environment.consentManagement.apiBase`, plus path constants in
    `src/consent/core/consent-api.paths.ts`.
- **Rationale**:
  - Common-UI already reads `environment` from `src/environments/environment`.
  - Optional chaining keeps missing keys safe (Constitution III).
  - One base key instead of 14 URL keys per host keeps host changes to two lines.
- **Constitution I exception**: "API URLs MUST come from config" is met for the host and base path
  only. The paths are code constants. This needs FE tech lead approval, recorded in plan.md Complexity
  Tracking (task T002).
- **Alternatives considered**: One env key per URL, the existing registrar pattern. It would mean 14 new
  keys in each of 3 hosts and their CI templates. The deviation is recorded in plan Complexity Tracking.

## R6. Text and languages

- **Decision**: The UI uses two separate language sources.
  - **Interface text** (labels, buttons, messages) uses the app language through the existing
    `SetLanguageComponent` pattern, under a new `consent` key group in each host's
    `src/assets/<Language>.json`. The key list is in [contracts/i18n-keys.md](./contracts/i18n-keys.md).
  - **Notice text and audio** use the *patient's* chosen language and come from the notice API, not from
    JSON.
- The language picker lists languages returned by the notice API, minus the RTL codes `ur`, `ks` and `sd`
  (FR-002).
- **Rationale**: The language JSON files live in each host, not in Common-UI. This is the existing
  mechanism (FR-032).
- **Alternatives considered**: JSON shipped inside Common-UI, which would be a second i18n mechanism.

## R7. Proof capture

- **Photos: the host `CameraService.capture()`** (checked in T059, 2026-10-14).
  - All three hosts export `CameraService` from `src/app/app-modules/core/services`, the same barrel
    Common-UI already imports.
  - HWC-UI and TM-UI open the camera dialog with `MatDialog`; MMU-UI uses `ZardDialogService`.
    `capture()` returns `afterClosed()` in all three.
  - A taken photo comes back as a data URL (`sysImage`, `imageAsDataUrl`); cancel gives `false` or
    `undefined`.
  - Common-UI's registration step already uses `cameraService.capture()` the same way.
  - `media-capture` converts the data URL into a `Blob`. It always offers image upload as well.
- **Voice: the browser's `MediaRecorder`** (no library), with an `accept="audio/*"` upload fallback.
  The 30–60 s rule uses the recording time, or the audio metadata for an upload.
  - Changed from `recordrtc` during implementation: HWC-UI has `recordrtc` but no `@types/recordrtc`,
    so importing it from shared code fails HWC-UI's strict compile.
  - `MediaRecorder` is built into every supported browser, so no dependency is needed (Constitution V).
  - The host `AudioRecordingService` is not reused: it lives in `nurse-doctor/shared`, is missing in
    HWC-UI, and posts to its own endpoint.
- **OTP: a new `otp-verify` component.** `abha-enter-otp-component` is tied to ABHA enrolment calls and
  `MAT_DIALOG_DATA`. It emits `{ challengeId, phone }` so the guardian step (US3) can reuse it.

## R8. Fingerprints and request keys on van servers (insecure context)

- **Finding**: MMU vans may serve the UI over plain HTTP on a LAN address. There, `crypto.subtle` and
  `crypto.randomUUID` are unavailable; `crypto.getRandomValues` is still available.
- **Decision**:
  - **Notice fingerprint**: send back the server-provided `textHash` and `noticeVersionId`. No hashing
    on the client.
  - **Evidence fingerprint**: compute SHA-256 with `crypto.subtle` when available. Otherwise send `null`;
    the server computes and stores it on upload, and must verify it anyway.
  - **Idempotency key**: a UUID v4 built from `crypto.getRandomValues`, generated once per dialog
    decision and reused on retry (FR-011).
- **Alternatives considered**: A JS SHA-256 library, which would be a new dependency for a value the
  server must recompute anyway.

## R9. Unlock rules: scroll-to-end and audio-to-end

- **Decision**:
  - A sentinel element at the end of the notice is watched with `IntersectionObserver`. If that is not
    supported, a scroll listener checks `scrollTop + clientHeight >= scrollHeight - 2`.
  - The audio `ended` event marks it played. Seeking past the end is not counted: `timeupdate` tracks the
    furthest point played.
  - Either condition unlocks Accept (FR-005).
  - If the audio fails to load, only the scroll rule applies (spec edge case).
- **Rationale**: Works in every supported browser with no dependency.

## R10. Dialog behaviour

- **Decision**:
  - `src`: `MatDialog.open(..., { disableClose: true })`.
  - `v2`: `ZardDialogService` with backdrop and Esc close turned off.
  - The dialog has its own close button, which returns `{ outcome: 'NO_DECISION' }` (FR-001a, FR-008).
  - Content scrolls inside the dialog. Width is `min(960px, 95vw)` and height `90vh` (FR-001b).
- **Zard gap**: v2/ui has no switch component. Purpose switches use `z-checkbox` with `role="switch"`
  and `aria-checked`. A new shared `z-switch` is out of scope (Constitution V).

## R11. Blocked-action (403) handling

- **Decision**:
  - The core exports `ConsentRefusal.from(error)`. It reads the `reason` in a 403 body for one of the six
    codes and returns a `{ reason, messageKey, action }` object.
  - Each UI track ships only an opt-in `consentRefusalInterceptor`. It shows the message through the
    host `ConfirmationService` (R14), and a host enables it with one provider line.
  - Other 403s pass through untouched.
- **Rationale**: Hosts have their own `HttpInterceptorService`. An opt-in interceptor cannot change
  existing error handling unless the host adds it (Constitution III).

## R12. Running Common-UI tests and coverage

- **Finding**:
  - Host `tsconfig.spec.json` includes only `src/**/*.spec.ts`, so Common-UI specs are never compiled.
  - HWC-UI lists `Common-UI/**` in `codeCoverageExclude`.
  - Existing Common-UI specs are boilerplate or stale (`search.component.spec.ts` would not compile).
- **Decision**:
  - Each host gets one added include line in `tsconfig.spec.json`. For MMU-UI it is
    `Common-UI/v2/consent/**/*.spec.ts` plus `Common-UI/src/consent/core/**/*.spec.ts`. For HWC-UI and
    TM-UI it is `Common-UI/src/consent/**/*.spec.ts`.
  - Consent specs run with `ng test --include` and a coverage override; see
    [quickstart.md](./quickstart.md).
  - Existing stale specs are not touched (Constitution IV).
- **Test style**:
  - `HttpClientTestingModule` + `HttpTestingController` for the API client.
  - `jasmine.createSpyObj` for `MatDialog`/`ZardDialogService`, `HttpServiceService` and
    `SessionStorageService`.
  - `fakeAsync`/`tick`/`flush` for timers and observers. Errors in synchronous `subscribe` are tested with
    `fakeAsync` + `flush()` (known Karma crash pattern).
  - Mock data lives in `src/consent/core/testing/consent.mock.ts`, shared by both tracks.

## R13. Session data used for proof

- **Decision**: Read via Common-UI `SessionStorageService`:
  - `userID` → `capturedBy`
  - `userName`
  - `providerServiceID` → `providerServiceMapID`
  - `facilityID`, `servicePointID`
  - service line from `serviceName`
- Device ID is a per-browser UUID stored in `localStorage` under `amrit.consent.deviceId`, created on
  first use and read inside `try/catch`.

## R14. Confirmations and messages

- **Decision**: Use the host `ConfirmationService` (`src/app/app-modules/core/services/confirmation.service`,
  already imported by Common-UI) for:
  - the decline confirmation (`cannotContinue`);
  - change, withdraw and revoke confirmations;
  - the stale-update message;
  - consent-refusal messages.
- **API**:
  - `confirm(title, message, okText, cancelText)` returns `Observable<boolean>`. It is used for
    confirmations and for refusals with the `OPEN_CONSENT` action.
  - `alert(message, status)` is used for every other message.
- **Rationale**: Constitution I. The same API exists in HWC-UI, MMU-UI and TM-UI, and is already
  Zard-based in MMU-UI.
- **Alternatives considered**: A custom refusal dialog and inline confirm panels. They would duplicate an
  existing service.
