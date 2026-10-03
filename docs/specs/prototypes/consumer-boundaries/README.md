# Prototype: consumer `@boundary` and `@error` blocks around ngx-yeti, under SSR

Ticket: [37. Prototype: consumer `@boundary` and `@error` blocks around ngx-yeti, under SSR](../../issues/37-prototype-consumer-boundaries-around-ngx-yeti.md). Built and measured 2026-10-03 by Claude Opus 5.5. **Throwaway code.** It follows [Research: what `@boundary` and `@error` could add to ngx-yeti](../../research/boundary-and-error-blocks.md) (ticket 36). This file decides nothing.

Tags: **measured** (this run; Chromium, Firefox, and WebKit agree unless an engine is named), **read** (`file:line`; `NG/` is the Angular clone at `5db6fc4453`), **inferred**.

## Question

Ticket 37's six questions: the hydration path and `NG05xx` messages when the server renders the fallback; [ADR 0060](../../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)'s counted links through a swap and a `$reset()`; [ADR 0044](../../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md)'s ids and seed; `@defer (hydrate ...)`, event replay, `withI18nSupport()`, and zoneless change detection; [ADR 0011](../../adr/0011-rendering-modes-contract-for-yeti.md)'s JavaScript-off guarantee; and where a boundary catches a package directive's error.

## Setup

- **Workspace** `D:/tmp/ngx-yeti-37/app`: ticket 13's app (source and config copied, `node_modules` installed fresh, `yeti-css` copied from ticket 13's install). Angular `@angular/core` and `@angular/compiler` 22.2.1, `@angular/build` 22.2.0, `@angular/localize` 22.2.1 (added for `i18n`). `outputMode: server`, `baseHref: /sub/`, zoneless (`typeof Zone` is `undefined` in every page, measured), `provideClientHydration(withI18nSupport())`, ticket 13's `provideYetiStyles()`, and a logging `ErrorHandler` with `onViewError` ([`src/app.config.ts`](src/app.config.ts)).
- **`@boundary` compiles in 22.2.1** (measured: both builds succeed, and `ɵɵboundary*` is in the installed `@angular/core`). No newer patch was needed.
- **Package sketch** ([`src/boundary-probe.ts`](src/boundary-probe.ts), [`src/ids.ts`](src/ids.ts)): `[yetiProbeCard]` sets `class="card"` and `data-ngx-yeti-part="card"`, acquires the `card` item file in its constructor (ADR 0060 point 2), releases it on `DestroyRef`, and takes its `id` from ADR 0044's `injectYetiId()` (ticket 35's `adopt` mode with the `TransferState` seed). `[yetiProbeLabel]` and `[yetiProbeLabelled]` give an `aria-labelledby` pair. A probe-only fault token makes the card throw in its constructor, a host binding, an `effect()`, a host `(click)` listener, `afterNextRender`, or a host binding after an "arm" click (`late`).
- **Page** ([`src/page.ts`](src/page.ts)), route `<s|p>/<layout>/<where>/<phase>`. `s` routes are rendered per request; `p` routes are prerendered at build ([`src/app.routes.server.ts`](src/app.routes.server.ts)). Layouts:
  - `plain`: one `@boundary` around card A, with `@error` showing `$error.message` and a Reset button that calls `$reset()`;
  - `on`: card A inside `@defer (hydrate on interaction)` with the boundary around the `@defer`, and card B with the boundary inside a second such `@defer`;
  - `never`: the same with `hydrate never`.

  `where` is where the card throws: `none`, `server`, `client`, `both`, `reset` (the server throws, the client throws once), or `once` (the server never throws, the client throws once). Outside the boundary the page has a badge (a second item) and a label pair.
