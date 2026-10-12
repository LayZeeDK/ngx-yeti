---
id: T046
title: Make the stub-route, reduced-motion, held-frame, and Storybook e2e checks fail when they should, and record the client-only preload cases
wave: 4
deps: [T020, T021, T022, T023, T025, T049]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - apps/yeti-app-e2e/src/fixture-app.spec.ts
  - apps/yeti-app-e2e/src/support/fixtures.ts
  - apps/yeti-app-e2e/src/enter.spec.ts
  - apps/yeti-app-e2e/src/overlay.spec.ts
  - apps/yeti-app-e2e/src/static-attributes.spec.ts
  - apps/yeti-app-e2e/src/card.spec.ts
  - apps/yeti-app/src/app/fixtures/static-attributes-fixture.ts
  - apps/yeti-app/src/app/fixtures/breakout-fixture.ts
  - apps/ngx-yeti-e2e/src/overlay.spec.ts
  - apps/ngx-yeti-e2e/src/scroller.spec.ts
  - apps/ngx-yeti-e2e/src/grid.spec.ts
  - .claude/skills/ngx-yeti-specs/SKILL.md
---

# T046 — Make the stub-route, reduced-motion, held-frame, and Storybook e2e checks fail when they should, and record the client-only preload cases

## Context

Third build repair, review round 1 of M002 (range f35b35f..1747fe0, triaged by the orchestrator on 2026-10-12). The triage and reviewer files are git-ignored local records, so every finding is inlined. Line numbers are at 1747fe0; T020 to T023 replace the button, icon, container, and table stubs and T025 edits `fixture-app.spec.ts` and `card.spec.ts` before this task, so lines will have moved.

Findings, verbatim (criterion or spec line, then the observation):

