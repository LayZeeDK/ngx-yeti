# Review — wave 1, cycle 1

Wave verdict: pass
Cycle: 1
Depth: full
Tasks reviewed: 6

Review base (current HEAD): e50f98e7832ed80c239f27df9cda1e8e7e5569ae. Each task is judged on its own landing commit patch (`commit^..commit`); bases and commits are the orchestrator-supplied `isolation.py recover` values. Several landings sit on a parent that differs from the recorded base (serial landing order T002, T006, T001, T003 and T005/T004 on their own chains); in every case the intervening commits touch no path the task declares. The preserved review under `.project/plan/build-recovery-ac09550e747870819d077c7f643dbd7307976cd6/review/wave-1.cycle1.md` was read as context only.

Reviewer checks run for this cycle: `git show --stat`, `--numstat`, and per-file patches for all six commits; task-file hunks of every commit; `git grep` of the e2e sources at c289e6c; `npx prettier --check .` (repo Prettier 3, the repo's config) on a `git archive` export of each of the six landing commits: all six "All matched files use Prettier code style!".

## T001 — Generate the 22 M002 secondary entry points before any item task: pass

- ✅ Entry points (T001): for each item of box, breakout, button, center, cluster, columns, container, cover, enter, frame, grid, icon, layer, masonry, overlay, scroller, sidebar, spinner, stack, table, timeline, and visually-hidden, the generator wrote `packages/ngx-yeti/{item}/ng-package.json`, `packages/ngx-yeti/{item}/README.md`, and `packages/ngx-yeti/{item}/src/index.ts`, and tsconfig.base.json maps `ngx-yeti/{item}` to that index.ts, which exports nothing until the item's task fills it. — 5a74a07 adds the 66 files (22 x 3); each ng-package.json is `{"lib":{"entryFile":"src/index.ts"}}`, each index.ts is `export {};`; tsconfig.base.json gains the 22 `ngx-yeti/{item}` paths to `./packages/ngx-yeti/{item}/src/index.ts`.
- ✅ All 22 entry points exist with the three generated files each, and tsconfig.base.json maps each `ngx-yeti/{item}` alias to its index.ts; no entry point was written by hand. — same evidence; the Log records one generator run per item (`nx g @nx/angular:library-secondary-entry-point ... --skipModule`), with the generated greeting and README replaced as the Approach directs. Generator provenance is maker prose; the generator-shaped ng-package.json and path entries are consistent with it.
- ✅ `packages/ngx-yeti/tsconfig.lib.json` has the same content as at the task's base. — `git diff c289e6c 5a74a07 -- packages/ngx-yeti/tsconfig.lib.json` is empty, and the path is not in the commit.
- ✅ `npm exec nx -- build ngx-yeti`, `npm exec nx -- build-fast ngx-yeti`, `npm exec nx -- typecheck ngx-yeti -c src`, `npm exec nx -- run ngx-yeti:pack-check`, and `npm exec nx -- test ngx-yeti -- --project=node` pass with the new entry points, and no entry point exports a placeholder symbol. — orchestrator Verify (isolate gsd-path-task/T001) exit 0, covering lint/typecheck, `typecheck -c src`, build and build-fast, pack-check, and the node tests. consumer.ts gains only 22 `export {} from 'ngx-yeti/{item}';` lines (repaired file list, Log 2026-10-10 orchestrator entry); no index.ts exports a symbol.
- ✅ `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit. — prettier re-run by the reviewer on the 5a74a07 export: clean. The affected run is covered by the recorded Verify's `run-many -t lint typecheck -p ngx-yeti` plus node tests; no recorded `affected --base=HEAD~1` output exists (see Warnings).

Warnings (non-blocking):
- AC4's `affected -t ... test-storybook` was not part of the recorded Verify; the coder states it was not run. The diff adds only empty entry points, so test-storybook risk is minimal.
- consumer.ts lines were later replaced by item registry tasks (T019, T026 and others), as planned.

Contract violations (blocking):
- none (all changed paths are in `files`, including the orchestrator-added consumer.ts; the task file changes only `status`/`agent`/`base` and appended Log lines).

## T002 — Register every M002 Fixture route, grow the preload list, and make preload assertions containment checks: pass

- ✅ Fixture key `box` → `BoxFixture` and key `box-markers` → `BoxMarkersFixture`, both in `apps/yeti-app/src/app/fixtures/box-fixture.ts`. — fixtures.ts imports both from './box-fixture' and maps the keys (c289e6c).
- ✅ Fixture key `breakout` → `BreakoutFixture` in `apps/yeti-app/src/app/fixtures/breakout-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `button` → `ButtonFixture` in `apps/yeti-app/src/app/fixtures/button-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `center` → `CenterFixture` and key `center-anti-pattern` → `CenterAntiPatternFixture`, both in `apps/yeti-app/src/app/fixtures/center-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `cluster` → `ClusterFixture` in `apps/yeti-app/src/app/fixtures/cluster-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `columns` → `ColumnsFixture` in `apps/yeti-app/src/app/fixtures/columns-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `container` → `ContainerFixture` in `apps/yeti-app/src/app/fixtures/container-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `cover` → `CoverFixture` in `apps/yeti-app/src/app/fixtures/cover-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `enter` → `EnterFixture` in `apps/yeti-app/src/app/fixtures/enter-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `frame` → `FrameFixture` in `apps/yeti-app/src/app/fixtures/frame-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `grid` → `GridFixture` in `apps/yeti-app/src/app/fixtures/grid-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `icon` → `IconFixture` in `apps/yeti-app/src/app/fixtures/icon-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `layer` → `LayerFixture` in `apps/yeti-app/src/app/fixtures/layer-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `masonry` → `MasonryFixture` in `apps/yeti-app/src/app/fixtures/masonry-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `overlay` → `OverlayFixture` in `apps/yeti-app/src/app/fixtures/overlay-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `scroller` → `ScrollerFixture` in `apps/yeti-app/src/app/fixtures/scroller-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `setup-order` → `SetupOrderFixture` in `apps/yeti-app/src/app/fixtures/setup-fixture.ts`. — fixtures.ts imports `SetupOrderFixture` from './setup-fixture'.
- ✅ Fixture key `sidebar` → `SidebarFixture` in `apps/yeti-app/src/app/fixtures/sidebar-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `spinner` → `SpinnerFixture` in `apps/yeti-app/src/app/fixtures/spinner-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `stack` → `StackFixture` in `apps/yeti-app/src/app/fixtures/stack-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `static-attributes` → `StaticAttributesFixture` in `apps/yeti-app/src/app/fixtures/static-attributes-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `table` → `TableFixture`, key `table-numeric` → `TableNumericFixture`, and key `table-without-tbody` → `TableWithoutTbodyFixture`, all in `apps/yeti-app/src/app/fixtures/table-fixture.ts`. — table-fixture.ts defines all three stubs; fixtures.ts maps the three keys.
- ✅ Fixture key `timeline` → `TimelineFixture` in `apps/yeti-app/src/app/fixtures/timeline-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Fixture key `visually-hidden` → `VisuallyHiddenFixture` in `apps/yeti-app/src/app/fixtures/visually-hidden-fixture.ts`. — fixtures.ts at c289e6c.
- ✅ Preload list (T002): `provideYetiStyles({ preload })` in apps/yeti-app/src/app/app.config.ts lists `card` and every M002 item except `enter`; `lift` and `enter` stay out. — app.config.ts at c289e6c lists card plus the 21 items, no `enter`, no `lift`; the comment says why each is out.
- ✅ Preload departure (T002): a row in `.claude/skills/ngx-yeti-specs/SKILL.md`'s Departures table records that enter.md:272's with-and-without-preload cases run without the preload on the Fixture app (enter stays out of the one preload list) and with it in the Storybook half on the story `enter--inserted-preloaded`, which renders `enter--inserted` under `provideYetiStyles({ preload: ['enter'] })` through Storybook's `applicationConfig`. — the added row in the Departures table names `enter.md:272`, the Fixture app's "without", the story `enter--inserted-preloaded` rendering `enter--inserted` under `provideYetiStyles({ preload: ['enter'] })` through `applicationConfig`, the reason, and `ngx-yeti-testing`.
- ✅ The 28 registry keys of the Interface contract are served at `/sub/{key}` (prerendered) and `/sub/server/{key}` (server-rendered); each stub passes `watchHydration` and the axe fixture, and the existing card, lift, replay, setup, setup-boundaries, and setup-defer routes keep their behaviour. — 28 keys counted in fixtures.ts; fixture-app.spec.ts adds per-route, per-kind stub tests (hydration plus axe, JS off visible plus axe). Orchestrator Verify (isolate gsd-path-task/T002) exit 0: lint/typecheck, `nx e2e yeti-app-e2e` development and production, and WebKit development through run-job.mjs.
- ✅ E9: the preload list holds `card` and every M002 item except `enter`; `lift` and `enter` are absent; every assertion on preload hrefs and preload style mutations in `apps/yeti-app-e2e/src` uses containment, and `apps/yeti-app-e2e/src/fixture-app.spec.ts` asserts the prefetch (server) and preload (client) of each listed item with `expect.arrayContaining`, so a later addition to the list breaks no assertion. — `git grep` at c289e6c finds no `toEqual([client...Preload])`; fixture-app.spec.ts:132, :164, :185 use `expect.arrayContaining`; setup.spec.ts:207/:403/:452 count only the card-filtered locator (`toHaveCount(1)` on a card href), which a list addition cannot break; support/fixtures.ts:18 adds `clientItemPreload`.
- ✅ The Departures table of `.claude/skills/ngx-yeti-specs/SKILL.md` has the E15 row naming enter.md:272, the Fixture app's "without" measurement, and the `enter--inserted-preloaded` story's "with" measurement. — see the departure row above.
- ✅ `npm exec nx -- e2e yeti-app-e2e` passes in the development and production configurations, and the development run passes in Playwright's WebKit through `node tools/ci-local/run-job.mjs`. — recorded orchestrator Verify exit 0 runs exactly these three.
- ✅ `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit. — prettier re-run by the reviewer on the c289e6c export: clean; recorded Verify ran lint and typecheck for yeti-app and yeti-app-e2e (the only projects touched besides a skill doc).

Warnings (non-blocking):
- At landing, each stub test skipped itself when its route no longer rendered the stub marker, which could hide a broken route; T030 (d979288) later made those tests fail for a missing or broken route instead.
- fixture-app.spec.ts was later changed by T046 and other item tasks (same lines around the stub-route tests).

Contract violations (blocking):
- none (every changed path is in `files`; the task file changes only orchestrator fields and appended Log lines).

## T003 — Measure whether a written-back static attribute ever paints, in three engines: pass

- ✅ Fixture key `static-attributes` → `StaticAttributesFixture` in `apps/yeti-app/src/app/fixtures/static-attributes-fixture.ts`. — the class is filled in that file at 5b5ad6c; the registry entry from T002 is unchanged.
- ✅ Static attributes (T003): a removed-kind static attribute (ticket 50 decision 9) is a signal input named as the attribute, rendered on its `data-*` attribute, and removed from the host by the host binding `'[attr.{name}]': 'null'`. T003's Log holds one line `E8 verdict: pass` or `E8 verdict: fail`. On pass, the static form stays as the specs write it; on fail, every removed-kind input becomes bound-only as cluster.md:309 and icon.md:302 state, and the static-form story and test cases are dropped. — static-attributes-fixture.ts: `StaticAttributeProbe` has signal inputs `align`, `border`, `nowrap`, `start`, `disabled`, each with `[attr.data-{name}]` and `'[attr.{name}]': 'null'`; the Log holds `E8 verdict: pass`.
- ✅ `apps/yeti-app-e2e/src/support/style-probe.ts` exports `recordPaintedAttributes(page: Page, selector: string, attributes: readonly string[]): Promise<() => Promise<readonly string[]>>`, called before `goto`: an init-script MutationObserver plus a requestAnimationFrame probe; the returned function lists one entry `{element} {attribute}` for each animation frame in which an element matching `selector` carried one of `attributes`, so an empty list means no painted frame showed them. — style-probe.ts at 5b5ad6c: 119 added lines, 0 removed, one new export `recordPaintedAttributes`; the spec calls it before `page.goto`, and a positive-control test checks that an attribute set after hydration is listed.
- ✅ E8: `apps/yeti-app-e2e/src/static-attributes.spec.ts` measures, on `/sub/static-attributes` and `/sub/server/static-attributes`, in the development and production builds and in Chromium, Firefox, and WebKit, whether any painted frame shows a written-back `align`, `border`, `nowrap`, `start`, or link `disabled`; the Log records `E8 verdict: pass` or `E8 verdict: fail` with the counts, and a fail is stated as the switch of every removed-kind spec (nine M002 specs, table and button included) to bound-only inputs. — the spec loops over both `routeKinds`, records painted entries for the five attributes, asserts an empty list, and annotates `e8-frames`; the spec comment states the bound-only fail branch. Recorded orchestrator Verify exit 0 covers Chromium development and production and Firefox and WebKit development through run-job.mjs. The Log line `E8 verdict: pass` gives 0 entries per engine, configuration, and route kind.
- ✅ `recordPaintedAttributes` exists with the Interface contract's signature and behaviour, and the existing helpers of `apps/yeti-app-e2e/src/support/style-probe.ts` are unchanged. — numstat 119/0 for style-probe.ts; no removed line.
- ✅ The probe directive lives only in the fixture file and follows the removed-kind pattern of the Interface contract. — `git grep StaticAttributeProbe 5b5ad6c -- packages` finds nothing; pattern as above.
- ✅ `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit. — prettier re-run by the reviewer on the 5b5ad6c export: clean; recorded Verify ran lint and typecheck for both touched projects.

Warnings (non-blocking):
- Firefox and WebKit production counts rest on the coder's Log line (maker prose); the recorded Verify ran those two engines in development only. A later full `ci e2e` run covers all six combinations on the same spec.
- AC1 should name the Verify that covers every engine and configuration it lists; it currently asks for more than the Verify runs.

Contract violations (blocking):
- none

## T004 — Prove Guidepup with NVDA locally and add the voiceover and nvda CI jobs with the card list check: pass

- ✅ Screen-reader project (T004): Nx project `screen-reader-e2e` at `apps/screen-reader-e2e` with targets `nvda` and `voiceover` and no `test`, `test-storybook`, or `e2e` target; one test file per item, `apps/screen-reader-e2e/src/{item}.screen-reader.ts`, run by both lanes; the lane drivers `apps/screen-reader-e2e/src/support/nvda.ts` and `apps/screen-reader-e2e/src/support/voiceover.ts` and the shared helpers in `apps/screen-reader-e2e/src/support/screen-reader.ts` open a static Storybook story by id and return the phrases the screen reader spoke; each lane writes the phrases it heard to a JSON report under dist/screen-reader-e2e/ (uploaded as an artifact in CI), and tests assert per-lane substrings. — project.json at 7ad619f defines `typecheck`, `nvda`, `voiceover` only; config is `screen-reader.config.mts` (no inferred `e2e`); `card.screen-reader.ts` asserts per-lane substrings; both jobs upload `dist/screen-reader-e2e/`.
- ✅ On this Windows 11 ARM64 machine, `npm exec nx -- run screen-reader-e2e:nvda` with `BROWSERS=msedge` drives real NVDA through Guidepup and passes `apps/screen-reader-e2e/src/card.screen-reader.ts`: `card--list` is announced as a list with its count and each card as a list item, asserted as substrings; the Log records the NVDA version, the browser channel, and the phrases heard. — recorded orchestrator Verify (sidecar gsd-path-verify/task-t004-verify) exit 0 for `BROWSERS=msedge npm exec nx -- run screen-reader-e2e:nvda`; ledger entry commit 7ad619f exit 0; the Log records NVDA 2026.2, `msedge` (Edge 154), and the phrases including `list, with 3 items` and `no next list item`.
- ✅ `.github/workflows/ci.yml` has a `voiceover` job on `macos-26` that drives VoiceOver in real Safari through WebdriverIO and Guidepup with the same card check, and an `nvda` job on `windows-2025` that runs it in Playwright's Chromium and Firefox; both have a stated retry budget, a 20-minute timeout, and a phrase-report artifact. — ci.yml diff: `voiceover` runs-on `macos-26`, `nvda` on `windows-2025`, both `timeout-minutes: 20`, `upload-artifact` with `if: always()`; the comment points at the config's `retries: 2`; voiceover.ts imports `remote` from webdriverio and calls `macOSActivate('Safari')`.
- ✅ The `nvda` job passes locally natively by the command `references/ci-local.md` gives; `references/ci-local.md`, `AGENTS.md` "Run CI locally", and `.claude/skills/ngx-yeti-testing/SKILL.md` name `safari` and `voiceover` as the macOS-only jobs, state that every other job passes locally and in CI, and say how the NVDA lane runs locally. — ci-local.md native table row gives `BROWSERS=msedge npm exec nx -- run screen-reader-e2e:nvda`, which the recorded Verify ran with exit 0; all three documents carry the macOS-only pair and the local-and-CI rule (diffs at 7ad619f).
- ✅ The `screen-reader-e2e` project is not run by `npm run check`, the `unit` and `e2e` jobs, `floor.yml`, or `nx run-many -t e2e`, and its `lint` and `typecheck` pass. — `check` is `nx run-many -t lint typecheck test test-storybook` and the project has none of test/test-storybook/e2e; recorded Verify ran `run-many -t lint typecheck -p screen-reader-e2e` with exit 0.
- ✅ `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit. — prettier re-run by the reviewer on the 7ad619f export: clean; the affected run is coder prose on the uncommitted tree (`--base=HEAD`, 9 projects).

Warnings (non-blocking):
- The VoiceOver substrings are not yet measured (by design; first measured on the milestone pull request).
- Later tasks T031 and T041 reworked the NVDA lane, and the current AGENTS.md says the `BROWSERS=msedge` lane is not evidence for the `nvda` job; at this landing AC3's command was the msedge one and it passed.
- README.md:97 lists the ci.yml jobs without `voiceover` or `nvda` (coder follow-up; outside `files`).

Contract violations (blocking):
- none (all paths in `files`; nx.json was listed and left unchanged).

## T005 — Generate and prove the control-yeti-app skill for the Fixture app: pass

- ✅ Ignore entries (T005): `.gitignore` ignores `.playwright-cli/` for every control skill's playwright-cli sessions; evidence and state live under `tmp/control-{name}/`, which `tmp` already ignores. — .gitignore diff adds `.playwright-cli/`; control.mjs writes state and evidence under `tmp/control-yeti-app/`.
- ✅ `.claude/skills/control-yeti-app/` holds the files listed in `files`, with SKILL.md's ten sections, a feature map entry per listed feature, and every command literal and taken from this repository. — 8802d37 adds SKILL.md, scripts/control.mjs and the five feature files; SKILL.md has the scope line plus Pick a flow, Launch, Doctor, Drive, Inspect, Evidence, Cleanup, Helpers, Gotchas (the creator skill's ten, in order).
- ✅ The proof run is recorded in the Log: `up` (with time to ready), `doctor` exit 0 naming each check and the build it found, one feature driven (an item route with JavaScript off and with `main.js` held back), evidence that survives `down`, the port free and the process tree gone after `down`, and one refusal of a mismatched PID that exits 2. — Log retry proof: `up` ready 22 s, doctor exit 0 with seven checks and `development build`, `/sub/card` held-back and JS-off, evidence 10 files kept, `down` stopped 5 PIDs with portFree true, mismatched PID refusal exit 2. Recorded orchestrator Verify exit 0 (ledger commit 8802d37) ran up, doctor, down.
- ✅ `control.mjs` refuses the main checkout's port from a worktree and derives its own port there. — control.mjs:31 worktree range 4600+200 from a SHA-1 of the root; :218 refuses with "port N belongs to the main checkout; a worktree uses its derived port"; the Log records exit 2 for 4200 and 4000.
- ✅ `npx prettier --check .` passes at the task commit. — prettier re-run by the reviewer on the 8802d37 export: clean.

