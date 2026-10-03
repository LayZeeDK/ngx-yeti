# 30. Prototype: fitting Angular Aria to Yeti by directive composition

Type: prototype
Status: resolved
Blocked by: 29
Labels: wayfinder:prototype
Map: ../map.md

## Question

[Prototype: Angular Aria for the four items that keep a native pattern](29-prototype-aria-for-the-native-pattern-items.md) found that Aria's Toolbar, Menu, and Tabs set the roving `tabindex` and initial state in `afterRenderEffect`. That never runs on the server, so the server HTML has every item at `tabindex="-1"` and Tabs' non-selected panels `inert` (upstream bug candidate A5). It also found that Aria's Accordion puts no closed panel content in the server HTML, and that Toolbar's widget overwrites `aria-disabled`.

Angular's directive composition guide says "components with `hostDirectives` can override any host bindings specified by a host directive" (`adev/src/content/guide/directives/directive-composition-api.md:131`, read). Can the package's directives, hosting Aria's, fix each of these and still meet the rendering-modes contract ([ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md))?

1. **Toolbar (`buttons`) and Tabs (`tabs`, and the carousel's picker).** Can the hosting directive's own `[attr.tabindex]` give the server HTML one reachable item (the first, or the selected tab) and then hand over to Aria's roving value after hydration, without the two bindings fighting? This has to hold with JavaScript off, before hydration, inside `hydrate never`, and after hydration. Can it also keep `inert` off every slide or panel in the server HTML where ADR 0024 or Yeti's tabs markup needs that? Can a busy button keep Yeti's `aria-disabled="true"`? And can a static `role="group"` be prevented from overriding `toolbar`?
2. **Accordion.** Can Aria's trigger on Yeti's `<summary>` (ticket 29's B2) keep the panel content in the server HTML, for example with content projected directly rather than through `ngAccordionContent`? Can it keep the summary's native activation or stay in sync through `[open]`? Do find-in-page and fragment links still open a closed item? Then the custom Angular alternative: does a heading inside Yeti's `<summary>` (`<summary><h3>...</h3></summary>`) keep Yeti's styles, and does it expose a heading in the accessibility tree in all three engines? That would close A11Y-11 without Aria.

## User instruction, 2026-10-02

The user's own message, verbatim, given after reading ticket 29's findings:

> Generally, only reach for Angular Aria when it addresses an accesibility feature that Yeti is missing. If Angular Aria itself introduces accessibility or SSR/hydration issues or violates any other constraint, first see if it can be modified to fit using other patterns like directive composition. If fitting Angular Aria doesn't seem possible and CDK does not provide a suitable alternative either, add custom, modern Angular-native code.

## How to work it

Two prototypes, reusing ticket 29's workspaces under `D:/tmp/ngx-yeti-29-<item>/`. The first covers points 1 for `buttons`, `tabs`, and the carousel. The second covers point 2. Measure in Chromium, Firefox, and WebKit, as ticket 29 did: computed styles against Yeti's `example.html`, the server HTML with JavaScript off, before hydration, inside `hydrate never`, and after hydration, axe, and the APG keyboard pattern. Each prototype writes `prototypes/aria-composition-<topic>/README.md`, and the orchestrator appends the `## Answer`. Decide nothing.

## Answer

Resolved 2026-10-03 by two Claude Opus 5.5 prototypes: [aria-composition-roving](../prototypes/aria-composition-roving/README.md) (point 1) and [aria-composition-accordion](../prototypes/aria-composition-accordion/README.md) (point 2). They ran in Chromium, Firefox, and WebKit, with Angular and `@angular/aria` 22.2.1, in ticket 29's workspaces. Results are measured unless marked. Decides nothing.

**Point 1: Toolbar and Tabs can be fitted.** The package's directive binds `[attr.tabindex]`. It gives the first widget, or the selected tab, the one Tab stop, and keeps it until Aria's public `active()` turns true, then passes Aria's value through. It uses no platform check and no private API. Host-directive bindings run before the host's (read, `directive-composition-api.md:122-131`).
- `buttons`, `tabs`, and the carousel's picker each have exactly one Tab-reachable item, and nothing `inert`, with JavaScript off, before hydration, and inside `hydrate never`. This meets ADR 0024 point 1 for the carousel. No `tabindex` changed during hydration, and no `NG05xx` mismatch or warning was logged.
- `buttons`: busy routed into Aria's `disabled` keeps `aria-disabled="true"` and Yeti's look. The package's `[attr.role]` beats a consumer's `role="group"`, but hydration writes the static value again for one task (read, `shared.ts:599`). Ticket 29's Shift+Tab race remains.
- `tabs`: Yeti's own markup shows every panel before its script runs (read, `tabs.css:1-5`). The server HTML does too, with one stop. Once live, the package adds `hidden`, because Aria sets only `inert`.
- Carousel: the glue is still needed (66 lines). The tab stop does not follow a swipe without Aria's private `activeItem` (read, `tab-list.ts:127`).
- Aria's generated ids change at hydration because of a random infix (`id-generator.ts:24`), unless an `id` is passed in. This is carried into [Research: the decided records against Angular's hydration constraints](33-research-decided-records-against-hydration-constraints.md) and ADR 0042's note.

**Point 2: the accordion.**
- **(C) Aria on Yeti's `details`/`summary` by composition** takes about 45 lines and uses only Aria's public API. Content projected directly into the panel renders on the server, every trigger is reachable by Tab, and Yeti's styles match. Enter, Space, and the arrow keys work, with `details[open]` in sync both ways. Against that, Aria writes `inert` on closed panels, so an item opened with JavaScript off or before hydration stays inert. Overriding `inert` holds only until the first toggle. A bound `open` undoes a click made before hydration unless `open` is read from the element in the constructor, a DOM read that has to be judged against the hydration rules. A fragment link followed before hydration ends closed in Chromium and WebKit. Development builds warn that the panel has no `ngAccordionContent`. `role="button"` on `summary` is not allowed by ARIA in HTML (read), though axe passed it.
- **(D) A heading inside `summary`, no Aria, no new code:** every Yeti selector and state matches, and axe reports 0. Chromium (CDP) and Firefox (UI Automation) expose a level-3 heading inside the expandable summary, which closes ledger A11Y-11. A bare `h3` takes Yeti's heading style (29 px, rows 7 px taller). `span[role=heading]` matches Yeti's look exactly, but Firefox lost that heading on an item clicked open (cause not isolated). WebKit's tree was not inspected, and no screen reader was run.
- Server and client DOM matched for every variant, with no `NG0500` errors.

### Correction, 2026-10-03

[Prototype: subclassing Aria's directives, and `[open]` against `[attr.open]`](34-prototype-subclassing-aria-and-open-binding-forms.md) measured that at hydration the first widget's `tabindex` goes `0`, `-1`, `0` within one batch. "No `tabindex` changed during hydration" above holds only for the value after each batch. The server HTML and the hydrated result are as stated.
