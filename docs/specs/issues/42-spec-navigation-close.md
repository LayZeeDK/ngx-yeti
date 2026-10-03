# 42. Spec: Navigation close (shared spec)

Type: task
Status: resolved
Blocked by: 25, 33
Labels: wayfinder:task
Map: ../map.md

## Question

What is the API and behaviour of the shared navigation-close utility, and what does its spec say? It follows [ADR 0041](../adr/0041-closing-on-navigation-is-a-per-instance-subscription.md), with its 2026-10-03 note: whether the first `NavigationStart` closes a panel the user opened before hydration is measured and handled.

## How to work it

Write `specs/navigation-close.md` with the `/to-spec` template and the map's Spec shape note, from the records only: the map's Standing rulings and Inherited preferences, the ADRs, `building-blocks.md`, `architecture-guide.md`, `ledger.md`, `upstream-bugs.md`, and `CONTEXT.md`. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

### Open

1. **The initial navigation (ADR 0041's 2026-10-03 note; ticket 33 row 9).** The spec's reading: `injectCloseOnNavigation` ignores every `NavigationStart` that arrives while the public `Router.navigated` is false (`packages/router/src/router.ts:136`, set at `:195-211`, read at `5db6fc4453`), so the initial navigation and its redirects never close a panel. With the default `initialNavigation`, the Router starts that navigation in its bootstrap listener after the root view hydrates (`provide_router.ts:274-287`), while each directive has already read its open state at creation under the open-state ruling, so without the skip a dialog or popover opened before hydration would close (inferred). The same skip keeps `close()`, a DOM call, off the server. Residue: an initial navigation that ends in `NavigationError` leaves `navigated` false, so later `NavigationStart`s are skipped until one completes. **Recommendation:** adopt the `Router.navigated` skip now, and measure in the spec's e2e layer, in three engines against the SSR and the prerendered Fixture app: hold back the main bundle, open the shell dialog and the shell dropdown, release the bundle, assert both still open; then a `routerLink` closes both. Run it with the default initial navigation, with `withEnabledBlockingInitialNavigation()`, and with a redirecting initial route, each with the skip on and off, so the risk and the fix are both measured. Accept the `NavigationError` residue and document it. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).
2. **How the function follows `isOpen`.** ADR 0041 says it subscribes while `isOpen()` is true but not with what. The spec's reading: an `effect` in the caller's injection context that subscribes when `isOpen()` is true and unsubscribes in its cleanup; `close()` runs in the subscription callback, never the effect body (building-blocks 1.5's limits on `effect` hold). **Recommendation:** adopt it. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).
3. **Return type.** No record names one. The spec's reading: it returns nothing. **Recommendation:** adopt it; nothing in ADR 0041 needs a handle. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).
4. **A consumer opt-out** (Material parity: CDK Dialog's `closeOnNavigation: false`). No record offers one; ADR 0041 rejected only a consumer opt-in directive. The spec's reading: the function has no options and no Defaults token. **Recommendation:** no option in the first milestone; if an item spec later needs one, it passes a gated `isOpen` (open state and its own boolean input) so the function stays unchanged. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).
5. **Ledger row A11Y-15's "Tested by" column** says L4 only; the spec tests the function in L1, L2, L3, and L4. The spec also notes that CDK's `closeOnNavigation` covers only `Location` (`popstate`) changes (`dialog-config.ts:143-148`, `overlay-ref.ts:193-194`, read at `708d4c6e2`), so the row's "parity" is partial. **Recommendation:** the orchestrator updates the row's "Tested by" to L1, L2, L3, L4 and adds the coverage note; writers edit only their own files. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).
6. **Router in stories.** The spec's reading: the layer 1 stories provide the Router with `provideLocationMocks()` so the Storybook iframe's own URL does not change (inferred need, not measured). **Recommendation:** adopt it, and fall back to `withHashLocation()` if the mocks do not work under `@storybook/angular-vite`. Decided 2026-10-03 in ticket 50 (orchestrator, full AFK mode).

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/navigation-close.md](../specs/navigation-close.md).

42 user stories; 6 open points, listed under `### Open` above, each with a recommendation. None blocks the spec: point 1 is the first-navigation question ADR 0041's note left open, written as the spec's best reading (ignore every `NavigationStart` while `Router.navigated` is false) with the e2e measurement that confirms it.
