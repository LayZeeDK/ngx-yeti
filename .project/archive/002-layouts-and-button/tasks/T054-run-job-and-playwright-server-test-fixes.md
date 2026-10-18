---
id: T054
title: Key run-job.mjs output by checkout, end a leg when the host tar fails, accept only decimal counts, and make the Playwright server test survive load
wave: 9
deps: [T053]
status: done
agent: build_T054
base: ccce8ddd273a6b29f2a709850b0d3ad94f0ffd69
worktree: null
task_branch: null
files:
  - tools/ci-local/run-job.mjs
  - tools/ci-local/run-job.test.mjs
  - references/ci-local.md
  - tools/playwright-server/container.test.mjs
---

# T054 — Key run-job.mjs output by checkout, end a leg when the host tar fails, accept only decimal counts, and make the Playwright server test survive load

## Context

Fifth build repair (2026-10-13): survivors of review round 2 of M002 (range 4504b4c..7793730, which the history rewrite of 2026-10-13 maps to 0172a0a..fb1a8c6 with the same contents for these files; line numbers at 7793730 unless stated; triaged by Claude on 2026-10-13 in the git-ignored local record tmp/afk-m002/lars-review/r2/triage.md, items 2, 3, 9, and 16, with the source reports g4-code-reviewer.md and g4-silent-failure.md beside it). Every finding is inlined here; the lines have moved since (T052 and T053 landed after the review), so find each site by its quoted code. T053 types both files first, and this task keeps them typed.

Triage item 2 (minor): "run-job.mjs reports and log folders are keyed by label only (:495, :570, :422), so two worktrees running one leg delete each other's output (g4-code-reviewer F1). Fix: add the checkout hash to the folder; ci-local.md says it." Source evidence, verbatim: "tools/ci-local/run-job.mjs:495 (`const out = join(tmpdir(), 'ngx-yeti-run-job', label)`), :570 (`rmSync(current.out, { recursive: true, force: true })` at the start of each leg), :422 (`createWriteStream(log)` into that folder). ... the volume names carry a hash of the checkout path (:485-486, `ngx-yeti-run-job-${checkout}-...`), and references/ci-local.md:44 limits the rule to 'Run one job at a time per checkout', so two worktrees may run the same job at once. ... Failure: worktree B starting `ci e2e` leg `chromium-development` deletes worktree A's folder for the same leg while A is still writing to it. A loses its `run-job.log` and the `dist/.playwright` reports that its container copies into the bind-mounted `/out`, and A's closing summary points to a folder that now holds B's output. ... Fix direction: put the checkout hash in the folder (`join(tmpdir(), 'ngx-yeti-run-job', checkout, label)`) and state it in ci-local.md."

Triage item 3 (minor): "run-job.mjs: a failed host tar leaves docker stdin open (`{ end: false }`, :454) and the leg hangs (g4-silent-failure F1). Fix: end docker stdin or remove the container when tar exits non-zero or errors." Source evidence, verbatim: "tools/ci-local/run-job.mjs:454 (`tar.stdout.pipe(docker.stdin, { end: false })`), :438-452 and :364. ... this range added `{ end: false }` so that docker's stdin stays open for the new watchdog (:366-368). Before the change, the end of `tar.stdout` closed docker's stdin, so the container's `tar -xf - -C /src` hit EOF and failed loudly. Now nothing ever ends `docker.stdin`. The host tar's exit code (`tarStatus`) is read only inside `docker.on('close')`. Failure: say the host tar exits before it writes a complete archive. Causes include a tar that rejects `--null -T -` ..., tar missing from PATH, or an early abort. The container's `tar -xf -` then blocks forever on a stdin that never closes. Docker never closes, `done()` is never called, and the run neither ends nor exits non-zero. ... An AFK task Verify that chains `run-job.mjs ... &&` hangs until an outer timeout. ... Fix direction: in `tar.on('close')`, when the code is non-zero, or in tar's `error` handler, end `docker.stdin` or run `docker rm -f <name>`, then resolve the leg with 1. Leave `end: false` in place only for the success path." The g4 code reviewer measured that GNU tar 1.35 in the container exits after 24 ms with its stdin still open on the success path, so the watchdog design itself is sound.

