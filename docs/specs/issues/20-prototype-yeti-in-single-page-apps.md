# 20. Prototype: Yeti's modules in a single-page Angular app

Type: prototype
Status: resolved
Blocked by: 03
Labels: wayfinder:prototype
Map: ../map.md

## Question

[Research: Yeti's JavaScript modules and what Angular adds](03-research-yeti-javascript-and-angular.md) inferred, without running a browser, that Yeti's modules break in a single-page app:

- three modules scan the page only at load;
- `#id` links resolve against `<base href>`;
- a popover stays open across a `routerLink` navigation.

Is that true in a running app? And how could the package resolve each failure?

## User instruction, 2026-10-01

The user's own message to the orchestrator, verbatim, replying to that finding:

> 25. Verify in a prototype then consider how this could be resolved by ngx-yeti.

## How to work it

Build an Angular 22.2 app with the router under `D:/tmp/`, with Yeti at `f52d1e8b9` and its modules loaded as Yeti documents. Set `<base href>` to a subpath, because the user ruled that only `baseHref` is supported, not `deployUrl` (map, Standing rulings). Measure each inferred failure in Chromium, Firefox, and WebKit, plus any others found:

- elements added after load, by a route change, `@if`, or `@defer`;
- fragment links;
- open popovers and dialogs across navigation;
- listeners left behind after a route is destroyed.

For each failure, try the package's candidate resolutions, such as:

- a directive that owns the behaviour in place of the module;
- re-running the module's setup on the element;
- router-aware cleanup;
- fragment-link handling through the router.

Capture under `prototypes/yeti-spa/`, and append an `## Answer` with a verdict per failure and per resolution. Decide nothing.

## Answer

Resolved 2026-10-01 by Claude Opus 5.5. Capture: [prototypes/yeti-spa/](../prototypes/yeti-spa/README.md). Measured in Chromium 153, Firefox 155, and WebKit 26.6 against a production build under `<base href="/sub/">`; all three agree. Decides nothing.

- Load-once modules: confirmed, and wider than inferred. Loaded as the install guide says, the modules run before Angular bootstraps, so `tabs.js`, `toc.js`, `enter.js` miss even the first route, as well as route changes, `@if`, and `@defer`. `tabs.js`'s delegated click and arrow keys still work after the first click, but until then no tab is selected and every panel shows.
- Fragment links: confirmed. A bare `href="#id"` on `/sub/tabs` reloads the document to `/sub/#id` and lands on the root route. Path-written hrefs (`tabs#id`) and `routerLink` with `fragment` do not reload, but `toc.js` and `carousel.js` select only `a[href^="#"]`, and `routerLink` fires no `hashchange`, so `tabs.js` does not reveal the target's tab.
- Popovers: confirmed for popovers in the persistent shell, refuted for popovers inside a destroyed route (removal closes them). New: a shell modal dialog with a `routerLink` stays open over the new route and leaves the page inert.
- Listeners: Yeti as loaded leaves none behind (Chromium CDP counts are fixed across six navigations). `alert.js` removing a node inside `@if` caused no error.
- Rerun (re-import with a fresh query after each render) fixes the routed cases. Its cost: each run adds document `click`/`keydown` and window `hashchange` listeners, so one tab click fires N+1 `yeti:select`. It also needs the modules served unbundled.
- Owner directives (150 lines here) fix initial state and clean up their observers. They must `preventDefault` to keep `tabs.js` out, and `tabs.js`'s global hash reveal still changes owned tabs behind the directive's state.
- Router-aware cleanup on `NavigationStart` (about 15 lines) closes the popover and dialog, with focus back on the opener. A `#id` click interceptor using `location.hash` fixes reloads and keeps `tabs.js` reveal and `toc.js` working. The same interceptor through `router.navigate` fixes reloads but loses the reveal.