- **Builds:** a development build (`--configuration development`, so Angular's hydration checks run and log) and a production build, each serving its SSR routes and 13 prerendered routes.
- **Probe** ([`tools/probe37.mjs`](tools/probe37.mjs)), Playwright 1.63.0 headless at 1280x900, one process and one server per engine (ports 4377 to 4388, all stopped afterwards; checked: none listening). For each case it records:
  - the server HTML: item links in `<head>`, `data-t` markers, ids, references, the `ngx-yeti-ids` seed, and the server's `ErrorHandler` log;
  - JavaScript off: what shows, the links, card padding;
  - JavaScript on with every `yeti-css/` response delayed 300 ms (Playwright routing, which also turns the HTTP cache off), then again without routing for the `plain` cases: a `requestAnimationFrame` sampler counting frames in which a card computes `padding-top: 0px` (unstyled; a styled card is 18 px, as in ticket 13), link additions and removals, card and fallback DOM additions and removals, console output, and a snapshot after load, after interaction, after "arm", and after each Reset;
  - event replay: `main` and `chunk` scripts delayed 2.5 s, a click on every count or Reset button in the server HTML before any script loads (checked through Resource Timing), then the counts after hydration.
  [`tools/summarize37.mjs`](tools/summarize37.mjs) writes [`results/summary-dev.txt`](results/summary-dev.txt). [`tools/compare37.mjs`](tools/compare37.mjs) writes [`results/dev-vs-prod.txt`](results/dev-vs-prod.txt). [`results/frames.txt`](results/frames.txt) lists the unstyled-frame counts for both builds. [`tools/poison37.mjs`](tools/poison37.mjs) writes [`results/poison.txt`](results/poison.txt).

**Development against production (measured):** the two builds agree on every DOM state, link set, id, reference, error-handler path, and replay outcome. The 12 differences in `dev-vs-prod.txt` are the minified variable name inside one Angular error message (`tNode` against `e`). Prerendered `p` routes agree with their `s` twins, except for the poisoned prerender in finding 7.

## Findings

### 1. Hydration and `NG05xx` (question 1)

- **No `NG0` error or warning in any case, build, or engine** (measured). The only console output was Angular's development-mode lines, the "hydrated N component(s)" summary with 0 components skipped, and the probe's own `ErrorHandler` lines.
- **Server error, client success** (`plain/server`): the server HTML holds the fallback. At hydration the client removes the fallback and adds the card it creates fresh (measured: `remove fallbackA; add cardA`, hydration summary 27 nodes against 34 with no error). Nothing in the console reports the change. So the DOM differs between the server and the client, which the hydration constraints ruling ("the same DOM on the server and the client") describes, but Angular does not detect it (measured). Whether this counts as a breach of standing ruling 54 is for the orchestrator (inferred: the template only differs because the error differs per platform).
- **Server success, client constructor error at hydration** (`plain/client`, `plain/once/ctor`): the server's primary DOM **stays on the page next to the fallback**, and nothing ever removes it (measured: the card, its count button, and `fallbackA` are all present after load, after `$reset()`, and after replay). Read: the client takes the server's dehydrated view out of the container (`NG/packages/core/src/hydration/views.ts:95`, `shift()`). Creating the primary view then throws, and the `catch` returns without adding or removing anything (`NG/packages/core/src/render3/instructions/boundary.ts:156-187`). The orphan is a live-looking but dead copy: its button does nothing, and its card keeps the card link (finding 2).
- **Server success, client update error at hydration** (`plain/client/host`, `.../effect`): the hydrated card is removed and the fallback added (measured: `remove cardA; add fallbackA`). No orphan.

### 2. Counted style links (question 2)

- **Server fallback leaves a stray link** (measured): in every case where the server caught the error, `<head>` carries the `card` link and the page has no card (JavaScript off shows `links=badge,card`, `cards=-`). The card's constructor acquired the item before it threw, and ADR 0060's server path never removes links (read, ADR 0060 point 4; the removal is a client `MutationObserver`). When the client then renders the card, the stray link becomes the card's link (measured, `plain/server`: 0 unstyled frames).
- **A constructor error on the client leaks the count** (measured, `plain/both`, `plain/reset`): after the client's card constructor throws, the `card` link stays in `<head>` for the life of the page with no card element connected, through later DOM changes and a `$reset()`. Inferred cause: the constructor acquired the item, and the view that failed to create is never destroyed (`boundary.ts:156-187` neither destroys nor adds it), so the `DestroyRef` release never runs.
- **An update error releases the link** (measured, `client/host`, `client/effect`, `client/late`, `once/host`, `once/late`): the primary view is destroyed, the card releases the item, and the link is removed about 8 ms later, in the next frame (e.g. `509 remove cardA ... 517 remove card`). The fallback holds no card, so no styles are lost.
- **After a successful `$reset()`** (`once/host`, `once/late`): the card is created again and the link inserted again in Yeti's order. With item CSS delayed 300 ms and the HTTP cache off, **WebKit paints 16 to 19 unstyled frames** (dev 19 and 16, prod 19 and 18). Chromium and Firefox paint 0, because a re-inserted link to a URL the document already loaded applied at once. Without routing (HTTP cache on) all three engines paint 0 (measured, `results/frames.txt`). This is ticket 13's "WebKit refetches a re-inserted link" gap. Inferred: `provideYetiStyles({ preload: ['card'] })` keeps a `rel=preload` link and would close it as it closed the `@defer` gap; not measured here.
- **Load in production, Firefox:** 1 or 2 unstyled frames at load in nearly every case, the baseline `none` case included (measured). Ticket 13 measured the same thing and traced it to Angular's inlined critical CSS leaving out Yeti's token blocks. It is not caused by the boundary.

### 3. Generated ids and the seed (question 3)

- **No duplicate id and no unresolved `aria-labelledby` in any snapshot** (measured; server HTML, JavaScript off, after load, after interaction, after each Reset, after replay; both builds, three engines).
- **A failed card still counts.** The id is a field initializer, so it runs before the constructor body throws: the server seed reads `{"ngx-yeti-label-":1,"ngx-yeti-card-":1}` with no card in the HTML (measured). The client continues from the seed, so the card it creates later gets `ngx-yeti-card-1` and its label `ngx-yeti-label-1`, both unique (measured).
- **`$reset()` gives the re-created part new ids**, `ngx-yeti-card-1` after `-0` (measured, `once/*`), because the new element has no served `id` to adopt (read, `src/ids.ts`). The card's own label reference moves with it (measured: it resolves). A reference from outside the boundary to an id inside would go stale (inferred; the probe has none, because a template reference variable cannot leave the block).
- **The `TransferState` seed is written in every case** (measured), including when the server rendered the fallback.

### 4. `@defer` hydrate triggers, event replay, `i18n`, zoneless (question 4)

- **A boundary around `@defer` does not catch a constructor error in the deferred content** (measured, `on/*` and `never/*`, card A). On the server and on the client the error goes to `handleError`, not `onViewError`. The region renders neither the card nor the fallback, and the response is still `200` ([`results/html/s_on_server_ctor.dev.html`](results/html/s_on_server_ctor.dev.html)). Read: the `@defer` state change creates the content inside its own `try` and sends errors to `handleUncaughtError` (`NG/packages/core/src/defer/rendering.ts:214-218`). This corrects ticket 36's inference that an enclosing boundary catches a hydrated block's errors "like any other update error": for constructor errors it does not.
- **A boundary inside `@defer` catches** (measured, card B). With `hydrate on interaction` and a server error, the fallback is in the server HTML. When the block hydrates, the client builds the card fresh, as in finding 1. With a client error at hydration, the fallback and the orphaned server card stay side by side, as in finding 1.
- **`hydrate never` with a server error:** the server's fallback stays for good, and its Reset button never works, because the block never hydrates (measured). Card A's `hydrate never` region was empty on the server, and the client rendered it on load (measured: `add cardA`): a `hydrate never` block with no server content is rendered by the client (inferred from the result).
- **Event replay** (measured):

  | Case | Click before hydration | After hydration |
  | --- | --- | --- |
  | `plain/none`, `on/none` (A and B) | count button | replayed (`clicks 1`) |
  | `plain/client`, `on/client` | count button | **lost** (`clicks 0`); the fallback shows beside the orphan |
  | `plain/server`, `plain/reset`, `on/server` | Reset in the server fallback | **lost**: the client never creates that `@error` view (it renders the primary or its own `@error`) |
  | `never/*` | any | not replayed, as for any `hydrate never` block |

  Inferred: replay targets the server's element. When the client replaces or abandons that element, the recorded click has nowhere to go.
- **`i18n` with `withI18nSupport()`:** `i18n` text inside the boundary's primary (`Body A`) and outside it rendered on the server and hydrated, with no message and no component skipped (measured). No case combined an `i18n` error with the fallback.
- **Zoneless:** no zone.js on any page (measured). The swap to `@error`, the swap back at hydration, and `$reset()` from a click all rendered without a zone (measured). Read: `markViewForRefresh` notifies the scheduler (ticket 36).

### 5. JavaScript off (question 5)

Measured, the same with SSR and with prerendering, in both builds:
- server error: the page shows the fallback text and a Reset button that does nothing. The card's link is in `<head>` with no card (finding 2);
- server error inside `@defer` with the boundary around it: the region is empty, with neither card nor fallback;
- client-only error: the page shows the server's card, styled (18 px), because the server rendered the primary.

So the JavaScript-off guarantee ("every item stays readable and its native controls keep working") holds only for items the server rendered. A caught item is replaced by the consumer's fallback, which may hold a control that needs JavaScript. An item in a boundary-wrapped `@defer` whose content throws disappears without any message (inferred from the measurements).

### 6. Which errors a boundary catches (question 6)

Measured on the client after hydration (`plain/client/<phase>`), and on the server for `host` and `effect`:

| Where the package directive throws | Caught by the consumer's `@boundary` | Error handler path | What the page shows |
| --- | --- | --- | --- |
| constructor (incl. `inject()` and field initializers) | yes | `onViewError` | fallback; on the client at hydration also the orphaned server DOM (finding 1) |
| host binding | yes (server and client) | `onViewError` | fallback |
| `effect()` | yes (server and client) | `onViewError` | fallback |
| host binding after hydration (`late`) | yes | `onViewError` | fallback |
| host `(click)` listener | **no** | `handleError` | the card stays; nothing changes |
| `afterNextRender` | **no** | `handleError` | the card stays |
| constructor inside `@defer` content, boundary outside the `@defer` | **no** | `handleError` | nothing (finding 4) |

The listener and render-callback rows agree with ticket 36's reading (`NG/packages/core/src/render3/view/listeners.ts:94`, `NG/packages/core/src/render3/after_render/manager.ts:95`).

### 7. `$reset()` after a creation error, and a server process left broken (all questions)

- **`$reset()` cannot recover from a constructor error thrown on the first creation of the primary template** (measured, `plain/reset`, `plain/once/ctor`, three engines, both builds). The re-render fails inside Angular with `Cannot read properties of null (reading 'componentOffset')` (Firefox: `tNode is null`; WebKit: `evaluating 'tNode.componentOffset'`), the boundary catches that, and the fallback stays. After an update error, `$reset()` works (`once/host`, `once/late`: the card returns).
- **The same breaks the server for every later request** (measured, [`results/poison.txt`](results/poison.txt), dev and prod). In a fresh server process, if the first request to create a boundary's primary template throws in a constructor, every later request to any route using that template renders the fallback with the `componentOffset` error, even with no fault. This lasts until the process restarts. It does not happen when the first creation succeeded, or when the error is a host binding. A `@defer` content template is affected the same way (`on`: `handleError ... componentOffset`).
- **Prerendering can bake that into static HTML** (measured): the first production build prerendered `p/never/client/ctor`, a route whose server render does not throw, with `Fallback B: Cannot read properties of null (reading 'componentOffset')` ([`results/html/p_never_client_ctor.prod-build1.html`](results/html/p_never_client_ctor.prod-build1.html), [`results/prerender-log.prod-build1.txt`](results/prerender-log.prod-build1.txt)). The later dev and prod builds prerendered the same route correctly. Inferred: it depends on which routes a prerender worker renders first.
- **Read cause:**
  - When a view's first creation pass throws, `renderView` marks its TView `incompleteFirstPass` (`NG/packages/core/src/render3/instructions/render.ts:142-150`).
  - A TView is static per template, shared across requests in a process (inferred from the result).
  - Only `getOrCreateComponentTView` recreates such a TView (`NG/packages/core/src/render3/view/construction.ts:151`). An embedded template's TView, which a `@boundary` primary or a `@defer` block uses, is reused as it is (`NG/packages/core/src/render3/view_manipulation.ts:34`).

  This looks like an Angular bug that `@boundary` makes reachable. Before `@boundary`, a creation error failed the whole render (inferred). It is a candidate for `upstream-bugs.md`; this prototype does not edit that file.

## For the consumer

1. A `@boundary` catches a package directive's constructor, host-binding, and effect errors. It does not catch errors in host listeners or `afterNextRender`, nor errors in `@defer` content when the boundary sits outside the `@defer`. Put the boundary inside the `@defer` block. (measured)
2. A constructor error on a template's first creation leaves that template broken: `$reset()` cannot bring it back, and on the server every later request in the process renders the fallback. Prerendered pages can be baked with it. (measured)
3. When only the server throws, the client replaces the fallback with the item, built fresh and not hydrated. A click made on the fallback before hydration is lost, and Angular logs no hydration message. (measured)
4. When only the client throws, at hydration, the server's markup stays on the page as a dead copy beside the fallback, and clicks made before hydration are lost. (measured)
5. With JavaScript off, a server-caught item shows the consumer's fallback, not the item. Any button in the fallback is dead. (measured)
6. The item's stylesheet link can stay without its item after a server-side catch, or for the page's life after a client constructor error. (measured)
7. After `$reset()` the item gets new generated ids, and WebKit can paint it unstyled until its link reloads. (measured)
8. `@boundary` is developer preview (ticket 36, read).

## For the package

Nothing measured here requires a package change to make a consumer's `@boundary` work. Three points could be package choices, listed without deciding:

- **Acquire after anything that can throw.** The count leaks because a directive acquires its item first in the constructor (finding 2). Acquiring in the last line of the constructor, or registering the release before acquiring, narrows it, but a later sibling's error still leaks (inferred). That belongs to ADR 0060's owner, the `setup` spec's loader section.
- **The `preload` list** could cover `$reset()` in WebKit as it covers a client-only `@defer` (inferred, not measured). That would be a line in each item spec's Rendering modes subsection, already required by ADR 0060 point 6.
- **The package's own templates** (`demo`) gain nothing, as ticket 36 found. Finding 7 adds a reason not to use the block there while it can break a server process (inferred).

Where each point could be documented:

| Point | Spec |
| --- | --- |
| What a boundary catches and misses (finding 6; consumer points 1 and 2) | `setup`, once for all items, near `provideClientHydration()` |
| The server-only and client-only swaps, orphaned markup, and lost replay (findings 1 and 4; consumer points 3 and 4) | `setup`, Rendering modes |
| JavaScript off shows the fallback (finding 5) | `setup`, beside ADR 0011's JavaScript-off note; each item's Rendering modes subsection could link to it |
| Stray and leaked links, and WebKit's unstyled frames after `$reset()` (finding 2) | the `setup` spec's style-loading section (ADR 0060), and each item spec's Rendering modes subsection, where the preload note already lives |
| New ids after `$reset()` (finding 3) | the generated-ids spec (ADR 0044) |
| The broken TView after a creation error (finding 7) | `setup`, as a known Angular issue, and `upstream-bugs.md` |

## Not measured

- A boundary-caught item inside a client-only `@defer`, `ngSkipHydration`, a non-default `APP_ID`, an `i18n` translation build, and a strict CSP.
- A `preload` entry against WebKit's frames after `$reset()`.
- An effect throwing in a targeted change-detection pass (ticket 36's open question). Every effect error here was on first render or after an "arm" click, and both were caught.
- Whether the broken TView (finding 7) also happens without `@boundary`, with an `@if` whose first creation throws during SSR.

## Files

- [`src/`](src/): `page.ts` (the cases), `app.config.ts` (the logging `ErrorHandler`), `app.routes.server.ts` (SSR and prerender routes), `boundary-probe.ts` (the directive sketches with the fault hook), `ids.ts` (ADR 0044's helper, from ticket 35).
- [`tools/`](tools/): `probe37.mjs`, `summarize37.mjs`, `compare37.mjs`, `poison37.mjs`.
- [`results/`](results/):
  - `summary-dev.txt` (every case, every engine);
  - `dev-vs-prod.txt` (the production build's 12 differences, all minified error text);
  - `frames.txt` (unstyled frames, both builds);
  - `poison.txt` (finding 7);
  - `prerender-log.prod-build1.txt`;
  - `html/` (server HTML for the decisive cases).

  The full JSON, about 1.2 MB, stays in `D:/tmp/ngx-yeti-37/measure/results/`.
