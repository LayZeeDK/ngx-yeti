---
id: T006
title: Generate and prove the control-ngx-yeti-storybook skill
wave: 1
deps: []
status: done
agent: build_T006
base: 0632a4324daa1a6c0d20aa12732b1c64fb203568
worktree: null
task_branch: null
files:
  - .claude/skills/control-ngx-yeti-storybook/SKILL.md
  - .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs
  - .claude/skills/control-ngx-yeti-storybook/features/README.md
  - .claude/skills/control-ngx-yeti-storybook/features/stories.md
  - .claude/skills/control-ngx-yeti-storybook/features/play-functions.md
  - .claude/skills/control-ngx-yeti-storybook/features/axe-results.md
---

# T006 — Generate and prove the control-ngx-yeti-storybook skill

## Context

The second control skill of the user's 2026-10-10 ruling ("Approve recommendations") makes the package's Storybook drivable by later reviewers, who walk the Surface contract's Storybook stories with it. Generate `.claude/skills/control-ngx-yeti-storybook` by following C:\Users\LarsGyrupBrinkNielse\.claude\skills\lars-create-control-skill\SKILL.md on its Storybook branch (its references/storybook.md) and prove it once end to end. INTENT Scope in fixes its reach: launch Storybook on 4400 or the static build on 4401, open a story id, run its play function, and capture axe results.

## Approach

- Interview the repository: the `ngx-yeti` project's `storybook` (port 4400), `build-storybook`, `static-storybook` (port 4401), and `test-storybook` targets in `packages/ngx-yeti/project.json`, `packages/ngx-yeti/.storybook/main.ts` and `packages/ngx-yeti/.storybook/preview.ts` (the axe gate on the six `wcagTags`, the `console.error` check), and how `openStory` in `apps/ngx-yeti-e2e/src/open-story.ts` opens a story with `embed=true` without rerunning its play function. Launch once and stop it before writing.
- Shape: as the creator skill's generated-skill.md says, `SKILL.md` with ten sections, the control script `.claude/skills/control-ngx-yeti-storybook/scripts/control.mjs` with `up` (dev server or static build, chosen by a flag), `doctor`, `info`, and `down`, worktree-derived ports, refusals, JSON output, and the feature map files listed in `files`. Evidence goes under `tmp/control-ngx-yeti-storybook/`; do not edit `.gitignore` (T005 adds `.playwright-cli/`).
- Running a story's play function: by opening the story without `embed=true`, or through the `test-storybook` target with a story filter; capturing axe results: through the a11y addon panel data or axe on the story root, as `apps/ngx-yeti-e2e/src/axe.ts` does. Choose from the tool catalogue; add no dependency.
- Proof: open `card--stretched-link`, run its play function, capture its axe result and a screenshot, then `down`, then one refusal, as the creator skill's section 5 lists.

## Interface contract

- Ignore entries (T005): `.gitignore` ignores `.playwright-cli/` for every control skill's playwright-cli sessions; evidence and state live under `tmp/control-{name}/`, which `tmp` already ignores.

## Intent coverage

- None

## Acceptance criteria

