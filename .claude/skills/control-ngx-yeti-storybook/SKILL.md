---
name: control-ngx-yeti-storybook
description: 'Drive, screenshot, reproduce, or verify in the browser a story of the ngx-yeti Storybook: launch the dev server (port 4400) or the static build (port 4401) in isolation, open a story id with or without its play function, run the play function, and capture the axe result of the a11y addon, through playwright-cli against the Nx storybook and static-storybook targets of packages/ngx-yeti. Use to prove a story, a directive, or an accessibility claim in a running Storybook, or to walk a Surface contract story.'
---

# Control the ngx-yeti Storybook

Launches the `ngx-yeti` Storybook (`packages/ngx-yeti/.storybook/`, `@storybook/angular-vite` 10.6) through its Nx targets, checks it is worth driving, opens stories in their `iframe.html` with playwright-cli, runs play functions, and captures the a11y addon's axe report. Skip it for a whole-suite check: `npm exec -- nx test-storybook ngx-yeti` runs every story's play function and axe gate without a server. Story and gate rules live in the `ngx-yeti-stories` skill.

## Pick a flow

| Flow             | Flag    | Nx target                   | Main checkout port | Worktree port                     |
| ---------------- | ------- | --------------------------- | ------------------ | --------------------------------- |
| static (default) | none    | `ngx-yeti:static-storybook` | 4401               | derived, odd number in 4421-4619  |
| dev              | `--dev` | `ngx-yeti:storybook`        | 4400               | derived, even number in 4420-4618 |

The script finds the flow's checkout kind itself: `.git` is a directory in the main checkout and a file in a linked worktree. A worktree derives its port pair from a SHA-1 of its path, so parallel worktrees and the main checkout never share a server. The static flow serves the built Storybook that layer 4 (`apps/ngx-yeti-e2e`) opens; use it for proofs. The dev flow (`storybook dev`) reloads on edits; use it while writing a story.

## Launch

```bash
node .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs up --json
node .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs up --dev --json
```

Run from the repository root. Underneath it spawns `node node_modules/nx/dist/bin/nx.js run ngx-yeti:static-storybook --port=<port>` (or `ngx-yeti:storybook --port=<port>`) detached, with `NX_TUI=false` and `NX_NO_CLOUD=true` and the Nx daemon on (it sets nothing about the daemon; `down` stops it), and logs to `<evidenceDir>/server.log`. `static-storybook` first runs `build-storybook` (cached by Nx) and `yeti-css:yeti-build`, then serves `packages/ngx-yeti/storybook-static` with `http-server`.

Ready means: `<url>/index.json` lists `card--stretched-link`, and that story, opened with `embed=true` in the repo's Playwright Chromium, reaches render phase `finished` without Storybook's error display. Measured on this machine (Windows 11 ARM64): static 12.7-15.5 s with `build-storybook` from the Nx cache, about 26 s with a fresh build; dev 13.8 s. `up` gives up after 600 s.

## Doctor

```bash
node .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs doctor --json
node .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs doctor --url=http://localhost:4401 --json
```

Read-only. Each check is one entry in `checks` with `pass`, `fail` or `skipped`:

- `process alive`: the recorded PID runs and its start time matches the state file.
- `port owned by run`: every listener on the port is in the recorded PID's process tree.
- `index lists known story`: `index.json` has `card--stretched-link`.
- `known story renders`: phase `finished`, no `sb-show-errordisplay`, `#storybook-root` has content.
- `no console errors`: no console error or page error on first load (the `favicon.ico` 404 of `http-server` is ignored).
- `build matches checkout`: static, `storybook-static/index.json` is newer than every file under `packages/ngx-yeti`, `packages/ngx-yeti-testing` (the shared story helpers) and `vendor/yeti` (directories named `storybook-static`, `node_modules` and `dist` skipped); dev, the server log has no `ERROR` or `Error:` line.

