# Run CI and floor jobs locally

Every job in `.github/workflows/ci.yml` and `.github/workflows/floor.yml` passes in CI. Before a push, the checks that run natively pass locally: `npm run check`, the `static` and `package` jobs, the floor jobs `firefox-145` and `chromium-141`, the e2e projects `ngx-yeti-e2e` and `yeti-app-e2e` run natively, and the `nvda` lane without `BROWSERS`. The `BROWSERS=msedge` NVDA lane is faster but not evidence for the job. The container jobs `unit`, `e2e`, `webkit-26-4`, and `firefox-146-e2e` need no local run; `tools/ci-local/run-job.mjs` reproduces one on demand (below). `ci.yml` `safari` and `voiceover` need real Safari and VoiceOver on macOS and pass in CI only, on every pull request. Run commands from the repository root.

## Container jobs: run them from the workflow

`ci.yml` `unit` and `e2e` and `floor.yml` `webkit-26-4` and `firefox-146-e2e` run in a Playwright image. Run them with:

```sh
node tools/ci-local/run-job.mjs <workflow> <job> [--matrix key=value]... [--legs <n>] [--e2e-workers <n>] [--dry-run] [-- <command>...]
```

The script reads the job's `container` image, `env`, matrix and `run` steps from the workflow file. It refuses any workflow key, step, action input or expression it does not run, so a workflow change either reaches the local run or stops it with a message. The workflow name, the job id and every matrix value become part of a host folder name, so each must match `^[\w.-]+$` and not be only dots; `run-job.mjs` refuses any other, naming it, before it creates or removes anything, with or without `--dry-run`. It also refuses a leg whose reports folder is not inside `ngx-yeti-run-job/<checkout>` under the system temp folder. For each matrix combination it:

- streams the working tree, uncommitted files included, into a fresh `--rm` container; the checkout is only read;
- keeps every `node_modules` folder the lockfile names, and the npm cache, in Docker volumes named `ngx-yeti-run-job-<checkout>-*`;
- reruns the setup steps (`npm ci`, `npm install --no-save ...`) only when a `package.json`, the lockfile, the image or those steps change;
- sets `CI=true` and `HOME=/github/home` as GitHub does, before the job's own `env`;
- fails if the image's Node major differs from `actions/setup-node`'s `node-version`;
- runs each step as `bash -e -c '<run>'`, as GitHub's default shell does, or the one command after `--` instead of the steps after setup;
- copies `dist/.playwright` (reports and traces) to the folder it prints, `ngx-yeti-run-job/<checkout>/<leg label>` under the system temp folder, and writes the leg's output to `run-job.log` there. `<checkout>` is the hash the volume names carry, so two checkouts running the same leg keep separate folders; the next run of that leg in the same checkout empties its folder first;
- ends a leg as failed, naming tar's exit status, when the host `tar` that streams the tree fails.

### How a local run differs from CI

A local run differs from CI in three ways only, and each has a switch that makes it run as CI does:

- **Concurrent legs.** GitHub runs a job's matrix legs on separate runners at once. The script runs up to `--legs` of them at once, 2 by default, and starts the next as one ends. `--legs 1` runs them one after another. The cap is set by memory, not cores: all containers share the WSL VM, capped at 12 GB on this machine, and two `e2e` legs peaked at 8.4 GiB, two `firefox-146-e2e` shards at 10.2 GiB (below). Each concurrent slot mounts its own `node_modules` volumes, because a leg writes `node_modules/.vite`, `node_modules/.cache` and the setup key file: slot 1 keeps the job's volumes, `ngx-yeti-run-job-<checkout>-<workflow>-<job>-*`, and slot 2 uses `...-<job>-leg2-*`. Each slot runs its own setup the first time and skips it while its key matches. Every leg runs to its end when another fails, each output line carries the leg's label, and the closing summary lists each leg's result, wall time, reports folder and log. The run exits 1 when any leg fails.
- **Playwright workers.** CI runs each e2e leg with the preset's one worker. Locally the script sets `E2E_LOCAL_WORKERS`, 3 by default, which the three e2e configs read through `localWorkers()` in `tools/playwright/browser-projects.mjs`. `--e2e-workers 0` leaves it unset, so a leg runs with one worker as on CI. A command-line `--workers`, such as `firefox-146-e2e`'s `--workers=2`, still wins, so the floor job runs as on CI.
- **No build cache.** Each container still starts with an empty Nx cache, as on CI. A shared build-only cache was measured and dropped (below).

