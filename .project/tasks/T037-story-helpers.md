---
id: T037
title: Share the story helpers, wait for applied item styles with a longer poll, and migrate every story
wave: 4
deps: [T042]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - packages/ngx-yeti-testing/src/index.ts
  - packages/ngx-yeti-testing/src/lib/story-helpers.ts
  - packages/ngx-yeti-testing/src/lib/story-helpers.browser.spec.ts
  - .claude/skills/ngx-yeti-stories/SKILL.md
  - packages/ngx-yeti/box/src/box.stories.ts
  - packages/ngx-yeti/breakout/src/breakout.stories.ts
  - packages/ngx-yeti/card/src/card.stories.ts
  - packages/ngx-yeti/center/src/center.stories.ts
  - packages/ngx-yeti/cluster/src/cluster.stories.ts
  - packages/ngx-yeti/columns/src/columns.stories.ts
  - packages/ngx-yeti/cover/src/cover.stories.ts
  - packages/ngx-yeti/enter/src/enter.stories.ts
  - packages/ngx-yeti/frame/src/frame.stories.ts
  - packages/ngx-yeti/grid/src/grid.stories.ts
  - packages/ngx-yeti/layer/src/layer.stories.ts
  - packages/ngx-yeti/lift/src/lift.stories.ts
  - packages/ngx-yeti/masonry/src/masonry.stories.ts
  - packages/ngx-yeti/overlay/src/overlay.stories.ts
  - packages/ngx-yeti/scroller/src/scroller.stories.ts
  - packages/ngx-yeti/sidebar/src/sidebar.stories.ts
  - packages/ngx-yeti/spinner/src/spinner.stories.ts
  - packages/ngx-yeti/stack/src/stack.stories.ts
  - packages/ngx-yeti/timeline/src/timeline.stories.ts
  - packages/ngx-yeti/visually-hidden/src/visually-hidden.stories.ts
  - packages/ngx-yeti/styles/src/setup.stories.ts
---

# T037 — Share the story helpers, wait for applied item styles with a longer poll, and migrate every story

## Context

Build repair before wave 4. User ruling, verbatim (2026-10-11): "1-3: Approve." Its first item is "1 extract shared test helpers before wave 4"; this task is the stories part (T036 has layer 4, T038 layers 2 and 3). Two findings meet here.

Repetition (the maintainability review of wave 3, counted over 4978c46..c92e1b4; wave 3 copies and lines, then earlier copies): a manifest lookup `{item}Values(name)` 10 and 69 lines, plus 3; a `Map` of story states 12 plus 3; `trackedState` with an `{item}State(id)` lookup 16 and 144 lines, plus 3; `children(parent)` 9 plus 1; a length probe (`inlineLength`, `tokenLength`) 12 and 111 lines, plus 1; an `{item}Styled` wait 15 and 103 lines, plus 3; `expectClose` 11 plus 1; a typed test-id lookup 6 plus 1. That is about 565 lines in wave 3. `packages/ngx-yeti/columns/src/columns.stories.ts`, lines 16 to 116, shows the whole set.

Stories that fail under load (measured 2026-10-11, the wave 3 cycle 2 gate at 7e0045f): `node tools/ci-local/run-job.mjs ci unit` failed with `frame--default` in Firefox and with `box--composed` and `sidebar--end` in WebKit, the last two reading `0px` and `nowrap` before the item's sheet had applied. The same job had passed half an hour earlier and passed when run again alone. It runs `test` and `test-storybook` in three engines at once, and Storybook's `waitFor` gives up after one second.

"Loaded" is not "applied": T034 fixed `overlay--settings` by waiting for `itemStylesLoaded('box')` and then for a computed `padding-top`. Other sites wait on `itemStylesLoaded('box')` alone and then read geometry (the review of that fix; inferred from the shared pattern, not checked site by site): cluster.stories.ts:153; columns.stories.ts:207, :239, and :411; cover.stories.ts:171; scroller.stories.ts:166; sidebar.stories.ts:220, :280, :440, and :533; stack.stories.ts:197; and center.stories.ts:285. The same call is at grid.stories.ts:203 and :487 and at box.stories.ts:109; check those too. Wave 4 adds four items whose stories would copy this; T020 to T023 and T025 consume this task's helpers instead.