Warnings (non-blocking):
- The Verify's last step was repaired to `--ignore-unknown` (orchestrator plan-defect repair, logged).
- T029 and T047 later hardened control.mjs on the same lines.

Contract violations (blocking):
- none

## T006 — Generate and prove the control-ngx-yeti-storybook skill: pass

- ✅ Ignore entries (T005): `.gitignore` ignores `.playwright-cli/` for every control skill's playwright-cli sessions; evidence and state live under `tmp/control-{name}/`, which `tmp` already ignores. — T006 does not touch .gitignore; its evidence and state go under `tmp/control-ngx-yeti-storybook/` (SKILL.md Evidence; Log proof path).
- ✅ `.claude/skills/control-ngx-yeti-storybook/` holds the files listed in `files`, with SKILL.md's ten sections and every command literal and taken from this repository. — 310ac37 adds the six listed files; SKILL.md has the scope line plus the nine headed sections in the creator skill's order.
- ✅ The proof run is recorded in the Log: `up` for the static build on a derived port with time to ready, `doctor` exit 0, `card--stretched-link` opened with its play function run and its axe result captured, evidence that survives `down`, the port free and the process tree gone after `down`, and one refusal of a mismatched PID that exits 2. — Log: `up` static on derived 4483, readyMs 13427; doctor exit 0, six checks; play function phase `finished`, a11y `passed`, violations `[]`; evidence kept after `down`; port free; refusal exit 2. Recorded orchestrator Verify (isolate gsd-path-task/T006) exit 0.
- ✅ The skill states how to open a story without rerunning its play function and how to run it. — SKILL.md:52-54: `embed=true` to open without play; the no-`embed` URL or `test-storybook -t` to run it.
- ✅ `npx prettier --check .` passes at the task commit. — prettier re-run by the reviewer on the 310ac37 export: clean.

