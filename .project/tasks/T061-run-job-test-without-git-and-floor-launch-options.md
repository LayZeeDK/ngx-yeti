---
id: T061
title: Test the run-job output folder without Git, record the unit job's skipped count, and give the floor Chromium one launch-options value
wave: 11
deps: [T028, T054, T059]
status: done
agent: build_T061
base: 3ec57a6562acaf2dc706b32351aa126287336fb4
worktree: null
task_branch: null
files:
  - tools/ci-local/run-job.mjs
  - tools/ci-local/run-job.test.mjs
  - references/ci-local.md
  - tools/playwright/engines.mjs
  - tools/playwright/engines.test.mjs
  - tools/playwright/browser-projects.mjs
  - tools/playwright/browser-projects.test.mjs
  - tools/playwright/vitest-configs.test.mjs
  - packages/ngx-yeti/vitest.unit.config.mts
---

# T061 — Test the run-job output folder without Git, record the unit job's skipped count, and give the floor Chromium one launch-options value

## Context

Sixth build repair (2026-10-14): survivors of review round 3 of M002 (range fb1a8c6..2cedb1b; the product files are unchanged at 58ee259, so every line number below is at 2cedb1b; triaged by Claude on 2026-10-14 in the git-ignored local record tmp/afk-m002/lars-review/r3/triage.md, group B items 5 to 7, plus the `vitest.unit.config.mts` half of item 20, which item 7 moves; source reports g3-silent-failure.md and g13-comments.md beside it, and the advisory reviews tmp/afk-m002/wave9-thermos-bugs.md, wave8-10-thermos-bugs.md, and wave8-10-thermos-quality.md). Every finding is inlined. Declined by the triage, not in scope: making `fail()` throw so the refusal test spawns fewer dry runs (thermos quality L3), and the NVDA lane's launch arguments (wave 8-10 bugs L1: "no measured hang in 22/22 runs this milestone; a fix needs a measured hang first").

Triage item 5 (minor, fix): "tools/ci-local/run-job.test.mjs:114-139 needs Git: in CI's `unit` container git stops on \"dubious ownership\" (inferred from actions/checkout's temporary-HOME safe.directory; not measurable before a push), and it skips in the local container (thermos bugs H1). The skip comment states the wrong premise (g13-comments 2). Fix: test the output-path computation without Git (inject the file list or export the function), no skip." Thermos bugs H1, verbatim: "Files: `tools/ci-local/run-job.test.mjs:114-139` (T054: `inCheckout`, the test 'a leg writes its reports under the checkout hash its volumes carry'), which runs `run-job.mjs --dry-run`; that calls `sourceFiles()` at `tools/ci-local/run-job.mjs:463-471`, called from `:660`, which runs `git ls-files`. `.github/workflows/ci.yml:48-66` (job `unit`, `container: mcr.microsoft.com/playwright:v1.63.0-noble`, `run-many -t test ...`). ... Measured: in that job actions/checkout found `git version 2.43.0` in the image and ran 'Initializing the repository' in `/__w/ngx-yeti/ngx-yeti`. So the container has a `.git` and `inCheckout` is true there. ... Measured: checkout adds `safe.directory` only to a temporary global config. ... Later steps therefore have no `safe.directory`. actions/checkout issue #766 (open) reports exactly this ... Failure scenario (inferred; no CI run exists for this branch): in the `unit` step, root (uid 0) runs `git ls-files` in a worktree that the runner user owns. Git 2.43 stops with 'detected dubious ownership' and exit 128. `execFileSync` throws, and the dry run exits non-zero without printing the volume line. Then `assert.ok(checkout !== undefined, stdout)` fails, and with it `@ngx-yeti/source:test` and the required `unit` job. The local mirror cannot show this. `run-job.mjs` streams only the listed files into its container, with no `.git`, so the test skips there (watch item 3). The wave 9 gate's `ci-unit: exit 0` is therefore no evidence for CI. Fix direction: test the path without Git. Export the `out` computation (checkout hash plus label) from `run-job.mjs` and assert on it directly, as the decimal-count test does with `parseArgs`. Another option is to gate the skip on `git ls-files` succeeding instead of on `.git` existing. That keeps CI green, but CI then never runs the test. A third option, `git config --global --add safe.directory \"$GITHUB_WORKSPACE\"` as a `unit` step, makes CI differ from what run-job mirrors." g13-comments 2, verbatim: "tools/ci-local/run-job.test.mjs:115 ... `// A dry run lists the checkout's files with Git; a container leg has no .git.` The known item H1 records that CI's `unit` container does have the checkout's `.git` (git fails there on 'dubious ownership'); only the local run-job container lacks it. ... the comment encodes the false premise, so whoever fixes H1 by changing the guard can leave a comment that still says container legs never have `.git`." The out path today is built at run-job.mjs:664 (`createHash('sha256').update(root).digest('hex').slice(0, 8)`) and :679 (`join(tmpdir(), 'ngx-yeti-run-job', checkout, label)`), inside `leg()`, after `sourceFiles()` at :660.

