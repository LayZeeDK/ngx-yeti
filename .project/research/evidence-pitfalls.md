# Evidence — pitfalls

Dimension: pitfalls
Questions assigned: Whether npm 11 allow-scripts withholding nx, esbuild, and msgpackr-extract install scripts breaks build, Storybook, or Playwright paths, and whether approvals should be committed.

## Finding: Under npm 11.16 allow-scripts is advisory; the scripts ran, so the codebase map's "withheld" is a misreading

- **Claim**: In npm 11 (docs at /cli/v11/) the feature is "advisory: install scripts still run by default, but installs print a list of packages whose scripts have not been reviewed". A fresh `npm ci` in a disposable worktree at 5a279bd with npm 11.16.0 printed the warning `9 packages have install scripts not yet covered by allowScripts` and the scripts did run: `node_modules/msgpackr-extract/build/Release/extract.*` exists (a node-gyp compile, there is no win32-arm64 prebuild package) and `msgpackr-extract` loads. The same install with npm 12.2.0 printed `install scripts blocked` and left no `build/` directory.
- **Source**: https://docs.npmjs.com/cli/v11/commands/npm-approve-scripts (fetched via WebFetch; summarised); runtime: `npm ci` in worktree `wt` (npm 11.16.0, Node 24.18.0, Windows 11 ARM64), logs in the scratchpad `npmci.log`; `ls node_modules/msgpackr-extract/build`. Checked by running.
- **Confidence**: high
- **Why it matters here**: The mapper's finding says npm 11.16.0 withheld the scripts. It only warned. Real blocking starts with npm 12 (next finding), so "does withholding break us" is a question about npm 12 and later, not about today's setup-node npm.

## Finding: npm 12 blocks dependency install scripts by default; npm 12.2.0 is `latest` on the registry

- **Claim**: npm 12.0.0 (released 2026-07-08) made dependency lifecycle scripts blocked unless the root package's `allowScripts` policy allows them, and raised the minimum Node to `^22.22.2 || ^24.15.0 || >=26.0.0`. It also made unknown `.npmrc` keys and CLI flags errors. `npm view npm dist-tags` returned `latest: 12.2.0` (published 2026-09-30) and `next-11: 11.21.0`. Warnings were announced as available from npm 11.16.0. The command names differ: 11.16 has `npm approve-scripts` and `--allow-scripts-pending`; the 12.2.0 warning text names `npm install-scripts ls` and `npm install-scripts approve <pkg>`.
- **Source**: https://github.com/npm/cli/releases/tag/v12.0.0 (fetched via WebFetch); https://github.blog/changelog/2026-06-24-upcoming-breaking-changes-for-npm-v12/ (fetched via WebFetch); `npm view npm dist-tags --json` and `npm view npm time --json` (run); npm 12.2.0 install log (run). Checked: behaviour and dates. Not verified: exact command spelling (read from a release summary and one run).
- **Confidence**: medium
- **Why it matters here**: A contributor who runs `npm install -g npm@latest` gets blocking today, and a lockfile-only `npm ci` on a new machine would hit it. CI is not affected until its npm moves to 12 (next finding).

## Finding: CI's npm comes from Node 24; Node 24.21.0 bundles npm 11.19.0

- **Claim**: `.github/workflows/ci.yml` and `floor.yml` use `actions/setup-node@v7` with `node-version: 24`, then plain `npm ci`, with no npm upgrade step, no `.npmrc`, and no `allowScripts` or `packageManager` field in the repo. The Node dist index lists v24.21.0 (2026-09-07, LTS Krypton) with npm 11.19.0, v26.10.0 with npm 11.19.1, and v25.9.0 with npm 11.12.1. So a CI run on Node 24 uses an npm 11.x. I did not run an npm 11.19 install, so I did not confirm it stays advisory. The v11 doc page is advisory and the v12 release notes describe blocking as the v12 change.
- **Source**: `.github/workflows/ci.yml:17-22,40-44`, `floor.yml:24-29,49-54,68-73,93-98` (read); https://nodejs.org/dist/index.json (fetched with curl); `.npmrc` absent and `package.json` has no `allowScripts`/`packageManager` (checked in the main checkout). Checked: the workflow lines and the Node dist index. Inferred: setup-node resolving `24` to the latest 24.x (its semantics were not opened).
- **Confidence**: medium
- **Why it matters here**: Today's CI shows no blocking. The risk is a future Node major or a manual npm upgrade that brings npm 12.

## Finding: Approvals live in an `allowScripts` field of the root `package.json`; `npm approve-scripts` writes it, pinned by default

