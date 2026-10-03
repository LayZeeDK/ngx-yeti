# Spec: navigation-close (shared-utility spec)

Ticket: [Spec: Navigation close (shared spec)](../issues/42-spec-navigation-close.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, develop, 2026-09-25). Accessibility target: WCAG 2.2 AA. Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)).

The points no record settled were decided on 2026-10-03 by the orchestrator in full AFK mode, in [ticket 50](../issues/50-decide-open-points-of-the-specs.md); each is marked "(decided in ticket 50)" and listed under `### Open` in this spec's ticket.

## Problem Statement

A consumer builds a routed Angular application whose persistent shell holds a Yeti `nav` panel, a `dropdown` panel, or a modal `dialog`, each with `routerLink`s inside it. The user opens the panel, follows a link, and the route changes behind a panel that is still open. [Prototype: Yeti's modules in a single-page Angular app](../issues/20-prototype-yeti-in-single-page-apps.md) measured it in Chromium, Firefox, and WebKit under `<base href="/sub/">`: a shell popover stays `:popover-open` over the new route, and a shell modal dialog stays open over it and keeps the page inert, so a hit test on the new route's heading lands in the dialog. A panel inside the destroyed route is closed by its removal and is not the problem.

Yeti has no router, so none of its modules can know a navigation happened; the gap is the package's to close ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); ledger row A11Y-15). Three more needs come with the fix:

- a consumer with no router must pay nothing and get Yeti's own behaviour;
- under SSR and hydration, a panel the user opened before hydration must not be closed by the application's own start-up navigation ([ADR 0041](../adr/0041-closing-on-navigation-is-a-per-instance-subscription.md)'s 2026-10-03 note; [Research: the decided records against Angular's hydration constraints](../issues/33-research-decided-records-against-hydration-constraints.md) row 9);
- focus must not be left in a context the navigation removed (WCAG 2.2 2.4.3, ledger row A11Y-15).

## Solution

The package ships one injection-context function in its `ngx-yeti/navigation-close` entry point, `injectCloseOnNavigation(isOpen, close)` ([ADR 0041](../adr/0041-closing-on-navigation-is-a-per-instance-subscription.md) point 1; [building-blocks.md](../building-blocks.md) Part 2 row 50). The `dialog`, `dropdown`, and `nav` directives call it once at construction with their open-state signal and their close method; through them, the `shell` recipe's panels close on navigation with no directive of their own (building-blocks row 20).

While the panel is open, the function listens for the Router's `NavigationStart` and calls `close()` on the first one. It stops listening when the panel closes and when the directive is destroyed. While nothing is open, nothing listens. With no `Router` in the injector, the function does nothing, and `@angular/router` is an optional peer dependency. There is no service and no registry: each open panel already knows it is open from the `toggle` or `close` event it observes (ADR 0041 point 3).

Focus goes back to the opener through the item's own close path, not through this function (ADR 0041 point 4). The application's initial navigation (the one the Router starts at bootstrap, with its redirects) never closes a panel: the function ignores every `NavigationStart` that arrives before the Router has completed its first navigation (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)). That is the spec's reading of ADR 0041's note, "measures it and ignores the initial navigation if so", and the measurement that confirms it is listed in the ticket.

## User Stories

1. As a consumer with a routed application, I want a shell dropdown panel to close when a `routerLink` inside it navigates, so that the new route is not covered by a stale panel.
2. As a consumer, I want a shell modal dialog to close when a `routerLink` inside it navigates, so that the new route is not inert behind a dialog the user has finished with.
3. As a consumer, I want a shell `nav` panel, opened below its threshold, to close on navigation, so that the small-screen menu behaves like a page change.
4. As a consumer, I want closing on navigation to be the default for `dialog`, `dropdown`, and `nav`, so that I do not have to remember an attribute on every shell panel (ADR 0041, rejected option two).
5. As a consumer using the `shell` recipe, I want its nav and dialog children to close on navigation through their own directives, so that the shell needs nothing extra (building-blocks row 20).
6. As a consumer with no `@angular/router` installed, I want the package to install and run without it, so that a static site pays nothing for routing (ADR 0041 point 2).
7. As a consumer with no `Router` provided, I want the panels to behave exactly as Yeti's do, so that nothing changes for a non-routed page.
8. As a keyboard user, I want focus back on the opener after a navigation closes a dialog, so that I am not left on a removed element or on `body` (A11Y-15; ADR 0021 point 2).
9. As a keyboard user, I want focus back on the dropdown or nav opener after a navigation closes its panel, so that my place on the page is kept (ADR 0041 point 4; the dropdown and nav specs measure it).
10. As a screen-reader user, I want the page outside a modal dialog to stop being inert once I navigate away from it, so that I can reach the new route's content.
11. As a pointer user, I want the new route's first paint to be visible, not covered, so that the page I asked for is the one I see (ADR 0041, rejected `NavigationEnd` option).
12. As a user who opened a shell dialog before the application finished loading, I want it to stay open when the application starts, so that my action is not undone by start-up (ADR 0041 note; decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).
13. As a user who opened a shell dropdown before hydration, I want it to stay open when the application hydrates, so that the open state I set survives (the map's open-state ruling).
14. As a user who presses Back or Forward while a shell panel is open, I want the panel to close, so that history navigation behaves like a link (inferred: a `popstate` navigation emits `NavigationStart` with the `popstate` trigger, `packages/router/src/events.ts:91`, read at `5db6fc4453`).
15. As a user who follows a fragment link inside a panel that the Router handles, I want the panel to close like any other navigation, so that the target is not hidden behind it.
16. As a consumer whose initial route redirects, I want the redirect chain not to close a panel the user opened before hydration, so that redirects count as start-up (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).
17. As a consumer, I want a panel inside a routed component to need nothing, so that the route's removal closes it as the platform already does (ticket 20, measured).
18. As a consumer navigating by `Location.go()` or a full page load, I want the docs to tell me this function does not see those, so that I am not surprised (ADR 0041, Consequences).
19. As a consumer, I want a panel opened by my own code (`showModal()`, `showPopover()`) to close on navigation too, so that every open path is covered (ADR 0041, Consequences: the state still arrives through `toggle` or `close`).
20. As a consumer, I want nothing subscribed to the Router while no panel is open, so that a page with many closed panels costs nothing (ADR 0041 point 1).
21. As a consumer, I want each subscription removed when its directive is destroyed, so that no listener outlives its panel (building-blocks 1.9 and 1.15).
22. As a consumer, I want `close()` called at most once per open, so that a navigation followed by a redirect does not close the panel twice.
23. As a consumer, I want a panel reopened after a navigation to close on the next navigation, so that the behaviour holds for the whole session.
24. As a consumer running zoneless, I want closing on navigation to update every view that reads the panel's state, so that the shell's opener renders its closed state (standing ruling 43).
25. As a consumer using SSR, I want the server render to be unaffected, so that a panel I ship open in server HTML stays open there.
26. As a consumer using prerendering, I want the same behaviour as SSR, so that a static build hydrates the same way.
27. As a consumer with JavaScript off, I want a link inside an open panel to do a normal page load that shows the panel closed, so that nothing is stuck (ADR 0011, the JavaScript-off note).
28. As a consumer using incremental hydration, I want to know that a panel inside a block that has not hydrated yet is not closed by navigation, so that I put shell panels in hydrated regions.
29. As a consumer using `hydrate never`, I want the docs to state that its panels never close on navigation, so that I do not rely on it there.
30. As a consumer using `withI18nSupport()`, I want this function to behave the same, so that localised builds need nothing extra.
31. As a consumer using event replay, I want a link clicked before hydration to close the panel once it navigates, as a live click would.
32. As a consumer with `withEnabledBlockingInitialNavigation()`, I want the same behaviour as with the default, so that my router setup does not change the panels.
33. As a consumer, I want this behaviour listed in the accessibility and parity ledger, so that I know it is the package's and not Yeti's (standing ruling 36; A11Y-15).
34. As a consumer who knows Angular Material, I want to know how this differs from CDK Dialog's `closeOnNavigation`, so that I can predict it.
35. As an item spec author, I want one function with a two-argument signature, so that `dialog`, `dropdown`, and `nav` integrate it in one line each.
36. As an item spec author, I want the function to own no focus logic, so that each item keeps its own focus-return path.
37. As an item spec author adding a new top-layer panel later, I want to use the same function, so that every panel closes the same way (ADR 0041 point 5).
38. As a package maintainer, I want the function tested in a browser-level test with a mocked location, so that its logic is checked without a full application.
39. As a package maintainer, I want an e2e test in three engines that opens a shell panel, navigates, and checks it closed with focus on the opener, so that the measured failure stays fixed.
40. As a package maintainer, I want an e2e test that opens a shell panel before hydration and checks it survives start-up, so that the hydration risk in ADR 0041's note is measured.
41. As a package maintainer, I want an SSR smoke test showing the server render does not close a panel shipped open, so that no DOM call runs on the server.
42. As a package maintainer, I want the function free of any platform check, so that it complies with the hydration constraints by construction.

## Implementation Decisions

### Yeti contract

None. Yeti has no router and no navigation behaviour; no item's manifest entry, attribute, marker, Event, or Token belongs to this spec (ADR 0041, ledger A11Y-15 "What Yeti does": "Nothing: Yeti has no router"). The panels it closes are Yeti's `dialog`, `dropdown`, and `nav` parts, whose contracts are their own specs'.

### Contract mapping

This spec maps no Yeti class, attribute, marker, Event, or Token. Its contract is the function and what it injects:

| Name | Kind | Type | Record |
| --- | --- | --- | --- |
| `injectCloseOnNavigation` | injection-context function, entry point `ngx-yeti/navigation-close` | takes `isOpen` and `close`, returns nothing (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)) | ADR 0041 point 1; building-blocks row 50 |
| `isOpen` | argument | `Signal<boolean>`: the item's open state, read once from the element at creation and then following `toggle` or `close` (the map's open-state ruling) | ADR 0041 point 1 |
| `close` | argument | a function of no arguments returning nothing: the item's own close path (`dialog.close()`, `hidePopover()`) | ADR 0041 points 1 and 4 |
| `Router` | injected, `{optional: true}` | `@angular/router` `Router`; absent means the function does nothing | ADR 0041 point 2 |
| `DestroyRef` | injected | removes the subscription on destroy | ADR 0041 point 1; building-blocks 1.9 |
| Injection tokens | none | the function provides and reads no Injection token | ADR 0041 point 3 |
| Defaults token | none | no option exists to default (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)) | building-blocks 1.4 |

