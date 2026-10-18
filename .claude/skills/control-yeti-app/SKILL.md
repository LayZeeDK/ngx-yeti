---
name: control-yeti-app
description: Drive, screenshot, reproduce or verify in the browser the ngx-yeti Fixture app (yeti-app) - its prerendered /sub/<item> and server-rendered /sub/server/<item> routes, with JavaScript off, with main.js held back before hydration, and in development or production builds - and capture item links, hydration diagnostics and screenshots. Launches one isolated instance per checkout or worktree through the Nx serve or serve-ssr target, health-checks it, and drives it through playwright-cli.
---

# control-yeti-app

Launches the Fixture app `apps/yeti-app` (project `yeti-app`) once per checkout, checks it is worth driving, and
drives its item routes through playwright-cli. Use it to walk a Fixture route by hand, reproduce a layer-4 case, or
capture evidence for a review. Skip it for repeatable assertions: those belong in `apps/yeti-app-e2e`
(`npm exec nx -- e2e yeti-app-e2e`), which starts its own servers on 4310 to 4312.

Every claim below is marked **measured** (run during the proof on 2026-10-10, Windows 11 ARM64, Angular 22.2.1,
Nx 23.2.1, playwright-cli 0.1.21) or **inferred** (read from source, not run).

## Pick a flow

- **Main checkout** (`.git` is a directory) or **worktree** (`.git` is a file): both use the same profile, a
  fresh playwright-cli in-memory browser per session.
- One instance per checkout. The flow id is `main` or `wt-<8 hex>`; the playwright-cli session is
  `control-yeti-app-<flow id>`, and the JavaScript-off session is `<session>-jsoff`. `info` prints all three.

Each mode opens one port:

| Port  | Kind    | Default | How it moves                                                                                                                                     |
| ----- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| serve | derived | 4200    | `--port=<port>`, the `serve` target's dev-server option (measured: listened on 4470 with `up --port=4470`, 2026-10-17)                           |
| ssr   | derived | 4000    | the `PORT` environment variable, read by `apps/yeti-app/src/server.ts` (measured: listened on 4472 with `up --mode=ssr --port=4472`, 2026-10-17) |

The script numbers slots: the main checkout takes slot 0, the defaults above; a worktree takes slot 1 to 99 from a
hash of its path, so its usual port stays the same from run to run, and slot `s` gives serve `4620 + s - 1` and ssr
`4720 + s - 1`, above control-ngx-yeti-storybook's 4420-4617, so the two skills never derive the same port. `up`
checks the mode's port before launching; when it is busy, or another process takes it before the server answers,
`up` stops what it started and moves to the next slot (wrapping within 1 to 99 from a worktree, never onto slot 0),
at most 10 slots, and `info.ports[].reason` says `fell back from <port>: held by PID <pid>`, naming the process that
held it before the launch or took it after the check. Ten busy slots exit 2 naming each port and its holder. `up --port=<n>` sets the port
with no fallback: a busy `n` exits 2 naming its holder, and from a worktree 4000 and 4200 are refused.

## Launch

```bash
node .claude/skills/control-yeti-app/scripts/control.mjs up --json
node .claude/skills/control-yeti-app/scripts/control.mjs up --mode=ssr --configuration=production --json
```

Run from the checkout root. Underneath:

| Mode and configuration                                            | What runs                                                                                                                         | Build it serves |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `--mode=serve` (default), `--configuration=development` (default) | `nx run yeti-app:serve:development --port=<port>` (Vite dev server, HMR on)                                                       | development     |
| `--mode=serve --configuration=production`                         | `nx run yeti-app:serve:production --port=<port>`                                                                                  | production      |
| `--mode=ssr --configuration=development`                          | `nx run yeti-app:serve-ssr:development` with `PORT=<port>`: `build:development`, then `node dist/apps/yeti-app/server/server.mjs` | development     |
| `--mode=ssr --configuration=production`                           | `nx run yeti-app:serve-ssr:production` with `PORT=<port>`: `build:production`, then the same server                               | production      |

All four rows ran on 2026-10-15, each twice (measured).

