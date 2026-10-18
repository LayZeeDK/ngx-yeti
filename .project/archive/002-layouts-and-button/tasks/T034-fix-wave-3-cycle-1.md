---
id: T034
title: Fix wave 3 cycle 1 review findings in T009, T010, T011, T012, T013, T014, T015, T016, T017, T018
wave: 7
deps: [T009, T010, T011, T012, T013, T014, T015, T016, T017, T018]
status: done
agent: build_T034
base: 8ace78f9e107a5d3d53d3e0e160fe878248371f8
worktree: null
task_branch: null
files:
  - .claude/skills/ngx-yeti-specs/SKILL.md
  - apps/ngx-yeti-e2e/src/breakout.spec.ts
  - apps/ngx-yeti-e2e/src/cluster.spec.ts
  - apps/ngx-yeti-e2e/src/columns.spec.ts
  - apps/ngx-yeti-e2e/src/cover.spec.ts
  - apps/ngx-yeti-e2e/src/enter.spec.ts
  - apps/ngx-yeti-e2e/src/grid.spec.ts
  - apps/ngx-yeti-e2e/src/layer.spec.ts
  - apps/ngx-yeti-e2e/src/masonry.spec.ts
  - apps/ngx-yeti-e2e/src/overlay.spec.ts
  - apps/ngx-yeti-e2e/src/scroller.spec.ts
  - apps/ngx-yeti-e2e/src/sidebar.spec.ts
  - apps/ngx-yeti-e2e/src/spinner.spec.ts
  - apps/ngx-yeti-e2e/src/timeline.spec.ts
  - apps/ngx-yeti-e2e/src/visually-hidden.spec.ts
  - apps/yeti-app-e2e/src/breakout.spec.ts
  - apps/yeti-app-e2e/src/cluster.spec.ts
  - apps/yeti-app-e2e/src/columns.spec.ts
  - apps/yeti-app-e2e/src/cover.spec.ts
  - apps/yeti-app-e2e/src/enter.spec.ts
  - apps/yeti-app-e2e/src/frame.spec.ts
  - apps/yeti-app-e2e/src/grid.spec.ts
  - apps/yeti-app-e2e/src/layer.spec.ts
  - apps/yeti-app-e2e/src/masonry.spec.ts
  - apps/yeti-app-e2e/src/overlay.spec.ts
  - apps/yeti-app-e2e/src/scroller.spec.ts
  - apps/yeti-app-e2e/src/sidebar.spec.ts
  - apps/yeti-app-e2e/src/spinner.spec.ts
  - apps/yeti-app-e2e/src/support/axe.ts
  - apps/yeti-app-e2e/src/timeline.spec.ts
  - apps/yeti-app-e2e/src/visually-hidden.spec.ts
  - apps/yeti-app/src/app/fixtures/breakout-fixture.ts
  - apps/yeti-app/src/app/fixtures/cluster-fixture.ts
  - apps/yeti-app/src/app/fixtures/columns-fixture.ts
  - apps/yeti-app/src/app/fixtures/cover-fixture.ts
  - apps/yeti-app/src/app/fixtures/enter-fixture.ts
  - apps/yeti-app/src/app/fixtures/frame-fixture.ts
  - apps/yeti-app/src/app/fixtures/grid-fixture.ts
  - apps/yeti-app/src/app/fixtures/layer-fixture.ts
  - apps/yeti-app/src/app/fixtures/masonry-fixture.ts
  - apps/yeti-app/src/app/fixtures/overlay-fixture.ts
  - apps/yeti-app/src/app/fixtures/scroller-fixture.ts
  - apps/yeti-app/src/app/fixtures/sidebar-fixture.ts
  - apps/yeti-app/src/app/fixtures/spinner-fixture.ts
  - apps/yeti-app/src/app/fixtures/timeline-fixture.ts
  - apps/yeti-app/src/app/fixtures/visually-hidden-fixture.ts
  - docs/specs/ledger.md
  - docs/specs/upstream-bugs.md
  - packages/ngx-yeti/accessibility.css
  - packages/ngx-yeti/breakout/README.md
  - packages/ngx-yeti/breakout/src/breakout-child.ts
  - packages/ngx-yeti/breakout/src/breakout-note.ts
  - packages/ngx-yeti/breakout/src/breakout-tokens.ts
  - packages/ngx-yeti/breakout/src/breakout.contract.node.spec.ts
  - packages/ngx-yeti/breakout/src/breakout.spec.ts
  - packages/ngx-yeti/breakout/src/breakout.ssr.spec.ts
  - packages/ngx-yeti/breakout/src/breakout.stories.ts
  - packages/ngx-yeti/breakout/src/breakout.ts
  - packages/ngx-yeti/breakout/src/index.ts
  - packages/ngx-yeti/cluster/README.md
  - packages/ngx-yeti/cluster/src/cluster.contract.node.spec.ts
  - packages/ngx-yeti/cluster/src/cluster.spec.ts
  - packages/ngx-yeti/cluster/src/cluster.ssr.spec.ts
  - packages/ngx-yeti/cluster/src/cluster.stories.ts
  - packages/ngx-yeti/cluster/src/cluster.ts
  - packages/ngx-yeti/cluster/src/index.ts
  - packages/ngx-yeti/columns/README.md
  - packages/ngx-yeti/columns/src/columns-child.ts
  - packages/ngx-yeti/columns/src/columns-tokens.ts
  - packages/ngx-yeti/columns/src/columns.contract.node.spec.ts
  - packages/ngx-yeti/columns/src/columns.spec.ts
  - packages/ngx-yeti/columns/src/columns.ssr.spec.ts
  - packages/ngx-yeti/columns/src/columns.stories.ts
  - packages/ngx-yeti/columns/src/columns.ts
  - packages/ngx-yeti/columns/src/index.ts
  - packages/ngx-yeti/cover/README.md
  - packages/ngx-yeti/cover/src/cover-child.ts
  - packages/ngx-yeti/cover/src/cover-tokens.ts
  - packages/ngx-yeti/cover/src/cover.contract.node.spec.ts
  - packages/ngx-yeti/cover/src/cover.spec.ts
  - packages/ngx-yeti/cover/src/cover.ssr.spec.ts
  - packages/ngx-yeti/cover/src/cover.stories.ts
  - packages/ngx-yeti/cover/src/cover.ts
  - packages/ngx-yeti/cover/src/index.ts
  - packages/ngx-yeti/enter/README.md
  - packages/ngx-yeti/enter/src/enter.contract.node.spec.ts
  - packages/ngx-yeti/enter/src/enter.spec.ts
  - packages/ngx-yeti/enter/src/enter.ssr.spec.ts
  - packages/ngx-yeti/enter/src/enter.stories.ts
  - packages/ngx-yeti/enter/src/enter.ts
  - packages/ngx-yeti/enter/src/index.ts
  - packages/ngx-yeti/frame/README.md
  - packages/ngx-yeti/frame/src/frame.contract.node.spec.ts
  - packages/ngx-yeti/frame/src/frame.spec.ts
  - packages/ngx-yeti/frame/src/frame.ssr.spec.ts
  - packages/ngx-yeti/frame/src/frame.stories.ts
  - packages/ngx-yeti/frame/src/frame.ts
  - packages/ngx-yeti/frame/src/index.ts
  - packages/ngx-yeti/grid/README.md
  - packages/ngx-yeti/grid/src/grid-child.ts
  - packages/ngx-yeti/grid/src/grid-tokens.ts
  - packages/ngx-yeti/grid/src/grid.contract.node.spec.ts
  - packages/ngx-yeti/grid/src/grid.spec.ts
  - packages/ngx-yeti/grid/src/grid.ssr.spec.ts
  - packages/ngx-yeti/grid/src/grid.stories.ts
  - packages/ngx-yeti/grid/src/grid.ts
  - packages/ngx-yeti/grid/src/index.ts
  - packages/ngx-yeti/layer/README.md
  - packages/ngx-yeti/layer/src/index.ts
  - packages/ngx-yeti/layer/src/layer-child.ts
  - packages/ngx-yeti/layer/src/layer-tokens.ts
  - packages/ngx-yeti/layer/src/layer.contract.node.spec.ts
  - packages/ngx-yeti/layer/src/layer.spec.ts
  - packages/ngx-yeti/layer/src/layer.ssr.spec.ts
  - packages/ngx-yeti/layer/src/layer.stories.ts
  - packages/ngx-yeti/layer/src/layer.ts
  - packages/ngx-yeti/lift/src/lift.stories.ts
  - packages/ngx-yeti/masonry/README.md
  - packages/ngx-yeti/masonry/src/index.ts
  - packages/ngx-yeti/masonry/src/masonry.contract.node.spec.ts
  - packages/ngx-yeti/masonry/src/masonry.spec.ts
  - packages/ngx-yeti/masonry/src/masonry.ssr.spec.ts
  - packages/ngx-yeti/masonry/src/masonry.stories.ts
  - packages/ngx-yeti/masonry/src/masonry.ts
  - packages/ngx-yeti/overlay/README.md
  - packages/ngx-yeti/overlay/src/index.ts
  - packages/ngx-yeti/overlay/src/overlay-child.ts
  - packages/ngx-yeti/overlay/src/overlay-tokens.ts
  - packages/ngx-yeti/overlay/src/overlay.contract.node.spec.ts
  - packages/ngx-yeti/overlay/src/overlay.spec.ts
  - packages/ngx-yeti/overlay/src/overlay.ssr.spec.ts
  - packages/ngx-yeti/overlay/src/overlay.stories.ts
  - packages/ngx-yeti/overlay/src/overlay.ts
  - packages/ngx-yeti/scroller/README.md
  - packages/ngx-yeti/scroller/src/index.ts
  - packages/ngx-yeti/scroller/src/scroller.contract.node.spec.ts
  - packages/ngx-yeti/scroller/src/scroller.spec.ts
  - packages/ngx-yeti/scroller/src/scroller.ssr.spec.ts
  - packages/ngx-yeti/scroller/src/scroller.stories.ts
  - packages/ngx-yeti/scroller/src/scroller.ts
  - packages/ngx-yeti/sidebar/README.md
  - packages/ngx-yeti/sidebar/src/index.ts
  - packages/ngx-yeti/sidebar/src/sidebar-child.ts
  - packages/ngx-yeti/sidebar/src/sidebar-tokens.ts
  - packages/ngx-yeti/sidebar/src/sidebar.contract.node.spec.ts
  - packages/ngx-yeti/sidebar/src/sidebar.spec.ts
  - packages/ngx-yeti/sidebar/src/sidebar.ssr.spec.ts
  - packages/ngx-yeti/sidebar/src/sidebar.stories.ts
  - packages/ngx-yeti/sidebar/src/sidebar.ts
  - packages/ngx-yeti/spinner/README.md
  - packages/ngx-yeti/spinner/src/index.ts
  - packages/ngx-yeti/spinner/src/spinner.contract.node.spec.ts
  - packages/ngx-yeti/spinner/src/spinner.spec.ts
  - packages/ngx-yeti/spinner/src/spinner.ssr.spec.ts
  - packages/ngx-yeti/spinner/src/spinner.stories.ts
  - packages/ngx-yeti/spinner/src/spinner.ts
  - packages/ngx-yeti/src/accessibility.node.spec.ts
  - packages/ngx-yeti/src/published-output.node.spec.ts
  - packages/ngx-yeti/timeline/README.md
  - packages/ngx-yeti/timeline/src/index.ts
  - packages/ngx-yeti/timeline/src/timeline.contract.node.spec.ts
  - packages/ngx-yeti/timeline/src/timeline.spec.ts
  - packages/ngx-yeti/timeline/src/timeline.ssr.spec.ts
  - packages/ngx-yeti/timeline/src/timeline.stories.ts
  - packages/ngx-yeti/timeline/src/timeline.ts
  - packages/ngx-yeti/visually-hidden/README.md
  - packages/ngx-yeti/visually-hidden/src/index.ts
  - packages/ngx-yeti/visually-hidden/src/visually-hidden.contract.node.spec.ts
  - packages/ngx-yeti/visually-hidden/src/visually-hidden.spec.ts
  - packages/ngx-yeti/visually-hidden/src/visually-hidden.ssr.spec.ts
  - packages/ngx-yeti/visually-hidden/src/visually-hidden.stories.ts
  - packages/ngx-yeti/visually-hidden/src/visually-hidden.ts
