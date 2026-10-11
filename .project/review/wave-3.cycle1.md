# Review — wave 3, cycle 1

Wave verdict: blocked
Cycle: 1
Depth: full
Tasks reviewed: 11

## T009 — Ship breakout and timeline with the A11Y-10c and A11Y-10a contrast assertions: pass

- ✅ Every breakout and timeline story passes its play function and the axe gate, including A11Y-10c's and A11Y-10a's exact-formula contrast assertions in the light and dark schemes; E7: a failing assertion brought one `@layer ngx-yeti` rule and a ledger update, or (while passing) nothing was added, with the measured ratios in the Log. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields; floor and ci unit Storybook runs report no breakout or timeline failure (D:\projects\github\LayZeeDK\ngx-yeti\tmp\afk-m002\gate-wave3-c1\ci-unit.log, run-many.log)
- ✅ `apps/ngx-yeti-e2e/src/breakout.spec.ts` and `apps/ngx-yeti-e2e/src/timeline.spec.ts` pass in Chromium, Firefox, and WebKit, with the container resized and each spec's engine limits. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ `/sub/breakout`, `/sub/server/breakout`, `/sub/timeline`, and `/sub/server/timeline` pass the standard Fixture cases with JavaScript on and off, in development and production. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ The layer-2, layer-3, and contract specs of both items pass, including parts that acquire nothing (E13), the `ol`-only timeline selector, and no package-written role. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ Each directive's JSDoc carries the spec's numbered usage rules. — breakout.ts and timeline.ts JSDoc carry numbered rules (6 and 10 numbered lines)
- ✅ `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields

Warnings (non-blocking):
- none

Contract violations (blocking):
- none

## T010 — Ship grid and masonry with A11Y-23's order story: pass

- ✅ Every grid and masonry story passes its play function and the axe gate, including A11Y-23's `masonry--order` (Tab follows source order on the branch the engine takes). — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ `apps/ngx-yeti-e2e/src/grid.spec.ts` and `apps/ngx-yeti-e2e/src/masonry.spec.ts` pass in Chromium, Firefox, and WebKit, including A11Y-23's `masonry--order` with the container resized and the per-engine `CSS.supports` annotation. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ `/sub/grid`, `/sub/server/grid`, `/sub/masonry`, and `/sub/server/masonry` pass the standard Fixture cases; the `ol` cell's written-back `start` appears in no painted frame (or, after an `E8 verdict: fail`, the bound-only form ships). — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ The layer-2, layer-3, and contract specs of both items pass, with no package-written role on the grid. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ Each directive's JSDoc carries the spec's numbered usage rules. — grid.ts and masonry.ts JSDoc carry numbered rules (11 and 8)
- ✅ `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields

Warnings (non-blocking):
- none

Contract violations (blocking):
- none

## T011 — Ship enter and visually-hidden with enter's held-bundle and preload cases: fail

- ✅ Every enter and visually-hidden story, `enter--inserted-preloaded` included, passes its play function and the axe gate. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ❌ `apps/ngx-yeti-e2e/src/enter.spec.ts` and `apps/ngx-yeti-e2e/src/visually-hidden.spec.ts` pass in Chromium, Firefox, and WebKit with each spec's engine limits (Firefox 145 without `view()`, WebKit's Tab skip outside Linux). — found: in the floor job webkit-26-4 (D:\projects\github\LayZeeDK\ngx-yeti\tmp\afk-m002\gate-wave3-c1\floor-webkit.log:316-366), apps/ngx-yeti-e2e/src/enter.spec.ts:381 `enter--inserted-preloaded` failed at :434 twice (the `deferred-once` animation started 2 times, expected 1) and passed only on retry #2; Playwright reports it flaky and the job exits non-zero. A `once` element that animates twice also contradicts the case's own claim.
  fix: capture the retry trace (dist/.playwright/apps/ngx-yeti-e2e/test-output/enter-enter--inserted-prel-*-webkit*/trace.zip) and check whether the second `animationstart` on `deferred-once` coincides with the enter item link or preload stylesheet applying after insertion (WebKit restarting the animation when `animation-name` re-resolves). If it is a test race, start recording after the stylesheet is applied (await the item link `load` before inserting the client-only @defer) in apps/ngx-yeti-e2e/src/enter.spec.ts:381-437; if WebKit 26.4 truly plays it twice, record that as an annotation per engine limit with an upstream-bugs row instead of a flaky assertion. Prove with 20 repeats in `node tools/ci-local/run-job.mjs floor webkit-26-4`.
