# 18. Prototype: Yeti under SSR, hydration, `@defer`, event replay, and `animate.enter` and `animate.leave`

Type: prototype
Status: resolved
Blocked by: 03
Labels: wayfinder:prototype
Map: ../map.md

## Question

How do Yeti's markup, CSS, and optional modules behave in an Angular 22.2 application under each of these, and where does the package have to step in?

- server-side rendering and prerendering;
- full and incremental hydration;
- event replay;
- `@defer` with its triggers;
- `animate.enter` and `animate.leave`;
- zoneless change detection.

## User instruction, 2026-10-01

The user's own message to the orchestrator, verbatim:

> 23. We should also evaluate Yeti compatibility with SSR, hydration, animate.leave/enter, @defer, and so on.

The user added, verbatim:

> We must not forget about support for `withEventReplay()`, `provideClientHydration()`, [incremental hydration](https://angular.dev/guide/incremental-hydration), and `withI18nSupport()`.

So the prototype measures each of these providers explicitly. That means `provideClientHydration()` with and without `withEventReplay()`, `withIncrementalHydration()` with its `hydrate on ...` triggers, and `withI18nSupport()` with a translated build (`$localize`) of at least one item that carries text.

## How to work it

Build an Nx 23.2 / Angular 22.2 SSR workspace under `D:/tmp/` with Yeti at `f52d1e8b9`. Render one item of each kind:

- a stateless component (card);
- a native-platform interactive one (dialog with invoker commands, dropdown with `popover`, accordion with `<details>`);
- a module-driven one (tabs, carousel);
- a layout.

Measure in Chromium, Firefox, and WebKit against a production SSR build:

- server HTML with JavaScript off;
- hydration mismatches and mutations;
- what a user can do before hydration, and which events replay;
- each `@defer` trigger, including `hydrate never`;
- whether `animate.enter` and `animate.leave` play with Yeti's own transitions, and Yeti's enter utility;
- the leave-animation style guard (angular/angular#66244) with Yeti's CSS.

Capture under `prototypes/yeti-rendering-modes/`, and append an `## Answer` with a verdict per mode and item. Decide nothing.

## Answer

Resolved 2026-10-01 by Claude Opus 5.5. Capture: [prototypes/yeti-rendering-modes/](../prototypes/yeti-rendering-modes/README.md), with the full per-mode, per-engine tables in its `results/report.md`. Nx 23.2.1 workspace with Angular 22.2.1 and Yeti `f52d1e8b9` at `D:/tmp/ngx-yeti-18/`. Eight production SSR builds were measured in Chromium 153, Firefox 155, and WebKit 26.6 (Playwright 1.63.0). The three engines agreed on every row except two timing races. Decides nothing.

- **SSR and prerender (measured):** with JavaScript off, every item renders styled. The dialog opens by invoker commands, the dropdown by `popover`, the accordion by `details`, and carousel dots follow fragments. Tabs show every panel, which is Yeti's no-script state. `/pre` matched SSR (`ng-server-context="ssg"`) and hydrated with 0 removals.
- **Providers (read, then measured):** in 22.2, `provideClientHydration()` alone already includes incremental hydration, and through it event replay. "Without `withEventReplay()`" needs `withNoIncrementalHydration()`. With replay, early clicks, `input`, and the `toggle` of `details` and popovers reach Angular. Without it, native state survives and Angular sees nothing. Without hydration, the server DOM is replaced and every early-opened dialog, popover, `details`, and tabs.js selection is lost. `dialog` `close` is never replayed.
- **Static attributes (measured, read):** hydration writes every static template attribute again (`setupStaticAttributes`). A static `open` reopens a `details` the user closed. A static `aria-selected="true"` leaves two tabs selected after tabs.js moved the selection. `data-once` comes back after enter.js removed it, so the arrival never plays (a race). An `[open]` binding resets a `details` the user opened.
- **i18n (measured, read):** without `withI18nSupport()`, a component with `i18n` blocks is serialised `ngSkipHydration` and re-rendered destructively, even in a source-locale build. tabs.js's state and early clicks are lost. With it, the Danish build hydrated with 0 removals and replayed the click.
- **`@defer` (measured):** all seven client triggers insert content whose Yeti tabs tabs.js never initialises; native invokers still work. Every `hydrate on ...` block is server-rendered, set up by tabs.js, and hydrates on its trigger. `hydrate on interaction` replays the click. `hydrate never` stays inert to Angular while native features work. With incremental hydration off, `hydrate` blocks render the placeholder on the server.
- **Styles under incremental hydration (measured):** a `hydrate never` badge using `styleUrl` is not counted, and lost its styles (padding 8.64px to 0) when the last live badge left.
- **Leave guard (measured, read):** a permanent function-form `(animate.leave)` anywhere kept badge.css loaded (angular/angular#66244). Class-form `animate.leave` did not, either permanent or leaving alongside.
- **Motion (measured):** an `animate.leave` class reused Yeti's own dialog transition (removed after 153-192 ms). `animate.enter="enter"` played Yeti's enter utility. Yeti's `@starting-style` played on insertion. A `.enter[data-once]` inserted after load never arrives. alert.js removing an `@if`-owned alert caused no error.
- **Minified tokens (measured, read):** the production CSS writes `--yeti-duration-fast` as `.15s`, so `alert.js:12` fades for 0.15 ms. That `hover.js:33`'s delays shrink the same way is inferred, not run.
- **Zoneless (measured):** `(document:yeti:select)` compiles and updates the view. A plain field written from a `yeti:slide` listener refreshes under zone.js but not zoneless. Not run: the Baseline 2025 floor browsers, `toc.js`, `validate.js`, `range.js`, `hover.js` timing, and modal-dialog leave animations.
