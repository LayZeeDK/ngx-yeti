# 27. Research: testing at the browser floor (Chrome and Edge 141, Firefox 145, Safari 26.2)

Type: research
Status: resolved
Blocked by: 06
Labels: wayfinder:research
Map: ../map.md

## Question

[ADR 0002](../adr/0002-browser-target-baseline-2025.md) sets the target at Yeti's Baseline 2025: Chrome and Edge 141, Firefox 145, and Safari and Safari iOS 26.2. How can the package's tests run at those floor versions, and not only at the current engines a Playwright release ships? Which Playwright versions bundle engines at or near the floor, and what do other projects do?

## User instruction, 2026-10-01

The user's own message to the orchestrator, verbatim, replying to the note that no test ran at the floor versions because Playwright ships current engines only:

> 48. Then choose a/multiple version(s) of Playwright that include the target browser versions or research what other projects do to mitigate this.

The user then added, verbatim:

> #48 Could Playwright run a specific Chrome for Testing version?

> #48 Consider whether we could use WebDriverIO as the driver for Vitest Browser instead of Playwright and whether it could run specific versions of the target browsers, accepting that a macOS CI runner is needed to run Safari and cannot run on my local Windows machine.

So the research also covers point 6 below. The user accepts that Safari runs only on a macOS CI runner, not on the local Windows machine.

6. WebdriverIO as the Vitest browser-mode provider (`@vitest/browser-webdriverio`), in place of `@vitest/browser-playwright`. Cover:
   - whether it supports Vitest 4.1.x, Angular 22.2, and Storybook 10.6's Vitest addon;
   - whether WebdriverIO's `browserVersion` capability, with its automatic browser and driver download, can pin Chrome 141, Edge 141, and Firefox 145 (stock builds, which avoids Playwright's patched Firefox);
   - Safari 26.2 through `safaridriver` on a macOS runner, including which GitHub-hosted macOS image ships Safari 26.2 or later;
   - what Vitest browser mode loses or gains with WebdriverIO against Playwright (traces, network interception, `userEvent` fidelity, parallelism, speed);
   - whether Playwright e2e and WebdriverIO component tests can coexist.

   Probe it on this machine: run one Vitest browser-mode test with WebdriverIO at Chrome 141 and Firefox 145, if the drivers run on Windows ARM64 natively or under emulation.

## How to work it

Use a `/research` subagent, with small probes under `D:/tmp/` where a claim needs one. Cover, with sources:

1. Playwright's releases: for each release, its bundled Chromium, Firefox, and WebKit versions (release notes, and `browsers.json` in the `playwright-core` package by version). Name the release or releases whose engines sit at or nearest the floor. Then whether an older Playwright still runs with the Angular 22.2, Vitest 4.1.x browser mode, and Storybook 10.6 toolchain, and whether two Playwright versions can coexist in one workspace.
2. Branded channels: Playwright's `channel` option with an installed Chrome or Edge at a pinned version. Chrome for Testing (`@puppeteer/browsers` and the known-good-versions list) for Chrome 141. Firefox 145 builds from Mozilla's archive, and whether Playwright can drive a stock Firefox (it uses a patched Juggler build).
3. Safari 26.2: what WebKit build in Playwright corresponds to it, if any; that this machine is Windows on ARM64, so real Safari needs macOS (CI runners or cloud devices); and how close Playwright's WebKit is to Safari for the features in [Research: Angular 22's browser baseline against what Yeti expects](01-research-browser-baseline-vs-yeti.md).
4. What other projects do: Angular itself, Angular components, Material, Lit, Open Props, Tailwind, and design systems with a stated Baseline or browserslist floor. That might be cloud device grids (BrowserStack, Sauce Labs, LambdaTest), pinned browser CI matrices, static checks instead of runtime ones (browserslist with `eslint-plugin-compat`, `stylelint-no-unsupported-browser-features`, Lightning CSS `targets`, web-features lint), or polyfill and fallback tests.
5. A probe: one Yeti page (the dialog with invoker commands and a `light-dark()` colour) run at the nearest available floor engines, if they can be obtained on this machine.

