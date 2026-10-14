---
id: T055
title: Make both control scripts fail loudly on a failed listener query, prove the session close, and close sessions on a dead recorded PID
wave: 9
deps: [T053]
status: done
agent: build_T055
base: ccce8ddd273a6b29f2a709850b0d3ad94f0ffd69
worktree: null
task_branch: null
files:
  - .claude/skills/control-yeti-app/scripts/control.mjs
  - .claude/skills/control-yeti-app/scripts/control.test.mjs
  - .claude/skills/control-yeti-app/SKILL.md
  - .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs
  - .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs
  - .claude/skills/control-ngx-yeti-storybook/SKILL.md
---

# T055 — Make both control scripts fail loudly on a failed listener query, prove the session close, and close sessions on a dead recorded PID

## Context

Fifth build repair (2026-10-13): survivors of review round 2 of M002 (range 4504b4c..7793730, which the history rewrite of 2026-10-13 maps to 0172a0a..fb1a8c6 with the same contents for these files; line numbers at 7793730; triaged by Claude on 2026-10-13 in the git-ignored local record tmp/afk-m002/lars-review/r2/triage.md, items 4, 5, and 6, from the source report g4-silent-failure.md beside it). Every finding is inlined; the lines have moved since (T052 and T053 landed after the review), so find each site by its quoted code. T053 types all six files first, and this task keeps the scripts typed. Out of scope, by Lars's deferral (known-items of the round): "The yeti-app and Storybook `down` dead-root lockout stays deferred by Lars" (survivors still holding the port after the tree is killed); item 6 below is about the session and daemon steps, not that lockout.

Triage item 4 (minor): "control-yeti-app `listeners` (control.mjs:163-180) reads a failed Get-NetTCPConnection as no listener, so `down` reports a busy port free; both control tests' `listening()` share the shape (g4-silent-failure F2, measured by the reviewer). Fix: -ErrorAction Stop with try/catch, empty only for ObjectNotFound, else exit 1." Source evidence, verbatim: "the command is `Get-NetTCPConnection ... -ErrorAction SilentlyContinue | ...; exit 0`. `SilentlyContinue` is there for the normal no-match error. It also hides every other cmdlet error, and `exit 0` makes the `run.status !== 0` guard (:175) fire only when pwsh itself cannot start. Measured on this machine: an out-of-range port and a misspelled cmdlet name each print an error and exit 0 with empty stdout, which the script parses as `[]`. Failure: if the CIM/NetTCPIP query fails (WMI repository trouble, a missing module, access denied), `down` sees `portFree: true`. It deletes the state file and exits 0 even when a process outside the killed tree still holds the port, which is the case `portFree` exists to catch. `up`'s pre-check also passes a busy port. In the tests, the final `assert.equal(listening(launch.port), false)` passes when the query fails. ... In control-ngx-yeti-storybook, `listeningPids` (:281-308) catches everything and returns `[]`, but its callers stay loud: `up` gates on `portAnswers` and `doctor` fails 'port owned by run'. So only its test helper is affected there. Fix direction: run the query with `-ErrorAction Stop` inside `try/catch`. Return empty only for the no-match error (`$_.CategoryInfo.Category -eq 'ObjectNotFound'`), write anything else to stderr, and `exit 1`. Point the two test helpers at the same code."

Triage item 5 (minor): "Both control `down`s exit 0 when playwright-cli is `absent`, and no test proves `closed` (g4-silent-failure F3). Fix: tests open a session before `down` and assert `closed`; `absent` with a listed open session is incomplete." Source evidence, verbatim: "`playwrightCli()` looks for `<PATH dir>/node_modules/@playwright/cli/playwright-cli.js`, which is npm's Windows global layout. Any other layout returns `absent` ('no playwright-cli on PATH'), and only `timeout` and `failed` make `down` exit 1. Examples are a Volta or pnpm global, a scoop shim, or a playwright-cli reached through `npx`, where the shim is on PATH but its package is not next to it. Both tests accept `absent` as a pass, and neither test opens a session, so neither ever proves a `closed` outcome. The planted-session test is refused at `readState` and never reaches `closeSession`. Failure: on a machine where the lookup misses, `down` reports success and leaves the run's browser sessions open, noted only in the JSON `outcome`. If `playwrightCli()` broke outright, every test would still pass. The lookup does resolve on this machine (the user's npm global bin holds node_modules/@playwright/cli/playwright-cli.js), so this is a gap in coverage and a silent path, not a failure observed today. Fix direction: in the yeti-app test, open the session with playwright-cli before `down` and assert `outcome === 'closed'`. Do the same in the Storybook test. Then either treat `absent` as incomplete when the run's session is listed as open, or make the skill text say plainly that `absent` means the sessions were not closed." The triage chose both: the tests assert `closed`, and `absent` while the run's session is listed as open is an incomplete teardown.

