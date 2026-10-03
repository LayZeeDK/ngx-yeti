# Yeti's `validate.js`, and Angular Signal Forms

Ticket: [Research: what `validate.js` does, and replacing it with Angular Signal Forms](../issues/19-research-yeti-validate-and-signal-forms.md). Researched 2026-10-01. Decides nothing.

## Sources and revisions

| Short name | Path | Revision (checked) |
| --- | --- | --- |
| `YETI` | `github.com/foundation/yeti` | `f52d1e8b9`, clean tree |
| `NG` | `github.com/angular/angular` | branch `22.2.x`, `package.json` `"version": "22.2.0"`, HEAD `5db6fc4453` (2026-09-25) |
| `OLD` | `.scratch/next-foundation-specs/` in this repo | working tree on `wayfinder` |
| Probe | `D:/tmp/ngx-yeti-19/` | `ng new` with `@angular/cli@22.2`; installed `@angular/core` and `@angular/forms` 22.2.1; Playwright 1.63.0 in Chromium, Firefox, WebKit |

Labels: **measured** = observed in the probe in all three engines unless an engine is named; **read** = read in the file cited; **inferred** = reasoned from cited sources without running it. `YETI/src/components/field/` is shortened to `field/`; `NG/packages/forms/signals/src/` to `sf/`; `NG/packages/forms/src/` to `rf/`; `NG/adev/src/content/guide/forms/` to `adev/`.

The `angular-cli` MCP `search_documentation` tool was not used; the local `adev/` sources at the same revision were read instead.

## 1. What `validate.js` is for (read)

`field/validate.js` is 84 lines, the field component's second optional module (`field/manifest.json:297-305`). Its own header states the purpose: the browser already knows what is wrong with a control and has a localised sentence for it; the module puts that sentence where the field shows an error, marks the control the way the field CSS reads it, and stops the submit (`validate.js:1-4`). It has "no rules of its own, no async checks, and no message catalogue: everything it says comes from the platform" (`validate.js:20-21`).

### 1.1 What it validates, and when

- **Rules:** none of its own. A control is invalid when `el.willValidate && !el.validity.valid` (`validate.js:55`), that is, native constraint validation: `required`, `type` (email, url), `pattern`, `min`/`max`/`step`, `minlength`/`maxlength`, and any `setCustomValidity()` the page applied.
- **Scope:** every control in `form.elements`, inside a `.field` or not; a control outside any field still stops the submit, it just has nowhere for a message (`validate.js:6-9`, `docs.md:37`; Yeti's own test `test/browser/components/validate.spec.js:122`).
- **When:** on `submit` only, "never before, so nothing is red while a person is still typing" (`validate.js:11-13`). Before a submit, the field's CSS shows errors through `:user-invalid` alone (`field/field.css:188-190`).
- **Clearing:** on `input` and `change`, `aria-invalid` is removed from a control that has become valid; radios of one `name` are cleared together (`validate.js:65-84`).
- **Precondition:** the form must carry `novalidate`; without it the browser shows its own bubble and no `submit` event fires, so the module never runs (`validate.js:15-17`, `docs.md:39`).
- **Delegation:** listeners on `document`, so forms added after load are covered (`validate.js:19-20`, `46`, `83-84`).
- **Defers to the page:** it returns at once when `event.defaultPrevented` is already true, "the page's own listener ran first and asked for nothing to happen" (`validate.js:49-50`).
- It reads `validity` rather than calling `checkValidity()`, so it fires no native `invalid` events (`validate.js:51-54`).

### 1.2 How it marks fields and shows errors

- Sets `aria-invalid="true"` on every invalid control, radios included (`validate.js:31-32`, `58`).
- Writes `control.validationMessage` into the `[data-error]` child of the nearest `.field` that has one, so a radio group's message goes on the `fieldset.field` (`validate.js:33-38`). It writes only into an empty slot, or one it wrote before (a `WeakSet`), so author text is never replaced and its own wording follows the current reason (`validate.js:23-29`, `39-43`).
- The CSS does the showing: `[data-error]` is `display: none` until the field `:has(:user-invalid, [aria-invalid="true"])`, and the control border turns to `--yeti-color-alert` under the same condition (`field.css:183-190`). `aria-invalid="true"` is also the documented server-round-trip signal (`docs.md:7`, `54`).
- Focuses the first invalid control, which also scrolls it into view (`validate.js:59-61`).
- Prevents the submit (`validate.js:57`).

### 1.3 How errors are announced (read, then inferred)

There is no live region and no `role="alert"` anywhere in `field/` (an `rg` for `aria-live|role="alert"` over `field/` and `docs/field.md` returned nothing; a positive control for `aria-hidden` in the same folder matched). The announcement is by focus: the message is written before focus moves (`validate.js:58` before `61`), and the docs require the author to list the error's id in the control's `aria-describedby` (`docs.md:45`, `54`; `manifest.json:295`). So a screen reader hears the first control's name, invalid state, and the new message as its description when focus lands (inferred). Other invalid controls are announced only when the user reaches them. The module adds no `aria-describedby` itself.

### 1.4 The event

`yeti:invalid` is dispatched on the form with `{ bubbles: true, composed: true, detail: { controls } }`, the invalid controls in document order, after marking and focusing (`validate.js:62`; `manifest.json:302-304`). The docs suggest counting them, scrolling a summary into view, or sending them somewhere (`docs.md:37`).

### 1.5 Interplay with native constraint validation

`validate.js` is a presentation layer over native constraint validation with `novalidate`: the browser decides validity and wording; the module replaces the bubble with in-field text, ARIA, focus, and an event. `range.js`, the field's other module, does no validation (it mirrors a range's value into `--yeti-range-value` and an `output`, `docs.md:20`).

