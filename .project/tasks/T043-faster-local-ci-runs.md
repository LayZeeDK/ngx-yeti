---
id: T043
title: Run a job's matrix legs concurrently in run-job.mjs, with a local e2e worker count and a build-only Nx cache, capped by measured memory
wave: 4
deps: [T042]
status: done
agent: build_T043
base: 0bde5164654937c4fe12330811e3b06f6891b895
worktree: null
task_branch: null
files:
  - tools/ci-local/run-job.mjs
  - references/ci-local.md
  - apps/ngx-yeti-e2e/playwright.config.mts
  - apps/yeti-app-e2e/playwright.config.mts
  - apps/yeti-analog-e2e/playwright.config.mts
  - tools/playwright/browser-projects.mjs
  - tools/playwright/playwright-configs.test.mjs
  - apps/yeti-app-e2e/src/cache-probe.spec.ts
  - tools/ci-local/run-job.test.mjs
  - project.json
---

# T043 — Run a job's matrix legs concurrently in run-job.mjs, with a local e2e worker count and a build-only Nx cache, capped by measured memory

## Context

Build repair before wave 4, second repair. User rulings, verbatim (2026-10-12): "Approve both changes: Faster and narrower" then "Unless you don't think we should land Verify-narrowing". The orchestrator declined the narrowing with evidence: the pending task Verify commands already pass narrowed commands to `run-job.mjs`, and only the wave gates and T028 run full jobs, which SC8 needs. So this task makes local runs faster and narrows nothing. A second ruling, verbatim (2026-10-12): "Hosted GitHub Actions runners for public repos are limited to few CPU cores and ~7 GB RAM total. We have many CPU cores and ~7 GB ram free. We don't have to replicate the exact worker count when running the CI jobs locally. We can adapt to a local multi-core setup." The orchestrator's reading: local runs may use more Playwright workers than CI, CI keeps its setting, and local concurrency (workers and parallel legs) is capped by measured memory, not by cores.

What `tools/ci-local/run-job.mjs` does today (read at 2eddfcd). Its `run` function loops over the matrix combinations and awaits one `docker run --rm` container per leg, so the six `ci.yml` `e2e` legs and the two `floor.yml` `firefox-146-e2e` shards run one after another. GitHub runs them on separate runners at once. Every leg of a job mounts the same volumes, named `ngx-yeti-run-job-<checkout>-<workflow>-<job>-<folder>`, one per `node_modules` folder the lockfile names. They share one npm cache volume, `ngx-yeti-run-job-npm-cache`. Setup (`npm ci`, `npm install --no-save ...`) reruns only when the setup key (image, setup steps, every `package.json`, the lockfile, `.npmrc`) differs from the key file in the volume. Measured in T036's Verify log: `npm ci` ran only in the first e2e leg, and the later legs reused `node_modules`. So setup is already shared, and the remaining cost is the serial legs, one Playwright worker per leg, and each leg's own builds. T036's Verify took about 80 minutes: six serial e2e legs plus two floor jobs. `references/ci-local.md` measured the six legs at 8 m 49 s on 2026-10-05, before M002 roughly tripled the e2e specs.

Facts this task builds on:

- Workers. The three e2e configs spread `nxE2EPreset`, which sets `workers: process.env.CI ? 1 : undefined` (`node_modules/@nx/playwright/dist/src/utils/preset.js:88`). `run-job.mjs` sets `CI=true`, so every e2e leg runs one worker, as on CI. `floor.yml` `firefox-146-e2e` passes `--workers=2` on its command line, which wins over the config.
- The Nx cache. `.nx` is git-ignored, and `sourceFiles()` streams only files `git ls-files -co --exclude-standard` lists. So every container starts with an empty Nx cache, rebuilds `yeti-css` (`yeti-build`) and the Fixture app, and replays nothing. The e2e targets are inferred by `@nx/playwright/plugin` and are cacheable (inferred; confirm with `npm exec nx -- show project yeti-app-e2e --json`). So a persistent cache that also stored `e2e`, `test` or `test-storybook` results would replay a pass without running a test.
- Memory. All containers share one WSL VM capped at 16 GB. One `unit` leg peaked at 13.9 to 14.7 GiB before T042 and at 8.3 to 9.2 GiB after it (the spike of 2026-10-12; T042's Context). Failures there began when the VM swapped and the host had little free memory. No e2e leg's peak has been measured.
- Ports. The e2e web servers use fixed ports (4310 to 4312, 4401). `run-job.mjs` publishes no port and sets no `--network`, so each container has its own network namespace, and two legs' servers do not collide (inferred; prove it with the first concurrent run).

## Approach

- Three changes, each measured on its own against the script at this task's base:
  1. Concurrent legs (required). `run` starts up to a cap of legs at once. The cap is set from measured memory, not cores, and a documented option lowers it (1 runs the legs serially, as today). Each concurrent leg gets its own writable `node_modules` volumes, because legs write `node_modules/.vite`, `node_modules/.cache` and the setup key file, and a shared volume would race. Setup must still not rerun when its key matches. Measure the cold cost too: the first run into new volumes, where every leg might run `npm ci` against the shared npm cache. The coder decides how volumes are seeded, for example by running setup once and copying it into the other legs' volumes. If no cap of 2 or more fits in memory with headroom, or concurrency gives no wall-clock gain, stop and write `NEEDS-ORCHESTRATOR:` with the numbers. Do not land a change that does nothing.
  2. Local e2e worker count (conditional). A worker count that `run-job.mjs` passes into the container as an environment variable, read by the e2e configs (once, in `tools/playwright/browser-projects.mjs` if that reads better). CI never sets it, so CI keeps the preset's one worker. A command-line `--workers`, such as `firefox-146-e2e`'s, still wins. The local default comes from the measurements.
  3. Build-only Nx cache (conditional). A Docker volume that lets later legs and later runs restore the `yeti-css` and Fixture app builds instead of rebuilding them. It must never replay an `e2e`, `test` or `test-storybook` result. Nx keeps its cache index in its workspace data directory as well as in the cache directory (inferred for Nx 23.2.1; check), so prove that the second leg actually restores the builds: Nx marks the task as restored from the local cache. Also prove that concurrent legs can share the volume, or give each job its own. Prove the replay rule with a probe. Add `apps/yeti-app-e2e/src/cache-probe.spec.ts` with one test that always fails, run the leg twice with the cache volume (`run-job.mjs` streams untracked files), and show that it fails both times, and that the second run restored the builds and ran the test. Then show the same for the `unit` job's `test` and `test-storybook` if the volume is mounted there too. Delete the probe before the commit, and record both outputs in the Log.
- Measure each change: wall-clock time before and after for `node tools/ci-local/run-job.mjs ci e2e` (all six legs) and `floor firefox-146-e2e`, cold and warm; the peak total container memory over the run (`docker stats`, summed across concurrent containers) against the 16 GB VM; and a flake check. For the flake check, run the frame-sensitive specs (`apps/yeti-app-e2e/src/setup-boundaries.spec.ts`, `static-attributes.spec.ts`, `lift.spec.ts` and `enter.spec.ts`, and `apps/ngx-yeti-e2e/src/lift.spec.ts`, `enter.spec.ts` and `spinner.spec.ts`) with `--repeat-each=5 --retries=0` in all three engines under the final settings, with legs at the cap. A failure that does not reproduce at the base settings is a new failure: lower the cap or the worker count, or drop the change.
- Each change that lands can be switched off by a documented option or variable, so that one leg can still be timed as CI runs it: serial legs, the preset's worker count, and no build cache. T028 uses this to time a leg for its shard decision.
- Land only the changes that show a gain and no new failures. For every change or setting that is dropped or lowered, record its numbers in the Log and in `references/ci-local.md`.
- Never change what a job runs or asserts in GitHub CI. `.github/workflows/*.yml` are not in this task's files. `run-job.mjs` keeps reading the image, `env`, matrix and steps from the workflow, keeps refusing keys it does not run, keeps the `--matrix` filter and the `--` replacement command, and keeps `CI=true`. Locally, runs differ from CI only in the worker count, the restored builds and the leg concurrency. `references/ci-local.md` states those differences.
- Output. Every leg still runs to its end when another fails, as `fail-fast: false` does. The exit code is 1 when any leg fails. Each leg's output stays readable on its own, for example as a log file in its reports folder or with a label prefix on every line. The closing summary lists each leg's result, wall time and reports folder. `--dry-run` still prints each leg's full `docker run` command. An interrupt (Ctrl+C) leaves no container running; check with `docker ps`.
- Tests. If the worker change lands, `tools/playwright/playwright-configs.test.mjs` (run by `npm exec nx -- run @ngx-yeti/source:test`) proves, for every e2e config, that with `CI=true` and the local variable unset the worker count is the preset's 1, and with the variable set it is that number. Keep the test hermetic, as the file's existing tests are.
- Quoting test (security review of M002, informational finding 3, triaged by the orchestrator on 2026-10-12, verbatim: "tools/ci-local/run-job.mjs:134-138,272-274,404-440: [A03] matrix and run text come only from the local user and the repo's own workflows, docker gets an argument array, and quoting escapes `'`. This is by design. Keep the single-quote escape covered by a test."). Add `tools/ci-local/run-job.test.mjs`, the script's first test file, hermetic and run by `node --test`: a run text, a matrix value, and a `--` replacement command that each contain `'` (and `$(...)` or a backtick) reach the container's `bash -e -c` script quoted so bash reads them as literal text, shown through `--dry-run` output or an exported `quote`, without Docker. Add the file to the `test` command and inputs of the root `project.json` (`@ngx-yeti/source:test`) with `tools/ci-local/run-job.mjs` as an input, so a change to either reruns it.
- Docs in this task: in `references/ci-local.md`, the "Container jobs" section describes concurrent legs, the cap, the option that lowers it, the per-leg volumes, the build cache, and the local worker count. The "Run one job at a time per checkout" sentence still holds for whole jobs. Add the measured runs (before and after, cold and warm, peak memory) to "Measured runs". Leave the NVDA lane section to T041 and the unit-job lines to T042.
- Heavy runs take the machine and use fixed ports inside each container, so the orchestrator serializes heavy commands. Read `references/ci-local.md` before running a container job.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md` (e2e projects, engines), `.claude/skills/type-safety/SKILL.md` for the `.mts` configs.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. `node tools/ci-local/run-job.mjs ci e2e` runs its legs concurrently, up to a cap set from measured memory, and an option lowers the cap to 1. Each concurrent leg mounts its own `node_modules` volumes: `--dry-run` with `--matrix engine=chromium` shows a different `/src/node_modules` volume for each of the two legs. Setup reruns only when its key changes.
2. Each leg runs to its end when another fails, the exit code is 1 when any leg fails, each leg's output is readable on its own, and the summary lists each leg's result, wall time and reports folder. An interrupted run leaves no container running.
3. If the local worker count lands, the e2e configs take it from a variable that only `run-job.mjs` sets. `tools/playwright/playwright-configs.test.mjs` proves that `CI=true` without the variable gives 1 worker for every e2e config, and that the variable sets the count.
4. If the build cache lands, a later leg restores the `yeti-css` and Fixture app builds from it. The Log shows the probe spec failing on both runs, with the builds restored on the second run, and shows that no `e2e`, `test` or `test-storybook` result was replayed. The probe file is not in the commit.
5. The Log and `references/ci-local.md` record, for each change: wall clock before and after (cold and warm), peak total memory against the 16 GB VM, the flake-check results, and whether it landed. Every dropped or lowered setting has its numbers.
6. Each landed change can be switched off by an option or variable that `references/ci-local.md` documents. No workflow file changes. In GitHub CI every job runs the same steps with the same settings as before.
7. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.
8. `tools/ci-local/run-job.test.mjs` runs in `npm exec nx -- run @ngx-yeti/source:test` and shows a `'` in a run text, a matrix value, and a replacement command reaching the container script as literal text; it fails when the escape in `quote` is removed (the Log records that control run).

## Verify

```bash
npm ci && test "$(node tools/ci-local/run-job.mjs ci e2e --matrix engine=chromium --dry-run | rg -o "[A-Za-z0-9_.-]+:/src/node_modules'" | sort -u | wc -l)" = 2 && test ! -e apps/yeti-app-e2e/src/cache-probe.spec.ts && test -f tools/ci-local/run-job.test.mjs && rg -q -F "tools/ci-local/run-job.test.mjs" project.json && npm exec nx -- run @ngx-yeti/source:test && npm exec nx -- run-many -t lint typecheck -p ngx-yeti-e2e yeti-app-e2e yeti-analog-e2e && node tools/ci-local/run-job.mjs ci e2e --matrix engine=chromium && node tools/ci-local/run-job.mjs floor firefox-146-e2e && node tools/ci-local/run-job.mjs ci unit; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-12 — created by planner (build repair #2; user rulings quoted in Context). On the current script both chromium legs mount the same `node_modules` volume, so the Verify's first check fails if this task is skipped. The real runs then exercise two concurrent e2e legs, two concurrent floor shards with their `npm install --no-save` setup, and the single-leg `unit` job. `apps/yeti-app-e2e/src/cache-probe.spec.ts` is listed only because the coder creates and deletes it. It must not be in the commit, and the Verify fails if it is. The Verify ends by stopping the Nx daemon and keeps its own exit code; run it exactly as written and never set NX_DAEMON.
- 2026-10-12 — planner (build repair #3): the orchestrator's triage of the security review routes the quoting test of finding 3 to this task. `files` gains `tools/ci-local/run-job.test.mjs` and the root `project.json` (its `test` target); Approach gains one bullet; criterion 8 is new; the Verify checks the test file exists and is in the target before running `@ngx-yeti/source:test`, which already ran. Everything else is unchanged. No other pending task edits the root `project.json`.
- 2026-10-12 — coder (build_T043): implementation. `run-job.mjs`: `--legs <n>` (default 2) runs up to n matrix legs at once from a slot pool; slot 1 keeps the job's volumes, slot k mounts `...-<job>-leg<k>-*`, each slot runs setup only when its key differs. Each container is named `ngx-yeti-run-job-<checkout>-<label>-<pid>`; output lines carry `[label]` and each leg writes `run-job.log` in its reports folder; the summary lists result, wall time, reports folder and log; exit 1 when any leg fails; `--dry-run` prints every leg's full `docker run`. Interrupt: a SIGINT/SIGTERM handler runs `docker rm -f` on the running legs, and the container script keeps stdin open (`exec 3<&0 < /dev/null`, `{ cat <&3 > /dev/null; kill -KILL $$; } &`, tar piped with `end: false`), so a leg also stops when node dies without a handler. `--e2e-workers <n>` (default 3; 0 leaves it unset) passes `E2E_LOCAL_WORKERS`, read by `localWorkers()` in `tools/playwright/browser-projects.mjs` and spread after the preset in the three e2e configs; a command-line `--workers` still wins. `quote`, `resolve`, `containerScript` and a new `legChecks` are exported; `run` runs only under `import.meta.main`. New `tools/ci-local/run-job.test.mjs` (3 tests, bash reads the words from stdin, no Docker); `project.json` `test` runs it with `run-job.mjs`, the test and `.github/workflows/ci.yml` as inputs. `playwright-configs.test.mjs` gains one worker test per e2e config (`CI=true` gives 1, `E2E_LOCAL_WORKERS=3` gives 3). `references/ci-local.md`: usage line, "How a local run differs from CI", "Concurrent legs and local workers" measurements. No workflow file changed.
- 2026-10-12 — coder: measurements (Windows 11 ARM64, Docker Desktop WSL VM 12.52 GB / 8 CPUs, the `migrate-to-angular-19-*` containers were not running during the runs; peak = summed `docker stats` of this run's containers, sampled every 3 s; every run went through the heavy lock and passed with unchanged counts: ngx-yeti-e2e 129/1 Chromium and Firefox, 126/4 WebKit; yeti-app-e2e dev 521/90, 519/92, 517/94, prod 470/141, 468/143, 466/145; floor shard 1 64 + 217, shard 2 65 + 302).
  - `ci e2e`, 6 legs. Before (base script, serial, 1 worker): cold 2775 s (46 m 15 s), peak 5.33 GiB; warm derived 2714 s (cold less the first leg's 61 s `npm ci`; not run separately). `--legs 2`, preset workers: cold 1678 s, peak 7.91 GiB; warm 1584 s, peak 7.31 GiB (-42 % warm). `--legs 2 --e2e-workers 2`: warm 1072 s, peak 8.22 GiB. `--legs 2 --e2e-workers 3` (landed default): warm 989 s (16 m 29 s), peak 8.36 GiB (-64 % against the derived warm baseline). No retry or flaky test in any run.
  - `floor firefox-146-e2e`, 2 shards (`--workers=2` from the workflow wins, so only legs apply). Before: cold 480 s, peak 5.90 GiB; warm derived 444 s. `--legs 2` (landed): cold 265 s, peak 9.99 GiB; warm 234 s, peak 10.24 GiB. A first warm attempt was stopped by Claude Code's host low-memory reaper mid-run (host memory, not the VM; other processes were running); its two containers kept running because node was killed without a handler, which led to the stdin watcher; rerun passed with the numbers above.
  - Cap: 2 lands. 3 legs not tried: one leg peaks at up to 5.9 GiB (floor), two at 10.24 GiB, so three would exceed the 12.5 GB VM. Headroom at 2: about 2.3 GB of the VM at the floor peak, about 4 GB for e2e.
  - Flake check at the landed defaults (`--legs 2`, 3 workers), dev and prod legs at once, all three engines, `--repeat-each=5 --retries=0`, specs setup-boundaries, static-attributes, lift, enter (yeti-app-e2e) and lift, enter, spinner (ngx-yeti-e2e): ngx-yeti-e2e 425 passed / 25 skipped in each leg; yeti-app-e2e dev 1740 passed, prod 1590 passed / 150 skipped; 0 failures; 1014 s; peak 7.23 GiB.
  - Build-only Nx cache: dropped, not implemented. Builds measured in one container (`-- bash -c` timing each `nx run`, Nx start included): yeti-css:yeti-build 4 s, ngx-yeti:build-storybook 12 s, yeti-app:build:development 7 s, yeti-app:build:production 8 s, so at most 23 s per dev leg and 12 s per prod leg, under 1 min of the 989 s run before restore cost, against a mechanism that must keep cacheable `e2e` (confirmed `cache: true` in `nx show project yeti-app-e2e`), `test` and `test-storybook` from replaying. So no probe was created; `apps/yeti-app-e2e/src/cache-probe.spec.ts` does not exist.
  - Interrupt: hard kill (`taskkill /F` on node, no handler) with one sleeping leg and with two concurrent legs: 0 containers 15 s later. Ctrl+C (GenerateConsoleCtrlEvent in the run's own console, two concurrent legs): node gone, `docker ps -a --filter name=ngx-yeti-run-job` empty.
  - Quoting control: with the `replaceAll("'", "'\\''")` escape removed from `quote`, `run-job.test.mjs` failed 3 of 3; restored, 3 of 3 pass (diff shows `quote`'s body unchanged from base).
  - Verify attempt 1 exited 1: the replacement-command test ran the CLI's `--dry-run`, which needs `git ls-files`, and the `unit` container has no `.git`. Rewrote that test to use the exported `legChecks` (no git, no CLI); attempt 2 below.
- 2026-10-12 — coder: Verify, run exactly as written through the heavy lock: exit 0, 727 s, peak 10.00 GiB. `npm ci` ok; dry-run shows 2 distinct `/src/node_modules` volumes; probe absent; test file present and in `project.json`; `@ngx-yeti/source:test` 39 passed, 0 failed; lint + typecheck for the three e2e projects pass; `ci e2e --matrix engine=chromium` 2 legs pass (yeti-analog 1, ngx-yeti-e2e 129, yeti-app-e2e 521 dev, 470 prod); `floor firefox-146-e2e` 2 shards pass (64 + 217, 65 + 302); `ci unit` pass (88, 384, 1411, 1 and 1 tests; `@ngx-yeti/source:test` 39 of 39 inside the container). `npx prettier --check .` clean. Ledger rows: none needed (local tooling only). Changed paths: tools/ci-local/run-job.mjs, tools/ci-local/run-job.test.mjs (new), project.json, tools/playwright/browser-projects.mjs, tools/playwright/playwright-configs.test.mjs, apps/ngx-yeti-e2e/playwright.config.mts, apps/yeti-app-e2e/playwright.config.mts, apps/yeti-analog-e2e/playwright.config.mts, references/ci-local.md.
- 2026-10-12 — orchestrator Verify (isolate gsd-path-task/T043): pass, exit 0; output tail:
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
