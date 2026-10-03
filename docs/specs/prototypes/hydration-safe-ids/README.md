# Prototype: hydration-safe generated ids

Ticket: [35. Decide: hydration-safe generated ids](../../issues/35-decide-hydration-safe-generated-ids.md). Built and measured 2026-10-03 by Claude Opus 5.5. **Throwaway code.** The decision is [ADR 0044](../../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md).

Tags: **measured** (this run, Chromium, Firefox, and WebKit unless an engine is named), **read** (`file:line`), **inferred**.

## Question

Which id source gives every id the package generates, and every id Aria generates inside a package directive, the same value on the server and the client: in full hydration, a `hydrate on` block, a `hydrate never` block, a client-only `@defer`, and a `@for` that grows after hydration, zoneless, and across concurrent SSR requests in one server process?

## Setup

- **Workspace:** `D:/tmp/ngx-yeti-29-buttons/ws` (ticket 29's), new files and routes only: `src/app/h35/` (copied here as [`src/`](src/)), 28 routes `/h35/<mode>/<case>` spread into `appRoutes`, the probe [`tools/probe35.mjs`](tools/probe35.mjs), and [`tools/summarize35.mjs`](tools/summarize35.mjs). Port 4935, stopped at the end (checked: nothing listening).
- Angular, `@angular/aria`, `@angular/cdk` 22.2.1, `provideClientHydration()` (incremental hydration and event replay included), `outputMode: server`, zoneless (the build has no polyfills chunk and loads no zone.js, measured). **Development build** (`nx run ws:build --optimization=false`), so Angular's hydration checks ran; every page logged Angular's "hydrated N component(s)" summary. Playwright 1.63.0, headless.
- **Widget set** ([`src/pages.ts`](src/pages.ts) `H35Set`), placed once per set `a`, `b`, `c`: a `yetiTabs` group hosting Aria `Tabs`, `TabList`, `Tab`, `TabPanel` (ids and `aria-controls`/`aria-labelledby` from Aria); a `yetiButtons` toolbar hosting Aria `Toolbar` and `ToolbarWidget`; a package-own `yetiLabel`/`yetiLabelled` pair (`aria-labelledby`) and a `yetiTrigger`/`yetiPanel` pair (`aria-controls`), both from `injectYetiId()`. Per set: 8 ids and 6 references.
- **Modes** ([`src/ids.ts`](src/ids.ts)), chosen per route by a route-level token:
  - `cdk`: ADR 0042 as written. CDK's `_IdGenerator` for the package (no infix), Aria's own random infix.
  - `counter`: one counter per prefix in a root `@Service()`. Aria gets the same counter through an element-level `_IdGenerator` provider in each package directive that hosts an Aria directive.
  - `adopt`: `counter`, plus a host claimed at hydration keeps the id the server gave it (one `getAttribute('id')` at creation), and the client's counters start from the server's final counts, sent in `TransferState`.
  - `noseed`: control for `adopt`, without the `TransferState` seed.
- **Cases:** `full` (sets a, b); `on` (a, then b in `@defer (hydrate on timer(1500ms))`, then c); `never` (a, b in `@defer (hydrate never)`, c); `client` (a, b in a client-only `@defer (on timer(500ms))` with a placeholder, c); `for` (`@for` over a, b, then two items added after hydration by clicking Add); `neveradd` (a, b in `hydrate never`, then two `@for` items added after hydration); `late` (server only: a, then b after a 400 ms `PendingTasks` wait, to make two requests overlap).
- **Probe:** server HTML fetched per route; two concurrent requests and then a third sequential one per mode for `full` and `late`. In each engine: a `MutationObserver` from `addInitScript` logs every `id`, `aria-controls`, and `aria-labelledby` write that changes a non-null value ("rewrites"); after hydration (and for `on`, also 700 ms in, before the block hydrates) it lists duplicate ids, references that do not resolve to exactly one element, and whether each set is live (`ng.getComponent`) or dehydrated; it compares every server id and reference with the final DOM ("changed-from-server"); and it keeps every console error and warning.

## Results

[results/summary.txt](results/summary.txt), identical in Chromium, Firefox, and WebKit (measured). No `NG05xx` error or warning in any engine, mode, or case.

| Case | `cdk` (ADR 0042) | `counter` | `adopt` | `noseed` |
| --- | --- | --- | --- | --- |
| `full` | 28 rewrites (every id and reference) | 0 | 0 | 0 |
| `on`, before the block hydrates | b dehydrated, ids as served | **8 duplicate ids, 12 references resolve to 2 elements** | 0 duplicates, all resolve | 0 |
| `on`, after | 42 rewrites | 42 rewrites | 0 | 0 |
| `never` | 28 rewrites | 28 rewrites, **8 duplicates for good** | 0 | 0 |
| `client` (b client-only) | 28 rewrites | 0 | 0 | **8 duplicates** (b's new ids repeat a's) |
| `for` + 2 adds | 28 rewrites | 0 | 0 | **16 duplicates** after the adds |
| `neveradd` + 2 adds | 14 rewrites | 14 rewrites, 8 duplicates | 0 | **16 duplicates** after the adds |

Summary lines: `cdk/full` at `summary.txt:36` (Chromium), `:131`, `:226`; `counter/on` at `:66`; `counter/never` at `:71`; `adopt/*` at `:87-104`, `:182-199`, `:277-294`; `noseed/client`, `/for`, `/neveradd` at `:118-125`.

**Concurrency (server HTML, measured, `summary.txt:1-33`):**
- `cdk`: two concurrent requests to one process got different ids, and a third sequential request different again (`ngx-yeti-label-16`, `-18`, `-20` for the first set). With `late`, the two requests interleaved: request A's first set got `-22`, request B's `-23`, then A's second set `-24` and B's `-25`.
- `counter`, `adopt`, `noseed`: A, B, and the third request were identical, each starting at `-0`. A root `@Service()` is `providedIn: 'root'` (read, `NG/packages/core/src/di/interface/service.ts:32`), and the server creates one application per request.

**Why a counter alone fails (measured, [results/server-counter-on.html](results/server-counter-on.html)):** the server does not create ids in document order. It gave the `hydrate on` block's set `b` the first ids (`ng-tab-0`), then set `a` (`ng-tab-2`), then `c` (`ng-tab-4`). Inferred from the order: the block's view is created while the parent template is created, and the child components' views of `a` and `c` after it. The client skips the dehydrated block, so `a` takes `-0` and collides with the server's `b` until the block hydrates; in `hydrate never` the collision stays.

**Why adoption works (read):** at hydration Angular locates the server's element first (`NG/packages/core/src/render3/instructions/element.ts:331-345`) and creates the element's directives after (`:140-144`); host bindings run later. So a directive's field initializer sees the server's `id` on its host. A static `id` would be re-applied before that, but the package's ids are never static. **Measured:** `adopt` rewrote nothing in any case, before or after a block hydrated.

**Why the seed is needed (measured):** without it (`noseed`), every id the client creates fresh (client-only `@defer`, `@for` additions) restarts at 0 and repeats an id the server rendered. With it, fresh client ids continue after the server's counts. The seed is one `TransferState` key, about 100 bytes on this page (`"ngx-yeti-ids":{"ng-tab-":6,...}`, [results/server-adopt-on.html](results/server-adopt-on.html)), written through `onSerialize` (read, `NG/packages/core/src/transfer_state.ts:134`; `NG/packages/platform-server/src/transfer_state.ts:79-81`).

**Aria through the provider (measured):** with `yetiAriaIds` in the providers of `yetiTab`, `yetiTabPanel`, and `yetiButton`, Aria's `Tab`, `TabPanel`, and `ToolbarWidget` took their ids from the package's counter (`ng-tab-0`, no random infix) on the server and the client, and Aria's own `aria-controls` and `aria-labelledby` followed. Aria asks for the id in a field initializer (`NC/src/aria/tabs/tab.ts:62`, `tab-panel.ts:73`, `toolbar/toolbar-widget.ts:70`), so an element-level provider of `_IdGenerator` is what it receives.

**Console (measured):** apart from Angular's hydration summary, the only messages were two Aria development-mode warnings per panel, "Violations found on element" and "ngTabPanel must have an ngTabContent structural directive to render" (`NC/src/aria/private/utils/violations.ts:12`), in every mode alike; the prototype's panels have no `ngTabContent`, as in tickets 30 and 32.

## Not measured

- A non-default `APP_ID` (CDK appends it to the prefix, `NC/src/cdk/a11y/id-generator.ts:34-36`; `TransferState` is read from `<APP_ID>-state`, `transfer_state.ts:166`), prerendering, `withI18nSupport()`, JavaScript off (the server HTML had no duplicate ids in `adopt`, so references resolve, inferred), and a client-only application with no server HTML.
- The rule "consumers write ids inside `hydrate` blocks" under `counter`: inferred to hold only when every id-generating element in the block, Aria's included, has a consumer id.

## Files

- [`src/ids.ts`](src/ids.ts): the four modes, `injectYetiId()`, and `yetiAriaIds`.
- [`src/items.ts`](src/items.ts): the directives, reduced to ids.
- [`src/pages.ts`](src/pages.ts): the widget set, the cases, and the routes.
- [`tools/probe35.mjs`](tools/probe35.mjs), [`tools/summarize35.mjs`](tools/summarize35.mjs): the probe and its summary (the full JSON, 392 kB, stays in the workspace).
- [`results/summary.txt`](results/summary.txt), [`results/server-counter-on.html`](results/server-counter-on.html), [`results/server-adopt-on.html`](results/server-adopt-on.html).