### Module replaced

None: Yeti has no module for this ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md): the single-page-application behaviour the modules lack is the package's).

### Hierarchy and DI shape

- One function, no class, no service, no registry, no Injection token (ADR 0041 point 3; building-blocks 1.5 and Part 3: a service only for state shared across instances, and none is shared here).
- It must be called in an injection context: the constructor or a field initialiser of the item directive. It injects `Router` optionally and `DestroyRef`.
- `@angular/router` is an optional peer dependency of the package (ADR 0041 point 2). The entry point imports `Router` and `NavigationStart`; a consumer who never imports a `dialog`, `dropdown`, or `nav` entry point never loads it (inferred from ADR 0011 clause 10's one entry point per item).
- No generated ids, no relationship attributes, and no host bindings: the function renders nothing.

### API

`injectCloseOnNavigation(isOpen, close)`:

1. If no `Router` is injected, return at once; nothing is subscribed (ADR 0041 point 2).
2. Follow `isOpen()`. While it is true, subscribe to `Router.events` filtered to `NavigationStart`; when it turns false, unsubscribe (ADR 0041 point 1). The follower is an `effect` created in the caller's injection context whose cleanup unsubscribes (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)). The effect body only subscribes and unsubscribes; it writes no DOM and copies no signal (building-blocks 1.5). `close()` runs in the subscription's callback, never in the effect body.
3. On the first `NavigationStart` that the function does not ignore, call `close()` once and stop listening; listen again only after `isOpen()` has turned false and then true. This is ADR 0041 point 1's "calls `close()` on the first one", read so that a redirect's second `NavigationStart`, arriving before the item's asynchronous `toggle` or `close` event has turned `isOpen()` false, does not call `close()` a second time.
4. Ignore every `NavigationStart` that arrives while `Router.navigated` is false (`packages/router/src/router.ts:136`, public: "True if at least one navigation event has occurred"; set on `NavigationEnd`, and on a `NavigationCancel` that is neither a redirect nor superseded, `router.ts:195-211`; read at `5db6fc4453`). This is the application's initial navigation and every redirect in it (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).
5. On `DestroyRef.onDestroy`, unsubscribe (ADR 0041 point 1; building-blocks 1.9). The effect's own cleanup covers it; the record names `DestroyRef` and the function honours it.
6. No options, no return value, no `exportAs` (the function is not a directive), no outputs. A consumer opt-out, as Material's `closeOnNavigation: false`, is not part of this function (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).

What each consuming item passes (building-blocks rows 31, 32, 34):

| Item | `isOpen` | `close` | Focus return |
| --- | --- | --- | --- |
| `dialog` | the `isOpen` model, read once at creation and following the `dialog`'s `toggle` event ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 147; ADR 0021 2026-10-03 note) | `close()` on the native `dialog` | the dialog's own `close` handler focuses the opener recorded from the `command` event (ADR 0021 point 2; ADR 0043 point 3) |
| `dropdown` | the `isOpen` model from the panel's `toggle` | `hidePopover()` on the panel | the dropdown spec measures whether `hidePopover()` restores focus and adds `focus()` on the opener if not (ADR 0041 point 4) |
| `nav` | the `isOpen` model from the list's `toggle` | `hidePopover()` on the list | as `dropdown` |

### Material comparison

| Aspect | CDK and Material Dialog | ngx-yeti navigation-close |
| --- | --- | --- |
| Name and default | `closeOnNavigation`, default `true` (`src/cdk/dialog/dialog-config.ts:148`, read at `708d4c6e2`) | always on for `dialog`, `dropdown`, `nav`; no option (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)) |
| What counts as navigation | `Location.subscribe`, through the overlay's `disposeOnNavigation` (`dialog.ts:221`; `src/cdk/overlay/overlay-ref.ts:193-194`): history `popstate` only; the config's own comment says it "does not apply to navigation via anchor element unless using URL-hash based routing" | every Router `NavigationStart`: `routerLink`, `router.navigate`, and history navigation through the Router |
| What it closes | the CDK overlay | the consumer's own native `dialog` or `popover` element, through the item's close path |
| Focus | CDK's focus restoration | the item's own path (ADR 0041 point 4) |
| Without a router | `Location` is still there | nothing happens; the router is not installed |