The script starts Nx as `<this node> node_modules/nx/dist/bin/nx.js`, the way
`tools/playwright/browser-projects.mjs` starts the e2e servers. The Nx daemon stays running: the script inherits the
caller's environment, sets nothing about the daemon and never stops it, since other Nx work in the checkout needs it;
only removing a worktree the work created stops that worktree's daemon (`nx daemon --stop`, run from it). Right
after the spawn `up` records the process tree through `scripts/proctree.mjs` (the spawned PID with its start time
and command line, and every descendant), refreshes it on every poll and once ready, and keeps it in `state.json` as
`tree`, root first. Readiness: `GET <url>card` answers 200 and contains `Welcome yeti-app` (the `h1` of
`apps/yeti-app/src/app/app.html`), and every listener on the port is a live process of the recorded tree (a foreign listener beside the server, on
another address of the same port, counts as the port taken). Time to ready: 16 to 22 s for `serve` development, 13 to 16 s for
`serve` production (measured); `ssr` runs `yeti-css:yeti-build` and `yeti-app:build:<configuration>` first: 5 to 10 s
for either SSR configuration when both came from the local Nx cache (measured); an uncached build takes longer (not
measured). `--timeout=<seconds>`
(default 900) bounds the wait; when it runs out, `up` stops the launch, removes the state file and exits 1. The server log goes to `<evidenceDir>/server.log`.

When `up` gives up (the launch exited, the timeout ran out, or another process holds the port), it stops the recorded
tree through `stop`, never the launched PID by itself, so a PID Windows has handed to another process is left alone.
A process the launch started after the last poll, just before its parent exited, is in no record. `up` notes when it
first sees each recorded process gone, and names a live process in `survivors` and the error, by PID, image name and start time only (no record proves it
is the run's own), when its parent is a recorded process that is gone and it started while that parent ran (no earlier than the
parent and no later than the moment `up` first saw the parent gone); it leaves it running. When the started PID never
appeared in the process table, the launch counts as such a parent from the spawn time on. When a recorded process also
outlasts `stop`, the kept `state.json` lists the named processes in `unrecorded`, and `down` names them again, the
same way, in `notes` and `unrecorded` while they still run, without stopping them. `launchStopped` is `true` only when every
recorded process is stopped or gone and no such process is found. The limit: Windows keeps only a process's parent PID,
so a process is found only when a recorded or found process is its parent. A process whose parent and grandparent both
exited between two polls is not found, and `launchStopped` can then be `true` while it runs.

The base URL is `http://localhost:<port>/sub/` (`<base href="/sub/">`). Use `localhost`: the build's
`security.allowedHosts` is `["localhost"]`, and the dev server listens on `::1` only (measured).

## Doctor

```bash
node .claude/skills/control-yeti-app/scripts/control.mjs doctor --json
node .claude/skills/control-yeti-app/scripts/control.mjs doctor --url=http://localhost:4310/sub/ --json
```

Read-only, apart from refreshing the recorded `tree` in `state.json` (a new descendant is added; a record is never
dropped). Opens `<url>card` in the repository's Playwright Chromium (`npx playwright install chromium` once) and
reports one line per check:

| Check                 | Passes when                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `process-alive`       | the recorded root runs with its recorded start time and command line                                                                                                                                                                                                                                                                                                                                             |
| `ports`               | every port of `ports` listens and every listener on it is a live process of the recorded tree: `[OK] ports: serve 4200 (derived)` (the fallback reason follows the kind when there is one), `[ERROR] ports: serve 4200 not listening` or `serve 4200 held by PID 9120, not the recorded tree`; `[SKIP] ports: --url given; ownership not checked` with `--url`                                                   |
| `build-log` (`serve`) | `server.log` has no `[ERROR]` or `Error:` line                                                                                                                                                                                                                                                                                                                                                                   |
| `build-fresh` (`ssr`) | `server.log` shows `nx run yeti-app:build:<configuration>` (built or restored from the Nx cache at launch) and no file Git lists under `apps/yeti-app`, `packages/ngx-yeti` or `vendor/yeti` (`git ls-files -co --exclude-standard`: tracked and untracked, ignored output skipped) changed after the recorded start time; the detail names the newest file, and a failed `git` fails the check with its message |
| `page-marker`         | `<url>card` answers 200 and `app-root h1` reads `Welcome yeti-app`                                                                                                                                                                                                                                                                                                                                               |
| `build`               | probed on every run: `development` when `window.ng` exists, `production` when it does not; fails when the page did not load or the probe threw, and, from a state file, when the probe disagrees with the recorded `configuration`                                                                                                                                                                               |
| `hydration`           | development: Angular logs `Angular hydrated ... 0 component(s) were skipped.` and no `NG05xx` message; production: skipped (no summary is logged); unknown build: fails                                                                                                                                                                                                                                          |
| `console-errors`      | no `console.error` and no page error on first load                                                                                                                                                                                                                                                                                                                                                               |
| `map-fresh`           | never fails: `pass` (`[OK]`) when every feature of `features/` is fresh in `features/.proven.json`, `warn` (`[WARN]`) naming the stale ones (with how many files changed) and the unproven ones; from `mapFresh` in `scripts/fingerprint.mjs`, which reads this skill's folder from the script's own location, never the working directory                                                                       |

