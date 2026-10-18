---
id: T004
title: Prove Guidepup with NVDA locally and add the voiceover and nvda CI jobs with the card list check
wave: 1
deps: []
status: done
agent: build_T004
base: 9a42af686801a5fc10f1475f23b9faf610fe128f
worktree: null
task_branch: null
files:
  - apps/screen-reader-e2e/project.json
  - apps/screen-reader-e2e/tsconfig.json
  - apps/screen-reader-e2e/eslint.config.mjs
  - apps/screen-reader-e2e/screen-reader.config.mts
  - apps/screen-reader-e2e/src/support/screen-reader.ts
  - apps/screen-reader-e2e/src/support/nvda.ts
  - apps/screen-reader-e2e/src/support/voiceover.ts
  - apps/screen-reader-e2e/src/card.screen-reader.ts
  - .github/workflows/ci.yml
  - package.json
  - package-lock.json
  - nx.json
  - .claude/skills/ngx-yeti-testing/SKILL.md
  - AGENTS.md
  - references/ci-local.md
---

# T004 — Prove Guidepup with NVDA locally and add the voiceover and nvda CI jobs with the card list check

## Context

SC9 (approved by the user, 2026-10-10: "Approve SC9.") replaces the specs' manual screen-reader release tests with automated checks: a `voiceover` job in `.github/workflows/ci.yml` on a pinned `macos-26` runner drives real VoiceOver in real Safari through Guidepup (`@guidepup/guidepup`, MIT, set up with `@guidepup/setup`), and an `nvda` job on `windows-2025` drives real NVDA in Chromium and Firefox; the NVDA lane also runs locally on this Windows 11 ARM64 machine with a native arm64 browser channel. Whether NVDA under Guidepup works here is expected (NVDA 2026.1+ supports ARM64; `@guidepup/setup` passed on `windows-11-arm` on 2026-09-27) but not measured, so this wave-1 task proves it on a landed item first: card.md:69's claim that a list of cards is announced as a list with its item count, on the existing `card--list` story. Later, T027 adds the timeline, icon, spinner, grid, and cluster checks to the same harness.

## Approach