Warnings (non-blocking):
- T047 later hardened this control script on the same lines.

Contract violations (blocking):
- none

## Intent coverage

### SC3 — On the Fixture app, each of the 22 items has a prerendered `/<item>` and a server-rendered `/server/<item>` route that passes `yeti-app-e2e` with JavaScript on and off, axe-clean on the `wcagTags` rule set and with no hydration mismatch, plus every other layer-4 Fixture-app case its spec names: the client `@defer` with preload and `hydrate never` cases, the item link removed on leaving the route and re-inserted on return, no horizontal overflow at 320 px where the spec says so, the written-back static attributes (`align`, `border`, `nowrap`, a link's `disabled`) absent from every painted frame, the shared-host cases that keep both links, frame's zero layout shift, table's pinned-head Shift+Tab walk (table.md:416, A11Y-22's table repeat), scroller's focus and scroll position made before hydration surviving it (scroller.md:314), and `enter`'s `once` element keeping `data-once` through hydration and arriving only when scrolled to (enter.md:269). The negative-control routes the specs require (table without `tbody`, table.md:411; center's bordered anti-pattern, center.md:288) are labelled as what not to write, record their logged error or measurement, and are exempt from the no-mismatch and axe checks. The card route shows its cards in a `yetiGrid` with the footer links as `yetiButton`, the setup spec's layer-4 order case passes, and the Tailwind C1 and C2 Fixture build configurations pass (cases carried over from M001). Walkthrough: with JavaScript disabled, `/sub/stack` and `/sub/card` show styled layouts, the card grid lays out its cards in columns, and Tab on `/sub/scroller` focuses the scroller and ArrowRight scrolls it.: pass
- ✅ wave 1's share (T002 AC1 and AC2, T003 AC1 per PLAN.md Intent coverage) is met on the isolated products: all 22 items plus the extra keys are registered and served in both render modes behind hydrating, axe-clean stubs (recorded T002 Verify exit 0); the written-back attributes are absent from every painted frame (T003). The item routes' own cases, negative controls, card grid, order case, and Tailwind configurations belong to T007 to T025 and are not judged here.
- ✅ E8 (held-out, apps/yeti-app-e2e/src/static-attributes.spec.ts): recorded T003 Verify exit 0; Log `E8 verdict: pass` with 0 painted entries everywhere.
- ✅ E9 (held-out, apps/yeti-app-e2e/src/fixture-app.spec.ts): recorded T002 Verify exit 0; containment checks at fixture-app.spec.ts:132, :164, :185.
- ✅ E15 (held-out, owned by T011 for its test): the ruling chosen here is the Departures row, present at c289e6c.
- ✅ N3 (judgment): the stubs and the probe fixture render plain visible text; no opacity, visibility, display, or inert gating in either diff; the JS-off tests assert visibility.