With `--url`, `process-alive` and `ports` report `skip`; the page checks and `map-fresh` still run. Exit 0
healthy, 1 not healthy (`failed` names the checks; `map-fresh` is never among them, so it never changes the exit code), 2 could not run (no state and no `--url`, Chromium missing, a worktree state
on a main-checkout port, an error the script does not handle). The JSON holds `url`, `build` (the probed build, or
the recorded one when the probe failed), `failed` and `checks`.

## Drive

Driver: the global playwright-cli (0.1.21 measured), always with the run's session and from the checkout root:

```bash
playwright-cli -s=control-yeti-app-<flow id> open http://localhost:<port>/sub/card
playwright-cli -s=control-yeti-app-<flow id> snapshot --filename=tmp/control-yeti-app/<run-id>/card.yml
```

- Selectors, in order: roles and accessible names from a snapshot (`getByRole('link', { name: 'Weekend in the
hills' })`), then the package's own attributes (`data-ngx-yeti-item-<item>`, `data-ngx-yeti-styles`), then CSS.
  Take handles from a snapshot, not from the fixture templates: directives write classes and `data-*` at runtime.
- Loop: snapshot, one action, fresh snapshot, check the expected change.
- Waits: inside `run-code`, poll an end state (`page.waitForFunction(() => !document.querySelector('[jsaction]'))`
  for hydration done, `locator.waitFor()`); never a fixed sleep.
- `run-code` runs in a sandbox without `URL` (measured: `ReferenceError: URL is not defined`); build URLs with
  string operations such as `page.url().replace(/[^/]*$/, 'card')`. Relative paths in `page.screenshot({ path })`
  resolve against the checkout root (measured).

Recipes: [features/README.md](features/README.md).

## Inspect

- Console: `playwright-cli -s=<session> console` prints the page's messages under `### Result` (measured
  2026-10-16); each navigation's output names a `.playwright-cli/console-*.log` under `### Events`. The development
  build logs `Angular is running in development mode.` and the hydration summary (measured).
- Network: `playwright-cli -s=<session> requests`.
- Item links: `head link[data-ngx-yeti-styles]`, in Yeti's rank order (measured on `/sub/card` on 2026-10-15:
  `grid`, `button`, `card`, `spinner`, `lift`).
- `window.ng` exists in development builds only (measured: present on `serve` development). No `window.ng` call is
  used in a recipe yet; probe `playwright-cli -s=<session> eval "() => Object.keys(window.ng ?? {})"` before adding
  one.
- Not reachable: Angular DevTools (browser extension, manual only). The Angular CLI MCP server finds no
  `angular.json` in this Nx workspace. Pangular Inspector is not installed and is never added to the Fixture app.

## Evidence

Evidence goes to `tmp/control-yeti-app/<run-id>/` (git-ignored through `tmp`); `up` creates it and `info` prints it
as `evidenceDir`. playwright-cli's default snapshots and console logs go to `.playwright-cli/` (git-ignored).
Each proof captures a snapshot before and after its action, a screenshot showing the `Welcome yeti-app` heading,
and the side effect it claims (item links, `jsaction` count, the console summary). `down` keeps the directory.

## Cleanup

```bash
node .claude/skills/control-yeti-app/scripts/control.mjs down --json
```

