---
id: T006
title: Generate and prove the control-ngx-yeti-storybook skill
wave: 1
deps: []
status: pending
agent: null
base: null
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
