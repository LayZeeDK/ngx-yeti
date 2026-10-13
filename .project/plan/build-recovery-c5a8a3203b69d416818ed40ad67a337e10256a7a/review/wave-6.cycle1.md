# Review — wave 6, cycle 1

Wave verdict: pass
Cycle: 1
Depth: full
Tasks reviewed: 2

## T032 — Fix wave 2 cycle 1 review findings in T007, T008: pass

Landing 54eb1197fbdd19cbc466d1b135540791f1a5d324, parent 958acdff276cad929a0bcc8b481fe314bf8c43a2 equals the recorded base. Product diff: apps/yeti-app-e2e/src/center.spec.ts only.

- ✅ On the Fixture app, each of the 22 items has a prerendered `/<item>` and a server-rendered `/server/<item>` route that passes `yeti-app-e2e` with JavaScript on and off, axe-clean on the `wcagTags` rule set and with no hydration mismatch, plus every other layer-4 Fixture-app case its spec names: the client `@defer` with preload and `hydrate never` cases, the item link removed on leaving the route and re-inserted on return, no horizontal overflow at 320 px where the spec says so, the written-back static attributes (`align`, `border`, `nowrap`, a link's `disabled`) absent from every painted frame, the shared-host cases that keep both links, frame's zero layout shift, table's pinned-head Shift+Tab walk (table.md:416, A11Y-22's table repeat), scroller's focus and scroll position made before hydration surviving it (scroller.md:314), and `enter`'s `once` element keeping `data-once` through hydration and arriving only when scrolled to (enter.md:269). The negative-control routes the specs require (table without `tbody`, table.md:411; center's bordered anti-pattern, center.md:288) are labelled as what not to write, record their logged error or measurement, and are exempt from the no-mismatch and axe checks. The card route shows its cards in a `yetiGrid` with the footer links as `yetiButton`, the setup spec's layer-4 order case passes, and the Tailwind C1 and C2 Fixture build configurations pass (cases carried over from M001). Walkthrough: with JavaScript disabled, `/sub/stack` and `/sub/card` show styled layouts, the card grid lays out its cards in columns, and Tab on `/sub/scroller` focuses the scroller and ArrowRight scrolls it. — the carried failure (center either-order case flaking in chromium production) is repaired: `expectCentred` (center.spec.ts at 54eb119, the loop after the probe read) now waits per center with `await expect(center).toHaveCSS('max-inline-size', probeMax)` before the one-shot geometry read; the equality to the probe value is kept, start/end checks unchanged, so the assertion is not loosened. Coder Log records a per-frame measurement (first frame lacks bound `data-max`, test read early) and 20/20 per route kind with `--retries=0` in the chromium-production ci-local job. Orchestrator isolated Verify (sidecar task-t032-verify): exit 0, covering center/stack/setup e2e in Chromium dev and prod plus Firefox/WebKit dev. The rest of this criterion covers items owned by other tasks and is not touched by this diff.
- ✅ `/sub/stack`, `/sub/server/stack`, `/sub/center`, and `/sub/server/center` pass the standard Fixture cases with JavaScript on and off in the development and production builds; the static `align` stack shows no painted frame with `align` (per T003's verdict); the stack-later-in-`@defer` tie and the either-order stack of centers keep every center centred; the `setup-order` case keeps the center centred. — same repair; orchestrator Verify exit 0 runs stack.spec.ts, center.spec.ts, setup.spec.ts in development and `FIXTURE_CONFIGURATION=production`, and in Firefox and WebKit via run-job.

Warnings (non-blocking):
- The finding's fix direction asked for the full six-combination `ci e2e` job; the Log says that run was stopped by the host for low memory and not restarted. The task Verify (which passed) covers the affected combinations, but the full job is unproven by this task.
- Later commits changed apps/yeti-app-e2e/src/center.spec.ts after 54eb119 (104 lines changed up to HEAD e50f98e); judged at the landing commit only.

Contract violations (blocking):
- none (changed paths: the declared center.spec.ts plus the task file; task-file changes are orchestrator fields status/agent/base and append-only Log)

## T033 — Fix wave 2 cycle 1 review findings in T030: pass

Landing 7ba7c0b8150232128b16b28f5c6811c23b00a781, parent 7dc237d9053268726cd9c37d88a75605e5abfcea equals the recorded base. Product diff: apps/yeti-app-e2e/src/fixture-app.spec.ts only.

- ✅ No item task has to edit the file: the landed stack, center, and static-attributes routes pass the route check and skip without any entry naming their content, and every route that is still a stub runs in full. The Log records the passed and skipped counts of the file in the development and production runs. — the wrong-key control ("rejects a stub route that shows another key's h2", fixture-app.spec.ts:318-331 at 7ba7c0b) now fulfils `**/sub/breakout` with a synthetic status-200 document holding `router-outlet` then `<section data-fixture-stub><h2>button</h2></section>`, and still asserts `rejects.toThrow(stubHeadingMessage)`; it no longer depends on the live button route staying a stub, so the button task need not edit the file. Skipping stays marker-based (`expectFixtureRoute` returns false when `[data-fixture-stub]` is absent, :213-215); `stubRoutes` is the registry list, not a per-content entry. Log records counts: dev Chromium 104 passed / 28 skipped, production 104 / 28, Firefox and WebKit dev 104 / 28, `@stub-route-control` 10 passed. Orchestrator isolated Verify (sidecar task-t033-verify): exit 0.

Warnings (non-blocking):
- Coder notes the Chromium runs may have been Nx cache replays (inferred); the orchestrator Verify ran in its own sidecar and exited 0.
- Later commits changed apps/yeti-app-e2e/src/fixture-app.spec.ts after 7ba7c0b (190 lines changed up to HEAD e50f98e, including T046); judged at the landing commit only.

Contract violations (blocking):
- none (changed paths: the declared fixture-app.spec.ts plus the task file; task-file changes are orchestrator fields and append-only Log)

## Summary for orchestrator

- blocked findings: none
- repeat offenders: none
- warnings worth a human eye: T032's full six-combination `ci e2e` job was not proven by the task (host memory stop); the CI-local gate should cover it.
