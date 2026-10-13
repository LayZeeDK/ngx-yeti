# Plan — ngx-yeti M002 layouts-and-button

Project verify: `npm ci && npx playwright install chromium && npx prettier --check . && npm run check && npm exec nx -- run-many -t build pack-check && node tools/ci-local/run-job.mjs ci unit && node tools/ci-local/run-job.mjs ci e2e && node tools/ci-local/run-job.mjs floor webkit-26-4 && node tools/ci-local/run-job.mjs floor firefox-146-e2e && FLOOR_FIREFOX=true npm exec nx -- test ngx-yeti -- --project=browser && BROWSERS=msedge npm exec nx -- run screen-reader-e2e:nvda && export FLOOR_CHROMIUM_PATH="$(npx --no-install @puppeteer/browsers install chrome@141.0.7390.54 --path "$(pwd)/tmp/floor-chrome" | awk '{print $2}')" && npm exec nx -- test ngx-yeti -- --project=browser && npm exec nx -- run-many -t e2e -p ngx-yeti-e2e yeti-app-e2e`

This is INTENT SC8's local set: `npm run check`, the `static` and `package` jobs, every container job of `ci.yml` and `floor.yml` through `tools/ci-local/run-job.mjs` (the `e2e` job runs every engine and configuration, the Tailwind ones included once T024 adds them), the native `firefox-145` and `chromium-141` floor jobs, and the `nvda` lane. The macOS-only `safari` and `voiceover` jobs pass in CI on the milestone's pull request (integration `pull-request`).

## Config

- max_review_cycles: 3
- wave_budget: none
- review_panel: off
- finding_skeptics: off

## Wave review gate

Before each wave's review, the orchestrator runs an integrated, uncached check on the wave's combined tip, because parallel tasks that share a route, a registry, or an engine-specific behaviour pass alone and fail together (LESSONS.md): `npm exec nx -- run-many -t lint typecheck test test-storybook --skip-nx-cache`; the e2e projects the wave touched through the ci-local container jobs in Chromium, Firefox, and WebKit (`node tools/ci-local/run-job.mjs ci e2e` with the matching `--matrix engine=` and `--matrix configuration=` values) and `node tools/ci-local/run-job.mjs ci unit`; and the floor jobs that run those tests (`node tools/ci-local/run-job.mjs floor webkit-26-4`, `node tools/ci-local/run-job.mjs floor firefox-146-e2e`, and `firefox-145` and `chromium-141` natively when the wave adds layer-2 tests). Measured reason (orchestrator, 2026-10-10): M001's integration commit 04c74ac landed on main with CI red (run 37180509152): `card--stretched-link` failed in Firefox ("focus has left the card") and the real-Safari job failed lift.spec.ts's hover case, because only Chromium ran locally. Real Safari and VoiceOver stay CI-only (INTENT SC8) and are first measured on the milestone's pull request. Item tasks whose own cases are engine-specific (hover, focus, forced colours, Tab, reduced motion) also run their e2e specs in Firefox and WebKit through `run-job.mjs` in their Verify.

## Wave 1 — risk burn-down

Goal: Prove the plan-invalidating unknowns before any item builds on them. T001 generates all 22 entry points and proves that entry points exporting nothing build, pack, and type-check, so later item tasks never share tsconfig.base.json. T002 registers every M002 Fixture route behind stubs, grows the one preload list to every M002 item but enter (E9), turns the exact-array preload assertions into containment checks, and settles E15 with a Departures row (enter measured without the preload on the Fixture app, with it on the story `enter--inserted-preloaded`). T003 measures in three engines whether a written-back static attribute ever paints (E8, ticket 50 decision 9); a fail switches the nine removed-kind specs to bound-only inputs before any of them is written. T004 proves Guidepup driving NVDA on this Windows 11 ARM64 machine with a native arm64 browser and adds the `voiceover` (macos-26, real Safari) and `nvda` (windows-2025) jobs and their Nx project, with card's list check; an NVDA failure here escalates to the user before T027. T005 and T006 generate the two control skills reviewers use for the Surface contract walkthroughs.
Review depth: full

## Wave 2 — walking skeleton

Goal: The thinnest slice on real items: stack and center at their entry points with stories and the axe gate, layer-2, layer-3, and contract specs, prerendered and server-rendered Fixture routes with JavaScript on and off, the packed consuming build, README and changelog entries, `setup--item-links` proving Yeti's rank order for the tied pair (E1), the setup spec's order case, and the negative-compile check for center's `max="large"` (T007); then box with its three markers, completing stack's and center's box compositions and center's A11Y-9 story and route (T008). Build repair (user ruling 2026-10-11, "Wave-1 defects: Approve recommendation."): three fix tasks for the four confirmed wave 1 defects, none of which broke a criterion of a landed task, land and are reviewed in this wave, before wave 3 relies on what they repair: control-yeti-app's `doctor` reports a stale server build after a library edit, and its `down` keeps its state file when the teardown is incomplete (T029); the stub-route tests fail for a missing or broken route instead of skipping, with an automated negative control (T030); and the NVDA lane checks the foreground window before every key, with an automated test that the guard refuses a wrong window (T031, dispatched alone because real NVDA takes the desktop). The three own no INTENT success criterion.
Review depth: full

## Wave 3 — layouts, spinner, and scroller

Goal: Every item that needs only the skeleton, in parallel where files allow: breakout and timeline with A11Y-10c and A11Y-10a (T009), grid and masonry with A11Y-23 (T010), enter and visually-hidden with enter's held-bundle and preload cases (T011), cluster with the lift carry-over (T012, after T009 and T011), sidebar with A11Y-22 and the sidebar-with-center order case (T013), cover and columns (T014), layer and overlay with A11Y-10b (T015, after T009), spinner with A11Y-13 and the owner of E7 (T016, after T015), scroller (T017), frame with its upstream-bugs row (T018, after T009 and T013), then the consumer build, name-collision list, README, and changelog for all fifteen (T019).
Review depth: full

## Wave 4 — button, icon, table, container, and carry-overs