The difference in coverage is read from source, not measured. The ledger row cites CDK parity; this table states how far it goes.

### Implementation level and primitives

Custom Angular, level 4, over `@angular/router` (building-blocks row 50; counts in Part 2). The platform has no navigation-aware closing for a single-page application's Router (level 1); `@angular/aria` has none (level 2); CDK's `closeOnNavigation` belongs to its overlays, which these panels are not (ADR 0041, rejected option three; building-blocks 1.8), so level 3 does not apply. Primitives: `Router.events` and `NavigationStart` (`packages/router/src/events.ts:91`), `Router.navigated` (`router.ts:136`), `DestroyRef`, `effect`, read at `5db6fc4453`.

### ARIA and keyboard

The function sets no role, state, or key. What it changes for assistive technology comes from the item's close path:

- a modal dialog closed by navigation removes the page's inertness, so the new route is reachable;
- focus returns to the opener through the item (A11Y-15; ADR 0041 point 4).

Criteria it touches: WCAG 2.2 2.4.3 Focus Order (ledger A11Y-15's source). The panels left open in ticket 20 also bear on 2.4.11 Focus Not Obscured (Minimum), the reason ADR 0016 gives for closing panels that cover the next focused control, and on 2.1.1 Keyboard while a dialog keeps the page inert (both inferred; the ledger row cites only 2.4.3).

Ledger rows: A11Y-15 (owned by this spec). This spec confirms the row; its "Tested by" column reads L1 to L4, with a note that CDK's `closeOnNavigation` reacts only to `popstate` (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).

### Rendered HTML

None. The function renders nothing and changes no attribute; the closed and open markup are the item specs'.

### Animation

None of its own. A panel closed by navigation plays whatever close transition Yeti's CSS gives it (ADR 0010). The route change and the panel's close transition can overlap; that is the item's and the consumer's.

### Item file

None: a utility without styles. Nothing is loaded through `provideYetiStyles()` ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)).

