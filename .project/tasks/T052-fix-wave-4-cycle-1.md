---
id: T052
title: Fix wave 4 cycle 1 review findings in T020, T021, T022, T023, T024, T025, T036, T037, T041, T042, T046
wave: 8
deps: [T020, T021, T022, T023, T024, T025, T036, T037, T041, T042, T046]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - .claude/skills/control-yeti-app/features/build-configurations.md
  - .claude/skills/ngx-yeti-specs/SKILL.md
  - .claude/skills/ngx-yeti-stories/SKILL.md
  - .claude/skills/ngx-yeti-testing/SKILL.md
  - .github/workflows/ci.yml
  - AGENTS.md
  - README.md
  - apps/ngx-yeti-e2e/src/breakout.spec.ts
  - apps/ngx-yeti-e2e/src/button.spec.ts
  - apps/ngx-yeti-e2e/src/card.spec.ts
  - apps/ngx-yeti-e2e/src/cluster.spec.ts
  - apps/ngx-yeti-e2e/src/columns.spec.ts
  - apps/ngx-yeti-e2e/src/container.spec.ts
  - apps/ngx-yeti-e2e/src/cover.spec.ts
  - apps/ngx-yeti-e2e/src/enter.spec.ts
  - apps/ngx-yeti-e2e/src/grid.spec.ts
  - apps/ngx-yeti-e2e/src/icon.spec.ts
  - apps/ngx-yeti-e2e/src/item-styles.ts
  - apps/ngx-yeti-e2e/src/layer.spec.ts
  - apps/ngx-yeti-e2e/src/lift.spec.ts
  - apps/ngx-yeti-e2e/src/masonry.spec.ts
  - apps/ngx-yeti-e2e/src/overlay.spec.ts
  - apps/ngx-yeti-e2e/src/scroller.spec.ts
  - apps/ngx-yeti-e2e/src/sidebar.spec.ts
  - apps/ngx-yeti-e2e/src/spinner.spec.ts
  - apps/ngx-yeti-e2e/src/stack.spec.ts
  - apps/ngx-yeti-e2e/src/timeline.spec.ts
  - apps/ngx-yeti-e2e/src/visually-hidden.spec.ts
  - apps/screen-reader-e2e/project.json
  - apps/screen-reader-e2e/screen-reader.config.mts
  - apps/screen-reader-e2e/src/card.screen-reader.ts
  - apps/screen-reader-e2e/src/focus-guard.nvda.ts
  - apps/screen-reader-e2e/src/support/nvda.ts
  - apps/yeti-app-e2e/playwright.config.mts
  - apps/yeti-app-e2e/src/box.spec.ts
  - apps/yeti-app-e2e/src/breakout.spec.ts
  - apps/yeti-app-e2e/src/button.spec.ts
  - apps/yeti-app-e2e/src/card.spec.ts
  - apps/yeti-app-e2e/src/center.spec.ts
  - apps/yeti-app-e2e/src/cluster.spec.ts
  - apps/yeti-app-e2e/src/columns.spec.ts
  - apps/yeti-app-e2e/src/container.spec.ts
  - apps/yeti-app-e2e/src/cover.spec.ts
  - apps/yeti-app-e2e/src/enter.spec.ts
  - apps/yeti-app-e2e/src/fixture-app.spec.ts
  - apps/yeti-app-e2e/src/frame.spec.ts
  - apps/yeti-app-e2e/src/grid.spec.ts
  - apps/yeti-app-e2e/src/icon.spec.ts
  - apps/yeti-app-e2e/src/layer.spec.ts
  - apps/yeti-app-e2e/src/lift.spec.ts
  - apps/yeti-app-e2e/src/masonry.spec.ts
  - apps/yeti-app-e2e/src/overlay.spec.ts
  - apps/yeti-app-e2e/src/scroller.spec.ts
  - apps/yeti-app-e2e/src/setup-boundaries.spec.ts
  - apps/yeti-app-e2e/src/setup-serving.spec.ts
  - apps/yeti-app-e2e/src/setup.spec.ts
  - apps/yeti-app-e2e/src/sidebar.spec.ts
  - apps/yeti-app-e2e/src/spinner.spec.ts
  - apps/yeti-app-e2e/src/stack.spec.ts
  - apps/yeti-app-e2e/src/static-attributes.spec.ts
  - apps/yeti-app-e2e/src/support/fixtures.ts
  - apps/yeti-app-e2e/src/support/standard-cases.ts
  - apps/yeti-app-e2e/src/support/style-probe.ts
  - apps/yeti-app-e2e/src/table.spec.ts
  - apps/yeti-app-e2e/src/tailwind.spec.ts
  - apps/yeti-app-e2e/src/timeline.spec.ts
  - apps/yeti-app-e2e/src/visually-hidden.spec.ts
  - apps/yeti-app/.postcssrc.json
  - apps/yeti-app/project.json
  - apps/yeti-app/src/app/fixtures/breakout-fixture.ts
  - apps/yeti-app/src/app/fixtures/button-fixture.ts
  - apps/yeti-app/src/app/fixtures/card-fixture.ts
  - apps/yeti-app/src/app/fixtures/container-fixture.ts
  - apps/yeti-app/src/app/fixtures/icon-fixture.ts
  - apps/yeti-app/src/app/fixtures/static-attributes-fixture.ts
  - apps/yeti-app/src/app/fixtures/table-fixture.ts
  - apps/yeti-app/src/styles-tailwind-c1.css
  - apps/yeti-app/src/styles-tailwind-c2.css
  - apps/yeti-app/tailwind-forms.postcss.cjs
  - docs/specs/ledger.md
  - docs/specs/upstream-bugs.md
  - package-lock.json
  - package.json
  - packages/ngx-yeti-testing/README.md
  - packages/ngx-yeti-testing/eslint.config.mjs
  - packages/ngx-yeti-testing/src/index.ts
  - packages/ngx-yeti-testing/src/lib/story-helpers.browser.spec.ts
  - packages/ngx-yeti-testing/src/lib/story-helpers.ts
  - packages/ngx-yeti-testing/src/playwright.ts
  - packages/ngx-yeti-testing/tsconfig.lib.json
  - packages/ngx-yeti/CHANGELOG.md
  - packages/ngx-yeti/box/src/box.stories.ts
  - packages/ngx-yeti/breakout/src/breakout.stories.ts
  - packages/ngx-yeti/button/README.md
  - packages/ngx-yeti/button/src/button-disabled-link.ts
  - packages/ngx-yeti/button/src/button.contract.node.spec.ts
  - packages/ngx-yeti/button/src/button.spec.ts
  - packages/ngx-yeti/button/src/button.ssr.spec.ts
  - packages/ngx-yeti/button/src/button.stories.ts
  - packages/ngx-yeti/button/src/button.ts
  - packages/ngx-yeti/button/src/index.ts
  - packages/ngx-yeti/card/src/card.ssr.spec.ts
  - packages/ngx-yeti/card/src/card.stories.ts
  - packages/ngx-yeti/center/src/center.stories.ts
  - packages/ngx-yeti/cluster/src/cluster.stories.ts
  - packages/ngx-yeti/columns/src/columns.stories.ts
  - packages/ngx-yeti/compile-fixtures/button-disabled-link-not-imported.ts
  - packages/ngx-yeti/container/README.md
  - packages/ngx-yeti/container/src/container-hide.ts
  - packages/ngx-yeti/container/src/container-show.ts
  - packages/ngx-yeti/container/src/container.contract.node.spec.ts
  - packages/ngx-yeti/container/src/container.spec.ts
  - packages/ngx-yeti/container/src/container.ssr.spec.ts
  - packages/ngx-yeti/container/src/container.stories.ts
  - packages/ngx-yeti/container/src/container.ts
  - packages/ngx-yeti/container/src/index.ts
  - packages/ngx-yeti/cover/src/cover.stories.ts
  - packages/ngx-yeti/enter/src/enter.stories.ts
  - packages/ngx-yeti/frame/src/frame.stories.ts
  - packages/ngx-yeti/grid/src/grid.stories.ts
  - packages/ngx-yeti/icon/README.md
  - packages/ngx-yeti/icon/src/icon.contract.node.spec.ts
  - packages/ngx-yeti/icon/src/icon.spec.ts
  - packages/ngx-yeti/icon/src/icon.ssr.spec.ts
  - packages/ngx-yeti/icon/src/icon.stories.ts
  - packages/ngx-yeti/icon/src/icon.ts
  - packages/ngx-yeti/icon/src/index.ts
  - packages/ngx-yeti/layer/src/layer.stories.ts
  - packages/ngx-yeti/lift/src/lift.stories.ts
  - packages/ngx-yeti/masonry/src/masonry.stories.ts
  - packages/ngx-yeti/ngx-yeti-globals.css
  - packages/ngx-yeti/overlay/src/overlay.stories.ts
  - packages/ngx-yeti/scroller/src/scroller.stories.ts
  - packages/ngx-yeti/sidebar/src/sidebar.stories.ts
  - packages/ngx-yeti/spinner/src/spinner.spec.ts
  - packages/ngx-yeti/spinner/src/spinner.ssr.spec.ts
  - packages/ngx-yeti/spinner/src/spinner.stories.ts
  - packages/ngx-yeti/src/accessibility.node.spec.ts
  - packages/ngx-yeti/src/compile-errors.node.spec.ts
  - packages/ngx-yeti/src/item-names.node.spec.ts
  - packages/ngx-yeti/src/published-output.node.spec.ts
  - packages/ngx-yeti/stack/src/stack.stories.ts
  - packages/ngx-yeti/styles/src/setup.stories.ts
  - packages/ngx-yeti/table/README.md
  - packages/ngx-yeti/table/src/index.ts
  - packages/ngx-yeti/table/src/table-cell.ts
  - packages/ngx-yeti/table/src/table-head.ts
  - packages/ngx-yeti/table/src/table-numeric.ts
  - packages/ngx-yeti/table/src/table-tokens.ts
  - packages/ngx-yeti/table/src/table.contract.node.spec.ts
  - packages/ngx-yeti/table/src/table.spec.ts
  - packages/ngx-yeti/table/src/table.ssr.spec.ts
  - packages/ngx-yeti/table/src/table.stories.ts
  - packages/ngx-yeti/table/src/table.ts
  - packages/ngx-yeti/timeline/src/timeline.stories.ts
  - packages/ngx-yeti/visually-hidden/src/visually-hidden.stories.ts
  - references/ci-local.md
  - tools/playwright/playwright-configs.test.mjs
  - tsconfig.base.json