Triage item 6 (minor): "Both control `down`s skip the session close (and Storybook the daemon stop) when the recorded PID is dead (g4-silent-failure F4). Fix: close sessions and stop the daemon on that path too." Source evidence, verbatim: "control-ngx-yeti-storybook/scripts/control.mjs:675-681; control-yeti-app/scripts/control.mjs:661 and the `else` branch after :680 (`sessions` stays `[]`). ... this range added the session close to the live-PID branch only, and in Storybook it also added `stopDaemon()` there. When the recorded PID is gone, Storybook removes the state file and exits 0 with 'pid ... is not running'. yeti-app still stops the daemon, but it closes no session. Failure: say the server dies on its own and Lars runs `down` to clean up. The playwright-cli sessions stay open (`<session>` and `<session>-jsoff` for yeti-app) and so does the Nx daemon (Storybook), and the result says teardown is done. ... Fix direction: run `closeSession` (and `stopDaemon` in Storybook) on the dead-PID path too, and report them in the result in the same way."

## Approach

- Listener query: yeti-app's `listeners()` and both test helpers `listening()` run `Get-NetTCPConnection` with `-ErrorAction Stop` inside `try`/`catch`, return no listener only for the `ObjectNotFound` category, and otherwise write the error to stderr and exit 1; the script turns that into a failed `up` pre-check or an incomplete `down` (exit 1, named), never `portFree: true`. Storybook's `listeningPids` may share the same query; its callers already fail loudly, so changing it is the coder's call. Show the failure path once (for example by running the query text with a misspelled property or an out-of-range port) and record it in the Log.
- Session close: each suite opens the run's playwright-cli session (and yeti-app's `-jsoff` session where the flow opens it) before `down` and asserts the outcome `closed`; neither accepts `absent` any more. `down` reports `absent` while the run's session is listed as open as an incomplete teardown (exit 1, session named), and each SKILL.md's exit and outcome table says what `absent` means.
- Dead recorded PID: `down` closes the run's sessions in both scripts, and Storybook's also stops the daemon, on the dead-PID path too, reported in the result as on the live path. A test covers the dead-PID path: start a run, kill its recorded process tree outside the script, then `down`, and assert the sessions closed and (Storybook) the daemon stopped. Do not change the dead-root lockout (deferred).
- Keep every other outcome and exit code the SKILL.md tables already state; the planted-session refusal, flag refusal, and daemon-on cycles of T047 stay.
- The suites build and launch on fixed ports (4000, 4200, 4310 to 4312, 4400, 4401); the orchestrator runs this task with no other heavy command, coder, or NVDA run. Never set `NX_DAEMON`.
- Skills: `.claude/skills/control-yeti-app/SKILL.md`, `.claude/skills/control-ngx-yeti-storybook/SKILL.md`; AGENTS.md "Scripts" and "Evidence and honesty" ("Silent partial success is the worst outcome").

## Interface contract

- The committed scripts are typed (T053): `tsconfig.scripts.json` at the repository root type-checks every committed `.mjs`, `.cjs`, and `.js` file outside `vendor/` and `docs/specs/`, each starting with `// @ts-check` (after a shebang, if any) and typed with JSDoc. `npm exec nx -- run @ngx-yeti/source:typecheck` runs `tsc -p tsconfig.scripts.json && node --test tools/typecheck/scripts-coverage.test.mjs` and exits 0. A task that edits one of these scripts keeps its `// @ts-check` line and its JSDoc types, adds no `any` and no unchecked assertion, and leaves that command at 0 errors.

## Intent coverage

- None

## Acceptance criteria

1. yeti-app's listener query and both test helpers use `-ErrorAction Stop`, treat only `ObjectNotFound` as no listener, and fail otherwise; the Log shows a failed query making the command fail.
2. Each suite opens a session before `down` and asserts the outcome `closed`; neither suite accepts `absent`.
3. `down` with `absent` while the run's session is listed as open exits 1 and names the session; both SKILL.md files say what `absent` means.
4. On a dead recorded PID, both `down`s close the run's sessions, Storybook's also stops the daemon, and a test in each suite shows it.
5. Both suites pass, `npm exec nx -- run @ngx-yeti/source:typecheck` exits 0, and `npx prettier --check --ignore-unknown` passes on both skill folders.