1. `.claude/skills/control-ngx-yeti-storybook/` holds the files listed in `files`, with SKILL.md's ten sections and every command literal and taken from this repository.
2. The proof run is recorded in the Log: `up` for the static build on a derived port with time to ready, `doctor` exit 0, `card--stretched-link` opened with its play function run and its axe result captured, evidence that survives `down`, the port free and the process tree gone after `down`, and one refusal of a mismatched PID that exits 2.
3. The skill states how to open a story without rerunning its play function and how to run it.
4. `npx prettier --check .` passes at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && test -f .claude/skills/control-ngx-yeti-storybook/SKILL.md && test -f .claude/skills/control-ngx-yeti-storybook/features/stories.md && node .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs up --json && node .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs doctor --json && node .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs down --json && npx prettier --check .claude/skills/control-ngx-yeti-storybook
```

Heavy: yes

## Log

- 2026-10-10 — created by planner
- 2026-10-10 — coder: preflight clean (every Context/Approach path exists; Interface contract is T005's ignore entries, met without editing `.gitignore`: evidence and state under `tmp/control-ngx-yeti-storybook/`; Intent coverage None; Verify paths declared).
- 2026-10-10 — coder: interview (measured): `nx show project ngx-yeti --json` gives `storybook` (nx:run-commands `storybook dev`, continuous, port 4400), `build-storybook` (`storybook build`, cached), `static-storybook` (@nx/web:file-server on `packages/ngx-yeti/storybook-static`, port 4401, dependsOn build-storybook), `test-storybook` (`vitest run --project=storybook`). Pre-write launch probe: `node node_modules/nx/dist/bin/nx.js run ngx-yeti:static-storybook --port=4537` (Windows PID 2300) answered `index.json` 200 after about 26 s with a fresh build; stopped with `taskkill /PID 2300 /T /F` before writing. Probes: no-`embed` URL runs the play function (`autoplay: true`, phase `finished`); `storyFinished` on `__STORYBOOK_ADDONS_CHANNEL__` after `forceRemount` carries `status` and the a11y addon's axe report; `run-code` has no `require`; `test-storybook -- card/src/card.stories.ts -t "Stretched Link"` gave 1 passed, 7 skipped; `--dev` flow up 13.8 s, doctor 0, down 0 (8 PIDs stopped).
- 2026-10-10 — coder: implementation: `SKILL.md` (frontmatter plus the ten sections; Drive states open-without-play via `embed=true` and run-play via the no-`embed` URL, `forceRemount`, or `test-storybook`), `scripts/control.mjs` (`up` static by default or `--dev`, `doctor`, `info`, `down`; worktree ports derived from a SHA-1 of the path into 4420-4619, main checkout 4400/4401; state file; readiness = index lists `card--stretched-link` and it renders with `embed=true` in the repo's Playwright Chromium; start-time and command refusals; exit codes 0/1/2; `--json`), `features/README.md`, `stories.md`, `play-functions.md`, `axe-results.md`. No dependency added; `.gitignore` untouched. Fixed during the proof (recorded in Gotchas): Playwright import needs a `file://` URL; Nx bin is `nx/dist/bin/nx.js`; state field renamed `launchCommand` (collided with the output's `command`); `playwright-cli close` exits 0 when not open, so `down` reads its output.
- 2026-10-10 — coder: proof run (worktree, derived port 4483, session `control-ngx-yeti-storybook-static-4483`): (1) `up --json` exit 0, `readyMs` 13427 (build-storybook from Nx cache), PID 35348. (2) `doctor --json` exit 0, all six checks pass (process alive, port owned by run with listener 23300 in the tree, index lists known story, known story renders, no console errors, build matches checkout). (3) `playwright-cli open .../iframe.html?id=card--stretched-link&viewMode=story`: phase `finished`, autoplay `true`, button "Saved" and "The hills page" present (play function ran to the end). (4) evidence in `tmp/control-ngx-yeti-storybook/static-2026-10-10T18-22-35-073Z/`: `card--stretched-link.after-play.yml`, `card--stretched-link.story-finished.json` (`status: success`, a11y `passed`, violations `[]`, incomplete `[]`, 12 passes), `card--stretched-link.png`, `server.log`; `info` exit 0; state copied aside. (5) `down --json` exit 0, stopped PIDs 35348, 13984, 22052, 47096, 23300, `portFree: true`, `sessionClosed: closed`. (6) after down: the four evidence files still exist, `curl localhost:4483` gives 000, `tasklist` finds neither 35348 nor 23300, `playwright-cli list` has no control-ngx-yeti-storybook session. (7) refusal: throwaway `node -e` PID 40416 written into the copied state; `down --json` exit 2 "refused: pid 40416 start-time mismatch (recorded 2026-10-10T18:22:35.0874280Z, live 2026-10-10T18:24:32.7567440Z)"; throwaway still running afterwards (tasklist), then stopped and the state file deleted.
- 2026-10-10 — coder: Verify (task command, in the worktree): `npm ci` ok, `npx playwright install chromium` ok, both `test -f` ok, `up --json` exit 0 (readyMs 15532), `doctor --json` exit 0 (six passes), `down --json` exit 0 (5 PIDs, port free), `npx prettier --check .claude/skills/control-ngx-yeti-storybook` "All matched files use Prettier code style!" — VERIFY_EXIT=0. Also `npx prettier --check .` passes in the worktree (after removing the probe's untracked `.playwright-cli/`).
- 2026-10-10 — orchestrator Verify (isolate gsd-path-task/T006): pass, exit 0; output tail:
  ```
  npm warn deprecated @angular/platform-browser-dynamic@22.2.1: @angular/platform-browser-dynamic is deprecated. Use `@angular/platform-browser` instead.
  npm warn deprecated @yuku-parser/binding-win32-arm64@0.10.2: yuku-parser runs on yuku-core since 0.14
  npm warn deprecated @angular/animations@22.2.1: @angular/animations is deprecated. Use `animate.enter` and `animate.leave` instead. For more information see: https://v22.angular.dev/guide/animations.
  npm warn deprecated @ngtools/webpack@22.2.1: Angular's Webpack support is deprecated. Use the esbuild and Vite-based "@angular/build" package instead.
  npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
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
  ```
