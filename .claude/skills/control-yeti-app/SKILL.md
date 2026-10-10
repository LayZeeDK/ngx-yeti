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

- **Main checkout** (`.git` is a directory): `serve` mode uses 4200, the dev-server default, and `ssr` mode uses
  4000, the default of `PORT` in `apps/yeti-app/src/server.ts` (inferred: read from `project.json` and
  `server.ts`).
- **Worktree** (`.git` is a file): the script derives one port in 4600-4799 from a hash of the checkout path, the
  same for both modes (measured: 4714 for the T005 worktree). It refuses 4000 and 4200 there, even with `--port`.
- One instance per checkout. The flow id is `main` or `wt-<8 hex>`; the playwright-cli session is
  `control-yeti-app-<flow id>`. `info` prints both.

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

Rows one and four ran in the proof (measured); rows two and three are read from `apps/yeti-app/project.json`
(inferred, not run).

The script starts Nx as `<this node> node_modules/nx/dist/bin/nx.js`, the way
`tools/playwright/browser-projects.mjs` starts the e2e servers, with `NX_DAEMON=false`. Readiness: `GET
<url>card` answers 200 and contains `Welcome yeti-app` (the `h1` of `apps/yeti-app/src/app/app.html`), and the
listening PID is in the started process tree. Time to ready: 16 to 22 s for `serve` development (measured in
two proof runs); `ssr` runs `yeti-css:yeti-build` and `yeti-app:build:<configuration>` first: 5 s for production SSR when
both came from the local Nx cache (measured); an uncached build takes longer (not measured). `--timeout=<seconds>`
(default 900) bounds the wait. The server log goes to `<evidenceDir>/server.log`.

The base URL is `http://localhost:<port>/sub/` (`<base href="/sub/">`). Use `localhost`: the build's
`security.allowedHosts` is `["localhost"]`, and the dev server listens on `::1` only (measured).

## Doctor

```bash
node .claude/skills/control-yeti-app/scripts/control.mjs doctor --json
node .claude/skills/control-yeti-app/scripts/control.mjs doctor --url=http://localhost:4310/sub/ --json
```

Read-only. Opens `<url>card` in the repository's Playwright Chromium (`npx playwright install chromium` once) and
reports one line per check:

| Check                 | Passes when                                                                                                                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `process-alive`       | the recorded PID is running                                                                                                                                                                                    |
| `port-owned`          | a PID listening on the port is in the recorded PID's tree                                                                                                                                                      |
| `build-log` (`serve`) | `server.log` has no `[ERROR]` or `Error:` line                                                                                                                                                                 |
| `build-fresh` (`ssr`) | `server.log` shows `nx run yeti-app:build:<configuration>` (built or restored from the Nx cache at launch) and no file in `apps/yeti-app/src` or `packages/ngx-yeti/src` changed after the recorded start time |
| `page-marker`         | `<url>card` answers 200 and `app-root h1` reads `Welcome yeti-app`                                                                                                                                             |
| `build`               | always passes; says `development` when `window.ng` exists, else `production`                                                                                                                                   |
| `hydration`           | development: Angular logs `Angular hydrated ... 0 component(s) were skipped.` and no `NG05xx` message; production: skipped (no summary is logged)                                                              |
| `console-errors`      | no `console.error` and no page error on first load                                                                                                                                                             |

With `--url`, `process-alive` and `port-owned` report `skip`; the page checks still run. Exit 0 healthy, 1 not
healthy (`failed` names the checks), 2 could not run (no state and no `--url`, Chromium missing, a worktree state
on a main-checkout port).

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

- Console: `playwright-cli -s=<session> console` writes `.playwright-cli/console-*.log`; the development build logs
  `Angular is running in development mode.` and the hydration summary (measured).
- Network: `playwright-cli -s=<session> requests`.
- Item links: `head link[data-ngx-yeti-styles]` (measured on `/sub/card`: `card`, `lift`).
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

Closes the run's playwright-cli sessions (`-s=<session> close` and `-s=<session>-jsoff close`), stops the recorded PID's process tree with
`taskkill /PID <pid> /T /F`, waits until the port is free and every PID of the tree is gone, removes
`state.json`, and keeps the evidence directory. It never runs `close-all` or `kill-all`: those reach every
playwright-cli session on the machine, including other agents'.

## Helpers

`node .claude/skills/control-yeti-app/scripts/control.mjs <command> [flags]`

| Command  | Does                                                                                                                                                                                                                                                                 | Exit codes                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `up`     | refuses when a state file exists, when the port is a main-checkout port in a worktree, or when anything listens on the port (names the owning PID); starts the target; writes `tmp/control-yeti-app/state.json`; writes `<evidenceDir>/js-off.json`; polls readiness | 0 ready, 1 launch exited or not ready (state removed on exit), 2 refused        |
| `doctor` | the checks above                                                                                                                                                                                                                                                     | 0, 1, 2                                                                         |
| `info`   | prints the state: `flow`, `mode`, `configuration`, `pid`, `start`, `commandLine`, `port`, `url`, `session`, `evidenceDir`, `logFile`                                                                                                                                 | 0, 2 no state file                                                              |
| `down`   | stops only a PID whose start time and command line match the state file; a dead PID removes the state file and exits 0                                                                                                                                               | 0 stopped, 1 port or a tree PID survived, 2 refused (mismatch) or no state file |

Flags: `--mode=serve|ssr`, `--configuration=development|production`, `--port=<n>` (up), `--url=<base url>`
(doctor), `--timeout=<seconds>` (up), `--json` (one JSON object on stdout; otherwise `[OK]`/`[ERROR]`/`[SKIP]`
lines). Windows only: the process table comes from `pwsh` and `Get-CimInstance Win32_Process`, ports from
`netstat -ano`.

## Gotchas

- The first `build-fresh` check compared `server.mjs`'s modification time with the sources and failed on a
  healthy instance: the Nx cache restored the bundle with the original build's time (04:59) while the worktree's
  sources were checked out later (measured). The check now compares the sources with the launch time instead.
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
  (measured); ownership checks walk the tree.
- `npm ci` in a worktree skips install scripts the npm allow-list has not approved (esbuild, nx); the builds still
  ran in the proof (measured).
- `playwright-cli --version` printed `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` on exit (measured);
  the commands themselves worked.
- playwright-cli sessions are not scoped to one checkout: from this worktree, `list` showed a sibling worktree's
  session (measured). Use only your own session name; never `close-all`.
- A page answering on 4200 or 4000 may be Lars's own server. From a worktree the script refuses those ports;
  check them on purpose with `doctor --url`.
- The Fixture app preloads every item stylesheet its e2e cases need (`app.config.ts`), so Chromium logs one
  `was preloaded using link preload but not used` warning per unused item about 6 s after load (measured on
  `/sub/card`). They are warnings, so `doctor`'s `console-errors` ignores them; do not read them as a failure.
- A pass here is Chromium on this machine only; Firefox, WebKit and Safari results come from the e2e projects and
  CI.