---

# T034 — Fix wave 3 cycle 1 review findings in T009, T010, T011, T012, T013, T014, T015, T016, T017, T018

## Context

Repair task created from the wave 3 cycle 1 review of T009, T010, T011, T012, T013, T014, T015, T016, T017, T018.
The failed criteria and every reviewer observation are recorded verbatim under Review findings.
The source task contracts are unchanged; read them and .project/intent/INTENT.md before editing.

## Approach

- Fix only what the Review findings name, inside the listed files; do not change the source
  tasks' acceptance criteria or interface contracts.
- Re-run the source tasks' Verify commands after the fix and record the result in the Log.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. In Storybook, every story the 22 specs name, except the cases carried to later milestones under Scope: out, and every story case carried over from M001 (`setup--item-links`, card's composite stories with `grid` and `layer`, `lift--default` with its three cards in a `yetiCluster`, and the button-link assertions of card's section 8 markup), passes its play function and the axe gate under `nx test-storybook ngx-yeti`. That includes the exact-formula contrast assertions of A11Y-10a, A11Y-10b, A11Y-10c, and A11Y-21, A11Y-9's anti-pattern story, A11Y-23's `masonry--order` story, the toggle story's 3:1 state contrast for medium and low emphasis (ticket 50 decision 94), and, in `setup--item-links` (setup.md:303), the `stack` and `center` links in `yeti.css` order after either arrival order, equal inline margins on the inner `center`, and both links gone in the frame after the toggle hides the last host. The CSS `:hover` assertions the specs place in play functions (table.md:376, button.md:315, :317, :320) run in layer 2 or 4 under the hover row of the ngx-yeti-specs Departures table (SKILL.md:37). Walkthrough: in the built Storybook, `setup--item-links` shows a `yetiStack` holding a centred `yetiCenter`, and `button--toggle` shows its pressed state.
2. Under `nx e2e ngx-yeti-e2e`, every layer-4 case the 22 specs put on story ids passes (Chromium locally, every CI engine in CI, with each spec's recorded engine limits), including A11Y-22's Shift+Tab walk stacked at 320 x 640 (sidebar.md:308), A11Y-23's `masonry--order`, A11Y-13's single iteration under reduced motion (spinner.md:319, button.md:346), the 200 % zoom and 320 px cases, and scroller's real-key Tab and arrow cases. Walkthrough: on `sidebar--sticky` at 320 x 640, with usage rule 4 followed, Shift+Tab walks back through every link with each focused link at least partly visible (sidebar.md:308).
3. On the Fixture app, each of the 22 items has a prerendered `/<item>` and a server-rendered `/server/<item>` route that passes `yeti-app-e2e` with JavaScript on and off, axe-clean on the `wcagTags` rule set and with no hydration mismatch, plus every other layer-4 Fixture-app case its spec names: the client `@defer` with preload and `hydrate never` cases, the item link removed on leaving the route and re-inserted on return, no horizontal overflow at 320 px where the spec says so, the written-back static attributes (`align`, `border`, `nowrap`, a link's `disabled`) absent from every painted frame, the shared-host cases that keep both links, frame's zero layout shift, table's pinned-head Shift+Tab walk (table.md:416, A11Y-22's table repeat), scroller's focus and scroll position made before hydration surviving it (scroller.md:314), and `enter`'s `once` element keeping `data-once` through hydration and arriving only when scrolled to (enter.md:269). The negative-control routes the specs require (table without `tbody`, table.md:411; center's bordered anti-pattern, center.md:288) are labelled as what not to write, record their logged error or measurement, and are exempt from the no-mismatch and axe checks. The card route shows its cards in a `yetiGrid` with the footer links as `yetiButton`, the setup spec's layer-4 order case passes, and the Tailwind C1 and C2 Fixture build configurations pass (cases carried over from M001). Walkthrough: with JavaScript disabled, `/sub/stack` and `/sub/card` show styled layouts, the card grid lays out its cards in columns, and Tab on `/sub/scroller` focuses the scroller and ArrowRight scrolls it.
4. `apps/ngx-yeti-e2e/src/enter.spec.ts` and `apps/ngx-yeti-e2e/src/visually-hidden.spec.ts` pass in Chromium, Firefox, and WebKit with each spec's engine limits (Firefox 145 without `view()`, WebKit's Tab skip outside Linux).
5. `/sub/cluster` and `/sub/server/cluster` pass the standard Fixture cases, the static `align` shows no painted frame (or the bound-only form ships after an `E8 verdict: fail`), and the shared `yetiCluster yetiEnter` host in `hydrate never` keeps both links.
6. Every layer and overlay story passes its play function and the axe gate, including A11Y-10b's exact-formula caption contrast against the scrim composited on black and on white in both schemes; E7 handled as stated (a rule and ledger update only if the assertion fails), with the ratios in the Log.
7. Every frame story passes its play function and the axe gate, `frame--optimized-image` recording both forms' console output.

## Verify

```bash
set -e
(
npm ci && npx playwright install chromium firefox webkit && test -f packages/ngx-yeti/overlay/src/overlay.stories.ts && test -f packages/ngx-yeti/frame/src/frame.stories.ts && test -f apps/ngx-yeti-e2e/src/enter.spec.ts && test -f apps/yeti-app-e2e/src/cluster.spec.ts && test -f apps/yeti-app-e2e/src/enter.spec.ts && npm exec nx -- run-many -t lint typecheck -p ngx-yeti ngx-yeti-e2e yeti-app yeti-app-e2e && npm exec nx -- test ngx-yeti && npm exec nx -- test-storybook ngx-yeti --skip-nx-cache && node tools/ci-local/run-job.mjs ci unit && npm exec nx -- e2e ngx-yeti-e2e && npm exec nx -- e2e yeti-app-e2e && FIXTURE_CONFIGURATION=production npm exec nx -- e2e yeti-app-e2e && node tools/ci-local/run-job.mjs floor webkit-26-4 && node tools/ci-local/run-job.mjs floor firefox-146-e2e; status=$?; npx --no-install nx daemon --stop; exit $status
); status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Review findings

### sc1
Criterion: In Storybook, every story the 22 specs name, except the cases carried to later milestones under Scope: out, and every story case carried over from M001 (`setup--item-links`, card's composite stories with `grid` and `layer`, `lift--default` with its three cards in a `yetiCluster`, and the button-link assertions of card's section 8 markup), passes its play function and the axe gate under `nx test-storybook ngx-yeti`. That includes the exact-formula contrast assertions of A11Y-10a, A11Y-10b, A11Y-10c, and A11Y-21, A11Y-9's anti-pattern story, A11Y-23's `masonry--order` story, the toggle story's 3:1 state contrast for medium and low emphasis (ticket 50 decision 94), and, in `setup--item-links` (setup.md:303), the `stack` and `center` links in `yeti.css` order after either arrival order, equal inline margins on the inner `center`, and both links gone in the frame after the toggle hides the last host. The CSS `:hover` assertions the specs place in play functions (table.md:376, button.md:315, :317, :320) run in layer 2 or 4 under the hover row of the ngx-yeti-specs Departures table (SKILL.md:37). Walkthrough: in the built Storybook, `setup--item-links` shows a `yetiStack` holding a centred `yetiCenter`, and `button--toggle` shows its pressed state.
- In Storybook, every story the 22 specs name, except the case… — found: `frame--media` fails in Firefox Storybook (ci unit, frame.stories.ts:324) and `overlay--settings` fails intermittently in Chromium (run-many, overlay.stories.ts:345); see T018 and T015. fix: as in T018 criterion 1 and T015 criterion 1.

### sc2
Criterion: Under `nx e2e ngx-yeti-e2e`, every layer-4 case the 22 specs put on story ids passes (Chromium locally, every CI engine in CI, with each spec's recorded engine limits), including A11Y-22's Shift+Tab walk stacked at 320 x 640 (sidebar.md:308), A11Y-23's `masonry--order`, A11Y-13's single iteration under reduced motion (spinner.md:319, button.md:346), the 200 % zoom and 320 px cases, and scroller's real-key Tab and arrow cases. Walkthrough: on `sidebar--sticky` at 320 x 640, with usage rule 4 followed, Shift+Tab walks back through every link with each focused link at least partly visible (sidebar.md:308).
- Under `nx e2e ngx-yeti-e2e`, every layer-4 case the 22 specs… — found: floor webkit-26-4 job fails on apps/ngx-yeti-e2e/src/enter.spec.ts:381 (flaky, 2 of 3 attempts fail); ci e2e otherwise passes every engine except the pre-existing setup-boundaries.spec.ts:99 WebKit flake outside this wave. fix: as in T011 criterion 2.

### sc3
Criterion: On the Fixture app, each of the 22 items has a prerendered `/<item>` and a server-rendered `/server/<item>` route that passes `yeti-app-e2e` with JavaScript on and off, axe-clean on the `wcagTags` rule set and with no hydration mismatch, plus every other layer-4 Fixture-app case its spec names: the client `@defer` with preload and `hydrate never` cases, the item link removed on leaving the route and re-inserted on return, no horizontal overflow at 320 px where the spec says so, the written-back static attributes (`align`, `border`, `nowrap`, a link's `disabled`) absent from every painted frame, the shared-host cases that keep both links, frame's zero layout shift, table's pinned-head Shift+Tab walk (table.md:416, A11Y-22's table repeat), scroller's focus and scroll position made before hydration surviving it (scroller.md:314), and `enter`'s `once` element keeping `data-once` through hydration and arriving only when scrolled to (enter.md:269). The negative-control routes the specs require (table without `tbody`, table.md:411; center's bordered anti-pattern, center.md:288) are labelled as what not to write, record their logged error or measurement, and are exempt from the no-mismatch and axe checks. The card route shows its cards in a `yetiGrid` with the footer links as `yetiButton`, the setup spec's layer-4 order case passes, and the Tailwind C1 and C2 Fixture build configurations pass (cases carried over from M001). Walkthrough: with JavaScript disabled, `/sub/stack` and `/sub/card` show styled layouts, the card grid lays out its cards in columns, and Tab on `/sub/scroller` focuses the scroller and ArrowRight scrolls it.
- On the Fixture app, each of the 22 items has a prerendered `… — found: floor firefox-146-e2e fails the JavaScript-off axe case deterministically on /sub/cluster, /sub/server/cluster (cluster.spec.ts:309, `#arriving-cluster > li`) and /sub/enter, /sub/server/enter (enter.spec.ts:459, `#plain, #slide`). fix: cluster as in T012 criterion 3; enter: in apps/yeti-app-e2e/src/enter.spec.ts:459-466 wait for every `[data-enter]` element (not only `#plain`) to reach opacity 1 before `axeViolations()`, and if `#slide` stays faded with arrivals collapsed, fix apps/yeti-app/src/app/fixtures/enter-fixture.ts so collapsed arrivals end visible (N3). Re-run `node tools/ci-local/run-job.mjs floor firefox-146-e2e`.

### t011_ac2
Criterion: `apps/ngx-yeti-e2e/src/enter.spec.ts` and `apps/ngx-yeti-e2e/src/visually-hidden.spec.ts` pass in Chromium, Firefox, and WebKit with each spec's engine limits (Firefox 145 without `view()`, WebKit's Tab skip outside Linux).
- `apps/ngx-yeti-e2e/src/enter.spec.ts` and `apps/ngx-yeti-e2e/src/visually-hidden.spec.ts` pass in Chromium, Firefox, and WebKit with each spec's engine limits (Firefox 145 without `view()`, WebKit's Tab skip outside Linux). — found: in the floor job webkit-26-4 (D:\projects\github\LayZeeDK\ngx-yeti\tmp\afk-m002\gate-wave3-c1\floor-webkit.log:316-366), apps/ngx-yeti-e2e/src/enter.spec.ts:381 `enter--inserted-preloaded` failed at :434 twice (the `deferred-once` animation started 2 times, expected 1) and passed only on retry #2; Playwright reports it flaky and the job exits non-zero. A `once` element that animates twice also contradicts the case's own claim. fix: capture the retry trace (dist/.playwright/apps/ngx-yeti-e2e/test-output/enter-enter--inserted-prel-*-webkit*/trace.zip) and check whether the second `animationstart` on `deferred-once` coincides with the enter item link or preload stylesheet applying after insertion (WebKit restarting the animation when `animation-name` re-resolves). If it is a test race, start recording after the stylesheet is applied (await the item link `load` before inserting the client-only @defer) in apps/ngx-yeti-e2e/src/enter.spec.ts:381-437; if WebKit 26.4 truly plays it twice, record that as an annotation per engine limit with an upstream-bugs row instead of a flaky assertion. Prove with 20 repeats in `node tools/ci-local/run-job.mjs floor webkit-26-4`.

