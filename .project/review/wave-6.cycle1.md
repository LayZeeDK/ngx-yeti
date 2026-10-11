# Review — wave 6, cycle 1

Wave verdict: pass
Cycle: 1
Depth: full
Tasks reviewed: 2

## T032 — Fix wave 2 cycle 1 review findings in T007, T008: pass

- ✅ On the Fixture app, each of the 22 items has a prerendered `/<item>` and a server-rendered `/server/<item>` route that passes `yeti-app-e2e` with JavaScript on and off, axe-clean on the `wcagTags` rule set and with no hydration mismatch, plus every other layer-4 Fixture-app case its spec names: the client `@defer` with preload and `hydrate never` cases, the item link removed on leaving the route and re-inserted on return, no horizontal overflow at 320 px where the spec says so, the written-back static attributes (`align`, `border`, `nowrap`, a link's `disabled`) absent from every painted frame, the shared-host cases that keep both links, frame's zero layout shift, table's pinned-head Shift+Tab walk (table.md:416, A11Y-22's table repeat), scroller's focus and scroll position made before hydration surviving it (scroller.md:314), and `enter`'s `once` element keeping `data-once` through hydration and arriving only when scrolled to (enter.md:269). The negative-control routes the specs require (table without `tbody`, table.md:411; center's bordered anti-pattern, center.md:288) are labelled as what not to write, record their logged error or measurement, and are exempt from the no-mismatch and axe checks. The card route shows its cards in a `yetiGrid` with the footer links as `yetiButton`, the setup spec's layer-4 order case passes, and the Tailwind C1 and C2 Fixture build configurations pass (cases carried over from M001). Walkthrough: with JavaScript disabled, `/sub/stack` and `/sub/card` show styled layouts, the card grid lays out its cards in columns, and Tab on `/sub/scroller` focuses the scroller and ArrowRight scrolls it. — read as the repair of the recorded sc3 finding (the center route's either-order case failing in production Chromium). Commit 54eb119 (parent 958acdf = recorded base) changes only apps/yeti-app-e2e/src/center.spec.ts:34-68: `expectCentred` now waits per center with `toHaveCSS('max-inline-size', probeMax)` before the geometry read; the exact-value check is kept (moved into the auto-retrying wait), start/end checks unchanged. The coder Log measures the cause (one frame before Angular binds `data-max`) and 20/20 per route kind with retries off in chromium production; orchestrator isolated Verify exit 0 (T032 Log). The full six-combination `ci e2e` job, unproven in the coder Log, passed in the orchestrator wave gate at 1370da3 (gate-wave2-c2/summary.txt: ci-e2e exit 0). The other items in this criterion are outside this wave and were not re-checked here.
- ✅ `/sub/stack`, `/sub/server/stack`, `/sub/center`, and `/sub/server/center` pass the standard Fixture cases with JavaScript on and off in the development and production builds; the static `align` stack shows no painted frame with `align` (per T003's verdict); the stack-later-in-`@defer` tie and the either-order stack of centers keep every center centred; the `setup-order` case keeps the center centred. — orchestrator isolated Verify exit 0 (T032 Log) covers stack, center and setup specs in Chromium development and production plus Firefox and WebKit run-job e2e; wave gate ci-e2e exit 0 on 1370da3; the centring assertion still requires each center to equal the xs probe width (center.spec.ts:50-52) and to sit narrower than its container.

Warnings (non-blocking):
- Criterion 1 is the whole inherited SC3 text; a fix task cannot prove all 22 items. Passed on the reading "the recorded finding is repaired"; the criterion needs tightening for future fix tasks.
- The coder's inference that no painted frame shows the 1024px value is not measured; it does not affect the test criterion.

Contract violations (blocking):
- none (diff: center.spec.ts, in `files`, plus task file with only status/agent/base frontmatter and appended Log lines)

## T033 — Fix wave 2 cycle 1 review findings in T030: pass

- ✅ No item task has to edit the file: the landed stack, center, and static-attributes routes pass the route check and skip without any entry naming their content, and every route that is still a stub runs in full. The Log records the passed and skipped counts of the file in the development and production runs. — commit 7ba7c0b (parent 7dc237d = recorded base) changes apps/yeti-app-e2e/src/fixture-app.spec.ts:319-327: the wrong-key control no longer fetches the live `button` route or aborts the main bundle; it fulfils `**/sub/breakout` with a synthetic document holding `router-outlet` then `<section data-fixture-stub><h2>button</h2></section>`, so it no longer depends on the button stub staying in place, as the finding asked. Log records counts: development 104 passed / 28 skipped, production 104 passed / 28 skipped, `@stub-route-control` 10 passed; orchestrator isolated Verify exit 0.

Warnings (non-blocking):
- The coder notes the attempt-2 Chromium runs may have been Nx cache replays (inferred); the orchestrator's isolated Verify and the wave gate ran uncached and passed.

Contract violations (blocking):
- none (diff: fixture-app.spec.ts, in `files`, plus task file with only status/agent/base frontmatter and appended Log lines)

## Summary for orchestrator

- blocked findings: none
- repeat offenders: none
- warnings worth a human eye: T032 criterion 1 inherits the full SC3 text and is judged only on the repaired finding; floor webkit-26-4 flaked once in setup-boundaries.spec.ts:99 (untouched by this wave) and passed on rerun.
