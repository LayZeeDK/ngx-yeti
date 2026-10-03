---
status: accepted
---

# Closing on navigation is a subscription each open panel makes itself; `@angular/router` is an optional peer, and there is no registry service

Recorded by [Decide: the building-blocks map for every ngx-yeti item](../issues/25-decide-building-blocks-map.md). New for Yeti: no record of `.scratch/next-foundation-specs/` covers it, because Foundation's panels were never specified inside a routed application. It settles what [building-blocks.md](../building-blocks.md) 1.5 and 1.15 left to ticket 25 ("Whether this is one shared service or each item's own subscription") and what [Decide: the spec list](../issues/11-decide-spec-list.md) row 50 left open ("service or directive, router-aware").

[Prototype: Yeti's modules in a single-page Angular app](../issues/20-prototype-yeti-in-single-page-apps.md) measured, in three engines under `<base href="/sub/">`, that a popover in the persistent shell stays open after a `routerLink` inside it navigates, and that a modal dialog in the shell stays open over the new route and leaves the page inert; a panel inside a destroyed route is closed by its removal. The fix it measured was a `NavigationStart` subscription of about 15 lines that closes the panel with focus back on the opener. CDK's and Material's dialogs do the same under the name `closeOnNavigation` (`src/cdk/dialog/dialog-config.ts:148`, `dialog.ts:221`, read in the 22.2.x clone at `708d4c6e2`).

We decided:

1. **One injection-context function, `injectCloseOnNavigation(isOpen, close)`, in the navigation-close entry point.** A panel directive calls it once at construction with its open-state signal and its close method. While `isOpen()` is true, the function subscribes to `Router.events` filtered to `NavigationStart` (`packages/router/src/events.ts:91`, read at `5db6fc4453`) and calls `close()` on the first one; it unsubscribes when the panel closes and in `DestroyRef.onDestroy`. Nothing is subscribed while nothing is open.
2. **The Router is optional.** The function injects `Router` with `{optional: true}`; without one it does nothing. `@angular/router` is an optional peer dependency of the package, so a consumer with no router installs nothing extra and gets Yeti's own behaviour.
3. **No registry and no service.** Each open panel already knows it is open, from the `toggle` or `close` event it observes (ADR 0003 point 5), so there is no state shared between instances, which is the only reason a service is warranted (building-blocks 1.5).
4. **Focus returns to the opener through the item's own close path**, not through this function: the dialog's `close` handler focuses the opener recorded from the `command` event (`dialog.js:28-48`'s behaviour, [ADR 0021](0021-dialog-is-a-directive-on-the-native-dialog.md) point 2); a popover is closed with `hidePopover()`, and whether the platform restores focus on that call is inferred, not measured, so the dropdown and nav specs measure it and add a `focus()` on the opener if it does not.
5. **The items that use it** are `dialog`, `dropdown`, and `nav` (and through them `shell`); an item added later that opens a top-layer panel uses it too.

## Considered options

- **A root service holding a registry of open panels with one `NavigationStart` subscription.** Rejected: the registry would have to be kept in step with the platform's own open state, which the directives already observe per instance, and one subscription per open panel costs nothing measurable; the service would be shared state with no sharing.
- **A directive the consumer writes on the panel (`yetiCloseOnNavigation`).** Rejected: the consumer would have to remember it on every shell panel, and the measured failure is the default case, not an option.
- **CDK Overlay's `disposeOnNavigation`.** Not applicable: the panels are the consumer's `popover` and `dialog` elements, not overlays (building-blocks 1.8).
- **Closing on `NavigationEnd` instead of `NavigationStart`.** Rejected: a panel left open during navigation covers the new route's first paint, and the modal dialog keeps the page inert while the route resolves.

## Consequences

- The navigation-close spec is a function, its types, and its tests; it owns ledger row A11Y-15.
- A consumer that navigates by other means (`Location.go`, a full reload) gets no closing from this function; the spec says so.
- A panel the consumer opens by other code paths than the platform's attributes still reports its state through `toggle` or `close`, so the function sees it.
- The spec's e2e layer runs against the fixture app: open the shell panel, navigate with `routerLink`, assert that the panel is closed and focus is on the opener, in three engines.
- 2026-10-03: [Research: the decided records against Angular's hydration constraints](../issues/33-research-decided-records-against-hydration-constraints.md) rates this record at risk (inferred from the Router and event-replay sources): the application's first `NavigationStart` may close a dialog or panel the user opened before hydration. The `navigation-close` spec measures it and ignores the initial navigation if so.