Ctrl+C stops the run and removes its containers. A leg also stops when `run-job.mjs` dies without running its handler, because the container ends when its input closes.

Examples:

```sh
node tools/ci-local/run-job.mjs floor webkit-26-4
node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development
node tools/ci-local/run-job.mjs ci e2e --matrix configuration=tailwind-c1
node tools/ci-local/run-job.mjs floor firefox-146-e2e --matrix shard=1
node tools/ci-local/run-job.mjs ci unit -- npx nx test ngx-yeti -- --project=browser
node tools/ci-local/run-job.mjs ci e2e --dry-run
```

Without `--matrix`, every combination runs, up to `--legs` at a time. The `e2e` job's `configuration` is `development` (every e2e project), `production`, `tailwind-c1` or `tailwind-c2` (the Fixture app only; the two Tailwind values build it beside Tailwind v4 and run `tailwind.spec.ts` alone), so the job has 12 combinations. A job without a `container` is refused; run it natively, below. Run one job at a time per checkout: two runs of the same job share its volumes. The script needs Docker and a `tar` that reads a NUL-separated list (Git Bash's or Windows').

## Jobs without a container: run them natively

| Job                        | Command                                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml` `static`          | `npx prettier --check .`, then `npm exec nx -- run-many -t lint typecheck`                                                                                                                        |
| `ci.yml` `package`         | `npm exec nx -- run-many -t build pack-check`                                                                                                                                                     |
| `floor.yml` `firefox-145`  | `FLOOR_FIREFOX=true npm exec nx -- test ngx-yeti -- --project=browser`; WebdriverIO downloads stock Firefox 145 and geckodriver                                                                   |
| `floor.yml` `chromium-141` | `npx --no-install @puppeteer/browsers install chrome@<CHROME_FLOOR_VERSION> --path <absolute dir>` prints `chrome@<version> <path>`; set `FLOOR_CHROMIUM_PATH=<path>` and run the job's two steps |
| `ci.yml` `nvda`            | `npm exec nx -- run screen-reader-e2e:nvda` on Windows (Playwright's Chromium, then Firefox); see [The NVDA lane](#the-nvda-lane)                                                                 |

`CHROME_FLOOR_VERSION` is in `floor.yml`'s `env`. Give `--path` an absolute folder, such as `--path "$(pwd)/tmp/floor-chrome"`: with a relative one the printed path is relative too, and Vitest does not find the browser. Add `--skip-nx-cache` to measure real work instead of a cache hit.

With `FLOOR_CHROMIUM_PATH` set, both steps start Chromium with `--disable-stack-profiler`. Chrome for Testing is an x64 build, and under emulation on Windows on Arm a renderer started with the stack profiler can end as a process Windows can neither open nor kill; `browser.close()` then never returns and the e2e step never exits (upstream bugs O18 and O19).

## The NVDA lane

The `nvda` target installs a portable NVDA through `npx guidepup install nvda` (idempotent, cached under `%LOCALAPPDATA%\guidepup`), starts it in English, and runs `apps/screen-reader-e2e` against the static Storybook on port 4401, headed, one worker, with 2 retries. It takes the desktop: NVDA speaks, and its keys go to the browser window it raises, so do not type or click while it runs, and do not run it beside `ngx-yeti-e2e`, which needs the same port. Every key the lane sends goes through one guard in `src/support/nvda.ts`: it reads the title of the foreground window, changing no window, and throws, naming that title and sending nothing, unless the title holds the token `open` gave the story window. So a window that takes the foreground fails the test instead of receiving the keys. Only `open` raises the story window, and it accepts NVDA's focus report only when the report holds the start marker, or names a document and holds that token (NVDA speaks it with spaces inside, so spaces are ignored); a report of another application's document, or of the story window's frame, is refused. `src/focus-guard.nvda.ts`, which only the `nvda` lane loads, proves all three: it raises a decoy window, asserts that `top` and `nextListItem` reject with the decoy's title and that the decoy's text field got no key, opens two stories in turn in one worker, and checks the focus-report match against recorded phrases. Each test writes the phrases it heard to `dist/screen-reader-e2e/nvda/<browser>/`.

Without `BROWSERS` the lane runs Playwright's Chromium and then Firefox, as the `nvda` job does, so that run is the local run of the job. `BROWSERS=msedge` runs native arm64 Edge on Windows on ARM64: faster, but not evidence for the job. The `voiceover` target refuses to start off macOS, and `nvda` off Windows.

`open` asks NVDA for its focus until NVDA reports the story document, for at most 60 s, and does one of two things after each refused report. NVDA can miss the foreground change that brings the browser window up, and keeps its focus on the window that had it, such as a terminal; for that, the raise moves the foreground to a helper window of its own and back, a fresh foreground change. In Playwright's Firefox, NVDA then reports the window's frame (`<token> — Nightly, frame, read only`), not its document: Juggler sets `docShell.overrideHasFocus` on every content docShell, so a loaded document never loses Gecko's focus, and raising the window fires no document focus event. Setting `focusmanager.testmode` to false changes nothing. For that report, `open` presses F6, which moves Firefox's focus to the address bar, and Enter, which reloads the story from there into the document; NVDA follows both. Both keys go through the guard.

Measured on 2026-10-12 on Windows 11 on ARM64 with NVDA 2026.2 (Guidepup asset `0.2.1-2026.2`), Guidepup 0.35.0, and Playwright 1.63's x64 Chromium 153 and Firefox 155 under emulation: three lane runs in a row without `BROWSERS` passed all four tests in both browsers on the first attempt, and in the two Firefox workers whose phrases were checked, the first `open` needed the hop and then the address-bar reload. Before the fix, the first `open` of a worker failed in Chromium as well as Firefox whenever NVDA missed the foreground change, and every Firefox `open` that NVDA did not follow from the launch failed on the frame.

## Container jobs without Docker

- The three current engines: `VITEST_MAX_WORKERS=2 BROWSERS=chromium,firefox,webkit npm exec nx -- run-many -t test test-storybook --parallel=1` (the `unit` job's two settings, which `run-job.mjs` applies itself) and `CI=true npm exec nx -- run-many -t e2e -p <projects> -- --project=<engine>`, with `FIXTURE_CONFIGURATION=production`, `tailwind-c1` or `tailwind-c2` and `-p yeti-app-e2e` for the other three configurations. The e2e run keeps `CI=true` for the job's CI settings, which `BROWSERS` skips (below). Without `CI` or `BROWSERS`, the browser projects declare Chromium only.
- `webkit-26-4` and `firefox-146-e2e`: `npm install --no-save playwright@<release> @playwright/test@<release>`, `npx playwright install <browser>`, then the job's steps with its `FLOOR_*` variable. Run `npm ci` before anything else afterwards.

## Choose browsers with BROWSERS

`BROWSERS` is a comma-separated list read by `tools/playwright/engines.mjs` for every Vitest browser project and every e2e project. Each name runs once, in list order. An unknown or empty entry, such as `safari` or the end of `webkit,`, throws while the config loads, so every Nx command that builds the project graph fails until you fix or unset `BROWSERS`. An empty `BROWSERS` counts as unset.

- `chromium`, `firefox` and `webkit` run Playwright's pinned builds, the ones CI runs.
- `remote-chromium`, `remote-firefox` and `remote-webkit` run the same pinned revisions in a Playwright server; see [The remote engines](#the-remote-engines).
- `msedge` and `chrome` run the installed Microsoft Edge or Google Chrome through a Playwright channel; `moz-firefox` runs the installed Firefox through WebDriver BiDi. On Windows on ARM64 these are native arm64, unlike Playwright's x64 Windows builds.
- The channels are the installed releases, not Playwright's pinned ones. Use them locally only, and never as evidence for what CI runs. They auto-update, and their version is not an Nx cache input, so add `--skip-nx-cache` after a browser update.
- `BROWSERS` wins over `CI`. A floor variable or `SAFARI` wins over `BROWSERS` in the targets it changes. `FLOOR_FIREFOX` and `SAFARI` are the only paths to the `webdriverio` provider, so a channel never reaches it.
- `BROWSERS` without `CI` skips the e2e configs' CI settings: retries, a single worker, blob reports, `forbidOnly` and `failOnFlakyTests`. Vitest's `allowOnly` also defaults to `!CI`, so a stray `.only` passes locally under `BROWSERS` and fails on CI.
- `moz-firefox` looks only in Firefox's default install folders, not in a Microsoft Store install. For any other install, set `FIREFOX_PATH` to its `firefox.exe`. A Microsoft Store install needs the `firefox.exe` inside its package folder; the app execution alias under `%LOCALAPPDATA%\Microsoft\WindowsApps` does not launch. Find the folder with `(Get-AppxPackage Mozilla.Firefox).InstallLocation` and append `\VFS\ProgramFiles\Firefox Package Root\firefox.exe`.

```sh
BROWSERS=msedge npm exec nx -- test ngx-yeti -- --project=browser
BROWSERS=msedge,webkit npm exec nx -- e2e ngx-yeti-e2e
FIREFOX_PATH='C:\Program Files\WindowsApps\Mozilla.Firefox_<version>_arm64__n80bbvh6b1yt2\VFS\ProgramFiles\Firefox Package Root\firefox.exe' BROWSERS=moz-firefox npm exec nx -- test ngx-yeti -- --project=browser
```

Measured on 2026-10-05 and 2026-10-06 on Windows 11 on ARM64 with Edge 154.0.4258.53, Chrome 154.0.8037.98 and Store Firefox 157.0. `msedge` and `chrome` passed `nx test ngx-yeti`, `test-storybook`, `ngx-yeti-testing` and `ngx-yeti-e2e`. Under `moz-firefox`, the three `under a real pointer` hover tests of `lift.spec.ts` time out, the `card.stories.ts` "Stretched Link" and "With Lift" stories fail, and the `ngx-yeti-e2e` reduced-motion shadow and dark colour scheme checks fail; Mozilla's 155.0 aarch64 build, the pinned version, fails the same way. The causes are Playwright 1.63's WebDriver BiDi gaps (`docs/specs/upstream-bugs.md` O13 and O14), not the tests: `page.emulateMedia` is a no-op over BiDi, and a pointer action never finds an element inside Vitest's CSS-scaled tester iframe.

### The remote engines

The `remote-*` names connect to the Playwright server at `PLAYWRIGHT_SERVER`, else the endpoint that `tools/playwright-server/server.mjs` wrote to `tmp/playwright-server`; with neither, the config throws and names both. The script runs `playwright run-server` of the installed release in Playwright's Linux image, `mcr.microsoft.com/playwright:v<release>-noble`, with the pinned Chromium, Firefox and WebKit at the same revisions CI runs (CI pulls linux/amd64; this machine runs the linux/arm64 builds). The runners, the Vite servers and the e2e web servers stay on this machine; the browsers reach only the web servers under test here, through the `exposeNetwork` rule each config builds from its own server addresses. On Windows on ARM64 this is the native way to run Playwright's Firefox and WebKit. Docker Desktop must be running.

```sh
node tools/playwright-server/server.mjs
BROWSERS=remote-chromium,remote-firefox,remote-webkit npm exec nx -- run-many -t test test-storybook e2e
node tools/playwright-server/server.mjs stop
```

Prefer `msedge` for a quick native Chromium check: it needs no Docker and its edit-to-result loop matches the emulated Chromium's. Prefer the `remote-*` names for Firefox and WebKit, and for a run of the pinned builds before a push. Fonts and rendering are Linux, as in CI; a Windows rendering question still needs a Windows browser. [Remote engine runs](#remote-engine-runs) has the counts.

`PLAYWRIGHT_SERVER` may name the server as `ws://localhost:3000/<path>` too; Playwright accepts that `Host`. `stop` stops the container and keeps it for a fast restart, token included, and the container stops itself after 30 minutes without a connection; after either, remote runs fail to connect until `server.mjs` runs again, which resumes it with the same token. A start after a Playwright upgrade, a change to the forwarder script or the setup replaces the container with a new token; the upgrade first needs the `pinned` version and digest in `server.mjs` updated from `docker image inspect --format '{{index .RepoDigests 0}}'` on the new tag. The endpoint file belongs to the checkout that started the server: after a replace, another checkout's `tmp/playwright-server` is stale, so run `server.mjs` there again.

