---
id: T005
title: Generate and prove the control-yeti-app skill for the Fixture app
wave: 1
deps: []
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - .claude/skills/control-yeti-app/SKILL.md
  - .claude/skills/control-yeti-app/scripts/control.mjs
  - .claude/skills/control-yeti-app/features/README.md
  - .claude/skills/control-yeti-app/features/item-routes.md
  - .claude/skills/control-yeti-app/features/javascript-off.md
  - .claude/skills/control-yeti-app/features/hydration-and-replay.md
  - .claude/skills/control-yeti-app/features/build-configurations.md
  - .gitignore
---

# T005 — Generate and prove the control-yeti-app skill for the Fixture app

## Context

The user ruled on 2026-10-10 ("Approve recommendations") that two control skills are wave-1 tasks, so the reviewers of later waves can walk the Surface contract's Fixture app routes with a tool that launches and drives the app in isolation. This task generates `.claude/skills/control-yeti-app` by following the user's skill at C:\Users\LarsGyrupBrinkNielse\.claude\skills\lars-create-control-skill\SKILL.md and its references (generated-skill.md, tool-catalogue.md), and proves it once end to end. INTENT Scope in fixes its reach: launch the Fixture app's development, production, and SSR builds; JavaScript off; `main.js` held back; build configurations; and capture item links, hydration diagnostics, and screenshots.

## Approach

