# Contract: Common-UI consent public API (for consuming services)

Both tracks expose the **same** selectors, inputs, outputs and results:

- `src/consent` (Material, Angular 16+): HWC-UI, TM-UI.
- `v2/consent` (Zard, Angular 20+): MMU-UI.

All components are standalone. All services are `providedIn: 'root'`.

## Barrel exports

- `Common-UI/src/consent/public-api.ts` and `Common-UI/v2/consent/public-api.ts`:

```ts
export { ConsentDialogService } from './consent-dialog.service';
export { ConsentEntryComponent } from './consent-entry/consent-entry.component';
export { consentRefusalInterceptor } from './consent-refusal/consent-refusal.interceptor';
export { isConsentFeatureEnabled } from '../core/consent-feature';   // v2 re-exports from src core
export * from '../core/consent.models';
```

- Neither barrel is added to the existing `src/public-api.ts` or `v2/public-api.ts`; consumers import the
  consent barrel directly (Constitution IV).

## ConsentDialogService

```ts
open(options: {
  context: 'REGISTRATION';
  beneficiaryRegId: number | null;   // null for new registration
  dob?: string | null;               // ISO date; drives the guardian step
  guardianRequired?: boolean;        // registrar flag (disability)
  patientPhone?: string | null;
}): Observable<ConsentDialogResult>;
```

- Emits once, when the dialog closes, then completes.
- The dialog cannot be closed by backdrop or Esc. Its close button returns `NO_DECISION`.
- Used by the registration hook and by `app-consent-entry`.

```ts
openPreferenceCentre(beneficiaryRegId: number): Observable<void>;
openAccessApproval(beneficiaryRegId: number, grantId: string): Observable<AccessGrant | null>;
```

## `<app-consent-entry>`

| Member | Type | Notes |
| --- | --- | --- |
| `@Input() beneficiaryRegID` | `number \| string \| null` | Renders nothing when null or when the feature is off |
| `@Input() dob` | `string \| null` | Passed to the consent dialog |
| `@Output() pendingChange` | `EventEmitter<PendingAction[]>` | Emits after each pending-actions load; the host applies its D-02 rule |
| `@Output() consentUpdated` | `EventEmitter<ConsentDialogResult>` | After a consent, change or withdraw |

**Renders**

- A "Consent" button that opens the preference centre.
- When pending actions exist, a "Consent pending: <reason>" banner whose action opens the consent
  dialog.
- When a pending access request exists, an "Access request" link that opens the access approval.

**Host placement** (one line each, inside the host's own `beneficiary-details.component.html`):

```html
<app-consent-entry [beneficiaryRegID]="beneficiaryRegID" [dob]="dob"></app-consent-entry>
```

## consentRefusalInterceptor (opt-in)

```ts
// host app.config.ts / core.module providers, only when the host wants it
provideHttpClient(withInterceptors([consentRefusalInterceptor]))     // Angular 20 (MMU)
{ provide: HTTP_INTERCEPTORS, useClass: ConsentRefusalInterceptor, multi: true } // Angular 16 class form
```

- Acts only on a 403 whose body has a known `RefusalReason`. It shows the reason's message through the host `ConfirmationService` (`confirm` when the action is `OPEN_CONSENT`, otherwise `alert`) and re-throws
  the error unchanged, so existing error handling still runs.
- The `src` track exports both the functional and the class form, because HWC-UI and TM-UI use class
  interceptors.

## Registration hook (existing Common-UI code, minimal edit)

In `registration.component.ts` (`src` and `v2` copies):

- `openConsent()`:
  - When `isConsentFeatureEnabled()`, call `ConsentDialogService.open({ context: 'REGISTRATION',
    beneficiaryRegId: null })` instead of the old `ConsentFormComponent`.
  - Store `consentId` and `outcome`.
  - On `BLOCKED` or `NO_DECISION`, run the existing `redirectToSearch` path.
- Final payload, only when the feature is on: `beneficiaryConsent` = outcome granted or partial, and
  `consentId`.
- When the feature is off, the existing lines run unchanged.
