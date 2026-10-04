# Roadmap — ngx-yeti

## Slicing notes

- Charter: `.project/CHARTER.md`. Program synthesis: `.project/SYNTHESIS.md`. Every milestone holds the Yeti pin at `f52d1e8b93de5bbde322480ba77d5be26c49b0ef`; no pin move is planned, because neither the charter nor the synthesis calls for one.
- Order of work (synthesis Settled, from `.claude/skills/ngx-yeti-specs/SKILL.md`): `setup` first, in M001. Each of `generated-ids`, `events`, `fragment-links`, and `navigation-close` lands before or with the first item that uses it, and inside a milestone the shared spec comes before its items. This is how the synthesis itself reads the order: its walking skeleton puts an item in the first milestone and `generated-ids` in the first Aria milestone. Items that use no shared spec (35 types-only items plus `button`, `enter`, `spinner`) do not wait for them.
- Cross-milestone test cases: when a spec's Testing Decisions name a story or case that composes an item from a later milestone, that case lands in the later milestone. The same applies to a shared spec's cases on a later item, such as the events cases on dialog and the fragment-links cases on the toc and the carousel. Each such case is listed in the milestone that lands it, and none is dropped.
- Every milestone, for each spec it ships: entry points created with `nx g @nx/angular:library-secondary-entry-point`; the four test layers of the spec's Testing Decisions; a prerendered and a server-rendered Fixture-app route checked with JavaScript on and off; the per-spec contract check against the built manifest; the packed consuming build extended to the new entry points; a changelog entry; and `nx typecheck` beside every `fastCompile` target. These are milestone deliverables, not tasks.
- Examples (charter Corrections, 2026-10-04): the user chose "Two: static ports, then logic (recommended)". M008 ports Yeti's five docs-site Examples into `apps/yeti-analog` and a new Angular CLI SSR examples app, with the mode matrix and the JavaScript-off and hydration e2e. M009 adds the shared API contract, both server implementations, forms, and data loading. `apps/yeti-app` stays the per-item Fixture app. Both Examples milestones come after every item milestone, because the five pages use items from M002 to M007.
- Analog demo pages and the Examples: the three demo pages of the synthesis decision on Analog rendering modes stay where they are (tabs and buttons in M003, native-state in M005, shell in M007). They become the groundwork for the Examples. They burn the low-confidence Analog decisions (source consumption, the hybrid Nitro build plus the `static` configuration, Yeti's CSS at `/yeti-css/`) as early as M003. They also remain the per-item-group check of charter criterion 5, including A5, A6, and A9 under Analog SSR. M008 adds the Examples beside them on the same infrastructure, without replacing them. One part of that synthesis decision is overridden: the decision does not demonstrate client-only routes, but the charter Corrections require CSR. Client-only routes therefore arrive in M008, because the charter outranks the synthesis.
- Release: release readiness (charter criterion 6) and program completion against all nine charter criteria sit in the final milestone, M009. M001 starts the packed consuming build and the changelog, and every milestone extends them.

## Milestones

### M001 — walking-skeleton

Goal: The setup spec and the card and lift items ship end to end, with item styles loaded as counted head links on the server and the client, each item at its own entry point, and every test layer, the contract check, and a packed consuming build running against real items instead of the placeholders.
Depends on: []
Surfaces: Storybook stories, Fixture app routes, package entry points
Status: active
Archive: null
Integrated: null

Scope: in
- The `setup` spec in full. This covers the `ngx-yeti/styles` loader of ADR 0060: reference-counted head links to the consumer's Yeti build at `yeti-css/` relative to base href, inserted in Yeti's rank order, with one presence attribute per item, written on the server and adopted on the client. It also covers `provideYetiStyles()`, the generated `yeti-types.ts`, the layer statement and global stylesheet in `yeti-app` and Storybook, and the ADR 0017 version format with its test.
- The `card` and `lift` items, each at its own secondary entry point. `lift` comes with `card` because the setup spec's `setup--shared-host` story and lift's own tests compose the two.
- The secondary entry-point layout is proven: `nx build ngx-yeti`, `nx build-fast ngx-yeti`, `nx typecheck ngx-yeti -c src`, the Storybook globs, and the Vitest spec roots pick up a generated entry point, and the primary `ngx-yeti` entry point becomes types-only.
- The placeholders `NgxYeti` and `Highlight` are removed in the same change that moves their fixture, story, SSR, and e2e assertions onto `card`.
- `ngx-yeti/accessibility.css` is created in `@layer ngx-yeti` for the setup spec's global stylesheet, published through ng-packagr assets and the package `exports` map, and resolved by Storybook and `yeti-app`. Its rules arrive with the items that own them, starting with `button` in M002.
- The per-spec contract check harness against the built manifest (`dist/yeti.manifest.json`), run for both items, with `^yeti-build` ordering for any target that reads Yeti's output.
- The Playwright `webServer` failure is reproduced or ruled out in a pipeline-created linked worktree and in the primary checkout. If it reproduces, the `webServer.command` in `yeti-app-e2e`, `ngx-yeti-e2e`, and `yeti-analog-e2e` is fixed. If not, the scratch location is recorded as the cause.
- A release-readiness skeleton: `nx build ngx-yeti`, `npm pack`, and a consuming build that imports every entry point present from the tarball, plus a changelog that each later milestone extends.
- Docs-audit rulings 1 to 5 of `.project/research/DOCS-AUDIT.md`, and the AGENTS.md "Commits" update to GSD Path subjects with the bisect-safe rule (charter Constraints, Commits).

Scope: out
- `@angular/cdk`, `@angular/aria`, and the shared specs `generated-ids`, `events`, `fragment-links`, and `navigation-close`: each lands with its first consuming item, in M003 or M005.
- card's composite stories with `grid` and `layer` (`card--layer-caption`, `card--grid-rows`): they land with those layouts in M002.
- `apps/yeti-analog`: first touched in M003.
- No `allowScripts` policy is committed (synthesis decision "npm allowScripts approvals"). This is revisited when CI's npm moves to 12.
- Every deferred check, any generator, and `ng add` (charter veto).

Success criteria
1. In Storybook, every story the `setup`, `card`, and `lift` specs name, `setup--shared-host` included, passes its play function and the axe gate under `nx test-storybook ngx-yeti`, and each item's Yeti file is present only while an instance renders.
2. On the Fixture app, the prerendered `/card` and `/lift` routes and the server-rendered `/server/card` and `/server/lift` routes pass `yeti-app-e2e` with JavaScript on and off: styled from the server's head links, axe-clean on the `wcagTags` rule set, and with no hydration mismatch. The JavaScript-off, axe, and replay assertions that targeted the placeholders now run on `card`.
3. A consuming build against the `npm pack` tarball imports `ngx-yeti/card`, `ngx-yeti/lift`, and `ngx-yeti/styles` and resolves `ngx-yeti/accessibility.css`. The primary `ngx-yeti` entry point exports types only, and the packed version matches the ADR 0017 format.
4. The contract check over the built manifest passes for `card` and `lift`, and `NgxYeti` and `Highlight` exist nowhere in the workspace.
5. `nx e2e yeti-app-e2e` and `nx e2e ngx-yeti-e2e` start their web servers both in a pipeline-created linked worktree and in the primary checkout.
6. `npm run check` passes, and docs-audit rulings 1 to 5 are applied.

Risks
- The ADR 0060 loader under hydration, both adopting server-inserted links and inserting in rank order, is the base every later item builds on. A defect here reaches every later milestone.
- The cause of the Playwright `webServer` failure is unknown (synthesis, low confidence). If the failure is specific to worktrees, it blocks every e2e Verify in the pipeline until fixed.
- An entry point made by hand silently skips `typecheck -c src`. Only the generator is safe.
- A local green run proves Chromium only. Cross-engine claims need CI.

Open questions
- None

### M002 — layouts-and-button

Goal: All 17 layouts plus table, visually-hidden, enter, button, and spinner ship at their own entry points with their ledger rows, giving every later item its composition partners.
Depends on: [M001]
Surfaces: Storybook stories, Fixture app routes, package entry points
Status: pending
Archive: null
Integrated: null

Scope: in
- Layouts: `box` (with the any-element `yetiBorder`, `yetiPaint`, and `yetiText`), `breakout`, `center`, `cluster`, `columns`, `container` (with the any-element `yetiShow` and `yetiHide`), `cover`, `frame`, `grid`, `icon`, `layer`, `masonry`, `overlay`, `scroller`, `sidebar`, `stack`, and `timeline`.
- The items the layouts' tests compose: `table` (with `yetiNumeric`), `button` (with `YetiButtonDisabledLink`), `spinner`, `enter`, and `visually-hidden`.
- Ledger rows A11Y-1a (button's forced-colours rule, the first rule in `ngx-yeti/accessibility.css`), A11Y-9, A11Y-10a, A11Y-10b, A11Y-10c, A11Y-13, A11Y-21, A11Y-22 (sidebar as owner, with the stack and table usage rules), and A11Y-23.
- The setup spec's order-sensitive pairs (`stack` with `center`, `cover` with `center`) proven on real items.
- card's composite stories with `grid` and `layer`, carried over from M001.

Scope: out
- Composite cases that need `nav`, such as `container--in-nav`: they land with nav in M007.
- `button--dialog-opener`: it lands with the dialog spec, which owns opening, in M005.
- Every item that uses `generated-ids`, `events`, `fragment-links`, or `navigation-close`: later milestones.

Success criteria
1. In Storybook, every story these 22 specs name, except the cases listed for M005 and M007, passes its play function and the axe gate. That includes the exact-formula contrast assertions of A11Y-10a, A11Y-10b, A11Y-10c, and A11Y-21.
2. On the Fixture app, each of the 22 items has a prerendered and a server-rendered route that passes `yeti-app-e2e` with JavaScript on and off, axe-clean and with no hydration mismatch. `enter` arrives after hydration, and behaves inside `hydrate never` as its spec states.
3. A consuming build against the `npm pack` tarball imports each of the 22 new entry points, and the contract check passes for all 22 items.
4. Under `forcedColors: 'active'`, a pressed toggle `yetiButton` draws its state through the package rule from `ngx-yeti/accessibility.css` (A11Y-1a, layer 4).
5. On the Fixture app, with the main bundle held back by the e2e helper, a click on a toggle `yetiButton` made before hydration reaches the consumer's handler after hydration, and `aria-pressed` becomes `true` (event replay, charter criterion 10).
6. `npm run check` passes.

Risks
- Size: 22 specs, 17 of them types-only. The planner batches several types-only items per task.
- The composition stories form a dense web (box, center, stack, cover, cluster, table, scroller, icon, button). A story that names an item from a later milestone must be moved explicitly, never dropped.
- The ties inside `yeti.layouts` (stack, center, cover) hold only if the loader inserts in Yeti's rank order.
- Stale computed styles after a stylesheet insertion in Chromium and WebKit (upstream O2) can make layout assertions flaky.

Open questions
- None

### M003 — aria-and-analog

Goal: The generated-ids, events, and fragment-links shared specs and the two Aria-hosted items, buttons and tabs, ship with the A5, A6, and A9 workarounds guarded by tests, and apps/yeti-analog demonstrates them under Analog SSR, SSG, and prerendering.
Depends on: [M001, M002]
Surfaces: Storybook stories, Fixture app routes, package entry points, yeti-analog pages
Status: pending
Archive: null
Integrated: null

Scope: in
- `@angular/cdk` and `@angular/aria` at exactly `22.2.1` as root devDependencies, added in one commit with `generated-ids` and declared as required peers of `ngx-yeti` at `^22.2.0` (synthesis decision "Install and peer ranges").
- A reproduction at 22.2.1 before anything builds on Aria: server-render an Aria Toolbar and Tabs to reproduce A5 and A6, and find which console channel A9 uses relative to the story preview's `console.error` gate (synthesis decision "Tracking Aria bugs A5, A6, A9").
- The shared specs, each at its own entry point and before the items that use it. `generated-ids` brings `injectYetiId`, `provideYetiAriaIds`, the `TransferState` seed, and the ADR 0044 id-shape test. `events` brings the four `detail` types in a type-only entry point. `fragment-links` brings `injectSameDocumentHref` and `provideYetiFragmentLinks`.
- `buttons`: Aria Toolbar hosted through `hostDirectives`, with the A5 `tabindex` hand-over on `yetiButtonsItem`. `tabs`: Aria Tabs hosted through `hostDirectives`, every panel shown with JavaScript off, `hidden` added once live, and only the allowed A9 dev message.
- Ledger rows A11Y-1b, A11Y-1c, A11Y-5, A11Y-12, A11Y-16 (its skip-link and tab deep-link cases), A11Y-17, and A11Y-18.
- `apps/yeti-analog` as the Analog demonstration (synthesis decisions on Analog consumption, rendering modes, and CSS serving):
  - It consumes ngx-yeti from source, through `resolve.tsconfigPaths`, the library sources in the Analog compilation, `implicitDependencies` on `yeti-css`, and the `accessibility.css` resolution.
  - It gets the setup spec's providers and global stylesheet: `withI18nSupport()`, the layer statement, and the Yeti imports.
  - A local Vite plugin serves Yeti's CSS at `/yeti-css/` in dev and emits it on build. A build-output count test covers it, and a Departures row in `.claude/skills/ngx-yeti-specs/SKILL.md` records it.
  - It builds as a hybrid Nitro build plus a `static` configuration, and `yeti-analog-e2e` runs against the Nitro server and a static file server instead of the dev server.
- The tabs-and-buttons demo page, prerendered, server-rendered under `/server/`, and statically generated.

Scope: out
- The fragment-links cases on toc links and carousel dots, and the events cases on dialog, field, carousel, and toc: they land with those items in M005, M006, and M007.
- Client-only Analog routes (`routeRules` with `ssr: false`): not part of this demo page (synthesis decision on Analog rendering modes). They arrive with the Examples in M008, per the charter Corrections.
- The setup spec's Beasties-dependent checks (the A4 test and the `noscript` copy) in `apps/yeti-analog`, which has no Beasties step. JavaScript-off styling there is proven through the loader's head links and Vite's stylesheet link.
- Filing upstream reports for A5, A6, or A9 without the user's confirmation (charter veto).

Success criteria
1. In Storybook, every story the `buttons`, `tabs`, and `fragment-links` specs name passes its play function and the axe gate, `select` is asserted as an action, and no story fails on the A9 dev message.
2. On the Fixture app, the prerendered and server-rendered `buttons` and `tabs` routes pass `yeti-app-e2e` with JavaScript on and off, axe-clean and with no hydration mismatch. The server HTML has one selected tab, one `tabindex="0"`, and no panel `hidden` or `inert` (A11Y-17), and ids are unchanged through hydration. Under `/sub/`, a skip link and a tab deep link do not reload after hydration (A11Y-16).
3. The A5, A6, and A9 guard tests pass at cdk and aria 22.2.1: the server-HTML `tabindex` and `inert` assertions, the ADR 0044 server-and-client id-shape test, and the single allowed dev message.
4. In `apps/yeti-analog`, the tabs-and-buttons page renders from source with Yeti's CSS from `/yeti-css/`. `yeti-analog-e2e` runs it prerendered, server-rendered, and from the `static` output, with JavaScript on and off, axe-clean and with no hydration mismatch.
5. A consuming build against the `npm pack` tarball imports `ngx-yeti/generated-ids`, `ngx-yeti/events`, `ngx-yeti/fragment-links`, `ngx-yeti/buttons`, and `ngx-yeti/tabs`. The packed `package.json` declares `@angular/cdk` and `@angular/aria` as peers at `^22.2.0`, and the contract check passes for `buttons` and `tabs`.
6. On the Fixture app, with the main bundle held back by the e2e helper, a press on a tab made before hydration selects that tab after hydration, with `select` emitted once. A press on a `yetiButtonsItem` member before hydration reaches the consumer's handler and moves the Tab stop to it, and an ArrowRight pressed before hydration moves focus once and stops at the toolbar (event replay, charter criterion 10).
7. `npm run check` passes.

Risks
- The status of A5, A6, and A9 at 22.2.1 comes from reading the code, not from running it (medium confidence). If a workaround does not hold, the tabs and buttons design reopens inside this milestone.
- `_IdGenerator` is underscore-private. A CDK rename breaks the A6 override, and the id-shape test is the guard.
- All three Analog decisions are low confidence: the source consumption, the two-configuration build with a static file server, and the CSS plugin have not been run. Analog's dependency crawler may also need `ssr.noExternal` for aria and cdk.
- Aria pins cdk to an exact version, so every bump moves the pair in one commit and reruns the A5, A6, and A9 tests first.
- Size: three shared specs, two Aria items, and the Analog demonstration in one milestone.

Open questions
- None

### M004 — content-and-recipes

Goal: The static content components, the remaining utilities, and the hero and media recipes ship at their own entry points with their ledger rows.
Depends on: [M001, M002]
Surfaces: Storybook stories, Fixture app routes, package entry points
Status: pending
Archive: null
Integrated: null

Scope: in
- Components `badge`, `breadcrumbs`, `pagination`, `progress`, and `seam`.
- Utilities `attention`, `billboard`, `lede`, and `print`.
- Recipes `hero` and `media`.
- Ledger rows A11Y-1e, A11Y-1f, A11Y-10d, A11Y-10e, and A11Y-20, including its layer-4 zoom measurement and the decision that follows it.

Scope: out
- The `shell` recipe: M007, with nav.
- `alert`: M006, because it follows the events spec's rules for its `closed` output.

Success criteria
1. In Storybook, every story these 11 specs name passes its play function and the axe gate, including the contrast assertions of A11Y-10d and A11Y-10e and `badge--in-control`.
2. On the Fixture app, each of the 11 items has a prerendered and a server-rendered route that passes `yeti-app-e2e` with JavaScript on and off, axe-clean and with no hydration mismatch, and billboard's 200 % zoom case runs in three engines in CI (A11Y-20).
3. A consuming build against the `npm pack` tarball imports each of the 11 new entry points, and the contract check passes for all 11 items.
4. Under `forcedColors: 'active'`, the progress bar and the current pagination link are drawn by rules from `ngx-yeti/accessibility.css` (A11Y-1e, A11Y-1f).
5. On the Fixture app, with the main bundle held back by the e2e helper, a click on the pagination's Next link and on a breadcrumbs `routerLink` step made before hydration is replayed and ends on the target route (event replay, charter criterion 10).
6. `npm run check` passes.

Risks
- No fix for A11Y-20 is decided until the zoom case has run. A failing measurement adds a decision inside this milestone.
- Progress's scroll mode relies on Yeti's guarded scroll-driven animation, so the floor engines take the fallback, and the tests must assert per engine.

Open questions
- None

### M005 — disclosure-and-overlays

Goal: The navigation-close shared spec and the native-state items dialog, dropdown, tooltip, and accordion ship with their light-dismiss additions, focus return, and close on navigation, and apps/yeti-analog adds the native-state page.
Depends on: [M001, M002, M003]
Surfaces: Storybook stories, Fixture app routes, package entry points, yeti-analog pages
Status: pending
Archive: null
Integrated: null

Scope: in
- The `navigation-close` shared spec (`injectCloseOnNavigation`), before `dialog` and `dropdown`, with `@angular/router` as an optional peer injected with `{optional: true}` (ADR 0041), and its own Fixture-app route and stories.
- `dialog`: an invoker-command opener, focus return, `closePredicate`, and the `opened` and `closed` outputs.
- `dropdown`: a custom `popover` disclosure, hover intent, and closing on focus-out.
- `tooltip`: dismissal with Escape.
- `accordion`: native `details` with a heading inside `summary`, and its rule in `ngx-yeti/accessibility.css`.
- Ledger rows A11Y-1g, A11Y-2, A11Y-3a, A11Y-8, A11Y-11, A11Y-15, A11Y-25, A11Y-26, A11Y-27, and A11Y-29.
- Cases carried over: button's `button--dialog-opener` story, and the events cases on dialog's outputs, including the A3 residue that a dialog closed before hydration emits no `closed`.
- The Analog native-state page: a native-state item inside `hydrate never` beside a client-only `@defer` that uses `provideYetiStyles({ preload })`, in the three rendering modes.

Scope: out
- `nav`, the custom disclosure navigation: M007.
- CDK `FocusTrap`, `closedby`, `interestfor`, and `requestClose()`: the records and the browser target keep them out of the program.

Success criteria
1. In Storybook, every story the five specs name passes its play function and the axe gate, including `navigation-close--shell-dialog`, `navigation-close--shell-dropdown`, the tooltip's Escape case, and the dropdown's focus-out case.
2. On the Fixture app, each of the five specs has a prerendered and a server-rendered route that passes `yeti-app-e2e` with JavaScript on and off, axe-clean and with no hydration mismatch, and the following hold:
   - With JavaScript off, invoker commands open the dialog, `popover` opens the dropdown, and `details` opens the accordion.
   - A `routerLink` inside an open panel closes it and leaves focus on the opener (A11Y-15).
   - A dialog opened before hydration returns focus to its single opener (A11Y-25).
3. In `apps/yeti-analog`, the native-state page is served prerendered, server-rendered, and from the `static` output. `yeti-analog-e2e` shows the item working inside `hydrate never` and the deferred item styled with no unstyled frame, with JavaScript on and off, axe-clean and with no hydration mismatch.
4. A consuming build against the `npm pack` tarball imports `ngx-yeti/navigation-close`, `ngx-yeti/dialog`, `ngx-yeti/dropdown`, `ngx-yeti/tooltip`, and `ngx-yeti/accordion`, and the contract check passes for the four items.
5. On the Fixture app, with the main bundle held back by the e2e helper, each of the following, made before hydration, takes effect after it. A Backdrop press closes the dialog once. A replayed `toggle` sets the accordion's and the dropdown's open state without a duplicate change. A replayed `focusout` closes the dropdown. An Escape on a focused tooltip Trigger dismisses the Bubble. A `routerLink` click inside an open panel closes it after the navigation (navigation-close) (event replay, charter criterion 10).
6. `npm run check` passes.

Risks
- A dialog's `close` is not replayed (A3), and focus return before hydration (A11Y-25) is inferred. WebKit never focuses a clicked button, so these cases are engine-sensitive.
- A11Y-1g, A11Y-27, and A11Y-29 are measured first and decided after. A failing measurement adds a package CSS rule inside this milestone.
- Hover intent depends on non-replayed pointer events and fallback timers, which makes it timing-sensitive across three engines.

Open questions
- None

### M006 — forms-alert-demo-toc

Goal: The field, affix, alert, demo, and toc items ship at their own entry points with their ledger rows, including the package's two components, YetiFieldError and YetiDemo.
Depends on: [M001, M002, M003]
Surfaces: Storybook stories, Fixture app routes, package entry points
Status: pending
Archive: null
Integrated: null

Scope: in
- `field` over Angular forms (ADR 0020: Signal Forms' `FORM_FIELD` first, then `NgControl`), with the `YetiFieldError` component and `form[yetiForm]` (its `ready` signal and `invalid` output). `affix` comes with it, and the field's DI reaches through the affix.
- `alert`: the `closed` output, the focus move, and the class-form `animate.leave`.
- `demo`: an attribute-selector component with a sandboxed `srcdoc` frame and a resize grip.
- `toc`: the current link found from its headings, and the `currentLink` model with its `current` output.
- Ledger rows A11Y-1d, A11Y-6, A11Y-7, A11Y-14, A11Y-16 (its toc-link case), A11Y-19, A11Y-24, and A11Y-28.
- Cases carried over: the events cases for `invalid` and `current`, and the fragment-links case on toc links.

Scope: out
- A validation engine and an error summary, and scripts or syntax highlighting in the demo frame: the specs' own Out of Scope.
- A tooltip on a field control: the tooltip's usage rule, which shipped in M005.
- The carousel: M007.

Success criteria
1. In Storybook, every story the five specs name passes its play function and the axe gate. That includes a field whose accessible name leaves out the required `*` (A11Y-6), a refused submit that focuses the first invalid control (A11Y-14), and the demo grip's single-pointer step (A11Y-24).
2. On the Fixture app, each of the five items has a prerendered and a server-rendered route that passes `yeti-app-e2e` with JavaScript on and off, axe-clean and with no hydration mismatch, and the following hold:
   - With `main.js` held back, a submit before hydration does nothing (A11Y-19), and a value typed before hydration survives it (A11Y-28).
   - Under `/sub/`, a toc link does not reload with JavaScript off, before hydration, or after it (A11Y-16).
3. Under `forcedColors: 'active'`, a field's checked checkbox, its switch, and its range are drawn by rules from `ngx-yeti/accessibility.css` (A11Y-1d).
4. A consuming build against the `npm pack` tarball imports `ngx-yeti/field`, `ngx-yeti/affix`, `ngx-yeti/alert`, `ngx-yeti/demo`, and `ngx-yeti/toc`, and the contract check passes for all five items.
5. On the Fixture app, with the main bundle held back by the e2e helper, a click on an alert's close button made before hydration moves focus and emits `closed` after hydration. Input in a field control made before hydration is replayed into the field state (event replay, charter criterion 10).
6. `npm run check` passes.

Risks
- The field's reliance on Signal Forms (ADR 0020) is a decision in the trap quadrant (high impact, not high confidence). If the `FORM_FIELD` shape at Angular 22.2.1 differs from the records, the field design reopens.
- The demo's `srcdoc` frame loads the stylesheet twice, and the A11Y-28 restoration was measured only in the old bundle's prototype.

Open questions
- None

### M007 — nav-shell-carousel

Goal: The nav, shell, and carousel items ship, completing all 54 specs, and apps/yeti-analog adds the shell page.
Depends on: [M001, M002, M003, M004, M005, M006]
Surfaces: Storybook stories, Fixture app routes, package entry points, yeti-analog pages
Status: pending
Archive: null
Integrated: null

Scope: in
- `nav`: custom disclosure navigation with nested dropdowns, closing on focus-out, and closing on navigation.
- `shell`: its regions and sticky regions.
- `carousel`: scroll snap, link dots, previous and next buttons, and a current-slide marker.
- Ledger rows A11Y-3b, A11Y-4, and A11Y-16 (its carousel-dot case), plus the shell and nav usage rules of A11Y-22.
- Cases carried over: composite stories that need nav or shell (such as `container--in-nav`), and the events and fragment-links cases on the carousel.
- The Analog shell page: `shell` with `stack`, `center`, `cover`, `card`, and `badge`, in the three rendering modes.

Scope: out
- Yeti's five Examples and their API logic: M008 and M009.
- The final release-readiness check and program completion: M009.
- Any Yeti pin move: neither the charter nor the synthesis calls for one.

Success criteria
1. In Storybook, every story the `nav`, `shell`, and `carousel` specs name, and every case carried over to this milestone, passes its play function and the axe gate.
2. On the Fixture app, the prerendered and server-rendered `nav`, `shell`, and `carousel` routes pass `yeti-app-e2e` with JavaScript on and off, axe-clean and with no hydration mismatch. Under `/sub/`, a carousel dot does not reload with JavaScript off, before hydration, or after it (A11Y-16).
3. In `apps/yeti-analog`, the shell page is served prerendered, server-rendered, and from the `static` output, with a center inside the shell's stack centred. `yeti-analog-e2e` runs it with JavaScript on and off, axe-clean and with no hydration mismatch.
4. A consuming build against the `npm pack` tarball imports `ngx-yeti/nav`, `ngx-yeti/shell`, and `ngx-yeti/carousel`, and the contract check passes for the three items.
5. On the Fixture app, with the main bundle held back by the e2e helper, a replayed `toggle`, `focusout`, and `pointerdown` on the nav take effect after hydration, and a click on a carousel dot or its previous or next button made before hydration scrolls the track and emits `slide` once after hydration (event replay, charter criterion 10).
6. `npm run check` passes.

Risks
- Size: three interactive items (the carousel alone has seven directives) and the Analog shell page.
- nav composes dropdown and is composed by shell, so a defect in either surfaces in the other's stories.

Open questions
- None

### M008 — examples-static-ports

Goal: Yeti's five Examples (Exhibition, Article, Landing page, Dashboard, Settings screen) run as static ports on ngx-yeti in apps/yeti-analog and in a new Angular CLI SSR examples app, and each app's e2e verifies every rendering mode in the charter's matrix.
Depends on: [M001, M002, M003, M004, M005, M006, M007]
Surfaces: yeti-analog pages, examples app pages
Status: pending
Archive: null
Integrated: null

Scope: in
- A new Angular CLI SSR examples application and its e2e project, generated with the Nx Angular generators. It gets the setup spec's providers and global stylesheet, Yeti's CSS through the setup spec's `assets` entry, and source consumption of ngx-yeti as `yeti-app` does. `apps/yeti-app` stays the per-item Fixture app.
- The five Examples ported into both apps with ngx-yeti directives on the markup Yeti's docs site renders. The pages use nav, shell, tabs, dialog, dropdown, field, affix, toc, progress, accordion, table, scroller, billboard, badge, alert, hero, media, breakout, sidebar, grid, columns, enter, and print. Any content the site does not license for reuse is replaced by own or placeholder assets of the same structure (charter Corrections, the fidelity default).
- The mode matrix, "Every mode at least once per app": in each app, every example passes the hydration and JavaScript-off checks. Each of CSR, SSR, SSG, incremental hydration, i18n with a second locale, and `@defer` is exercised by at least one example.
- In `apps/yeti-analog`, the Examples sit beside the M003, M005, and M007 demo pages on the same infrastructure. Client-only routes are added for CSR, because the charter Corrections override the synthesis's no-client-only choice for this app.
- Both apps' e2e projects join the CI workflow.

Scope: out
- The shared API contract, both server implementations, the Dashboard's data loading, and the Settings screen's save: M009.
- Any change to Yeti or to `docs/specs/` to obtain example markup (charter vetoes). The sources exist only as rendered docs-site pages.

Success criteria
1. In `apps/yeti-analog`, all five Examples render, and `yeti-analog-e2e` passes each of them with no hydration mismatch and readable with JavaScript off, axe-clean on the `wcagTags` rule set. Each of CSR, SSR, SSG, incremental hydration, a second locale, and `@defer` is exercised by at least one example and asserted by that e2e.
2. In the Angular SSR examples app, all five Examples render, and its e2e passes each of them with no hydration mismatch and readable with JavaScript off, axe-clean on the `wcagTags` rule set. Each of CSR, SSR, SSG, incremental hydration, a second locale, and `@defer` is exercised by at least one example and asserted by that e2e.
3. Every example styles itself through ngx-yeti directives and the per-item style loader. The examples write no Yeti class or `data-*` attribute by hand, and each one's assets are either licensed for reuse or own or placeholder assets, as the milestone's research recorded.
4. Event replay (JSAction, `withEventReplay()`) is verified on the Examples in each app. On every example that has an interactive ngx-yeti item, the app's e2e holds back the main bundle, makes an interaction on at least one such item before hydration completes, and asserts that it takes effect after hydration (charter criterion 8).
5. `npm run check` passes, and the CI workflow runs both apps' e2e projects.

Risks
- The example sources are not in the Yeti repository at the pin or at develop. A port from rendered pages can carry example-specific CSS or markup that no ngx-yeti item covers.
- Analog support for a second-locale build, incremental hydration, and client-only routes next to the hybrid and `static` builds is unverified.
- Size: five pages in two apps, a new application, and a mode matrix.

Open questions
- [RESEARCH] Under what licence is the docs-site Examples content (markup, copy, photographs, drawings, fonts) at foundationcss.com/yeti/examples published, and which parts may be reused faithfully versus replaced by own or placeholder assets of the same structure?
- [RESEARCH] Does Analog 2.8 support a second-locale i18n build, incremental hydration with hydrate triggers, and client-only CSR routes, all beside the hybrid Nitro build and the static configuration, and what does each need from the app's config?
- [RESEARCH] Which example exercises which of CSR, SSR, SSG, incremental hydration, i18n, and defer in each app, so that every mode is covered at least once per app and every example passes hydration and JavaScript off?
- [RESEARCH] Do the rendered example pages rely on example-specific CSS or markup beyond Yeti's 49 items, and how is each such piece carried without writing Yeti classes by hand?
- [RESEARCH] Are the five example pages one shared Angular library consumed by both apps or written per app, given that M009 requires the same Angular client code in both?
- [RESEARCH] How does the Angular SSR examples app build and serve a second locale with SSR and prerendering under one base href, and how does its e2e reach each locale?
- [RESEARCH] Does Analog 2.8 support withEventReplay and JSAction replay under its SSR and prerender outputs, and what does it need (providers, the event-dispatch contract script in the served HTML, a way for e2e to hold back the client bundle)?

### M009 — examples-api-and-release

Goal: The Examples gain one typed API contract served by Analog Nitro routes and by the Angular SSR app's Express server, with the Dashboard loading data and the Settings screen saving with server-side validation errors through the same client code in both apps, and the package is release-ready with all nine charter criteria met and nothing published.
Depends on: [M001, M002, M003, M004, M005, M006, M007, M008]
Surfaces: yeti-analog pages, examples app pages, example API endpoints, package entry points, Fixture app routes, Storybook stories
Status: pending
Archive: null
Integrated: null

Scope: in
- One typed API contract covering the Dashboard's data and the Settings screen's load and save, with server-side validation errors.
- That contract implemented by Analog Nitro API routes and by the Angular SSR examples app's Express server, plus one contract test suite that both servers pass.
- One Angular client used by both apps. The Dashboard loads its data during server rendering with no refetch after hydration. The Settings screen saves through the contract and shows server-side validation errors on the affected fields through `field` (ADR 0020).
- Release readiness (charter Full scope, release readiness):
  - A final `nx build ngx-yeti`, `npm pack`, and consuming build over every entry point.
  - The ADR 0017 version at the held pin, the peer dependencies, and a complete changelog.
  - The full CI workflow (every e2e project, the production Fixture-app e2e, and the Safari job) and the floor workflow passing.
  - A fresh docs audit of the workspace's own docs.
  - Nothing published.
- Program completion, checked against all nine charter criteria.

Scope: out
- Publishing to npm: the user runs `npm publish` (charter veto).
- Any Yeti pin move: neither the charter nor the synthesis calls for one.
- A validation engine or error summary in the package: the field spec's own Out of Scope. Server errors reach the field through Angular forms.

Success criteria
1. In both `apps/yeti-analog` and the Angular SSR examples app, the Dashboard's server-rendered HTML holds its data from the API contract, and e2e shows no data request after hydration (charter criterion 9).
2. In both apps, the Settings screen loads through the contract and saves through it. A server-side validation error shows on the affected field, with `aria-invalid` and the described-by error, in e2e (charter criterion 9).
3. The Analog Nitro API routes and the Express server both pass the same API contract test suite (charter criterion 9).
4. In both apps, with the main bundle held back, a value typed into a Settings field before hydration survives hydration and is saved by the next submit, and a submit attempted before hydration sends nothing (ledger A11Y-19 and A11Y-28, event replay).
5. All five Examples still pass both apps' e2e with the full mode matrix, including the event-replay checks, with no hydration mismatch and readable with JavaScript off (charter criterion 8).
6. `nx build ngx-yeti` followed by `npm pack` produces a package that meets charter criterion 6, with nothing published:
   - Its version matches the ADR 0017 format.
   - Every one of the 49 item entry points, plus `ngx-yeti/styles`, `ngx-yeti/generated-ids`, `ngx-yeti/events`, `ngx-yeti/fragment-links`, and `ngx-yeti/navigation-close`, resolves in a consuming build.
   - Its peers name Angular `^22.2.0`, `@angular/cdk`, and `@angular/aria`.
   - It has a changelog.
7. The Fixture app serves a prerendered and a server-rendered route for every one of the 49 items, and `yeti-app-e2e` runs each with JavaScript on and off, axe-clean on the `wcagTags` rule set and with no hydration mismatch (charter criterion 3).
8. For every item whose spec lists replayed events (button, buttons, tabs, pagination, breadcrumbs, dialog, dropdown, tooltip, accordion, navigation-close, alert, field, nav, carousel), `yeti-app-e2e` makes each such interaction before hydration with the main bundle held back and asserts that it takes effect after hydration (charter criterion 10).
9. `apps/yeti-analog`'s e2e proves ngx-yeti items under Analog SSR, SSG, and prerendering on its demo pages and Examples (charter criterion 5).
10. The contract check passes for all 49 items, and every `docs/specs/ledger.md` row's named test exists and passes (charter criteria 1 and 4).
11. At the final integration commit, `npm run check`, which includes every story's play function and the axe gate under `test-storybook`, the CI workflow, and the floor workflow pass (charter criterion 2).
12. Docs-audit rulings 1 to 5 stay applied, and a fresh docs audit finds no stale or aspirational claim in the workspace's own docs, with `docs/specs/` excluded (charter criterion 7).

Risks
- The server data must reach the client without a refetch in two frameworks and under prerendering. A mismatch shows up as a hydration or refetch failure only in e2e.
- Server-side validation errors must enter the field's error state through Angular forms (ADR 0020). If Signal Forms has no server-error path at 22.2.1, the design reopens.
- Program-wide criteria can surface regressions from earlier milestones late, and the Safari and floor jobs run only in CI.

Open questions
- [RESEARCH] Where does the shared API contract live (a workspace library of types and schemas, or another shape), and how do the Analog Nitro routes and the Express server each implement it and run one contract test suite?
- [RESEARCH] How does each app carry server-fetched Dashboard data into the client without a refetch after hydration, including on prerendered or statically generated routes?
- [RESEARCH] What error shape does the contract use for server-side validation, and how do Signal Forms (or NgControl) at Angular 22.2.1 put those errors on the affected fields so that field shows them?
- [RESEARCH] Must the Settings save work with JavaScript off, given that field's yetiForm keeps submit disabled until the client is ready (ledger A11Y-19), or is JavaScript-off readability enough for that screen?