Triage item 6 (minor, fix): "references/ci-local.md:150-156 records the local `unit` job as passed with no skipped count, so the skip in item 5 is hidden in SC8's record (g3-silent-failure F2). Fix: passed/skipped counts in that row." g3-silent-failure F2, verbatim: "File: references/ci-local.md:150 ('Every job passed with no retry') and :156 (`ci.yml` `unit` row, '126, 504, 1713, 1 and 1 passed', in a table whose column is 'Counts (passed/skipped)'). The skip is at tools/ci-local/run-job.test.mjs:116-123 (`skip: !inCheckout`). ... The T028 Log, line 65, records only passed counts for `unit`. Every other row of the table gives passed/skipped. Failure (inferred): the record people read before a push (AGENTS.md 'Run CI locally') shows the `unit` job as fully green locally. The one test that would fail in CI's `unit` container (H1) ran in neither place ... Fix direction: write the `unit` counts as passed/skipped, as the other rows do, and add one line saying the run-job checkout-hash test skips without `.git`. Better, fix H1 so the test needs no `.git`, for example by injecting the file list, so that it runs in both places and the skip goes away."

Triage item 7 (minor, fix): "The floor Chromium launch options are two literals and the Vitest copy of `--disable-stack-profiler` has no standing check (wave 8-10 thermos bugs L2 and quality M1; wave 10 review warning). Fix: one exported floor launch-options value in tools/playwright/engines.mjs used by both configs, covered by the existing test." Wave 8-10 thermos quality M1, verbatim: "Files: `tools/playwright/browser-projects.mjs:86-93`, `packages/ngx-yeti/vitest.unit.config.mts:46-52`, `tools/playwright/browser-projects.test.mjs:37-46`, `tools/playwright/engines.mjs:6-12`. ... T059 adds a second fact to both copies, `args: ['--disable-stack-profiler']`, and the only thing that ties them is the comment `// As in tools/playwright/browser-projects.mjs.` at `vitest.unit.config.mts:49`. The new test imports `browser-projects.mjs` alone, so the Vitest copy can lose the argument and every standing check stays green. ... `engines.mjs` is the module both configs already import, it owns the `LaunchOptions` type T059 widened, and its `Browser` shape is the one both consumers take as is. The move: one exported function there, for example `chromiumFloor(env = localEnv())`, that returns `{ name: 'chromium', engine: 'chromium', options: { launchOptions: { executablePath, args } } }` or `undefined`. `browser-projects.mjs` returns `[project(floor)]`; the Vitest config returns `{ provider: playwright(floor.options), instances: [{ browser: floor.engine }] }`. The reason comment then lives once, beside the argument, the cross-reference comment is deleted, and the existing test, moved to the function or kept where it is, covers both steps of the floor job." Wave 8-10 thermos bugs L2, verbatim: "the argument is written a second time here, and the only check of it is the `rg` in T059's own Verify, which runs once. ... How to show it: delete line 50 of `vitest.unit.config.mts`; `npm exec nx -- run @ngx-yeti/source:test`, `npm exec nx -- run-many -t lint typecheck`, and `npm exec nx -- test ngx-yeti` still pass (inferred from the search above, not run)."