The layers between the world and the browsers, and what each leaves open:

- The port is published on `127.0.0.1:3000` only, so nothing off this machine reaches it; every local process does, and one that reads `tmp/playwright-server` drives the browsers until `stop` or the idle stop.
- Inside the container, a pipe admits only a first request of `GET /<path>`, the token path, compared once in constant time; `/json` and every other path never reach Playwright, and the path is a 128-bit guess.
- Playwright's own `run-server`, bound to loopback, refuses a non-loopback `Host` (DNS rebinding) or web-page `Origin`; a `localhost` page, a Chromium `file:` page or an extension passes it, and only the path stops it.
- The container runs on a Docker network of its own, so no other container reaches the SOCKS proxy that `exposeNetwork` opens inside it on every interface, without authentication (O15); other containers still reach the published port, where the pipe applies.
- What a connection reaches on this machine is the `exposeNetwork` rule, never `<loopback>`; nothing else on this machine's loopback is reachable through the browsers.
- The container runs with `--cap-drop ALL`, `--security-opt no-new-privileges` and `--shm-size 1g` in place of `--ipc=host`, from an image pinned by digest in `server.mjs`, so a moved tag never runs.
- The browsers have outbound internet and root, as in CI and Playwright's image; with `--no-sandbox` in `run-server` mode, a non-root user alone adds no sandbox.