### t012_ac3
Criterion: `/sub/cluster` and `/sub/server/cluster` pass the standard Fixture cases, the static `align` shows no painted frame (or the bound-only form ships after an `E8 verdict: fail`), and the shared `yetiCluster yetiEnter` host in `hydrate never` keeps both links.
- `/sub/cluster` and `/sub/server/cluster` pass the standard Fixture cases, the static `align` shows no painted frame (or the bound-only form ships after an `E8 verdict: fail`), and the shared `yetiCluster yetiEnter` host in `hydrate never` keeps both links. — found: floor job firefox-146-e2e (D:\projects\github\LayZeeDK\ngx-yeti\tmp\afk-m002\gate-wave3-c1\floor-firefox-e2e.log:36-362) fails deterministically apps/yeti-app-e2e/src/cluster.spec.ts:309 \"with JavaScript off, with the arrivals collapsed, serves server HTML that axe passes\" on both /sub/cluster and /sub/server/cluster: color-contrast on `#arriving-cluster > li:nth-child(1)` (cluster.spec.ts:321). The standard Fixture case (axe-clean with JavaScript off) does not pass in a CI engine. fix: open error-context.md for the run and read the reported foreground/background and opacity: the JS-off arriving `li` is most likely measured mid enter-animation (Firefox 146 has no `view()` timeline, so the fade may sit at its start keyframe). Before `axeViolations()` at cluster.spec.ts:321, wait until every element carrying `data-enter` reports `opacity: 1` (or `document.getAnimations().every(a => a.playState === 'finished')`), as enter.spec.ts:464 does for `#plain`; if the element stays below full opacity with arrivals collapsed, the cluster fixture (apps/yeti-app/src/app/fixtures/cluster-fixture.ts) or the collapse emulation leaves content faded, which is a product failure against N3: fix the fixture so collapsed arrivals end visible. Re-run `node tools/ci-local/run-job.mjs floor firefox-146-e2e`.