- ✅ On `/sub/enter` and `/sub/server/enter`, with the main bundle held back, the below-the-fold `once` element keeps `data-once` through hydration and arrives once only when scrolled to (enter.md:269); the in-view arrival delay is recorded, not asserted. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ E15: `apps/yeti-app-e2e/src/enter.spec.ts` runs enter.md:272's `@defer (on interaction)`, `@if`, and route-change `once` insertions without the preload on the Fixture app, and `apps/ngx-yeti-e2e/src/enter.spec.ts` runs the `@defer` and `@if` insertions with it on `enter--inserted-preloaded`, as the Departures row T002 wrote records; each case's first `animationstart` against the item link's load is recorded. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ `/sub/visually-hidden` and `/sub/server/visually-hidden` pass visually-hidden.md's Fixture cases and the standard cases with JavaScript on and off. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ The layer-2, layer-3, and contract specs of both items pass, including enter's test that roles and reading and focus order are unchanged by the arrival and that no listener is on the host. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ Each directive's JSDoc carries the spec's numbered usage rules. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields

Warnings (non-blocking):
- thermos F2: enter.ts:18-27 and :73-78 document `once` as withholding every arrival, but upstream Y14 (vendor/yeti/src/utilities/enter/enter.css:26-43 vs :112-115) withholds only the default fade and staggered hosts; no case covers `yetiEnter="rise" once`. The numbered-rules criterion still holds; soften the doc and add a recorded case.

Contract violations (blocking):
- none

## T012 — Ship cluster with its enter shared host, the lift carry-over, and timeline's cluster measurement: fail

- ✅ Every cluster story passes its play function and the axe gate; `lift--default` passes with its three cards in a `yetiCluster`; `timeline--in-cluster` passes the axe gate. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ `apps/ngx-yeti-e2e/src/cluster.spec.ts` passes in Chromium, Firefox, and WebKit, and `apps/ngx-yeti-e2e/src/timeline.spec.ts` records the timeline-in-a-cluster measurement per engine as an annotation. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ❌ `/sub/cluster` and `/sub/server/cluster` pass the standard Fixture cases, the static `align` shows no painted frame (or the bound-only form ships after an `E8 verdict: fail`), and the shared `yetiCluster yetiEnter` host in `hydrate never` keeps both links. — found: floor job firefox-146-e2e (D:\projects\github\LayZeeDK\ngx-yeti\tmp\afk-m002\gate-wave3-c1\floor-firefox-e2e.log:36-362) fails deterministically apps/yeti-app-e2e/src/cluster.spec.ts:309 \"with JavaScript off, with the arrivals collapsed, serves server HTML that axe passes\" on both /sub/cluster and /sub/server/cluster: color-contrast on `#arriving-cluster > li:nth-child(1)` (cluster.spec.ts:321). The standard Fixture case (axe-clean with JavaScript off) does not pass in a CI engine.
  fix: open error-context.md for the run and read the reported foreground/background and opacity: the JS-off arriving `li` is most likely measured mid enter-animation (Firefox 146 has no `view()` timeline, so the fade may sit at its start keyframe). Before `axeViolations()` at cluster.spec.ts:321, wait until every element carrying `data-enter` reports `opacity: 1` (or `document.getAnimations().every(a => a.playState === 'finished')`), as enter.spec.ts:464 does for `#plain`; if the element stays below full opacity with arrivals collapsed, the cluster fixture (apps/yeti-app/src/app/fixtures/cluster-fixture.ts) or the collapse emulation leaves content faded, which is a product failure against N3: fix the fixture so collapsed arrivals end visible. Re-run `node tools/ci-local/run-job.mjs floor firefox-146-e2e`.
