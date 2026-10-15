---
id: T066
title: Make the run-job output-folder test able to fail, let a .d.ts edit miss the scripts typecheck cache, clear every floor variable in the unit-config test, fix the ci-local unit row, and bound the VoiceOver foreground query
wave: 12
deps: [T053, T061, T063]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - tools/ci-local/run-job.mjs
  - tools/ci-local/run-job.test.mjs
  - project.json
  - tools/playwright/vitest-configs.test.mjs
  - references/ci-local.md
  - apps/screen-reader-e2e/src/support/voiceover.ts
---

# T066 — Make the run-job output-folder test able to fail, let a .d.ts edit miss the scripts typecheck cache, clear every floor variable in the unit-config test, fix the ci-local unit row, and bound the VoiceOver foreground query

## Context

Seventh build repair (2026-10-15): survivors of review round 4 of M002 (range 2cedb1b..b1a3897, the wave 11 tasks T060 to T064; every line number below is at b1a3897, and no product file changed after it; triaged by Claude on 2026-10-15 in the git-ignored local record tmp/afk-m002/lars-review/r4/triage.md, group B, items 2 and 3 with their folded cosmetics, with the source reports test-analyzer.md, code-reviewer.md, and silent-failure.md beside it and the advisory review tmp/afk-m002/wave11-thermos-quality.md). Every finding is inlined. Settled in round 3, not to be reopened: the per-leg output-folder computation is tested without Git (T061, round 3 item 5); `fail()` keeps exiting as it does (round 3 declined thermos quality L3).

Triage item 2 (minor, fix): "The `legPaths` test cannot fail if `run()` stops deriving its output folder from it: measured with a mutant (test-analyzer M1; thermos quality L1). Fix: one `legPaths` call per leg whose values both the volume and `out` use, and one dry-run assertion (skipped only without `.git`) that the `-v <host>:/out` path equals `legPaths(...).out`."

Test-analyzer M1 (minor), verbatim: "File: tools/ci-local/run-job.test.mjs:117-135 (run-job.mjs:686 and :700 call `legPaths` twice). Evidence (measured): I copied run-job.mjs and its test into the scratchpad (node_modules linked by a junction). I replaced run-job.mjs:700 with `const out = join(tmpdir(), 'ngx-yeti-run-job', 'deadbeef', label);`, so reports go to a folder that does not match the volume hash. `node --test --test-name-pattern="checkout hash"` against that copy: 1 pass, 0 fail. What it misses: the test's title promises "a leg writes its reports under the checkout hash its volumes carry". The old dry-run test checked that promise end to end. The new one checks only that `legPaths` builds both strings from one hash, which is true by construction. `run()` calls `legPaths` twice, once with label `''`, so a later edit can drift either call and nothing fails. The task asked for the test to run without Git (round 3 item 5). It did not ask to drop the end-to-end check. Fix direction: keep the pure `legPaths` test for the container leg. Next to it, put back one dry-run assertion, skipped only without `.git`, that the `-v <host>:/out` path in the dry-run output equals `legPaths(root, 'ci', 'e2e', <label>).out`. Or call `legPaths` once per leg and destructure all three values, so a single call site carries both values."

Thermos quality L1 (Low), verbatim: "Commit T061. Files: `tools/ci-local/run-job.mjs:462-482, 686, 700-705`, `tools/ci-local/run-job.test.mjs:117-135`. Read: `run()` calls `legPaths(root, workflow, jobName, '')` once for `checkout` and `volume`, which ignores the `out` it gets back. Then it calls it again for each leg only to get `out`. The container name (`ngx-yeti-run-job-${checkout}-${label}-${pid}`, `:702`) is still built inline, so the naming scheme lives half in the helper and half outside it. The test asserts `volume === 'ngx-yeti-run-job-${checkout}-ci-e2e'` and `out === join(tmpdir(), 'ngx-yeti-run-job', checkout, label)`, which is the helper's body written out again. It no longer proves what the old dry-run test proved: that `run()` mounts `out` for the leg with the same hash its volumes use. Fix direction: split it into `checkoutHash(root)` and `legOut(checkout, label)`, or have `legPaths(root, workflow, jobName)` return `{ checkout, volume, out(label), container(label) }`. Then the test can assert the relation that matters, that `out(label)` and `volume` carry the same `checkout`, without restating the string."