### t015_ac1
Criterion: Every layer and overlay story passes its play function and the axe gate, including A11Y-10b's exact-formula caption contrast against the scrim composited on black and on white in both schemes; E7 handled as stated (a rule and ledger update only if the assertion fails), with the ratios in the Log.
- Every layer and overlay story passes its play function and the axe gate, including A11Y-10b's exact-formula caption contrast against the scrim composited on black and on white in both schemes; E7 handled as stated (a rule and ledger update only if the assertion fails), with the ratios in the Log. — found: in the wave gate run-many (D:\projects\github\LayZeeDK\ngx-yeti\tmp\afk-m002\gate-wave3-c1\run-many.log:70-110) `overlay--settings` failed in Chromium at packages/ngx-yeti/overlay/src/overlay.stories.ts:345 (\"fill without over moves nothing\": height 35.66 px off, tolerance 1); a full uncached rerun passed 128/128 (sb-rerun.log). An intermittent play function is not a passing story and fails the `test-storybook` CI job at random. fix: overlay.stories.ts:331-345 captures `inFlow` right after `position` turns `static`, before layout settles (the NG02952 zero-height fill-image warnings in the same log show the image box still resolving). Capture the baseline only after the held child's box is stable: await the held image `complete` and two animation frames (or poll `held.getBoundingClientRect().height` until two reads agree) before `const inFlow`, and do the same after `data-fill` appears before reading `filledInFlow`, or wrap the four expectClose calls in `waitFor`. Prove with 20 repeats of `npm exec nx -- test-storybook ngx-yeti -- overlay/src`.

