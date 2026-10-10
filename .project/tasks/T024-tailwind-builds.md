---
id: T024
title: Add the Tailwind C1 and C2 Fixture build configurations with their cases
wave: 4
deps: [T022]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - apps/yeti-app/project.json
  - apps/yeti-app/src/styles-tailwind-c1.css
  - apps/yeti-app/src/styles-tailwind-c2.css
  - apps/yeti-app/.postcssrc.json
  - apps/yeti-app-e2e/playwright.config.mts
  - apps/yeti-app-e2e/src/tailwind.spec.ts
  - tools/playwright/playwright-configs.test.mjs
  - package.json
  - package-lock.json
  - .github/workflows/ci.yml
  - .claude/skills/ngx-yeti-testing/SKILL.md
  - references/ci-local.md
---

# T024 — Add the Tailwind C1 and C2 Fixture build configurations with their cases

## Context

An M001 carry-over (setup.md:344; ticket 50 decision 70): the setup route built under two more build configurations of the Fixture app, with the Tailwind forms C2 and C1 of setup.md section 4, asserting that utilities win over Yeti, Yeti wins over preflight, a rule of `@layer ngx-yeti` wins over Yeti's, and a Yeti `container` is not capped at 1024 px at a 1100 px viewport with `@source not inline('container');` in place (ADR 0060:17). M001 moved it to M002 because it needs `yetiContainer` (T022) and an `@layer ngx-yeti` rule. Planner confirmation of INTENT's inference: the A11Y-30 `--_yeti-t` redefinition in `packages/ngx-yeti/accessibility.css` is a `@layer ngx-yeti` rule that overrides Yeti's `@layer yeti` definition in every engine without forced-colours emulation, so it is the rule this case asserts; A11Y-1a applies only under forced colours.

## Approach

- Configurations: add `tailwind-c1` and `tailwind-c2` to the `yeti-app` `build` target (and the `serve-ssr` configurations the e2e web server runs) in `apps/yeti-app/project.json`, each replacing `apps/yeti-app/src/styles.css` with its own global stylesheet that follows setup.md section 4's form exactly; keep the development and production configurations unchanged. Add Tailwind as a devDependency (the version setup.md names, else the current 4.x release at least two weeks old) and the PostCSS config Angular's builder reads, scoped so the default builds are unaffected.
- `apps/yeti-app-e2e/playwright.config.mts`: `FIXTURE_CONFIGURATION=tailwind-c1` and `tailwind-c2` start the server for that configuration on its own port and run only `apps/yeti-app-e2e/src/tailwind.spec.ts`; the development and production runs skip that spec. Update `tools/playwright/playwright-configs.test.mjs` if it pins the config's shape. `FIXTURE_CONFIGURATION` is already an Nx cache input (nx.json `e2e` named input).
- `apps/yeti-app-e2e/src/tailwind.spec.ts`: on `/sub/setup` (and `/sub/server/setup`), a utility class beats Yeti's rule, Yeti beats preflight, and the A11Y-30 rule beats Yeti's `--_yeti-t` (read through a computed size that depends on it); on `/sub/container` at a 1100 px viewport, the container host is wider than 1024 px (T022's Interface contract), proving `@source not inline('container');` keeps Tailwind's `.container` out.
- CI: `.github/workflows/ci.yml`'s `e2e` matrix gains the two configurations (with three engines, or the subset the record asks; state why in a comment), and `node tools/ci-local/run-job.mjs ci e2e --matrix configuration=tailwind-c1` runs them locally (SC8; the run-job script refuses keys it does not run, so keep the job's shape). Docs, in this task: `.claude/skills/ngx-yeti-testing/SKILL.md` (Fixture app: the `FIXTURE_CONFIGURATION` values) and `references/ci-local.md` (the new matrix values and their local command).
- Prohibition N3 (judgment): must not keep content out of reach until hydration to avoid an unstyled frame; no item or Fixture route hides content (opacity, visibility, display, or inert) until the client boots; with JavaScript off every item's content is visible and readable.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/ngx-yeti-specs/SKILL.md`, `.claude/skills/type-safety/SKILL.md`; read `references/ci-local.md` before editing the workflow.

## Interface contract

- Container route (T022): `/sub/container` renders at least one host carrying `data-ngx-yeti-item-container` whose content box is wider than 1024 px at a 1100 px viewport in the default build.

## Intent coverage

- SC3
- SC8

## Acceptance criteria

1. Under `FIXTURE_CONFIGURATION=tailwind-c2` and `tailwind-c1`, `apps/yeti-app-e2e/src/tailwind.spec.ts` passes: utilities over Yeti, Yeti over preflight, the A11Y-30 `@layer ngx-yeti` rule over Yeti's, and a Yeti container wider than 1024 px at a 1100 px viewport, on both route kinds.
2. The `e2e` job's new configuration values pass locally through `node tools/ci-local/run-job.mjs ci e2e` and are documented in `references/ci-local.md` and the testing skill; the development and production e2e runs are unchanged.
3. The development and production builds of `yeti-app` and their outputs are unchanged (the build-output test that pins Yeti's 66 copied CSS files passes).
4. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && test -f apps/yeti-app-e2e/src/tailwind.spec.ts && test -f apps/yeti-app/src/styles-tailwind-c1.css && npm exec nx -- run-many -t lint typecheck -p yeti-app yeti-app-e2e && FIXTURE_CONFIGURATION=tailwind-c1 npm exec nx -- e2e yeti-app-e2e && FIXTURE_CONFIGURATION=tailwind-c2 npm exec nx -- e2e yeti-app-e2e && npm exec nx -- e2e yeti-app-e2e -- build-output.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=tailwind-c1 && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=tailwind-c2 && node --test tools/playwright/playwright-configs.test.mjs
```

Heavy: yes

## Log

- 2026-10-10 — created by planner