- ✅ The layer-2, layer-3, and contract specs of cluster pass, including the `yetiCluster yetiEnter` host carrying both presence attributes. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ The directive's JSDoc carries the spec's numbered usage rules. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields

Warnings (non-blocking):
- none

Contract violations (blocking):
- none

## T013 — Ship sidebar with A11Y-22's Shift+Tab walk and the sidebar-with-center order case: pass

- ✅ Every sidebar story passes its play function and the axe gate, `sidebar--holding-center` included. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ E12: `apps/ngx-yeti-e2e/src/sidebar.spec.ts` asserts A11Y-22's Shift+Tab walk on `sidebar--sticky` at 320 x 640 with usage rule 4 followed (each focused link at least partly visible), records the default-padding walk, and passes in Chromium, Firefox, and WebKit; a fully hidden focused link with the rule followed stops the task for the user's ruling (option B or a new decision) instead of a rule change. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ E2: `apps/yeti-app-e2e/src/sidebar.spec.ts` shows a center inside a sidebar centred whichever file loads first, because `sidebar.css` precedes `center.css`; the standard Fixture cases, the static `align` frame check, the JavaScript-off sticky `nav`, and the shared host with box pass. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ The layer-2, layer-3, and contract specs of sidebar pass, including the `nav yetiSidebarChild sticky` stand-in with one `data-sticky`. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ Each directive's JSDoc carries the spec's numbered usage rules, rule 4 included. — sidebar.ts JSDoc carries 8 numbered rules
- ✅ `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields

Warnings (non-blocking):
- none

Contract violations (blocking):
- none

## T014 — Ship cover and columns with the cover-with-center order case: pass

- ✅ Every cover and columns story passes its play function and the axe gate, `cover--holding-center` included. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ `apps/ngx-yeti-e2e/src/cover.spec.ts` and `apps/ngx-yeti-e2e/src/columns.spec.ts` pass in Chromium, Firefox, and WebKit, including the 320 x 256 and 200 % zoom growth and the container-resized threshold. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ `/sub/cover`, `/sub/server/cover`, `/sub/columns`, and `/sub/server/columns` pass the standard Fixture cases, the cover-with-center order case, the shared host with box, and the columns `align` frame check (or the bound-only form after an `E8 verdict: fail`). — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ The layer-2, layer-3, and contract specs of both items pass. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ Each directive's JSDoc carries the spec's numbered usage rules. — cover.ts and columns.ts JSDoc carry 7 numbered rules each
- ✅ `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields

Warnings (non-blocking):
- none

Contract violations (blocking):
- none

## T015 — Ship layer and overlay with A11Y-10b's scrim contrast: fail

- ❌ Every layer and overlay story passes its play function and the axe gate, including A11Y-10b's exact-formula caption contrast against the scrim composited on black and on white in both schemes; E7 handled as stated (a rule and ledger update only if the assertion fails), with the ratios in the Log. — found: in the wave gate run-many (D:\projects\github\LayZeeDK\ngx-yeti\tmp\afk-m002\gate-wave3-c1\run-many.log:70-110) `overlay--settings` failed in Chromium at packages/ngx-yeti/overlay/src/overlay.stories.ts:345 (\"fill without over moves nothing\": height 35.66 px off, tolerance 1); a full uncached rerun passed 128/128 (sb-rerun.log). An intermittent play function is not a passing story and fails the `test-storybook` CI job at random.
  fix: overlay.stories.ts:331-345 captures `inFlow` right after `position` turns `static`, before layout settles (the NG02952 zero-height fill-image warnings in the same log show the image box still resolving). Capture the baseline only after the held child's box is stable: await the held image `complete` and two animation frames (or poll `held.getBoundingClientRect().height` until two reads agree) before `const inFlow`, and do the same after `data-fill` appears before reading `filledInFlow`, or wrap the four expectClose calls in `waitFor`. Prove with 20 repeats of `npm exec nx -- test-storybook ngx-yeti -- overlay/src`.
