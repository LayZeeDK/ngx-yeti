# 33. Research: the decided records against Angular's hydration constraints

Type: research
Status: resolved
Blocked by:
Labels: wayfinder:research
Map: ../map.md

## Question

Angular's hydration guide sets these constraints:
- the same DOM structure on the server and the client, whitespace and comment nodes included;
- server HTML that is not altered between the server and the client;
- no direct DOM manipulation (`document` queries, `appendChild`, moving or detaching nodes, `innerHTML`);
- valid HTML structure (a `<table>` with `<tbody>`, no `<div>` in `<p>`, no nested `<a>`);
- a consistent `preserveWhitespaces`;
- no content branched on `isPlatformBrowser`;
- third-party scripts deferred until after hydration.

The guide is `adev/src/content/guide/hydration.md:97-135` and `:214-226` in `angular/angular` `5db6fc4453`. Do the decisions this map has already made comply? Check, at least:
- ADR 0060's counted `<link>` service and its adoption at hydration;
- ADR 0021's dialog;
- ADR 0023's fragment links;
- ADR 0024's carousel;
- ADR 0041's navigation close;
- ADR 0042's generated ids;
- ADR 0043's host listeners;
- ADR 0070's attribute mapping, including the unset input that removes a static attribute;
- the `demo` component's `srcdoc` iframe;
- the `table` item's markup;
- `enter`'s `data-once`, which ticket 18 measured hydration restoring;
- static attributes re-applied at hydration (ticket 18).

For each, decide whether it complies, and if not, what the record must change.

## User instruction, 2026-10-03

The user's own message, verbatim:

> 54. Make sure that we always comply with [hydration constraints](https://angular.dev/guide/hydration#constraints).

## How to work it

Use a `/research` subagent that reads the records and the prototypes' measurements. Where the existing prototypes already logged hydration errors or mismatches, cite them; otherwise mark the finding inferred. Write `research/hydration-constraints-audit.md`, one row per record, and append an `## Answer`. Records change only through the orchestrator's dated notes.

## Answer

Resolved 2026-10-03. The audit is [research/hydration-constraints-audit.md](../research/hydration-constraints-audit.md): 21 rows, each with the constraint, the verdict, the evidence, and the change the record would need. It changes no record; the orchestrator's dated notes do that.

**Breaks (2), both measured in ticket 18:**
- `architecture-guide.md:193` P11 prefers "`[open]` bound from an `open` model on a dialog". A bound `[open]` closed a `details` the user opened before hydration. Remove it and use ADR 0021's form: `isOpen` is never bound to `open`.
- P11 (`:189`) and `building-blocks.md:54` leave "a `details` a page ships open" to the consumer and say "Initial state is bound". Both a static and a bound `open` undo a toggle made before hydration. No template form keeps it today; the record documents the loss or measures seeding the model from the claimed element.

**At risk (7):**
- ADR 0042 and `building-blocks.md:69`: ids change at hydration (measured, ticket 30: Aria's random infix; read: CDK's counters live in module state, so a server process counts across requests). Needed: a per-application counter, the package's id passed into Aria's `id` input, and consumer ids inside `hydrate` blocks.
- Static attributes written again at hydration, including a consumer's static `role="group"` that `yetiButtons` overrides (measured, tickets 18 and 30). Needed: no consumer static attribute on an attribute a directive binds.
- ADR 0070's unset input removing a static attribute: it is written back and removed again at hydration (read).
- `demo`'s `srcdoc`: a same-value write reloads the frame in three engines (measured for this audit); a projected `<pre>` would need a DOM read. Needed: the `code` input, and a measured choice about the reload.
- `table`: no record requires `<tbody>` (inferred mismatch). Needed: a usage rule.
- ADR 0041: the initial `NavigationStart` may close a dialog opened before hydration (inferred from the Router and replay sources).
- Building-blocks row 21: the accordion's `open` model is safe only if never bound to `[open]`.

**Complies:** ADR 0060 (measured: a development build of ticket 13's app logs no `NG05xx` in three engines; `<head>` is outside the hydrated tree), ADR 0021, 0023, 0024, 0043, ADR 0070's bindings and P markers, `enter`'s `data-once` under rule S and ADR 0040, no `isPlatformBrowser`, no `ngSkipHydration`, `preserveWhitespaces`, and the valid HTML of the package's own markup.

Ticket 18's and ticket 13's "0 console errors" came from production builds, where Angular does not check node matching. The development-build evidence comes from tickets 29 and 30 and from this audit's run.
