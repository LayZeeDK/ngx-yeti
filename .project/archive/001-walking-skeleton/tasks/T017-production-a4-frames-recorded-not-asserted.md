---
id: T017
title: Record rather than assert A4-affected hydration frames in the production e2e run, and document Chromium's A4 frame
wave: 6
deps: [T003, T005, T007, T011, T012, T014, T015]
status: done
agent: build_T017
base: 173f52c2035c14cc40d80d265301861d888e9600
worktree: null
task_branch: null
files:
  - apps/yeti-app-e2e/src/card.spec.ts
  - apps/yeti-app-e2e/src/setup.spec.ts
  - .claude/skills/ngx-yeti-specs/SKILL.md
  - packages/ngx-yeti/README.md
---

# T017 — Record rather than assert A4-affected hydration frames in the production e2e run, and document Chromium's A4 frame

## Context

Final review finding P001 (.project/review/PATCH-FINDINGS.md, source .project/review/final-gap-1.md, locator `Risk: project Verify`), reviewed HEAD `6991ad5cd35faf1a84fe7afdfe7a5dc8afeeb8ad`. Evidence, verbatim:

- **Check**: `npm ci --no-audit --no-fund && npx prettier --check . && npx nx run-many -t lint typecheck test test-storybook build build-fast && npx nx run ngx-yeti:pack-check && npx nx run-many -t e2e && FIXTURE_CONFIGURATION=production npx nx e2e yeti-app-e2e`
- **Observed**: Exit 1; exact stdout and stderr are in the command/commit ledger entry.
- **Found**: Project Verify failed at the reviewed commit.
- **Fix direction**: Resolve the recorded command failure before shipping.

The ledger entry (last line of .project/build/verify-ledger.jsonl) shows `1 failed: [chromium] src\card.spec.ts:221:9 the prerendered card route adopts the server's card link at hydration`, 13 skipped, 70 passed.

Orchestrator diagnosis (measured by the orchestrator; inlined with that attribution):

- The failure: `FIXTURE_CONFIGURATION=production npx nx e2e yeti-app-e2e` failed one test, apps/yeti-app-e2e/src/card.spec.ts:221 "adopts the server's card link at hydration", at its Chromium-only assertion "no frame after first paint shows the card without Yeti" (received ["0px"]). The development-configuration run passed.
- Reproduction at 6991ad5 (primary checkout): `FIXTURE_CONFIGURATION=production npx nx e2e yeti-app-e2e --skip-nx-cache -- card.spec.ts --repeat-each=10 --grep "adopts the server"`: 19 passed, 1 failed (server-rendered route, one 0px frame); earlier production runs at 0bbf48a, 2b5202d and 1ac159a passed.
- Cause: upstream bug A4 (`docs/specs/upstream-bugs.md`:39; `docs/specs/specs/setup.md`:403): in production Angular's Beasties critical-CSS step inlines only three of Yeti's nine :root token blocks and loads the global stylesheet asynchronously, so a server-rendered card can paint a frame without its tokens. The records measured 0 frames in Chromium (setup.md:263, :338) in a prototype; this workspace measures it rarely in Chromium too. setup.md:346 and :403 say A4 frames are recorded with critical-CSS inlining on and off; the development configuration has inlining off (`"optimization": false` in `apps/yeti-app/project.json`), so the loader alone is measured there.
- Ruling (orchestrator acting as owner under the user's goal): in the production configuration, hydration-frame counts that A4 can affect are recorded as test annotations, not asserted; the 0-frame assertion stays in the development configuration (and wherever the item is not server-rendered, e.g. the setup-defer client-only preload case, which A4 does not affect). Record the measurement as a row in the "Departures from the records" table of `.claude/skills/ngx-yeti-specs/SKILL.md` (A4 reaches Chromium too: 1 of 20 production runs) and update the package README's A4 note (`packages/ngx-yeti/README.md`) to say Chromium showed a single frame in a production repeat run, not only Firefox. Never edit docs/specs/.

Planner's site search (patch mode: a failing project Verify covers every site matching the pattern). Pattern: a frame assertion of "0 frames with padding-top 0px" on a server-rendered or prerendered item, sampled from first paint by `recordFrames` (an init script in `apps/yeti-app-e2e/src/support/style-probe.ts`), in a spec that runs under `FIXTURE_CONFIGURATION=production`. CI runs the production configuration in Chromium, Firefox, and WebKit (`.github/workflows/ci.yml`, `tools/playwright/browser-projects.mjs`); locally only Chromium runs. Sites found:

1. `apps/yeti-app-e2e/src/card.spec.ts`, "adopts the server's card link at hydration" (prerendered and server-rendered card routes): Chromium-only `toEqual([])` on the `article` padding-top frames. The reported failure.
2. `apps/yeti-app-e2e/src/setup.spec.ts`, "adopts the server's links with no unstyled frame" (prerendered and server-rendered setup routes): Chromium-only `toEqual([])` on the `#shared-host` frames. Same pattern.
3. `apps/yeti-app-e2e/src/setup.spec.ts`, "keeps the leaving host styled while it leaves and drops its link after": `toEqual([])` in every engine on `#leaving-host` frames that `recordFrames` samples from first paint, so the server-rendered host's pre-hydration frames (A4's window) are inside the asserted set; in the CI production run Firefox, which the records measure at 1 to 2 A4 frames, also asserts it.

