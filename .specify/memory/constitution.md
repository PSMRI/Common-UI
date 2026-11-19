<!--
Sync Impact Report
- Version change: (unversioned template) → 1.0.0
- Modified principles: all template placeholders replaced (initial ratification)
  - [PRINCIPLE_1] → I. Reuse First
  - [PRINCIPLE_2] → II. Follow Existing Structure & Coding Standards
  - [PRINCIPLE_3] → III. No Regressions (NON-NEGOTIABLE)
  - [PRINCIPLE_4] → IV. Additive Changes Only
  - [PRINCIPLE_5] → V. Minimal Code
- Added principles: VI. Tests for Every Implementation (NON-NEGOTIABLE),
  VII. Common-UI Cross-Service Safety (NON-NEGOTIABLE)
- Added sections: Technology & Repository Constraints, Development Workflow & Quality Gates
- Removed sections: none
- Deferred TODOs: none
-->

# AMRIT Front-End Constitution

Applies to every AMRIT front-end repository under `FE/` (Admin-UI, ECD-UI, HWC-UI,
HWC-UI-integration, HWC-Inventory-UI, Inventory-UI, MMU-UI and variants, TM-UI,
Helpline104-UI, Helpline1097-UI, Helpline1097-UI-NEXT) and to the shared `Common-UI`
submodule (`https://github.com/PSMRI/Common-UI`) consumed by them.

## Core Principles

### I. Reuse First

- Before writing anything new, search the current repo **and** `Common-UI` for an existing
  component, service, pipe, directive, validator, constant or util that already does the job.
  If one exists, it MUST be reused.
- New code MUST be written to be reusable: inputs/outputs (`@Input`/`@Output`) instead of
  hard-coded values, services for API calls and shared state, pure helper functions in the
  repo's existing `utility`/`shared`/`core` area rather than inside a component.
- No copy-paste duplication. Logic needed in two or more places MUST be extracted once and
  imported. Logic needed by two or more service lines is a candidate for `Common-UI`
  (subject to Principle VII).
- API URLs MUST come from the existing environment/config files, never hard-coded.

**Rationale**: AMRIT runs many near-identical service lines; duplication multiplies every bug
and every fix.

### II. Follow Existing Structure & Coding Standards

- New files MUST go in the folder where equivalent features already live, mirroring the
  module/feature layout of the target repo (e.g. a new Admin configuration screen lives
  beside its siblings under `app-provider-admin/provider-admin/configurations/`).
- Use Angular CLI conventions: `feature-name.component.{ts,html,css,spec.ts}`,
  `feature-name.service.ts`, kebab-case file names, PascalCase classes, camelCase members.
- Match the surrounding code: same UI library (Angular Material / existing widgets), same
  form approach (reactive vs template-driven) as the module, same HTTP/service pattern,
  same error/alert (confirmation service) pattern, same i18n/language-JSON mechanism.
- Code MUST pass the repo's existing `.eslintrc.json`, Prettier and `.editorconfig` rules;
  the Husky / lint-staged hooks MUST NOT be bypassed (`--no-verify` is forbidden).
- Use the Angular version and APIs of the target repo (16 vs 20/21 vs legacy 4.x). Do not
  introduce syntax or libraries the repo's Angular version does not already use.

**Rationale**: Consistency keeps 13 repos maintainable by the same team.

### III. No Regressions (NON-NEGOTIABLE)

- Nothing may break an existing flow, route, API contract, form, permission/role check or
  stored data shape.
- Existing public signatures (component selectors, `@Input`/`@Output` names, service method
  names/params/return types, route paths, model fields) MUST NOT be renamed, removed or
  changed in meaning.
- New behaviour MUST be opt-in (new optional input, new route, new method, feature flag)
  so existing callers behave exactly as before.
- The full existing test suite MUST still pass and `ng build` (production config) MUST
  succeed before a change is considered done.

**Rationale**: AMRIT is live in health facilities; a broken screen stops patient care.

### IV. Additive Changes Only

- Existing code MUST NOT be modified, refactored, reformatted or "cleaned up" as a side
  effect of a task.
- An edit to existing code is allowed only when the task explicitly requires it (a bug fix in
  that code, or a hook point needed to plug in new code). Such an edit MUST be the smallest
  possible change and MUST be called out in the PR description with the reason.
- No unrelated file, import order, whitespace or dependency-version changes in the diff.

**Rationale**: Small, focused diffs are reviewable and safe to revert.

### V. Minimal Code

- Write only what the requirement needs: no speculative features, unused inputs, dead
  code, commented-out code, `console.log`, or "might need later" abstractions.
- No new npm dependency unless no existing dependency or Angular built-in can do the job;
  a new dependency MUST be justified in the PR.
- Prefer the simplest readable solution; abstraction is added only when Principle I
  demands reuse.

**Rationale**: Every unnecessary line is maintenance and attack surface.