- ✅ `apps/ngx-yeti-e2e/src/layer.spec.ts` and `apps/ngx-yeti-e2e/src/overlay.spec.ts` pass in Chromium, Firefox, and WebKit, including the 200 % zoom and the veil's Tab case. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ `/sub/layer`, `/sub/server/layer`, `/sub/overlay`, and `/sub/server/overlay` pass the standard Fixture cases and the layer `align` frame check (or the bound-only form after an `E8 verdict: fail`). — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ The layer-2, layer-3, and contract specs of both items pass, with no package `inert`, `aria-hidden`, or live region on overlay content. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ Each directive's JSDoc carries the spec's numbered usage rules. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields

Warnings (non-blocking):
- none

Contract violations (blocking):
- none

## T016 — Ship spinner with A11Y-13 and its forced-colours measurement: pass

- ✅ Every spinner story passes its play function and the axe gate, with the bright edge at least 3:1 and the text at least 4.5:1 in both schemes on `spinner--default` and the other variants' ratios recorded. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ E7: `apps/ngx-yeti-e2e/src/spinner.spec.ts` records the ring's forced-colours border colours in Chromium and Firefox; a lost bright edge brought a spinner-owned ledger row and one `@layer ngx-yeti` rule on `.spinner` and `.button[aria-busy="true"]::after` (system colours only, no `--_yeti-*` token, no package class) with an assertion and a stylesheet-removed control, and a held edge brought nothing; the Log states which. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ A11Y-13: on the spinner stories under reduced motion the iteration count is 1, the duration at most 0.01 ms, and six frames share one `rotate`, while without the preference the angles differ, in Chromium, Firefox, and WebKit. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ `/sub/spinner` and `/sub/server/spinner` pass the standard Fixture cases, the hydration attribute and `currentTime` case, and the `hydrate never` case. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ The layer-2, layer-3, and contract specs of spinner pass. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ The directive's JSDoc carries the spec's numbered usage rules. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields

Warnings (non-blocking):
- thermos F1: packages/ngx-yeti/src/published-output.node.spec.ts:65-95 exempts every rule inside `@layer ngx-yeti`, not only the ledger-named `.spinner` and `.button[aria-busy]` selectors, so the guard is weaker than before; no task criterion is defeated today. F4: the comment there cites `INTENT E7`.

Contract violations (blocking):
- none

## T017 — Ship scroller with its keyboard cases and focus surviving hydration: pass

- ✅ Every scroller story this task owns passes its play function and the axe gate, with the focus ring at least 3:1. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ `apps/ngx-yeti-e2e/src/scroller.spec.ts` passes in Chromium, Firefox, and WebKit with real Tab and arrow keys, snap centring, 320 px, and axe's `scrollable-region-focusable` control. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ On `/sub/scroller` and `/sub/server/scroller`, Tab focuses the scroller and ArrowRight scrolls it with JavaScript off, and with the main bundle held back the focus and `scrollLeft` made before hydration survive it; the standard Fixture cases pass. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ The layer-2, layer-3, and contract specs of scroller pass, with `role="region"` and `tabindex="0"` its only written role and a consumer `tabindex` kept. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields; scroller.ts:64-65 host writes only role region and tabindex 0
- ✅ The directive's JSDoc carries the spec's numbered usage rules. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields

Warnings (non-blocking):
- thermos F3: scroller.md:153 and :403 put `YetiScrollerJustify` on the primary entry `ngx-yeti`; it is exported only from `ngx-yeti/scroller` (T017 Log flagged it for another owner, T019 did not take it). No acceptance criterion names it; carry it as a spec gap.

Contract violations (blocking):
- none