Triage item 3 (minor, fix): "The root `typecheck` target's Nx inputs omit `.d.ts`, so editing .claude/skills/control-ngx-yeti-storybook/scripts/storybook-preview.d.ts alone replays a cached pass (measured by reading project.json). Fix: add the `.d.ts` files tsconfig.scripts.json includes to the inputs." Read by the planner at b1a3897: the root `typecheck` target in `project.json` runs `tsc -p tsconfig.scripts.json && node --test tools/typecheck/scripts-coverage.test.mjs` with inputs `{workspaceRoot}/tsconfig.scripts.json`, `{workspaceRoot}/tsconfig.base.json`, `{workspaceRoot}/**/*.{mjs,cjs,js}`, `{workspaceRoot}/package-lock.json`, and `{workspaceRoot}/tools/typecheck/scripts-coverage.test.mjs`. Measured by the planner (`tsc -p tsconfig.scripts.json --listFilesOnly`, 2026-10-15): outside `node_modules` the program reaches one `.d.ts`, `.claude/skills/control-ngx-yeti-storybook/scripts/storybook-preview.d.ts`, through the triple-slash reference at line 3 of the Storybook control script.

Folded cosmetic, test-analyzer C1, verbatim: "File: tools/playwright/vitest-configs.test.mjs:52-78. Evidence (measured): `FLOOR_WEBKIT=true node --test --test-name-pattern="stack profiler" tools/playwright/vitest-configs.test.mjs` fails ("Expected values to be strictly deep-equal"). vitest.unit.config.mts checks `FLOOR_FIREFOX` and `FLOOR_WEBKIT` before `chromiumFloor()`. CI never sets them for the root `test` target, and references/ci-local.md:53 sets them inline per command. So this only affects a developer shell that exported one. Fix direction: inside the `try`, save and delete `FLOOR_FIREFOX` and `FLOOR_WEBKIT` as well."

Folded cosmetic, code-reviewer cosmetic-3, verbatim: "Where: references/ci-local.md:156 and :166. Evidence (measured by reading): the table heading says "at `4d63e28`" and the row keeps that run's 2 m 29 s. The row's new counts (`node --test` 46/0) come from the re-run at `3ec57a6`, which the new note gives as 7 m 35 s. The note also says what the old run skipped and that the test "now needs no Git", which is change history in a reference doc. Fix direction: give the re-run its own row, or put its time and commit in the row, and drop the history sentence."

Folded cosmetic, silent-failure 8, verbatim: "Where: apps/screen-reader-e2e/src/support/voiceover.ts:19-26. Failure: if the AppleEvent to System Events blocks (a TCC automation prompt, or System Events hangs), the `execFile` call never settles. The test then fails on Playwright's test timeout, and the failure does not name the guard. It fails loudly, but the cause is hidden. Fix direction: pass `{ timeout: 10_000 }` to `execFileAsync`, and in the thrown error say that the foreground query failed."

Round 3's warning about the dry-run check, verbatim from thermos bugs H1 (round 3, inferred, not measurable before a push): "in the `unit` step, root (uid 0) runs `git ls-files` in a worktree that the runner user owns. Git 2.43 stops with 'detected dubious ownership' and exit 128. `execFileSync` throws, and the dry run exits non-zero without printing the volume line." CI's `unit` container has the checkout's `.git`; the local `run-job.mjs` container leg does not.

## Approach