- **Claim**: The doc says approvals are recorded in the `allowScripts` field of the project's `package.json`, and `npm approve-scripts` is "the recommended way to maintain that field". Entries are pinned `pkg@1.2.3` by default; `--no-allow-scripts-pin` writes name-only entries. For global or project-less use, settings go in `npm config` at user level. The 11.16 config list shows `allow-scripts`, `allow-scripts-pending`, `allow-scripts-pin=true`, `strict-allow-scripts=false`, `dangerously-allow-all-scripts=false`. The GitHub changelog says the resulting allowlist is written to `package.json` and should be committed.
- **Source**: https://docs.npmjs.com/cli/v11/commands/npm-approve-scripts (WebFetch); `npm approve-scripts --help` and `npm config list -l` (run, npm 11.16.0); the changelog URL above. Checked: the field location. Not verified: exact pin semantics (I did not run approve-scripts).
- **Confidence**: medium
- **Why it matters here**: Committed approvals are the intended mechanism. With default pinning, a version bump of nx or esbuild invalidates its entry, and the lockfile resolves several esbuild versions (see next finding), so pinned entries must cover each.

## Finding: The warning lists 9 packages, not 3: three esbuild versions, lmdb, @parcel/watcher, geckodriver, edgedriver

- **Claim**: `npm ci` at 5a279bd lists `esbuild@0.25.12`, `esbuild@0.27.7`, `esbuild@0.28.2`, `nx@23.2.1`, `msgpackr-extract@3.0.4`, `lmdb@3.5.6`, `@parcel/watcher@2.6.0`, `geckodriver@6.1.1`, `edgedriver@6.3.1`. The brief and the map named three.
- **Source**: `npmci.log` and `npmci12.log` from the disposable worktrees (run).
- **Confidence**: high
- **Why it matters here**: A policy that approves only nx, esbuild, and msgpackr-extract still leaves six entries flagged. Each needs an explicit allow or deny in a committed policy.

## Finding: nx postinstall is non-critical; esbuild and msgpackr-extract/lmdb have working fallbacks

- **Claim**: nx 23.2.1 `postinstall` runs `dist/bin/post-install`, which only asserts a supported platform and, if Nx Cloud is used, verifies or updates the cloud client; it swallows every error, has a 30 s kill timer and always exits 0. esbuild 0.28.2 `postinstall: node install.js` validates the platform binary and, off Windows and not Yarn, replaces the `bin/esbuild` shim with the native binary as an optimisation; on Windows it does nothing of that kind (`os.platform() !== "win32"` guard), and the platform binary comes from the `@esbuild/*` optional dependency (`@esbuild/win32-arm64` present). msgpackr-extract's `install` is `node-gyp-build-optional-packages`; it is an optional accelerator, its loader error was `No native build was found for platform=win32 arch=arm64`, and `msgpackr` pack/unpack still worked from JS (`{ a: 1 }` round trip). lmdb's `install` is the same tool; with scripts blocked `require('lmdb')` still loaded from `@lmdb/lmdb-win32-arm64`. @parcel/watcher's script does work only when `npm_config_build_from_source=true`.
- **Source**: `node_modules/{nx,esbuild,msgpackr-extract}/package.json` scripts (read, 5a279bd install); `nx/dist/bin/post-install.js`, `esbuild/install.js:215-235`, `@parcel/watcher/scripts/build-from-source.js` (read); load tests in the npm 12 install (run). Checked: behaviour on this machine (Windows ARM64, Node 24.18). Inferred: other platforms; on Linux x64 the skipped esbuild optimisation is only a startup-time speedup (read from the code, not benchmarked).
- **Confidence**: medium
- **Why it matters here**: None of the three scripts is required for correctness on the platforms the repo uses. The only functional loss I could see from blocking is msgpackr's native accelerator and Nx Cloud client verification.

## Finding: With all 9 scripts blocked (npm 12.2.0), build, Storybook build, Nx test, and Playwright CLI all work

- **Claim**: In a worktree installed with npm 12.2.0 (scripts blocked, `msgpackr-extract/build` absent), with `NX_DAEMON=false NX_NO_CLOUD=true --skip-nx-cache`: `npx nx build ngx-yeti` exit 0, `npx nx build-storybook ngx-yeti` exit 0 (incl. its dependency task), `npx nx build yeti-app` exit 0, `npx nx test ngx-yeti` (Vitest browser, Chromium) exit 0, `npx playwright --version` printed `Version 1.63.0`. Not run: `test-storybook`, Firefox/WebKit/Safari variants, and the Yeti-pinned floor jobs. The same `nx build` family was not repeated under npm 11 install.
- **Source**: runtime logs `b12-build.log`, `b12-sb.log`, `b12-app.log`, `b12-test.log` in the scratchpad; command lines above. Checked: these commands on Windows ARM64 / Node 24.18. Not verified: Linux/macOS (not run, so Linux esbuild and the Safari `webdriverio` path are unverified).
- **Confidence**: low
- **Why it matters here**: Direct answer: blocking does not break the build, Storybook, or Playwright CLI here.

