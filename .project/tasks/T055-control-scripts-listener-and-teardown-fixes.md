---
id: T055
title: Make both control scripts fail loudly on a failed listener query, prove the session close, and close sessions on a dead recorded PID
wave: 9
deps: [T053]
status: pending
agent: null
base: null
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
