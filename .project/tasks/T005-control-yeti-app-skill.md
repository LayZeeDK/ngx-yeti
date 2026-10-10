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
npm ci && npx playwright install chromium && test -f .claude/skills/control-yeti-app/SKILL.md && test -f .claude/skills/control-yeti-app/features/item-routes.md && node .claude/skills/control-yeti-app/scripts/control.mjs up --json && node .claude/skills/control-yeti-app/scripts/control.mjs doctor --json && node .claude/skills/control-yeti-app/scripts/control.mjs down --json && npx prettier --check .claude/skills/control-yeti-app .gitignore
```

Heavy: yes

## Log

- 2026-10-10 — created by planner