### Rendering modes

Per [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md) and building-blocks 1.11:

- **Server output:** nothing. On the server the Router runs its initial navigation and never a second one, and point 4 of the API ignores the initial one, so `close()`, a DOM call, never runs during a server render (inferred from `provide_router.ts:274-287`, read). A panel the consumer ships open stays open in server HTML.
- **Before hydration:** the platform opens panels (`commandfor` with `command`, `popovertarget`), and the function is not yet running. With the default `initialNavigation`, the Router starts the initial navigation in its bootstrap listener, after the root view hydrates (`provide_router.ts:274-287`), while each directive has already read its open state at creation (the open-state ruling). So, without point 4, the initial `NavigationStart` would close a dialog or popover the user opened before hydration (ticket 33 row 9; inferred). Point 4 ignores it (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)). With `withEnabledBlockingInitialNavigation()`, the initial navigation runs in an app initialiser, before any directive exists, so nothing can be subscribed when it starts (`provide_router.ts:400-425`, read; inferred).
- **Full hydration:** the item directives are created against the claimed DOM, read their open state, and the function starts listening if they are open; it ignores start-up navigation and closes on the user's first navigation after it.
- **Incremental hydration:** a panel inside a `@defer (hydrate on ...)` block that has not hydrated has no directive, so navigation does not close it until the block hydrates. A `routerLink` clicked inside such a block hydrates it under `hydrate on interaction` and replays the click (building-blocks 1.11), so the directive exists before the replayed navigation starts and closes the panel (inferred). The item specs document that shell panels belong in hydrated regions.
- **`hydrate never`:** the item directive is never created, so its panel never closes on navigation. The platform still opens and closes it. The item specs state this residue.
- **Client `@defer`:** the directive is created when the block renders, and the function behaves as in a client-rendered page.
- **Event replay:** the function has no listener of its own to replay. A `routerLink` click replayed after hydration starts a navigation after the Router's first navigation ended, so it closes the panel (inferred). The items' `toggle` is replayed; a dialog's `close` and `command` are not (`upstream-bugs.md` A3; ticket 33), which is why the open-state ruling reads the state at creation.
- **`withI18nSupport()`:** no template, so no effect.
- **Zoneless:** `close()` causes the platform's `toggle` or `close` event, which the item turns into a signal write, so views refresh zoneless (standing ruling 43; building-blocks 1.5). The function writes no signal itself.
- **JavaScript off, under SSR and prerendering:** there is no Router; a link inside an open panel does a document navigation, and the new page renders the panel closed. Nothing is lost that this function would provide (ADR 0011, 2026-10-03 note). A client-only application gets no promise.