## 2. Signal Forms' model, set against it (read)

- **Validity lives in Angular, not the DOM.** "Signal Forms **does not** use the browser's built-in constraint validation to run validation rules" (`adev/signals/validation.md:57`); state is `valid()`, `invalid()`, `errors()` (`validation.md:59`). The docs say not to rely on `:valid`/`:invalid`, `validity`, or `validationMessage` (`validation.md:65`).
- **Some rules mirror to native attributes.** `required()`, `min()`, `max()`, `minLength()`, `maxLength()` set the native attributes when the element accepts them; `pattern()` does not (`validation.md:61`; `adev/signals/form-logic.md:511`; code: `sf/directive/form_field.ts:416-438`, `pattern` only a binding key at `sf/directive/bindings.ts:37`). `email()` and custom `validate()` rules have no native counterpart.
- **One native read:** `validity.badInput` becomes a `parse` error (`sf/directive/native.ts:45-49`, `sf/directive/input_validity_monitor.ts:72-74`; `validation.md:63`).
- **Submission:** `form[formRoot]` sets `novalidate` and calls `preventDefault()` first in its `submit` handler, then `submit()` when the form has submission options (`sf/directive/form_root.ts:36-56`). `submit()` marks the tree touched, then runs `action` when not invalid, else `onInvalid` (`sf/api/structure.ts:463-511`, `528-540`; options at `sf/api/types.ts:22-56`). Nothing in `submit()` or `FormRoot` moves focus (read).
- **Focus:** `FieldState.focusBoundControl()` focuses the first bound control in DOM order (`sf/field/node.ts:107-125`, `sf/api/types.ts:497-502`); `errorSummary()` lists the tree's errors sorted by DOM position on the client (`sf/field/validation.ts:275-288`). The guide's recipe is `errorSummary()[0].fieldTree().focusBoundControl()` (`adev/signals/field-state-management.md:834-841`).
- **Messages:** each built-in rule takes an optional `message` (`sf/api/rules/validation/util.ts:18-19`, `required.ts:30`, `56`); errors are `{kind, message?}` (`validation_errors.ts:17-18`). There is no browser-localised sentence.
- **Display timing:** the guides recommend `touched() && invalid()` (`validation.md:440`; `field-state-management.md:187-195`).
- **ARIA:** nothing in `@angular/forms` or `@angular/forms/signals` sets `aria-invalid` or `aria-describedby` (`rg` over `NG/packages/forms/signals/src` and `NG/packages/forms/src`, specs excluded, returned nothing; the docs' custom-control example binds `[attr.aria-invalid]` by hand, `adev/signals/custom-controls.md:269`, which is the positive control). `provideSignalFormsConfig({classes})` can add CSS classes to `[formField]` hosts from field state (`sf/api/di.ts:20-36`, `form_field.ts:254-270`), but not attributes, so it cannot produce Yeti's `aria-invalid` trigger.
- **Reactive forms:** importing `FormsModule` or `ReactiveFormsModule` adds `novalidate` to every `form` in that template unless it carries `ngNativeValidate` (`rf/directives/ng_no_validate_directive.ts:28-33`). `NgForm` and `FormGroupDirective` return `false` from `onSubmit` for non-dialog forms (`rf/directives/ng_form.ts:341`; `rf/directives/reactive_directives/abstract_form.directive.ts:321`), and `ngSubmit` emits whether or not the form is valid (same lines). There is no `onInvalid` and no focus helper.

## 3. Runtime order, measured

Probe: `D:/tmp/ngx-yeti-19/src/app/app.ts` (five forms), `src/index.html` (loads Yeti's `validate.js`, copied unchanged from `YETI` into `public/yeti/`, plus logging listeners on `window` capture, `document` registered before Yeti's, and `window` bubble, the last one calling `preventDefault()` so nothing navigates), `probe.mjs` and `summarize.mjs`; raw output in `probe-out.txt`. Same results in Chromium, Firefox, and WebKit except where noted.

| Form | Setup | What happened |
| --- | --- | --- |
| A | Signal Forms, `[formRoot]`, `required` + `email()` on an email field, a custom `validate()` field | One `submit` event. Order: `FormRoot`'s listener runs `onInvalid` (kinds `required,notX`) synchronously, then the `document` listeners see `defaultPrevented=true`, so `validate.js` returns: no `yeti:invalid`, no `aria-invalid`, no message written. `focusBoundControl()` from `onInvalid` moved focus to the email field. |
| B | Signal Forms with `[formField]`, no `FormRoot`, static `novalidate`, an Angular `(submit)` listener that does not prevent | Angular's listener runs first (`defaultPrevented=false`), then `validate.js`, which marks only the email field (native `valueMissing`, from the mirrored `required`), writes the browser's message, focuses it, prevents, and dispatches `yeti:invalid`, all before the `window` bubble listener. |
| B, 2nd submit | email valid; `pattern()` field `abc`; custom field `Y` | Signal Forms invalid (`pattern,notX`), native valid: `validate.js` let the submit through (`defaultPrevented=false` at `window`). |
| B, 3rd submit | email `abc` (static `type="email"`) | Native `typeMismatch`: marked, message written. The wording differs by engine: Chromium "Please include an '@' in the email address. 'abc' is missing an '@'.", Firefox "Please enter an email address.", WebKit "Enter an email address". Empty field: "Please fill out this field." / "Please fill out this field." / "Fill out this field". |
| B, fixed | typed a valid email | `aria-invalid` removed on `input`; the written message text stays in the slot (hidden again by Yeti's CSS once the field no longer matches). |
| C | Reactive forms, `[formGroup]`, `(ngSubmit)` | `ngSubmit` fired with `invalid=true`; `FormGroupDirective` had already prevented, so `validate.js` returned. No `aria-invalid`. |
| D | Signal Forms in a template that imports `ReactiveFormsModule`, `ngNativeValidate` on the form | The browser's own validation blocked the submit: zero `submit` events, focus on the invalid field. |
| E | A component importing only `FormField` (no `FormRoot`, no classic forms module), form without `novalidate` | The form has no `novalidate` (`noValidate=false`); same as D: zero `submit` events, native bubble path. |
| All | `:user-invalid` | False on every field before any interaction. After a refused submit, a natively invalid field matched `:user-invalid` without having been touched, in A and C (`novalidate` forms, where the page or Angular prevented), D, and E, in all three engines. A field invalid only in Signal Forms (custom rule, `pattern()`) never matched. |

Consequences (inferred from the table):

- Ticket 03's two findings hold at run time: Angular's form directives prevent the submit before `validate.js` sees it, and nothing in Angular sets `aria-invalid`.
- `yeti:invalid` fires only when the form-level Angular listener does not prevent, and only for constraints the DOM knows. Under `FormRoot` or classic forms it never fires.
- Under `FormRoot`, Yeti's CSS still reacts to `:user-invalid` for the mirrored constraints after a submit, so the field turns red and its `[data-error]` becomes `display: block` with no text unless the page wrote some; for `email()`, `pattern()`, and custom rules it shows nothing. The two validity sources disagree, field by field.
- A Signal-Forms-only template that skips `FormRoot` and writes no `novalidate` gets the browser bubble, not Yeti's slot.

## 4. Behaviour mapping

| `validate.js` behaviour (source) | Signal Forms counterpart | Reactive forms counterpart | Gap |
| --- | --- | --- | --- |
| Rules from native constraints only (`validate.js:20-21`, `55`) | Schema rules: `required`, `email`, `min`, `max`, `minLength`, `maxLength`, `pattern`, `validate`, async and HTTP validators (`sf/api/rules/validation/`) | `Validators.*` and directives such as `RequiredValidator` | Different source of truth; native validity is not consulted except `badInput` (`native.ts:45`). Mirrored attributes only for five rules. |
| Requires `novalidate` (`validate.js:15-17`) | `FormRoot` sets it (`form_root.ts:38`); a bare `[formField]` form gets none (measured E) | Automatic on every form in a template importing the module (`ng_no_validate_directive.ts:28-33`) | None under `FormRoot` or classic forms; a page without either must write it. |
| Validate on submit only (`validate.js:11-13`, `46`) | `submit()` marks all touched and runs `onInvalid` (`structure.ts:490-506`); validity is continuous | `submitted` flag, `ngSubmit` always emits (`ng_form.ts:335-341`) | Timing is the template's choice (`touched() && invalid()`), not built in. |
| Prevent submit when invalid (`validate.js:57`) | `FormRoot` prevents always, runs `action` only when not invalid (`form_root.ts:46`, `structure.ts:495-506`) | Always prevents (returns `false`); app checks `invalid` in its handler | Covered. |
| Skip if page prevented first (`validate.js:50`) | n/a | n/a | This is why `validate.js` is inert under both Angular APIs (measured A, C). |
| `aria-invalid="true"` on each invalid control (`validate.js:32`) | none | none | Gap: a directive must bind it (`invalid() && touched()` or a policy). |
| Message = `validationMessage`, browser-localised (`validate.js:41`) | `ValidationError.message`, author-written, per rule (`util.ts:18-19`) | Error keys only; text is the template's | Gap: no localised platform sentence; reading `validationMessage` works only for mirrored constraints plus static `type`/`pattern` (measured B), and the guide says not to rely on it (`validation.md:65`). |
| Write into empty `[data-error]`, never over author text (`validate.js:39-43`) | Template renders `errors()` messages | Template renders per key | Gap: no slot-filling; the template or a directive owns the text. |
| Error shown by CSS on `aria-invalid` or `:user-invalid` (`field.css:188-190`) | `:user-invalid` fires for mirrored constraints only (measured) | Same for natively present attributes (measured C) | Gap: Yeti's CSS needs `aria-invalid` from Angular to agree with Signal Forms for every rule. |
| Focus first invalid control (`validate.js:61`) | `errorSummary()[0].fieldTree().focusBoundControl()` in `onInvalid` (measured A) | none built in | Covered for Signal Forms by a recipe; not automatic. |
| `yeti:invalid` with `{controls}` (`validate.js:62`) | `onInvalid(field, detail)` callback (`types.ts:45-48`); `errorSummary()` gives fields in DOM order | `ngSubmit` plus `form.invalid`; `form.events` (`FormSubmittedEvent`, `ng_form.ts:338`) | Covered as a callback, not a DOM event; the payload is field trees, not elements. |
| Clear mark on `input`/`change` when valid; radios as a group (`validate.js:65-84`) | `invalid()` recomputes on every value change; all radios bound to one path share state | `statusChanges` | Covered by state; the group rule needs the binding to follow the shared field. |
| Controls outside any `.field` still block (`validate.js:6-9`) | Any field in the schema blocks `action` | Any control in the group | Covered. |
| Server round trip shown with static `aria-invalid="true"` (`docs.md:7`, `54`) | Submission `action` returns errors that land on fields (`structure.ts:500-501`) | `setErrors` | Gap: no attribute output; same `aria-invalid` binding gap. |
| `aria-describedby` to hint and error, author-written (`docs.md:45`, `54`) | none | none | Same as Yeti (author-written); a directive could compose it. |
| Delegated on `document`, works for late forms (`validate.js:19-20`) | Per-form directives created with the view | Same | n/a in Angular. |
| No live announcement; focus carries the message (section 1.3) | none | none | Same as Yeti. |

## 5. What the old Forms and Abide specs decided, and what transfers

The old map specced Foundation 6.9's Forms page and Abide plugin (`OLD/specs/forms.md`, `OLD/specs/abide.md`; tickets `OLD/issues/98-spec-forms.md`, `OLD/issues/31-spec-abide.md`). It binds nothing here. Read from those files; the transfer judgements are inferred.

**Transfers as stated (the problem is the same with Yeti):**

- Signal Forms owns validity; the library maps field state to the CSS framework's contract and ports no engine (`abide.md:552`, D1; ADR 0006). Yeti's module has no engine to port at all (`validate.js:20-21`).
- Field state by self-injection: `FORM_FIELD` first, then `NgControl`, reactive state through `control.events` (`abide.md:162`).
- An error-state policy as one pure function, Material `ErrorStateMatcher` shape (`abide.md:186-203`, D4). Yeti's own policy is "after submit, or `:user-invalid`" (`validate.js:11-13`), a different default.
- `aria-describedby` composed from consumer ids plus visible error ids, with the `aria-describedby` input alias (`abide.md:224`, `234`; decision 12 in `OLD/issues/31-spec-abide.md`).
- Focus after a failed submit as a documented `onInvalid` recipe, not library behaviour (`abide.md:369`, `543`).
- The Enter-key flush for `debounce(path, 'blur')` (`abide.md:236`, D8).
- Pre-hydration value adoption and the `ready` submit gate (`abide.md:240`, `457`, D9, D10, ADR 0027): a server-rendered Yeti form has the same GET-before-hydration problem.
- Hydration boundary and replay rules (`abide.md:452-464`): `FormRoot` calls `preventDefault()` first, so no submit is replayed.
- An error that lives inside a `label` is a defect (`abide.md:259`, D3). Yeti's `[data-error]` is a sibling inside `.field`, not inside the label (`field/docs.md:44-46`), so Yeti's markup already avoids it.
- Help-text pairing stays consumer-written; directives never read the DOM (`forms.md:459`, D5; `forms.md:468`, D14). Yeti prescribes the same pairing (`docs.md:54`).
- `provideSignalFormsConfig({classes})` cannot reach labels, errors, or ARIA (`abide.md:307`); confirmed for 22.2 (`sf/api/di.ts:20-36`).

**Transfers only in part, or conflicts with Yeti's contract:**

- `aria-invalid` never on radios (`abide.md:233`, D6). `validate.js` sets it on every radio of the group, and Yeti's group error shows through `fieldset.field:has([aria-invalid="true"])` (`validate.js:58`, `78-80`; `field.css:188`). Dropping it on radios would leave the group's slot hidden unless `:user-invalid` matches (inferred).
- `role="alert"` on each error, `a11yErrorLevel` (`abide.md:259`, `338`, D7). Yeti has no live region and relies on focus (section 1.3); adding roles goes beyond Yeti's contract.
- No `:user-invalid` rule in library CSS (`abide.md:566`, D13). Yeti's own CSS already uses `:user-invalid` (`field.css:188-190`), so under Signal Forms it fires for mirrored constraints and not for the others (measured).
- Copied State classes are stripped (`abide.md:573`, D20). Yeti's state is the `aria-invalid` attribute, and a static `aria-invalid="true"` is Yeti's documented server-error signal (`docs.md:54`), not a demo artefact.
- Per-kind messages (`formErrorOn`, `abide.md:255`). Yeti has one slot per field and no kind selection (`manifest.json:79-84`).
- The Form alert (`[data-abide-error]`, `abide.md:261`). Yeti has no form-level alert; `yeti:invalid` is where a page would add one (`docs.md:37`).

**Does not transfer (Foundation-specific):**

- `nfsPatterns` and `nfsEqualTo()` (`abide.md:265-303`, D11, D12): Yeti ships no named patterns or validators.
- The label and Form-error directives that bind `.is-invalid-label`, `.form-error`, `.is-visible` (`abide.md:119-135`): Yeti has no such classes; its contract is `.field`, `[data-error]`, `[data-hint]`, `aria-invalid`, and `:user-invalid` (`manifest.json:73-98`, `field.css:183-190`).
- The contrast settings for Foundation's invalid state and fields (`abide.md:568`, D15; `forms.md:465`, D11): Yeti's colours come from its own tokens (`--yeti-color-alert`, `--yeti-color-alert-text`, `manifest.json:154-157`, `249-252`).
- The class rule's directives for input groups, help text, fieldset, `.middle` (`forms.md`, D1-D15): Yeti's field component is one class with `data-*` attributes and markers (`manifest.json:7-28`, `86-99`).

## 6. Open points (not checked)

- Screen reader output for a Yeti field under Angular (whether focus plus `aria-describedby` reads the new message) was inferred, not heard.
- Whether Chromium, Firefox, and WebKit set `:user-invalid` on a refused submit because of the submit attempt itself, or partly because focus moved: in C nothing moved focus and the field still matched, so the submit attempt suffices there (measured); the HTML-spec reason was not looked up.
- SSR and hydration of a Yeti field were not probed here; the old Abide spec's measurements are on Foundation markup.
