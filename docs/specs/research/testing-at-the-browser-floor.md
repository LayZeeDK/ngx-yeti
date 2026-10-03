# Research: testing at the browser floor (Chrome and Edge 141, Firefox 145, Safari 26.2)

Ticket: [27](../issues/27-research-testing-at-the-browser-floor.md). Date: 2026-10-01. Model: Claude Opus 5.5. Decides nothing; the testing decision chooses.

The floor is [ADR 0002](../adr/0002-browser-target-baseline-2025.md): Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2.

Labels used below:

- **Measured**: run on this machine in this session, with the script and output named.
- **Read**: taken from a cited source (registry metadata, package source, docs, repository files).
- **Inferred**: reasoned from measured or read facts, not run.

All probes live under `D:/tmp/ngx-yeti-27/`. The machine is Windows 11 on ARM64 (Snapdragon X Elite). Docker Desktop 29.7.2 runs `linux/arm64` containers natively (measured: `docker version` reported `linux/arm64 29.7.2`; the container's `uname -m` printed `aarch64`).

## 1. Findings in brief

| Question | Answer | Label |
| --- | --- | --- |
| Playwright release whose Chromium is at the floor | **1.56.0 / 1.56.1**: Chromium 141.0.7390.37 | Measured (`browsers.json`) |
| Playwright release whose Firefox is at the floor | **None.** 1.57.0 ships Firefox 144.0.2, 1.58.x ships 146.0.1; no release ships 145 | Measured (`browsers.json`) |
| Playwright release whose WebKit matches Safari 26.2 | **None can be named.** Playwright labels WebKit "26.0" from 1.54 to 1.58 and "26.4" from 1.59. Its "26.0" build (1.56.1, r2215) already supports invoker commands, which Safari has only from 26.2, so the label does not track a Safari release | Measured (probe), read (web-features via ticket 01) |
| Can Playwright run a specific Chrome for Testing version? | **Yes.** `chromium.launch({ executablePath })` with Chrome for Testing 141.0.7390.54 (win64, under x64 emulation) passed every probe step with Playwright 1.63.0 and with 1.56.1. Playwright printed nothing about the version | Measured |
| Can Playwright drive a stock Firefox 145? | **Only partly.** The `moz-firefox` channel (WebDriver BiDi, not in the public docs) worked with Playwright 1.57.0 except colour-scheme emulation. 1.56.1 did not launch it; 1.58.2 and 1.63.0 fail on BiDi commands Firefox 145 lacks | Measured |
| WebdriverIO in Vitest browser mode at the floor | **Chrome 141 and Firefox 145: yes.** Edge: the pin was ignored, and the test ran on the installed Edge 154 | Measured |
| Safari 26.2 | Needs macOS. No GitHub-hosted macOS image ships 26.2; all ship 26.5 or newer, and Safari cannot be pinned on a runner | Read, inferred |
| An older Playwright with Vitest 4.1.x | Vitest 4.1.11 browser mode with Playwright 1.56.1 passed the probe test | Measured |
| Two or more Playwright versions in one workspace | Four versions coexisted as npm aliases, each with its own browser revisions in one cache | Measured |

## 2. Playwright releases and their engines

### 2.1 Table

Measured: `D:/tmp/ngx-yeti-27/browsers-table.sh` runs `npm pack playwright-core@<v>` for each version and reads `package/browsers.json` (`browsers-table.mjs`). Release dates are the registry's `time` field (https://registry.npmjs.org/playwright-core). Release notes agree for 1.56 to 1.59 (read: https://github.com/microsoft/playwright/releases/tag/v1.56.0, `/v1.57.0`, `/v1.58.0`, `/v1.59.0`).

| Playwright | Published | Chromium (revision) | Firefox (revision) | WebKit label (revision) | Floor engines it holds |
| --- | --- | --- | --- | --- | --- |
| 1.53.2 | 2025-06-30 | 138.0.7204.23 (1179) | 139.0 (1488) | 18.5 (2182) | - |
| 1.54.2 | 2025-08-01 | 139.0.7258.5 (1181) | 140.0.2 (1489) | 26.0 (2191) | - |
| 1.55.0 | 2025-08-20 | 140.0.7339.16 (1187) | 141.0 (1490) | 26.0 (2203) | - |
| 1.55.1 | 2025-09-23 | 140.0.7339.186 (1193) | 141.0 (1490) | 26.0 (2203) | - |
| 1.56.0 | 2025-10-06 | **141.0.7390.37** (1194) | 142.0.1 (1495) | 26.0 (2215) | Chromium 141 |
| 1.56.1 | 2025-10-17 | **141.0.7390.37** (1194) | 142.0.1 (1495) | 26.0 (2215) | Chromium 141 |
| 1.57.0 | 2025-11-25 | 143.0.7499.4 (1200) | **144.0.2** (1497) | 26.0 (2227) | Firefox one below the floor |
| 1.58.0 | 2026-01-23 | 145.0.7632.6 (1208) | **146.0.1** (1509) | 26.0 (2248) | Firefox one above the floor |
| 1.58.2 | 2026-02-06 | 145.0.7632.6 (1208) | 146.0.1 (1509) | 26.0 (2248) | as 1.58.0 |
| 1.59.1 | 2026-04-01 | 147.0.7727.15 (1217) | 148.0.2 (1511) | 26.4 (2272) | - |
| 1.60.0 | 2026-05-11 | 148.0.7778.96 (1223) | 150.0.2 (1522) | 26.4 (2287) | - |
| 1.61.1 | 2026-06-23 | 149.0.7827.55 (1228) | 151.0 (1532) | 26.5 (2311) | - |
| 1.62.1 | 2026-07-30 | 151.0.7922.34 (1234) | 153.0 (1538) | 26.5 (2336) | - |
| 1.63.0 | 2026-09-04 | 153.0.8010.12 (1243) | 155.0 (1543) | 26.6 (2359) | - (the toolchain's current release) |

Notes:

- `chromium-headless-shell` carries the same version and revision as `chromium` in every row (measured).
- 1.58 is the first release whose notes name tested branded channels (Chrome and Edge 144); 1.59 names Chrome and Edge 146 (read: release notes above).
- The WebKit `browserVersion` is a label Playwright sets, while the revision is a WebKit trunk build. Six revisions from 2191 to 2248 all carry "26.0" (measured). The label cannot be matched to a Safari point release (inferred).

### 2.2 The engines nearest the floor

- **Chrome and Edge 141:** Playwright 1.56.0 or 1.56.1 (Chromium 141.0.7390.37). Edge has no Playwright build; Chromium 141 stands in for the engine, not for Edge's own features (inferred).
- **Firefox 145:** no exact match. 1.57.0 (Firefox 144.0.2) is one below and 1.58.x (146.0.1) is one above. Firefox 144 already has invoker commands (web-features core support F144, read in [ticket 01's research](browser-baseline-vs-yeti.md), section 9), and the probe passed on it (measured, section 6).
- **Safari 26.2:** no Playwright WebKit build corresponds (section 4).

### 2.3 Older Playwright with the toolchain

- **Vitest 4.1.x browser mode (measured):** `@vitest/browser-playwright@4.1.11` with `playwright@1.56.1` ran the Yeti dialog test in Chromium 141.0.7390.37 and passed (exit 0, `D:/tmp/ngx-yeti-27/vitest-probe/logs/pw-chromium141.log`). The provider's peer range is `playwright: "*"` (read: https://registry.npmjs.org/@vitest/browser-playwright, version 4.1.11, printed by `D:/tmp/ngx-yeti-27/peers.mjs`).
- **Angular 22.2 (read, not run):** `@angular/build@22.2.1` declares no Playwright peer; its Vitest range is `^4.0.8 || ^5.0.0` (https://registry.npmjs.org/@angular/build). Its unit-test builder picks the first of `@vitest/browser-playwright`, `@vitest/browser-webdriverio`, `@vitest/browser-preview` that resolves, Playwright first (read by a research subagent: https://github.com/angular/angular-cli/blob/v22.2.1/packages/angular/build/src/builders/unit-test/runners/vitest/browser-provider.ts). So it does not constrain the Playwright version (inferred). An Angular 22.2 workspace was not run against Playwright 1.56 here.
- **Storybook 10.6 (read, not run):** `@storybook/addon-vitest@10.6.1` peers on `@vitest/browser-playwright ^4.0.0 || ^5.0.0` and on no Playwright version (https://registry.npmjs.org/@storybook/addon-vitest). Not run with Playwright 1.56.
- **Platform:** Playwright resolves every Windows host, ARM64 included, to its `win64` downloads (read: `playwright-core@1.56.1` `lib/server/utils/hostPlatform.js:103`; 1.63.0 lists only `win64` paths, `lib/coreBundle.js:32975-33115`). Every Playwright browser here is an x86-64 binary run under emulation (measured with `file` on `chrome.exe`, `firefox.exe`, and `Playwright.exe`). Playwright names arm64 only for Linux (read: https://playwright.dev/docs/intro).

### 2.4 Several Playwright versions in one workspace

Measured in `D:/tmp/ngx-yeti-27/probe/package.json`: `pw156` = `npm:playwright@1.56.1`, `pw157` = `1.57.0`, `pw158` = `1.58.2`, `pw163` = `1.63.0`. `npm install` resolved each alias to its own `playwright-core` (1.56.1 hoisted, the others nested). Each alias's `cli.js install` put its browsers in one `PLAYWRIGHT_BROWSERS_PATH` under revision-named folders (`chromium-1194`, `firefox-1495`, `firefox-1497`, `firefox-1509`, `webkit-2215`, `webkit-2248`), so they do not collide (`D:/tmp/ngx-yeti-27/install.log`).

Inferred, not run: `@vitest/browser-playwright` imports the bare `playwright` name, so Vitest uses whichever version `playwright` resolves to, and an aliased second version serves only code that imports the alias. `@playwright/test` pins `playwright` exactly (`@playwright/test@1.56.1` depends on `playwright: "1.56.1"`, read from the registry), so a second test runner version needs its own alias or package.

## 3. Branded channels, Chrome for Testing, and stock Firefox

### 3.1 `channel` and pinned versions

- `channel` picks an installed branded browser (`chrome`, `msedge`, and their `-beta`, `-dev`, `-canary` forms), not a version. "The current Playwright version will support Stable and Beta channels" (read: https://playwright.dev/docs/browsers). On this machine `msedge` is Edge 154.0.4258.48 (measured: file version of `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`).
- A pinned version reaches Playwright through `launchOptions.executablePath` (or `chromium.launch({ executablePath })`), not through `channel` (measured, 3.2).

### 3.2 Chrome for Testing 141 (the user's question "Could Playwright run a specific Chrome for Testing version?")

- Chrome for Testing lists 62 builds of 141, from 141.0.7390.0 to 141.0.7390.122, for `linux64`, `mac-arm64`, `mac-x64`, `win32`, and `win64` (measured from https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json, saved as `D:/tmp/ngx-yeti-27/cft-known-good.json`). There is **no `linux-arm64` and no `win-arm64` build of 141**: the first `linux-arm64` build in the list is 153.0.8001.0 (measured, same file).
- Downloaded with `npx @puppeteer/browsers install chrome@141.0.7390.54` (`@puppeteer/browsers` 3.2.3) from Google's bucket into `D:/tmp/ngx-yeti-27/cft/` (measured, `install.log`). The binary is x86-64 (measured with `file`).
- **Route 1, `executablePath` (measured):** `chromium.launch({ headless: true, executablePath })` with Playwright 1.63.0 reported `browser.version()` 141.0.7390.54 and passed every step: `light-dark()` resolved and flipped with the colour scheme, invoker commands opened the dialog by keyboard and by click, `:modal` matched, Escape closed it, focus returned, and `yeti:open` and `yeti:close` fired twice each. Playwright 1.56.1 with the same binary gave the same result. Both runs wrote nothing to stderr, so Playwright reported nothing about an unsupported version (`D:/tmp/ngx-yeti-27/probe/results2.jsonl`, rows `pw1.63.0-cft141`, `pw1.56.1-cft141`; empty `stderr-*.txt`). Playwright drives it over CDP, and every step the probe uses worked. Newer Playwright features that need newer CDP domains were not tested (inferred risk).
- **Route 2, linux-arm64 in Docker (measured, changed):** Chrome for Testing has no linux-arm64 build of 141, so that route does not exist. The nearest native arm64 route is Playwright's own image `mcr.microsoft.com/playwright:v1.56.1-noble`. It is a multi-arch image, and the arm64 variant was pulled (measured: `docker image inspect` gave `linux/arm64`). It ran the probe in `aarch64` with Chromium 141.0.7390.37 (all steps passed), Firefox 142.0.1, and WebKit 26.0 (r2215), the same results as on Windows (`D:/tmp/ngx-yeti-27/docker-probe.sh`, `probe/results-docker.jsonl`). This is Playwright's Chromium build, not Chrome for Testing (read: the image's `/ms-playwright` held `chromium-1194`).
- **Edge 141 (not obtained):** Playwright and WebdriverIO both need an installed Edge at that version. Microsoft offers older builds on the Edge for Business download page and a rollback (`ALLOWDOWNGRADE=1` MSI, or the rollback policy), which it calls a temporary fix that "risks exposure to known security issues" (read by a research subagent: https://www.microsoft.com/en-us/edge/business/download, https://learn.microsoft.com/en-us/deployedge/edge-learnmore-rollback). Installing it would downgrade this machine's system Edge, so it was not tried. The same `executablePath` route would apply to an Edge 141 binary (inferred).

### 3.3 Firefox 145

- Mozilla's archive has Firefox 145.0 for `win64-aarch64` as an installer only (read: https://archive.mozilla.org/pub/firefox/releases/145.0/win64-aarch64/en-US/). It was downloaded, checked against `SHA256SUMS` (match: `47960d90...c477`), and unpacked with the installer's `/ExtractDir=` switch, without a system install (measured: `D:/tmp/ngx-yeti-27/get-firefox.sh`). That binary is native ARM64 (measured with `file`).
- Playwright's own Firefox is a patched build: "Playwright doesn't work with the branded version of Firefox since it relies on patches" (read: https://playwright.dev/docs/browsers). Its registry also has `moz-firefox`, `moz-firefox-beta`, and `moz-firefox-nightly` channels that drive a stock Firefox over WebDriver BiDi (read: `playwright-core@1.63.0` `lib/coreBundle.js:33282-33296`). Playwright's own BiDi tests use them with `browserName: 'firefox'`, `channel: 'moz-firefox'`, and `launchOptions.executablePath` (read: https://github.com/microsoft/playwright/blob/main/tests/bidi/playwright.config.ts, `browserToChannels` and the project `use` block). They are not in the public channel list (read: https://playwright.dev/docs/browsers).
- Measured with stock Firefox 145.0 (ARM64), `D:/tmp/ngx-yeti-27/probe/results2.jsonl`:

| Playwright | Result with `channel: 'moz-firefox'` and `executablePath` |
| --- | --- |
| 1.56.1 | Launch failed. It started Firefox with `-juggler-pipe` (the patched-build protocol), and the browser closed |
| 1.57.0 | Launched (`browser.version()` 145.0). Invoker commands, modal, Escape, focus return, events, and the focus ring all worked. **`emulateMedia({ colorScheme })` had no effect**: the body colour stayed the dark value in both schemes |
| 1.58.2 | `browser.newPage`: "Protocol error (emulation.setScreenSettingsOverride): unknown command" |
| 1.63.0 | `browser.newPage`: "Protocol error (browser.setDownloadBehavior): unknown command". 1.63.0 sends that command on every new context (read: `lib/coreBundle.js:42537-42541`) |

- So a stock Firefox 145 runs under Playwright only with a release from its own time, and then only partly (inferred from the table). Under WebdriverIO, which uses geckodriver, it ran fully (section 6).

## 4. Safari 26.2

- **Which Playwright WebKit corresponds:** none can be named. Safari 26.2 shipped on 2025-12-12, the date web-features gives invoker commands its Baseline low status with Safari as the last browser (read: [ticket 01's research](browser-baseline-vs-yeti.md), section 5.1). The Playwright builds from around that time are 1.57.0 (r2227, 2025-11-25) and 1.58.x (r2248, 2026-01-23), both labelled "26.0" (measured).
- **Playwright's WebKit is ahead of the Safari of the same label (measured):** the "26.0" build in 1.56.1 (r2215) supports invoker commands and opened the Yeti dialog by them. Web-features gives Safari support for invoker commands only from 26.2 (read: ticket 01, section 9, `invoker-commands` row: S26.2). So a pass in Playwright's WebKit does not show a pass in a Safari release; it shows the WebKit trunk had the feature (inferred).
- **On this machine:** Playwright's WebKit on Windows is an x86-64 build run under emulation (measured), and it reports a macOS Safari user agent (measured: `Version/26.0 Safari/605.1.15`). Real Safari needs macOS or iOS: Playwright's docs say it does not drive branded Safari (read: https://playwright.dev/docs/browsers), and `safaridriver` ships only with macOS (read: https://webdriver.io/docs/driverbinaries).
- **GitHub-hosted macOS images (read by a research subagent from `images/macos/*-Readme.md` in https://github.com/actions/runner-images, last macos-26-arm64 change seen 2026-09-11):**

| Image | Safari |
| --- | --- |
| macos-14 (x64), marked for deprecation | 26.5 |
| macos-14-arm64 | 26.6 |
| macos-15 (x64) | 26.6 |
| macos-15-arm64 | 26.6.1 |
| macos-26 (x64) | 26.6 |
| macos-26-arm64 | 26.6.2 |
| xcode-27-arm64 (macOS 27) | 27.0 |

- None ships Safari 26.2. Safari updates with the image's macOS, so a runner cannot be pinned to 26.2 (inferred; no source describes a way). Safari 26.2 itself would need a macOS install held at that update, on owned hardware or a cloud device grid (inferred; see section 5 for the grids).
- **How close Playwright's WebKit is for Yeti's features (inferred, partly measured):** every feature in ticket 01's section 5.1 with Safari support at or below 26.2 is in WebKit trunk builds from 2025 onwards, so Playwright's WebKit will run them. Two measured probes agree for `light-dark()` and invoker commands. What it cannot show is a Safari regression or a feature that WebKit trunk has and Safari 26.2 lacks, as invoker commands in Safari 26.0 to 26.1 show. Of Yeti's guarded features, anchor positioning (S27 per ticket 01, section 9) and scroll-driven animations (S26) differ between WebKit trunk and Safari releases most (inferred).

## 5. What other projects do

A research subagent read these from shallow clones (short SHAs given) and public vendor pages, read-only. Every row is read unless marked. I re-checked two rows myself with `gh api`: Angular components' `test/karma-browsers.json` (Safari 26.0 on OS X Tahoe) and Tailwind's Lightning CSS `targets` (`packages/@tailwindcss-node/src/optimize.ts`: Safari and iOS 16.4, Firefox 128, Chrome 111).

| Project | Stated floor | What CI runs | Static checks |
| --- | --- | --- | --- |
| Angular (`angular/angular@8608325`) | Baseline widely available, dated per major (v22: 2026-05-07), `adev/src/content/reference/versions.md:73-91` | Bazel `web_test` to `rules_browsers` WTR with hermetic Chromium (156.0.8075.0 at the pinned module) and Firefox, the latest at release (`tools/bazel/web_test.bzl:2,22-27`; `rules_browsers` `browsers/private/versions/chromium.bzl:6`, `README.md:27-33`). `scripts/test/run-saucelabs-tests.sh` remains but builds a `tools/saucelabs-daemon` that no longer exists (stale, inferred) | None found |
| Angular components (`angular/components@df491fe`) | Last two versions of Chrome, Firefox, Safari, Edge (`README.md:62-64`) | Chrome and Firefox through Bazel and WTR at `rules_browsers` defaults; **one pinned older Safari, 26.0 on Tahoe, on BrowserStack** in a PR and main job (`.github/workflows/pr.yml:147-166`, `ci.yml:180-196`, `test/karma-browsers.json:2-8`, `karma-browserstack-launcher`) | None found |
| Lit (`lit/lit@01dbc66`) | Current Chromium, Safari, Firefox, plus two majors back for Chromium and Safari and Firefox ESR (lit.dev `docs/v3/tools/requirements.md:14,47,51`) | Playwright's bundled chromium, firefox, webkit (`preset:local`, `.github/workflows/tests.yml:58-68`). A Sauce preset (Firefox 102, Chrome latest-2, Safari latest) exists in `packages/tests/src/web-test-runner.config.ts:43-47` but no workflow uses it. Polyfill injection tested (`:194-214`) | None found |
| Open Props (`argyleink/open-props@530682d`) | browserslist `defaults` (`package.json:245-247`) | No browser tests; `ava` checks build output | postcss-preset-env transforms against browserslist (`postcss.config.cjs:14-30`) |
| Tailwind CSS (`tailwindlabs/tailwindcss@fa81d69`) | Chrome 111, Safari 16.4, Firefox 128 (tailwindcss.com `src/docs/compatibility.mdx:8-12`) | Playwright's bundled engines on Windows, Linux, macOS-15; WebKit skipped on Windows (`.github/workflows/ci.yml:24-33,109-113`, `packages/tailwindcss/playwright.config.ts:34-50`) | Lightning CSS `targets` at the floor (`optimize.ts:46-53`) |
| Web Awesome (`shoelace-style/webawesome@e99dc5e`) | Latest two majors of Chrome, Safari, Edge, Firefox, Opera (`docs/docs/resources/browser-support.md:7`) | Playwright chromium and firefox; WebKit only outside CI (`web-test-runner.config.js:30-37`) | None found |
| Spectrum Web Components (`adobe/spectrum-web-components@85081e7`) | `.browserslistrc`: last two of Edge, Chrome, Firefox, Safari, iOS | **Pinned Playwright image** `mcr.microsoft.com/playwright:v1.53.1-noble` with chromium, firefox, webkit (`.circleci/continue_config.yml:19,31,318,358,371`); engines are 1.53.1's, not a last-two matrix (inferred) | `lightningcss` dependency; whether it reads the browserslist not checked |
| Primer React (`primer/react@f710336`) | `@github/browserslist-config`: last 10 Chrome, Edge, Firefox, last 3 Safari, Firefox ESR | Vitest browser mode, Playwright provider, `chromium` only (`packages/react/vitest.config.browser.mts:54-64`) | browserslist into postcss-preset-env (`packages/postcss-preset-primer/src/index.js:12,97-99`) |
| Carbon (`carbon-design-system/carbon@2a9ece8`) | `['> 0.5%', 'last 2 versions', 'Firefox ESR', 'not dead']` (`config/browserslist-config-carbon/index.js:10`) | Playwright `chromium` project only (`playwright.config.js:43-51`) | **`stylelint-no-unsupported-browser-features`** (`config/stylelint-config-carbon/index.js:13`) |

Across the nine (read, with the summary inferred):

- None runs a CI matrix pinned at its stated floor. They run the newest engines: Playwright's bundled builds, hermetic `rules_browsers` downloads, or one pinned Playwright image.
- The only older engine run in CI is Angular components' Safari 26.0 on BrowserStack. Lit's floor preset and Angular's Sauce script are not used.
- Floors are held by static means: Lightning CSS `targets` (Tailwind), browserslist into postcss-preset-env (Primer, Open Props), and `stylelint-no-unsupported-browser-features` (Carbon). No clone uses `eslint-plugin-compat`, `eslint-plugin-baseline-js`, `@eslint/css`'s `use-baseline`, or a Baseline stylelint plugin.

Cloud grids (public pages only; no account):

| Vendor | Chrome 141 | Edge 141 | Firefox 145 | Safari 26.2 | Open-source plan |
| --- | --- | --- | --- | --- | --- |
| BrowserStack | listed | listed | listed | not listed: one Safari per macOS (26.4 on Tahoe); components' pin to 26.0 suggests older minors may be requested (inferred) | free "lifetime access", 5 users and 5 parallels, by application (https://www.browserstack.com/open-source; list: https://www.browserstack.com/list-of-browsers-and-platforms/automate) |
| Sauce Labs | 141.0.7390.55 | 141.0.3537.57 | 145 | majors only ("26."), no 26.2 | "free accounts for qualifying" open-source projects; paid from $39/month (https://saucelabs.com/pricing; platforms: https://api.us-west-1.saucelabs.com/rest/v1/info/platforms/webdriver) |
| LambdaTest (TestMu AI) | not confirmable from public text | same | same | same | free licences for qualifying projects; free tier 300 minutes (https://www.lambdatest.com/open-source/, https://www.lambdatest.com/pricing) |

## 6. The probe

### 6.1 Page and checks

- Page: `D:/tmp/ngx-yeti-27/probe/page.html`, the Yeti dialog example (`src/components/dialog/example.html` at `f52d1e8b9`, copied from ticket 01's export) with `yeti.css` and `dialog.js`. Served by Node's `http` module from `D:/tmp/ngx-yeti-27/yeti-src/`.
- Script: `D:/tmp/ngx-yeti-27/probe/probe.mjs`. Checks: `CSS.supports('color', 'light-dark(...)')`; the body colour and the alert button's background under `emulateMedia({ colorScheme: 'light' })` and `'dark'`; `'command' in HTMLButtonElement.prototype`; Tab then Enter opens the dialog; the focus ring is `solid 2px`; a click opens it; `:modal` matches; Escape closes it; focus returns to the opener; `yeti:open` and `yeti:close` fire.
- Runs: `probe/run2.sh` (Windows) and `docker-probe.sh` (arm64 container). Output: `probe/results2.jsonl`, `probe/results-docker.jsonl`, summarised by `probe/summary.mjs`.

### 6.2 Results (measured)

| Run | Engine reported | `light-dark()` and scheme flip | Invoker commands, dialog opens | Modal, Escape, focus return, events |
| --- | --- | --- | --- | --- |
| Playwright 1.56.1 Chromium | 141.0.7390.37 | yes, yes | yes | all pass |
| Playwright 1.63.0 + Chrome for Testing (`executablePath`) | 141.0.7390.54 | yes, yes | yes | all pass |
| Playwright 1.56.1 + Chrome for Testing (`executablePath`) | 141.0.7390.54 | yes, yes | yes | all pass |
| Playwright 1.56.1 Firefox (control below the floor) | 142.0.1 | yes, yes | **no**: `command` absent, the dialog stays shut | no events |
| Playwright 1.57.0 Firefox | 144.0.2 | yes, yes | yes | all pass |
| Playwright 1.58.2 Firefox | 146.0.1 | yes, yes | yes | all pass |
| Playwright 1.57.0 `moz-firefox` + stock Firefox 145.0 | 145.0 | yes, **no flip** (emulation ignored) | yes | all pass |
| Playwright 1.56.1 WebKit | 26.0 (r2215) | yes, yes | yes | all pass |
| Playwright 1.58.2 WebKit | 26.0 (r2248) | yes, yes | yes | all pass |
| Docker arm64, Playwright 1.56.1 Chromium | 141.0.7390.37 | yes, yes | yes | all pass |
| Docker arm64, Playwright 1.56.1 Firefox | 142.0.1 | yes, yes | **no** | no events |
| Docker arm64, Playwright 1.56.1 WebKit | 26.0 (r2215) | yes, yes | yes | all pass |

The Firefox 142 rows are the negative control: the same page and checks fail where web-features says invoker commands are missing (F144). So the probe can detect a floor gap (measured).

### 6.3 Vitest browser mode with WebdriverIO (the user's point 6)

Measured in `D:/tmp/ngx-yeti-27/vitest-probe/`: `vitest@4.1.11`, `@vitest/browser-playwright@4.1.11`, `@vitest/browser-webdriverio@4.1.11`, `playwright@1.56.1`, `webdriverio@9.32.0` (`@wdio/utils@9.32.0` with `@puppeteer/browsers@2.13.2`). One test, `dialog.test.js`: it imports `yeti.css` and `dialog.js`, renders the dialog, asserts `light-dark()` and invoker-command support, clicks the opener with `userEvent.click`, polls `dialog.open`, presses Escape with `userEvent.keyboard`, and writes `navigator.userAgent` to `logs/ua-<run>.txt`. Config: `vitest.config.mjs`. Runner: `run.sh`, output `results.txt` and `logs/`. Downloads went to `WEBDRIVER_CACHE_DIR=D:/tmp/ngx-yeti-27/wdio-cache`.

| Run | Capability | Exit | Browser in the user agent | Binaries (architecture) |
| --- | --- | --- | --- | --- |
| Playwright provider, Chromium | - | 0 | HeadlessChrome 141.0.7390.37 | Playwright Chromium (x86-64) |
| Playwright provider, Firefox | - | 1 (control: "invoker commands supported: expected false to be true") | Firefox 142.0 | Playwright Firefox (x86-64) |
| Playwright provider, WebKit | - | 0 | Version/26.0 Safari | Playwright WebKit r2215 (x86-64) |
| WebdriverIO, Chrome | `browserVersion: '141.0.7390.54'` | 0 | HeadlessChrome 141.0.0.0 | Chrome for Testing and chromedriver 141.0.7390.54, downloaded (x86-64) |
| WebdriverIO, Firefox | `browserVersion: '145.0'` | 1 | none: "Couldn't find a matching firefox browser for tag "145.0" on platform "win64"" | - |
| WebdriverIO, Firefox | `browserVersion: 'stable_145.0'` | 0 | Firefox 145.0 | Firefox 145.0 `win64`, downloaded (x86-64); geckodriver 0.37.1 (ARM64) |
| WebdriverIO, Firefox | `moz:firefoxOptions.binary` = Mozilla's ARM64 Firefox 145.0 | 0 | Firefox 145.0 | Firefox (ARM64), geckodriver 0.37.1 (ARM64) |
| WebdriverIO, Edge | `browserVersion: '141'` | 0 | **Edg/154.0.0.0** | installed Edge 154; msedgedriver 154.0.4258.37 downloaded (x86-64) |

- The Firefox tag needs the `stable_` prefix (measured). WebdriverIO's docs show `stable_151.0.1` (read by a research subagent: https://webdriver.io/docs/driverbinaries).
- WebdriverIO does not download Edge. Its browser setup handles Chrome, Chromium, and Firefox only (read: `node_modules/@wdio/utils/build/node.js:159-161`; docs: "Automated browser setup does not support Microsoft Edge", https://webdriver.io/docs/driverbinaries). With `browserVersion: '141'` it fetched a driver for the installed Edge and ran Edge 154 with no warning (measured: the log holds only the pass lines). A pinned Edge needs Edge 141 installed (inferred).
- `@puppeteer/browsers` maps Windows ARM64 to `win64` ("Windows 11 for ARM supports x64 emulation", read by a research subagent: https://github.com/puppeteer/puppeteer/blob/main/packages/browsers/src/detectPlatform.ts), so downloaded browsers are x86-64 (measured). geckodriver has a native `win-aarch64` build (measured: `file` shows ARM64).

## 7. WebdriverIO as the Vitest browser provider

Read by a research subagent unless marked; sources cited.

- **Versions:** `@vitest/browser-webdriverio` has 4.1.0 to 4.1.11, each peering on the exact same `vitest` and on `webdriverio: "*"` (https://registry.npmjs.org/@vitest/browser-webdriverio; measured for 4.1.11 by `peers.mjs`). 5.0.0 shipped 2026-09-08 from a community repository, and Vitest's migration guide says "WebdriverIO support is community-maintained and addressed on a per-issue basis" (https://vitest.dev/guide/migration, https://github.com/vitest-community/vitest-webdriverio).
- **Angular 22.2:** the unit-test builder supports it, but picks Playwright when both providers are installed, and passes plain `webdriverio()` with no capabilities (https://github.com/angular/angular-cli/blob/v22.2.1/packages/angular/build/src/builders/unit-test/runners/vitest/browser-provider.ts). So a pinned `browserVersion` would need a Vitest config of the project's own rather than the builder's `browsers` option (inferred).
- **Storybook 10.6:** `@storybook/addon-vitest@10.6.1` peers only on `@vitest/browser-playwright` (https://registry.npmjs.org/@storybook/addon-vitest). Its docs say "We recommend running tests in a browser using Playwright, but you can use WebDriverIO instead" by changing the provider (https://github.com/storybookjs/storybook/blob/next/docs/writing-tests/integrations/vitest-addon/index.mdx, lines 297-303). One plugin command, `resetMousePosition`, does work only for Playwright (`code/addons/vitest/src/vitest-plugin/index.ts`, around line 448, at v10.6.1). Not run here.
- **What it loses against Playwright:**
  - parallel sessions: `supportsParallelism = false` (measured in `@vitest/browser-webdriverio/dist/index.js:431`; Playwright's is `true` at `@vitest/browser-playwright/dist/index.js:832`). Vitest recommends Playwright "because it supports parallel execution" (https://vitest.dev/guide/browser/);
  - Playwright traces (`browser.trace`) are Playwright-only; the experimental `browser.traceView` works with all providers (https://vitest.dev/guide/browser/playwright-traces, https://vitest.dev/guide/browser/trace-view);
  - `cdp()` is Playwright and Chromium only (https://vitest.dev/guide/browser/commands);
  - `upload` works only in Chrome and Edge, with strings only; `selectOptions` with several elements is unsupported (https://vitest.dev/guide/browser/interactivity-api);
  - no WebKit: the provider's browsers are `firefox`, `chrome`, `edge`, and `safari` (measured: `index.d.ts`, `webdriverBrowsers`);
  - Safari runs headed only; the provider throws for headless Safari (https://github.com/vitest-community/vitest-webdriverio/blob/HEAD/src/webdriverio.ts, lines 157-161).
- **What it gains:** stock Chrome for Testing, stock Firefox at any archived version, and real Safari through `safaridriver` on macOS, each pinned through capabilities (measured for Chrome and Firefox, read for Safari: https://webdriver.io/docs/capabilities). `userEvent` goes through the WebDriver protocol, as Playwright's goes through its own protocol; neither simulates events (https://vitest.dev/guide/browser/interactivity-api).
- **Network interception:** Vitest has no request-interception API of its own and points to MSW; `vi.mock` works with either provider (https://vitest.dev/guide/mocking/requests, https://vitest.dev/guide/mocking/modules).
- **Speed (measured, one run each, warm cache):** WebdriverIO Chrome 141 took 4.17 s, Edge 1.82 s; the first WebdriverIO Chrome run with downloads took 22.81 s (`logs/`). Not compared under load.
- **Coexistence with Playwright e2e (inferred):** the probe workspace held `playwright` and `webdriverio` side by side, and both providers ran from one config file (measured). Angular's builder would prefer Playwright when both are present (read above), so a WebdriverIO component-test target would need its own Vitest config (inferred).

## 8. Options, costs, and what each proves

Costs are estimates unless cited. GitHub's prices (read by a research subagent: https://docs.github.com/en/billing/reference/actions-runner-pricing): Linux 2-core x64 $0.006/min, Linux 2-core arm64 $0.005/min, Windows 2-core $0.010/min, macOS 3- or 4-core $0.062/min; standard runners are free for public repositories (https://docs.github.com/en/billing/concepts/product-billing/github-actions).

| Option | What it proves | Licence | CI cost | Maintenance |
| --- | --- | --- | --- | --- |
| A. Pinned Playwright 1.56.1 project for Chromium 141 (alias or separate package) | The Chromium engine at the floor | Apache-2.0, free | One extra Linux job | Low; the pin never moves until the floor does, but the old release gets no fixes |
| B. Current Playwright with Chrome for Testing 141 by `executablePath` | Chrome 141 itself, with current Playwright | Free | One extra job plus a cached download | Low; risk that a later Playwright needs CDP that 141 lacks (none seen at 1.63.0) |
| C. Playwright 1.57.0 and 1.58.x for Firefox 144 and 146 | Firefox on each side of the floor, not 145 | Free | Two extra jobs | Low |
| D. Playwright `moz-firefox` with stock Firefox 145 | Firefox 145 itself, partly | Free | One extra job | High: undocumented channel; works only with 1.57.0, and colour-scheme emulation fails |
| E. WebdriverIO provider for floor runs (Chrome 141, Firefox 145, Edge with an installed 141) | The stock browsers at the floor | MIT, free | Jobs run serially (no parallel sessions) | Medium: community-maintained provider; Angular's builder and Storybook's addon prefer Playwright |
| F. Safari on a GitHub macOS runner (WebdriverIO `safaridriver`, or Playwright WebKit on macOS) | Current Safari (26.5 or newer), not 26.2 | Free | macOS minutes at $0.062/min, free on public repositories | Low; the Safari version moves with the image |
| G. Cloud device grid for Safari 26.2 and Safari iOS 26.2 | Real Safari at the floor, if offered | Commercial; open-source plans vary (section 5) | Grid plan | Medium |
| H. Static checks (browserslist or Baseline lint) | That source uses no feature above the floor | Free | Seconds | Low |
| I. Playwright WebKit (any version) | WebKit trunk behaviour, not a Safari release | Free | Already run | None extra |

## 9. Unknowns and not done

- Safari 26.2 and Safari iOS 26.2 were not run; no macOS was available.
- Edge 141 was not obtained; installing it would downgrade the system Edge.
- An Angular 22.2 workspace and Storybook 10.6 were not run with Playwright 1.56.1 or with WebdriverIO; their compatibility is read from peer ranges and source.
- Only the dialog page was probed; the other unguarded features in ticket 01, section 5.1, were not.
- Whether Playwright's BiDi channel works with stock Firefox 145 on any release other than the four tried.
