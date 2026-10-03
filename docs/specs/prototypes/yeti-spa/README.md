# PROTOTYPE: Yeti's modules in a single-page Angular app

Throwaway. Ticket: [20. Prototype: Yeti's modules in a single-page Angular app](../../issues/20-prototype-yeti-in-single-page-apps.md). Run 2026-10-01. Decides nothing.

## Question

[Ticket 03](../../issues/03-research-yeti-javascript-and-angular.md) inferred from source, without a browser, three ways Yeti's modules break in a single-page app: `tabs.js`, `toc.js`, `enter.js` scan only at load; `#id` links resolve against `<base href>`; a popover stays open across a `routerLink` navigation. Are they true in a running app, are there others, and what does each candidate resolution cost?

## Setup

- Yeti `f52d1e8b9`, exported with `git archive` to `D:/tmp/ngx-yeti-20/yeti`, `npm ci --ignore-scripts`, `npm run build`, `npm pack`; the app installs the tarball. The clone was not touched.
- Angular CLI 22.2.1 (`ng-version="22.2.1"`), zoneless, router, no SSR, at `D:/tmp/ngx-yeti-20/spa`. Production build with `--base-href /sub/` (the map's ruling: `<base href>` only, no `deployUrl`). Served by `server.mjs` under `/sub/` with SPA fallback.
- Modules loaded as Yeti's install guide documents ("A module", `src/guides/install.md`): one `<script type="module">` per module, `tabs`, `toc`, `enter`, `hover`, `dialog`, `carousel`, `alert`, copied from `yeti-css/dist/js` as assets (`angular.json`), placed in `body`. Angular's builder appends its own `main-*.js` after them, so Yeti's modules execute first, in document order.
- Browsers through Playwright 1.63: Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6.
- Candidate resolutions switch on with `?fix=` in the first URL (`src/app/fixes.ts`); the owner directives live in `src/app/owned.ts`.

## How to run

```sh
cd D:/tmp/ngx-yeti-20/spa
MSYS_NO_PATHCONV=1 npx ng build --base-href /sub/   # Git Bash rewrites /sub/ to a Windows path without the variable
npx playwright test --timeout 45000                 # starts server.mjs on 127.0.0.1:4720
node compare.mjs                                    # side-by-side table, as in results/compare.txt
```

Files here are copies of the decisive files; `package-versions.json` lists the app's dependency ranges. Every measurement records a value rather than asserting, so `results/<browser>.json` is the raw output and `results/compare.txt` the table.

## Results (measured, all three browsers agree unless stated)

### Inferred failure 1: load-once modules miss Angular-rendered DOM. Confirmed, and wider than inferred

| Case | `tabs.js` load pass | `enter.js` (`data-once` removed) | `toc.js` (`aria-current` after scrolling) |
| --- | --- | --- | --- |
| Direct load of `/sub/tabs` (first route) | not run: no `aria-selected`, both panels shown | no | no |
| Route change `/other` to `/tabs` | not run | no | no |
| `@if` toggled on | not run | no | n/a |
| `@defer (on timer)` | not run | n/a | n/a |

- Even the first route is missed: Yeti's module scripts run before Angular bootstraps, so at their single scan the page holds only `<app-root>`.
- `tabs.js` half works: its click and keydown listeners are delegated on `document`, so the first click on a tab selects it and hides the other panel, and arrows then work. Until that click every panel is visible and no tab is selected.
- `tabs.js`'s hash reveal also runs on any tabs in the DOM at `hashchange` time, since it looks targets up then.

### Inferred failure 2: `#id` links resolve against `<base href>`. Confirmed

| Link on `/sub/tabs` | Final URL | Full reload | Route shown | Tabs reveal |
| --- | --- | --- | --- | --- |
| `href="#t-target"` | `/sub/#t-target` | yes | Home | n/a |
| toc link `href="#h1"` | `/sub/#h1` | yes | Home | n/a |
| `href="tabs#t-target"` (path written out) | `/sub/tabs#t-target` | no | Tabs | yes, panel B shown, `yeti:select` fired |
| `routerLink` `[]` with `fragment` (plus `anchorScrolling`) | `/sub/tabs#t-target` | no | Tabs | no: the router uses `pushState`, so no `hashchange` |

- Under `/sub/`, a bare `#id` is a document navigation to the app's root, which loses state and lands on another route.
- A toc whose links carry the path (`tabs#h1`) is never marked by `toc.js`, even when `toc.js` has run (measured under the rerun fix): it selects only `a[href^="#"]`. `carousel.js` uses the same selector (source, not run).

### Inferred failure 3: a popover stays open across a `routerLink` navigation. Confirmed for shell popovers; refuted for route-owned ones; also true of the dialog

- Shell dropdown (`popover`) with `routerLink`s inside: still `:popover-open` after the route changes.
- Popover inside the routed component: closed after navigation (0 open popovers), because Angular removes the element and removal hides it.
- New: shell modal dialog with a `routerLink` inside: still open after the route changes, the new route renders behind it, and the page stays inert (hit test at the new `h1` lands in the dialog).

### Other things measured

- Listeners left behind (Chromium only, through CDP `DOMDebugger.getEventListeners`): with the modules as loaded, the counts on `document` and `window` stay fixed across six navigations (`click` 4, `pointerdown` 2, `keydown` 1, `command` 1, `hashchange` 2). Yeti's delegated listeners never pile up; nothing is per route.
- `alert.js` removing a node inside an Angular `@if`: no error, and toggling the `@if` off and on brings the alert back. No conflict seen.
- Owner directive versus `tabs.js`: see R4; the module's global hash reveal still writes into tabs a directive owns.

## Candidate resolutions (measured)

| Fix | Resolves | What it costs (measured unless marked) |
| --- | --- | --- |
| R1 rerun: re-import `tabs.js`, `toc.js`, `enter.js` with a fresh `?run=N` query after each `NavigationEnd` render | failure 1 on routes: tabs selected, `data-once` removed, toc marks; a manual call fixes `@if` and `@defer` | every run adds another document `click` and `keydown` and window `hashchange` listener (click 5 to 11, keydown 2 to 8, hashchange 3 to 9 over six navigations); one tab click then fires N+1 `yeti:select` (3 after 2 runs, 7 after 6). Needs the modules served unbundled with a cache-busting URL, so Yeti's documented `site.js` bundle cannot be rerun (inferred); old observers keep the detached elements of earlier routes (inferred, not measured); `@if` and `@defer` need their own trigger |
| R4 owner directives (`nfsOwnTabs`, `nfsOwnToc`, `nfsOwnEnter`, 150 lines of TypeScript, no hash reveal and no nesting) | failure 1 everywhere the directive sits: tabs selected at render, arrows, `data-once`, toc marks; observers disconnect on destroy | duplicates module code; to keep `tabs.js` from also acting, the directive must `preventDefault` its clicks and keys (then 0 `yeti:select` from `tabs.js`). `tabs.js`'s global hash reveal still acts on the owned tabs: a `hashchange` to a target in panel B made the DOM show B and fire `yeti:select` while the directive's state stayed A. Owning tabs fully means not loading `tabs.js` |
| R2 router-aware cleanup: on `NavigationStart`, `hidePopover()` every `:popover-open` and `close()` every `dialog[open]` (about 15 lines) | failure 3 and the dialog case | none seen; `dialog.js` returns focus to the opener (`dlg-btn`) in all three browsers. Closes every open popover and dialog on every navigation, wanted or not |
| R3a interceptor, `location.hash = id`: a bubble-phase document click listener on `a[href^="#"]` after Yeti's (about 20 lines with R3b) | failure 2: no reload, route kept, scrolled; `hashchange` fires, so `tabs.js` reveal works and `toc.js` keeps its `#` selector | the query string is kept; registering after `carousel.js` so the carousel's dots are left alone is order-dependent (inferred from source, carousel not run) |
| R3b interceptor, `router.navigate([], { fragment })` | failure 2: no reload, route kept, scrolled by `anchorScrolling` | no `hashchange`, so `tabs.js` does not reveal the target's tab (0 `yeti:select`) |
| Path-written hrefs (`tabs#id`) or `routerLink` with `fragment`, no script | failure 2: no reload | the href must carry the route path; `toc.js` and `carousel.js` ignore such links; `routerLink` gives no `hashchange` |

## Verdict per item (decides nothing)

- Failure 1, load-once modules: confirmed in all three browsers, including the first route, because the modules run before Angular renders. `tabs.js` interaction recovers after the first click; initial state never does.
- Failure 2, fragment links: confirmed; a bare `#id` under `<base href="/sub/">` reloads into the root route.
- Failure 3, popovers: confirmed for popovers in persistent layout, refuted for popovers inside a destroyed route; the modal dialog shows the same failure and leaves the page inert.
- Listener leaks: refuted for Yeti as loaded; created by the rerun resolution.
- Each resolution above works for what its row says; the costs are in the table.

## Unknowns

- Hover-triggered dropdowns (`hover.js`), carousel dots, `validate.js`, and `range.js` were not exercised.
- Memory retained by old `IntersectionObserver`s after reruns was not measured.
- SSR and hydration (ticket 18) and event replay were out of scope.
- The listener counts come from Chromium only; Firefox and WebKit counts are inferred from the identical `yeti:select` counts.
- Ordering: modules loaded after Angular's first render (for example imported once from `bootstrapApplication(...).then`) would catch the first route but not later ones; not run.
Note, 2026-10-01 (audit 0002, L15): the `nfs` prefix in the directive names is a placeholder carried from the old package; the new package's prefix is open.
