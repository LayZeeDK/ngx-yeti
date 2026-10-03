# Prototype: Yeti under SSR, hydration, `@defer`, event replay, i18n, and `animate.*`

Ticket: [18. Prototype: Yeti under SSR, hydration, `@defer`, event replay, and `animate.enter` and `animate.leave`](../../issues/18-prototype-yeti-rendering-modes.md). Built and measured 2026-10-01 by Claude Opus 5.5. **Throwaway code.** Nothing here is decided.

## Question

How do Yeti's markup, CSS, and optional modules behave in an Angular 22.2 application under server-side rendering and prerendering, full and incremental hydration, event replay, `@defer` and its triggers, `animate.enter` and `animate.leave`, zoneless change detection, and (added by the user) `provideClientHydration()` with and without `withEventReplay()`, incremental hydration, and `withI18nSupport()`? Where does the package have to step in?

## What was built

- **Workspace** at `D:/tmp/ngx-yeti-18/ws`: `create-nx-workspace@23.2.1 --preset=angular-standalone --ssr` (run with `CLAUDECODE` unset). The preset pinned Angular `~22.1.0`; every `@angular/*` package was raised to `~22.2.0` (installed: `@angular/core` 22.2.1, `@angular/build` 22.2.1, `@angular/ssr` 22.2.1, `@angular/localize` 22.2.1), Nx 23.2.1, TypeScript 6.0.3, zone.js 0.16.3 for one mode only. Production builds (`outputHashing: all`, Beasties on, `outputMode: server`).
- **Yeti** at `f52d1e8b9` (`7.0.0-alpha.0`), exported with `git archive` to `D:/tmp/ngx-yeti-18/yeti`, built with `npm run build`, installed from its `npm pack` tarball. The clone was not touched.
- **How Yeti is loaded:** `src/styles.css` is Yeti's own `@import` list in its order, every file but `badge.css` ([`workspace/tools/gen-styles.mjs`](workspace/tools/gen-styles.mjs)). `badge.css` comes through a component `styleUrl` with `ViewEncapsulation.None` (ticket 04's S1 shape), for the style-guard test. All ten modules load as Yeti documents them, `<script type="module" src="yeti/yeti.js">` in `index.html`, ahead of Angular's `main.js`.
- **Items** (Yeti's own markup): card, grid layout, dialog with invoker commands, dropdown with `popover`, accordion with `<details>`, tabs (`tabs.js`), carousel (`carousel.js`), the enter utility (`enter.js`), alert (`alert.js`), badge. Pages: `/` (every item plus Angular listeners), `/pre` (the same page, prerendered), `/defer` (every trigger), `/anim`, `/guard`, `/i18n` (card, dialog title, and tab labels marked `i18n`, with an ICU plural and an element inside one message). Source: [`workspace/src/app/`](workspace/src/app/).
- **Modes**, one build configuration each ([`workspace/tools/gen-project.mjs`](workspace/tools/gen-project.mjs), provider files in [`workspace/src/app/mode/`](workspace/src/app/mode/)):

| Mode | Providers | Notes |
| --- | --- | --- |
| `none` | no `provideClientHydration()` | SSR, then a client render that replaces the server DOM |
| `noreplay` | `provideClientHydration(withNoIncrementalHydration())` | full hydration only |
| `replay` | `provideClientHydration(withNoIncrementalHydration(), withEventReplay())` | full hydration plus replay |
| `plain` | `provideClientHydration()` | in 22.2 this already includes incremental hydration, and through it event replay (read: `platform-browser/src/hydration.ts`, `core/src/hydration/api.ts:343-345`) |
| `explicit` | `provideClientHydration(withEventReplay(), withIncrementalHydration())` | the pre-22 spelling; `withIncrementalHydration()` is deprecated in 22 |
| `zone` | as `plain`, plus `provideZoneChangeDetection()` and the `zone.js` polyfill | every other mode is zoneless (22's default) |
| `i18n-off` | as `plain`, built with `localize: ["da"]` | Danish targets in [`messages.da.xlf`](workspace/src/locale/messages.da.xlf) |
| `i18n-on` | `provideClientHydration(withI18nSupport())`, `localize: ["da"]` | |

- **Browsers:** Playwright 1.63.0, headless, 1280x900: Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6. All three are newer than Yeti's Baseline 2025 floor that ticket 01 computed (Chrome and Edge 141, Firefox 145, Safari 26.2). The floor versions themselves were not run.

## How to run

```sh
cd D:/tmp/ngx-yeti-18/ws
node tools/gen-styles.mjs && node tools/gen-project.mjs   # already applied
npx nx run ws:extract-i18n && node tools/gen-da.mjs        # messages.da.xlf
for m in plain none noreplay replay explicit zone i18n-off i18n-on; do npx nx run ws:build:$m; done
node tools/measure.mjs            # every mode x three engines, about 22 minutes; writes results/<mode>.json
node tools/report.mjs             # results/report.md
node tools/alert-check.mjs        # the alert.js duration reading
```

`measure.mjs` starts each mode's built server itself (`node dist/<mode>/server/server.mjs`, `PORT=4518`, `NG_ALLOWED_HOSTS=localhost`; the host-and-port form `localhost:4518` was rejected with a 400). "Before hydration" holds `main-*.js` back with `page.route` while Playwright clicks and types, then releases it. An init script records DOM removals, attribute changes with old values, and `animationstart` from before the first parse.

## Results

The full tables, per mode and engine, are in [results/report.md](results/report.md); raw data in `results/<mode>.json`. **Chromium, Firefox, and WebKit agreed on every row except two timing races, marked below.** "Measured" means the row came from this run; "read" means from source.

### Verdict per mode and item

| Mode | card, grid | dialog (invoker) | dropdown (popover) | accordion (details) | tabs (tabs.js) | carousel (carousel.js) | enter (enter.js) | alert (alert.js) | badge (`styleUrl`) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SSR, JavaScript off | pass | pass: opens, Escape closes | pass | pass | all panels shown (Yeti's no-script state) | dots follow the fragment (`/#work-2`) | element visible, no arrival | close does nothing (documented) | styled from the server `<style>` |
| Prerender (`/pre`) | pass, same HTML as SSR, `ng-server-context="ssg"`, 0 removals at hydration | same as SSR | same | same | same | same | same | same | same |
| No hydration (`none`) | re-rendered | **fails:** a dialog left open before `main.js` is closed | **fails:** open popover closed | **fails:** opened `details` closed | **fails:** tabs.js state wiped, every panel shown | works (delegated) | WebKit replayed the arrival (2 starts) | works | styles kept |
| Full hydration, no replay (`noreplay`) | pass, 0 removals | pass, open state kept | pass | pass for plain `details` | pass, state kept | pass | **fails:** see static attributes | works | pass |
| Event replay (`replay`, `plain`, `explicit`, `zone`) | pass | pass; an early Escape close is not replayed to `(close)` | pass; early `(toggle)` replayed (3 of 3) | pass; early `(toggle)` replayed | pass | pass | as above | works | pass |
| Static attributes at hydration (every hydrating mode) | - | - | - | **fails:** a template's static `open` is put back after the user closed it | **fails:** a template's static `aria-selected="true"` is put back, two tabs selected | - | **fails:** `data-once` is put back, so the arrival never plays (a race) | - | - |
| `[open]` bound to a signal | - | - | - | **fails:** an `details` the user opened before hydration is closed again | - | - | - | - | - |
| Client-only `@defer (on ...)` | not in the probe (ticket 04 measured a badge styled on insert) | pass, native | not tested inside a block | not tested inside a block | **fails:** tabs.js never sees the block's tabs | delegated, not tested inside a block | `.enter[data-once]` inserted later never arrives | - | - |
| Incremental `@defer (hydrate on ...)` | not in the probe; the block is server-rendered | pass, works while dehydrated | - | - | pass, tabs.js runs on the server DOM | - | - | - | - |
| `hydrate never` | not in the probe; the block is server-rendered and inert to Angular | pass, native | - | - | pass, tabs.js runs | - | - | - | **fails:** loses its styles when the last live badge goes |
| `hydrate` triggers with incremental hydration off | server renders the placeholder instead, then a client render on idle | | | | tabs.js misses the block | | | | |
| i18n without `withI18nSupport()` (`i18n-off`, and every non-i18n mode on `/i18n`) | translated, but the component is `ngSkipHydration` and re-rendered | the re-render closes any early-opened state | | | **fails:** tabs.js state wiped | | | | |
| i18n with `withI18nSupport()` (`i18n-on`) | pass, translated, hydrated (0 removals), early click replayed | pass | | | pass | | | | |
| `animate.enter` / `animate.leave` | - | pass: a leave class reuses Yeti's own 150 ms transition, removed after 153-192 ms; inserted open, Yeti's `@starting-style` plays | - | - | - | - | pass: `animate.enter="enter"` plays `yeti-enter-fade`, class removed after | alert.js may remove an `@if`-owned alert: no error, Angular later hides and shows it cleanly | - |
| Leave-animation style guard | - | - | - | - | - | - | - | - | class-form `animate.leave` on the page: no leak; **a function-form `(animate.leave)` anywhere: badge.css never removed** |
| Zoneless (every mode but `zone`) | pass | pass | pass | pass | pass | `yeti:slide` written to a plain field: view not refreshed | - | - | - |

### Key measurements

- **Server HTML (measured, all modes):** `ngh` on the root and page hosts; the event contract and `jsaction` attributes appear only when replay is on, listing `click`, `input`, and capture-phase `toggle` for the home page. `dialog`'s `close` is not in the list, so an early close never reaches `(close)` (0 in every mode).
- **Replay (measured):** with replay, two early clicks on an Angular button became `Clicked 2`, typed `abc` reached the `(input)` mirror, and the early `details` and popover `toggle` events ran their handlers. Without replay (`noreplay`), the native state survived but Angular saw none of it (`Clicked 0`, empty mirror). `none` lost both.
- **Static attributes are re-applied at hydration (measured, read).** `elementLikeStartShared` calls `setupStaticAttributes` for every hydrated element (`core/src/render3/instructions/shared.ts:596-599`, `dom_node_manipulation.ts:141-155`). Every static attribute of every hydrated element is written again. Values that Yeti's modules or the user changed before hydration are put back: `data-once` (enter.js removes it, hydration adds it back, the arrival never plays), a static `aria-selected="true"` (two selected tabs after the user picked the second), a static `open` (the `details` reopens). Attributes the template does not name (tabs.js's `aria-selected`, `tabindex`, `hidden` on Yeti's plain example markup) survive.
- **The `data-once` race (measured, varies):** for the server-rendered `.enter[data-once]`, whether enter.js removes the attribute before or after hydration differs between runs and engines (see "server `.enter[data-once]`" in the report). Before, hydration puts it back and the element never arrives. After, the arrival plays. In the run with `main.js` held back, it was put back every time.
- **i18n (measured, read):** a component whose template has an `i18n` block and runs without `withI18nSupport()` is serialised with `ngskiphydration` (`core/src/hydration/annotate.ts:205-211`), even in a source-locale build. Its `<main>` was removed and rebuilt, tabs.js's state was lost, and an early click was not replayed even with replay on. With `withI18nSupport()`: 0 removals, Danish text intact (`Weekend i bakkerne`, the ICU plural `3 udsigter`), early click replayed.
- **`@defer` (measured):** `on immediate`, `idle`, `timer`, `when`, `interaction`, `hover`, and `viewport` all inserted their content on the client, styled, with native invokers working. Their tabs stayed uninitialised (no `aria-selected`, every panel shown), because tabs.js scans once at load. Every `hydrate on ...` block was server-rendered, styled, and set up by tabs.js. It stayed dehydrated until its trigger (`immediate`, `idle`, and `timer` before the read; `when`, `interaction`, `hover`, and `viewport` after). `hydrate on interaction` replayed the triggering click (`clicks=1`). `hydrate never` never hydrated: its Angular button did nothing, its native dialog opened. With `withNoIncrementalHydration()`, the server rendered the placeholder for every `hydrate` block.
- **Dehydrated styles (measured):** the `hydrate never` badge is not counted by `SharedStylesHost`. Hiding the only live badge removed badge.css, and the dehydrated badge's padding went from 8.64px to 0 in all three engines. Where incremental hydration is off, the block renders as a live instance and keeps the count.
- **Leave guard (measured, read):** a function-form `(animate.leave)` registers its view in `allLeavingAnimations` at creation (`core/src/render3/instructions/animation.ts:416`), so while one is on the page no `None`-encapsulated component's styles are removed (G2: badge `<style>` stayed). A class-form `animate.leave` registers only while leaving (`animation.ts:288`). A permanent one did not leak (G1), and a badge removed together with a leaving sibling did not leak (G3).
- **Motion (measured):** `animate.leave` with a class that sets `opacity: 0` started Yeti's own dialog transition, and Angular waited for it. `animate.enter="enter"` used Yeti's enter utility as the enter class. A static `.enter` inserted by `@if` animated by itself. A `.enter[data-once]` inserted after load stayed visible with no animation.
- **alert.js and hover.js read a minified token (measured, read):** Angular's production CSS (and Yeti's own `yeti.min.css`) writes `--yeti-duration-fast: 150ms` as `.15s`, so `alert.js:12`'s `parseFloat` gives 0.15 and the fade lasts 0.15 ms ([results/alert-check.txt](results/alert-check.txt): token `.15s`, `animate()` called with `duration: 0.15`; in the anim run the alert was gone 11-53 ms after the click, against 305-339 ms for a 300 ms `animate.leave`). `hover.js:33` reads `--yeti-dropdown-open-delay`/`-close-delay` the same way, and they become `.1s` and `.2s` in the built CSS. That those delays shrink to 0.1 and 0.2 ms is inferred; hover was not run.
- **Zoneless (measured):** `(document:yeti:select)` as a host listener compiles and updates the view (this checks ticket 03's inference). A `yeti:slide` listener added with `addEventListener` that writes a plain field in an Eager component under an Eager root: zoneless, the view was not refreshed (`1/0`); under zone.js it was (`1/1`; the listener ran in the `angular` zone, [`tools/zone-check.mjs`](workspace/tools/zone-check.mjs)). The same write in an OnPush component refreshed in neither. Angular 22 makes components OnPush by default (`ChangeDetectionStrategy.Default` is now `Eager`, read: `core/src/change_detection/constants.ts:25-42`). The first two probe placements (under the OnPush page, then under the then-OnPush root) hid the difference, which is why the root is Eager in this workspace.

## Verdict (decides nothing)

- **Yeti's CSS and markup survive every server mode unchanged.** With JavaScript off and with any hydration, the native items (dialog by invoker commands, dropdown by `popover`, accordion by `details`, carousel by fragment links) work before and without Angular in all three engines. That confirms ticket 03's hypothesis that rendering `commandfor` and `popovertarget` beats click handlers for SSR.
- **Where the package has to step in, measured:**
  1. State a user or a Yeti module can change before hydration must not be a static template attribute: `open`, `aria-selected`, `hidden`, `data-once`. A `[open]` property binding also resets it. Owning that state in Angular (bound, and read back from `toggle` and the rest) or leaving it out of the template are the measured options.
  2. Load-once modules (`tabs.js`, `enter.js`, and by ticket 03's reading `toc.js`) miss everything Angular renders after load: client `@defer`, `@if`, and the re-render of `none` or an `ngSkipHydration` component.
  3. A package that marks text for i18n needs consumers on `withI18nSupport()`, or every such component is re-rendered destructively.
  4. Per-component styles under `hydrate never` (and, by ticket 04's reading, any dehydrated block) are unloaded beneath their dehydrated users.
  5. Any `(animate.leave)` function listener keeps every `None` component's styles loaded.
  6. `dialog` `close` is not replayable; an early close needs reading from the DOM after hydration.
  7. `yeti:*` listeners that write plain fields do not refresh zoneless views; signals do.
  8. `alert.js` and `hover.js` misread their duration tokens in any minified build. That is Yeti's bug, and also Angular's production output.
- **Not a problem, measured:** prerender versus SSR; `explicit` versus `plain`; zone versus zoneless for everything but plain-field writes; `animate.enter`/`animate.leave` alongside Yeti's own transitions and enter utility; alert.js removing an Angular-owned node.

## Unknowns

- The Baseline 2025 floor browsers (Chrome 141, Firefox 145, Safari 26.2) were not run; Playwright 1.63.0 ships Chromium 153, Firefox 155, WebKit 26.6 only.
- WebKit's `page.hover` timed out on the `on hover` placeholder (a `<p>`) in every mode, yet the block still went live (some later pointer movement triggered it). The cause was not investigated.
- `hover.js` timing, `toc.js`, `validate.js`, `range.js`, and the dropdown inside a `@defer` block were not exercised. Router navigation is ticket 20's.
- Dehydrated instances inside `hydrate on ...` blocks were not checked for the style count. Only `hydrate never` was.
- Whether `animate.leave` on a modal (top-layer) dialog behaves the same as on the non-modal one measured here.
- The `data-once` race depends on `IntersectionObserver` timing against hydration; no run controlled it.