## T018 — Ship frame with its zero layout shift and the iframe reload ledger row: fail

- ❌ Every frame story passes its play function and the axe gate, `frame--optimized-image` recording both forms' console output. — found: ci unit job (D:\projects\github\LayZeeDK\ngx-yeti\tmp\afk-m002\gate-wave3-c1\ci-unit.log:639, 1076-1097) fails `frame--media` in Firefox Storybook: packages/ngx-yeti/frame/src/frame.stories.ts:324 `expectFills(objectFrame, object)` reports the `object` top 96 px off the frame (frame.stories.ts:113-114 via :82). The task Verify ran test-storybook in Chromium only, so the Firefox project was never proven.
  fix: the `<object data=... type=image/svg+xml>` in Firefox is measured before its document loads (Firefox lays out an unloaded object as an inline replaced box, so it is not yet stretched to the frame). In frame.stories.ts before :324, await the object's `load` event (or `waitFor` on `expectFills(objectFrame, object)`), as `imageLoaded` does for the picture; if it still does not fill after load, the frame's child sizing does not cover `object` in Gecko and needs the A11Y-free layout fix in packages/ngx-yeti/frame (or a Departures row if it is Yeti's CSS). Prove with `node tools/ci-local/run-job.mjs ci unit`.
- ✅ `/sub/frame` and `/sub/server/frame` pass the standard Fixture cases with a layout-shift score of 0 while the image loads, the cropped first frame in `@defer`, and 320 px; the embed reload counts are recorded, and a confirmed reload has an Angular row in `docs/specs/upstream-bugs.md`, unfiled. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ The layer-2, layer-3, and contract specs of frame pass. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ The directive's JSDoc carries the spec's numbered usage rules, with rule 6 changed and a Departures row added only if `fill` misbehaved. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields

Warnings (non-blocking):
- task Verify runs test-storybook in Chromium only, so it cannot catch the Firefox Storybook project that ci.yml unit runs.

Contract violations (blocking):
- none

## T019 — Add the wave-3 items to the consumer build, name-collision list, README, and changelog: pass

- ✅ `npm exec nx -- run ngx-yeti:pack-check` compiles a consumer that imports a public symbol from each of the fifteen wave-3 entry points against the `npm pack` tarball, and the contract checks of those items pass over the built manifest. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ The name-collision positive list holds every export of the fifteen entry points and the item-names list every new root directive file; both tests pass. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ The README's Entry points table and status line and the changelog name the fifteen items; every `UPSTREAM:` line of the wave has its row. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields
- ✅ `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit. — isolated Verify in the task Log: pass, exit 0 (orchestrator rerun at base plus the task patch); scope check: every changed path is in `files`, task-file edits limited to orchestrator fields

Warnings (non-blocking):
- none

Contract violations (blocking):
- none

## Intent coverage

### SC1 — In Storybook, every story the 22 specs name, except the cases carried to later milestones under Scope: out, and every story case carried over from M001 (`setup--item-links`, card's composite stories with `grid` and `layer`, `lift--default` with its three cards in a `yetiCluster`, and the button-link assertions of card's section 8 markup), passes its play function and the axe gate under `nx test-storybook ngx-yeti`. That includes the exact-formula contrast assertions of A11Y-10a, A11Y-10b, A11Y-10c, and A11Y-21, A11Y-9's anti-pattern story, A11Y-23's `masonry--order` story, the toggle story's 3:1 state contrast for medium and low emphasis (ticket 50 decision 94), and, in `setup--item-links` (setup.md:303), the `stack` and `center` links in `yeti.css` order after either arrival order, equal inline margins on the inner `center`, and both links gone in the frame after the toggle hides the last host. The CSS `:hover` assertions the specs place in play functions (table.md:376, button.md:315, :317, :320) run in layer 2 or 4 under the hover row of the ngx-yeti-specs Departures table (SKILL.md:37). Walkthrough: in the built Storybook, `setup--item-links` shows a `yetiStack` holding a centred `yetiCenter`, and `button--toggle` shows its pressed state.: fail
- ❌ In Storybook, every story the 22 specs name, except the case… — found: `frame--media` fails in Firefox Storybook (ci unit, frame.stories.ts:324) and `overlay--settings` fails intermittently in Chromium (run-many, overlay.stories.ts:345); see T018 and T015.
  fix: as in T018 criterion 1 and T015 criterion 1.
- E7 (held-out): T009, T015 and T016 Logs record the measured A11Y-10a/10b/10c ratios and the spinner edge; their stories pass in the uncached rerun (sb-rerun.log 128/128). N1 (judgment): no wave-3 story disables an axe rule outside an anti-pattern story (checked by the scope of the diffs; none found in run-many axe output).

### SC2 — Under `nx e2e ngx-yeti-e2e`, every layer-4 case the 22 specs put on story ids passes (Chromium locally, every CI engine in CI, with each spec's recorded engine limits), including A11Y-22's Shift+Tab walk stacked at 320 x 640 (sidebar.md:308), A11Y-23's `masonry--order`, A11Y-13's single iteration under reduced motion (spinner.md:319, button.md:346), the 200 % zoom and 320 px cases, and scroller's real-key Tab and arrow cases. Walkthrough: on `sidebar--sticky` at 320 x 640, with usage rule 4 followed, Shift+Tab walks back through every link with each focused link at least partly visible (sidebar.md:308).: fail
- ❌ Under `nx e2e ngx-yeti-e2e`, every layer-4 case the 22 specs… — found: floor webkit-26-4 job fails on apps/ngx-yeti-e2e/src/enter.spec.ts:381 (flaky, 2 of 3 attempts fail); ci e2e otherwise passes every engine except the pre-existing setup-boundaries.spec.ts:99 WebKit flake outside this wave.
  fix: as in T011 criterion 2.
- E12 (held-out): T013 Log records the A11Y-22 walk with rule 4 followed and every focused link partly visible; ci e2e passes sidebar.spec.ts in every engine. N2 (judgment): the recorded-only cases (frame embed reloads, enter in-view delay, A11Y-22 default-padding walk) are annotations in the diffs, not assertions.

### SC3 — On the Fixture app, each of the 22 items has a prerendered `/<item>` and a server-rendered `/server/<item>` route that passes `yeti-app-e2e` with JavaScript on and off, axe-clean on the `wcagTags` rule set and with no hydration mismatch, plus every other layer-4 Fixture-app case its spec names: the client `@defer` with preload and `hydrate never` cases, the item link removed on leaving the route and re-inserted on return, no horizontal overflow at 320 px where the spec says so, the written-back static attributes (`align`, `border`, `nowrap`, a link's `disabled`) absent from every painted frame, the shared-host cases that keep both links, frame's zero layout shift, table's pinned-head Shift+Tab walk (table.md:416, A11Y-22's table repeat), scroller's focus and scroll position made before hydration surviving it (scroller.md:314), and `enter`'s `once` element keeping `data-once` through hydration and arriving only when scrolled to (enter.md:269). The negative-control routes the specs require (table without `tbody`, table.md:411; center's bordered anti-pattern, center.md:288) are labelled as what not to write, record their logged error or measurement, and are exempt from the no-mismatch and axe checks. The card route shows its cards in a `yetiGrid` with the footer links as `yetiButton`, the setup spec's layer-4 order case passes, and the Tailwind C1 and C2 Fixture build configurations pass (cases carried over from M001). Walkthrough: with JavaScript disabled, `/sub/stack` and `/sub/card` show styled layouts, the card grid lays out its cards in columns, and Tab on `/sub/scroller` focuses the scroller and ArrowRight scrolls it.: fail
- ❌ On the Fixture app, each of the 22 items has a prerendered `… — found: floor firefox-146-e2e fails the JavaScript-off axe case deterministically on /sub/cluster, /sub/server/cluster (cluster.spec.ts:309, `#arriving-cluster > li`) and /sub/enter, /sub/server/enter (enter.spec.ts:459, `#plain, #slide`).
  fix: cluster as in T012 criterion 3; enter: in apps/yeti-app-e2e/src/enter.spec.ts:459-466 wait for every `[data-enter]` element (not only `#plain`) to reach opacity 1 before `axeViolations()`, and if `#slide` stays faded with arrivals collapsed, fix apps/yeti-app/src/app/fixtures/enter-fixture.ts so collapsed arrivals end visible (N3). Re-run `node tools/ci-local/run-job.mjs floor firefox-146-e2e`.
- E2 (held-out): T013 Log and ci e2e pass apps/yeti-app-e2e/src/sidebar.spec.ts in both arrival orders. E8 (held-out): T010/T012/T013/T014/T015 Logs record the static-attribute frame checks passing. E9: Fixture preload assertions use containment. E15: T011 Log records the Departures-row route. N3 (judgment) is at risk for cluster and enter until the Firefox 146 failure is explained.

### SC4 — Under `nx test ngx-yeti`, every layer-2 and layer-3 case the 22 specs name passes, except the cases carried to later milestones under Scope: out, including each spec's "two fixtures share one link until both are destroyed" case, button and spinner's shared `spinner` link (button.md:332, spinner.md:304), and the compile-time fixtures that must fail to compile (center.md:274, `max="large"`; button.md:179, NG8002 when `YetiButtonDisabledLink` is not imported), proven by a separate check that compiles each fixture and asserts the expected error, outside the `nx typecheck` inputs, which stay green.: pass
- ✅ run-many lint typecheck test passed (only test-storybook failed, D:\projects\github\LayZeeDK\ngx-yeti\tmp\afk-m002\gate-wave3-c1\run-many.log); floor layer 2 passes in firefox-145 and chromium-141 (409/409, floor-chromium-141-abs.log); every task Verify ran its layer-2/3/contract specs, exit 0.
- E13 (held-out): T009 criterion 4 (parts acquire nothing) in its passing Verify. E14 (held-out): every wave-3 `gap` is `input<YetiGap>()` and every `align` is `input<YetiAlign>()` (cluster.ts:62/68, columns.ts:82/87, sidebar.ts:91/97, layer.ts:70 and others, checked). N4: scroller.ts:64-65 is the only package-written role.

### SC5 — A consuming build against the `npm pack` tarball imports each of the 22 new entry points, and the contract check over the built manifest passes for all 22 items. Walkthrough: the consumer source imports one public symbol from each new `ngx-yeti/<item>` entry point and builds.: pass
- ✅ T019 Verify (pack-check consumer over the fifteen wave-3 entry points plus manifest contract checks) exit 0; ci unit's pack step did not fail (D:\projects\github\LayZeeDK\ngx-yeti\tmp\afk-m002\gate-wave3-c1\ci-unit.log, only frame--media failed).

## Summary for orchestrator

- blocked findings: (1) T018 packages/ngx-yeti/frame/src/frame.stories.ts — frame--media Firefox object fill; (2) T015 packages/ngx-yeti/overlay/src/overlay.stories.ts — overlay--settings intermittent baseline; (3) T011 apps/ngx-yeti-e2e/src/enter.spec.ts — enter--inserted-preloaded double start on WebKit 26.4; (4) T012 apps/yeti-app-e2e/src/cluster.spec.ts (+ cluster-fixture.ts) and T011 apps/yeti-app-e2e/src/enter.spec.ts (+ enter-fixture.ts) — JavaScript-off axe color-contrast in Firefox 146. Disjoint file scopes: (1), (2), (3), (4-cluster), (4-enter; same task as 3, different file).
- repeat offenders: none (cycle 1)
- warnings worth a human eye: SC8 is not owned by any wave-3 task but the same four failures block it; thermos F1 (published-output layer exemption too broad) and F3 (YetiScrollerJustify not on the primary entry) are spec gaps no criterion covers; task Verify commands run Storybook in Chromium only.