## Pitfalls

- A Playwright `install` from an older release deletes the other releases' browsers from the shared `ms-playwright` cache. After `npm ci`, `npx playwright install chromium firefox webkit` puts the current release's browsers back. `run-job.mjs` avoids this: each image carries its own browsers.
- On Windows on ARM64, Playwright's Windows browsers and Chrome for Testing are x64 builds that run under emulation. The Playwright images are arm64 and need no emulation.
- The `unit` job overloads its runner unless it sets `--parallel=1` and `VITEST_MAX_WORKERS=2`. Nx runs three tasks at a time, so `test` and `test-storybook` overlap, and each opens `min(12, CPUs - 1)` Vitest pages in each of three engines, about 45 pages on 8 vCPUs. Peak memory reaches about 14.4 GiB and the job exceeds Vitest's 60 s browser connect timeout (always Firefox), its 15 s browser test timeout, or its 5 s Node test timeout. With both settings the job passed 8 of 8 runs, against 8 of 9 as found and 1 of 4 under a CPU quota, with peak memory about 8.7 GiB and no wall-clock cost. `--parallel=1` alone passed 2 of 4. `VITEST_MAX_WORKERS=2` overrides every Vitest project's `maxWorkers`, so set both only for this job; local runs keep their defaults.
- Hyper-V and WinNAT reserve port ranges on Windows, for example once Docker Desktop or WSL2 starts. A server that fails with `listen EACCES` on a fixed port (the e2e ports 4310 to 4314 and 4401, Storybook's 4400) sits in one; `netsh interface ipv4 show excludedportrange protocol=tcp` lists them. The Vitest browser servers pick a free port and are not affected.
- Git Bash rewrites arguments that look like POSIX paths. `run-job.mjs` starts Docker without a shell, but the command after `--` passes through Git Bash first: prefix the call with `MSYS_NO_PATHCONV=1` when that command holds an absolute path, or run it from PowerShell.
- The e2e ports are fixed (4310 to 4314 and 4401), so two native e2e runs, in two checkouts or two sessions, cannot overlap.
- Remove the volumes with `docker volume rm` and the names `docker volume ls -q -f name=ngx-yeti-run-job` lists.

## Measured runs

Measured on 2026-10-05 on Windows 11 on ARM64 with Docker Desktop (linux/arm64), at `ab9d11d`. Times are wall times; container runs include a first `npm ci` into empty volumes, and a later run of the same job with an unchanged lockfile skips it (19 s for `webkit-26-4`'s unit step).

| Job                                     | Run                                          | Time     | Counts                                                                                 |
| --------------------------------------- | -------------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| `floor.yml` `webkit-26-4`               | `run-job.mjs`, WebKit 26.4, Node 24.14.1     | 3 m 30 s | unit 163; `ngx-yeti-e2e` 12 passed, 4 skipped; `yeti-app-e2e` 81 passed, 2 skipped     |
| `floor.yml` `firefox-146-e2e`, 2 shards | `run-job.mjs`, Firefox 146.0.1, Node 24.13.0 | 3 m 39 s | shard 1: 8, then 38 passed, 4 skipped; shard 2: 8, then 32 passed, 9 skipped           |
| `ci.yml` `unit`                         | `run-job.mjs`, Node 24.20.0                  | 1 m 25 s | 526, 83, 39, 1 and 1 passed                                                            |
| `ci.yml` `e2e`, 6 combinations          | `run-job.mjs`, Node 24.20.0                  | 8 m 49 s | development: Chromium 79/4, Firefox 70/13, WebKit 81/2 (`yeti-app-e2e` passed/skipped) |
|                                         |                                              |          | production: Chromium 70/13, Firefox 61/22, WebKit 72/11                                |
| `floor.yml` `chromium-141`              | native, Chrome for Testing 141.0.7390.54     | 2 m 47 s | unit 163; `ngx-yeti-e2e` 16; `yeti-app-e2e` 79 passed, 4 skipped                       |
| `floor.yml` `firefox-145`               | native, Firefox 145.0                        | 37 s     | unit 163                                                                               |
| `ci.yml` `static`                       | native                                       | 39 s     | prettier clean; lint and typecheck pass                                                |
| `ci.yml` `package`                      | native                                       | 26 s     | build and pack-check pass                                                              |

The development e2e runs also pass `yeti-analog-e2e` (1) and `ngx-yeti-e2e` (16 in Chromium and Firefox, 12 passed and 4 skipped in WebKit, 14 and 2 since `fe50220`).

### Re-timed after the layouts and button items

Measured on 2026-10-14 on Windows 11 on ARM64 with Docker Desktop (linux/arm64), at `4d63e28`, one job at a time and each leg alone (`--legs 1`). Container times include the leg's setup. Every job passed with no retry.

| Job                                                    | Run                                                         | Time                  | Counts (passed/skipped)                                                         |
| ------------------------------------------------------ | ----------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------- |
| `ci.yml` `static` and the other checks                 | native, `npm run check -- --skip-nx-cache`                  | 1 m 31 s              | lint, typecheck, test and test-storybook pass                                   |
| `ci.yml` `package`                                     | native                                                      | 24 s                  | build and pack-check pass                                                       |
| `ci.yml` `unit` (at `131cf8e` plus the run-job change) | `run-job.mjs`                                               | 2 m 43 s              | 126/0, 504/0, 1715/0, 1/0 and 1/0; `node --test` 46/1                           |
| `ci.yml` `e2e`, 12 legs                                | `run-job.mjs --legs 1`, 3 local workers                     | 20 m 8 s              | below                                                                           |
| `ci.yml` `e2e` (firefox, development)                  | `run-job.mjs --legs 1 --e2e-workers 0`, as CI runs the leg  | 10 m 10 s             | `yeti-analog-e2e` 1; `ngx-yeti-e2e` 152/1; `yeti-app-e2e` 616/4                 |
| `floor.yml` `webkit-26-4`                              | `run-job.mjs`                                               | 7 m 3 s               | unit 507; `ngx-yeti-e2e` 136/17; `yeti-app-e2e` 608/12                          |
| `floor.yml` `firefox-146-e2e`, 2 shards                | `run-job.mjs --legs 1`                                      | 3 m 46 s and 2 m 53 s | shard 1: 76/1, then 308/2; shard 2: 76, then 308/2                              |
| `floor.yml` `firefox-145`                              | native, Firefox 145.0                                       | 1 m 17 s              | unit 507                                                                        |
| `floor.yml` `chromium-141`                             | native, `CI=true`, Chrome for Testing 141.0.7390.54         | 32 s and 11 m 51 s    | unit 507; `ngx-yeti-e2e` 152/1; `yeti-app-e2e` 618/2; Chromium exited by itself |
| `ci.yml` `nvda`                                        | native, no `BROWSERS` (Playwright's Chromium, then Firefox) | 6 m 27 s              | 22 passed, no retry                                                             |
| `ci.yml` `nvda` with `BROWSERS=msedge`                 | native arm64 Edge, not evidence for the job                 | 3 m 3 s               | 11 passed                                                                       |

The `node --test` step skips the dry-run output-folder check where Git cannot list the checkout, as in the local container leg, which has no `.git`; the pure `legPaths` test runs everywhere.

`e2e` legs at 3 local workers: development 3 m 7 s, 4 m 26 s and 4 m 8 s in Chromium, Firefox and WebKit (`yeti-analog-e2e` 1; `ngx-yeti-e2e` 152/1, 152/1 and 144/9; `yeti-app-e2e` 618/2, 616/4 and 612/8); production 1 m 40 s, 2 m 51 s and 2 m 27 s (559/61, 557/63 and 553/67); `tailwind-c1` and `tailwind-c2` 13 to 17 s each, 8 passed. The longest leg takes 10 m 10 s locally with one worker, under the 15 minutes at which a job gets a Playwright `--shard` axis, so `e2e` keeps one leg per engine and configuration.

### Concurrent legs and local workers

Measured on 2026-10-12 on Windows 11 on ARM64 with Docker Desktop (linux/arm64, the WSL VM at 12 GB and 8 CPUs), at `6ef6055`. Cold runs start with new `node_modules` volumes and a warm npm cache volume; warm runs reuse the volumes and skip setup. Peak memory is the summed `docker stats` usage of the run's containers, sampled every 3 s. Every run passed with the counts of the first row.

| Job                                     | Settings                             | Cold      | Warm                                           | Peak     |
| --------------------------------------- | ------------------------------------ | --------- | ---------------------------------------------- | -------- |
| `ci.yml` `e2e`, 6 legs                  | serial, 1 worker (before)            | 46 m 15 s | about 45 m 14 s (cold less the first `npm ci`) | 5.3 GiB  |
| `ci.yml` `e2e`, 6 legs                  | `--legs 2 --e2e-workers 0`           | 27 m 58 s | 26 m 24 s                                      | 7.9 GiB  |
| `ci.yml` `e2e`, 6 legs                  | `--legs 2 --e2e-workers 2`           |           | 17 m 52 s                                      | 8.2 GiB  |
| `ci.yml` `e2e`, 6 legs                  | `--legs 2 --e2e-workers 3` (default) |           | 16 m 29 s                                      | 8.4 GiB  |
| `floor.yml` `firefox-146-e2e`, 2 shards | serial (before)                      | 8 m 0 s   | about 7 m 24 s (derived as above)              | 5.9 GiB  |
| `floor.yml` `firefox-146-e2e`, 2 shards | `--legs 2` (default)                 | 4 m 25 s  | 3 m 54 s                                       | 10.2 GiB |

Counts in every `e2e` run: `yeti-analog-e2e` 1; `ngx-yeti-e2e` 129 passed and 1 skipped in Chromium and Firefox, 126 and 4 in WebKit; `yeti-app-e2e` development 521/90, 519/92 and 517/94, production 470/141, 468/143 and 466/145 (passed/skipped in Chromium, Firefox and WebKit), with no retry. `firefox-146-e2e`: shard 1 64, then 217 passed; shard 2 65, then 302 passed.

- A third concurrent leg was not tried: one leg peaks at up to 5.9 GiB, so three would pass the 12 GB VM beside another project's containers. The host also ran short of memory once during two concurrent `firefox-146-e2e` shards, while other processes ran; lower `--legs` when the host is short of memory.
- Three workers gained 8 % over two at 0.14 GiB more; Firefox legs gained nothing past two.
- Flake check at the defaults (`--legs 2`, 3 workers): `setup-boundaries`, `static-attributes`, `lift`, `enter` and `spinner` specs of `yeti-app-e2e` and `ngx-yeti-e2e` in Chromium, Firefox and WebKit with `--repeat-each=5 --retries=0`, the development and production legs at once: 425 passed and 25 skipped twice (`ngx-yeti-e2e`), 1740 passed and 1590 passed with 150 skipped (`yeti-app-e2e`), no failure, peak 7.2 GiB.
- The build-only Nx cache was dropped. The builds it could restore take 4 s (`yeti-css:yeti-build`), 12 s (`ngx-yeti:build-storybook`), 7 s (`yeti-app:build:development`) and 8 s (`yeti-app:build:production`) in a container, Nx start included: at most 23 s per development leg and 12 s per production leg, under 1 minute of the 16 m 29 s run, before the cost of restoring. The `e2e` targets are cacheable, so a shared cache would also need a guard that no `e2e`, `test` or `test-storybook` result replays.

### Remote engine runs

Measured on 2026-10-06 on Windows 11 on ARM64 with Docker Desktop (linux/arm64) and Playwright 1.63.0: `BROWSERS=remote-<engine> npm exec nx -- run-many -t test test-storybook e2e --skip-nx-cache` passes every project in each engine with the counts CI's emulated builds give (`ngx-yeti` 204 and 13 stories, `ngx-yeti-testing` 75, `ngx-yeti-e2e` 16, or 14 passed and 2 skipped in WebKit, `yeti-app-e2e` 82 passed and 2 skipped, `yeti-analog-e2e` 1), in about 2 minutes per engine on an idle machine, plus about 50 s for the first WebKit launch in a fresh container.
