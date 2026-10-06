# Run CI and floor jobs locally

Every job in `.github/workflows/ci.yml` and `.github/workflows/floor.yml` runs locally except `ci.yml` `safari`, which needs real Safari on macOS. Run commands from the repository root.

## Container jobs: run them from the workflow

`ci.yml` `unit` and `e2e` and `floor.yml` `webkit-26-4` and `firefox-146-e2e` run in a Playwright image. Run them with:

```sh
node tools/ci-local/run-job.mjs <workflow> <job> [--matrix key=value]... [--dry-run] [-- <command>...]
```

The script reads the job's `container` image, `env`, matrix and `run` steps from the workflow file. It refuses any workflow key, step, action input or expression it does not run, so a workflow change either reaches the local run or stops it with a message. For each matrix combination it:

- streams the working tree, uncommitted files included, into a fresh `--rm` container; the checkout is only read;
- keeps every `node_modules` folder the lockfile names, and the npm cache, in Docker volumes named `ngx-yeti-run-job-<checkout>-*`;
- reruns the setup steps (`npm ci`, `npm install --no-save ...`) only when a `package.json`, the lockfile, the image or those steps change;
- sets `CI=true` and `HOME=/github/home` as GitHub does, before the job's own `env`;
- fails if the image's Node major differs from `actions/setup-node`'s `node-version`;
- runs each step as `bash -e -c '<run>'`, as GitHub's default shell does, or the one command after `--` instead of the steps after setup;
- copies `dist/.playwright` (reports and traces) to the folder it prints, under the system temp folder.

Examples:

```sh
node tools/ci-local/run-job.mjs floor webkit-26-4
node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development
node tools/ci-local/run-job.mjs floor firefox-146-e2e --matrix shard=1
node tools/ci-local/run-job.mjs ci unit -- npx nx test ngx-yeti -- --project=browser
node tools/ci-local/run-job.mjs ci e2e --dry-run
```

Without `--matrix`, every combination runs in turn. A job without a `container` is refused; run it natively, below. Run one job at a time per checkout: two runs of the same job share its volumes. The script needs Docker and a `tar` that reads a NUL-separated list (Git Bash's or Windows').

## Jobs without a container: run them natively

| Job                        | Command                                                                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml` `static`          | `npx prettier --check .`, then `npm exec nx -- run-many -t lint typecheck`                                                                                                               |
| `ci.yml` `package`         | `npm exec nx -- run-many -t build pack-check`                                                                                                                                            |
| `floor.yml` `firefox-145`  | `FLOOR_FIREFOX=true npm exec nx -- test ngx-yeti -- --project=browser`; WebdriverIO downloads stock Firefox 145 and geckodriver                                                          |
| `floor.yml` `chromium-141` | `npx --no-install @puppeteer/browsers install chrome@<CHROME_FLOOR_VERSION> --path <dir>` prints `chrome@<version> <path>`; set `FLOOR_CHROMIUM_PATH=<path>` and run the job's two steps |

`CHROME_FLOOR_VERSION` is in `floor.yml`'s `env`. Add `--skip-nx-cache` to measure real work instead of a cache hit.

## Container jobs without Docker

- The three current engines: `BROWSERS=chromium,firefox,webkit npm exec nx -- run-many -t test test-storybook` and `CI=true npm exec nx -- run-many -t e2e -p <projects> -- --project=<engine>`, with `FIXTURE_CONFIGURATION=production` for the production e2e run. The e2e run keeps `CI=true` for the job's CI settings, which `BROWSERS` skips (below). Without `CI` or `BROWSERS`, the browser projects declare Chromium only.
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
- Under heavy CPU load, emulated Firefox on Windows on ARM64 can exceed Vitest's 15 s browser test timeout or its 60 s browser connect timeout. `--parallel=1` lightens the load.
- Hyper-V and WinNAT reserve port ranges on Windows, for example once Docker Desktop or WSL2 starts. A server that fails with `listen EACCES` on a fixed port (the e2e ports 4310 to 4312 and 4401, Storybook's 4400) sits in one; `netsh interface ipv4 show excludedportrange protocol=tcp` lists them. The Vitest browser servers pick a free port and are not affected.
- Git Bash rewrites arguments that look like POSIX paths. `run-job.mjs` starts Docker without a shell, but the command after `--` passes through Git Bash first: prefix the call with `MSYS_NO_PATHCONV=1` when that command holds an absolute path, or run it from PowerShell.
- The e2e ports are fixed (4310 to 4312 and 4401), so two native e2e runs, in two checkouts or two sessions, cannot overlap.
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

### Remote engine runs

Measured on 2026-10-06 on Windows 11 on ARM64 with Docker Desktop (linux/arm64) and Playwright 1.63.0: `BROWSERS=remote-<engine> npm exec nx -- run-many -t test test-storybook e2e --skip-nx-cache` passes every project in each engine with the counts CI's emulated builds give (`ngx-yeti` 204 and 13 stories, `ngx-yeti-testing` 75, `ngx-yeti-e2e` 16, or 14 passed and 2 skipped in WebKit, `yeti-app-e2e` 82 passed and 2 skipped, `yeti-analog-e2e` 1), in about 2 minutes per engine on an idle machine, plus about 50 s for the first WebKit launch in a fresh container.