Searched and excluded: card.spec.ts "renders the preloaded client-only card with 0 unstyled frames" and setup.spec.ts "renders the client-only card with 0 unstyled frames through the preload" (client-only items created after hydration and a click, not server-rendered; the ruling keeps them asserted); the frame records in `apps/yeti-app-e2e/src/setup-serving.spec.ts`, `apps/yeti-app-e2e/src/lift.spec.ts`, `apps/yeti-app-e2e/src/setup-boundaries.spec.ts`, card.spec.ts "records the client-only card's frames after every card host has left", and setup.spec.ts "records the client-only @defer's frames after every host has left" (annotations only, no assertion); `apps/yeti-app-e2e/src/fixture-app.spec.ts` (JavaScript off, a retrying `toHaveCSS`, no frame sampling); `apps/ngx-yeti-e2e/src/` (Storybook, no server rendering, not run under `FIXTURE_CONFIGURATION`).

## Approach

- Use the existing `isProduction` export of `apps/yeti-app-e2e/src/support/fixtures.ts` (already imported by both specs) to split the configurations; do not change the support files or the Playwright config.
- Sites 1 and 2: in production, push the frame count as a `test.info().annotations` entry of type `a4-frames` in every engine (name the engine and say critical-CSS inlining is on, like the `setup-serving.spec.ts` A4 record) and assert nothing about the 0px count; keep the "the card was sampled" assertion. In development, keep today's behaviour exactly: the Chromium 0-frame assertion and the other engines' annotation.
- Site 3: the leave claim (setup.md:340, ADR 0060 point 4: a leaving host stays styled while leaving) stays asserted in both configurations. Only the frames A4 can reach, those before the global stylesheet has applied, leave the assertion in production; they are recorded under `a4-frames`. One way: before the leave starts, wait until the host computes a non-0 padding-top, and assert 0 unstyled frames only from then on (the spec's `sampleFrames` helper starts sampling at a chosen moment). Development keeps asserting from first paint.
- Keep every other assertion of these tests (style mutations, item links, link attributes, host attributes) unchanged in both configurations.
- `.claude/skills/ngx-yeti-specs/SKILL.md`: add one row to "Departures from the records" with the table's columns (Record, It says, The workspace does, Why, Skill): record `setup.md:263`, `:338` (0 unstyled frames in Chromium); the workspace measured A4 in Chromium too, 1 of 20 production runs of the card adoption test at 6991ad5, so the production run records A4-affected frame counts as `a4-frames` annotations and the development run (inlining off) asserts 0; skill `ngx-yeti-testing`. Keep the table Prettier-formatted.
- `packages/ngx-yeti/README.md` has no A4 note at HEAD; add a short one (near "C. Order the global stylesheet" or in a known-issues paragraph): upstream bug A4, Angular's critical-CSS inlining keeps only some of Yeti's `:root` token blocks, so a server-rendered item can paint 1 to 2 frames in Firefox and, as measured here, a single frame in Chromium in a production repeat run, before the global stylesheet arrives; `optimization.styles.inlineCritical: false` makes the global stylesheet render-blocking. Like setup.md:403, do not recommend either setting.
- Never edit `docs/specs/`. No change to package source, the Fixture app, or the loader: A4 is upstream and the ruling is to record it.
- Follow the `ngx-yeti-testing` and `type-safety` skills (no `as`, no hooks, braces on every control-flow body, blank lines around control flow).

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. Under `FIXTURE_CONFIGURATION=production`, the three sites listed in Context (card.spec.ts "adopts the server's card link at hydration"; setup.spec.ts "adopts the server's links with no unstyled frame"; setup.spec.ts "keeps the leaving host styled while it leaves and drops its link after") assert no 0px count over frames A4 can reach; each records that count as a test annotation of type `a4-frames`. The string `a4-frames` appears in both spec files.
2. In the development configuration the two adoption tests still assert 0 unstyled frames in Chromium from first paint, and the leaving-host test still asserts 0 unstyled frames in every engine; in production the leaving-host test still asserts 0 unstyled frames over the leave window.
3. The client-only preload 0-frame assertions (card.spec.ts "renders the preloaded client-only card with 0 unstyled frames while the server hosts are connected"; setup.spec.ts "renders the client-only card with 0 unstyled frames through the preload") are unchanged in both configurations.
4. `FIXTURE_CONFIGURATION=production npx nx e2e yeti-app-e2e --skip-nx-cache -- card.spec.ts setup.spec.ts --repeat-each=10` and the development run of the same files pass.
5. `.claude/skills/ngx-yeti-specs/SKILL.md` "Departures from the records" has a new row stating A4 reaches Chromium too, 1 of 20 production runs, and that production records the frames while development asserts 0; existing rows are unchanged.
6. `packages/ngx-yeti/README.md` carries an A4 note, in one paragraph or list item that names A4 and Chromium on the same source line, naming upstream bug A4 and saying Chromium showed a single frame in a production repeat run, not only Firefox, without recommending an inlining setting.
7. Nothing under `docs/specs/` changes.
8. Bisect-safe: `npx prettier --check .` and `npm exec nx -- run-many -t lint typecheck test` pass at this task's commit.

## Verify

```bash
npm ci --no-audit --no-fund && rg -q -F 'a4-frames' apps/yeti-app-e2e/src/card.spec.ts && rg -q -F 'a4-frames' apps/yeti-app-e2e/src/setup.spec.ts && rg -q -F '1 of 20' .claude/skills/ngx-yeti-specs/SKILL.md && rg -q 'A4.*Chromium|Chromium.*A4' packages/ngx-yeti/README.md && npx prettier --check apps/yeti-app-e2e/src/card.spec.ts apps/yeti-app-e2e/src/setup.spec.ts .claude/skills/ngx-yeti-specs/SKILL.md packages/ngx-yeti/README.md && npx nx run-many -t lint typecheck -p yeti-app-e2e && FIXTURE_CONFIGURATION=production npx nx e2e yeti-app-e2e --skip-nx-cache -- card.spec.ts setup.spec.ts --repeat-each=10 && npx nx e2e yeti-app-e2e --skip-nx-cache -- card.spec.ts setup.spec.ts
```

Heavy: yes

## Log

- 2026-10-04 — created by planner (final-review patch mode, finding P001 of final-gap-1)
- 2026-10-04 — build_T017: card.spec.ts "adopts the server's card link at hydration" and setup.spec.ts "adopts the server's links with no unstyled frame" push an `a4-frames` annotation (engine, critical-CSS inlining on, N of M frames) under `isProduction` and assert no 0px count there; development keeps the Chromium 0-frame assertion and the other engines' `frames` annotation unchanged. setup.spec.ts leaving-host test: waits for a non-0 padding-top after hydration, then samples the leave window with `sampleFrames` and asserts 0 unstyled frames there in both configurations; development also asserts 0 from first paint, production records the from-first-paint count as `a4-frames`. Client-only preload assertions untouched. SKILL.md: new Departures row (setup.md:263, :338; 1 of 20 production runs at 6991ad5), existing rows byte-identical. README: A4 known-issue paragraph after section C naming Chromium, no recommendation. No docs/specs/ change.
- 2026-10-04 — build_T017: task Verify run verbatim: exit 0 (production repeat-each=10: 400 passed, 80 skipped; development: 46 passed, 2 skipped). `npx prettier --check .`: exit 0. `npx nx run-many -t lint typecheck test -p yeti-app yeti-app-e2e`: exit 0. Full `npx nx e2e yeti-app-e2e --skip-nx-cache` (development): exit 0, 80 passed, 4 skipped. Full `FIXTURE_CONFIGURATION=production npx nx e2e yeti-app-e2e --skip-nx-cache`: exit 0, 71 passed, 13 skipped. Chromium only locally.
- 2026-10-04 — orchestrator Verify (sidecar gsd-path-verify/task-t017-verify): pass, exit 0; output tail:
  ```
  [2m[WebServer] [22m    at NodeInjectorFactory.ConstructorFault_Factory [90m(C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\verify\task-t017-verify\[39m.angular\prerender-root\31d20392-37bc-4db3-895c-f4e7028c2227\apps\yeti-app\src\app\fixtures\setup-boundaries-fixture.ts:32:3[90m)[39m
  [2m[WebServer] [22m    at getNodeInjectable [90m(C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\verify\task-t017-verify\[39m.angular\prerender-root\31d20392-37bc-4db3-895c-f4e7028c2227\node_modules\[4m@angular\core[24m\fesm2022\_debug_node-chunk.mjs:751:38[90m)[39m
  [2m[WebServer] [22m    at instantiateAllDirectives [90m(C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\verify\task-t017-verify\[39m.angular\prerender-root\31d20392-37bc-4db3-895c-f4e7028c2227\node_modules\[4m@angular\core[24m\fesm2022\_debug_node-chunk.mjs:5647:23[90m)[39m
  [1A[2K[2m[WebServer] [22m    at createDirectivesInstances [90m(C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\verify\task-t017-verify\[39m.angular\prerender-root\31d20392-37bc-4db3-895c-f4e7028c2227\node_modules\[4m@angular\core[24m\fesm2022\_debug_node-chunk.mjs:5504:3[90m)[39m
  [2m[WebServer] [22m    at initializeElement [90m(C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\verify\task-t017-verify\[39m.angular\prerender-root\31d20392-37bc-4db3-895c-f4e7028c2227\node_modules\[4m@angular\core[24m\fesm2022\_debug_node-chunk.mjs:15288:5[90m)[39m
  [2m[WebServer] [22m    at ɵɵelementStart [90m(C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\verify\task-t017-verify\[39m.angular\prerender-root\31d20392-37bc-4db3-895c-f4e7028c2227\node_modules\[4m@angular\core[24m\fesm2022\_debug_node-chunk.mjs:15281:3[90m)[39m
  [2m[WebServer] [22m    at ServerErrorCase_Primary_1_Template [90m(C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\verify\task-t017-verify\[39m.angular\prerender-root\31d20392-37bc-4db3-895c-f4e7028c2227\apps\yeti-app\src\app\fixtures\replay-fixture.ts:10:27[90m)[39m
  [2m[WebServer] [22m    at executeTemplate [90m(C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\verify\task-t017-verify\[39m.angular\prerender-root\31d20392-37bc-4db3-895c-f4e7028c2227\node_modules\[4m@angular\core[24m\fesm2022\_debug_node-chunk.mjs:5496:5[90m)[39m
  [2m[WebServer] [22m    at renderView [90m(C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\verify\task-t017-verify\[39m.angular\prerender-root\31d20392-37bc-4db3-895c-f4e7028c2227\node_modules\[4m@angular\core[24m\fesm2022\_debug_node-chunk.mjs:5899:7[90m)[39m
  [1A[2K[2m[WebServer] [22mERROR Error: The probe threw in its constructor on the server
  [1A[2K[2m[WebServer] [22m    at new _ConstructorFault [90m(C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\verify\task-t017-verify\[39m.angular\prerender-root\31d20392-37bc-4db3-895c-f4e7028c2227\apps\yeti-app\src\app\fixtures\setup-boundaries-fixture.ts:30:13[90m)[39m
  [2m[WebServer] [22m    at NodeInjectorFactory.ConstructorFault_Factory [90m(C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\verify\task-t017-verify\[39m.angular\prerender-root\31d20392-37bc-4db3-895c-f4e7028c2227\apps\yeti-app\src\app\fixtures\setup-boundaries-fixture.ts:32:3[90m)[39m
  [2m[WebServer] [22m    at getNodeInjectable [90m(C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\verify\task-t017-verify\[39m.angular\prerender-root\31d20392-37bc-4db3-895c-f4e7028c2227\node_modules\[4m@angular\core[24m\fesm2022\_debug_node-chunk.mjs:751:38[90m)[39m
  [2m[WebServer] [22m    at instantiateAllDirectives [90m(C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\verify\task-t017-verify\[39m.angular\prerender-root\31d20392-37bc-4db3-895c-f4e7028c2227\node_modules\[4m@angular\core[24m\fesm2022\_debug_node-chunk.mjs:5647:23[90m)[39m
  [2m[WebServer] [22m    at createDirectivesInstances [90m(C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\verify\task-t017-verify\[39m.angular\prerender-root\31d20392-37bc-4db3-895c-f4e7028c2227\node_modules\[4m@angular\core[24m\fesm2022\_debug_node-chunk.mjs:5504:3[90m)[39m
  [2m[WebServer] [22m    at initializeElement [90m(C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\verify\task-t017-verify\[39m.angular\prerender-root\31d20392-37bc-4db3-895c-f4e7028c2227\node_modules\[4m@angular\core[24m\fesm2022\_debug_node-chunk.mjs:15288:5[90m)[39m
  [2m[WebServer] [22m    at ɵɵelementStart [90m(C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\verify\task-t017-verify\[39m.angular\prerender-root\31d20392-37bc-4db3-895c-f4e7028c2227\node_modules\[4m@angular\core[24m\fesm2022\_debug_node-chunk.mjs:15281:3[90m)[39m
  [2m[WebServer] [22m    at ReplacedClickCase_Primary_3_Template [90m(C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\verify\task-t017-verify\[39m.angular\prerender-root\31d20392-37bc-4db3-895c-f4e7028c2227\apps\yeti-app\src\app\fixtures\replay-fixture.ts:10:27[90m)[39m
  [2m[WebServer] [22m    at executeTemplate [90m(C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\verify\task-t017-verify\[39m.angular\prerender-root\31d20392-37bc-4db3-895c-f4e7028c2227\node_modules\[4m@angular\core[24m\fesm2022\_debug_node-chunk.mjs:5496:5[90m)[39m
  [2m[WebServer] [22m    at renderView [90m(C:\Users\LarsGyrupBrinkNielse\.gsd-path\projects\20bec08a0fc50cc0\7193083e730a694f\verify\task-t017-verify\[39m.angular\prerender-root\31d20392-37bc-4db3-895c-f4e7028c2227\node_modules\[4m@angular\core[24m\fesm2022\_debug_node-chunk.mjs:5899:7[90m)[39m
  ```