### Hydration constraints

Compliant (map, Standing rulings, 2026-10-03; ticket 33 row 9 with its mitigation):

- the same DOM on the server and the client: the function renders nothing;
- no direct DOM manipulation: it calls the item's `close`, after hydration, from a Router event; never during a render and never on the server (point 4);
- valid HTML and a consistent `preserveWhitespaces`: no template;
- no output branched on the platform: it has no platform check; the server simply never sees a navigation it does not ignore;
- state set before hydration is not undone: the initial navigation is ignored, so a panel the user opened before hydration stays open (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).

### Single-page application

This spec is the single-page-application behaviour of building-blocks 1.15's second bullet. It closes on `NavigationStart`, not `NavigationEnd` (ADR 0041, rejected option four). It does nothing for `Location.go()`, a full page load, or a `location.hash` write that bypasses the Router; the fragment-links spec decides which fragment links go through the Router, and those that do close an open panel here like any navigation. A panel inside a destroyed route is closed by its removal (ticket 20, measured).

## Testing Decisions

A good test checks behaviour a consumer sees: whether the panel is open, where focus is, whether `close` was called. It does not read the function's internals. Layers per [ADR 0014](../adr/0014-testing-stack-for-yeti.md) and building-blocks 1.12; all run zoneless.

### 1. Story play functions