## Approach

- Outcome: the helpers of the Interface contract in one new file of the test library, exported from its browser entry; every stories file migrated; every local copy deleted; no compatibility layer.
- The browser entry is also imported in Node by the e2e apps. So the new file imports types only (`YetiComponentName` and `YetiComponent` from `yeti-css`), touches no DOM at module level, and imports nothing of Angular, Storybook, or Vitest. A story keeps creating its own `signal`; `storyStates` only keeps it by story id.
- `itemStyled` replaces every per-item styled wait and every wait on `itemStylesLoaded` alone that a read of geometry or colour follows. Wait on a property the item's file sets and the page's defaults do not; pass a predicate where the styled value is not one fixed string (a box's padding is "not 0px"). Its poll outlasts Storybook's one-second `waitFor`, which is what the load-sensitive stories lacked.
- Other waits that failed under load, `frame--default` in Firefox among them: a `waitFor` whose condition depends on a stylesheet or another resource arriving becomes `itemStyled` or an explicit wait for that resource's load. Never raise a global timeout and never add a fixed sleep.
- `assertWithin` throws, so inside `waitFor` it retries as `expectClose` did. Play functions still await every `expect` and `userEvent` call (ngx-yeti-stories skill).
- Unit test in `packages/ngx-yeti-testing/src/lib/story-helpers.browser.spec.ts`, which the library's browser project runs. Its Vitest config already serves `/__stylesheet/ok.css` and a `/__stylesheet/pending.css` that stays pending for 2 s: prove that `itemStyled` resolves once the sheet has applied, and that it rejects, naming the last value read, when the property does not match within a short timeout.
- This is a refactor of tests. Play functions keep every assertion and no story is dropped. Prohibition N1 (judgment): must not reach a green axe gate by switching off rules or hiding content from assistive technology; no story disables an axe rule except a documented anti-pattern exception under the ngx-yeti-stories skill, and no fix adds aria-hidden, role=presentation, inert, or visually-hidden to content a user needs.
- Comments in the files this task touches keep the reason the code cannot state and lose ticket, decision, and planning ids. Known sites: "ticket 50 decision 8" in the breakout, timeline, and layer stories, "ticket 50 decisions 8 and 55" in the overlay stories, and "ticket 50 decision 191" in the spinner stories. One comment about upstream O2 on the shared helper replaces the per-file copies.
- Docs in this task: a "Story helpers" section in `.claude/skills/ngx-yeti-stories/SKILL.md` that names each helper and the rule that a story waits through `itemStyled` before it reads geometry or colour.
- Proof under load: the three-engine unit job, which runs `test` and `test-storybook` together, uncached, five times in a row with nothing else running on the machine; record the five results in the Log. The Verify runs it twice. A layer-2 test that fails in those runs is outside this task's files: report it as a `NEEDS-ORCHESTRATOR:` line with the test's name and output, and do not edit it here (the lift spec's first WebKit hover test has timed out once under load, and T038 looks at it). The job takes the whole machine, so the orchestrator serializes heavy runs.
- Skills: `.claude/skills/ngx-yeti-stories/SKILL.md`, `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/ngx-yeti-accessibility/SKILL.md`, and `.claude/skills/type-safety/SKILL.md`; read `references/ci-local.md` before running a container job.

## Interface contract

- Story helpers (T037), exported from `@ngx-yeti/testing` beside `itemStylesLoaded`, with no Angular, Storybook, or Vitest import: `itemStyled(item: YetiComponentName, element: Element, property: string, expected: string | ((value: string) => boolean), options?: { readonly timeout?: number }): Promise<void>` resolves once the item's file has loaded with rules and the element's computed `property` equals `expected` or satisfies it, checking every animation frame, and rejects after `timeout` ms (5000 unless given) with an Error that names the item, the property, and the last value read; `usedLength(root: Element, length: string, axis?: 'inline' | 'block'): number` is the used px size of a CSS length read from a probe appended to `root`, on the inline axis unless `axis` says otherwise; `elementChildren(parent: Element): HTMLElement[]`; `assertWithin(actual: number, expected: number, tolerance?: number): void` throws an Error naming both numbers when they differ by more than `tolerance` (1 unless given); `manifestValues(component: YetiComponent, attribute: string): readonly string[]` is the values of that attribute of a manifest component, or an empty list; and `storyStates<T>(item: string): { track(id: string, state: T): T; get(id: string): T }` keeps one state per story id, where `get` throws an Error naming `item` and the id when none was tracked. A story waits through `itemStyled` before it reads geometry or colour that depends on an item's file, and declares no copy of these helpers.

## Intent coverage

- None

## Acceptance criteria

1. `@ngx-yeti/testing` exports the helpers of the Interface contract from one file that imports nothing of Angular, Storybook, or Vitest, and no stories file declares its own manifest lookup, state map with `trackedState`, children helper, length probe, per-item styled wait, or `expectClose`.
2. Every story that reads geometry or colour depending on an item's file waits through `itemStyled` first, the box sites listed in Context included; no story waits on `itemStylesLoaded` alone before such a read.
3. `npm exec nx -- test-storybook ngx-yeti` passes, and the uncached three-engine unit job passes five times in a row with nothing else running; the Log records the five results.
4. `packages/ngx-yeti-testing/src/lib/story-helpers.browser.spec.ts` proves that `itemStyled` resolves once the sheet has applied and rejects with the last value read after its timeout.
5. No play-function assertion is removed or weakened, no story is dropped, and no story switches an axe rule off.
6. The comments listed in Approach state a reason and no ticket, decision, or planning id, and the stories skill has its Story helpers section.
7. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && test -f packages/ngx-yeti-testing/src/lib/story-helpers.ts && ! rg -q -F "function trackedState(" packages/ngx-yeti && ! rg -q -F "function expectClose(" packages/ngx-yeti && npm exec nx -- run-many -t lint typecheck -p ngx-yeti ngx-yeti-testing && npm exec nx -- test ngx-yeti-testing && npm exec nx -- test-storybook ngx-yeti --skip-nx-cache && node tools/ci-local/run-job.mjs ci unit && node tools/ci-local/run-job.mjs ci unit; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-11 — created by planner (build repair before wave 4; user ruling "1-3: Approve.", item 1, stories part). The counts and line sites in Context are from the wave 3 maintainability review and the review of commit e387da9, both of 2026-10-11, whose files are not in the repository. The Verify ends by stopping the Nx daemon and keeps its own exit code; run it exactly as written and never set NX_DAEMON.
- 2026-10-11 — coder (build_T037), implementation. Added `packages/ngx-yeti-testing/src/lib/story-helpers.ts` (`itemStyled`, `usedLength`, `elementChildren`, `assertWithin`, `manifestValues`, `storyStates`; a type-only `yeti-css` import and the sibling `./item-links`, nothing of Angular, Storybook, or Vitest), exported from `src/index.ts`, with `story-helpers.browser.spec.ts` (3 tests: resolves once the 2 s pending sheet has applied; resolves on a predicate; rejects after 100 ms naming item, property, and last value). Migrated all 21 stories files and deleted every local manifest attribute lookup, state `Map` with `trackedState` and getter, children helper, length probe, per-item styled wait, and `expectClose` (23 files, 923 insertions, 1436 deletions). Every `itemStylesLoaded('box')` site named in Context (and grid :203/:487, box :109) now waits `itemStyled('box', <a box element>, 'padding-top', value !== '0px')`; the other bare `itemStylesLoaded` waits became `itemStyled` on a property the item's file sets (center `box-sizing`/`margin-left`, stack `display`, lift `transition-property`, breakout `display`, sidebar `flex-wrap`). Functions that only called `expectClose` became synchronous `assert*` functions; every other `expect` stays awaited; no assertion, story, or axe rule changed. `frame`: `imageLoaded` is now an explicit `image.decode()` plus a `naturalWidth` assertion instead of a one-second `waitFor`; the `object` fill wait keeps `waitFor` with a local 5 s timeout, because an `object` with a `data:` document exposes no loaded state to wait on; `frame--composed` got two test ids for the sidebar and stack waits. Ticket and decision ids removed from the breakout, timeline, layer, overlay, and spinner comments; the O2 comment lives on `itemStyled` only. "Story helpers" section added to `.claude/skills/ngx-yeti-stories/SKILL.md`.
- 2026-10-11 — coder, deviations to review. (1) `enter`'s `expectArrivesOnce` keeps `itemStylesLoaded('enter')`: a withheld `data-once` host has the page's own values (`animation: none`, opacity 1), so no computed value marks the file as applied; it reads no geometry or colour. (2) `layer` keeps `markerValues`, which reads the manifest's `markers`, not `attributes`; `manifestValues` of the Interface contract reads attributes only. (3) `usedLength`'s probe is absolutely positioned (breakout, layer, and overlay needed that); the lengths probed are token and `rem`/`dvh` lengths, none a percentage. (4) `frame`'s `warnSpies` `Map` of spies and the per-file `byTestId` and `effectiveBackground` helpers are not in the Interface contract and stay.
- 2026-10-11 — coder, checks that passed: `npx prettier --check .` clean; `nx run-many -t lint typecheck -p ngx-yeti ngx-yeti-testing` exit 0; `nx test ngx-yeti-testing` 7 files, 78 tests passed; `nx test-storybook ngx-yeti --skip-nx-cache` (Chromium, native) 21 files, 128 tests passed, three times (once alone, twice inside the Verify).
- 2026-10-11 — coder, proof under load, five consecutive uncached `node tools/ci-local/run-job.mjs ci unit -- npx nx run-many --output-style=static -t test test-storybook --skip-nx-cache` in one lock hold (sibling coders T035 and T041 were active outside the lock, so "nothing else running" did not hold; about 4 GB free): run 1 exit 1 (`test-storybook`: "Failed to connect to the browser session [storybook (firefox)] within the timeout", 0 story tests ran; `test`: "Failed to connect to the browser session [browser (firefox)]" and 2 "Cannot connect to the server in 60 seconds", 956 passed, 0 failed); run 2 exit 1 (`tools/playwright-server/container.test.mjs` 11 failures "run-server did not answer" and `spawnSync /usr/bin/node ETIMEDOUT`; storybook Firefox session did not connect; `test` 788 of 789 passed); run 3 exit 1 (storybook: "Browser connection was closed while running tests" at center.stories.ts, 0 story tests ran); run 4 exit 1 (`test-storybook` 63 files, 384 tests passed in three engines; `test` 1363 of 1365: `styles/src/yeti-rank.node.spec.ts > is what the generator writes from Yeti's build` timed out in 5000 ms and `lift/src/lift.spec.ts > under a real pointer > raises a hovered card by --yeti-lift-distance and deepens its shadow` timed out in 15000 ms in Firefox); run 5 exit 0 (`test` 118 files, 1365 tests; `test-storybook` 63 files, 384 tests). In no run did a story's play function or axe gate fail: every story test that started passed.
- 2026-10-11 — coder, Verify run exactly as written through the heavy lock, twice: exit 1 both times. Both passed every step up to the first container job (78 and 128 tests). Attempt 1: container `test` 1365 of 1365 passed; `test-storybook` ran 0 tests ("Failed to connect to the browser session [storybook (firefox)] within the timeout", then "Browser connection was closed while running tests" at card.stories.ts). Attempt 2: `test-storybook` ran 0 tests (same Firefox session error, at box.stories.ts); `test` 1364 of 1365, `columns/src/columns.spec.ts > YetiColumnsChild > renders data-span from its binding, updates it, and removes it when unset` timed out in 15000 ms in WebKit.
- 2026-10-11 — NEEDS-ORCHESTRATOR: the Verify's container unit job fails before any story runs, because Vitest cannot connect its Firefox Storybook session within its timeout on the loaded machine, and layer-2 tests outside this task's files time out (lift.spec.ts first hover test in Firefox, yeti-rank.node.spec.ts, columns.spec.ts data-span test in WebKit); should the orchestrator rerun the Verify with nothing else running, or does the plan need a change outside this task's files? — readings: (a) the failures are machine starvation while sibling coders run, and the isolated rerun on a quiet machine is the evidence (run 5 of 5 passed everything, and every story test that started passed in all runs); (b) the browser-session connect timeout and the three layer-2 timeouts are defects to fix in the Vitest configs and specs, which are outside T037's `files` (T038 owns layers 2 and 3).
- Orchestrator answer: (a) the orchestrator reruns the Verify in its isolate with the heavy lock held; that rerun is this task's evidence, and the coder's two failed attempts stay recorded as load evidence (every story test that started passed; the failures were browser-session connects and three layer-2 timeouts outside this task's files, which T038 measures) — AGENTS.md, Authority order: "The orchestrator's isolated rerun of a task Verify is that task's evidence."
- 2026-10-11 — orchestrator Verify (isolate gsd-path-task/T037): fail, exit 1; output tail:
  ```
  Note: Recommended intrinsic image size is calculated assuming a maximum DPR of 2. To improve loading time, resize the image or consider using the "ngSrcset" and "sizes" attributes.
  22.17.07 [vite] [33m[2m(client)[22m[39m [2m[console.warn] [22mNG02952: The NgOptimizedImage directive (activated on an <img> element with the `ngSrc="/.storybook/assets/trail.svg?no-inline"`) has detected that the aspect ratio of the rendered image does not match the image's intrinsic aspect ratio. 
  Intrinsic image size: 1600w x 900h (aspect-ratio: 1.78). 
  Rendered image size: 255.188w x 178.703h (aspect-ratio: 1.43). 
  This issue can occur if "width" and "height" attributes are added to an image without updating the corresponding image styling. To fix this, adjust image styling. In most cases, adding "height: auto" or "width: auto" to the image styling will fix this issue.
  22.17.07 [vite] [33m[2m(client)[22m[39m [2m[console.warn] [22mNG02952: The NgOptimizedImage directive (activated on an <img> element with the `ngSrc="/.storybook/assets/trail.svg?no-inline"`) has detected that the height of the fill-mode image is zero. This is likely because the containing element does not have the CSS 'position' property set to one of the following: "relative", "fixed", or "absolute". To fix this problem, make sure the container element has the CSS 'position' property defined and the height of the element is not zero.
  22.17.07 [vite] [33m[2m(client)[22m[39m [2m[console.warn] [22mNG02960: The NgOptimizedImage directive (activated on an <img> element with the `ngSrc="/.storybook/assets/trail.svg?no-inline"`) has detected that the intrinsic image is significantly larger than necessary. 
  Rendered image size: 256w x 144h. 
  Intrinsic image size: 1600w x 900h. 
  Recommended intrinsic image size: 512w x 288h. 
  Note: Recommended intrinsic image size is calculated assuming a maximum DPR of 2. To improve loading time, resize the image or consider using the "ngSrcset" and "sizes" attributes.
  22.17.11 [vite] [31m[2m(client)[22m[39m [2m[console.error] [22mNG02955: The NgOptimizedImage directive (activated on an <img> element with the `ngSrc="http://127.0.0.1:50061/.storybook/assets/trail.svg?no-inline"`) has detected that this image is the Largest Contentful Paint (LCP) element but was not marked "priority". This image should be marked "priority" in order to prioritize its loading. To fix this, add the "priority" attribute.
  
  [7m[1m[31m NX [39m[22m[27m  [31mRunning targets [1mtest[22m, [1mtest-storybook[22m for 5 projects and [1m2[22m tasks they depend on failed[39m
  
  [2mFailed tasks:[22m
  
  [2m-[22m ngx-yeti:test-storybook
  [2m-[22m ngx-yeti:test
  ```
- 2026-10-12 — planner (build repair #2): deps now [T042]. The root-cause spike of 2026-10-12 measured that the unit job overloads its own runner when `test` and `test-storybook` run together with Vitest's default pages per engine. This attempt's failures (Firefox session connects, lift hover, yeti-rank, columns) are those signatures. T042 lands the job's fix (`VITEST_MAX_WORKERS: 2`, `--parallel=1`) first. The Verify now runs the job as the workflow states it, `node tools/ci-local/run-job.mjs ci unit`, twice, instead of a replacement command. The old replacement command left out `--parallel=1`. The job still runs uncached: its containers start with an empty Nx cache, and T043's build cache, if it lands, never replays `test` or `test-storybook`. Approach, Interface contract, acceptance criteria, and files are unchanged.