With `--url`, the two process checks report `skipped` and the page checks still run. Exit 0 healthy, 1 not healthy (the failing check is named), 2 could not run (no state file and no `--url`, or the main checkout's port from a worktree).

## Drive

Driver: playwright-cli, session `control-ngx-yeti-storybook-<flow>-<port>` (the `session` field of `up` and `info`). Run playwright-cli from the repository root: a `close` issued from another working directory answered "is not open" for a session that was open (measured). Open stories in `iframe.html`, never the manager UI, whose own controls sit outside the story.

- **Open a story without rerunning its play function:** `iframe.html?id=<story-id>&viewMode=story&embed=true`. `embed=true` turns Storybook's autoplay off, as `openStory` in `apps/ngx-yeti-e2e/src/open-story.ts` relies on; `window.__STORYBOOK_PREVIEW__.currentRender.renderOptions.autoplay` reads `false`.
- **Run its play function:** open the same URL without `embed=true`: `iframe.html?id=<story-id>&viewMode=story`. Autoplay is on and the play function runs once after render. To run it again and capture its result, emit `forceRemount` and wait for `storyFinished` (recipe in `features/play-functions.md`).
- **Run it as the repo's test:** `npm exec -- nx run ngx-yeti:test-storybook --skipNxCache -- card/src/card.stories.ts -t "Stretched Link"` runs that one story's render, play function, console gate and axe gate in Vitest browser mode, with no server needed (measured: 1 passed, 7 skipped).

```bash
playwright-cli -s=control-ngx-yeti-storybook-static-4483 open "http://localhost:4483/iframe.html?id=card--stretched-link&viewMode=story"
playwright-cli -s=control-ngx-yeti-storybook-static-4483 snapshot
```

Selectors, in order: roles and accessible names (`getByRole('button', { name: 'Save' })`), the attributes Yeti directives own (`[data-ratio]`, `.card`), snapshot refs. The interaction loop: snapshot, one action, fresh snapshot, check the expected change. Wait by polling an end state, never a fixed sleep: `currentRender.phase` in `finished`, `errored` or `aborted` (the phases `open-story.ts` waits for). Recipes per feature: `features/README.md`.

## Inspect

- `playwright-cli -s=<session> console error` and `requests` read the console and network.
- `playwright-cli -s=<session> --raw eval "() => window.__STORYBOOK_PREVIEW__.currentRender.phase"` reads the render phase; `renderOptions.autoplay` says whether the play function ran.
- The `storyFinished` event on `window.__STORYBOOK_ADDONS_CHANNEL__` carries the story's status (`success` or `error`: a play function that threw, a failed `console.error` gate, or a failed axe report) and the a11y addon's full axe report (`features/axe-results.md`).
- Not reachable: Angular DevTools (a browser extension for humans, manual only). Not covered: the Storybook MCP addon, which this repo does not install; `window.ng` was not probed.

## Evidence

Evidence lives in `tmp/control-ngx-yeti-storybook/<flow>-<timestamp>/` (the `evidenceDir` of `up` and `info`; `tmp` is git-ignored). `down` keeps it. A story proof captures:

- the story URL (it reproduces the state, args included);
- a snapshot after the action: `playwright-cli -s=<session> snapshot --filename=<evidenceDir>/<story-id>.after-play.yml`;
- the `storyFinished` result with the axe report: `<evidenceDir>/<story-id>.story-finished.json`;
- a screenshot: `playwright-cli -s=<session> screenshot --filename=<evidenceDir>/<story-id>.png`;
- `server.log`, written by `up`.

Proof rules: `features/README.md`. playwright-cli also writes `.playwright-cli/` in the working directory; it is ignored and never evidence.

## Cleanup

```bash
node .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs down --json
node .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs down --dev --json
```

Closes the run's playwright-cli session by name, stops the recorded PID's whole process tree (`taskkill /PID <pid> /T /F` on Windows, the process group elsewhere), waits until the tree is gone and the port is free, removes the state file, stops the checkout's Nx daemon (`nx daemon --stop`), and keeps the evidence directory. It runs playwright-cli's own script (`@playwright/cli/playwright-cli.js` beside the shim) under this Node with the session as an argument, so the name never reaches a shell. `sessionClose.outcome` is `closed`, `not-open`, `absent` (no playwright-cli on `PATH`), `timeout` (no answer in 30 s) or `failed` (a non-zero exit, with its output); a `timeout` or `failed` close, or a failed daemon stop (`daemon.stopped: false`), makes `down` exit 1 with `teardown incomplete` naming the session and the command that closes it. It refuses (exit 2) a PID whose start time or command line differs from the state file. A recorded PID that is no longer running is not a refusal: the state file is removed and it exits 0. Never use `playwright-cli close-all` or `kill-all`: they reach every session on the machine.

Test: `node --test .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs` proves the refused flags, launches the static flow with the Nx daemon on, proves the freshness check over `packages/ngx-yeti-testing` and the refused planted state file, and ends with a `down` that leaves the port free and no Nx daemon running. It builds the static Storybook, so nothing else may build in the checkout while it runs.

## Helpers

`scripts/control.mjs <command> [--dev] [--url=<origin>] [--json]`

| Command  | Does                                                                                                          | Exit codes                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `up`     | Checks the port is free, launches the flow's target, polls readiness, writes the state file                   | 0 ready; 1 server exited or not ready; 2 already up, port in use (owner PIDs listed)                                                               |
| `doctor` | Runs the checks above; `--url` checks an instance this run did not start                                      | 0 healthy; 1 a check failed; 2 no state and no `--url`, or main port from a worktree                                                               |
| `info`   | Prints the state: `url`, `port`, `pid`, `flow`, `session`, `evidenceDir`, `log`, `startTime`, `launchCommand` | 0; 2 no state file                                                                                                                                 |
| `down`   | Closes the session, stops the process tree, removes the state file, stops the Nx daemon                       | 0 stopped or already gone; 1 teardown incomplete (a process, the port, the session close or the daemon stop); 2 no state file, or refused mismatch |

`--dev` picks the dev flow; without it the static flow. Any other argument, `--url` without `=<origin>` (`--url http://...` with a space) and a second command exit 2 with `unknown argument <arg>` before anything runs. A command other than the four, a name every object has such as `toString` included, exits 2 with the usage line. Every command refuses (exit 2, nothing run) a state file that is not an object, whose `session` is not `[\w-]` only, whose `pid` is not a positive integer, whose `port` is not 1 to 65535, or whose `url`, `target` or `log` is not a string. `--json` prints one JSON object (`command`, `flow`, `exitCode`, `message` and the command's fields); without it, `[OK]`/`[ERROR]`/`[SKIP]` lines. State: `tmp/control-ngx-yeti-storybook/state-<flow>.json` with `pid`, `port`, `url`, `target`, `session`, `startTime`, `launchCommand`, `startedAt`, `evidenceDir`, `log`.

## Gotchas

- Proof run, first try: importing Playwright by a `C:\` path failed with `ERR_UNSUPPORTED_ESM_URL_SCHEME`; the script imports it through a `file://` URL.
- Nx's bin is `node_modules/nx/dist/bin/nx.js`, not `node_modules/nx/bin/nx.js` (Nx 23.2.1).
- `playwright-cli close` exits 0 whether or not the session was open; `down` reads its output (`sessionClose.outcome`: `closed` or `not-open`).
- In this repository the GSD Path guard hook rejects a shell write target it cannot resolve (`> $E/file.json`): write the literal evidence path from `info`.
- PowerShell and cmd.exe cut a URL at `&`: in PowerShell use `playwright-cli --% -s=<session> open "<url>"`; in cmd.exe write `^&`. Git Bash needs only the quotes.
- `http-server` has no favicon, so every page logs one `favicon.ico` 404 console error; it is not a story error.
- A green local run proves Chromium only; `test-storybook` runs three engines only when `CI` is set (`ngx-yeti-stories`).
- `userEvent.hover` in a play function does not set `:hover`; hover and media emulation belong to layers 2 and 4, not to a play-function recipe.