Triage item 9 (cosmetic): "run-job.mjs `count()` accepts '' and non-decimal numbers (:30-38) (g4-silent-failure F5). Fix: /^\d+$/." Source evidence, verbatim: "`Number('')` is 0, so `--e2e-workers \"\"` (for example an unset shell variable in quotes) silently means 'CI's one worker'. `Number('0x3')` and `Number('1e1')` also pass. Fix direction: accept only `/^\d+$/` before calling `Number`."

Triage item 16 (minor): "tools/playwright-server/container.test.mjs:279 (readiness wait at :103) fails under load: 'run-server did not answer' at 25.5 s in T052's uncached run-many, 5/5 pass alone at ~6.3 s (measured, Claude, 2026-10-13). Fix: a readiness wait that does not race the whole suite's load (longer bound or wait on the server's own ready signal)." The failing test is "stops once no admitted connection has been open for the idle time"; the wait is `ready(port, token)`, which polls the token path 100 times at 200 ms and then throws `run-server did not answer`. This item is not in the brief's item list 1 to 14; the planner includes it because the STATE log of 2026-10-13 sends triage items 1 to 16 to this repair.

## Approach

- Reports and logs: the per-leg folder is `join(tmpdir(), 'ngx-yeti-run-job', <the checkout hash the volume names already use>, label)`; the leg log `run-job.log` and the copied reports go there, and the closing summary prints that path. `references/ci-local.md` says where a leg's output lands and that two checkouts no longer share it; keep its "Run one job at a time per checkout" rule.
- Host tar failure: when the host `tar` exits non-zero or emits `error`, end `docker.stdin` (or remove the leg's container with `docker rm -f <name>`), and the leg ends as FAIL with exit 1 and tar's status in its message. The success path keeps `end: false` and the stdin watchdog. Show the failure path once against a real container leg (for example a scratch checkout where one tracked file is deleted, so tar exits 2 with "Cannot stat"), and record the command, its wall time, and its exit code in the Log.
- `count()`: only `/^\d+$/` text reaches `Number`; `''`, `0x3`, `1e1`, `-1`, and ` 3` exit 2 with the existing message. Add `node:test` cases to `tools/ci-local/run-job.test.mjs` for the accepted and refused forms, through an export or by running the script with `--dry-run`.
- Readiness: the Playwright server test waits on run-server without racing the whole suite's load: either a bound derived from the observed worst case with margin, or the server's own ready signal. Do not raise the test's own assertion timeouts, and do not change `tools/playwright-server/container.mjs` (its hash recreates the shared server container; see T053). Reproduce the failure under load first (the root `test` target inside `npm exec nx -- run-many -t test --skip-nx-cache`, as in T052's run) and record whether and how often it fails at base; then show the fix passing the same load three times.
- Keep both scripts typed (Interface contract). Do not touch `.github/workflows/`; T028 owns any workflow change.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`; `references/ci-local.md`; AGENTS.md "Scripts".

## Interface contract

- The committed scripts are typed (T053): `tsconfig.scripts.json` at the repository root type-checks every committed `.mjs`, `.cjs`, and `.js` file outside `vendor/` and `docs/specs/`, each starting with `// @ts-check` (after a shebang, if any) and typed with JSDoc. `npm exec nx -- run @ngx-yeti/source:typecheck` runs `tsc -p tsconfig.scripts.json && node --test tools/typecheck/scripts-coverage.test.mjs` and exits 0. A task that edits one of these scripts keeps its `// @ts-check` line and its JSDoc types, adds no `any` and no unchecked assertion, and leaves that command at 0 errors.

## Intent coverage

- None

## Acceptance criteria