- Item 2, code: inside `leg()` of `tools/ci-local/run-job.mjs` one `legPaths` call gives the leg everything it names: the checkout hash, the volume (and so the slot volume), the container name if the coder moves it in, and `out`; the outer call with the empty label goes. The dry run's printed output keeps its shape. Keep `fail()` as it is.
- Item 2, test: keep the pure `legPaths` test. Add one dry-run assertion in `tools/ci-local/run-job.test.mjs` that runs `run-job.mjs ci e2e --dry-run` (or one leg of it) and checks that the host side of the `-v <host>:/out` mount equals `legPaths(<checkout root>, 'ci', 'e2e', <label>).out` for the leg it prints. It skips when Git cannot list the checkout: the test probes `git ls-files` once at module load and, when the probe fails (no `.git`, as in the local container leg, or Git refusing the checkout), skips with a reason that names the refusal (the probe's error text); it runs everywhere Git can list the checkout. The pure `legPaths` test never skips. Show it failing with test-analyzer M1's mutant (the leg's `out` replaced by `join(tmpdir(), 'ngx-yeti-run-job', 'deadbeef', label)`) and record the run in the Log; restore afterwards.
- Pitfall, item 2: by round 3's H1 (quoted in Context, inferred), CI's `unit` container has `.git` but Git may refuse it as "dubious ownership". The dry run itself needs Git, so that refusal skips the dry-run assertion with its reason (orchestrator ruling, 2026-10-15: skip "when Git cannot list the checkout ... not only when `.git` is absent"), and does not turn the required `unit` job red. The skip condition is the `git ls-files` probe alone; do not skip on anything else, and do not catch other failures of the dry run.
- Item 3: the root `typecheck` target's inputs in `project.json` also cover the `.d.ts` files `tsconfig.scripts.json` reaches (today `.claude/skills/control-ngx-yeti-storybook/scripts/storybook-preview.d.ts`); a glob that covers future ones is fine. Measure it and record in the Log: run the target, edit only the `.d.ts`, run it again, and see the second run execute instead of replaying from the cache; restore the file.
- C1: the unit-config test in `tools/playwright/vitest-configs.test.mjs` saves, clears, and restores `FLOOR_FIREFOX` and `FLOOR_WEBKIT` as it does `FLOOR_CHROMIUM_PATH`, so it passes with either exported.
- cosmetic-3: in `references/ci-local.md` the `ci.yml` `unit` row's time, counts, and commit come from one run; run `node tools/ci-local/run-job.mjs ci unit` on this task's tree, record the run in the Log, and write its time and passed/skipped counts in the row with the commit it ran on, kept apart from the table's `4d63e28` heading where they differ. The note under the table narrates no history; it may say what stays true (for example that the dry-run output-folder check skips where Git cannot list the checkout, as in the local container leg, which has no `.git`).
- silent-failure 8: `frontmostApplication` in `apps/screen-reader-e2e/src/support/voiceover.ts` passes a timeout to `execFileAsync` (about 10 s), and a timed-out or failed query throws an error that names the foreground query, so the test report shows the guard as the cause. This code runs only in the CI `voiceover` job; lint and typecheck check it here.
- Keep the scripts typed (Interface contract). Do not touch `.github/workflows/`.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/type-safety/SKILL.md`; `references/ci-local.md`; AGENTS.md "Scripts" and "Run CI locally".

## Interface contract

- The committed scripts are typed (T053): `tsconfig.scripts.json` at the repository root type-checks every committed `.mjs`, `.cjs`, and `.js` file outside `vendor/` and `docs/specs/`, each starting with `// @ts-check` (after a shebang, if any) and typed with JSDoc. `npm exec nx -- run @ngx-yeti/source:typecheck` runs `tsc -p tsconfig.scripts.json && node --test tools/typecheck/scripts-coverage.test.mjs` and exits 0. A task that edits one of these scripts keeps its `// @ts-check` line and its JSDoc types, adds no `any` and no unchecked assertion, and leaves that command at 0 errors.

## Intent coverage

- None

## Acceptance criteria

1. `leg()` in `tools/ci-local/run-job.mjs` takes its checkout hash, volume, and `out` from one `legPaths` call, and no call with an empty label is left.
2. `tools/ci-local/run-job.test.mjs` keeps the pure `legPaths` test and has a dry-run assertion that the printed `-v <host>:/out` host path equals `legPaths(...).out`, skipped only when a `git ls-files` probe at module load fails, with a skip reason that names the refusal; the pure `legPaths` test never skips; the Log records it failing with test-analyzer M1's mutant.
3. The root `typecheck` target's inputs cover the `.d.ts` files `tsconfig.scripts.json` reaches, and the Log records that editing `storybook-preview.d.ts` alone makes the next run execute instead of replaying.
4. With `FLOOR_FIREFOX` and `FLOOR_WEBKIT` exported, the unit-config test of `tools/playwright/vitest-configs.test.mjs` passes.
5. The `unit` row of `references/ci-local.md` gives one run's time, passed/skipped counts, and commit, recorded in the Log, and the note narrates no history.
6. The VoiceOver foreground query has a timeout, and its failure names the foreground query.
7. `node --test` passes on the changed tests natively and in the `ci unit` container leg, `npm exec nx -- run @ngx-yeti/source:typecheck` exits 0, lint and typecheck of `screen-reader-e2e` pass, and `npx prettier --check` passes on the task's files.

## Verify

```bash
npm ci && ! rg -q -F "legPaths(root, workflow, jobName, '')" tools/ci-local/run-job.mjs && rg -q -F "ls-files" tools/ci-local/run-job.test.mjs && rg -q -F "d.ts" project.json && rg -q -F "FLOOR_WEBKIT" tools/playwright/vitest-configs.test.mjs && rg -q -U "execFileAsync\([\s\S]{0,300}timeout" apps/screen-reader-e2e/src/support/voiceover.ts && node --test tools/ci-local/run-job.test.mjs tools/playwright/vitest-configs.test.mjs && FLOOR_FIREFOX=true FLOOR_WEBKIT=true node --test --test-name-pattern="stack profiler" tools/playwright/vitest-configs.test.mjs && npm exec nx -- run @ngx-yeti/source:typecheck --skip-nx-cache && npm exec nx -- run @ngx-yeti/source:typecheck && printf '\n// cache probe %s\n' "$(date +%s%N)" >> .claude/skills/control-ngx-yeti-storybook/scripts/storybook-preview.d.ts && probe_log="$(mktemp)" && { npm exec nx -- run @ngx-yeti/source:typecheck > "$probe_log" 2>&1; probe=$?; git checkout -- .claude/skills/control-ngx-yeti-storybook/scripts/storybook-preview.d.ts; test "$probe" -eq 0; } && ! rg -q -i "from the cache|\[local cache\]|\[remote cache\]|existing outputs match the cache" "$probe_log" && npm exec nx -- run-many -t lint typecheck -p screen-reader-e2e && node tools/ci-local/run-job.mjs ci unit -- npx nx run @ngx-yeti/source:test && npx prettier --check tools/ci-local/run-job.mjs tools/ci-local/run-job.test.mjs project.json tools/playwright/vitest-configs.test.mjs references/ci-local.md apps/screen-reader-e2e/src/support/voiceover.ts; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-15 — created by planner (build repair 7), from tmp/afk-m002/lars-review/r4/triage.md group B, items 2 and 3 with their folded cosmetics (test-analyzer C1, code-reviewer cosmetic-3, silent-failure 8).
- 2026-10-15 — planner revision on the orchestrator's answer (Claude, AFK, not a user ruling): the dry-run assertion skips when a `git ls-files` probe at module load fails, with the refusal as its reason, not only when `.git` is absent; Approach, criterion 2, and Verify changed to match.
- 2026-10-15 — coder build_T066: `leg()` in run-job.mjs now takes `checkout`, `volume` and `out` from one `legPaths(root, workflow, jobName, label)` call; the outer empty-label call is gone. run-job.test.mjs keeps the pure `legPaths` test (never skips) and adds "every dry-run leg mounts the report folder legPaths names for it": it parses each leg's `'-v' '<host>:/out'` from `run-job.mjs ci e2e --dry-run` and compares to `legPaths(checkout,'ci','e2e',label).out`; a module-load `git ls-files -z` probe is its only skip, the reason being `git ls-files refused the checkout: <error text>` (measured skipped in the `ci unit` container leg, 1 skipped). Mutant (test-analyzer M1: leg `out` = `join(tmpdir(),'ngx-yeti-run-job','deadbeef',label)`): the new test failed (6 pass, 1 fail); restored afterwards (diff has no `deadbeef`). project.json typecheck inputs gain `{workspaceRoot}/**/*.d.ts`. vitest-configs.test.mjs saves, clears and restores FLOOR_CHROMIUM_PATH, FLOOR_FIREFOX, FLOOR_WEBKIT. voiceover.ts `frontmostApplication` passes `{ timeout: 10_000 }` and throws "The foreground application query failed." with the cause. references/ci-local.md: `unit` row now one run (2 m 43 s at 131cf8e plus this change; 126/0, 504/0, 1715/0, 1/0, 1/0; `node --test` 46/1), history sentence replaced by a standing note.
- 2026-10-15 — Verify (via heavy lock, as written) exit 0: `node --test` run-job + vitest-configs 12/12 native; FLOOR_FIREFOX/FLOOR_WEBKIT stack-profiler test 1/1; typecheck `--skip-nx-cache` and plain run pass; appending a newline to storybook-preview.d.ts alone made the next typecheck execute (probe log had no cache-replay text; the file was restored by `git checkout`); `run-many -t lint typecheck -p screen-reader-e2e` pass; `ci unit -- npx nx run @ngx-yeti/source:test` in container: `node --test` 47 tests, 46 pass, 1 skipped (the dry-run check, no .git); prettier on the task files clean. Separate full `node tools/ci-local/run-job.mjs ci unit`: pass, 2 m 43 s, counts as in the row above.
- 2026-10-15 — Rule 13: `npx prettier --check .` clean; `nx affected -t lint typecheck test test-storybook --base=HEAD` exit 0 (9 projects plus 2 dependency tasks, 25 tasks, 6 cached).
- 2026-10-15 — orchestrator Verify (isolate gsd-path-task/T066): fail, exit 1; output tail:
  ```
  npm warn deprecated @angular/platform-browser-dynamic@22.2.1: @angular/platform-browser-dynamic is deprecated. Use `@angular/platform-browser` instead.
  npm warn deprecated @yuku-parser/binding-win32-arm64@0.10.2: yuku-parser runs on yuku-core since 0.14
  npm warn deprecated @angular/animations@22.2.1: @angular/animations is deprecated. Use `animate.enter` and `animate.leave` instead. For more information see: https://v22.angular.dev/guide/animations.
  npm warn deprecated @ngtools/webpack@22.2.1: Angular's Webpack support is deprecated. Use the esbuild and Vite-based "@angular/build" package instead.
  npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
  npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
  npm warn deprecated @angular-devkit/build-angular@22.2.1: Angular's Webpack support is deprecated. Use the esbuild and Vite-based "@angular/build" package instead.
  npm warn deprecated eslint@9.39.5: This version is no longer supported. Please see https://eslint.org/version-support for other options.
  npm warn allow-scripts 9 packages have install scripts not yet covered by allowScripts:
  npm warn allow-scripts   esbuild@0.27.7 (postinstall: node install.js)
  npm warn allow-scripts   @parcel/watcher@2.6.0 (install: node scripts/build-from-source.js)
  npm warn allow-scripts   edgedriver@6.3.1 (install: test -f ./dist/install.js && node ./dist/install.js || echo "Skipping install, project not build!")
  npm warn allow-scripts   esbuild@0.28.2 (postinstall: node install.js)
  npm warn allow-scripts   geckodriver@6.1.1 (postinstall: test -f ./dist/install.js && node ./dist/install.js || echo "Skipping install, project not built!")
  npm warn allow-scripts   lmdb@3.5.6 (install: node-gyp-build-optional-packages)
  npm warn allow-scripts   msgpackr-extract@3.0.4 (install: node-gyp-build-optional-packages)
  npm warn allow-scripts   nx@23.2.1 (postinstall: node -e "try{require('./dist/bin/post-install')}catch(e){}")
  npm warn allow-scripts   esbuild@0.25.12 (postinstall: node install.js)
  npm warn allow-scripts
  npm warn allow-scripts Run `npm approve-scripts --allow-scripts-pending` to review, or `npm approve-scripts <pkg>` to allow.
  ```
- 2026-10-15 — orchestrator rejection (Claude): finish ran the Verify in the isolate gsd-path-task/T066 at base 131cf8e and it exited 1 at the .d.ts cache probe (the typecheck after the probe edit replayed from the cache). Rejected diff: tools/ci-local/run-job.mjs, tools/ci-local/run-job.test.mjs, project.json, tools/playwright/vitest-configs.test.mjs, references/ci-local.md, apps/screen-reader-e2e/src/support/voiceover.ts; saved patch tmp/afk-m002/tools/T066-attempt1.patch, sha256 3e5bc3e01a9aad55901a18f4b6b81df680b3d155b3b18eaf5eba987063539583. Cause (read): the probe appended a fixed newline, and the coder's own probe runs had already cached that exact content in the same tree's .nx/cache, so any second run of the probe in one tree replays; the product change is not at fault.
- 2026-10-15 — plan defect repair (Claude, orchestrator, AFK; not a user ruling): Verify's probe now appends a unique comment (`printf '\n// cache probe %s\n' "$(date +%s%N)"`) so each run hashes new content; no other field changed. The retry reapplies the saved patch unchanged.