- Triage item 2, minor (g3 code reviewer; thermos earlier): "apps\yeti-app-e2e\src\fixture-app.spec.ts:44-73 and 229-240. `stubRoutes` still lists every item route (box, breakout, cluster, ... visually-hidden), and each test ends with `test.skip(!isStub, 'the item task has replaced the stub')`. Failure: most of these routes now have real fixtures (box-fixture.ts, for example, is a full fixture), so most entries load the page, then skip. The suite then reports dozens of skips that cover nothing, and a route that silently falls back to its stub would pass unnoticed." Triage fix: "drop built items from `stubRoutes` and assert the stub marker for the rest."
- Triage item 5, cosmetic: "apps\yeti-app-e2e\src\support\fixtures.ts:9-10: `clientPreloadEntry = /^add link yeti-css\/\w+\/[\w-]+\/[\w-]+\.css\?v=\w+$/` accepts any `{item}/{other}.css` path. Failure: `withoutClientPreloads` would also hide an unexpected non-preload link whose path happens to fit this shape. Matching folder name equal to file name (as `clientItemPreload` does) would be tighter."
- Triage item 3, minor (g3 silent-failure hunter): "apps/yeti-app-e2e/src/enter.spec.ts:528-563 (added in ab65119) ... `if (reduced !== (motion === 'reduce')) { test.info().annotations.push({ type: 'reduced-motion', ... 'did not reach the page' }); } ... .toBe(reduced ? 0.00001 : 0.6);` Failure: in every engine, if the `reducedMotion: 'reduce'` emulation fails to reach the page, the reduce case quietly asserts the 0.6 s duration and passes ... the comment above it gives the reason only for the floor job's WebKit, which ignores emulated reduced motion. No ledger or upstream-bugs row covers Chromium or Firefox." Triage fix: "annotation fallback for WebKit only; assert `reduced === (motion === 'reduce')` elsewhere."
- Minor (g3 code reviewer, full): "apps/yeti-app-e2e/src/enter.spec.ts:564 `.toBe(reduced ? 0.00001 : 0.6)` hard-codes the default of `--yeti-enter-duration` (600ms, vendor/yeti/src/tokens/components.css:125) and its reduced value (0.01ms, :183). ADR 0006: 'No spec or test depends on a public token's default value.' A pin move that changes the token would fail this test with no regression. The Storybook half already reads tokens with `tokenTime` (apps/ngx-yeti-e2e/src/enter.spec.ts:31)."
- Cosmetic (g3 code reviewer, full): "apps/yeti-app-e2e/src/enter.spec.ts:383-400 checks only that the `hydrate on viewport` section stays still. It never asserts that the block is still dehydrated before the scroll (enter.md: 'dehydrated and still above the fold')."
- Triage item 4, minor (g3 silent-failure hunter): "apps/yeti-app-e2e/src/overlay.spec.ts:130-136, 159-163 ... `expectStyledFrames(await heldPosition(), { ..., recordedAs: 'client-held-frames' })`, with the comment 'The held child's own samples are only recorded ... the probe's frame callback can run before Angular's change detection in the same frame, so it may sample a frame that is never painted.' Failure: in every engine and both builds, the held child's styling per frame is never asserted ... there is no upstream-bugs or ledger row and no Departures row for `client-held-frames` ... This one rests on an inferred probe-timing race with no recorded measurement." Triage fix: "measure the claimed race; assert, or add a Departures row with the measurement."
- Minor (g3 code reviewer, full), the client-only `@defer` preload case of 16 item routes. Criterion: every item spec's bullet "a {item} inside a client-only @defer block with {item} in the preload list shows no unstyled frame", and INTENT SC3's "the client @defer with preload ... cases". Observed: "the comment 'The server hosts keep the X link in the head, so the client-only X reuses it' at apps/yeti-app-e2e/src/ box.spec.ts:121, breakout.spec.ts:125, center.spec.ts:143, cluster.spec.ts:131, columns.spec.ts:98, cover.spec.ts:75, frame.spec.ts:372, grid.spec.ts:158, layer.spec.ts:163, masonry.spec.ts:112, overlay.spec.ts:130, scroller.spec.ts:130, sidebar.spec.ts:118, spinner.spec.ts:186, stack.spec.ts:129 and timeline.spec.ts:141. The visually-hidden test ... has the same shape ... Each test runs while server-rendered hosts still hold the item link. Dropping any item from app.config.ts's preload list would leave all of them green. Only the hint-presence checks in fixture-app.spec.ts:152-190 would notice. The Departures row covers only setup.md:341, card.md:337 and lift.md:249 ... Fix: add a Departures row extending the card ruling to every item, or show the client-only host after removing every server host, as card's 'after every card host has left' test does." Measured fact the plan uses: card's after-every-host test (apps/yeti-app-e2e/src/card.spec.ts:211-241) records its frames instead of asserting them, because "The server's card link used the preload at load, and routing turns the HTTP cache off, so the re-inserted link refetches: recorded, not asserted. The setup-defer route carries the 0-frame preload claim."
- Planning IDs in shipped code (triage item 7 and the g3 full re-run), minor: "apps/yeti-app-e2e/src/fixture-app.spec.ts:44 (M002)", ":226-227 ('item task')" (comment analyzer: "'Item task' is planning vocabulary ... Rephrase it as 'an item that replaces its stub covers its route in its own spec'"), "apps/yeti-app-e2e/src/fixture-app.spec.ts:150 `// E9: ...`", "apps/yeti-app-e2e/src/static-attributes.spec.ts:70, a test title ending in `(E8)`, and :88, the annotation type `'e8-frames'`", "apps/yeti-app/src/app/fixtures/static-attributes-fixture.ts:39 `The E8 measurement route`". "These are INTENT edge-case IDs from .project, which gets archived at ship. They are not ledger or upstream-bugs IDs."
- Triage item 6, minor (comment analyzer): "apps/yeti-app/src/app/fixtures/breakout-fixture.ts:13-14 ... 'The bleeding child stands in for a `yetiFrame` until frame lands.' It is stale ... frame is built."
- Cosmetics (g3 code reviewer, full): "apps/ngx-yeti-e2e/src/overlay.spec.ts:171-180: the `reachable` check cannot fail. Setting `scrollTop` by script also works on an `overflow: hidden` element, and the check is trivially true when nothing overflows. The real check is `overflow-y: auto` at :169. Either drop `reachable`, or first assert `scrollHeight > clientHeight` at 200 %." "apps/ngx-yeti-e2e/src/scroller.spec.ts:139-184 runs the snap/justify centring case only at the default viewport. scroller.md:303 puts the Storybook half at 1280 x 800 and 320 x 640." "apps/yeti-app-e2e/src/card.spec.ts:245 and :333 partly repeat what `describeStandardRouteCases` already tests (the leave and return link; the JavaScript-off class, presence attribute and item link). The testing skill says 'no spec restates them'. Both tests add assertions of their own, so keep only those additions." "apps/ngx-yeti-e2e/src/grid.spec.ts:178-185 is unreachable: `boxAt` already throws on a missing cell."