Triage item 20, the half in this task's files (cosmetic): "vitest.unit.config.mts:49 points instead of saying why (g13-comments 4; moot if item 7 moves the value)." With item 7 the value and its one-line reason live once, beside the argument, and the pointer comment goes.

## Approach

- Item 5: the output folder of a leg is computed by a function or value the test can call in-process with a checkout path and a label, with no Git and no dry run (export it, as `parseArgs`, `legChecks`, and `quote` are exported). The test asserts the folder is `ngx-yeti-run-job/<8-hex checkout hash>/<label>` under the OS temp folder and that the volume names carry the same hash. No `skip`, no `existsSync` of `.git`; the false comment goes. The dry run's printed output keeps its current shape. Keep `fail()` exiting as it does (declined L3).
- Item 6: the `ci.yml` `unit` row of the re-timed table in `references/ci-local.md` gives passed/skipped counts like every other row, and one line says that the run-job checkout-hash test skipped in that run because the local container leg has no `.git`, and that it now runs without Git. Take the counts from a `node tools/ci-local/run-job.mjs ci unit` run of this task's tip and record that run in the Log; if the row then names a commit other than the table's `4d63e28`, say so in the row.
- Item 7: one exported floor value in `tools/playwright/engines.mjs` (the coder picks its shape; the thermos `chromiumFloor` sketch is one) holds the Chromium floor's `executablePath` and `args: ['--disable-stack-profiler']` with the reason comment once. `tools/playwright/browser-projects.mjs` and `packages/ngx-yeti/vitest.unit.config.mts` both use it, and neither writes the argument itself. A standing `node --test` case fails when the shared value lacks the argument; the coder may also add a `tools/playwright/vitest-configs.test.mjs` case that loads the unit config with `FLOOR_CHROMIUM_PATH` set and asserts the provider's launch options. No other project's launch options change (T059's criterion 5). The ci-local.md line about the floor Chromium stays true.
- Keep the scripts typed (Interface contract). Do not touch `.github/workflows/`.
- The floor Chromium layer-2 run in Verify downloads Chrome for Testing 141 into tmp/floor-chrome under an absolute `--path`, as T059's Verify does.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`; `references/ci-local.md`; AGENTS.md "Scripts" and "Run CI locally".

## Interface contract

- The committed scripts are typed (T053): `tsconfig.scripts.json` at the repository root type-checks every committed `.mjs`, `.cjs`, and `.js` file outside `vendor/` and `docs/specs/`, each starting with `// @ts-check` (after a shebang, if any) and typed with JSDoc. `npm exec nx -- run @ngx-yeti/source:typecheck` runs `tsc -p tsconfig.scripts.json && node --test tools/typecheck/scripts-coverage.test.mjs` and exits 0. A task that edits one of these scripts keeps its `// @ts-check` line and its JSDoc types, adds no `any` and no unchecked assertion, and leaves that command at 0 errors.

## Intent coverage

- None

## Acceptance criteria

1. `tools/ci-local/run-job.test.mjs` asserts the per-leg output folder without Git and without a skip, and it passes natively and inside the `unit` container leg, where the checkout has no `.git`.
2. The `ci.yml` `unit` row of `references/ci-local.md` gives passed/skipped counts and says why the earlier run skipped one test; the Log records the run the counts come from.
3. Both floor Chromium configs take the launch options from one export of `tools/playwright/engines.mjs`, the argument and its reason appear once, and a standing test fails when that export lacks `--disable-stack-profiler`.
4. With `FLOOR_CHROMIUM_PATH` set to Chrome for Testing 141.0.7390.54, `npm exec nx -- test ngx-yeti -- --project=browser` passes.
5. `npm exec nx -- run @ngx-yeti/source:typecheck` exits 0, lint and typecheck of `ngx-yeti` pass, and `npx prettier --check` passes on the task's files.