Closes the run's playwright-cli sessions (`-s=<session> close` and `-s=<session>-jsoff close`), takes a last snapshot
of the tree below the recorded root while it still runs, and stops every recorded process through `stop` of
`scripts/proctree.mjs`: by PID, children first, each only while its PID still has its recorded start time and command
line, so a child whose parent already exited (an orphaned grandchild) is stopped too. A process that started before
the recorded root is never part of the tree, even when it names the root's PID as its parent (Windows hands a freed
PID out again), and a `tree` record in `state.json` older than the root is left out and never stopped. It then waits
until the port is free, removes `state.json`, and keeps the evidence directory. It leaves the Nx daemon running.

Refusals and exits, from "Process trees" of the create skill's `references/generated-skill.md`:

- A live process on the recorded root PID whose start time or command line differs from `state.json`: the root is
  refused as `reused` and left running, both sessions are still closed and every other record that still matches is
  still stopped; exit 2, `does not match the recorded start time or command line; refusing to stop it, and stopped
the other recorded processes that still match`, `state.json` kept. `recorded` names the root with its escaped recorded command line; `live` names the process now on that PID only by PID, image name (the program file of its command line) and start time (`PID <p> (<image>, started <ISO time>)`), never its arguments, which can hold secrets.
- A recorded root that is no longer running (the server died on its own) is not a refusal: `down` closes both
  sessions, stops the recorded descendants that still match, and exits 0 with `recordedPidRunning: false` and the
  warning `pid <pid> was not running` (a `[WARN]` line without `--json`).
- A record still running after `stop`'s last round (`refused` with reason `survived`): exit 2 naming it,
  `state.json` kept with the refreshed `tree`; run `down` again.
- A process in `unrecorded` (one a failed `up` named and left running) that still runs: listed in `notes` and
  `unrecorded`, never stopped, and the exit code stays as it is.
- A descendant refused as `reused` (its PID now belongs to another process) or `helper` (a shared helper such as the
  Nx daemon, which the tree never holds): listed in `notes` and `refused`, never stopped, and the exit code stays as
  it is.

It runs playwright-cli's own script (`<shim dir>/node_modules/@playwright/cli/playwright-cli.js`) under this Node,
with the session as an argument, so the name never reaches a shell. `sessions` reports each close with one outcome:

| Outcome     | Means                                                                                                                                                                                                                                       | `down` exit |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `closed`    | playwright-cli closed the session                                                                                                                                                                                                           | 0           |
| `not-open`  | playwright-cli answered that the session was not open                                                                                                                                                                                       | 0           |
| `absent`    | no playwright-cli on `PATH`, and the session registry lists no open session of that name                                                                                                                                                    | 0           |
| `left-open` | no playwright-cli on `PATH`, and the registry lists the session as open, holds a `<session>.session` entry that could not be read or parsed or that has no string `socketPath`, or its folder could not be listed (`detail` names the path) | 1           |
| `timeout`   | playwright-cli gave no answer in 30 s                                                                                                                                                                                                       | 1           |
| `failed`    | playwright-cli exited non-zero (`detail` holds its output)                                                                                                                                                                                  | 1           |