### VI. Tests for Every Implementation (NON-NEGOTIABLE)

- Every new or modified component, service, pipe, directive, guard, interceptor and util
  MUST ship with a `*.spec.ts` (Jasmine + Karma, the repo's existing runner) in the same
  folder.
- Tests MUST use mock data and test doubles only: mock services via `jasmine.createSpyObj`
  / stub providers, `HttpClientTestingModule` + `HttpTestingController` for HTTP, mocked
  `MatDialog`, `Router`, `ActivatedRoute`, session/local storage. No real backend calls.
- Mock data MUST live in the spec or a co-located `*.mock.ts` fixture and reflect the real
  API response shape.
- Tests MUST cover: happy path, validation/invalid input, API error responses, empty/null
  data, every branch of `if`/`switch`/ternary, and template-bound behaviour (rendering,
  button enable/disable, emitted events).
- Coverage for new/changed code MUST be **≥ 99 %** for statements, branches, functions and
  lines, verified with `ng test --code-coverage` (Karma coverage report). Any line that
  genuinely cannot be covered MUST be justified in the PR.
- Tests MUST be deterministic (`fakeAsync`/`tick`, no real timers, no order dependence).

**Rationale**: High coverage with realistic mocks is the only proof Principle III holds.

### VII. Common-UI Cross-Service Safety (NON-NEGOTIABLE)

`Common-UI` is a git submodule shared by Admin-UI, ECD-UI, HWC-UI, HWC-UI-integration,
HWC-Inventory-UI, Inventory-UI, MMU-UI (and variants), TM-UI and Helpline1097-UI-NEXT. Any
change in it ships to all of them.

- Before changing `Common-UI`, every consuming repo MUST be searched for usages of the
  touched component/service/selector/model/asset (imports, template selectors, injected
  services, CSS classes, i18n keys), and the impact listed in the PR.
- Changes MUST be backward compatible for **every** consumer: additive inputs with safe
  defaults, no renamed/removed exports, selectors, inputs, outputs, methods or model
  fields, no changed default behaviour.
- Code MUST compile and work across the Angular versions of all consumers (currently 16,
  20 and 21); no version-specific API unless all consumers support it.
- Service-line-specific logic MUST NOT be placed in `Common-UI`; keep it in the service
  repo or make it configurable via inputs/injection tokens.
- Before merge, the change MUST be pulled into each consuming repo and verified with
  `ng build` and `ng test` there; any consumer failure blocks the merge.
- `Common-UI` changes MUST carry their own spec files meeting Principle VI.

**Rationale**: One careless shared change can break every AMRIT service line at once.

## Technology & Repository Constraints

- Framework: Angular (per-repo version), TypeScript, Angular Material, RxJS.
- Testing: Jasmine + Karma with `karma-coverage`; no new test framework per repo.
- Linting/format: ESLint (`@angular-eslint`), Prettier, `.editorconfig`, Husky +
  lint-staged; commit messages follow commitlint conventional commits
  (`feat:`, `fix:`, `test:`, `docs:`, `refactor:` …, header ≤ 100 chars).
- Front-end work MAY proceed against an agreed/assumed API contract when the backend is
  not ready; the contract MUST be written down and mocked in tests.
- No secrets, tokens, credentials or real patient data in code, mocks, or fixtures.
  Mock data MUST be synthetic.

## Development Workflow & Quality Gates

A change is done only when all gates pass:

1. **Reuse check** — existing repo + `Common-UI` searched; reuse decision noted.
2. **Placement check** — files sit in the established folder structure and naming.
3. **Diff check** — diff contains only additive changes, plus explicitly justified
   minimal edits; no unrelated changes.
4. **Lint** — `npm run lint` passes with no new warnings.
5. **Tests** — `ng test --code-coverage` passes; new/changed code ≥ 99 % coverage on all
   four metrics; existing tests still green.
6. **Build** — `ng build` (production) succeeds.
7. **Common-UI gate** (when touched) — all consumer repos searched, built and tested;
   impact list in the PR.
8. **Review** — PR description states what was added, any existing code touched and why,
   coverage numbers, and Common-UI impact (or "not touched").

## Governance

- This constitution overrides informal practice for all AMRIT front-end work, including
  work done by AI assistants (Spec Kit plans, tasks and implementations MUST check
  against it).
- Every PR review MUST verify compliance with Principles I–VII; non-compliance blocks merge
  unless an exception is written in the PR and approved by the tech lead.
- Amendments: proposed via PR to this file with rationale, approved by the FE tech lead,
  and recorded in the Sync Impact Report.
- Versioning: MAJOR for removing/redefining a principle, MINOR for adding a principle or
  materially expanding guidance, PATCH for wording/clarifications.
- Compliance is reviewed whenever a new FE repo or a new Angular major version is
  adopted.

**Version**: 1.0.0 | **Ratified**: 2026-10-12 | **Last Amended**: 2026-10-12