## Approach

- Stub routes: `stubRoutes` lists exactly the registered routes whose fixture still renders the stub marker at this task's base (after T020 to T023), and each listed route asserts the marker with no `test.skip`. Add one check over every other registered route that it does not render the stub marker, so a route that falls back to its stub fails. If no stub is left, `stubRoutes` and its cases go, and the fallback check stays. Keep T030's negative control (`@stub-route-control`) meaningful: it must still prove a missing or broken route fails, or move onto the fallback check.
- `clientPreloadEntry`: match only an item file whose folder name equals its file name, as `clientItemPreload` does.
- Enter reduced motion: the annotation fallback applies only when `browserName` is `webkit`; in Chromium and Firefox assert `reduced === (motion === 'reduce')` first. Read the expected durations from Yeti's `--yeti-enter-duration` token on the page (no-preference and reduced), never from its default value (ADR 0006); reuse the token-reading approach of `apps/ngx-yeti-e2e/src/enter.spec.ts` instead of a second copy if it can be shared without a new module, else read the token inline. Assert the `hydrate on viewport` block is still dehydrated before the scroll.
- Overlay held frames: measure the race the comment claims. Run the held-child cases with the frames asserted (no `recordedAs`) at least 20 times per engine (Chromium, Firefox, WebKit) in both builds, through the container jobs for Firefox and WebKit. If no run shows an unstyled frame, assert them and drop `client-held-frames`. If some do, keep the recording and add a Departures row to `.claude/skills/ngx-yeti-specs/SKILL.md` naming the case, the measured counts per engine and build, the date, and the reason; the comment then points at that row, not at an inference.
- Client-only `@defer` preload cases: add one Departures row to `.claude/skills/ngx-yeti-specs/SKILL.md` that extends the card row to every item spec's client-only `@defer` bullet: the item routes show the client-only host while server-rendered hosts hold the item link; the preload claim itself is carried by the setup-defer route's 0-frame case and the per-item hint checks of `fixture-app.spec.ts`; and card's after-every-host case shows that the re-inserted link refetches, so a per-item after-every-host case would record, not assert. The 16 item specs are not edited. Prettier formats the table.
- Planning IDs: remove E8, E9, M002, and "item task" from the named comments, the test title, and the annotation type (`e8-frames` gets a name that says what it records). `rg` the repository for each renamed annotation type before renaming; nothing outside the spec reads `e8-frames` at 1747fe0.
- breakout fixture: compose `yetiFrame` if the route's checks and axe still hold with it, else say why the plain child stays.
- Storybook e2e cosmetics: `reachable` first asserts the element overflows at 200 % (or goes); the scroller snap/justify centring case runs at 1280 x 800 and 320 x 640; the unreachable lines of the grid spec go.
- card: drop only the restated standard-route assertions at the two named tests and keep each test's own additions.
- No assertion of a passing case gets weaker. Never edit `docs/specs/specs/*.md`. No comment names a task, milestone, edge id, or date.
- The e2e servers use fixed ports (4310 to 4312, 4401), so the orchestrator serializes heavy runs. Read `references/ci-local.md` before a container job.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/ngx-yeti-specs/SKILL.md`, `.claude/skills/type-safety/SKILL.md`, `.claude/skills/yeti-pin/SKILL.md` (tokens).

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. `apps/yeti-app-e2e/src/fixture-app.spec.ts` has no `test.skip(!isStub` and lists in `stubRoutes` only routes that still render the stub marker; a registered route that renders the stub marker without being listed fails a test (the Log records that control run).
2. `clientPreloadEntry` matches only `yeti-css/{kind}/{item}/{item}.css?v={hash}` entries.
3. The enter reduced-motion case asserts in Chromium and Firefox that the emulation reached the page, annotates only in WebKit, reads both durations from the token, and passes in the ci e2e containers and the `webkit-26-4` floor job; the `hydrate on viewport` case asserts the block is dehydrated before the scroll.
4. The overlay held-child frames are either asserted in every engine and build with the measurement in the Log, or recorded under a Departures row that states the measured counts.
5. `.claude/skills/ngx-yeti-specs/SKILL.md` has the Departures row for the client-only `@defer` preload bullet of every item spec, naming the setup-defer route and the hint checks as the carriers of the preload claim.
6. No E8, E9, M002, or "item task" remains in the named comments, test title, or annotation type; the breakout fixture's comment no longer waits for frame.
7. The ngx-yeti-e2e overlay `reachable` check can fail or is gone, the scroller centring case runs at both viewports, the unreachable grid lines are gone, and the two card tests keep only their own assertions.
8. The touched specs pass locally in Chromium (development and production builds) and in the Firefox and WebKit containers.
9. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at each task commit.

## Verify

```bash
npm ci && npx playwright install chromium && ! rg -q -F "test.skip(!isStub" apps/yeti-app-e2e/src/fixture-app.spec.ts && ! rg -q -F "e8-frames" apps/yeti-app-e2e/src/static-attributes.spec.ts && npm exec nx -- run-many -t lint typecheck -p yeti-app yeti-app-e2e ngx-yeti-e2e && npm exec nx -- e2e yeti-app-e2e -- fixture-app.spec.ts enter.spec.ts overlay.spec.ts static-attributes.spec.ts card.spec.ts && FIXTURE_CONFIGURATION=production npm exec nx -- e2e yeti-app-e2e -- fixture-app.spec.ts enter.spec.ts overlay.spec.ts && npm exec nx -- e2e ngx-yeti-e2e -- overlay.spec.ts scroller.spec.ts grid.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=firefox fixture-app.spec.ts enter.spec.ts overlay.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=webkit fixture-app.spec.ts enter.spec.ts overlay.spec.ts && node tools/ci-local/run-job.mjs floor webkit-26-4 -- npx nx e2e yeti-app-e2e -- --project=webkit enter.spec.ts; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-12 — created by planner (build repair #3, review round 1 fixes; triage items 2, 3, 4, 5, the fixture-app and Fixture comment sites of items 6 and 7, and the g3 full re-run's minors and cosmetics on these files). At 1747fe0 the spec still holds `test.skip(!isStub` and `e8-frames`, so the Verify fails if this task is skipped. deps: T025 (file overlap, `fixture-app.spec.ts` and `card.spec.ts`); T020, T021, T022, T023 (prerequisite effect: each replaces the stub of its routes, button, icon, container, table, table-numeric, and table-without-tbody, in its own fixture; once `stubRoutes` asserts the marker with no skip, a later stub replacement would fail it, so this task runs after all four). The Departures row for the client-only preload cases is the planner's choice between the reviewer's two fixes, made on the measured card result quoted in Context; the alternative is 16 recorded-only cases. The Verify ends by stopping the Nx daemon and keeps its own exit code; run it exactly as written and never set NX_DAEMON.
- 2026-10-12 — planner (build repair #3, the user's ruling to rename the package stylesheet, T049): deps gains T049 for file overlap (.claude/skills/ngx-yeti-specs/SKILL.md). Nothing else changes.