No playwright-cli on `PATH` means the lookup found no `node_modules/@playwright/cli/playwright-cli.js` beside a
`PATH` directory (npm's Windows global layout; a Volta, pnpm or scoop install, or `npx`, misses it), so `down`
closed nothing. `down` then reads playwright-cli's session registry
(`%LOCALAPPDATA%\ms-playwright\daemon\*\<session>.session`, whose socket answers while the session is open). An
entry that cannot be read or parsed, or that has no string `socketPath` (a format the script does not know), counts
as possibly open; `down` still stops the tree and prints its result. A `left-open`, `timeout` or `failed` close makes `down` exit 1 with
`teardown incomplete` naming the session and the command that closes it. It never runs `close-all` or `kill-all`:
those reach every playwright-cli session on the machine, including other agents'.

The wait polls up to 20 times, 500 ms apart. A failed listener query, a `pwsh` that does not start or one that gives
no answer in 30 s included, counts as a busy port and ends the wait at once: `portFree` stays `false`,
`listenerError` names the query's error (`gave no answer in 30000 ms` for a timeout), and `down` exits 1, so a hung
`pwsh` holds `down` for one 30 s query, not one per attempt.

When the port still listens after the wait, its holder is outside the recorded tree: `down` removes `state.json`
(every recorded process is stopped or gone, so another `down` could do no more) and exits 1 with an error that starts
`teardown incomplete`, names each listener by PID, image name and start time (never its arguments) and says it is not the recorded tree and may
be another session's instance or the user's own (`port <port> still held by PID <p> (<image>, started <ISO time>), not the
recorded tree; it may be another session's instance or the user's own, so down left it running`), or `not confirmed
free` with the query's error. It never offers a process outside the tree for stopping. Another `down` then exits 2
(no state file), and `up` moves past that port to the next slot, or with `--port` exits 2 naming its holder. `up`
refuses while the file exists.

## Helpers

`node .claude/skills/control-yeti-app/scripts/control.mjs <command> [flags]`

| Command  | Does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Exit codes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `up`     | refuses when a state file exists, when `--port` names a main-checkout port in a worktree, or when `--port` is busy (names the holder's PID); picks the slot and port ("Pick a flow"); starts the target; waits until the process table lists the started PID with its start time and command line (up to 5 s) and records its tree; writes `tmp/control-yeti-app/state.json`; writes `<evidenceDir>/js-off.json`; polls readiness, moving to the next slot when another process took the port or listens beside the server | 0 ready; 1 not ready: the started PID never appeared in the process table, the launch exited, the port answered from a PID outside the started tree with `--port`, or `--timeout` ran out; on each, `up` stops the recorded tree (`launchStopped`, `stopped`, `gone`, `refused`) and removes the state file, so nothing is left for `down`, unless a recorded process still runs after `stop`'s last round: then it keeps the state file and says `run down` (also when another process took the port); a process `up` never recorded, whose recorded parent exited, is named in `survivors` and left running, with `launchStopped: false` (also when another process took the port, instead of moving on, and with a kept state file in `unrecorded`; see Launch for what is never found); 2 refused, `--port` busy, ten busy slots, or a listener query that failed after the launch (the error names the launched PID, says the state file is kept and to run `down`) |
| `doctor` | the checks above, and refreshes `tree`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 0 healthy, 1 not healthy, 2 could not run                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `info`   | prints the state and where it lives                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 0, 2 no or invalid state file                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `down`   | closes the sessions; refuses a root whose start time or command line do not match the state file while still stopping the other recorded processes that match; stops the recorded tree through `proctree.mjs`, a dead root's orphaned descendants included; waits for the port; removes the state file                                                                                                                                                                                                                     | 0 stopped (on a dead root with a `[WARN]`); 1 the port still held by a process outside the tree or the listener query failed (state removed), or a session close `left-open`, `timeout` or `failed`; 2 refused (a mismatched root, left running while the matching records are stopped; an invalid state file), a record that survived (state kept), or no state file                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

Output: with `--json`, one JSON object on stdout; otherwise (every control, format and bidi character escaped as
`\uXXXX` by `printable` of `scripts/fingerprint.mjs`, so a recorded command line is never printed raw) one `[OK]`,
`[ERROR]`, `[SKIP]` or `[WARN]` line per doctor check,
one `[WARN]` line per warning, and a closing line tagged `[OK]` (exit 0), `[WARN]` (exit 1) or `[ERROR]` (exit 2).
Every object holds `command` and `exit`, and `error` when the command failed. Besides those:

- `up`: the state below, plus `readySeconds` on exit 0, or `launchStopped`, `stopped`, `gone` and `refused` on exit 1, and `survivors` (PIDs) when a process it never
  recorded still runs.
- `down`: also `unrecorded` (PIDs) when the state file names processes a failed `up` left running and they still run.
- `info`: the state `up` wrote (`flow`, `worktree`, `mode`, `configuration`, `pid`, `start` (the root's start, ISO),
  `commandLine`, `port`, `slot`, `ports` (`[{ name, port, kind, reason? }]`, one entry for the mode's row), `url`,
  `session`, `sessions` (`<session>` and `<session>-jsoff`), `evidenceDir`, `logFile`, `tree` (`[{ pid, ppid, start,
commandLine }]`, root first, `start` in milliseconds since the epoch)), plus `stateFile`.
- `doctor`: `url`, `build`, `failed`, `checks` (each `name`, `status` (`pass`, `fail`, `skip`, or `warn` for `map-fresh`), `detail`).
- `down`: `pid`, `recordedPidRunning`, `stopped` (recorded PIDs it stopped), `gone` (recorded PIDs already exited),
  `refused` (`pid`, `reason`, `process`: the escaped line `describe` gives), `notes`, `port`, `portFree`,
  `listenerError` (when the query failed), `session`, `sessions` (one close outcome each), `evidenceDir`,
  `evidenceKept`, `warnings` (dead root, exit 0); on the exit-2 survived or reused path `stopped`, `gone`, `refused`,
  `notes`, `sessions` and `stateFile`.

Flags: `--mode=serve|ssr`, `--configuration=development|production`, `--port=<n>` and `--timeout=<seconds>` for
`up`; `--url=<base url>` for `doctor`; `--json` for every command. `info` and `down` take only `--json`. A flag the
command does not take exits 2 with `flag --<name> does not apply to <command>`. Any other flag, a value written after
a space (`--mode ssr`) and a bare value flag exit 2 with `unknown argument <arg>`, both before anything runs. A
command other than the four, a name every object has such as `toString` included, exits 2 with the usage line. An
error the script does not handle (a missing log file, a module that will not load) exits 2 with one JSON object whose
`error` starts `could not run:`; after a launch it adds the launched PID and says to run `down` (or to stop it
yourself when no state file was written). Every command refuses (exit 2, nothing run) a state file that cannot be read or is
not JSON (a truncated write, for example: `could not be read as JSON`), that is not an object, whose `session` is not
`[\w-]` only, whose `pid` is not a positive integer, whose `tree` is not a list of process records rooted at that
`pid`, whose `unrecorded` is not a list of process records, whose `port` is not 1 to 65535 or whose `ports` is not a list of port entries, or whose `url`, `logFile` or
`evidenceDir` is not a string. A state file written by a control.mjs before process trees (a `pid` and `port` but no
`tree`) exits 2 with `was written by a control.mjs without a process tree (pid <p>, port <n>); check that pid <p> is
this checkout's server, stop it by hand, then delete <file>`: no tree is ever guessed. `up`, `doctor`'s tree refresh, and a `down` that keeps the file write `state.json` to
a temporary file in the same folder and rename it over the old one, so a reader sees the old file or the new one.
Windows only: the process table comes from `scripts/proctree.mjs` (below), listeners from `Get-NetTCPConnection -State Listen -ErrorAction Stop` (netstat translates its state column). Only the
cmdlet's own no-match error (category `ObjectNotFound` from `Get-NetTCPConnection`) means no listener; any other
error makes `up` and `doctor` exit 2 with the error, and `down` exit 1 as above.

`scripts/proctree.mjs` is a byte copy of `~/.claude/skills/lars-create-verification/scripts/proctree.mjs` (Prettier
skips it through `.prettierignore`); copy it again after that one changes, never edit it here. `control.mjs` imports
`snapshot`, `merge`, `stop`, `describe`, `matches` and `processTable` from it. It reads the process table through one
`Win32_Process` query run by `%ProgramFiles%\PowerShell\7\pwsh.exe` (or Windows PowerShell) by absolute path, stops by
PID only, and never records or stops the Nx daemon.

`node .claude/skills/control-yeti-app/scripts/fingerprint.mjs <command> [flags]` is the proof manifest's script, a
byte copy of `~/.claude/skills/lars-create-verification/scripts/fingerprint.mjs`: copy it again after that one changes,
never edit it here (Prettier skips it, and `features/.proven.json`, through `.prettierignore`). It spawns nothing and
writes only the manifest.

| Command                                       | Does                                                                                                                                                                                                                                                                                                                                                                                                          | Exit codes                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `record --feature <id> [--entries <path>...]` | records the files feature `<id>` (`features/<id>.md`) depends on and their git blob hashes in `features/.proven.json`: the import closure of the entries through the repository's TypeScript and the nearest `tsconfig.json`, plus Angular `templateUrl` and `styleUrl(s)`; entries are repository-relative, and without `--entries` the recorded ones are reused; writes nothing when files and hashes match | 0 written or unchanged, 2 refused                                  |
| `check [--feature <id>]`                      | compares each recorded hash with the file now: `fresh`, `stale` (a file changed, went missing or became a link) or `unproven` (no entry)                                                                                                                                                                                                                                                                      | 0 every feature fresh, 1 one is stale or unproven, 2 could not run |

Both take `--json`. Record a feature only after a live pass proved every sub-feature of it
(`/lars-maintain-verification`); `/lars-verify` runs `check --feature <id>` before a claim.

The tests point `CONTROL_SESSION_REGISTRY` at a registry folder of their own, or at a file to make the folder
unreadable; set `CONTROL_LISTENER_TIMEOUT_MS` to make the listener query time out, from query number
`CONTROL_LISTENER_QUERIES_OK` on (0 by default); set `CONTROL_PID_LOOKUP_MISSES` to make `up`'s first lookups of the
started PID miss and `CONTROL_SPAWN_WINDOW_SHIFT_MS` to move the spawn window those lookups pass to `snapshot`; and
set `CONTROL_STOP_ROUNDS` to limit `stop`'s rounds (0 reports every matched record as `survived`). Nothing else sets
any of them.

Test: `node --test .claude/skills/control-yeti-app/scripts/control.test.mjs` proves `doctor`'s `map-fresh` line in a
copy of the skill against a stand-in page (`[WARN]` unproven, `[OK]` after `record`, `[WARN]` stale after an entry
changes, exit 0 in all three) and its `[SKIP] ports` line with `--url`; the refused flags (unknown ones and ones the
command does not take); an unhandled error exiting 2 with JSON; `info` naming both sessions, the state file, `ports`
and `tree`; every command's exit-2 refusal of a state file that is not JSON or has no `tree` rooted at its `pid`, and of an old
state file without `tree` (naming its PID and the way out); escaped command lines in the human output; a foreign process started with `--token=FAKE-SECRET-123` on the recorded root PID, which `down --json` and plain `down` refuse (exit 2, state kept) naming only its image name and start time, the secret nowhere in stdout or stderr, and also named that way in `notes` when `unrecorded` lists it; a
`down` whose port a process started with that secret holds, which stops the tree (exit 1, state removed) and names
the holder only by image name and start time; a
worktree copy refusing 4200 and 4000 with `--port` and naming a derived port in its mode's range; ten busy slots (the
checkout's own ten, by the slot rule, so 4200 and 4620-4628 in the main checkout; the slot list `up` prints must
equal the rule's) exiting 2 with each port and holder; the checkout's own port busy moving `up` to the next slot with
`fell back from <port>: held by PID <test>`; that port taken after `up` checked it moving `up` on with `held by PID
<test>` and nothing of the abandoned launch left on it; a foreign HTTP listener on 127.0.0.1 beside the dev server's ::1 failing the `--port` ready check; a
listener query failing after the launch naming the launched PID and `run down`; a root outside the shifted spawn
window left unrecorded and stopped; a zero-round stop on `up` keeping the state file with `run down`; a busy
`--port` exiting 2 with its holder; a `left-open` close for a registry entry with no `socketPath` and for a registry
folder that cannot be listed; a `down` whose first listener query times out and that exits 1 with `listenerError`
within 12 s; a `left-open` close of a session listed as open (exit 1, with playwright-cli taken off `PATH`); and a
`down` that stops a stand-in server and frees its port while an empty registry entry makes the close `left-open`. On
a dead stand-in root with a free port, it proves `down` exits 0 with the `[WARN]`; for a wrapper that exits while its
child keeps a port, that `down` stops the recorded child, frees the port and exits 0; for a recorded child whose PID
another process now holds, that `down` leaves it running as `reused` and exits 0; for a root whose start time does
not match, that `down` leaves it running, stops the matching child and keeps the state file (exit 2); for a
zero-round stop, that `down` exits 2 with both records `survived` and the tree kept, and a normal `down` then stops
them; for a live stand-in root whose PID an older orphan names as its parent (a PID Windows handed out again), that
two `down` runs never list, record or stop the orphan; and for a `tree` record older than the root, that `down` leaves
it running. Unit tests of the walk that names unrecorded processes prove it leaves out a process older than its
parent, one started after the parent was first seen gone, the children of a PID a live process holds again or of a
record with no gone time, and the Nx daemon with everything below it. Copies of the skill with a stand-in Nx prove that
`up` exits 1, removes the state file, never stops the exited launch's PID, and names in `survivors` with
`launchStopped: false` a child started just before the launch exited between two polls, and the child of a launch
whose PID never appeared; and that after a zero-round stop the kept state file lists that child in `unrecorded` and
`down` names it again and leaves it running. Three `serve` launches on a free
port prove that `up` stops the launch and removes the state file when the started PID never appears in the process
table, when `--timeout` runs out, and when another process answers its `--port`. It launches `--mode=ssr
--configuration=production` on the checkout's port, proves the tree root first and `ports` in `info`, `[OK] ports`
a `ports` fail on a port that does not listen and on a port the test holds (`held by PID <test>, not the recorded
tree`), the probed build and a refused disagreeing state file, the
`build-fresh` scan (a changed source fails it; files Git ignores do not), the refused planted state file, a `down` while another process holds the recorded port that stops every recorded
process, closes both sessions, removes the file and names the listener as outside the tree without offering to stop
it, and ends with the port free and the launch gone. A second
launch opens both sessions, kills the server's tree outside the script, and proves `down` closes both sessions. Every test passes in the main checkout and in a linked worktree (the tests derive slots and ports from the
checkout they run in), and every test that can start an instance stops it in its `t.after`, also when an assertion
fails. It builds the Fixture app, so no other build may run in the checkout while it runs, and it never stops the Nx
daemon.

## Gotchas

- The first `build-fresh` check compared `server.mjs`'s modification time with the sources and failed on a
  healthy instance: the Nx cache restored the bundle with the original build's time (04:59) while the worktree's
  sources were checked out later (measured). The check now compares the sources with the launch time instead.
- `yeti-css:yeti-build` writes the git-ignored `vendor/yeti/docs/llms*.txt`, which are not among its Nx outputs, so an
  uncached build (a fresh worktree) rewrites them after launch. A scan of every file failed `build-fresh` on a healthy
  instance (measured 2026-10-15); the scan reads Git's file list, so ignored output never counts.
- Nx writes ANSI colour codes into `server.log` (`nx run[22m yeti-app:build:production`); the script strips them
  before matching (measured). Strip them too when you search the log by hand.
- The first launch probe used `node_modules/nx/bin/nx.js`, which does not exist; the entry is
  `node_modules/nx/dist/bin/nx.js`, and the script resolves it through `require.resolve('nx')` (measured).
- In the proof, `run-code` and `eval` hung in a JavaScript-off session (measured: a trivial
  `async page => page.url()` ran until the 40 s timeout); `snapshot`, `find` and `screenshot` work. With JavaScript
  off, read the head from the served HTML instead (see `features/javascript-off.md`). A hung call also blocks the
  session's later commands until `close`.
- The `serve` dev server runs with HMR, so Angular logs `NG0751` and loads every `@defer` dependency eagerly
  (measured on `/sub/card`). Walk `@defer`, `hydrate never` and incremental-hydration cases with `--mode=ssr`, as
  the e2e servers do.
- `nx serve` listens on `::1` only and its listening PID is a child several levels below the recorded PID
  (measured); ownership checks use the recorded tree, which `up` refreshes on every poll.
- The Nx daemon stays running after `down`. An earlier version stopped it on every `down`; Lars ruled that only
  removing a worktree the work created stops it ("In an Nx workspace, it is needed continuously.").
- `npm ci` in a worktree skips install scripts the npm allow-list has not approved (esbuild, nx); the builds still
  ran in the proof (measured).
- `playwright-cli --version` printed `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` on exit (measured);
  the commands themselves worked.
- playwright-cli sessions are not scoped to one checkout: from this worktree, `list` showed a sibling worktree's
  session (measured). Use only your own session name; never `close-all`.
- A page answering on 4200 or 4000 may be Lars's own server. From a worktree the script refuses those ports;
  check them on purpose with `doctor --url`.
- The Fixture app preloads the item stylesheets its e2e cases need (`app.config.ts`) and leaves `lift` and `enter`
  out on purpose, so their routes measure arrival without a preload. Chromium logs one
  `was preloaded using link preload but not used` warning per unused item about 6 s after load (measured on
  `/sub/card`). They are warnings, so `doctor`'s `console-errors` ignores them; do not read them as a failure.
- A pass here is Chromium on this machine only; Firefox, WebKit and Safari results come from the e2e projects and
  CI.