### t018_ac1
Criterion: Every frame story passes its play function and the axe gate, `frame--optimized-image` recording both forms' console output.
- Every frame story passes its play function and the axe gate, `frame--optimized-image` recording both forms' console output. — found: ci unit job (D:\projects\github\LayZeeDK\ngx-yeti\tmp\afk-m002\gate-wave3-c1\ci-unit.log:639, 1076-1097) fails `frame--media` in Firefox Storybook: packages/ngx-yeti/frame/src/frame.stories.ts:324 `expectFills(objectFrame, object)` reports the `object` top 96 px off the frame (frame.stories.ts:113-114 via :82). The task Verify ran test-storybook in Chromium only, so the Firefox project was never proven. fix: the `<object data=... type=image/svg+xml>` in Firefox is measured before its document loads (Firefox lays out an unloaded object as an inline replaced box, so it is not yet stretched to the frame). In frame.stories.ts before :324, await the object's `load` event (or `waitFor` on `expectFills(objectFrame, object)`), as `imageLoaded` does for the picture; if it still does not fill after load, the frame's child sizing does not cover `object` in Gecko and needs the A11Y-free layout fix in packages/ngx-yeti/frame (or a Departures row if it is Yeti's CSS). Prove with `node tools/ci-local/run-job.mjs ci unit`.

