---
status: accepted
---

# Field validity comes from Angular forms; the field's directives map it onto Yeti's contract and hold the submit until ready

Adapted from old map ADR 0006 (`signal-forms-replaces-abide`), old map ADR 0026 (`abide-explicit-error-directives`), and ADR 0027 (`abide-pre-hydration-submit`) of `.scratch/next-foundation-specs/`, by [Decide: which ADRs carry over](../issues/08-decide-inherited-adrs.md), once [Decide: the spec list](../issues/11-decide-spec-list.md) kept `field` (with both of its modules in one spec). Those records bound nothing here.

Yeti's `field` is a `.field` wrapper around a label, a control, a `[data-hint]`, and a `[data-error]`, linked by the author's `aria-describedby` (`src/components/field/example.html:2-7`, read at `f52d1e8b9`). Its `validate.js` has no rules of its own: on submit it marks the controls the browser calls invalid with `aria-invalid="true"`, writes the browser's `validationMessage` into the error slot, focuses the first one, and stops the submit (`validate.js`; [Research: what `validate.js` does, and replacing it with Angular Signal Forms](../issues/19-research-yeti-validate-and-signal-forms.md)). Under `FormRoot` or reactive forms it never runs, because Angular prevents the submit first (measured in three engines, ticket 19), and [ADR 0040](0040-package-replaces-yetis-optional-modules.md) has the package replace it.

We decided:

1. **Angular forms own validity** (from old ADR 0006). The package ports no validation engine: rules, cross-field checks, submit prevention, and the invalid callback are Signal Forms', and the field's control directive reads `FORM_FIELD` by self-injection, then `NgControl`, so the same bindings work under reactive forms. The old `nfsPatterns` and `equalTo` helpers are not carried: Yeti's message comes from the platform, and Signal Forms' own validators cover the rules.
2. **The directives write Yeti's contract from field state**: `aria-invalid="true"` on each invalid control, including each control of a group (Yeti's group error keys on it, ticket 19), `aria-describedby` composed from the hint's and the error's ids ([ADR 0013](0013-parts-name-their-targets-by-reference.md)), and the rule's message into the `[data-error]` slot. Angular sets none of these itself (ticket 19, read in source), so each is a `ledger.md` row. When the state shows is one pure error-state policy, Material's `ErrorStateMatcher` shape, as in the old record.
3. **Yeti's native error look stays**: a natively invalid control matches `:user-invalid` and Yeti's CSS shows its error state; the package neither suppresses it nor adds `role="alert"` to the slot. The message reaches assistive technology through `aria-describedby` and through focus on the first invalid control after a refused submit, which Signal Forms provides (`focusBoundControl()`, ticket 19).
4. **Parts are linked by their directives, never by a DOM lookup** (from old ADR 0026): the hint and error markers are set by marker directives inside the field, found by the field's directive through dependency injection, and every id, `aria-*`, and marker is a host binding rendered on the server.
5. **A server-rendered form holds its submit until ready** (from old ADR 0027). Before hydration a form is plain HTML, so a submit is a native GET that puts every field, passwords included, into the URL (CWE-598) and reloads the page (WCAG 2.2 3.3.7), as the old prototype measured. The field's form-level directive exposes a read-only `ready` signal, false on the server and until the first client render callback, and the documented default is a natively disabled submit control bound to it. A consumer whose server handles native submissions uses `method="post"` and does not bind `ready`.

## Considered options

- **Load `validate.js` and let Angular forms sit beside it.** Rejected by measurement (ticket 19) and by ADR 0040.
- **A live region (`role="alert"`) on the error slot**, as the old Abide contract had. Not adopted: Yeti relies on focus and `aria-describedby`, and an alert per field on submit announces every error at once.
- **Strip a consumer's static `aria-invalid`.** Rejected: in Yeti a server-rendered `aria-invalid` is how a server reports an error; the `field` spec says how the directive adopts it at hydration (ticket 19's conflict list).

## Consequences

- A form inside `@defer (hydrate never)` never enables its held submit control, so a held form does not go in `hydrate never`.
- The `field` spec covers the range control too (`range.js`, [ADR 0004](0004-yeti-tokens-are-a-consumer-stylesheet-surface.md) exception 1); this record covers validation only.
- The browser's localised `validationMessage`, which `validate.js` used, is not available from Signal Forms; the rule's author message replaces it.
