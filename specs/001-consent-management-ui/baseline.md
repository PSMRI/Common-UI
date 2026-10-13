# Regression baseline and coverage log

Feature off (no `consentManagement` key set). Common-UI at each host's pinned commit unless stated.

## Baseline (T007)

| Repo | Common-UI | Lint | Unit tests | Build | Date |
| --- | --- | --- | --- | --- | --- |
| HWC-UI (`sn/testcases`) | `4677d34` (`nd/vs/m2v3`) | not run yet | 5089 pass, 1 fail (pre-existing: `CameraDialogComponent downloadGraph … writes the image into the fallback window`, 10 s async timeout) | not run yet | 2026-10-13 |
| MMU-UI (`sn/zard-document-sync`) | `e42a0a2` (`angular-zard-migration`) | not run yet | **cannot run**: many existing specs no longer compile (e.g. `app-header.component.spec.ts` imports `rxjs/Observable` and a removed `material.module`); Angular type-checks every spec, so `ng test` fails before any test runs | not run yet | 2026-10-13 |
| TM-UI | `e9304ae` (`release-3.6.2`) | not run yet | not run yet | not run yet | — |
| Admin-UI, ECD-UI, Inventory-UI, HWC-UI-integration | pinned | — | not run yet | not run yet | — |
| HWC-Inventory-UI, Helpline1097-UI-NEXT | pinned | — | blocked: no `node_modules` (1097-NEXT: Common-UI not initialised) | blocked | — |

The baseline uses each repo's pinned Common-UI commit, so it is independent of when it runs. The remaining
rows are run with T105 (polish), before merge.

Environment notes (2026-10-13):
- MMU-UI `node_modules` was installed before the Angular 20 migration (Angular 16.2.12, no `@ng-icons`).
  It was reinstalled with `npm ci` under Node 22 (`.nvmrc`); `package.json` and `package-lock.json` are
  unchanged. Angular 20 needs Node ≥ 20.19; the machine default is Node 18.
- `Common-UI/v2/ui/stepper/stepper.component.ts` fails to load in JIT test builds
  (`Cannot access 'ZardStepComponent' before initialization`). Specs that import the registration
  component therefore run with `CONSENT_AOT=1`.

Pre-existing, not caused by this feature: TM-UI `environment.ci.ts.template` needs `TM_UI` and
`INVENTORY_UI` from the CI environment (no defaults in `scripts/ci-prebuild.js`).

## Coverage log (T104)

How: `consent-coverage.sh` (quickstart §1). It sets `sourceRoot` to `""` for the run only, because Angular
instruments only files under `sourceRoot`, then restores `angular.json`.

| Date | Host | Scope | Specs | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-10-13 | HWC-UI (Common-UI `4677d34` + `src/consent`) | `src/consent/core/**` | 77 pass | 100 % (174/174) | 100 % (139/139) | 100 % (70/70) | 100 % (167/167) |
| 2026-10-13 | MMU-UI (Common-UI `001-consent-management-ui-v2`), JIT | `src/consent/**`, `v2/consent/**` (US1 v2 + core) | 119 pass | — | 100 % (168/168) | 100 % (130/130) | 100 % (325/325) |
| 2026-10-13 | MMU-UI, AOT (`CONSENT_AOT=1`) | lines added to `v2/registrar/registration/registration.component.ts` | 9 pass | — | 100 % (11/11) | — | 100 % (12/12) |

Statements are not in lcov; `lcov-consent.py` reports lines, branches and functions. The HWC-UI
text summary includes statements.