- Research facts to rely on (2026-10-10 report; verify against the installed packages): Guidepup 0.35.0 drives VoiceOver through AppleScript and NVDA through NVDA's Remote Access on localhost with keys sent by WScript `SendKeys`; screen readers need a headed browser, one worker, and no parallelism; `@guidepup/playwright` maps `webkit` to Playwright's WebKit app, not Safari, so the VoiceOver lane opens real Safari through WebdriverIO and `safaridriver` (already a dependency, used by the `safari` job) and brings it to the front with Guidepup's `macOSActivate('Safari')`; `npx @guidepup/setup --ci` writes the TCC and VoiceOver AppleScript settings on a GitHub macOS runner, and `npx @guidepup/setup` installs a portable NVDA on Windows; `capture: true` logs every phrase, which the spinner check of T027 needs. Guidepup's own example config uses `workers: 1`, a 5-minute timeout, and retries; GitHub's macOS images broke VoiceOver AppleScript once (runner-images issue 11257, fixed 2026-06-08), so pin `macos-26`, never `macos-latest`.
- Project: an Nx project `screen-reader-e2e` in `apps/screen-reader-e2e` with explicit `nvda` and `voiceover` targets. It must not be run by `npm run check`, by the `ci.yml` `unit` or `e2e` jobs, by `floor.yml`, or by `nx run-many -t e2e`: the `@nx/playwright/plugin` in nx.json infers an `e2e` target from any `playwright.config.*`, so if the runner is Playwright, name its config `apps/screen-reader-e2e/screen-reader.config.mts` and point the targets at it. Its `lint` and `typecheck` targets run in the `static` job on Linux and pass there. Add `@guidepup/guidepup` and `@guidepup/setup` as devDependencies (and `@guidepup/playwright` only if the NVDA lane uses it).
- Pages: open stories of the static Storybook build (`ngx-yeti:static-storybook` on port 4401, `iframe.html?id={story}&viewMode=story`), as `apps/ngx-yeti-e2e/playwright.config.mts` does; the two e2e projects cannot run at once on one machine because of the fixed port.
- The `nvda` target provisions NVDA through `@guidepup/setup` when it is missing (idempotent) and runs the tests in Playwright's Chromium and Firefox on CI, and locally in the browsers `BROWSERS` names (`tools/playwright/engines.mjs`); the local proof uses `BROWSERS=msedge` (native arm64). The `voiceover` target runs in real Safari on macOS only and fails fast elsewhere with a clear message.
- First measurement: run the `nvda` lane on this machine and record in the Log the NVDA version, browser channel, and the phrases heard. If NVDA under Guidepup does not work on Windows 11 ARM64, stop and write `NEEDS-ORCHESTRATOR:` with the exact failure; do not fall back to a manual test (N9).
- `apps/screen-reader-e2e/src/card.screen-reader.ts`: on `card--list`, moving the reader onto the list announces it as a list with its count (3) and each card as a list item, asserted as per-lane substrings (VoiceOver and NVDA word it differently, INTENT E16). In the NVDA lane this proves Chromium's and Gecko's trees; the WebKit list semantics are asserted only in the VoiceOver lane.
- Jobs in `.github/workflows/ci.yml`: `voiceover` on `macos-26` (checkout, setup-node 24 with npm cache, `npm ci`, `sudo safaridriver --enable`, Guidepup setup with `--ci`, cache Guidepup's assets under `~/Library/Caches/guidepup/` keyed on the Guidepup version, then the `voiceover` target) and `nvda` on `windows-2025` (Guidepup setup, Playwright's Chromium and Firefox, the `nvda` target); `timeout-minutes: 20`; a stated retry budget in the runner config; upload the phrase report as an artifact on failure and success. The `voiceover` job cannot run locally and is first measured on the milestone's pull request in CI; write its test so it asserts the same substrings and records its phrases.
- Prohibition N9 (judgment): must not quietly fall back to a manual test, or skip or loosen a screen-reader check, when it flakes; a flaky check is retried within the job's stated retry budget and fixed or escalated to the user; it is never marked skipped, deleted, or turned into a manual test without the user's ruling.
- Docs, in this task: `.claude/skills/ngx-yeti-testing/SKILL.md` line 75 (local runs are Chromium only) gains the rule that every CI and floor container job also passes locally through `node tools/ci-local/run-job.mjs`, and every other job natively, before a push, the macOS-only `safari` and `voiceover` excepted (user ruling 2026-10-10: "The floor job (and all other checks) must pass both locally and in CI for every Milestone and every PR in general."); the Safari section near line 81 gains the `voiceover` and `nvda` jobs and how the NVDA lane runs locally; the Gates section states that milestones integrate through a pull request to `main` whose CI and floor jobs pass before the user merges. `AGENTS.md` "Run CI locally" names `voiceover` beside `safari` as macOS-only. `references/ci-local.md` line 3 names both macOS-only jobs, and its native-jobs table gains the `nvda` row with the exact local command.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/ngx-yeti-accessibility/SKILL.md`, `.claude/skills/type-safety/SKILL.md`. Read `references/ci-local.md` before touching a workflow.

## Interface contract

- Screen-reader project (T004): Nx project `screen-reader-e2e` at `apps/screen-reader-e2e` with targets `nvda` and `voiceover` and no `test`, `test-storybook`, or `e2e` target; one test file per item, `apps/screen-reader-e2e/src/{item}.screen-reader.ts`, run by both lanes; the lane drivers `apps/screen-reader-e2e/src/support/nvda.ts` and `apps/screen-reader-e2e/src/support/voiceover.ts` and the shared helpers in `apps/screen-reader-e2e/src/support/screen-reader.ts` open a static Storybook story by id and return the phrases the screen reader spoke; each lane writes the phrases it heard to a JSON report under dist/screen-reader-e2e/ (uploaded as an artifact in CI), and tests assert per-lane substrings.

## Intent coverage

- SC8
- SC9

## Acceptance criteria

1. On this Windows 11 ARM64 machine, `npm exec nx -- run screen-reader-e2e:nvda` with `BROWSERS=msedge` drives real NVDA through Guidepup and passes `apps/screen-reader-e2e/src/card.screen-reader.ts`: `card--list` is announced as a list with its count and each card as a list item, asserted as substrings; the Log records the NVDA version, the browser channel, and the phrases heard.
2. `.github/workflows/ci.yml` has a `voiceover` job on `macos-26` that drives VoiceOver in real Safari through WebdriverIO and Guidepup with the same card check, and an `nvda` job on `windows-2025` that runs it in Playwright's Chromium and Firefox; both have a stated retry budget, a 20-minute timeout, and a phrase-report artifact.
3. The `nvda` job passes locally natively by the command `references/ci-local.md` gives; `references/ci-local.md`, `AGENTS.md` "Run CI locally", and `.claude/skills/ngx-yeti-testing/SKILL.md` name `safari` and `voiceover` as the macOS-only jobs, state that every other job passes locally and in CI, and say how the NVDA lane runs locally.
4. The `screen-reader-e2e` project is not run by `npm run check`, the `unit` and `e2e` jobs, `floor.yml`, or `nx run-many -t e2e`, and its `lint` and `typecheck` pass.
5. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium firefox && test -f apps/screen-reader-e2e/src/card.screen-reader.ts && test -f references/ci-local.md && npm exec nx -- run-many -t lint typecheck -p screen-reader-e2e && BROWSERS=msedge npm exec nx -- run screen-reader-e2e:nvda
```

