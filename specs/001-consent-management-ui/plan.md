# Implementation Plan: Consent Management UI (Common-UI)

**Branch**: `001-consent-management-ui` (Common-UI, cut from `origin/angular-zard-migration`) |
**Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-consent-management-ui/spec.md`

## Summary

This adds DPDP-compliant consent capture to the shared Common-UI submodule: a consent dialog, guardian
step, proof capture, a "Consent pending" banner, a preference centre, doctor-access approval, and
consent-refusal messages. HWC-UI, TM-UI and MMU-UI use them.

Design:

- **One shared consent core** (models, API client, rules, refusal mapper, mocks) in `src/consent/core/`.
- **Two thin UI tracks** on top of it:
  - `src/consent/` with Angular Material, for HWC-UI and TM-UI on Angular 16.
  - `v2/consent/` with Zard UI + Tailwind, for MMU-UI on Angular 20.
- **Off by default**: everything sits behind `environment.consentManagement?.enabled`.
- **Edits to existing code**:
  - A minimal hook in the two `registration.component.ts` copies.
  - One-line placements and config in the three enabled hosts.

Details: [research.md](./research.md).

## Technical Context

**Language/Version**:

- TypeScript 5.1 (HWC-UI, TM-UI) and 5.8 (MMU-UI).
- Angular 16.2 (`src` track) and Angular 20.3 (`v2` track).
- The core compiles on 16, 20 and 21. It uses no signals-only APIs, no `@if` control flow and no
  `input()` functions.

**Primary Dependencies**:

- Existing only: Angular Material 16 (`src`), Zard UI `v2/ui` + Tailwind 4 (`v2`), RxJS 7.8,
  `ngx-webcam` ^0.4.1, `recordrtc` ^5.6.2.
- `ng-cryptostore` through `SessionStorageService`.
- No new npm packages.

**Storage**: None. Only a per-browser device ID in `localStorage` (R13); proof blobs live in memory
only.

**Testing**:

- Jasmine + Karma (`@angular-devkit/build-angular:karma`).
- `HttpClientTestingModule`, `jasmine.createSpyObj`, `fakeAsync`.
- Shared mocks in `src/consent/core/testing/`.

**Target Platform**:

- Chrome on facility and van desktops or laptops, at 1024 px width and up.
- MMU vans may be on plain HTTP to a LAN server (R8).

**Project Type**: Shared Angular UI library (git submodule) consumed by several Angular apps.

**Performance Goals**:

- The dialog opens in under 1 s after the notice response.
- A self-reading adult completes consent in under 3 min, excluding reading time (SC-003).

**Constraints**:

- Off means identical behaviour in all 9 consumers.
- The dialog cannot be dismissed by backdrop or Esc.
- No RTL languages this release.
- The UI works against a van's local server.

**Scale/Scope**:

- 7 user stories and 41 functional requirements.
- About 8 components per track, 6 core services/utilities, and 13 API calls.

## Constitution Check

*Gate before Phase 0; re-checked after Phase 1.* Source: `.specify/memory/constitution.md` v1.0.0.

| Principle | Status | How the plan complies |
| --- | --- | --- |
| I. Reuse First | PASS (1 exception, pending approval) | One core shared by both tracks. Reuses `SessionStorageService`, `SetLanguageComponent`/`HttpServiceService`, `MatDialog`/`ZardDialogService`, host `ConfirmationService` for every confirm and message (R14), host `camera-dialog` for photos (R7), `recordrtc`, and v2/ui primitives. Reuse rejected with reasons for `AudioRecordingService` and `abha-enter-otp-component` (R7). Mocks are shared by both tracks' specs. **Exception**: API paths are code constants under one env base URL (Complexity Tracking row 4); needs FE tech lead approval (task T002) |
| II. Structure & Standards | PASS | New `consent/` folder beside `registrar/`, `feedback/` and `tracking/` in both `src/` and `v2/`. Kebab-case files and `app-` prefix. GPL header. Existing i18n pattern. v2 follows the MMU-UI Zard rules (no Material, no component CSS, standalone) |
| III. No Regressions | PASS | Feature flag absent means off; all hooks are guarded. Lint, test and build are gated for MMU, HWC and TM, plus a build check for the other 6 consumers (quickstart §2) |
| IV. Additive Only | PASS (justified edits) | Edits to existing code are listed in Complexity Tracking; every one is guarded by the flag and minimal |
| V. Minimal Code | PASS | No new dependency, no z-switch component (R10), no rights or grievance screens. One base URL key instead of 14 |
| VI. Tests ≥ 99 % | PASS (plan) | Every new file has a co-located spec with mock data. The coverage run is in quickstart §1. The host `tsconfig.spec.json` include is a test-only change (R12) |
| VII. Common-UI Cross-Service Safety | PASS (plan) | Consumers inventoried (R1, R3). There are no renamed or removed exports, the existing `public-api.ts` files are untouched, and the code works on Angular 16, 20 and 21. All 9 consumers are verified before merge (quickstart §2) |

**Post-design re-check (after Phase 1)**: PASS. No new violations; the justified edits are unchanged.

**Open risk (not a constitution violation)**: `v2/` exists only on `angular-zard-migration`. HWC-UI and
TM-UI pick up `src/consent` only once that line reaches the Common-UI commit they pin. The branch
strategy must be agreed with the Common-UI maintainers before `/speckit-implement`. This is task T001,
which blocks the branch creation. **Decision (2026-10-13, T001)**: split.
- `001-consent-management-ui` is cut from `origin/main`. It holds `src/consent/` (core + Material
  track) and the `src` registration hook, for HWC-UI and TM-UI.
- `001-consent-management-ui-v2` is cut from `origin/angular-zard-migration`. It holds the same core
  commits (cherry-picked, kept identical) plus `v2/consent/` and the `v2` registration hook, for MMU-UI.
- Pinned lines today: HWC-UI → `nd/vs/m2v3` (8 template files differ from `main`; the registration and
  session files are identical); TM-UI → `release-3.6.2`; MMU-UI → `angular-zard-migration`.
- Each host picks up the feature when its pinned line merges the matching branch.

## Project Structure

### Documentation (this feature)

```text
specs/001-consent-management-ui/
├── spec.md
├── plan.md              # this file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── consent-api.md   # assumed back-end contract (+ FE asks)
│   ├── ui-components.md # public API for consuming services
│   └── i18n-keys.md     # interface text keys hosts add
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks (not created here)
```

### Source Code (Common-UI repository root)

```text
src/consent/                                   # NEW (HWC-UI, TM-UI) — Angular 16, Material
├── core/                                      # shared by both tracks, no UI-library imports
│   ├── consent.models.ts                      # data-model.md types
│   ├── consent-api.paths.ts                   # endpoint paths (R5)
│   ├── consent-feature.ts                     # isConsentFeatureEnabled(), apiBase()
│   ├── consent-api.service.ts                 # 13 calls, OutputResponse unwrap, Idempotency-Key
│   ├── consent-draft.ts                       # pure rules: canAccept, needsGuardian, proof validation, state
│   ├── consent-refusal.ts                     # ConsentRefusal.from(error)
│   ├── consent-context.service.ts             # session data → capturedBy, facility, device ID (R13)
│   ├── evidence.util.ts                       # sha256 (when available), uuid v4, duration check (R8)
│   ├── ui/*.base.ts                           # abstract directives holding all step/dialog logic for both tracks
│   ├── testing/*.suite.ts                     # behaviour specs run by each track's spec files
│   ├── testing/consent.mock.ts                # shared mock data
│   └── *.spec.ts
├── consent-dialog/                            # dialog shell + steps
│   ├── consent-dialog.component.{ts,html,css,spec.ts}
│   ├── language-step/ notice-step/ purposes-step/ proof-step/ guardian-step/
├── otp-verify/                                # reused by OTP mode, guardian, access approval
├── media-capture/                             # photo (host camera-dialog) + voice (recordrtc) + upload fallback
├── preference-centre/
├── access-approval/
├── consent-entry/                             # header button + pending banner
├── consent-refusal/                           # interceptor only (functional + class); messages via ConfirmationService
├── consent-dialog.service.ts
└── public-api.ts

v2/consent/                                    # NEW (MMU-UI) — Angular 20, Zard + Tailwind
├── (same component folders as src/consent, no core/ — imports ../../src/consent/core)
└── public-api.ts

Existing files touched (guarded, minimal):
src/registrar/registration/registration.component.ts     # openConsent() + payload (R4)
v2/registrar/registration/registration.component.ts      # same
```

**Host changes (outside Common-UI, in HWC-UI, TM-UI and MMU-UI only)**:

- One `<app-consent-entry>` line in the host's `core/components/beneficiary-details` template.
- A `consentManagement` key in the environment files and CI template.
- The `consent` key group in `src/assets/*.json`.
- The test include in `tsconfig.spec.json`.
- An optional interceptor provider.

**Structure Decision**: A new `consent/` feature folder in both existing Common-UI trees, mirroring how
`registrar/` exists in both. The non-UI core lives once under `src/consent/core/`, and `v2` imports it
by relative path so logic is never duplicated.

## Complexity Tracking

| Deviation | Why needed | Simpler alternative rejected because |
| --- | --- | --- |
| Edit `registration.component.ts` (src + v2): `openConsent()` and 2 payload fields, behind the flag | The spec requires the new dialog in registration and the real outcome instead of hard-coded `true` (FR-001, FR-035) | Leaving it would keep the DPDP gap. Wrapping the component from outside cannot change its payload |
| Two UI tracks | Consumers are split between `src` (Material, ng16) and `v2` (Zard, ng20) | One track cannot be used by the other consumers (R1) |
| `v2` imports `../../src/consent/core` across trees | Avoids a second copy of the logic | Copying the core into `v2` breaks Constitution I |
| One `apiBase` key instead of per-URL env keys (Constitution I exception) | 13 endpoints × 3 hosts × CI templates | Per-URL keys add about 40 env lines for no benefit (R5). **Approved by**: _pending — FE tech lead. Built as designed (user decision 2026-10-13, T002); if refused, only `consent-api.paths.ts` and the URL lookup in `consent-api.service.ts` change_ |
| Host `tsconfig.spec.json` include line (test-only) | Common-UI specs are otherwise never compiled or measured | Without it the ≥ 99 % coverage rule cannot be verified (R12) |
| One line in each host's own beneficiary-details header | The patient header is host-owned, not Common-UI's (R3) | Editing Common-UI's beneficiary-details reaches no workarea |