- Follow the creator skill's sections 2 to 6 in order: interview the repository (the `yeti-app` project's `build`, `serve`, and `serve-ssr` targets in `apps/yeti-app/project.json`, the `<base href="/sub/">`, the e2e web servers in `apps/yeti-app-e2e/playwright.config.mts` on ports 4310, 4311, and 4312, the registry in `apps/yeti-app/src/app/fixtures/fixtures.ts`), launch the app once and stop it, choose tools from the catalogue, write the skill, and run the proof (up, doctor, drive one feature, evidence, info, down, one refusal).
- Shape: `SKILL.md` with the ten sections the creator skill names, the control script `.claude/skills/control-yeti-app/scripts/control.mjs` (Node ESM; `up`, `doctor`, `info`, `down`; JSON output with `--json`; exit codes 0, 1, 2; a state file per flow; ports derived per worktree; refuses a port it does not own; stops only the recorded process tree), and the feature map files listed in `files`. Evidence goes under `tmp/control-yeti-app/` (already git-ignored by `tmp`).
- Driving uses the installed playwright-cli; add no dependency (the creator skill's rule). Holding back the main bundle follows `holdBackMainBundle` in `apps/yeti-app-e2e/src/support/main-bundle.ts`; JavaScript off follows a browser context with JavaScript disabled; item links read `link[data-ngx-yeti-styles]` in the head; hydration diagnostics read Angular's development-build console summary, as `watchHydration` in `apps/yeti-app-e2e/src/support/fixtures.ts` does.
- `doctor` says which build it found (development, production) because hydration messages exist only in the development build.
- `.gitignore`: add `.playwright-cli/` (for both control skills) if it is missing; T006 does not edit `.gitignore`.
- Record every claim as measured or inferred in the skill, as the creator skill asks, and write what went wrong in the proof into Gotchas.

## Interface contract

- Ignore entries (T005): `.gitignore` ignores `.playwright-cli/` for every control skill's playwright-cli sessions; evidence and state live under `tmp/control-{name}/`, which `tmp` already ignores.

## Intent coverage

- None

## Acceptance criteria

1. `.claude/skills/control-yeti-app/` holds the files listed in `files`, with SKILL.md's ten sections, a feature map entry per listed feature, and every command literal and taken from this repository.
2. The proof run is recorded in the Log: `up` (with time to ready), `doctor` exit 0 naming each check and the build it found, one feature driven (an item route with JavaScript off and with `main.js` held back), evidence that survives `down`, the port free and the process tree gone after `down`, and one refusal of a mismatched PID that exits 2.
3. `control.mjs` refuses the main checkout's port from a worktree and derives its own port there.
4. `npx prettier --check .` passes at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && test -f .claude/skills/control-yeti-app/SKILL.md && test -f .claude/skills/control-yeti-app/features/item-routes.md && node .claude/skills/control-yeti-app/scripts/control.mjs up --json && node .claude/skills/control-yeti-app/scripts/control.mjs doctor --json && node .claude/skills/control-yeti-app/scripts/control.mjs down --json && npx prettier --check --ignore-unknown .claude/skills/control-yeti-app .gitignore
```

Heavy: yes

## Log

- 2026-10-10 — created by planner
- 2026-10-10 — coder (build_T005): implementation
  - Followed lars-create-control-skill sections 2-6. Interview (measured from files): `yeti-app` targets `build`, `serve` (`@angular/build:dev-server`, servePath `/sub/`), `serve-ssr` (`node dist/apps/yeti-app/server/server.mjs`, PORT default 4000 in server.ts); e2e servers on 4310-4312; registry `fixtures.ts`; `security.allowedHosts: ["localhost"]`. Probe launch before writing: `nx run yeti-app:serve:development --port=4650` ready in 20 s, listening on `::1` by a child PID, stopped with `taskkill /T` (port free after).
  - Wrote `.claude/skills/control-yeti-app/` — SKILL.md (ten sections), `scripts/control.mjs` (Node ESM; `up`/`doctor`/`info`/`down`; `--json`; exits 0/1/2; state `tmp/control-yeti-app/state.json`; evidence `tmp/control-yeti-app/<run-id>/`; main ports 4200 serve / 4000 ssr; worktree port 4600 + sha1(path) % 200; refuses 4000/4200 from a worktree; refuses a busy port naming its PID; `down` checks recorded start time + command line, `taskkill /T /F` of the recorded tree only, closes only `<session>` and `<session>-jsoff`), and features README, item-routes, javascript-off, hydration-and-replay, build-configurations. Driving uses the installed global playwright-cli 0.1.21 and the repo's Playwright 1.63 Chromium (doctor); no dependency added. `.gitignore` gains `.playwright-cli/`.
  - Proof-found fixes, written into Gotchas: nx entry is `node_modules/nx/dist/bin/nx.js`; `build-fresh` first compared bundle mtime and failed on a healthy instance because the Nx cache restores original mtimes (now compares sources with launch time); Nx ANSI codes in server.log (stripped with `util.stripVTControlCharacters`); doctor's hydration wait first took 22 s (now polls collected messages, 2 s); `run-code`/`eval` hang in a JavaScript-off playwright-cli session (snapshot/find/press/screenshot work; head read via `curl`); `run-code` sandbox has no `URL`; dev server HMR loads `@defer` deps eagerly (NG0751); playwright-cli sessions are not scoped per checkout.
- 2026-10-10 — coder: proof run (worktree flow `wt-f662a442`, port 4714, session `control-yeti-app-wt-f662a442`)
  1. `info --json` before: exit 2 (no state file). `up --json`: exit 0, `readySeconds: 16` (real 16.2 s), pid 42812.
  2. `doctor`: exit 0 in 2.2 s; checks process-alive, port-owned (pid 27396 in tree), build-log, page-marker, build (`development build (window.ng present)`), hydration (`Angular hydrated 2 component(s) and 59 node(s), 0 component(s) were skipped.`), console-errors — all OK.
  3. Drove the item route `/sub/card`: held-back `main.js` recipe printed `{"held":{"itemLinks":["card","lift"],"jsaction":7},"jsactionAfter":0}`; held-replay on `/sub/replay` printed `"text":"Clicked 1 times"`; JavaScript off (`<session>-jsoff`, `--config=<evidenceDir>/js-off.json`): snapshot shows `Welcome yeti-app` and `Weekend in the hills`, Tab focuses `Remove the live cards`, served HTML item links `card`, `lift`.
  4. Evidence in `tmp/control-yeti-app/2026-10-10T18-25-18-363Z/`: card-before.yml, card-held.png, card-jsoff.png, card-jsoff.yml, card-jsoff-item-links.txt, doctor.txt, held-card.js, held-replay.js, js-off.json, replay-after.png, replay-after.yml, replay-held.png, server.log. `info --json` exit 0; state copied aside.
  5. `down --json`: exit 0 in 4.6 s, stopped [42812, 31000, 27396, 5856, 8408], survivors [], portFree true, evidenceKept true.
  6. Confirmed independently: 0 of those PIDs alive, 0 listeners on 4714, evidence directory intact, `playwright-cli list` shows no control-yeti-app session.
  7. Refusal: throwaway `node -e` pid 48100 put into the copied state; `down --json` exit 2: "pid 48100 does not match the recorded start time or command; refusing to stop it" (recorded vs live start/command shown); 48100 still running afterwards; then stopped it and deleted that state file.
  - Extra: `up --mode=ssr --configuration=production` exit 0, ready 5 s (Nx local cache hit); `doctor` exit 0 with `build: production`, build-fresh OK, hydration SKIP; `down` exit 0, port free.
  - AC3: from this worktree `up --port=4200 --json` exit 2 "port 4200 belongs to the main checkout; a worktree uses its derived port 4714"; derived port 4714 used otherwise.
  - AC4: `npx prettier --check .` exit 0. `npx eslint .claude/skills/control-yeti-app/scripts/control.mjs` exit 0.
- 2026-10-10 — coder: Verify result: FAILED (exit 2) on its last step only. `npm ci`, `npx playwright install chromium`, both `test -f`, `up --json` (exit 0), `doctor --json` (exit 0, all checks pass), `down --json` (exit 0, port free, no survivors) passed. `npx prettier --check .claude/skills/control-yeti-app .gitignore` exits 2: `[error] No parser could be inferred for file ".gitignore"`. Prettier has no parser for `.gitignore` when the file is named explicitly; the base commit's `.gitignore` fails the same way (exit 2), so no content change inside `files` can make this step pass. `npx prettier --check --ignore-unknown .claude/skills/control-yeti-app .gitignore` exits 0, and `npx prettier --check .` exits 0.
- 2026-10-10 — coder: BLOCKED — the task's Verify command cannot pass as written: its final step names `.gitignore` explicitly to `prettier --check`, which errors for any `.gitignore` (no inferable parser), and fixing it needs a Verify edit or a `.prettierrc` override outside `files`. Suggested Verify tail: `npx prettier --check --ignore-unknown .claude/skills/control-yeti-app .gitignore` (measured exit 0). All acceptance-criteria work is complete in the worktree.
- 2026-10-10 — orchestrator: block accepted as a Verify defect; no product commit. Rejected isolate diff against base 0632a4324daa1a6c0d20aa12732b1c64fb203568: 9 paths (the 7 control-yeti-app skill files, .gitignore, this task file), `git diff --binary` sha256 6308d5677d0f5dd10e768af11616a5910e2a97eb606229ed40cf9215d3781600; every path is task-owned. The product part is preserved as a patch for the retry.
- 2026-10-10 — orchestrator: plan-defect repair (Verify only). The last Verify step `npx prettier --check .claude/skills/control-yeti-app .gitignore` exits 2 for any `.gitignore` (Prettier infers no parser for an explicitly named file; the base commit's `.gitignore` fails the same way), so it gains `--ignore-unknown`, which the coder measured at exit 0. AC4's `npx prettier --check .` is unchanged. Retry: reapply the preserved attempt-1 product patch, then re-run the proof and Verify.