Heavy: yes

## Log

- 2026-10-10 — created by planner
- 2026-10-10 — coder (build_T004): implemented.
  - NVDA under Guidepup works on this Windows 11 ARM64 machine (measured): `@guidepup/guidepup` 0.35.0, `@guidepup/setup` 0.29.2 (devDependencies; `@guidepup/playwright` not added), NVDA asset `0.2.1-2026.2` (NVDA 2026.2) installed by `npx guidepup install nvda` into `%LOCALAPPDATA%\guidepup`. Browser channel for the local proof: `msedge` (Edge 154.0.4258.62, native arm64). Also passed once each in Playwright 1.63's x64 Chromium 153 and Firefox 155 under emulation.
  - Phrases heard on `card--list` (msedge, Verify run): `screen-reader-e 2e-518862816, document, focused, read only` (focus check), `list, with 3 items, heading, level 3, link, Weekend in the hills`, `A day by the lake, link, heading, level 3, Six miles, one summit, and a view worth the early start.`, `The coast path, link, heading, level 3, Six miles, one summit, and a view worth the early start.`, `no next list item`. Asserted substrings, in order: `list, with 3 items`, the three card titles, `no next list item`.
  - Project `apps/screen-reader-e2e` (targets `lint`, `typecheck`, `nvda`, `voiceover`; no `test`, `test-storybook` or `e2e`; config `screen-reader.config.mts`, so `@nx/playwright/plugin` infers nothing; checked with `nx show project`). `nvda` runs `guidepup install nvda` then Playwright with `SCREEN_READER=nvda` (Chromium and Firefox unless `BROWSERS` is set); `voiceover` runs Playwright with `SCREEN_READER=voiceover`; the config throws on the wrong OS. One worker, headed, `retries: 2` (the stated budget), 5-minute timeout. Each test writes `dist/screen-reader-e2e/<lane>/<project>/<test>-<repeat>-<retry>.json` and attaches the phrases.
  - Harness decisions, each from a measured failure: NVDA and the browser start once per worker (a second browser launched in the same run lost the keyboard focus to the terminal); NVDA starts in English (`general.language: en`, the machine speaks Danish otherwise); `open` adds a plain `<p>Story start</p>` before `#storybook-root` because NVDA reports "list, with 3 items" only when its caret enters the list from outside, and card--list starts with the list (Control+Home alone announced the list in some runs only); the window is raised by a PowerShell script (minimize, restore, SetForegroundWindow with AttachThreadInput) until Windows reports it as foreground, then `open` refuses to send any key unless NVDA's report-current-focus names a `document` (keys went into the Claude Code terminal before that check existed). The VoiceOver lane opens real Safari through WebdriverIO with `macOSActivate('Safari')`, interacts with the web area, jumps to its left edge (the marker) and walks with VO-Right; its substrings (`list`, `3 items`, titles) are not measured and are first measured on the milestone PR in CI.
  - Known local limit (measured, recorded in references/ci-local.md): a second test in one Firefox worker finds the foreground taken by another window (VS Code) between tests; the focus check fails it and a retry in a fresh worker passes. With one test per project today, every lane run here is a first test.
  - `.github/workflows/ci.yml`: `voiceover` (macos-26) and `nvda` (windows-2025) jobs, `timeout-minutes: 20`, Guidepup asset cache keyed on the installed Guidepup version, phrase report and Playwright output uploaded with `if: always()`. Docs: AGENTS.md "Run CI locally", references/ci-local.md (line 3, nvda row in the native table, new "The NVDA lane" section), ngx-yeti-testing SKILL.md (local-and-CI rule after the Engines paragraph, a "Screen readers" section after the Safari paragraph, pull-request integration in Gates). nx.json needed no change.
  - Follow-up outside declared files: README.md:97 lists the ci.yml jobs and does not name `voiceover` or `nvda`.
  - Verify (as written, Git Bash): exit 0. `npm ci` ok; `npx playwright install chromium firefox` ok; both `test -f` ok; `nx run-many -t lint typecheck -p screen-reader-e2e` passed; `BROWSERS=msedge nx run screen-reader-e2e:nvda` 1 passed (msedge). Also `npx prettier --check .` clean and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD` (working tree) passed for 9 projects. No NVDA, browser or Storybook server left running.
- 2026-10-10 — orchestrator Verify (sidecar gsd-path-verify/task-t004-verify): pass, exit 0; output tail:
  ```
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
  [2m[WebServer] [22m[7m[1m[33m NX [39m[22m[27m  [33mNx Daemon is not enabled. Static server is not watching for changes.[39m
  [2m[WebServer] [22m(node:44980) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
  [2m[WebServer] [22m(Use `node --trace-deprecation ...` to show where the warning was created)
  (node:23720) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
  (Use `node --trace-deprecation ...` to show where the warning was created)
  ```
