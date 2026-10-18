---
id: T047
title: Harden both control scripts (checked session names, refused unknown flags, reported close failures, full freshness scans) and run them with the Nx daemon on
wave: 4
deps: []
status: done
agent: build_T047
base: 93ddcb27cd6954aa578dadc89e26b07f89392602
worktree: null
task_branch: null
files:
  - .claude/skills/control-yeti-app/scripts/control.mjs
  - .claude/skills/control-yeti-app/scripts/control.test.mjs
  - .claude/skills/control-yeti-app/SKILL.md
  - .claude/skills/control-yeti-app/features/README.md
  - .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs
  - .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs
  - .claude/skills/control-ngx-yeti-storybook/SKILL.md
  - .claude/skills/control-ngx-yeti-storybook/features/README.md
  - .claude/skills/control-ngx-yeti-storybook/features/stories.md
---

# T047 — Harden both control scripts (checked session names, refused unknown flags, reported close failures, full freshness scans) and run them with the Nx daemon on

## Context

Third build repair, review round 1 and the security review of M002 (range f35b35f..1747fe0, triaged by the orchestrator on 2026-10-12). The triage, reviewer, and security files are git-ignored local records, so every finding is inlined. Line numbers are at 1747fe0; no other pending task edits these files. Out of scope by the user's deferral, and not to be fixed here: the yeti-app `down` dead-root lockout, and its Storybook twin (triage item 12: "the yeti-app `down` dead-root lockout is deferred by Lars; the storybook twin gets the same owner: deferred with it (price: an orphaned Storybook needs a manual kill; owner M003 control-skill work)"), that is `control-ngx-yeti-storybook/scripts/control.mjs:550-556`.

Lars's standing rule (project memory, quoted by the triage and the brief): `NX_DAEMON=false` is never a fix; the measured cause of the earlier failures was a missing daemon stop before sidecar cleanup.

Findings, verbatim (criterion, then the observation):