Goal: Build repair first (user rulings of 2026-10-11, quoted in each task), as the wave's first dependency layers: the reset case of setup-boundaries records WebKit's pending-sheet frames, with upstream row O17 (T035); both e2e apps share the layer-4 geometry, sheet-applied, standard-route, and styled-frame helpers (T036, after T035); the stories share their helpers and wait for applied styles with a longer poll (T037); layers 2 and 3 share the directive host, the server-render readers, and Yeti's gap and width lists (T038, after T036); the entry-point export rule, the audited Departures rows, the ledger-keyed selector table of the published-output check, and the primary-entry check are recorded (T039, after T035); enter's `once` is withheld for named arrivals by one package rule with a test that fails when Yeti fixes its bug, ledger row A11Y-33, and a corrected row Y14 (T040, after T036, T038, and T039); and the NVDA lane passes in Firefox after Chromium (T041, dispatched alone). Second build repair (user rulings of 2026-10-12, quoted in each task), also in the wave's first layers: the `ci.yml` `unit` job runs its tasks one at a time with two Vitest pages per engine, the measured fix for the job overloading its own runner (T042, first; T037 after it); and `run-job.mjs` runs a job's matrix legs concurrently, capped by measured memory, with a local e2e worker count and a build-only Nx cache where each shows a gain (T043, after T042). These nine own no INTENT success criterion. Third build repair (review round 1 and the security review of 2026-10-12, triaged by the orchestrator), at the end of the wave after the tasks whose files they share: the published-output and accessibility gates walk selectors nested in `:where()`, `:is()`, `:not()`, and `:has()`, and enter's `once` latches when it turns false (T044, after T020, T021, and T023); the story and layer-2 checks the review found unable to fail assert what their specs ask (T045, after T020 and T037); the stub-route, reduced-motion, held-frame, and Storybook e2e checks fail when they should, and a Departures row records the client-only preload cases (T046, after T020 to T023 and T025); both control scripts check their recorded session name, refuse unknown flags, report close failures, scan every source of their builds, and run with the Nx daemon on (T047); and the html and Playwright helpers prove they can fail, with the testing skill brought up to date (T048, after T024). These five own no INTENT success criterion. In the same repair, on the user's rulings of 2026-10-12 ("Rename accessibility.css to a broader term but not package.css. something like ngx-yeti-globals.css?" and "If it's a global stylesheet the consumer has to load explicitly, use an `ngx-yeti-` prefix"), the package stylesheet becomes `packages/ngx-yeti/ngx-yeti-globals.css`, published as "ngx-yeti/ngx-yeti-globals.css", with every reference and a Departures row (T049, first: every pending wave-4 task that shares a file with it follows it). It owns no INTENT success criterion. Fourth build repair (2026-10-13, from T025's measured block and the user's rulings on scripts quoted in T051): the loader removes no link the server wrote before the hydrating application has settled, so hydration on the button route adds and removes no item link (T050; T025 follows it); and AGENTS.md gains the Scripts section (T051). These two own no INTENT success criterion. Then, on those helpers and records: button and `YetiButtonDisabledLink` with A11Y-1a (SC6), event replay (SC7, E6), and the NG8002 check, delivering the Storybook stories surface (T020); icon with button's icon cases (T021); container (T022); table with its negative control, pinned-head walk, and the table compositions of earlier items (T023, after T021 and T022); the Tailwind C1 and C2 builds (T024, after T022); card's grid, layer, and button carry-overs, delivering the Fixture app routes surface (T025); then the registries for the last four items and the shared-input type check of E14, delivering the package entry points surface (T026).
Review depth: full

## Wave 5 — screen-reader checks and the milestone gate

Goal: The SC9 checks for timeline, icon, spinner, grid, and cluster on both lanes with their negative controls, and the Departures and accessibility-skill rows that retire the manual tests (T027); then every CI and floor job run locally on the milestone tip, re-timed, with sharding only past about 15 minutes (T028).
Review depth: full

## Surface contract

### Storybook stories — T020