---

# T052 — Fix wave 4 cycle 1 review findings in T020, T021, T022, T023, T024, T025, T036, T037, T041, T042, T046

## Context

Repair task created from the wave 4 cycle 1 review of T020, T021, T022, T023, T024, T025, T036, T037, T041, T042, T046.
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
2. On the Fixture app, each of the 22 items has a prerendered `/<item>` and a server-rendered `/server/<item>` route that passes `yeti-app-e2e` with JavaScript on and off, axe-clean on the `wcagTags` rule set and with no hydration mismatch, plus every other layer-4 Fixture-app case its spec names: the client `@defer` with preload and `hydrate never` cases, the item link removed on leaving the route and re-inserted on return, no horizontal overflow at 320 px where the spec says so, the written-back static attributes (`align`, `border`, `nowrap`, a link's `disabled`) absent from every painted frame, the shared-host cases that keep both links, frame's zero layout shift, table's pinned-head Shift+Tab walk (table.md:416, A11Y-22's table repeat), scroller's focus and scroll position made before hydration surviving it (scroller.md:314), and `enter`'s `once` element keeping `data-once` through hydration and arriving only when scrolled to (enter.md:269). The negative-control routes the specs require (table without `tbody`, table.md:411; center's bordered anti-pattern, center.md:288) are labelled as what not to write, record their logged error or measurement, and are exempt from the no-mismatch and axe checks. The card route shows its cards in a `yetiGrid` with the footer links as `yetiButton`, the setup spec's layer-4 order case passes, and the Tailwind C1 and C2 Fixture build configurations pass (cases carried over from M001). Walkthrough: with JavaScript disabled, `/sub/stack` and `/sub/card` show styled layouts, the card grid lays out its cards in columns, and Tab on `/sub/scroller` focuses the scroller and ArrowRight scrolls it.
3. `npm run check` passes, and every job of `.github/workflows/ci.yml` and `floor.yml` passes both locally and in CI (user ruling 2026-10-10: "The floor job (and all other checks) must pass both locally and in CI for every Milestone and every PR in general."). Locally, the container jobs run through `node tools/ci-local/run-job.mjs` (AGENTS.md "Run CI locally"), including layer 2 in the floor engines (Chromium 141 and Firefox 145, ngx-yeti-specs SKILL.md:36). In CI, the milestone's changes pass every job, the `safari` job (real Safari, ci.yml:90-108) and SC9's `voiceover` job included, before they reach `main`. The macOS-only jobs (`safari`, `voiceover`) are exempt from the local run and pass in CI on every PR; SC9's `nvda` lane is the local screen-reader coverage. The milestone integrates through a pull request to `main` (integration `pull-request`), so `ci.yml` and `floor.yml` run on it and every job passes before the user merges it (user ruling 2026-10-10: "Accept all three recommendations").
4. Every icon story and `button--icon` and `button--rtl` pass their play functions and the axe gate, with exact names, the 24 x 24 target, and the SVG's 3:1 contrast in both schemes; E7 for icon handled (a row and rule only if a check failed).
5. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.
6. With JavaScript on and off, `/sub/card` and `/sub/server/card` show the cards in a `yetiGrid` laid out in columns with `yetiButton` footer links, and every card route case passes in development and production, with the route's item links asserted by containment except where the rank order is the claim.
7. No assertion is weaker and no test is gone: every test that existed still runs with at least the strength of its strongest copy, and the held-out tests of E2, E7, E8, E12, and E15 are in the files PLAN.md names.
8. `npm exec nx -- test-storybook ngx-yeti` passes, and the uncached three-engine unit job passes five times in a row with nothing else running; the Log records the five results.
9. AGENTS.md, `references/ci-local.md`'s job table, and the testing skill give the no-`BROWSERS` run as the local run of the `nvda` job; `focus-guard.nvda.ts` and `card.screen-reader.ts` carry no task id, date, INTENT edge id, or "Not yet measured" comment.
10. `node tools/ci-local/run-job.mjs ci unit` passes 5 times in a row. The Log records each run's result and wall time, and one run's peak container memory.
11. The enter reduced-motion case asserts in Chromium and Firefox that the emulation reached the page, annotates only in WebKit, reads both durations from the token, and passes in the ci e2e containers and the `webkit-26-4` floor job; the `hydrate on viewport` case asserts the block is dehydrated before the scroll.

## Verify

```bash
npm ci && npx playwright install chromium && ! rg -q -F "recorded 2026-10-10" apps/screen-reader-e2e/src/card.screen-reader.ts && npx prettier --check . && npm exec nx -- run-many -t lint typecheck && npm exec nx -- run-many -t test test-storybook --skip-nx-cache --parallel=1 && node tools/ci-local/run-job.mjs ci unit && node tools/ci-local/run-job.mjs ci unit && node tools/ci-local/run-job.mjs ci unit && node tools/ci-local/run-job.mjs ci unit && node tools/ci-local/run-job.mjs ci unit && node tools/ci-local/run-job.mjs ci e2e && node tools/ci-local/run-job.mjs floor webkit-26-4 && node tools/ci-local/run-job.mjs floor firefox-146-e2e; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Review findings

### sc1
Criterion: In Storybook, every story the 22 specs name, except the cases carried to later milestones under Scope: out, and every story case carried over from M001 (`setup--item-links`, card's composite stories with `grid` and `layer`, `lift--default` with its three cards in a `yetiCluster`, and the button-link assertions of card's section 8 markup), passes its play function and the axe gate under `nx test-storybook ngx-yeti`. That includes the exact-formula contrast assertions of A11Y-10a, A11Y-10b, A11Y-10c, and A11Y-21, A11Y-9's anti-pattern story, A11Y-23's `masonry--order` story, the toggle story's 3:1 state contrast for medium and low emphasis (ticket 50 decision 94), and, in `setup--item-links` (setup.md:303), the `stack` and `center` links in `yeti.css` order after either arrival order, equal inline margins on the inner `center`, and both links gone in the frame after the toggle hides the last host. The CSS `:hover` assertions the specs place in play functions (table.md:376, button.md:315, :317, :320) run in layer 2 or 4 under the hover row of the ngx-yeti-specs Departures table (SKILL.md:37). Walkthrough: in the built Storybook, `setup--item-links` shows a `yetiStack` holding a centred `yetiCenter`, and `button--toggle` shows its pressed state.
- every story the 22 specs name passes its play function under `nx test-storybook ngx-yeti` — found: `button--icon` fails at the combined tip in both the native run-many rerun (2.3087 < 3) and ci-unit (2.3098), at packages/ngx-yeti/button/src/button.stories.ts:888-893 (written by T021, 3d85ae1); T026's coder saw it fail once at 2.61. The glyph colour is read with `settledStyle(svgOf(close)).color`, which finishes only the SVG's own animations, while the button's `color` transition (vendor/yeti/src/components/button/button.css:31-34) is still running; `effectiveBackground(close)` settles the button only after the colour was sampled. fix: in button.stories.ts, settle `close` before reading the glyph colour (call `settledStyle(close)` or wait `buttonStyled(close)` first, or make `settledStyle` finish `element.getAnimations({ subtree: true })`), then read `getComputedStyle(svgOf(close)).color`; apply the same ordering to icon.stories.ts:282-284. Re-run `nx test-storybook ngx-yeti` five times uncached and in ci-unit.

### sc3
Criterion: On the Fixture app, each of the 22 items has a prerendered `/<item>` and a server-rendered `/server/<item>` route that passes `yeti-app-e2e` with JavaScript on and off, axe-clean on the `wcagTags` rule set and with no hydration mismatch, plus every other layer-4 Fixture-app case its spec names: the client `@defer` with preload and `hydrate never` cases, the item link removed on leaving the route and re-inserted on return, no horizontal overflow at 320 px where the spec says so, the written-back static attributes (`align`, `border`, `nowrap`, a link's `disabled`) absent from every painted frame, the shared-host cases that keep both links, frame's zero layout shift, table's pinned-head Shift+Tab walk (table.md:416, A11Y-22's table repeat), scroller's focus and scroll position made before hydration surviving it (scroller.md:314), and `enter`'s `once` element keeping `data-once` through hydration and arriving only when scrolled to (enter.md:269). The negative-control routes the specs require (table without `tbody`, table.md:411; center's bordered anti-pattern, center.md:288) are labelled as what not to write, record their logged error or measurement, and are exempt from the no-mismatch and axe checks. The card route shows its cards in a `yetiGrid` with the footer links as `yetiButton`, the setup spec's layer-4 order case passes, and the Tailwind C1 and C2 Fixture build configurations pass (cases carried over from M001). Walkthrough: with JavaScript disabled, `/sub/stack` and `/sub/card` show styled layouts, the card grid lays out its cards in columns, and Tab on `/sub/scroller` focuses the scroller and ArrowRight scrolls it.
- E9 (held-out): assertions on item links use containment, not exact arrays; the Fixture card route passes yeti-app-e2e — found: apps/yeti-app-e2e/src/setup-serving.spec.ts:84 `expect(await itemLinks(page)).toEqual(['card', 'lift'])` fails in every engine and build at the combined tip (received `['grid','button','card','spinner','lift']`) since T025 (9d6d57a) changed the card route; the file was never in T025's `files`, and T025's Verify did not run it. fix: change setup-serving.spec.ts:84 to `expect(await itemLinks(page)).toEqual(expect.arrayContaining(['card', 'lift']))` (or filter to card and lift), in a fix task whose `files` include apps/yeti-app-e2e/src/setup-serving.spec.ts; run yeti-app-e2e in all three engines, development and production.
- enter's once element arrives only when scrolled to, in every engine the floor and CI jobs run — found: apps/yeti-app-e2e/src/enter.spec.ts:598 fails in floor firefox-146-e2e on the prerendered and server-rendered enter routes, every retry, at :616 ("emulated reduce motion reaches the page": false); T046 (e50f98e) turned the earlier annotation into an assertion for Chromium and Firefox; ci e2e Firefox passes; no upstream-bugs or Departures row records the floor Firefox 146 limit. fix: see T046's failed criterion: emulate the preference with `page.emulateMedia({ reducedMotion: motion })` before `goto` and re-measure in floor firefox-146-e2e; if Firefox 146 still ignores it, record an upstream-bugs row and annotate there as for WebKit.

### sc8
Criterion: `npm run check` passes, and every job of `.github/workflows/ci.yml` and `floor.yml` passes both locally and in CI (user ruling 2026-10-10: "The floor job (and all other checks) must pass both locally and in CI for every Milestone and every PR in general."). Locally, the container jobs run through `node tools/ci-local/run-job.mjs` (AGENTS.md "Run CI locally"), including layer 2 in the floor engines (Chromium 141 and Firefox 145, ngx-yeti-specs SKILL.md:36). In CI, the milestone's changes pass every job, the `safari` job (real Safari, ci.yml:90-108) and SC9's `voiceover` job included, before they reach `main`. The macOS-only jobs (`safari`, `voiceover`) are exempt from the local run and pass in CI on every PR; SC9's `nvda` lane is the local screen-reader coverage. The milestone integrates through a pull request to `main` (integration `pull-request`), so `ci.yml` and `floor.yml` run on it and every job passes before the user merges it (user ruling 2026-10-10: "Accept all three recommendations").
- every job of ci.yml and floor.yml passes locally — found: at the combined tip ci `unit` fails (`button--icon`, T021), ci `e2e` fails in every engine and build and floor webkit-26-4 and chromium-141 fail (setup-serving.spec.ts:84, caused by T025's card route), and floor firefox-146-e2e fails (enter.spec.ts:616, T046). fix: the three fixes under SC1 and SC3; then rerun the wave review gate (run-many uncached, ci unit, ci e2e, floor webkit-26-4, floor firefox-146-e2e, firefox-145, chromium-141).

### t021_ac1
Criterion: Every icon story and `button--icon` and `button--rtl` pass their play functions and the axe gate, with exact names, the 24 x 24 target, and the SVG's 3:1 contrast in both schemes; E7 for icon handled (a row and rule only if a check failed).
- Every icon story and `button--icon` and `button--rtl` pass their play functions and the axe gate, with exact names, the 24 x 24 target, and the SVG's 3:1 contrast in both schemes; E7 for icon handled (a row and rule only if a check failed). — found: `button--icon` fails its play function on the combined tip e50f98e, locally and in ci-unit: "expected 2.308694101972498 to be greater than or equal to 3" (ci-unit 2.3098) at packages/ngx-yeti/button/src/button.stories.ts:893. T021 wrote every line of that story (git blame 3d85ae11, button.stories.ts:845-895). Cause, checked in source: line 889-892 reads `contrastRatio(settledStyle(svgOf(close)).color, effectiveBackground(close))`. Arguments evaluate left to right, so the glyph colour is read first, and `settledStyle(svgOf(close))` finishes only the SVG's own animations (none). The SVG's `color` inherits the button's, and Yeti's `.button` transitions `color` over `--yeti-duration-fast` (vendor/yeti/src/components/button/button.css:31-34), so the read can land mid-transition from the inherited text colour. Only the second argument, `effectiveBackground(close)` (button.stories.ts:82-104), finishes the button's transitions, after the colour string was already taken. The waits before it (`buttonStyled(save)`, `itemStyled('icon', save, ...)`, :867-868) wait for the file, not for the transition, and they run on `save`, not `close`. The other parts hold: names "Save"/"Close" exact (:862-863), both classes and presence attributes (:871-876), SVG box within 0.5 px of the host font-size (:879-883), `expectTargetSize(close)` (:886), `button--rtl` icon at inline start and Tab in DOM order (:925-947); E7: T021 Log says nothing was added and the commit touches no ledger, globals, or accessibility spec (stat of 3d85ae11). fix: in the `Icon` story of packages/ngx-yeti/button/src/button.stories.ts, settle the button before reading the glyph colour: `const fill = effectiveBackground(close); const glyph = settledStyle(close).color;` (the SVG draws in `currentColor`, which is the button's settled `color`), then `expect(contrastRatio(glyph, fill)).toBeGreaterThanOrEqual(3)`. Apply the same ordering in packages/ngx-yeti/icon/src/icon.stories.ts:282-284 (`icon--standalone` reads `getComputedStyle(svg).color` before `effectiveBackground(svg)` finishes the ancestors' transitions: the same race, which passed on the tip but is latent). Re-run `nx test-storybook ngx-yeti -- button/src icon/src` locally and in `ci unit` several times.

### t021_ac6
Criterion: `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.
- `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit. — found: the coder's run at the task tree passed (T021 Log, retry entry), but `ngx-yeti:test-storybook` on the combined tip fails `button--icon` (button.stories.ts:893) through the timing race above, which T021's own assertion carries, so the check is not reliably green at the task commit either. Prettier is green on the tip. fix: the same fix as criterion 1; then rerun `npm exec nx -- affected -t lint typecheck test test-storybook --base=<fix>~1 --head=<fix>`.

### t025_ac2
Criterion: With JavaScript on and off, `/sub/card` and `/sub/server/card` show the cards in a `yetiGrid` laid out in columns with `yetiButton` footer links, and every card route case passes in development and production, with the route's item links asserted by containment except where the rank order is the claim.
- With JavaScript on and off, `/sub/card` and `/sub/server/card` show the cards in a `yetiGrid` laid out in columns with `yetiButton` footer links, and every card route case passes in development and production, with the route's item links asserted by containment except where the rank order is the claim. — found: the grid, the columns, and the button footer links are delivered and tested with JS on and off on both route kinds (card-fixture.ts `ul yetiGrid`, `a yetiButton`; yeti-app-e2e card.spec.ts new "lays the lifted cards out in the columns of a grid..." cases; Verify card.spec.ts and fixture-app.spec.ts pass in development and production Chromium and in Firefox/WebKit containers). But one card route case was not moved to containment and now fails: apps/yeti-app-e2e/src/setup-serving.spec.ts:84, "the strict-CSP card route > carries the nonce on every item link and inlined style with no violation" (`page.goto('server/card?csp')`), still asserts `expect(await itemLinks(page)).toEqual(['card', 'lift'])` and receives `['grid','button','card','spinner','lift']`. Combined-tip gate: it fails in every engine and build (ci e2e and the floor jobs), on all retries. T025's change to the card route causes it (card-fixture.ts adds `yetiGrid` and `yetiButton`); T025's Verify ran only card.spec.ts and fixture-app.spec.ts, and setup-serving.spec.ts is not in T025's `files`, so the coder could not fix it. fix: in a fix task whose `files` include `apps/yeti-app-e2e/src/setup-serving.spec.ts`, change line 84 to `expect(await itemLinks(page)).toEqual(expect.arrayContaining(['card', 'lift']))` (INTENT E9, LESSONS: containment, not exact arrays); the nonce checks below it already cover every item link generically. Re-run `npm exec nx -- e2e yeti-app-e2e -- setup-serving.spec.ts` in development and production (and one container leg) as the fix task's Verify. Line 62 (the dev server's setup route, still `['card','lift']`) passes today but has the same E9 shape; move it to containment in the same edit.

### t036_ac4
Criterion: No assertion is weaker and no test is gone: every test that existed still runs with at least the strength of its strongest copy, and the held-out tests of E2, E7, E8, E12, and E15 are in the files PLAN.md names.
- No assertion is weaker and no test is gone: every test that existed still runs with at least the strength of its strongest copy, and the held-out tests of E2, E7, E8, E12, and E15 are in the files PLAN.md names. — found: the center and stack routes' leave-and-return tests lost the check that the other item's link leaves too.

### t037_ac3
Criterion: `npm exec nx -- test-storybook ngx-yeti` passes, and the uncached three-engine unit job passes five times in a row with nothing else running; the Log records the five results.
- `npm exec nx -- test-storybook ngx-yeti` passes, and the uncached three-engine unit job passes five times in a row with nothing else running; the Log records the five results. — found: the five results recorded in the T037 Log (2026-10-11, "proof under load") are run 1 exit 1, run 2 exit 1, run 3 exit 1, run 4 exit 1, run 5 exit 0. The same entry says "nothing else running" did not hold (sibling coders T035 and T041 were active).

### t041_ac8
Criterion: AGENTS.md, `references/ci-local.md`'s job table, and the testing skill give the no-`BROWSERS` run as the local run of the `nvda` job; `focus-guard.nvda.ts` and `card.screen-reader.ts` carry no task id, date, INTENT edge id, or "Not yet measured" comment.
- AGENTS.md, `references/ci-local.md`'s job table, and the testing skill give the no-`BROWSERS` run as the local run of the `nvda` job; `focus-guard.nvda.ts` and `card.screen-reader.ts` carry no task id, date, INTENT edge id, or "Not yet measured" comment. — found: the docs part holds (AGENTS.md:251, ci-local.md job table row, ngx-yeti-testing SKILL.md:108), but card.screen-reader.ts:11-12 still carries a date, unchanged by the landing and still present at 1275610: "// NVDA 2026.2 in Edge 154 and Playwright's Chromium 153 and Firefox 155, // recorded 2026-10-10." fix: in apps/screen-reader-e2e/src/card.screen-reader.ts drop "recorded 2026-10-10" from the comment above `nvda:` (keep the versions if wanted, e.g. "NVDA 2026.2 in Edge 154 and Playwright's Chromium 153 and Firefox 155. Down from the start marker ..."); optionally add `! rg -q "20[0-9]{2}-[0-9]{2}-[0-9]{2}" apps/screen-reader-e2e/src/card.screen-reader.ts apps/screen-reader-e2e/src/focus-guard.nvda.ts` to the Verify.

### t042_ac3
Criterion: `node tools/ci-local/run-job.mjs ci unit` passes 5 times in a row. The Log records each run's result and wall time, and one run's peak container memory.
- `node tools/ci-local/run-job.mjs ci unit` passes 5 times in a row. The Log records each run's result and wall time, and one run's peak container memory. — found: 5 of 5 passes recorded (ledger line 17 exit 0; Log wall times 167, 108, 109, 111, 114 s), but both coder entries say "Peak container memory was not captured" / "Peak container memory not sampled". fix: rerun `node tools/ci-local/run-job.mjs ci unit` once at this tip while sampling `docker stats --no-stream` every few seconds, and append the peak (expected about 8 to 9 GiB; about 14 GiB means a setting did not reach the container) to T042's Log.

### t046_ac3
Criterion: The enter reduced-motion case asserts in Chromium and Firefox that the emulation reached the page, annotates only in WebKit, reads both durations from the token, and passes in the ci e2e containers and the `webkit-26-4` floor job; the `hydrate on viewport` case asserts the block is dehydrated before the scroll.
- The enter reduced-motion case asserts in Chromium and Firefox that the emulation reached the page, annotates only in WebKit, reads both durations from the token, and passes in the ci e2e containers and the `webkit-26-4` floor job; the `hydrate on viewport` case asserts the block is dehydrated before the scroll. — found: the code side holds (enter.spec.ts at e50f98e: `browserName !== 'webkit'` asserts `reduced` with message "emulated ${motion} motion reaches the page", WebKit-only annotation, `tokenSeconds(page, '--yeti-enter-duration')` for both durations, `hasDirectives(section)` false before the scroll in development), and the ci e2e containers and webkit-26-4 passed (Verify). But the new Firefox assertion fails in `floor.yml` `firefox-146-e2e` (Playwright 1.58.2's bundled Firefox 146) in both route kinds on every retry: apps/yeti-app-e2e/src/enter.spec.ts:616 "emulated reduce motion reaches the page" expected true, received false (combined-tip gate, leg 1). Before T046 the same test annotated instead of asserting in every engine, so this landing made a floor job fail. No ledger or upstream-bugs row records it: O13 is about the WebDriver BiDi channels (`moz-firefox`), and firefox-146-e2e runs the bundled Juggler Firefox (floor.yml:88-119). AGENTS.md requires every floor.yml job to pass. fix: the app half sets motion through the context option `test.use({ reducedMotion: motion })`; the Storybook half (apps/ngx-yeti-e2e/src/enter.spec.ts:207 and :270) calls `page.emulateMedia({ reducedMotion: 'reduce' })` and passes in firefox-146-e2e. In the app test, call `await page.emulateMedia({ reducedMotion: motion })` before `page.goto` (keep the `test.use`, or drop it), then run `node tools/ci-local/run-job.mjs floor firefox-146-e2e` on enter.spec.ts. If the emulation still does not reach Firefox 146, measure it with a probe and record it as an upstream-bugs row. Then extend the annotation branch to the floor Firefox run only (`process.env['FLOOR_FIREFOX_E2E'] === 'true'`), and keep the assertion for ci e2e Firefox. (That emulateMedia fixes it is inferred from the Storybook half passing. It has not been measured.)

## Log

- 2026-10-13 — created by dispatch_driver.py fix-tasks from wave 4 cycle 1
- 2026-10-13 — orchestrator: plan-defect repair (Verify and files). The generated Verify chained the 11 source tasks' whole Verifies with a trailing '&&' before each ')' (a shell syntax error) and ran none of the gate's failing jobs together; the new Verify runs prettier, lint and typecheck, the uncached test and test-storybook suites, five ci unit runs (criteria 8 and 10), ci e2e, floor webkit-26-4 and floor firefox-146-e2e, the jobs the wave 4 gate failed in. files gains docs/specs/upstream-bugs.md for a Firefox 146 limit if the enter case needs a row. Gate evidence: tmp/afk-m002/gate-wave4-c1/.
- 2026-10-13 — coder build_T052: implementation. sc1/t021_ac1/t021_ac6: button.stories.ts `Icon` now reads `effectiveBackground(close)` (which finishes the button's colour transition) before `settledStyle(svgOf(close)).color`; icon.stories.ts `icon--standalone` loop reads `effectiveBackground(svg)` before `getComputedStyle(svg).color`. sc3/t025_ac2 (E9): setup-serving.spec.ts lines 62 and 84 assert `expect.arrayContaining(['card', 'lift'])`. sc3/t046_ac3: yeti-app-e2e enter.spec.ts reduced-motion case calls `page.emulateMedia({ reducedMotion: motion })` before `goto` (test.use kept); measured first in `run-job.mjs floor firefox-146-e2e --matrix shard=1 -- npx nx e2e yeti-app-e2e -- enter.spec.ts --grep "reduce motion|no-preference motion"`: 4 passed (both route kinds, both motions), so the Chromium/Firefox assertion stays and no upstream-bugs row or floor annotation is needed. t036_ac4: standard-cases.ts gains an `afterLeave` hook run after the item link is gone; stack.spec.ts and center.spec.ts pass `stackAndCenterLinks(page)` polled to `[]`, restoring the pre-T036 check that the other item's link leaves too. t041_ac8: card.screen-reader.ts comment drops "recorded 2026-10-10" (no date, task id, edge id or "Not yet measured" left in it or focus-guard.nvda.ts, checked with rg).
- 2026-10-13 — coder build_T052: Verify (as written, through heavy-lock, 07:41:29-08:21:07) exit 0. prettier clean; run-many lint typecheck: 8 projects OK; run-many test test-storybook --skip-nx-cache: 5 projects OK (button--icon and icon stories pass). ci unit x5, all exit 0 (t037_ac3 five results, t042_ac3 runs), wall times start-to-finish 155 s, 125 s, 122 s, 132 s, 125 s; each run 99 + 504 + 1711 + 1 + 1 tests passed. ci e2e 12 legs all OK: chromium dev 152+618 passed, prod 559 passed/61 skipped, c1 8, c2 8; firefox dev 152+616, prod 557/63 skipped, c1 8, c2 8; webkit dev 144+612, prod 553/67 skipped, c1 8, c2 8 (0 failed, setup-serving.spec.ts included). floor webkit-26-4: unit OK, e2e 136 + 608 passed. floor firefox-146-e2e: shard 1 76 + 308 passed, shard 2 76 + 308 passed (enter.spec.ts reduced-motion included). Nothing else held the lock during the run.
- 2026-10-13 — coder build_T052: t042_ac3 peak container memory, `docker stats --no-stream` sampled every ~3 s through the five ci unit runs: peaks 9.70, 9.28, 9.14, 9.28, 8.98 GiB of an 11.66 GiB limit (in the expected 8-9 GiB band, not 14 GiB). The T037 and T042 Logs are outside this task's files; the orchestrator copies these results there if wanted.
- 2026-10-13 — coder build_T052: rule-13 check `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD` (through the lock): 6 projects OK (697 + 168 + 1 tests passed). The source tasks' own Verifies were not re-run one by one; the orchestrator's Verify above runs the jobs the wave 4 gate failed (it omits floor firefox-145 and chromium-141, which the sc8 finding also names for the wave review rerun).
- 2026-10-13 — orchestrator Verify (isolate gsd-path-task/T052): fail, exit 1; output tail:
  ```
  npm warn allow-scripts   esbuild@0.25.12 (postinstall: node install.js)
  npm warn allow-scripts
  npm warn allow-scripts Run `npm approve-scripts --allow-scripts-pending` to review, or `npm approve-scripts <pkg>` to allow.
  
  [7m[1m[31m NX [39m[22m[27m  [31mRunning targets [1mtest[22m, [1mtest-storybook[22m for 5 projects and [1m2[22m tasks they depend on failed[39m
  
  [2mFailed tasks:[22m
  
  [2m-[22m @ngx-yeti/source:test
  
  [2mOutput of 7 successful tasks were not shown. Run with[22m --verbose [2mor[22m --output-style=static [2mto see it.[22m
  
  
  [7m[1m[33m NX [39m[22m[27m  [33mNx detected 2 flaky tasks[39m
  
    @ngx-yeti/source:test
    yeti-app:test
  
  Flaky tasks can disrupt your CI pipeline. Automatically retry them with Nx Cloud. Learn more at https://nx.dev/ci/features/flaky-tasks
  ```
- 2026-10-13 — orchestrator: attempt 1 rejected by finish (Verify failed in the isolate): the only failure was tools/playwright-server/container.test.mjs:279 ('run-server did not answer' at 25.5 s) in the uncached run-many, a file outside this task; it passes 5/5 alone at ~6.3 s (measured). Plan-defect repair (Verify only): the uncached test and test-storybook run takes --parallel=1, as ci.yml's unit job does (T042's measured fix for a runner overloading itself). Attempt 1 saved at tmp/afk-m002/tools/T052-attempt1.patch (8 product files); retry reapplies it.