- Security finding 1, Low, kept by the triage: ".claude/skills/control-yeti-app/scripts/control.mjs:551-562: [A03] `state.session` from `readState` (:170-176) is never checked and goes into a `shell: true` string, so a planted state file runs a command on `down`. Check it against `^[\w-]+$` after reading, or pass it as an argument." Validation note: "the state file sits in an untracked scratch folder; rises to Medium if that folder were ever git-tracked". Code: `spawnSync(`playwright-cli -s=${session} close`, { cwd: root, encoding: 'utf8', shell: true, timeout: 30000, windowsHide: true });` under the comment "One string: the session name is [\w-] only, and shell: true resolves the playwright-cli shim.", and `readState()` returns `JSON.parse(readFileSync(stateFile, 'utf8'))` unchecked. The Storybook script runs its close through `cmd.exe /c` on Windows (g4 silent-failure hunter, finding 3), so its recorded session name reaches a shell too.
- Triage item 11, minor (g4 code reviewer): "both control scripts launch Nx with the daemon off ... .claude/skills/control-yeti-app/scripts/control.mjs:258, .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs:356. Evidence: `env: { ...process.env, PORT: String(port), NX_DAEMON: 'false' }` and `NX_DAEMON: 'false',`. Both scripts start every instance with the Nx daemon off, which goes against Lars's standing rule ... Neither skill records a measured reason." Triage fix: "measure the scripts with the daemon on (and a daemon stop at `down`), then drop the override."
- Triage item 12, minor (g4 silent-failure hunter): "control-ngx-yeti-storybook `down` treats every playwright-cli failure as 'not found' ... control.mjs:575-589 ... `let sessionClosed = 'playwright-cli not found'; try { ... execFileSync(file, [...prefix, `-s=${state.session}`, 'close'] ...) } catch { // playwright-cli is absent; there is no session to close. }` ... on Windows the command runs through `cmd.exe /c`, so cmd.exe always exists. A non-zero exit from a session that failed to close is caught, labelled 'playwright-cli not found', and `down` still exits 0." And "control-yeti-app `down` ignores the results of its playwright-cli `close` calls ... control.mjs:552-562 ... The return value is never read ... a missing shim, the 30 s timeout or a failed close of `<session>` or `<session>-jsoff` leaves no trace in the result. `down` exits 0 although SKILL.md says it 'Closes the run's playwright-cli sessions'."
- Triage item 13, minor (g4 silent-failure hunter): "the static Storybook freshness check scans only packages/ngx-yeti, but the stories import @ngx-yeti/testing ... control.mjs:484-500 ... `const sourceAt = newestMtime(path.join(ROOT, 'packages/ngx-yeti'), ['storybook-static', 'node_modules']);` ... after an edit to the shared story helpers (which this range moved into @ngx-yeti/testing), `build matches checkout` passes against a stale storybook-static build. The same gap exists in control-yeti-app's `build-fresh` (control.mjs:407-410). It scans only apps/yeti-app/src and packages/ngx-yeti, so the app's config outside src and vendor/yeti are not covered."
- Triage item 14, minor (g4 silent-failure hunter): "control-yeti-app doctor's `build` check always passes and can silently skip the hydration check ... control.mjs:463-494 ... `const build = (await page.evaluate(() => typeof globalThis.ng === 'object').catch(() => false)) ? 'development' : 'production'; check('build', 'pass', ...)`, then `check('hydration', 'skip', 'production builds log no hydration summary')`. Claimed failure: the build type comes from the page, not from `state.configuration`. If a development launch serves a page without `window.ng`, or the evaluate throws, the hydration check reads 'skip' instead of 'fail'."
- Triage item 15, minor (g4 silent-failure hunter): "both control scripts accept unknown or mistyped flags without an error ... control-yeti-app/scripts/control.mjs:41-55 and ... control-ngx-yeti-storybook/scripts/control.mjs:41-45 ... (yeti-app): `result[match[1]] = match[2] ?? true;` stores any `--name`. (storybook): `args.find((arg) => arg.startsWith('--url='))` ignores `--url <origin>` written with a space, and every other unknown flag ... In control-yeti-app, `up --config=production` silently launches a development build, and `--mode ssr` with a space launches `serve`. In control-ngx-yeti-storybook, `doctor --url http://...` silently checks the recorded instance instead of the named one."
- Triage item 16, minor, latent (g4 silent-failure hunter): "control-yeti-app `listeners()` depends on English netstat output ... control.mjs:148-168. The test copies the same parser at .claude/skills/control-yeti-app/scripts/control.test.mjs:47-62 ... `cols[3] === 'LISTENING'`. netstat translates the state column (Danish shows `LYTTER`, German `ABHÖREN`) ... `up` skips its port-in-use refusal. `down` reports `portFree: true` ... The storybook script avoids this with `Get-NetTCPConnection -State Listen`." Triage: "this machine's netstat prints English (measured 2026-10-12). Fix: Get-NetTCPConnection as the storybook script does."
- Triage item 10, minor (g4 code reviewer): "the control skills call screen-reader checks manual ... control-ngx-yeti-storybook/features/README.md:29 ... 'Manual only: Angular DevTools checks; screen-reader output (playwright-cli reads the accessibility tree, not speech); real Safari (CI's `safari` job)' ... control-yeti-app/features/README.md:41 ... 'Manual only: Angular DevTools checks, real screen readers, engines other than this machine's Chromium.' ... ngx-yeti-testing SKILL.md 'Screen readers' adds automated NVDA and VoiceOver lanes (`apps/screen-reader-e2e`) and says a flaky check is 'never skipped, deleted or turned into a manual test'."
- Triage item 17, cosmetic (g4 code reviewer): "control-yeti-app/SKILL.md:184 ... 'The Fixture app preloads every item stylesheet its e2e cases need (`app.config.ts`)'. The departures table of ngx-yeti-specs says 'The Fixture app preloads `card` and leaves `lift` out' and 'leaves `enter` out of its preload list' ... lift and enter are left out on purpose, as the 'without preload' measurement." And "control-ngx-yeti-storybook/features/stories.md:14 ... 'every id, measured in the static build of this commit: `card--default`, ... `lift--without`, `setup--shared-host`. Later items add theirs.' ... At this head the build has about 20 more items ... so the list labelled 'this commit' no longer matches the build it describes."

## Approach