Criteria: SC1, SC6
Entry: `npm exec nx -- build-storybook ngx-yeti` then `npm exec nx -- static-storybook ngx-yeti` (http://localhost:4401), or the control-ngx-yeti-storybook skill's `up`; story ids `{item}--{story}` of the 22 items, `setup--item-links`, and the card and lift carry-over stories
States: empty — an unknown story id shows Storybook's missing-story error and `openStory` throws; loading — Storybook's preparing view until the story renders and its item links load; error — a play-function failure, an axe violation, or any `console.error` marks the story failed in `npm exec nx -- test-storybook ngx-yeti`; success — the story renders styled, its item links are in the head, and its play function and the axe gate pass
Walkthrough:
1. Open `setup--item-links`: a `yetiStack` holds a centred `yetiCenter`, the head holds the `stack` and `center` links in Yeti's order, and toggling the last host off removes both links.
2. Open `button--toggle` and press Space on "Italic": it shows its pressed state and the accessibility tree reports `pressed`.
3. With `forcedColors: 'active'` emulated in Chromium, the pressed toggle of `button--toggle` and the checked label of `button--toggle-input` show a border their resting siblings lack.
4. Run `npm exec nx -- test-storybook ngx-yeti`: every story of the 22 items and the carry-overs passes its play function and the axe gate.

### Fixture app routes — T025

Criteria: SC3
Entry: the control-yeti-app skill's `up`, or `npm exec nx -- run yeti-app:serve-ssr` (PORT 4000), then http://localhost:4000/sub/{item} and /sub/server/{item} for the 22 items, /sub/card, and the negative-control routes /sub/table-without-tbody and /sub/center-anti-pattern
States: empty — a route without an item has no item link in the head; loading — before hydration, and with JavaScript off, the server HTML is already styled from the item links in the head; error — the labelled negative-control routes show what not to write and log their recorded hydration error or overflow; success — items are styled, the development build logs 0 skipped components and no NG05xx, and axe finds no violation on the six tags
Walkthrough:
1. With JavaScript disabled, open /sub/stack and /sub/card: the layouts are styled, and the card grid lays out its cards in columns with button-styled footer links.
2. With JavaScript disabled, open /sub/scroller and press Tab: the scroller takes focus; press ArrowRight: it scrolls.
3. With JavaScript on, open /sub/server/sidebar: the console shows the hydration summary with 0 skipped components, and the center inside the sidebar is centred.
4. Open /sub/table-without-tbody: it is labelled as what not to write and its hydration error is in the console.

### package entry points — T026

Criteria: SC5
Entry: `npm exec nx -- run ngx-yeti:pack-check` (builds the package, runs `npm pack`, and compiles tools/package/consumer/consumer.ts against the tarball)
States: empty — a consumer that imports nothing still installs the tarball with no yeti-css dependency or peer; loading — `nx build ngx-yeti` runs first through the target's dependency; error — the check exits non-zero and names the import, type, or file that failed; success — the consumer compiles and the check prints the tarball name
Walkthrough:
1. Run `npm exec nx -- run ngx-yeti:pack-check`: the consumer imports one public symbol from each of the 22 new `ngx-yeti/{item}` entry points and builds.
2. Run `npm exec nx -- test ngx-yeti -- contract.node`: every item's contract check passes over the built manifest.

## Wave 6 — fix wave 2 cycle 1 review findings

Goal: Repair the blocking findings of the wave 2 cycle 1 review without changing source task contracts.
Review depth: full

| Task | Title | Deps | Files |
|------|-------|------|-------|
| T032 | Fix wave 2 cycle 1 review findings in T007, T008 | T007, T008 | apps/ngx-yeti-e2e/src/stack.spec.ts, apps/yeti-app-e2e/src/box.spec.ts, apps/yeti-app-e2e/src/center.spec.ts, apps/yeti-app-e2e/src/setup.spec.ts, apps/yeti-app-e2e/src/stack.spec.ts, apps/yeti-app/src/app/fixtures/box-fixture.ts, apps/yeti-app/src/app/fixtures/center-fixture.ts, apps/yeti-app/src/app/fixtures/setup-fixture.ts, apps/yeti-app/src/app/fixtures/stack-fixture.ts, packages/ngx-yeti/CHANGELOG.md, packages/ngx-yeti/README.md, packages/ngx-yeti/box/README.md, packages/ngx-yeti/box/src/box-border.ts, packages/ngx-yeti/box/src/box-paint.ts, packages/ngx-yeti/box/src/box-text.ts, packages/ngx-yeti/box/src/box.contract.node.spec.ts, packages/ngx-yeti/box/src/box.spec.ts, packages/ngx-yeti/box/src/box.ssr.spec.ts, packages/ngx-yeti/box/src/box.stories.ts, packages/ngx-yeti/box/src/box.ts, packages/ngx-yeti/box/src/index.ts, packages/ngx-yeti/center/README.md, packages/ngx-yeti/center/src/center.contract.node.spec.ts, packages/ngx-yeti/center/src/center.spec.ts, packages/ngx-yeti/center/src/center.ssr.spec.ts, packages/ngx-yeti/center/src/center.stories.ts, packages/ngx-yeti/center/src/center.ts, packages/ngx-yeti/center/src/index.ts, packages/ngx-yeti/compile-fixtures/center-max-large.ts, packages/ngx-yeti/eslint.config.mjs, packages/ngx-yeti/src/compile-errors.node.spec.ts, packages/ngx-yeti/src/item-names.node.spec.ts, packages/ngx-yeti/src/name-collision.node.spec.ts, packages/ngx-yeti/stack/README.md, packages/ngx-yeti/stack/src/index.ts, packages/ngx-yeti/stack/src/stack-child.ts, packages/ngx-yeti/stack/src/stack-tokens.ts, packages/ngx-yeti/stack/src/stack.contract.node.spec.ts, packages/ngx-yeti/stack/src/stack.spec.ts, packages/ngx-yeti/stack/src/stack.ssr.spec.ts, packages/ngx-yeti/stack/src/stack.stories.ts, packages/ngx-yeti/stack/src/stack.ts, packages/ngx-yeti/styles/src/setup.stories.ts, packages/ngx-yeti/tsconfig.spec.json, tools/package/consumer/consumer.ts |
| T033 | Fix wave 2 cycle 1 review findings in T030 | T030 | apps/yeti-app-e2e/src/fixture-app.spec.ts |

## Wave 7 — fix wave 3 cycle 1 review findings

Goal: Repair the blocking findings of the wave 3 cycle 1 review without changing source task contracts.
Review depth: full

| Task | Title | Deps | Files |
|------|-------|------|-------|
| T034 | Fix wave 3 cycle 1 review findings in T009, T010, T011, T012, T013, T014, T015, T016, T017, T018 | T009, T010, T011, T012, T013, T014, T015, T016, T017, T018 | .claude/skills/ngx-yeti-specs/SKILL.md, apps/ngx-yeti-e2e/src/breakout.spec.ts, apps/ngx-yeti-e2e/src/cluster.spec.ts, apps/ngx-yeti-e2e/src/columns.spec.ts, apps/ngx-yeti-e2e/src/cover.spec.ts, apps/ngx-yeti-e2e/src/enter.spec.ts, apps/ngx-yeti-e2e/src/grid.spec.ts, apps/ngx-yeti-e2e/src/layer.spec.ts, apps/ngx-yeti-e2e/src/masonry.spec.ts, apps/ngx-yeti-e2e/src/overlay.spec.ts, apps/ngx-yeti-e2e/src/scroller.spec.ts, apps/ngx-yeti-e2e/src/sidebar.spec.ts, apps/ngx-yeti-e2e/src/spinner.spec.ts, apps/ngx-yeti-e2e/src/timeline.spec.ts, apps/ngx-yeti-e2e/src/visually-hidden.spec.ts, apps/yeti-app-e2e/src/breakout.spec.ts, apps/yeti-app-e2e/src/cluster.spec.ts, apps/yeti-app-e2e/src/columns.spec.ts, apps/yeti-app-e2e/src/cover.spec.ts, apps/yeti-app-e2e/src/enter.spec.ts, apps/yeti-app-e2e/src/frame.spec.ts, apps/yeti-app-e2e/src/grid.spec.ts, apps/yeti-app-e2e/src/layer.spec.ts, apps/yeti-app-e2e/src/masonry.spec.ts, apps/yeti-app-e2e/src/overlay.spec.ts, apps/yeti-app-e2e/src/scroller.spec.ts, apps/yeti-app-e2e/src/sidebar.spec.ts, apps/yeti-app-e2e/src/spinner.spec.ts, apps/yeti-app-e2e/src/support/axe.ts, apps/yeti-app-e2e/src/timeline.spec.ts, apps/yeti-app-e2e/src/visually-hidden.spec.ts, apps/yeti-app/src/app/fixtures/breakout-fixture.ts, apps/yeti-app/src/app/fixtures/cluster-fixture.ts, apps/yeti-app/src/app/fixtures/columns-fixture.ts, apps/yeti-app/src/app/fixtures/cover-fixture.ts, apps/yeti-app/src/app/fixtures/enter-fixture.ts, apps/yeti-app/src/app/fixtures/frame-fixture.ts, apps/yeti-app/src/app/fixtures/grid-fixture.ts, apps/yeti-app/src/app/fixtures/layer-fixture.ts, apps/yeti-app/src/app/fixtures/masonry-fixture.ts, apps/yeti-app/src/app/fixtures/overlay-fixture.ts, apps/yeti-app/src/app/fixtures/scroller-fixture.ts, apps/yeti-app/src/app/fixtures/sidebar-fixture.ts, apps/yeti-app/src/app/fixtures/spinner-fixture.ts, apps/yeti-app/src/app/fixtures/timeline-fixture.ts, apps/yeti-app/src/app/fixtures/visually-hidden-fixture.ts, docs/specs/ledger.md, docs/specs/upstream-bugs.md, packages/ngx-yeti/accessibility.css, packages/ngx-yeti/breakout/README.md, packages/ngx-yeti/breakout/src/breakout-child.ts, packages/ngx-yeti/breakout/src/breakout-note.ts, packages/ngx-yeti/breakout/src/breakout-tokens.ts, packages/ngx-yeti/breakout/src/breakout.contract.node.spec.ts, packages/ngx-yeti/breakout/src/breakout.spec.ts, packages/ngx-yeti/breakout/src/breakout.ssr.spec.ts, packages/ngx-yeti/breakout/src/breakout.stories.ts, packages/ngx-yeti/breakout/src/breakout.ts, packages/ngx-yeti/breakout/src/index.ts, packages/ngx-yeti/cluster/README.md, packages/ngx-yeti/cluster/src/cluster.contract.node.spec.ts, packages/ngx-yeti/cluster/src/cluster.spec.ts, packages/ngx-yeti/cluster/src/cluster.ssr.spec.ts, packages/ngx-yeti/cluster/src/cluster.stories.ts, packages/ngx-yeti/cluster/src/cluster.ts, packages/ngx-yeti/cluster/src/index.ts, packages/ngx-yeti/columns/README.md, packages/ngx-yeti/columns/src/columns-child.ts, packages/ngx-yeti/columns/src/columns-tokens.ts, packages/ngx-yeti/columns/src/columns.contract.node.spec.ts, packages/ngx-yeti/columns/src/columns.spec.ts, packages/ngx-yeti/columns/src/columns.ssr.spec.ts, packages/ngx-yeti/columns/src/columns.stories.ts, packages/ngx-yeti/columns/src/columns.ts, packages/ngx-yeti/columns/src/index.ts, packages/ngx-yeti/cover/README.md, packages/ngx-yeti/cover/src/cover-child.ts, packages/ngx-yeti/cover/src/cover-tokens.ts, packages/ngx-yeti/cover/src/cover.contract.node.spec.ts, packages/ngx-yeti/cover/src/cover.spec.ts, packages/ngx-yeti/cover/src/cover.ssr.spec.ts, packages/ngx-yeti/cover/src/cover.stories.ts, packages/ngx-yeti/cover/src/cover.ts, packages/ngx-yeti/cover/src/index.ts, packages/ngx-yeti/enter/README.md, packages/ngx-yeti/enter/src/enter.contract.node.spec.ts, packages/ngx-yeti/enter/src/enter.spec.ts, packages/ngx-yeti/enter/src/enter.ssr.spec.ts, packages/ngx-yeti/enter/src/enter.stories.ts, packages/ngx-yeti/enter/src/enter.ts, packages/ngx-yeti/enter/src/index.ts, packages/ngx-yeti/frame/README.md, packages/ngx-yeti/frame/src/frame.contract.node.spec.ts, packages/ngx-yeti/frame/src/frame.spec.ts, packages/ngx-yeti/frame/src/frame.ssr.spec.ts, packages/ngx-yeti/frame/src/frame.stories.ts, packages/ngx-yeti/frame/src/frame.ts, packages/ngx-yeti/frame/src/index.ts, packages/ngx-yeti/grid/README.md, packages/ngx-yeti/grid/src/grid-child.ts, packages/ngx-yeti/grid/src/grid-tokens.ts, packages/ngx-yeti/grid/src/grid.contract.node.spec.ts, packages/ngx-yeti/grid/src/grid.spec.ts, packages/ngx-yeti/grid/src/grid.ssr.spec.ts, packages/ngx-yeti/grid/src/grid.stories.ts, packages/ngx-yeti/grid/src/grid.ts, packages/ngx-yeti/grid/src/index.ts, packages/ngx-yeti/layer/README.md, packages/ngx-yeti/layer/src/index.ts, packages/ngx-yeti/layer/src/layer-child.ts, packages/ngx-yeti/layer/src/layer-tokens.ts, packages/ngx-yeti/layer/src/layer.contract.node.spec.ts, packages/ngx-yeti/layer/src/layer.spec.ts, packages/ngx-yeti/layer/src/layer.ssr.spec.ts, packages/ngx-yeti/layer/src/layer.stories.ts, packages/ngx-yeti/layer/src/layer.ts, packages/ngx-yeti/lift/src/lift.stories.ts, packages/ngx-yeti/masonry/README.md, packages/ngx-yeti/masonry/src/index.ts, packages/ngx-yeti/masonry/src/masonry.contract.node.spec.ts, packages/ngx-yeti/masonry/src/masonry.spec.ts, packages/ngx-yeti/masonry/src/masonry.ssr.spec.ts, packages/ngx-yeti/masonry/src/masonry.stories.ts, packages/ngx-yeti/masonry/src/masonry.ts, packages/ngx-yeti/overlay/README.md, packages/ngx-yeti/overlay/src/index.ts, packages/ngx-yeti/overlay/src/overlay-child.ts, packages/ngx-yeti/overlay/src/overlay-tokens.ts, packages/ngx-yeti/overlay/src/overlay.contract.node.spec.ts, packages/ngx-yeti/overlay/src/overlay.spec.ts, packages/ngx-yeti/overlay/src/overlay.ssr.spec.ts, packages/ngx-yeti/overlay/src/overlay.stories.ts, packages/ngx-yeti/overlay/src/overlay.ts, packages/ngx-yeti/scroller/README.md, packages/ngx-yeti/scroller/src/index.ts, packages/ngx-yeti/scroller/src/scroller.contract.node.spec.ts, packages/ngx-yeti/scroller/src/scroller.spec.ts, packages/ngx-yeti/scroller/src/scroller.ssr.spec.ts, packages/ngx-yeti/scroller/src/scroller.stories.ts, packages/ngx-yeti/scroller/src/scroller.ts, packages/ngx-yeti/sidebar/README.md, packages/ngx-yeti/sidebar/src/index.ts, packages/ngx-yeti/sidebar/src/sidebar-child.ts, packages/ngx-yeti/sidebar/src/sidebar-tokens.ts, packages/ngx-yeti/sidebar/src/sidebar.contract.node.spec.ts, packages/ngx-yeti/sidebar/src/sidebar.spec.ts, packages/ngx-yeti/sidebar/src/sidebar.ssr.spec.ts, packages/ngx-yeti/sidebar/src/sidebar.stories.ts, packages/ngx-yeti/sidebar/src/sidebar.ts, packages/ngx-yeti/spinner/README.md, packages/ngx-yeti/spinner/src/index.ts, packages/ngx-yeti/spinner/src/spinner.contract.node.spec.ts, packages/ngx-yeti/spinner/src/spinner.spec.ts, packages/ngx-yeti/spinner/src/spinner.ssr.spec.ts, packages/ngx-yeti/spinner/src/spinner.stories.ts, packages/ngx-yeti/spinner/src/spinner.ts, packages/ngx-yeti/src/accessibility.node.spec.ts, packages/ngx-yeti/src/published-output.node.spec.ts, packages/ngx-yeti/timeline/README.md, packages/ngx-yeti/timeline/src/index.ts, packages/ngx-yeti/timeline/src/timeline.contract.node.spec.ts, packages/ngx-yeti/timeline/src/timeline.spec.ts, packages/ngx-yeti/timeline/src/timeline.ssr.spec.ts, packages/ngx-yeti/timeline/src/timeline.stories.ts, packages/ngx-yeti/timeline/src/timeline.ts, packages/ngx-yeti/visually-hidden/README.md, packages/ngx-yeti/visually-hidden/src/index.ts, packages/ngx-yeti/visually-hidden/src/visually-hidden.contract.node.spec.ts, packages/ngx-yeti/visually-hidden/src/visually-hidden.spec.ts, packages/ngx-yeti/visually-hidden/src/visually-hidden.ssr.spec.ts, packages/ngx-yeti/visually-hidden/src/visually-hidden.stories.ts, packages/ngx-yeti/visually-hidden/src/visually-hidden.ts |

## Intent coverage

| Criterion | Task | Acceptance |
|-----------|------|------------|
| SC1 | T007 | AC1 |
| SC1 | T008 | AC1 |
| SC1 | T009 | AC1 |
| SC1 | T010 | AC1 |
| SC1 | T011 | AC1 |
| SC1 | T012 | AC1 |
| SC1 | T013 | AC1 |
| SC1 | T014 | AC1 |
| SC1 | T015 | AC1 |
| SC1 | T016 | AC1 |
| SC1 | T016 | AC2 |
| SC1 | T017 | AC1 |
| SC1 | T018 | AC1 |
| SC1 | T020 | AC1 |
| SC1 | T020 | AC2 |
| SC1 | T021 | AC1 |
| SC1 | T022 | AC1 |
| SC1 | T023 | AC1 |
| SC1 | T025 | AC1 |
| SC2 | T007 | AC2 |
| SC2 | T009 | AC2 |
| SC2 | T010 | AC2 |
| SC2 | T011 | AC2 |
| SC2 | T012 | AC2 |
| SC2 | T013 | AC2 |
| SC2 | T014 | AC2 |
| SC2 | T015 | AC2 |
| SC2 | T016 | AC3 |
| SC2 | T017 | AC2 |
| SC2 | T020 | AC3 |
| SC2 | T021 | AC2 |
| SC2 | T022 | AC2 |
| SC3 | T002 | AC1 |
| SC3 | T002 | AC2 |
| SC3 | T003 | AC1 |
| SC3 | T007 | AC3 |
| SC3 | T008 | AC2 |
| SC3 | T009 | AC3 |
| SC3 | T010 | AC3 |
| SC3 | T011 | AC3 |
| SC3 | T011 | AC4 |
| SC3 | T011 | AC5 |
| SC3 | T012 | AC3 |
| SC3 | T013 | AC3 |
| SC3 | T014 | AC3 |
| SC3 | T015 | AC3 |
| SC3 | T016 | AC4 |
| SC3 | T017 | AC3 |
| SC3 | T018 | AC2 |
| SC3 | T020 | AC4 |
| SC3 | T021 | AC3 |
| SC3 | T022 | AC3 |
| SC3 | T023 | AC2 |
| SC3 | T023 | AC3 |
| SC3 | T024 | AC1 |
| SC3 | T025 | AC2 |
| SC4 | T007 | AC4 |
| SC4 | T008 | AC3 |
| SC4 | T009 | AC4 |
| SC4 | T010 | AC4 |
| SC4 | T011 | AC6 |
| SC4 | T012 | AC4 |
| SC4 | T013 | AC4 |
| SC4 | T014 | AC4 |
| SC4 | T015 | AC4 |
| SC4 | T016 | AC5 |
| SC4 | T017 | AC4 |
| SC4 | T018 | AC3 |
| SC4 | T020 | AC5 |
| SC4 | T021 | AC4 |
| SC4 | T022 | AC4 |
| SC4 | T023 | AC4 |
| SC4 | T026 | AC2 |
| SC5 | T007 | AC5 |
| SC5 | T008 | AC4 |
| SC5 | T019 | AC1 |
| SC5 | T026 | AC1 |
| SC6 | T020 | AC6 |
| SC7 | T020 | AC7 |
| SC7 | T020 | AC8 |
| SC8 | T004 | AC3 |
| SC8 | T024 | AC2 |
| SC8 | T028 | AC1 |
| SC9 | T004 | AC1 |
| SC9 | T004 | AC2 |
| SC9 | T027 | AC1 |
| SC9 | T027 | AC2 |
| SC9 | T027 | AC3 |

## Held-out checks

| Edge | Task | Test |
|------|------|------|
| E2 | T013 | apps/yeti-app-e2e/src/sidebar.spec.ts |
| E6 | T020 | apps/yeti-app-e2e/src/button.spec.ts |
| E7 | T016 | apps/ngx-yeti-e2e/src/spinner.spec.ts |
| E8 | T003 | apps/yeti-app-e2e/src/static-attributes.spec.ts |
| E9 | T002 | apps/yeti-app-e2e/src/fixture-app.spec.ts |
| E12 | T013 | apps/ngx-yeti-e2e/src/sidebar.spec.ts |
| E13 | T008 | packages/ngx-yeti/box/src/box.spec.ts |
| E14 | T026 | packages/ngx-yeti/src/shared-inputs.node.spec.ts |
| E15 | T011 | apps/yeti-app-e2e/src/enter.spec.ts |
| E16 | T027 | apps/screen-reader-e2e/src/timeline.screen-reader.ts |

E7's other conditional follow-ups (A11Y-10a and 10c in T009, A11Y-10b in T015, icon in T021, table in T023, the high-emphasis toggle in T020) are stated in those tasks' acceptance criteria; T016's row names the edge's owner and its spinner case.

## Dependency notes

- Item tasks → T001: each consumes its generated entry point (`ngx-yeti/{item}` alias, `src/index.ts`, `README.md`); no item task runs the generator or edits tsconfig.base.json.
- Item tasks → T002: each fills the stub fixture component(s) T002 registered (file overlap on the stub files), and relies on its item being in the preload list.
- Removed-kind tasks (T007, T010, T012, T013, T014, T015, T020, T021, T023) → T003: they follow the static-attribute pattern and `E8 verdict` line in T003's Log and call `recordPaintedAttributes`.
- T003 → T002: T002 creates the `static-attributes` route key and stub file that T003 fills.
- T008 → T007: box completes compositions in T007's stack and center story, spec, fixture, and e2e files, and both edit the package registries in wave 2.
- T012 → T009, T011: cluster's layer-2 and Fixture shared host compose `NgxYetiEnter` (T011), and cluster adds `timeline--in-cluster` to T009's timeline story and e2e files.
- T015 → T009 and T016 → T015: file overlap only (`packages/ngx-yeti/accessibility.css`, `docs/specs/ledger.md`, `packages/ngx-yeti/src/accessibility.node.spec.ts`), so any rule E7 brings lands serially.
- T018 → T009, T013: `frame--composed` composes `yetiBreakoutChild` and `yetiSidebar`.
- T019 → T009 to T018 and T026 → T020 to T025: the package registries (consumer, name-collision and item-names lists, README, changelog, upstream-bugs rows) change once per wave, after the items they list; a reviewer sees each wave's items in one registry commit.
- T020 → T016, T007: button adds the spinner cases that need a button to T016's spinner files, and adds its NG8002 row to T007's `compileErrorCases`. Button's `yetiCluster` (T012) and `yetiBox` (T008) partners landed in earlier waves.
- T021 → T020: icon adds `button--icon`, the icon of `button--rtl`, the `yetiIcon yetiButton` test host, and the Fixture shared host to T020's button files.
- T023 → T021, T022, T017, T012: `table--align` composes `yetiIcon`; table adds `container--table-column` to T022's story file, `scroller--wide-table` to T017's, and `cluster--legend`'s `yetiNumeric` to T012's; T023 also holds the accessibility stylesheet and ledger after T021.
- T024 → T022: the Tailwind check reads the container route of T022's Interface contract.
- T025 → T020, T010, T015, T002: card's carry-overs compose `yetiButton`, `yetiGrid`, and `yetiLayer`, and its route assertions depend on T002's preload list.
- T027 → T004, T009, T010, T012, T016, T021: the checks run on T004's harness against the timeline, grid, cluster, spinner, and icon stories.
- T028 → T027: both edit `.github/workflows/ci.yml`, and the gate runs on the tip after the last checks land.
- Build repair, placement (2026-10-11): T029, T030, and T031 join wave 2 rather than a new wave. Wave 2 has not been reviewed, so it takes them with no renumbering of waves 3 to 5 or of any later task's `wave`; a new wave would have renumbered three waves and twenty task files. They share no file with T008 or with each other, so they need no edge among themselves, and wave 3 starts only after all of wave 2 lands and passes its review. The hand-off's D1 and D2 are one task (T029) because both are in the control script; D3 (T030) and D4 (T031) are separate files and separate tasks.
- T029 → T005, T030 → T002, T031 → T004: file overlap with the landed task each one repairs. T029 edits `.claude/skills/control-yeti-app/scripts/control.mjs` and the skill's SKILL.md and build-configurations feature file; T030 edits `apps/yeti-app-e2e/src/fixture-app.spec.ts` and reads the registry keys and stub marker of T002's Interface contract; T031 edits `apps/screen-reader-e2e/src/support/nvda.ts`, `apps/screen-reader-e2e/screen-reader.config.mts`, and `references/ci-local.md`, and keeps T004's screen-reader project contract. No landed task file changes.
- T025 → T030 (edge added in the repair): both edit `apps/yeti-app-e2e/src/fixture-app.spec.ts`; T025 changes its style-mutation test in wave 4, after T030 changed its stub-route tests. No item task of waves 2 to 4 owns that file (T008 to T023 do not list it), and T030 keeps it that way.
- T027 → T031 (edge added in the repair): T027 extends `apps/screen-reader-e2e/src/support/nvda.ts` in wave 5 and sends the keys of its new moves through the NVDA key guard of T031's Interface contract, which T027 now carries with identical text. T028 also edits `references/ci-local.md` and reaches T031 through T027.
- T024 → T031 (edge added in the repair): both edit `references/ci-local.md`; T024 documents the Tailwind configurations in wave 4, after T031 updated the NVDA lane section.
- T031 runs alone: its Verify and its coder's lane runs start real NVDA, raise windows on the desktop, and serve the static Storybook on port 4401, so the orchestrator dispatches it in a round of its own with no other coder, Verify, or headed browser running. This is a scheduling rule, not a dependency edge.
- Build repair before wave 4, placement (2026-10-11, second repair): T035 to T041 join wave 4 as its first dependency layers. Wave 4 has not started, so it takes them with no renumbering of a wave or of a later task's `wave`; a task added to a done wave would reopen that wave's review, and a new wave 8 would need the same edges to run first. The order inside the wave is made by the edges below and by the edges from T020 to T026.
- T036 → T035: both edit `apps/yeti-app-e2e/src/setup-boundaries.spec.ts`. T035 goes first so that T036's Verify, which runs every e2e combination, does not meet the flake T035 removes (12 of 120 WebKit runs failed, measured 2026-10-11); T036 then moves T035's branch onto `expectStyledFrames`.
- T038 → T036: file overlap only (`tsconfig.base.json`, `packages/ngx-yeti-testing/README.md`, `packages/ngx-yeti-testing/tsconfig.lib.json`, and the ngx-yeti-testing skill): each adds its own entry of the test library and documents it. T037 shares no file with T036 or T038 (it owns the library's browser entry, the stories, and the ngx-yeti-stories skill) and runs beside them.
- T039 → T035: both edit the Departures table of `.claude/skills/ngx-yeti-specs/SKILL.md`.
- T040 → T036, T038, T039: the enter specs T040 extends are migrated by T036 (Fixture e2e) and T038 (layer 2) first, and T040 calls their helpers; T039's selector table must exist before the rule lands, so the commit that adds the rule also adds its entry and every commit passes the published-output check. T040 also edits the Departures table and `docs/specs/upstream-bugs.md` after T039 and T035.
- T041 → T031: T041 edits the NVDA driver, its guard test, the lane config, and the NVDA section of `references/ci-local.md` that T031 landed, and keeps T031's key guard contract.
- T020, T021, T022, T023, T025 → T036, T037, T038 (edges added in the repair): their new specs and stories call the shared helpers of those tasks' Interface contracts. T020 also edits files they migrate (the Fixture spinner spec, the spinner layer-2 and server-render specs, the box stories), T023 the cluster and scroller stories, and T025 the card specs and stories.
- T020 → T039, T040; T021, T023 → T039 (edges added in the repair): a rule on a Yeti class in `packages/ngx-yeti/accessibility.css` needs its entry in T039's `sanctionedSelectors`, which A11Y-1a's rule (T020) gets and a rule E7 brings (T021, T023) would get. T020 edits the stylesheet, `docs/specs/ledger.md`, and the changelog after T040.
- T023, T026 → T039 (edges added in the repair): the entry-point export rule puts `YetiTableAlign` in `ngx-yeti/table` only, and T026 edits `packages/ngx-yeti/src/name-collision.node.spec.ts` after T039 added the primary-entry test to it.
- T024 → T036, T041 (edges added in the repair): the Tailwind spec calls T036's Playwright helpers, and T024 edits `references/ci-local.md` after T041. T024 edits the ngx-yeti-testing skill after T036 and T038, which it reaches through T022.
- T027 → T041 (edge added in the repair): T027 extends `apps/screen-reader-e2e/src/support/nvda.ts` after T041 and relies on T041's lane-run contract for its five new files in both browsers. T028 reaches T041 through T027.
- T041 runs alone, as T031 did: real NVDA takes the desktop and port 4401. T035, T036, T037, T038, and T040 run container jobs and the Fixture e2e servers on fixed ports (4310 to 4312 and 4401), so the orchestrator runs their heavy commands one at a time. Both are scheduling rules, not dependency edges.
- Build repair before wave 4, placement (2026-10-12, second repair): T042 and T043 join wave 4 as early dependency layers, for the same reason as T035 to T041: wave 4 is not done, a task added to a done wave would reopen its review, and a new wave would need the same edges. No wave, landed task, or later task's `wave` is renumbered.
- T037 → T042 (prerequisite effect): T037's Verify runs `node tools/ci-local/run-job.mjs ci unit` twice, and its attempt 1 was rejected on the signatures of the unit job overloading its own runner (Firefox session connect timeouts, lift hover, yeti-rank). The root-cause spike of 2026-10-12 measured the fix: base 8 of 9 as found and 1 of 4 under a CPU quota, against 8 of 8 with `VITEST_MAX_WORKERS: 2` and `--parallel=1`. A reviewer sees both settings in the `unit` job of `.github/workflows/ci.yml` at T037's base. The two tasks share no file.
- T043 → T042: file overlap (`references/ci-local.md`), plus a prerequisite effect: T043 sets its concurrency cap from measured memory, and a `unit` leg peaks at about 8.7 GiB only with T042's settings (about 14.4 GiB without them) in the 16 GB VM.
- T041 → T043 (edge added in the repair): file overlap only (`references/ci-local.md`). T041 goes after T043, not before, because T041 waits on an unlocked desktop and real NVDA, and the faster local runs should not wait behind it. T024 reaches T042 and T043 through T041 (`ci.yml`, `references/ci-local.md`, `apps/yeti-app-e2e/playwright.config.mts` and `tools/playwright/playwright-configs.test.mjs` overlap), and T024 keeps T043's worker setting when it edits the yeti-app-e2e config.
- T028 has no edge to T042 or T043. T028 is in wave 5, so both have landed before it starts. It edits `ci.yml`, `run-job.mjs` and `references/ci-local.md` after them, and its contract needs nothing of theirs beyond what wave order gives. T020 and T023 pass narrowed commands to the `unit` job and get `VITEST_MAX_WORKERS` from its `env` whether or not T042 has landed. They need no edge.
- T042 and T043 are heavy. They run containers on fixed ports inside each container, and T042's five unit runs take the machine. The orchestrator runs their heavy commands one at a time, as for T035 to T040.
- Build repair in wave 4, placement (2026-10-12, third repair, review round 1 and the security review): T044 to T048 join wave 4, for the same reason as T035 to T043: wave 4 is not done, a task added to a done wave would reopen its review, and wave 5 stays paused by the user's ruling "Pause before the next wave". No wave, landed task, or later task's `wave` is renumbered, and pending tasks' deps change only by the edges to T038 and T049 (below); each new task but T049 depends on the pending tasks whose files it shares, so it lands after them and wave 4's review covers it.
- T044 → T020, T021, T023: file overlap only (`packages/ngx-yeti/ngx-yeti-globals.css`, `packages/ngx-yeti/src/accessibility.node.spec.ts`, `packages/ngx-yeti/src/published-output.node.spec.ts`); each of those tasks edits them first.
- T045 → T020, T037: file overlap only. T020 adds the focus-ring button to `packages/ngx-yeti/box/src/box.stories.ts`, and T037 migrates every story file T045 edits.
- T046 → T025: file overlap (`apps/yeti-app-e2e/src/fixture-app.spec.ts`, `apps/yeti-app-e2e/src/card.spec.ts`). T046 → T020, T021, T022, T023: prerequisite effect. Each replaces the stub fixture of its routes (button; icon; container; table, table-numeric, and table-without-tbody), which a reviewer sees in `apps/yeti-app/src/app/fixtures/`; once T046's `stubRoutes` asserts the stub marker with no skip, a stub replaced after it would fail that test.
- T048 → T024: file overlap (`.claude/skills/ngx-yeti-testing/SKILL.md`). T041 also edits that file now and comes first through T024's edge to T041.
- T047 has no edge: no pending task edits the control skills. It launches the Fixture app and Storybook on fixed ports (4000, 4200, 4310 to 4312, 4400, 4401) and builds, so the orchestrator runs it with no other heavy command, coder, or NVDA run. This is a scheduling rule, not a dependency edge. T044, T045, T046, and T048 are heavy too and are serialized as for T035 to T043.
- T049 → T040: file overlap with the last done wave-4 task that edited the stylesheet, the node specs, the enter spec, the two ledgers, the README, the CHANGELOG, and the ngx-yeti-specs skill (T035, T036, T038, and T039 are reached through it). T049 runs before every pending task that shares a file with it, and each of those gains an edge to it (added in the third repair): T020, T021, T023 (`packages/ngx-yeti/ngx-yeti-globals.css`, the two node specs, `docs/specs/ledger.md`, and for T020 the CHANGELOG); T024, T041, T048 (`.claude/skills/ngx-yeti-testing/SKILL.md`); T026 (`packages/ngx-yeti/README.md`, `packages/ngx-yeti/CHANGELOG.md`, `docs/specs/upstream-bugs.md`); T044 (the stylesheet and the two node specs); T046 (`.claude/skills/ngx-yeti-specs/SKILL.md`). T020, T021, T023, T024, and T044 now name `ngx-yeti-globals.css` in their files and text and carry T049's global-stylesheet contract. The done tasks keep their text, so their copies of the sanctioned-selector contract still name `accessibility.css`. T049 shares no file with T037, T042, T043, T045, or T047.
- T041 → T038 (edge added in the third repair): file overlap only (`.claude/skills/ngx-yeti-testing/SKILL.md`, which T036 and then T038 edited in wave 4 and T041 now edits too).
- Routed into pending tasks by the same repair: T041 gains the local NVDA command of AGENTS.md, `references/ci-local.md`, and the testing skill, and the two screen-reader comment sites (`focus-guard.nvda.ts`, `card.screen-reader.ts`); T043 gains the quoting test `tools/ci-local/run-job.test.mjs` and its place in the root `project.json` `test` target; T028 gains guidepup version steps that fail on an empty version; T020's Approach states the observable focus-ring check of `box--paint`, which it already owned.
- Build repair in wave 4, placement (2026-10-13, fourth repair): T050 and T051 join wave 4, for the same reason as T035 to T049: wave 4 is not done, a task added to a done wave would reopen its review, and wave 5 stays paused. No wave, landed task, or later task's `wave` is renumbered. The only pending task whose deps change is T025 (the edge below); no other pending task shares a file with T050 or T051.
- T025 → T050 (prerequisite effect, edge added in the fourth repair): T025's attempt 1 at base d60b479 failed 3 yeti-app-e2e cases ("adopts the server's card link at hydration" on both route kinds, and "the style mutation probe sees an item link moved while the main bundle runs") because hydration removed and re-inserted the server's `spinner` link once the card held a `yetiButton`. Once T050 lands, `/sub/button` and `/sub/server/button` add and remove no item link at hydration; a reviewer sees it in T050's yeti-app-e2e case "adopts the server's button and spinner links at hydration" and its layer-2 case in `packages/ngx-yeti/styles/src/inject-yeti-item-styles.spec.ts`. The two tasks share no file.
- T050 → T020, T021: file overlap only (`apps/yeti-app-e2e/src/button.spec.ts`, which T020 wrote and T021 extended with the icon cases); both have landed, and no pending task edits T050's files. T051 → T041: file overlap only (`AGENTS.md`, whose local NVDA command T041 changed); it has landed, and no pending task edits `AGENTS.md`. T050 is heavy (Fixture e2e on fixed ports) and is serialized as for T035 to T049; T051 is not.

## Risks

- Unit and e2e CI time: measured on 2026-10-10 (runs 38057092891 and 38050819430, full run-many, no remote cache) `unit` took 1 to 2 minutes, each `e2e` leg 2 to 3, and `safari` 1, all under the 20-minute caps. No sharding is planned up front; T028 re-times the jobs after the item waves and adds a `--shard` axis only to a job that passes about 15 minutes.
- VoiceOver is first measured on the milestone's pull request (it needs macOS); a red `voiceover` job then is fixed through a patch wave or escalated, never skipped (N9). NVDA on Windows 11 ARM64 is measured in wave 1 (T004).
- A failing E8 measurement (T003) changes nine public APIs before they are written; a failing E12 walk (T013) or a failing order tie (T013, T014) stops for the user rather than changing a rule.
- The grown preload list adds one server prefetch per item to every page; WebKit's preload stall (upstream O4, O7) is checked by T002's WebKit run; upstream O2 (stale computed style, table and button) and A4 (production critical-CSS frames) are handled in each task's Approach.
- The 22 entry points exist from wave 1 exporting nothing until their item lands; nothing is published in M002, and every item lands before ship.
- Build repair before wave 4 (2026-10-11): T036, T037, and T038 rewrite the test helpers of about 150 landed spec and story files. They are refactors with a rule that no assertion gets weaker, but a migration can still drop a check without a failing test; the wave review compares the migrated specs with their versions at a69a139, and the wave review gate reruns every job.
- The selector table of the published-output check (T039) is a second copy of the ledger's selectors, which the audit of 2026-10-11 advised against and the user approved; the spec ties each key to a ledger row, and a stale entry fails it.
- The user has not yet confirmed that enter's `once` rule may live in the accessibility stylesheet, where the spike put it (T040); a ruling for a stylesheet of its own moves one self-contained block, its table entry, and its docs in a later patch.
- The NVDA failure in Firefox after Chromium (T041) is known only from this machine, with Playwright's x64 browsers under emulation; the `nvda` job has not yet run on `windows-2025`, so CI can still differ on the milestone's pull request.
- WebKit's pending-sheet frames (upstream O17, T035) are recorded, not asserted, in the reset case only; another test that samples a preloaded item beside a slower item's file can meet the same engine behaviour.
- One layer-2 test has failed under load: the lift spec's first real-pointer test in WebKit timed out at 15 s once in the unit job (wave 3 cycle 2 gate, 2026-10-11) and passed when run again alone. T038 measures it over five runs and fixes its wait if it recurs; until T038 lands, the unit job in T037's Verify can meet it, and T037 reports it instead of editing the lift spec.
- The unit-job fix (T042) is measured locally only: 8 of 8 through `run-job.mjs` on this machine's 8-vCPU arm64 Docker VM. GitHub-hosted CI is not measured, because a push is a human-only gate. `ubuntu-latest` for a public repository is a smaller x64 runner (4 vCPU and 16 GB by GitHub's documentation; about 7 GB by the user's 2026-10-12 ruling; not checked). The local 4-core emulation failed 1 of 1 at base and was not run with the fix. The fix is first measured on the milestone's pull request (SC8). A red `unit` job there goes through a patch wave.
- T043's gains are not known yet. Concurrency is the change expected to pay. If no cap of 2 or more fits the 16 GB VM with headroom, the task blocks rather than landing nothing. The worker count and the build cache land only with a measured gain. Local runs then differ from CI in leg concurrency, worker count and restored builds. Each can be switched off, and T028 times its shard decision with them off. The build cache must never replay an `e2e`, `test` or `test-storybook` result. A probe proves that once, but a later change to Nx's cache or to a target's `cache` flag could reopen the risk.
- The selector hole of the published-output and accessibility checks (T044) stays open until T044 lands after T020, T021, and T023, which add or may add rules to the accessibility stylesheet first. Nothing slips through it at 1747fe0 (the reviewer checked), so each of those tasks' reviewers reads its new selectors for a Yeti or package class nested in `:where()`, `:is()`, `:not()`, or `:has()`.
- The client-only `@defer` preload bullet of the 16 item specs gets a Departures row (T046), not 16 new cases. It is the planner's choice between the reviewer's two fixes, made on card's measured case: once every host has left, the re-inserted link refetches, so a per-item case would only record frames. The preload claim stays with the setup-defer route's 0-frame case and the per-item hint checks of `fixture-app.spec.ts`. The user can rule for per-item cases in a later patch.
- T047 runs the control scripts with the Nx daemon on and stops the daemon at `down`. That stop reaches every Nx client of the checkout, which restarts its own daemon; a daemon-on failure blocks T047 with its measurement rather than bringing `NX_DAEMON=false` back, by the user's standing rule.
- The stylesheet's rename (T049) changes the specifier every consumer imports to "ngx-yeti/ngx-yeti-globals.css", the name the user settled. The package is unreleased, so no alias is kept. Records under `docs/specs/` other than the two ledgers, and `docs/decisions/`, keep the old name; the Departures row carries the difference.
- The findings inlined into T041, T044 to T048, T020, T028, and T043 cite lines at 1747fe0; the pending tasks that land first move them, so coders find each site by its quoted code.
