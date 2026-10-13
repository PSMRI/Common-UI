# Regression baseline and coverage log

Feature off (no `consentManagement` key set). Common-UI at each host's pinned commit unless stated.

## Baseline (T007)

| Repo | Common-UI | Lint | Unit tests | Build | Date |
| --- | --- | --- | --- | --- | --- |
| HWC-UI (`sn/testcases`) | `4677d34` (`nd/vs/m2v3`) | not run yet | 5089 pass, 1 fail (pre-existing: `CameraDialogComponent downloadGraph … writes the image into the fallback window`, 10 s async timeout) | not run yet | 2026-10-13 |
| MMU-UI | `e42a0a2` (`angular-zard-migration`) | not run yet | not run yet | not run yet | — |
| TM-UI | `e9304ae` (`release-3.6.2`) | not run yet | not run yet | not run yet | — |
| Admin-UI, ECD-UI, Inventory-UI, HWC-UI-integration | pinned | — | not run yet | not run yet | — |
| HWC-Inventory-UI, Helpline1097-UI-NEXT | pinned | — | blocked: no `node_modules` (1097-NEXT: Common-UI not initialised) | blocked | — |

The baseline uses each repo's pinned Common-UI commit, so it is independent of when it runs. The remaining
rows are run with T105 (polish), before merge.

Pre-existing, not caused by this feature: TM-UI `environment.ci.ts.template` needs `TM_UI` and
`INVENTORY_UI` from the CI environment (no defaults in `scripts/ci-prebuild.js`).

## Coverage log (T104)

How: `consent-coverage.sh` (quickstart §1). It sets `sourceRoot` to `""` for the run only, because Angular
instruments only files under `sourceRoot`, then restores `angular.json`.

| Date | Host | Scope | Specs | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-10-13 | HWC-UI (Common-UI `4677d34` + `src/consent`) | `src/consent/core/**` | 77 pass | 100 % (174/174) | 100 % (139/139) | 100 % (70/70) | 100 % (167/167) |