### SC8 — `npm run check` passes, and every job of `.github/workflows/ci.yml` and `floor.yml` passes both locally and in CI (user ruling 2026-10-10: "The floor job (and all other checks) must pass both locally and in CI for every Milestone and every PR in general."). Locally, the container jobs run through `node tools/ci-local/run-job.mjs` (AGENTS.md "Run CI locally"), including layer 2 in the floor engines (Chromium 141 and Firefox 145, ngx-yeti-specs SKILL.md:36). In CI, the milestone's changes pass every job, the `safari` job (real Safari, ci.yml:90-108) and SC9's `voiceover` job included, before they reach `main`. The macOS-only jobs (`safari`, `voiceover`) are exempt from the local run and pass in CI on every PR; SC9's `nvda` lane is the local screen-reader coverage. The milestone integrates through a pull request to `main` (integration `pull-request`), so `ci.yml` and `floor.yml` run on it and every job passes before the user merges it (user ruling 2026-10-10: "Accept all three recommendations").: pass
- ✅ wave 1's share (T004 AC3) is met: the `nvda` lane passed natively by the ci-local.md command (recorded Verify exit 0) and the three documents name `safari` and `voiceover` as the only local exemptions. The CI runs and the milestone-wide local run belong to T024 AC2 and T028 AC1. E10 and N8 are dismissed in INTENT.md.