## Finding: Playwright e2e could not start in the disposable worktree under either install, so it is not an allow-scripts effect

- **Claim**: `nx e2e yeti-app-e2e` and `nx e2e ngx-yeti-e2e` both failed at Playwright's `webServer` with `'nx' is not recognized as an internal or external command`, before any test ran. This happened identically in the npm 11.16 install (scripts run) and the npm 12.2.0 install (scripts blocked), via `npx nx` and `npm exec -- nx`. The configs start the server with `command: 'npx nx run ...'` (`apps/yeti-app-e2e/playwright.config.mts:26`, `apps/ngx-yeti-e2e/playwright.config.mts:17`). I did not find the cause; `node_modules/.bin/nx.cmd` exists. Candidate causes I did not test: the worktree sits under the C: Temp directory with an 8.3 short path, or Git Bash PATH handling on Windows.
- **Source**: `b12-e2e.log`, `b11-e2e.log`, `b12-e2e2.log`, `b12-e2e3.log` in the scratchpad; the two config lines above. Checked: the failure is independent of install scripts (same result under both installs). Not verified: the cause.
- **Confidence**: low
- **Why it matters here**: Playwright e2e paths are `unverifiable` for the blocked-scripts question by running. A planner should not read the failure as evidence about allow-scripts, and local e2e on this Windows ARM64 machine may need its own check.

## Finding: Webdriver driver packages are in the warning list but are not exercised by the default path

- **Claim**: `geckodriver@6.1.1` and `edgedriver@6.3.1` have postinstalls that run `dist/install.js` to fetch driver binaries. After npm 11.16 (scripts run) and npm 12.2.0 (blocked) the `node_modules/{geckodriver,edgedriver}/bin` folders contained only the JS launchers, so no difference was visible. The repo's `vitest.unit.config.mts` mentions safaridriver only for a real-Safari runner; I did not run the `FLOOR_FIREFOX` or `SAFARI` paths.
- **Source**: `ls` of both worktrees' `node_modules/geckodriver/bin` and `edgedriver/bin` (run); `node_modules/geckodriver/dist/install.js` head (read); `packages/ngx-yeti/vitest.unit.config.mts:27` (read). Not verified: the downstream WebdriverIO paths were not run.
- **Confidence**: low
- **Why it matters here**: The floor and Safari jobs are where blocked driver installs could matter; that is the one path I cannot rule out.

## Assigned questions — answers

- Whether npm 11 allow-scripts withholding nx, esbuild, and msgpackr-extract install scripts breaks build, Storybook, or Playwright paths, and whether approvals should be committed. → (a) Premise correction: under npm 11.16 the feature only warns and the scripts ran (msgpackr-extract compiled; docs say advisory); blocking is npm 12 (released 2026-07-08, 12.2.0 is `latest`), and the warning covers 9 packages, not 3. (b) With every script blocked (npm 12.2.0) on Windows ARM64, `nx build ngx-yeti`, `nx build-storybook ngx-yeti`, `nx build yeti-app`, `nx test ngx-yeti`, and `playwright --version` all succeeded; the nx postinstall is non-critical, esbuild gets its binary from the `@esbuild/*` optional package, and msgpackr-extract/lmdb fall back (msgpackr to pure JS). Playwright e2e could not start in the scratch worktree under either npm version (`'nx' is not recognized`), so e2e and the WebdriverIO floor paths are unverified for this question. (c) On committing approvals: the documented mechanism is an `allowScripts` field in the root `package.json` written by `npm approve-scripts`, and npm's announcement says to commit it; whether to do so is a decision for decide. Evidence for it: npm 12 blocks by default, `allowScripts` is the only documented persistent setting, and entries are version-pinned by default. Evidence against urgency: CI uses Node 24 (npm 11.19.0 bundled in 24.21.0), and no blocked path broke here. Sources: findings above.

## Dead ends

- npm's own docs pages for the introducing version — the v11 doc page does not state which version introduced allow-scripts; the GitHub changelog says warnings arrive in npm 11.16.0.
- `www.npmjs.com` pages — known blocked, not tried; used docs.npmjs.com, the registry CLI, and GitHub instead.
- Running `approve-scripts` to inspect the written `package.json` shape — not run, so the exact pinned entry format is unobserved.
- Deleting `node_modules` in the first worktree to reinstall with npm 12 — blocked by the guard hook (destructive commands); used a second worktree (`research-pitfalls-scratch-12`, outside the brief's single branch) instead. Both worktrees and both branches were removed; `git worktree list` shows only the main checkout.
- Explaining the Playwright `webServer` `nx` lookup failure — not investigated further.
