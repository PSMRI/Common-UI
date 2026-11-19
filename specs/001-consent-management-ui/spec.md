# Feature Specification: Consent Management UI (Common-UI)

**Feature Branch**: `001-consent-management-ui`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "Common-UI consent management front end (from 'AMRIT Consent Management –
Solution Overview' doc, only the parts that belong in the shared Common-UI Angular submodule): reusable
consent screen (language choice, notice text/audio, per-purpose switches all off, Accept locked until
scroll/audio end, Decline equal, capture modes with proof, guardian step with OTP, mandatory-decline
stop), consent-pending banner driven by pending-actions API, preference centre (view current consents,
change purpose, withdraw, revoke doctor access, history), Consent-API client service, 403 consent-reason
handling. Embedded in HWC, MMU, TM registration/revisit. Exclude Admin-UI screens, back end, DB, helpline
panel for legacy 104/1097."

**Source document**: [AMRIT Consent Management – Solution Overview](https://claude.ai/artifact/Ba4bVJNTzUMC6fvur8i7D8)
(§2 Solution, §3 Front End, §6 Common Scenarios, §7 HWC, §8 MMU, §9 TM, §13 Decisions).

## Clarifications

### Session 2026-10-12

- Q: Should Common-UI also provide the helpline consent panel for ECD-UI and Helpline1097-UI-NEXT?
  → A: No. ECD, 104 and 1097 are not covered by this Common-UI spec at all.
- Q: Should the consent screen be a step inside the registration page, or a pop-up dialog over it?
  → A: A pop-up dialog over the registration / revisit page.
- Q: Should the consent dialog switch to right-to-left layout for right-to-left languages?
  → A: No RTL in this release; RTL languages (Urdu, Kashmiri, Sindhi) are not offered yet.
- Q: Where should staff open the preference centre from?
  → A: A "Consent" button in the shared beneficiary-details header opens it as a dialog.
- Q: How should the "Signature / thumb + photo" proof be captured in the consent dialog?
  → A: Camera photo of the patient and of the signed / thumb-printed paper form; image upload as
  fallback. No on-screen signature pad.
- Planning note (2026-10-13): the patient header shown in HWC, MMU and TM workareas is each service's
  own beneficiary-details component, not Common-UI's (which only family tagging uses). The "Consent"
  button is therefore a Common-UI component that each service places once in its own header; intent of
  the answer above is unchanged.

## Scope

**In scope (Common-UI only)** — the shared pieces every consuming service UI embeds:

1. Consent screen (replaces today's registration consent pop-up when enabled).
2. Guardian consent step (inside the consent screen).
3. Proof (evidence) capture for each consent mode (inside the consent screen).
4. "Consent pending" banner for revisit / existing patients.
5. Preference centre (view, change, withdraw, cancel doctor access, history).
6. Patient approval of a doctor's time-limited access request by OTP.
7. Consistent display of "consent not allowed" reasons returned by any service.
8. One shared client for all consent calls used by the pieces above.

**Out of scope**: Admin-UI screens (purposes, notice versions, translations, approvals, review queues),
Consent-API back end, database, consent-check enforcement on the server, van sync engine, SMS sending,
rights requests / grievances, doctor break-glass request screen, and all consent work for ECD, 104
and 1097 (ECD-UI, Helpline104-UI, Helpline1097-UI, Helpline1097-UI-NEXT), including the helpline consent
panel and source §10–§12 scenarios.

**Consumers affected** (Constitution Principle VII): Admin-UI, ECD-UI, HWC-UI, HWC-UI-integration,
HWC-Inventory-UI, Inventory-UI, MMU-UI (+ variants), TM-UI, Helpline1097-UI-NEXT. Only HWC, MMU and TM
turn the feature on in this release; all others MUST behave exactly as today.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New patient gives informed, per-purpose consent at registration (Priority: P1)

A registrar at an HWC, MMU van or TM spoke starts registering a new patient. Before any personal
details can be entered, the consent screen opens as a pop-up dialog over the registration page. The patient picks a language, reads (or hears) the
notice, turns on the purposes they agree to, the registrar records how consent was taken and its proof,
and the patient presses Accept or Decline. Registration unlocks only when every mandatory purpose is
granted.

**Why this priority**: This is the legal core (DPDP Act §5, §6). Without it every patient is still saved
as "Yes". It alone replaces the non-compliant pop-up and is a usable MVP.

**Independent Test**: Open new-patient registration in a consuming service with the feature on, complete
the consent screen with mock notice data, and verify the saved decision per purpose and that the
registration form unlocks / stays locked as expected.

**Acceptance Scenarios**:

1. **Given** a new registration, **When** the registrar opens it, **Then** the consent dialog opens over
   the page before any personal-details field is editable and asks for a language first.
2. **Given** a language is chosen, **When** the notice loads, **Then** it shows each data item, why it is
   used, how long it is kept, who it is shared with, how to withdraw and how to complain, in that language.
3. **Given** the notice is shown, **When** the patient has not scrolled to its end and has not played the
   audio to its end, **Then** Accept is disabled.
4. **Given** the notice is shown, **Then** mandatory purposes are listed first, optional purposes are
   listed as separate switches, and every switch starts off.
5. **Given** all mandatory purposes are on and optional ones mixed, **When** Accept is pressed with valid
   proof, **Then** each purpose is saved as granted or denied as switched, and registration unlocks (C1, C2).
6. **Given** a mandatory purpose is off or Decline is pressed, **When** the patient confirms, **Then** the
   screen explains the service cannot continue, saves the decision as denied, and data entry stays
   blocked (C3).
7. **Given** the consent screen is open, **When** it is closed without a decision, **Then** nothing is
   saved as consent and data entry stays blocked (C4).
8. **Given** the patient changes language after the notice loads, **When** they continue, **Then** the
   notice reloads and the consent is recorded in the language actually shown (C17).
9. **Given** Accept is pressed twice or the save is retried, **Then** only one consent is recorded (C18).

---

### User Story 2 - Registrar captures proof matching the consent mode (Priority: P1)

The registrar picks how consent was taken (self-read, read aloud, voice clip, witnessed,
signature/thumb + photo, OTP) and the screen asks for exactly the proof that mode needs.

**Why this priority**: Consent without proof does not meet Act §6(10). Ships together with Story 1.

**Independent Test**: For each mode, complete the screen with mock inputs and verify the required proof
fields, the block on Accept until proof is complete, and the proof sent with the consent.

**Acceptance Scenarios**:

1. **Given** mode Self-read, **When** Accept is pressed, **Then** notice version, language, notice text
   fingerprint, time and device are recorded with no extra input.
2. **Given** mode Read aloud, **Then** the worker's confirmation tick is required, the audio must have
   played to the end, and the worker ID is recorded.
3. **Given** mode Voice clip, **Then** a 30–60 second recording is required; shorter or longer clips are
   rejected with a message.
4. **Given** mode Witnessed, **Then** witness name and relationship are required.
5. **Given** mode Signature/thumb + photo, **Then** a camera photo of the patient and a camera photo of
   the signed or thumb-printed paper form are both required before Accept is enabled; if no camera is
   available, both images can be uploaded instead.
6. **Given** mode OTP, **Then** an OTP is sent to the patient's phone, shown masked, and Accept is enabled
   only after it is verified.

---

### User Story 3 - Guardian gives consent for a child or a person with disability (Priority: P1)

When the patient is under 18 (from date of birth) or the registrar marks that a guardian is needed, the
screen switches to the guardian step: guardian name, relationship, phone, OTP to the guardian's phone,
then the guardian gives consent.

**Why this priority**: Verifiable parental consent is mandatory (Rule 10); without it no child can be
registered lawfully.

**Independent Test**: Register a mock patient aged 10 and a mock adult flagged as needing a guardian;
verify the guardian step, OTP flow, fallback flow, and that consent is recorded as given by a guardian.

**Acceptance Scenarios**:

1. **Given** a patient under 18, **When** the consent screen opens, **Then** the guardian step is shown
   and the patient cannot consent for themselves (C6, H9).
2. **Given** the guardian step, **When** the guardian's OTP is verified, **Then** consent is saved as
   given by a guardian with the guardian's name, relationship and phone.
3. **Given** a person with disability flagged by the registrar, **Then** the same step runs with guardian
   type "disability guardian" (C8).
4. **Given** the guardian has no phone or OTP fails, **When** the registrar picks the fallback, **Then**
   the screen accepts "ID seen by staff" or "witness + signature", and the guardian is saved as
   "ID sighted" / "Unverified" and flagged for follow-up (C7, M13).
5. **Given** a new registration where "under 18" was not ticked, **When** the registrar enters a DOB
   under 18 and submits, **Then** submission stops and the consent dialog reopens at the guardian step.

---

### User Story 4 - Existing patient with missing or outdated consent is prompted on revisit (Priority: P2)

On revisit, the service asks for the patient's pending consent actions. If consent is missing, legacy
(taken before DPDP), due for re-consent after a notice change, or the child has turned 18, a "Consent
pending" banner appears and opens the consent screen.

**Why this priority**: Covers every existing patient (C5, C9, C14, H3, H4); needed before optional uses
can resume, but new registrations (P1) come first.

**Independent Test**: Load a mock revisit with no pending actions, then with each pending reason, and
verify the banner's presence, text and that it opens the consent screen.

**Acceptance Scenarios**:

1. **Given** a revisit with valid consent, **Then** no banner and no consent screen appear (H3).
2. **Given** a revisit with consent missing, legacy, re-consent required or guardian-to-self switch due,
   **Then** a "Consent pending" banner shows the reason and opens the consent screen (H4, C5, C9, C14).
3. **Given** the banner is ignored, **Then** the consuming service is told consent is pending so it can
   apply its own rule for whether treatment may continue (D-02).

---

### User Story 5 - Patient views and changes consent in the preference centre (Priority: P2)

From the patient header, staff press "Consent" with the patient present and the
preference centre opens as a dialog. It shows each
purpose's current status and validity, lets the patient change one purpose, withdraw one or all
purposes, cancel a doctor's access, and view the history of every decision.

**Why this priority**: Withdrawal must be as easy as giving consent (§6(4)); needed for C10–C12, H10, M5,
T5.

**Independent Test**: Open the preference centre with mock consent data and verify list, change,
withdraw (one/all), the legal-requirement block, access cancel and history views.

**Acceptance Scenarios**:

1. **Given** a patient with consents, **When** the preference centre opens, **Then** each purpose shows
   its status (granted, denied, withdrawn, expired, re-consent required), valid-until date and
   mandatory/optional flag.
2. **Given** an optional purpose, **When** it is switched and confirmed, **Then** only that purpose gets a
   new decision; others are unchanged (C10).
3. **Given** a withdrawal of one or all purposes, **When** the implications are shown and confirmed,
   **Then** the purposes show as withdrawn at once (C11, H10).
4. **Given** a purpose the law requires, **When** withdrawal is attempted, **Then** the screen explains
   why it cannot be withdrawn and does not withdraw it (C12).
5. **Given** an active doctor access, **When** staff cancel it with the patient's agreement, **Then** it
   shows as revoked.
6. **Given** history is opened, **Then** every past decision is listed newest first with date, purpose,
   decision, mode, who captured it and language.

---

### User Story 6 - Patient approves a doctor's time-limited access by OTP (Priority: P3)

A doctor at another facility or a TM hub requests access to the patient's record. The patient (or
guardian) receives an OTP and, with staff, approves access for a set number of days.

**Why this priority**: Needed for referrals and TM follow-ups (H5, H6, T3, T9) but those flows can fall
back to in-person referral until it ships.

**Independent Test**: Load a mock pending access request, enter a mock OTP, and verify the approved
grant with its end date; verify a wrong OTP is rejected.

**Acceptance Scenarios**:

1. **Given** a pending access request, **When** the correct OTP is entered and approved, **Then** the
   access shows as active with its end date.
2. **Given** a child patient, **Then** the OTP goes to the guardian and the guardian approves (T9).
3. **Given** a wrong or expired OTP, **Then** approval is refused with a clear message.

---

### User Story 7 - Staff see a clear reason when an action is blocked for consent (Priority: P3)

When any service action is refused for consent reasons, staff see one plain message for that reason
and, where possible, a way to fix it (open the consent screen or request access).

**Why this priority**: Makes server enforcement usable; enforcement itself is outside Common-UI.

**Independent Test**: Feed each mock refusal reason to the shared handler and verify the message and the
offered next step.

**Acceptance Scenarios**:

1. **Given** a refusal with reason consent not found, denied, withdrawn, expired, re-consent required or
   guardian required, **Then** a message specific to that reason is shown in the user's language.
2. **Given** reason re-consent required, consent not found or guardian required, **Then** the message
   offers to open the consent screen.
3. **Given** a refusal for another facility's record, **Then** the message tells staff to request
   time-limited access through the referral process (the request screen is outside this spec) (H5).

---

### Edge Cases

- Consent service unreachable when the screen opens: the screen does not let anything be saved as
  consent and tells the registrar; the consuming service applies rule D-04 (C19).
- Same patient changed from two places: the second save is refused as stale; the screen asks the user to
  reload and confirm (C20).
- MMU van offline: notices, purposes and consent status come from the van's local server; the screen works
  the same and shows the consent as "Not synced" (M1–M5).
- Notice retired while the van is offline: the older version is accepted and shown; re-consent is handled
  by Story 4 after sync (M10).
- Guardian OTP with no network: only the fallback options are offered (M13).
- Audio fails to load: Accept stays locked until the notice is scrolled to the end instead.
- Language has no translation for the notice: the language is not offered in the picker.
- Patient needs a right-to-left language: it is not offered in this release; the registrar uses another
  language the patient understands or Read aloud mode.
- Patient turns 18 between visits: handled as a pending action (Story 4).
- DOB entered after consent contradicts the "under 18" answer: handled by FR-017a.
- Feature off for a service: the existing consent pop-up and registration flow run unchanged.

## Requirements *(mandatory)*

### Functional Requirements

**Consent screen**

- **FR-001**: The consent screen MUST open as a pop-up dialog over the registration / revisit page,
  before any personal-details input is editable in new registration, and from the "Consent pending"
  banner on revisit. The page behind MUST stay locked while the dialog is open.
- **FR-001a**: Clicking outside the dialog or pressing Esc MUST NOT close it; only its close button,
  Accept or Decline close it. The close button counts as "no decision" (FR-008).
- **FR-001b**: The dialog MUST fit the long notice, audio player, purpose switches, proof capture and
  guardian step by scrolling inside the dialog, at registration-device screen sizes down to 1024 px wide.
- **FR-002**: The screen MUST ask for the language first and offer only languages with a published
  notice translation. Right-to-left languages (Urdu, Kashmiri, Sindhi) MUST NOT be offered in this
  release, even if a translation is published.
- **FR-003**: The screen MUST show the active notice for the chosen language and context, listing each
  data item, purpose, retention period, recipients, how to withdraw, and how to complain (DPO / Data
  Protection Board).
- **FR-004**: The screen MUST offer the notice as text and, when available, as audio.
- **FR-005**: Accept MUST stay disabled until the notice is scrolled to the end or the audio has played
  to the end.
- **FR-006**: The screen MUST list mandatory purposes first and optional purposes as separate switches;
  every switch MUST start off.
- **FR-007**: Decline MUST be shown with the same size and prominence as Accept.
- **FR-008**: Closing the screen without Accept or Decline MUST NOT record any consent and MUST report
  "no decision" to the consuming service.
- **FR-009**: If a mandatory purpose is declined, the screen MUST explain that the service cannot
  continue, record the decision as denied, and report "blocked" to the consuming service.
- **FR-010**: On language change, the screen MUST reload the notice and record the language actually
  shown.
- **FR-011**: Each consent save MUST carry a unique request key so a double tap or retry never records two
  consents.
- **FR-012**: The screen MUST report the final outcome (granted / partially granted / blocked / no
  decision) and per-purpose decisions to the consuming service.

**Proof capture**

- **FR-013**: The registrar MUST pick a consent mode: Self-read, Read aloud, Voice clip, Witnessed,
  Signature/thumb + photo, or OTP.
- **FR-014**: The screen MUST require the proof listed for the chosen mode (source §3 table) before
  Accept is enabled, and MUST attach notice version, language, notice text fingerprint, time, device and
  worker ID to every consent.
- **FR-014a**: For Signature/thumb + photo, the dialog MUST capture two camera photos (the patient, and
  the signed / thumb-printed paper form), allow retake before Accept, and fall back to image upload when
  no camera is available. No on-screen signature pad is provided.
- **FR-015**: A voice clip MUST be 30–60 seconds; captured files MUST be sent with a fingerprint and
  never kept in browser storage after upload.
- **FR-016**: Phone numbers MUST be shown masked.

**Guardian step**

- **FR-017**: The screen MUST switch to the guardian step when the patient's age from date of birth is
  under 18; or, when no date of birth is known yet (new registration), the registrar ticks "Patient is
  under 18"; or the registrar ticks "Needs a guardian (disability)".
- **FR-017a**: On registration submit, if the entered date of birth makes the patient under 18 and the
  consent was not given by a guardian, registration MUST stop and reopen the consent dialog at the
  guardian step.
- **FR-018**: The guardian step MUST capture guardian name, relationship and phone, send an OTP to the
  guardian's phone and require it to be verified before consent.
- **FR-019**: When the guardian has no phone or OTP fails, the step MUST offer the fallback options
  "ID seen by staff" and "witness + signature" and record the guardian as "ID sighted" or "Unverified".

**Consent pending banner**

- **FR-020**: On revisit, the banner MUST show when the patient's pending actions include missing,
  legacy, re-consent-required or guardian-to-self consent, and MUST state the reason.
- **FR-021**: The banner MUST open the consent screen and MUST expose the pending state to the
  consuming service; it MUST NOT itself block treatment.

**Preference centre**

- **FR-021a**: The preference centre MUST open as a dialog from a "Consent" button supplied by
  Common-UI and placed in the patient header (beneficiary details) shown on every patient screen of
  HWC, MMU and TM; the button MUST appear only when the feature is on for that service. The same
  component shows the "Consent pending" banner (FR-020).
- **FR-022**: The preference centre MUST list each purpose with status, valid-until date and
  mandatory/optional flag.
- **FR-023**: Users MUST be able to change a single optional purpose with a confirmation step.
- **FR-024**: Users MUST be able to withdraw one purpose or all purposes; the screen MUST show the
  implications before confirming.
- **FR-025**: The preference centre MUST block withdrawal of purposes marked non-withdrawable and explain
  why.
- **FR-026**: The preference centre MUST list active doctor accesses and allow cancelling them.
- **FR-027**: The preference centre MUST show the consent history newest first.

**Doctor access approval**

- **FR-028**: Users MUST be able to approve a pending doctor access request by entering an OTP sent to
  the patient (or guardian for a child); approval MUST show the access end date.

**Blocked-action messages**

- **FR-029**: A shared handler MUST map each consent refusal reason (not found, denied, withdrawn,
  expired, re-consent required, guardian required) to a message in the user's language and, where
  applicable, offer "open consent screen"; otherwise say how to get access.

**Shared behaviour**

- **FR-030**: All consent calls MUST go through one shared Common-UI client; consuming services MUST NOT
  call the consent service directly for these screens.
- **FR-031**: Every piece MUST be switchable on per consuming service; when off, the existing consent
  pop-up and registration flow MUST run unchanged (Constitution III, IV, VII).
- **FR-032**: All user-facing text MUST come from the existing language files; no text is hard-coded.
- **FR-033**: When the consent service reports a stale update, the screen MUST ask the user to reload
  and confirm.
- **FR-034**: When working against an MMU van's local server, the screens MUST behave the same and show
  the sync status of each consent.
- **FR-035**: The registration hand-off MUST send the real consent outcome instead of the fixed "consent
  given" value, when the feature is on.
- **FR-036**: The pieces MUST NOT be switched on, or change behaviour, in ECD-UI or
  Helpline1097-UI-NEXT; those consumers only need to keep building and passing their tests.

### Key Entities

- **Purpose**: A use of patient data. Code, name, mandatory or optional, withdrawable or not, validity
  period.
- **Notice**: Versioned text (and optional audio) per language and context; includes data items,
  purposes, retention, recipients, withdrawal and complaint details.
- **Consent decision**: One save event. Patient, consenting party (self / guardian), notice version,
  language, mode, captured by, facility, service line, device, time, sync status, and per-purpose
  decision.
- **Purpose status**: Current status of one purpose for one patient: granted, denied, withdrawn,
  expired, re-consent required, superseded; valid-until date.
- **Proof**: Evidence for a consent: type, file link, fingerprint, witness details, OTP status.
- **Guardian link**: Guardian name, relationship, phone, guardian type, verification method, valid
  until (18th birthday).
- **Access grant**: Doctor, purposes, status, end date, type (consented / emergency).
- **Pending action**: Reason consent is needed for a patient (missing, legacy, re-consent, guardian-to-self).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 % of patients registered with the feature on are saved as "consented" without a
  recorded Accept and proof.
- **SC-002**: 100 % of consent screens open with every purpose switch off, and closing the screen
  records no consent.
- **SC-003**: A registrar completes consent for a self-reading adult in under 3 minutes, excluding
  reading time.
- **SC-004**: Withdrawing a purpose takes no more steps than granting it (target ≤ 3 actions after the
  preference centre opens).
- **SC-005**: 100 % of patients under 18 registered with the feature on have consent recorded as given
  by a guardian.
- **SC-006**: Every consuming service that has the feature off shows identical behaviour to today:
  its existing tests pass and it builds without change.
- **SC-007**: New and changed Common-UI code reaches ≥ 99 % test coverage with mock data
  (Constitution VI).
- **SC-008**: The consent screen and preference centre work in every left-to-right language that has a
  published notice, with no missing text.

## Assumptions

- The consent service and its endpoints (source §4.2: notices, consents, pending actions, preferences,
  withdrawals, OTP, access grants, evidence) are available or mocked; front-end work proceeds against
  that contract (user preference: build FE against an assumed API contract).
- Purposes, their mandatory/optional and withdrawable flags, and notice content are configured by admins
  (Admin-UI, out of scope); the screens only display what the service returns. Open decisions D-01,
  D-02, D-03, D-04, D-05 change data, not the screens.
- The new consent screen is a new Common-UI piece; the existing consent pop-up in
  `registrar/registration/consent-form` stays untouched. The only edits to existing code are two
  minimal hooks: registration (open the new dialog and send the real outcome) in Common-UI, and one line in
  each service's own beneficiary-details header to place the "Consent" component, both only when the
  feature is on (Constitution IV —
  to be justified in the PR).
- Known gap: not offering RTL languages leaves 3 of the 22 Eighth Schedule languages uncovered (source
  §1, Rule 3); RTL support is a follow-up release.
- Feature switch is per consuming service via its existing environment configuration; default off.
- The MMU van's local server exposes the same consent endpoints, so the UI needs no separate offline
  logic beyond showing sync status.
- Camera, microphone and signature capture use the browser on the registration device; where a device
  lacks them, image upload is accepted. Existing dependencies already in consumers (webcam and audio
  recording libraries) are reused rather than adding new ones (Constitution I, V).
- UI standard follows the consumer's current direction: MMU-UI is migrating to the shared Zard UI +
  Tailwind components (`Common-UI/v2`, branch `angular-zard-migration`, not yet on `main`). Which UI
  kit the new screens use is decided at `/speckit-plan` against the Common-UI branch in use.
- Rights requests, grievances and the break-glass request are out of scope; ECD, 104 and 1097 consent
  (helpline panel, verbal consent on call) is out of scope for this Common-UI spec.
- Consumers on different Angular versions (16, 20, 21) must all build; the spec does not require
  version-specific features.