- Session names: both scripts refuse (exit 2, nothing run) a state file whose recorded session does not match `^[\w-]+$`, checked once where the state is read, and pass the session to playwright-cli as an argument wherever the shim can be resolved without a shell string. Check the other recorded values that reach a command (the PID as a positive integer) in the same place.
- Daemon: remove `NX_DAEMON: 'false'` from both launch environments, and have `down` stop the Nx daemon of the checkout (`npx --no-install nx daemon --stop`) after the process tree is gone. Measure first: one full up, doctor, down cycle per flow (yeti-app `serve` and `serve-ssr`, Storybook static and dev) with the daemon on, in a linked worktree that is then cleaned up the way the pipeline cleans a sidecar (`git clean -fdx`), and record each result in the Log. If the daemon-on cycle or the cleanup fails, keep the override out of the code anyway, stop, and write `NEEDS-ORCHESTRATOR:` with the measurement; `NX_DAEMON=false` is never the fix.
- Close results: `down` reads every playwright-cli close result and reports each session's outcome in its JSON; a shim that is truly absent, a timeout, and a non-zero exit are three different outcomes, and a failed close makes `down` exit 1 with the session named, as SKILL.md's exit table says for an incomplete teardown. Do not touch the dead-root path (deferred).
- Freshness: the Storybook static check also scans `packages/ngx-yeti-testing` and `vendor/yeti` (skipping build output and `node_modules`); yeti-app's `build-fresh` scans `apps/yeti-app` outside its build output and `vendor/yeti` as well as `packages/ngx-yeti`.
- Doctor build: the configuration comes from the state file (`state.configuration`). With `--url` and no state, a failed or inconclusive page probe fails the `build` check; it never reads as production.
- Flags: each script accepts only the flags its SKILL.md names, in the `--name=value` or bare `--name` form its table shows, and exits 2 naming the flag for anything else, including a value written after a space.
- Listeners: yeti-app's `listeners()` and its test helper use `Get-NetTCPConnection -State Listen` as the Storybook script does.
- Tests: extend `.claude/skills/control-yeti-app/scripts/control.test.mjs` and add `.claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs` (Node's test runner, Windows only, like the scripts) with: a planted state file whose session is `x & echo planted` makes `down` exit 2 and run nothing (assert no file the injected command would write appears); an unknown flag and a space-separated value exit 2; and one daemon-on launch cycle per script whose `down` exits 0, frees the port, and leaves the daemon stopped. Each launch test builds, so it states that nothing else may build in the checkout while it runs, as the existing test does.
- Docs: SKILL.md of each skill states the daemon stop at `down`, the refused flags, the checked session, and the close outcomes; `.claude/skills/control-yeti-app/features/README.md` and `.claude/skills/control-ngx-yeti-storybook/features/README.md` name the automated screen-reader lanes (`apps/screen-reader-e2e`, the `nvda` and `voiceover` jobs) and CI's `safari` job instead of calling them manual, and keep only checks nothing automates (Angular DevTools); control-yeti-app SKILL.md's preload gotcha says the list leaves `lift` and `enter` out on purpose; `.claude/skills/control-ngx-yeti-storybook/features/stories.md` tells the reader to read the ids from `<url>/index.json` instead of listing a frozen set.
- The scripts launch servers on fixed ports (4000, 4200, 4310 to 4312, 4400, 4401) and build; the orchestrator runs this task's commands with no other heavy command, coder, or NVDA run.
- Skills: `.claude/skills/control-yeti-app/SKILL.md`, `.claude/skills/control-ngx-yeti-storybook/SKILL.md`, `.claude/skills/ngx-yeti-testing/SKILL.md`.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. Neither control script sets `NX_DAEMON`; each `down` stops the checkout's Nx daemon; the Log records a daemon-on up, doctor, down cycle for all four flows and a passing sidecar cleanup after them.
2. Both scripts refuse, with exit 2 and nothing run, a state file whose session does not match `^[\w-]+$`; a test plants `x & echo planted` and shows it.
3. Both scripts exit 2 on an unknown flag and on a space-separated value, with a test each.
4. Each `down` reports every playwright-cli close outcome and exits 1 when a close fails; the dead-root path is unchanged.
5. The Storybook freshness check covers `packages/ngx-yeti-testing` and `vendor/yeti`, and yeti-app's `build-fresh` covers `apps/yeti-app` and `vendor/yeti`; a test touches a file under `packages/ngx-yeti-testing` (Storybook) or `vendor/yeti` (yeti-app) after a build and sees the check fail.
6. yeti-app's doctor takes the build from the state file, and its `listeners()` and test helper use `Get-NetTCPConnection`.
7. `.claude/skills/control-yeti-app/features/README.md`, `.claude/skills/control-ngx-yeti-storybook/features/README.md`, control-yeti-app SKILL.md's preload gotcha, and `.claude/skills/control-ngx-yeti-storybook/features/stories.md` say what the repository does today, with no frozen id list.
8. `npx prettier --check --ignore-unknown .claude/skills/control-yeti-app .claude/skills/control-ngx-yeti-storybook` passes.

## Verify

```bash
npm ci && npx playwright install chromium && ! rg -q -F "NX_DAEMON" .claude/skills/control-yeti-app/scripts/control.mjs .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs && test -f .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs && node --test .claude/skills/control-yeti-app/scripts/control.test.mjs && node --test .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs && npx prettier --check --ignore-unknown .claude/skills/control-yeti-app .claude/skills/control-ngx-yeti-storybook; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-12 — created by planner (build repair #3, review round 1 fixes and security finding 1; triage items 10 to 17 for the control skills, item 12's dead-root halves excluded as deferred). Both scripts set `NX_DAEMON` and the Storybook skill has no test file at 1747fe0, so the Verify fails if this task is skipped. No pending task edits these files, so the task has no dependency. The Verify ends by stopping the Nx daemon and keeps its own exit code; run it exactly as written and never set NX_DAEMON.
- 2026-10-12 — coder (build_T047): implemented. Both scripts: `NX_DAEMON` removed from the launch env (inherited, nothing set); `down` stops the checkout's daemon (`<root>/node_modules/nx/dist/bin/nx.js daemon --stop`, the resolved nx entry rather than npx, as `up` launches Nx) after the tree is gone and reports `daemon.stopped`; `readState()` refuses with exit 2 before anything runs a state whose `session` is not `^[\w-]+$`, whose pid (and yeti-app survivor pids) is not a positive integer, or whose port is not 1-65535; playwright-cli close runs the shim's own `@playwright/cli/playwright-cli.js` under `process.execPath` with the session as an argument (no shell, no `cmd.exe /c`), and each close is reported as `closed`, `not-open`, `absent` (no shim on PATH), `timeout` (30 s) or `failed` (non-zero exit); a timeout/failed close or failed daemon stop makes `down` exit 1 naming the session and the manual close command. Dead-root paths unchanged (yeti-app closes only in the live branch; Storybook's not-running branch untouched). Flags: only `--json` and `--mode|configuration|port|url|timeout=<value>` (yeti-app; plus `--port` range and `--timeout` > 0 checks) and `--dev`, `--json`, `--url=<origin>` (Storybook); anything else, a space-separated value or a second positional exits 2 `unknown argument <arg>`. Freshness: yeti-app `build-fresh` scans `apps/yeti-app`, `packages/ngx-yeti`, `vendor/yeti`; Storybook static scans `packages/ngx-yeti`, `packages/ngx-yeti-testing`, `vendor/yeti` (both skip `node_modules`, `storybook-static`, `dist`). yeti-app doctor `build` comes from `state.configuration`; with `--url` a failed or thrown probe fails `build` and `hydration`. yeti-app `listeners()` and its test helper use `Get-NetTCPConnection -State Listen ...; exit 0` (without `exit 0` pwsh exits 1 when no listener matches; measured, the first measurement run refused `up` on that). Docs: both SKILL.md (daemon stop, refused flags, checked session, close outcomes, Storybook test line), both features/README.md (screen readers automated via `apps/screen-reader-e2e`, `nvda`/`voiceover` jobs, `safari` job; Angular DevTools the only manual check), yeti-app preload gotcha (lift and enter left out on purpose), stories.md (read ids from `<url>/index.json`). Tests: yeti-app test extended (flags, planted `x & echo planted > <file>` session with a live launch, vendor/yeti freshness, build from state, daemon gone after down); new Storybook test (flags, static launch, ngx-yeti-testing freshness, planted session, down outcome/port/daemon). No ledger row needed (no a11y/standards/parity change).
- 2026-10-12 — coder (build_T047): daemon-on measurement, worktree T047, env NX_DAEMON unset, each cycle in its own heavy-lock hold, daemon process counted by command line `<root>\node_modules\nx\dist\src\daemon\server\start.js`. yeti-app serve:development (port 4736): up 0 (ready 27 s), daemon 1 running, doctor 0 (7/7 pass, hydration summary 0 skipped), down 0 (sessions not-open x2, daemon.stopped true, port free), daemon 0. yeti-app serve-ssr:development: up 0 (10 s), daemon 1, doctor 0 (7/7, build-fresh pass), down 0, daemon 0. Storybook static (4493): up 0 (29.8 s), daemon 1, doctor 0 (6/6), down 0 (not-open, daemon stopped), daemon 0. Storybook dev (4492): up 0 (16.1 s), daemon 1, doctor 0 (6/6), down 0, daemon 0. The daemon starts as a child of the launched nx process, so `down`'s taskkill /T already removes it and `nx daemon --stop` confirms. Sidecar cleanup: `git clean -fdx` itself is refused in this session by the gsd-path guard hook ("git clean -f deletes untracked evidence and retained task worktrees"), so I did not run it; instead, after the four cycles, each path `git clean -ndx` lists (.angular, .nx, dist, node_modules, packages/ngx-yeti/node_modules, packages/ngx-yeti/storybook-static, tmp, vendor/yeti/dist, vendor/yeti/node_modules) was renamed away and back with no error (Windows refuses that while a handle is held): 9/9 OK, no process from the worktree left besides shells. The orchestrator's real sidecar `git clean -fdx` is the remaining proof.
- 2026-10-12 — coder (build_T047): Verify run exactly as written through the heavy lock: exit 0. npm ci ok; playwright chromium ok; no `NX_DAEMON` in either script; yeti-app test 9/9 pass (193.8 s); Storybook test 6/6 pass (112.1 s); prettier check clean; final `nx daemon --stop` printed "Daemon Server - Stopped". Afterwards: no daemon, no server, no state file, no playwright-cli session opened by this run.
- 2026-10-12 — orchestrator Verify (isolate gsd-path-task/T047): pass, exit 0; output tail:
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
