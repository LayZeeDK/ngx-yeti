# Review — wave 6, cycle 1

Wave verdict: pass
Cycle: 1
Depth: full
Tasks reviewed: 2

Evidence used for every task: the landing commit's patch (`git show <commit>`, read in the primary as read-only Git commands; nothing was reconstructed or re-run because the recorded isolated Verify plus the diff settle each criterion), the orchestrator's isolated Verify entry in each task's Log, and .project/build/verify-ledger.jsonl lines 7 (T033, commit 7ba7c0b, result pass, exit 0) and 8 (T032, commit 54eb119, result pass, exit 0). Base and landing SHAs are the brief's; each landing's parent equals its recorded base (54eb119^ = 958acdf, 7ba7c0b^ = 7dc237d). Each task file changes only `status`, `agent`, `base` (null to the orchestrator values) plus appended Log lines; no contract-body change. The wave 11 gate was not cited (its summary.txt had no `finished` line at review time). Earlier-record reviews were read as context only.

## T032 — Fix wave 2 cycle 1 review findings in T007, T008: pass

Landing 54eb119 on base 958acdf. 1 product path (apps/yeti-app-e2e/src/center.spec.ts), in `files`.

- ✅ On the Fixture app, each of the 22 items has a prerendered `/<item>` and a server-rendered `/server/<item>` route that passes `yeti-app-e2e` with JavaScript on and off, axe-clean on the `wcagTags` rule set and with no hydration mismatch, plus every other layer-4 Fixture-app case its spec names: the client `@defer` with preload and `hydrate never` cases, the item link removed on leaving the route and re-inserted on return, no horizontal overflow at 320 px where the spec says so, the written-back static attributes (`align`, `border`, `nowrap`, a link's `disabled`) absent from every painted frame, the shared-host cases that keep both links, frame's zero layout shift, table's pinned-head Shift+Tab walk (table.md:416, A11Y-22's table repeat), scroller's focus and scroll position made before hydration surviving it (scroller.md:314), and `enter`'s `once` element keeping `data-once` through hydration and arriving only when scrolled to (enter.md:269). The negative-control routes the specs require (table without `tbody`, table.md:411; center's bordered anti-pattern, center.md:288) are labelled as what not to write, record their logged error or measurement, and are exempt from the no-mismatch and axe checks. The card route shows its cards in a `yetiGrid` with the footer links as `yetiButton`, the setup spec's layer-4 order case passes, and the Tailwind C1 and C2 Fixture build configurations pass (cases carried over from M001). Walkthrough: with JavaScript disabled, `/sub/stack` and `/sub/card` show styled layouts, the card grid lays out its cards in columns, and Tab on `/sub/scroller` focuses the scroller and ArrowRight scrolls it. — judged on the part the finding names (the `/server/center` either-order case; the rest belongs to later item tasks, as the finding says). center.spec.ts `expectCentred` now waits `await expect(center).toHaveCSS('max-inline-size', probeMax)` on every center before the one-shot geometry read; the exact-value assertion is kept, only made auto-retrying, and the start/end checks are unchanged. Log: the coder measured the mechanism (first frame after the client `@defer` reads `data-max=null`, 1024px, every later frame 256px; sheet applied, so test-side early read, not loader order) and ran `center.spec.ts --repeat-each=20 --retries=0` in the chromium-production run-job: 480 passed, 0 failed, 40 skipped. Orchestrator isolated Verify exit 0 (ledger line 8), covering Chromium development and production `yeti-app-e2e` center/stack/setup and the Firefox and WebKit run-job legs.
- ✅ `/sub/stack`, `/sub/server/stack`, `/sub/center`, and `/sub/server/center` pass the standard Fixture cases with JavaScript on and off in the development and production builds; the static `align` stack shows no painted frame with `align` (per T003's verdict); the stack-later-in-`@defer` tie and the either-order stack of centers keep every center centred; the `setup-order` case keeps the center centred. — same patch and evidence: the 8-of-20 production failure at center.spec.ts:183 is gone (20 of 20 per route kind, retries off); the isolated Verify runs stack.spec.ts center.spec.ts setup.spec.ts in development and `FIXTURE_CONFIGURATION=production`, exit 0.

Warnings (non-blocking):
- The Log's inference that no painted frame shows 1024px (Angular's tick before paint) is not measured; the criterion is about centring after load, so it does not defeat it.
- The coder's extra full six-combination `ci e2e` run was stopped by host memory and is unproven in the Log; the finding's "full `ci e2e` job passes" was a fix direction, not a criterion.
- Later tasks changed center.spec.ts (ca510a2 T036, 3775a39 T064 and others; 102 lines net vs. this landing). The `toHaveCSS('max-inline-size', probeMax)` wait is still at the tip (center.spec.ts:44).

Contract violations (blocking):
- none

## T033 — Fix wave 2 cycle 1 review findings in T030: pass

Landing 7ba7c0b on base 7dc237d. 1 product path (apps/yeti-app-e2e/src/fixture-app.spec.ts), in `files`.

- ✅ No item task has to edit the file: the landed stack, center, and static-attributes routes pass the route check and skip without any entry naming their content, and every route that is still a stub runs in full. The Log records the passed and skipped counts of the file in the development and production runs. — the wrong-key control ("rejects a stub route that shows another key's h2") no longer fetches the live `button` route or aborts the main bundle; it fulfils `**/sub/breakout` with a synthetic document whose `main` holds `router-outlet` then `<section data-fixture-stub><h2>button</h2></section>`, so it does not depend on a real route staying a stub, and the `stubHeadingMessage` assertion is kept (diff of fixture-app.spec.ts at :319-326). Log: `@stub-route-control` 10 passed; development Chromium 104 passed, 28 skipped; production Chromium 104 passed, 28 skipped; Firefox and WebKit run-job 104/28 each. Orchestrator isolated Verify exit 0 (ledger line 7).

Warnings (non-blocking):
- The coder's attempt-2 Log infers the Chromium runs were Nx cache replays (same durations); the orchestrator's isolated Verify is the evidence and passed.
- Later tasks rewrote parts of fixture-app.spec.ts (e50f98e T046, 2224e29 T052, 3775a39 T064); the synthetic stub document is still at the tip (fixture-app.spec.ts:285).

Contract violations (blocking):
- none

## Summary for orchestrator

- blocked findings: none
- repeat offenders: none
- warnings worth a human eye: T032's full `ci e2e` run was not completed in its own Log (host memory stop); the tip gate covers it once it finishes.
