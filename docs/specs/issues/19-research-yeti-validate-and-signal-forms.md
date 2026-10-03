# 19. Research: what `validate.js` does, and replacing it with Angular Signal Forms

Type: research
Status: resolved
Blocked by: 03
Labels: wayfinder:research
Map: ../map.md

## Question

What is `validate.js` for: its rules, messages, timing, ARIA, and events (`yeti:invalid`)? How would the package replace or complement it with Angular's forms? That means Signal Forms in Angular 22.2 first, then reactive forms. The old map did the same for Foundation 6.9's Forms page and its Abide plugin.

## User instruction, 2026-10-01

The user's own message to the orchestrator, verbatim:

> 24. Analyze the purpose of validate.js and how this could be replaced using Angular Signal Forms, and so on, similar to what we did to spec Foundation for Sites v6.9's Forms and Abide.

## How to work it

Use a `/research` subagent, with these sources:

- `github.com/foundation/yeti` (`validate.js`, the field component, `range.js`, their manifests and docs);
- `github.com/angular/angular` at `22.2.x` (`packages/forms`, Signal Forms included, and `adev/src/content/guide/forms/`);
- the old map's `specs/forms.md` and `specs/abide.md` and their tickets under `.scratch/next-foundation-specs/`, as evidence of what that effort decided and why; they bind nothing here.

Cover:

- what Yeti validates, and when;
- how it marks fields invalid and announces errors;
- its interplay with native constraint validation;
- what [Research: Yeti's JavaScript modules and what Angular adds](03-research-yeti-javascript-and-angular.md) found: Angular's form directives prevent submit before `validate.js` runs, and nothing sets `aria-invalid` or `aria-describedby`;
- the Signal Forms API that maps to each behaviour, and the gaps;
- what the old Forms and Abide specs decided that transfers.

Run a small probe under `D:/tmp/` where a claim needs one. Write `research/yeti-validate-and-signal-forms.md`, and append an `## Answer`. Decide nothing.

## Answer

Resolved 2026-10-01 by Claude Opus 5.5. Findings: [research/yeti-validate-and-signal-forms.md](../research/yeti-validate-and-signal-forms.md). Decides nothing.

- `validate.js` has no rules of its own. On `submit`, in a `novalidate` form, it takes every control the browser's native constraint validation calls invalid. It sets `aria-invalid="true"` on each, writes the browser's localised `validationMessage` into an empty `[data-error]`, focuses the first one, prevents the submit, and dispatches `yeti:invalid` with `{controls}`. It clears the mark on `input`/`change`. It does nothing if the page already prevented the submit (read, `validate.js:46-84`). It has no live region: the message reaches a screen reader through focus and the author-written `aria-describedby` (inferred).
- Measured in Chromium, Firefox, and WebKit (Angular 22.2.1, probe in `D:/tmp/ngx-yeti-19/`): under `FormRoot` and under reactive forms, Angular prevents the submit before `validate.js` runs, so no `yeti:invalid`, no `aria-invalid`, no message. `onInvalid` runs synchronously inside the form's listener, and `focusBoundControl()` moves focus.
- Measured: with `[formField]` and no `FormRoot`, `validate.js` runs, but only on constraints the DOM knows: the mirrored `required` and a static `type="email"`. A form that is invalid only through `pattern()` or a custom `validate()` submits. A Signal-Forms-only template with no `FormRoot` and no `novalidate` gets the browser bubble and no `submit` event at all.
- Measured: after a refused submit, natively invalid fields match `:user-invalid` even untouched, so Yeti's CSS shows its error look for mirrored constraints under `FormRoot`, with an empty slot, and shows nothing for `email()`, `pattern()`, or custom rules.
- Signal Forms covers rules, submit prevention, the `onInvalid` callback (for `yeti:invalid`), focus (`errorSummary()[0].fieldTree().focusBoundControl()`), and clearing. Gaps, read in source: no `aria-invalid` or `aria-describedby`, no browser-localised message (author `message` per rule instead), no slot filling, and `provideSignalFormsConfig` sets classes only.
- What transfers from the old specs: Signal Forms owns validity; self-injection of `FORM_FIELD`, then `NgControl`; a pure error-state policy; composed `aria-describedby`; focus as an `onInvalid` recipe; the Enter flush; pre-hydration value adoption and the `ready` gate; errors outside the label; directives that never read the DOM.
- What conflicts with Yeti's contract: no `aria-invalid` on radios, since Yeti's group error keys on it; `role="alert"` errors; no `:user-invalid`, which Yeti's CSS uses; stripping copied state, when a static `aria-invalid` is Yeti's server-error signal. What does not transfer: `nfsPatterns`, `nfsEqualTo`, Foundation's classes, and Foundation's contrast settings.