### SC9 — Approved by the user 2026-10-10 ("Approve SC9."; automated screen-reader tests are always preferable): a new `voiceover` job in `.github/workflows/ci.yml`, on a pinned `macos-26` GitHub-hosted runner, drives real VoiceOver in real Safari through Guidepup (`@guidepup/guidepup`, MIT; set up with `@guidepup/setup`) and passes: timeline is announced as a list with its entry count and each entry as a list item, and the same markup without `role="list"` is not announced as a list (timeline.md:326); icon's decorative form adds no "image" to its link or button name and its standalone form is announced with its name as an image (icon.md:304); spinner's inserted status region is captured with phrase capture, and the result (announced once, or not at all) is recorded as the measurement spinner.md:197 asks for. grid's, cluster's, and card's list semantics (grid.md:66, cluster.md:69, card.md:69, a list of cards announced as a list with its count) get the same timeline-style check. A second lane, an `nvda` job on `windows-2025`, runs the same checks with real NVDA through Guidepup in Chromium and Firefox, and runs locally on this Windows 11 ARM64 machine with a native arm64 browser channel (Edge or Chrome); its first task proves NVDA under Guidepup works here (expected from NVDA 2026.1+ ARM64 support and `@guidepup/setup` passing on `windows-11-arm`, not yet measured). NVDA proves Chromium's and Gecko's trees, VoiceOver proves WebKit's, so the WebKit list-semantics checks are asserted only in the VoiceOver lane. Each lane records its own spoken phrases on its first green run and asserts them as substrings. The job cannot run locally (it needs macOS); it runs in CI on the integration push, like the `safari` job. Departure rows in `.claude/skills/ngx-yeti-specs/SKILL.md` record that these checks replace the manual release tests of ADR 0015 point 7 and the accessibility skill's Manual row; spinner keeps one human listen per release until VoiceOver's phrase capture is proven not to merge live-region phrases.: pass
- ✅ wave 1's share (T004 AC1 and AC2) is met: NVDA under Guidepup proven on this machine with the native arm64 `msedge` channel (recorded Verify exit 0; phrases in the Log), card.md:69 checked on `card--list` with substrings, and ci.yml holds the `voiceover` (`macos-26`) and `nvda` (`windows-2025`) jobs. The timeline, icon, spinner, grid, and cluster checks and the Departures rows belong to T027.
- ✅ E16 (held-out, owned by T027's timeline test): wave 1 already asserts substrings, not whole phrases.
- ✅ N9 (judgment): `retries: 2` is the stated budget; nothing is skipped or turned manual.

## Summary for orchestrator

- blocked findings: none
- repeat offenders: none
- warnings worth a human eye: T003's Firefox and WebKit production counts rest on coder prose (the recorded Verify ran those engines in development only); T004's VoiceOver substrings are unmeasured until the milestone PR; the AC "affected --base=HEAD~1" lines of T001 to T004 have no recorded output at the task commit (prettier re-checked by the reviewer on each landing export: clean); README.md:97 does not yet list `voiceover`/`nvda`.