## Verify

```bash
npm ci && npx playwright install chromium && ! rg -q -F -e "SilentlyContinue" .claude/skills/control-yeti-app/scripts/control.mjs .claude/skills/control-yeti-app/scripts/control.test.mjs .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs && ! rg -q -F -e "'not-open', 'absent'" .claude/skills/control-yeti-app/scripts/control.test.mjs .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs && npm exec nx -- run @ngx-yeti/source:typecheck --skip-nx-cache && node --test .claude/skills/control-yeti-app/scripts/control.test.mjs && node --test .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs && npx prettier --check --ignore-unknown .claude/skills/control-yeti-app .claude/skills/control-ngx-yeti-storybook; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-13 — created by planner (build repair 5), from review round 2 triage items 4, 5, and 6 (tmp/afk-m002/lars-review/r2/triage.md).
- 2026-10-14 — build_T055 implementation: (1) control-yeti-app `queryListeners`/`listeners` and both test helpers `listening()` run `Get-NetTCPConnection ... -ErrorAction Stop` in try/catch; only `ObjectNotFound` whose `CategoryInfo.Activity` is `Get-NetTCPConnection` reads as no listener, everything else writes stderr and exits 1. The activity check is needed because a misspelled cmdlet is also `ObjectNotFound` (measured: no match -> `CmdletizationQuery_NotFound,Get-NetTCPConnection | Get-NetTCPConnection | ObjectNotFound`; port 70000 -> `ParameterArgumentTransformationError | InvalidData`; `Get-NetTCPConnectionX` -> `CommandNotFoundException | (empty activity) | ObjectNotFound`). `up`/`doctor` exit 2 with the error; `down` keeps `portFree: false`, adds `listenerError`, keeps the state file and exits 1. Failure path measured on a scratch copy with the cmdlet misspelled (tmp/, removed after): `up --port=4999` -> exit 2 "listener query on 4999 failed: The term 'Get-NetTCPConnectionX' is not recognized ..."; `down` on a planted dead-PID state -> exit 1 "teardown incomplete; listener query on 4999 failed: ...", portFree false. Storybook's `listeningPids` left unchanged (its callers already fail loudly; the coder's call per Approach). (2) Both `closeSession`s are async; on `absent` they read playwright-cli's own session registry (`<cache>/ms-playwright/daemon/*/<session>.session`, socket answers = open, the same check `playwright-cli list` makes) and report `listedOpen`; `absent` with `listedOpen: true` is an incomplete teardown (exit 1 naming the session and its close command). (3) yeti-app `down` closes `<session>` and `<session>-jsoff` before branching on live/dead PID (the mismatch refusal still runs first). Storybook's dead-PID path now goes through a shared `endTeardown` (session close, state removal, daemon stop, same report and exit rules). Tests: both suites open the run's session(s) with playwright-cli before `down` and assert `closed` (yeti-app both `closed`); new tests cover `absent` + listed open (PATH stripped of playwright-cli dirs; exit 1) and a second launch whose tree is killed with taskkill outside the script (`down` exit 0, sessions `closed`, daemon stopped). Both SKILL.md files say what `absent` means and describe the dead-PID path and the new exit-1 cases. The dead-root lockout is not touched.
- 2026-10-14 — build_T055 Verify (as written, through the heavy lock): run 1 exit 1. Typecheck passed and yeti-app passed 11/11; the Storybook suite went 6/8, with the live-path `down` exiting 1 "teardown incomplete", `remaining: [48028, 15872]`, `portBusy: false`, `sessionClose.outcome: closed`, two tree PIDs still listed 15 s after `taskkill /T /F`. This path is unchanged apart from awaiting the session close. The Storybook suite then passed 8/8 standalone (it was 8/8 in an earlier standalone run too). Run 2 exit 0: rg guards pass, `@ngx-yeti/source:typecheck --skip-nx-cache` passes (0 TS errors), yeti-app suite 11/11, Storybook suite 8/8, prettier check passes on both skill folders. Rule 13: `npx prettier --check .` passes; `nx affected -t lint typecheck test test-storybook --base=HEAD` affects only @ngx-yeti/source, typecheck and test pass, and it has no lint or test-storybook target. Watch item for the orchestrator: the 15 s tree-gone wait in Storybook's live `down` flaked once in 3 suite runs (it tracks PIDs without start times).
- 2026-10-14 — orchestrator Verify (isolate gsd-path-task/T055): pass, exit 0; output tail:
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