Story ids `navigation-close--shell-dialog` and `navigation-close--shell-dropdown`: a shell with a `dialog` and a `dropdown`, each holding a `routerLink`, rendered with the item directives, under `provideRouter` with `provideLocationMocks()` so the Storybook iframe's own URL does not change (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)). Play: open the panel, click the link, assert the panel is closed (`dialog` without `open`, the panel not `:popover-open`), assert focus is on the opener, assert the route outlet shows the new route; axe through the Story gate with the six tags. A third story, `navigation-close--no-router`, renders the same shell with no Router and asserts that clicking a plain link in an open panel leaves it to the platform.

### 2. Browser-level tests

A test-only directive that calls `injectCloseOnNavigation(isOpen, close)` with a writable signal and a counting `close`, created with `TestBed.createDirective(type, { bindings })` (map, Standing rulings, 2026-10-03; ADR 0014's note), under `provideRouter` with a few routes and `provideLocationMocks()`. Cases:

- closed: navigating calls `close` zero times;
- open after the first navigation: navigating calls `close` once;
- open, then a navigation that redirects: `close` is called once, not twice;
- closed after a call, reopened, navigate: `close` is called again;
- destroyed while open: navigating calls nothing;
- no Router provided: creation does not throw, and nothing is called;
- open at creation, then `router.initialNavigation()`: `close` is not called during the initial navigation or its redirect; after its `NavigationEnd`, the next navigation calls it (point 4);
- history navigation (`Location.back()` through the mocks) while open: `close` is called (inferred from the Router source; this case measures it);
- an initial navigation that errors, then a user navigation: records whether `close` is called (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)).

### 3. Node-level tests

`navigation-close.ssr.spec.ts` through the shared `renderServer()` helper with `provideRouter` and `withI18nSupport()` and one `i18n` text: a fixture with a shell `dialog` shipped `open` and the test directive, rendered on the server; `whenStable()` resolves, the server HTML keeps `open`, and `close` is never called. No pure-logic test: the function's logic needs a Router and is covered in layer 2.

### 4. Playwright e2e

Against the Fixture app's `navigation-close` route, prerendered and SSR builds, Chromium, Firefox, and WebKit in CI (ADR 0041, Consequences):