## Log

- 2026-10-11 — created by dispatch_driver.py fix-tasks from wave 3 cycle 1
- 2026-10-11 — build_T034 implementation (base 8ace78f):
  - frame--media (Firefox): Gecko lays out the `object` at no size until its document loads; frame.stories.ts now polls `expectFills(objectFrame, object)` in `waitFor`. It fills after load, so frame needs no product change. Evidence: `run-job.mjs ci unit -- npx nx test-storybook ngx-yeti --skip-nx-cache -- frame/src overlay/src enter/src` in the ci unit container, Chromium, Firefox and WebKit: 12 files, 90 tests passed (frame--media included).
  - overlay--settings (Chromium): the 35.66 px is the held child's block padding, 2 x --yeti-space-md, arriving from box's item file after the in-flow baseline was read. Only the height was off; top, left and width matched. overlay.stories.ts now waits for `itemStylesLoaded('box')` and a non-zero computed `padding-top` on the held child before it measures. Evidence: 20 of 20 native Chromium runs of `vitest run --project=storybook overlay/src` passed, 6 of 6 tests each (tmp/t034/overlay-loop.log).
  - enter--inserted-preloaded (WebKit 26.4): a product defect, not a test race and not an engine limit. A MutationObserver diagnostic over 20 repeats (tmp/t034/wk-repro1.log) failed 5 of 20. In every failure the `deferred-once` host was added with `class="enter"` and no `data-once`, and an `animationstart` fired before `data-once` arrived. The static host class is written when the element is created, but `data-once` only on the first update, so a style resolved in between starts the withheld arrival. enter.ts now binds the class (`'[class.enter]': 'true'`), so both reach the element in one update. SSR markup is unchanged (`class="enter"`). Evidence: `run-job.mjs floor webkit-26-4 -- npx nx e2e ngx-yeti-e2e -- src/enter.spec.ts --repeat-each=20 --retries=0`: 180 passed, 20 skipped (the spec's own engine-limit skips), 0 failed. No upstream-bugs row is needed.
  - Firefox 146 floor, JavaScript-off axe (cluster.spec.ts:309, enter.spec.ts:459): a harness defect, not N3. A diagnostic in the Firefox snapshot (tmp/t034/ff-repro2.log, ff-repro3.log) showed that under Playwright 1.58.2 neither the real page nor the snapshot matches `prefers-reduced-motion: reduce`, even with `test.use({ reducedMotion: 'reduce' })`. The snapshot is a fresh load, so its arrivals were `running` at currentTime 0, opacity 0, when axe read them. On the real JavaScript-off page they end at opacity 1, which the specs already assert, so no content stays hidden. support/axe.ts now waits for every finite animation in the snapshot to finish before axe runs; infinite ones, such as a spinner, are skipped. Evidence: `run-job.mjs floor firefox-146-e2e --matrix shard=1 -- npx nx e2e yeti-app-e2e -- src/cluster.spec.ts src/enter.spec.ts --retries=0`: 44 passed, 0 failed (before the fix, 4 failed).
  - Changed: packages/ngx-yeti/frame/src/frame.stories.ts, packages/ngx-yeti/overlay/src/overlay.stories.ts, packages/ngx-yeti/enter/src/enter.ts, apps/yeti-app-e2e/src/support/axe.ts. Prettier is clean on all four. `nx run-many -t lint typecheck -p ngx-yeti ngx-yeti-e2e yeti-app yeti-app-e2e` passed.
  - Full Verify (tmp/t034/verify.sh, run as written, under the lock; log tmp/t034/verify1.log) did not finish. The npm ci, playwright install, test -f checks, lint and typecheck (4 projects), and `nx test ngx-yeti` (72 files, 547 tests passed) steps all passed. Claude Code then killed the run during `nx test-storybook ngx-yeti --skip-nx-cache` because the machine was critically low on memory. This was not a test failure. The harness says not to restart it while memory may still be short. The Nx daemon was stopped afterwards. The remaining Verify steps have not run: test-storybook, ci unit, both e2e projects, production e2e, floor webkit-26-4 and floor firefox-146-e2e.
- 2026-10-11 — orchestrator Verify (sidecar gsd-path-verify/task-t034-verify): pass, exit 0; output tail:
  ```
  npm warn EBADENGINE Unsupported engine {
  npm warn EBADENGINE   package: 'ng-packagr@22.2.4',
  npm warn EBADENGINE   required: { node: '^22.22.3 || ^24.15.0 || >=26.0.0' },
  npm warn EBADENGINE   current: { node: 'v24.13.0', npm: '11.6.2' }
  npm warn EBADENGINE }
  npm warn EBADENGINE Unsupported engine {
  npm warn EBADENGINE   package: 'npm-package-arg@14.0.0',
  npm warn EBADENGINE   required: { node: '^22.22.2 || ^24.15.0 || >=26.0.0' },
  npm warn EBADENGINE   current: { node: 'v24.13.0', npm: '11.6.2' }
  npm warn EBADENGINE }
  npm warn EBADENGINE Unsupported engine {
  npm warn EBADENGINE   package: 'proc-log@7.0.0',
  npm warn EBADENGINE   required: { node: '^22.22.2 || ^24.15.0 || >=26.0.0' },
  npm warn EBADENGINE   current: { node: 'v24.13.0', npm: '11.6.2' }
  npm warn EBADENGINE }
  npm warn EBADENGINE Unsupported engine {
  npm warn EBADENGINE   package: 'validate-npm-package-name@8.0.0',
  npm warn EBADENGINE   required: { node: '^22.22.2 || ^24.15.0 || >=26.0.0' },
  npm warn EBADENGINE   current: { node: 'v24.13.0', npm: '11.6.2' }
  npm warn EBADENGINE }
  ```