1. A leg's reports and `run-job.log` land in a folder under `ngx-yeti-run-job/<checkout hash>/<label>` in the OS temp folder, and `references/ci-local.md` says so.
2. When the host tar fails, the leg ends with exit 1 and names tar's status instead of hanging; the Log records one real run of that path with its exit code.
3. `--legs` and `--e2e-workers` accept only decimal digits: `''` and `0x3` exit 2 (tests in `tools/ci-local/run-job.test.mjs`), and the existing quoting and leg tests still pass.
4. `tools/playwright-server/container.test.mjs` passes three runs of `npm exec nx -- run-many -t test --skip-nx-cache`; the Log records the base measurement and the three runs.
5. `npm exec nx -- run @ngx-yeti/source:typecheck` exits 0 natively (the `static` job's check; its coverage test needs the Git index, which a container leg does not have), the root `test` target passes inside the `unit` container through `node tools/ci-local/run-job.mjs ci unit -- npx nx run @ngx-yeti/source:test`, and `npx prettier --check` passes on the four files.

## Verify

```bash
npm ci && npx playwright install chromium && (node tools/ci-local/run-job.mjs ci e2e --dry-run --e2e-workers 0x3; test $? -eq 2) && (node tools/ci-local/run-job.mjs ci e2e --dry-run --e2e-workers ""; test $? -eq 2) && node tools/ci-local/run-job.mjs ci e2e --dry-run --e2e-workers 2 && node --test tools/ci-local/run-job.test.mjs && npm exec nx -- run @ngx-yeti/source:typecheck --skip-nx-cache && npm exec nx -- run-many -t test --skip-nx-cache && npm exec nx -- run-many -t test --skip-nx-cache && node tools/ci-local/run-job.mjs ci unit -- npx nx run @ngx-yeti/source:test && npx prettier --check tools/ci-local/run-job.mjs tools/ci-local/run-job.test.mjs references/ci-local.md tools/playwright-server/container.test.mjs; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-13 — created by planner (build repair 5), from review round 2 triage items 2, 3, 9, and 16 (tmp/afk-m002/lars-review/r2/triage.md).
- 2026-10-13 — planner (build repair 5, correction measured by the orchestrator): the Verify's container leg ran the root `typecheck` target, which cannot pass in a container: its coverage test calls `git ls-files`, and `run-job.mjs` ships the tree as a tar of `git ls-files -co` with no `.git`. The leg now runs the root `test` target (`npx nx run @ngx-yeti/source:test`), which the `unit` job runs and which holds the `container.test.mjs` case this task makes survive load; the root `typecheck` stays native in the same Verify. Criterion 5 says so.
- 2026-10-14 — coder build_T054: implementation. (1) `run-job.mjs`: a leg's folder is `join(tmpdir(), 'ngx-yeti-run-job', checkout, label)`, `checkout` being the same 8-hex hash of the checkout path the volume names carry; `references/ci-local.md` says where a leg's reports and `run-job.log` land, that two checkouts keep separate folders, and that a failed host tar ends the leg; the "Run one job at a time per checkout" rule is kept. (2) Host tar failure: `tar` `error` or a non-zero/signal `close` unpipes tar from docker's stdin and ends it; the container's `tar -xf -` gets EOF, or its stdin watchdog kills it, and docker's `close` resolves the leg with 1 and prints `tar exited with <status>` (or `tar failed: <message>`). The success path keeps `{ end: false }` and the watchdog. (3) `count()` passes only `/^\d+$/` text to `Number`. `parseArgs` is now exported for the tests. Tests added to `run-job.test.mjs`: refusal of `''`, `0x3`, `1e1`, `-1`, ` 3`, `3 `, `2.0` (and `--legs 0`) with exit 2 and the existing message, through a `--dry-run` subprocess (parsing ends before Git is read, so it also runs in a container); acceptance of `1`, `03`, `0`, `2` through `parseArgs`; the dry-run's `/out` mount sits under `ngx-yeti-run-job/<the volume hash>/ci-e2e-...` (skipped when there is no `.git`, as in a container leg, where a dry run cannot list files; it ran natively). (4) `container.test.mjs` idle test: `idleMs` 500 -> 5000, with a comment on why.
- 2026-10-14 — coder build_T054: root cause of the idle-test failure (measured). The forwarder arms its idle timer as soon as `serve()` returns, and while run-server starts only the readiness polls (one every 200 ms, each admitted then dropped on ECONNREFUSED) reset it; one stall of the test process longer than idleMs - 200 ms between two polls lets the 500 ms timer kill run-server before it ever answers, and `ready()` then exhausts its 100 polls ("run-server did not answer", ~25 s). T052's failing log shows run-server's "Listening on ..." line printed before the failure, so the server was started and then stopped, not slow. Probe (one-off scratch script, scratchpad t054-stall-probe.mjs, against this worktree's unchanged `container.mjs`, one busy-wait stall of the test process 20 ms after the first failed poll): idleMs 500 + 700 ms stall -> "did not answer", run-server ended by SIGTERM; idleMs 5000 + 700 ms stall -> answered after 934 ms; idleMs 5000 + 3000 ms stall -> answered after 3243 ms. The fix tolerates any single stall up to ~4.8 s and adds ~4.5 s to the test; no assertion timeout, `ready()` bound, or `container.mjs` changed.
- 2026-10-14 — coder build_T054: base measurement (before the fix, `npm exec nx -- run-many -t test --skip-nx-cache` in this worktree under the heavy lock): 5 of 5 runs passed (run 1 32.7 s; runs 2-4 with `--output-style=static`: idle test 1371, 1962, 1420, 1250 ms; run-many 28.3, 27.5, 29.2, 33.5 s); plus 3 of 3 passing runs of `node --test tools/playwright-server/container.test.mjs` beside 36 `yes` CPU burners (idle test 3216, 3098, 2952 ms). So the failure did not reproduce at base under these loads (0 of 8); T052's failing run also had `ngx-yeti:test-storybook` running beside it. The stall probe above reproduces the mechanism deterministically instead.
- 2026-10-14 — coder build_T054: host tar failure, one real container leg: a scratch clone of this worktree (fixed `run-job.mjs` copied in) with read access to `README.md` denied by `icacls /deny`, `timeout 600 node tools/ci-local/run-job.mjs ci unit -- true` through the heavy lock: `tar: README.md: Cannot open: Permission denied`, `run-job: [ci-unit] tar exited with 2`, `=== FAIL ci-unit in 0 m 12 s`, exit 1 after 13 s wall; its summary printed `...\Temp\ngx-yeti-run-job\77d346de\ci-unit` (the per-checkout folder). A tracked file deleted from the tree does not work for this check: `sourceFiles()` drops paths that do not exist, so tar never sees them. Cleanup: the scratch clone's two volumes (`ngx-yeti-run-job-77d346de-ci-unit-*`) and its output folder were removed; the clone itself is left in the session scratchpad because the guard refuses deleting a tree that holds `.project/archive/`.
- 2026-10-14 — coder build_T054: Verify run exactly as written, through the heavy lock, exit 0 (02:16-02:25, lock waited 385 s). `npm ci` added 1942 packages; `--e2e-workers 0x3` and `""` each exit 2 ("takes a whole number from 0"); `--e2e-workers 2` dry run lists 12 legs; `node --test tools/ci-local/run-job.test.mjs` 6 pass, 0 fail; root typecheck pass (3.0 s); `run-many -t test --skip-nx-cache` twice, 5 projects + 2 deps each, pass (29.0 s, 25.3 s); `ci unit -- npx nx run @ngx-yeti/source:test` pass in 0 m 32 s, root test 43 pass, 0 fail, 1 skipped (the dry-run folder test, no `.git` in the container), idle test 5218 ms; prettier check on the four files passes. A first Verify attempt failed at the container leg: two new tests ran `--dry-run` with valid values, which reads `git ls-files` and exits 1 without `.git`; fixed as described above. AC4 third run: `run-many -t test --skip-nx-cache --output-style=static` pass, 44 root tests pass, idle test 5920 ms, run 27.1 s. So the idle test passed 3 of 3 uncached run-many runs plus the container leg.
- 2026-10-14 — coder build_T054: rule 13: `npx prettier --check .` passes ("All matched files use Prettier code style!"); `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD` (through the lock) exit 0: affected is only `@ngx-yeti/source`, typecheck and test pass (17.0 s). `npm exec nx -- run @ngx-yeti/source:typecheck --skip-nx-cache` exits 0 (T053 interface contract).
- 2026-10-14 — orchestrator Verify (isolate gsd-path-task/T054): pass, exit 0; output tail:
  ```
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
  run-job: --e2e-workers takes a whole number from 0
  run-job: --e2e-workers takes a whole number from 0
  ```
