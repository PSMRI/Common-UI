# AMRIT Common-UI — ZardUI Component Kit (`v2/ui`)

A set of standalone, Tailwind-based UI primitives (ZardUI) shared across AMRIT
front-ends. These components were ported from `Helpline104-UI-NEXT` as part of the
Angular ZardUI migration.

> **Note:** Common-UI is consumed as a git submodule. It has no `package.json` of its
> own — the **host application** must provide every peer dependency listed below.
> Imports inside `v2/ui` are all relative, so the kit is self-contained apart from
> these external packages.

## Components

| Component   | Import                          | Notable deps                       |
| ----------- | ------------------------------- | ---------------------------------- |
| Button      | `Common-UI/v2/ui/button`        | `@ng-icons/*`, `cva`               |
| Dialog      | `Common-UI/v2/ui/dialog`        | `@angular/cdk` (overlay/portal), `rxjs`, `@ng-icons/*` |
| Form        | `Common-UI/v2/ui/form`          | `cva`                              |
| Input       | `Common-UI/v2/ui/input`         | `@angular/forms`                   |
| Loader      | `Common-UI/v2/ui/loader`        | `cva`                              |
| Pagination  | `Common-UI/v2/ui/pagination`    | `@ng-icons/*`, Button              |
| Table       | `Common-UI/v2/ui/table`         | `cva`                              |
| Toast       | `Common-UI/v2/ui/toast`         | `ngx-sonner`                       |

All components re-export through `Common-UI/v2/ui` (see `index.ts`) and are surfaced
from the package root via `v2/public-api.ts`.

## Required peer dependencies

Install these in the **host application**. Versions below match the source repo
(`Helpline104-UI-NEXT`) at the time of the port — keep the host within the same
major to avoid API drift.

| Package                     | Version    | Used by                                  |
| --------------------------- | ---------- | ---------------------------------------- |
| `@angular/core`             | `^20.3.0`  | all                                      |
| `@angular/common`           | `^20.3.0`  | dialog, pagination (`NgTemplateOutlet`, `isPlatformBrowser`) |
| `@angular/forms`            | `^20.3.0`  | input (`ControlValueAccessor`)           |
| `@angular/cdk`              | `^20.2.14` | dialog (`overlay`, `portal`)             |
| `@ng-icons/core`            | `^33.2.4`  | button, dialog, pagination               |
| `@ng-icons/lucide`          | `^33.2.4`  | button, dialog, pagination               |
| `class-variance-authority`  | `^0.7.1`   | all variant files (`cva`)                |
| `clsx`                      | `^2.1.1`   | `utils/merge-classes`                    |
| `tailwind-merge`            | `^3.6.0`   | `utils/merge-classes`                    |
| `ngx-sonner`                | `^3.1.0`   | toast                                    |
| `rxjs`                      | `~7.8.0`   | dialog (`dialog-ref`)                    |

### Styling

Components emit Tailwind utility classes (resolved at runtime through
`twMerge` / `clsx`). The host app must have **Tailwind CSS v4** configured:

| Package                  | Version     |
| ------------------------ | ----------- |
| `tailwindcss`            | `^4.3.0`    |
| `@tailwindcss/postcss`   | `^4.3.0`    |
| `tailwindcss-animate`    | `^1.0.7`    |

Without Tailwind in the host build, the components render unstyled.

## License

Part of AMRIT. Licensed under the **GNU General Public License v3.0** — see the
header in each source file and the repository `LICENSE`.