Write `research/testing-at-the-browser-floor.md` with the options, each with its cost (licence, CI minutes, maintenance) and what it proves. Append an `## Answer`. Decide nothing; the testing decision chooses.

## Answer

Resolved 2026-10-01 by Claude Opus 5.5. Findings: [research/testing-at-the-browser-floor.md](../research/testing-at-the-browser-floor.md). Probes under `D:/tmp/ngx-yeti-27/`. Decides nothing.

- **Playwright nearest the floor (measured from `browsers.json`):** 1.56.0 and 1.56.1 ship Chromium 141.0.7390.37, at the floor. No release ships Firefox 145: 1.57.0 has 144.0.2 and 1.58.x has 146.0.1. No WebKit build matches Safari 26.2: Playwright labels revisions 2191 to 2248 (1.54 to 1.58) "26.0", and its "26.0" build already has invoker commands, which Safari gained in 26.2.
- **Toolchain (measured, read):** Vitest 4.1.11 browser mode ran the probe on Playwright 1.56.1. `@vitest/browser-playwright` peers on `playwright: "*"`, and neither Angular 22.2's builder nor Storybook 10.6's addon pins a Playwright version (read; not run in those tools). Four Playwright versions coexisted as npm aliases, each with its own browser revisions in one cache (measured).
- **Chrome for Testing (measured):** yes, Playwright can run a specific Chrome for Testing version. `executablePath` to Chrome for Testing 141.0.7390.54 (win64, x64 emulation) passed every probe step with Playwright 1.63.0 and 1.56.1, over CDP, with no warning. Chrome for Testing has no linux-arm64 or win-arm64 build of 141. Playwright's own arm64 Docker image `v1.56.1-noble` ran Chromium 141 natively.
- **Stock Firefox 145 (measured):** Mozilla's ARM64 build ran fully under WebdriverIO. Under Playwright's undocumented `moz-firefox` BiDi channel it ran only with 1.57.0, and colour-scheme emulation failed there. 1.56.1 did not launch it, and 1.58.2 and 1.63.0 stopped on BiDi commands Firefox 145 lacks.
- **WebdriverIO in Vitest browser mode (measured):** Chrome 141 (`browserVersion: '141.0.7390.54'`) and Firefox 145 (`'stable_145.0'`, or the ARM64 binary) passed with exit 0. Edge's `browserVersion: '141'` was ignored: WebdriverIO downloads drivers for Edge but not Edge itself, so the test ran on the installed Edge 154. The provider has no parallel sessions, no Playwright traces, and no WebKit. It is community-maintained from Vitest 5.
- **Safari 26.2 (read):** no GitHub-hosted macOS image ships it. They carry Safari 26.5 to 27.0, and the version moves with the image. Safari 26.2 needs a held macOS install or a cloud device grid.
- **Other projects (read):** none of Angular, Angular components, Lit, Open Props, Tailwind, Web Awesome, Spectrum, Primer, or Carbon runs a CI matrix at its stated floor. They test the newest engines (Spectrum pins a Playwright 1.53.1 image). Only Angular components runs an older engine, Safari 26.0 on BrowserStack. Floors are held by static checks: Lightning CSS `targets` (Tailwind), browserslist into postcss-preset-env (Primer, Open Props), and `stylelint-no-unsupported-browser-features` (Carbon). BrowserStack and Sauce Labs list Chrome 141, Edge 141, and Firefox 145, but not Safari 26.2. Both have free open-source plans.
- **Probe (measured):** the Yeti dialog with invoker commands and `light-dark()` passed in Chromium 141, Chrome for Testing 141, Firefox 144, 145 (WebdriverIO), and 146, and in WebKit "26.0". It failed as expected in Firefox 142, where invoker commands are missing, which shows the probe can detect a floor gap. Edge 141 and Safari 26.2 were not run.