- open the shell dialog, click a `routerLink` inside it: the dialog is closed, the page is not inert (hit test on the new route's heading), focus is on the opener;
- the same for the shell dropdown and the shell nav below its threshold; focus as the dropdown and nav specs measure it;
- with a panel open, Back: the panel closes;
- **the pre-hydration case** (ADR 0041's 2026-10-03 note; ticket 33 row 9): hold back the main bundle, open the shell dialog by its opener and the shell dropdown by its toggle, release the bundle, wait for stability, assert both are still open; then click a `routerLink` and assert both close. Run it with the default initial navigation, with `withEnabledBlockingInitialNavigation()`, and with an initial route that redirects (the measurement recommended under the ticket's item 1);
- JavaScript disabled: open the dialog by its opener, follow the link, assert a document navigation and a closed dialog on the new page; axe on that page;
- a shell dialog inside `hydrate never`: record what the link does and that no directive closes it (the residue).

The Contract check has nothing to cover: this spec maps no Yeti name.

## Out of Scope

- Focus return itself: each item's close path does it (ADR 0041 point 4; ADR 0021 point 2; ADR 0043 point 3). Whether `hidePopover()` restores focus is measured by the `dropdown` and `nav` specs.
- Closing on focus-out, Escape, and outside presses: ADR 0016 and ADR 0043, owned by the item specs.
- Navigation by `Location.go()`, a full reload, or a `location.hash` write outside the Router (ADR 0041, Consequences).
- Fragment-link handling under `<base href>`: the fragment-links spec.
- A registry of open panels, a root service, and a consumer-written directive: rejected by ADR 0041.
- CDK Overlay's `disposeOnNavigation`: the panels are not overlays (ADR 0041; building-blocks 1.8).
- `deployUrl`: unsupported (map, Standing rulings).
- Any check of misuse: later milestone (map, Inherited preferences, Milestones).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| One injection-context function, `injectCloseOnNavigation(isOpen, close)`, in its own entry point | ADR 0041 point 1; building-blocks row 50 |
| Subscribes only while open; unsubscribes on close and destroy | ADR 0041 point 1; building-blocks 1.9 |
| `Router` injected optionally; `@angular/router` an optional peer | ADR 0041 point 2 |
| No service, no registry | ADR 0041 point 3; building-blocks 1.5, Part 3 |
| Focus return through the item's close path | ADR 0041 point 4; ADR 0021 point 2; ADR 0043 point 3 |
| Used by `dialog`, `dropdown`, `nav`, and through them `shell`; any later top-layer panel too | ADR 0041 point 5; building-blocks rows 20, 31, 32, 34 |
| `NavigationStart`, not `NavigationEnd` | ADR 0041, considered options |
| Open state read once at creation, never bound | the map's open-state ruling (2026-10-03); ADR 0021 note |
| Initial navigation ignored through `Router.navigated` | ADR 0041 2026-10-03 note; ticket 33 row 9 (decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)) |
| `close()` once per open | ADR 0041 point 1, "on the first one" |
| An `effect` follows `isOpen` | decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)|
| No return value, no options | decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md)|
| Ledger row A11Y-15 | standing ruling 36; ADR 0041, Consequences |

### Usage examples

- The `dialog` directive's constructor calls the function with its `isOpen` model and a closure that calls `close()` on its host `dialog`.
- The `dropdown` directive passes its `isOpen` model and a closure that calls `hidePopover()` on its panel; the `nav` directive does the same with its list.
- A consumer writes nothing: a shell like Yeti's `shell` recipe with a `nav[yetiNav]` and a `dialog[yetiDialog]` holding `routerLink`s closes them on navigation, provided the application calls `provideRouter`.
- A consumer without a Router writes the same markup and gets Yeti's behaviour.

The measured fix from ticket 20 that this function narrows to one panel (from the prototype, trimmed; it closed every open panel in the document from one application-wide subscription, which ADR 0041 replaced with one subscription per open panel):

```ts
router.events.subscribe((e) => {
  if (e instanceof NavigationStart) {
    for (const el of document.querySelectorAll<HTMLElement>(':popover-open')) {
      el.hidePopover();
    }

    for (const dialog of document.querySelectorAll<HTMLDialogElement>('dialog[open]')) {
      dialog.close();
    }
  }
});
```

### Styles

None: no item file, no always-loaded rule, no Token read or written, no Tailwind name (building-blocks 1.13).

### Single-page-application pieces it relies on

`Router.events` and `Router.navigated` only. It does not depend on the fragment-links spec, the events spec, or generated ids.

### Platform features to adopt when the browser target moves

- `closedby="any"` on `dialog` (outside Baseline 2025, ADR 0021) changes how the dialog closes on a backdrop press, not on navigation; nothing changes here.
- The Navigation API (`navigation.addEventListener('navigate')`) could catch navigations the Router does not start. Angular's experimental platform-navigation feature in `provide_router.ts` points that way; adopting either is a later record's, not this spec's (inferred; not measured).