## Verify

```bash
npm ci && npx playwright install chromium && ! rg -q -F "inCheckout" tools/ci-local/run-job.test.mjs && ! rg -q -F -e "--disable-stack-profiler" packages/ngx-yeti/vitest.unit.config.mts && ! rg -q -F -e "--disable-stack-profiler" tools/playwright/browser-projects.mjs && rg -q -F -e "--disable-stack-profiler" tools/playwright/engines.mjs && node --test tools/ci-local/run-job.test.mjs tools/playwright/engines.test.mjs tools/playwright/browser-projects.test.mjs tools/playwright/vitest-configs.test.mjs && npm exec nx -- run @ngx-yeti/source:typecheck --skip-nx-cache && npm exec nx -- run-many -t lint typecheck -p ngx-yeti && node tools/ci-local/run-job.mjs ci unit -- npx nx run @ngx-yeti/source:test && FLOOR_CHROMIUM_PATH="$(npx --no-install @puppeteer/browsers install chrome@141.0.7390.54 --path "$(pwd)/tmp/floor-chrome" | awk '{print $2}')" && test -x "$FLOOR_CHROMIUM_PATH" && export FLOOR_CHROMIUM_PATH && timeout 1200 npm exec nx -- test ngx-yeti --skip-nx-cache -- --project=browser && npx prettier --check tools/ci-local/run-job.mjs tools/ci-local/run-job.test.mjs references/ci-local.md tools/playwright packages/ngx-yeti/vitest.unit.config.mts; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-15 — created by planner (build repair 6), from tmp/afk-m002/lars-review/r3/triage.md group B items 5 to 7 and the `vitest.unit.config.mts` half of item 20.
- 2026-10-15 — build_T061 implementation. run-job.mjs exports `legPaths(checkoutRoot, workflow, jobName, label)` returning the 8-hex checkout hash, the job volume prefix and the leg output folder; `run()`/`leg()` use it. The test now calls it in-process (no Git, no skip, no dry run; `inCheckout` gone). engines.mjs exports `chromiumFloor(env)` (executablePath plus `--disable-stack-profiler` and its reason, once); browser-projects.mjs and vitest.unit.config.mts use it. New standing cases: engines.test.mjs (export carries the argument) and vitest-configs.test.mjs (the unit config's provider launch options with FLOOR_CHROMIUM_PATH set). ci-local.md `unit` row now gives passed/skipped plus a note on the earlier skip.
- Counts source for the ci-local.md row: `node tools/ci-local/run-job.mjs ci unit` at base 3ec57a6 plus this change (uncommitted), exit 0, 7 m 35 s with other jobs running: Vitest 126/0, 504/0, 1713/0, 1/0, 1/0 passed/skipped; node:test 46/0.
- Verify (exact command, through the heavy lock): exit 0. node --test of the four files 28 pass, 0 fail, 0 skipped (the Vitest-config file 1 more run is included in the 28/1 split); `@ngx-yeti/source:typecheck`, lint and typecheck of ngx-yeti pass; `run-job ci unit -- source:test` pass (node:test 46/0); floor Chrome for Testing 141.0.7390.54 `test ngx-yeti --project=browser`: 27 files, 507 tests passed; prettier check clean.
- Rule 13: `npx prettier --check .` clean; `nx affected -t lint typecheck test test-storybook --base=HEAD` exit 0 (9 projects plus 2 dependency tasks).
- 2026-10-15 — orchestrator Verify (isolate gsd-path-task/T061): pass, exit 0; output tail:
  ```
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/spinner
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/stack
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/table
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/timeline
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/visually-hidden
  ```
