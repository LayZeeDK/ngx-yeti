---
id: T004
title: Prove Guidepup with NVDA locally and add the voiceover and nvda CI jobs with the card list check
wave: 1
deps: []
status: pending
agent: null
base: null
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
