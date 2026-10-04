---
id: T003
title: Publish ngx-yeti/accessibility.css and resolve it in Storybook and yeti-app
wave: 1
deps: []
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - packages/ngx-yeti/accessibility.css
  - packages/ngx-yeti/ng-package.json
  - packages/ngx-yeti/package.json
  - packages/ngx-yeti/src/accessibility.node.spec.ts
  - packages/ngx-yeti/.storybook/main.ts
  - packages/ngx-yeti/.storybook/styles.css
  - apps/yeti-app/src/styles.css
  - apps/yeti-app/project.json
  - package.json
  - package-lock.json
  - .claude/skills/ngx-yeti-specs/SKILL.md
---

# T003 — Publish ngx-yeti/accessibility.css and resolve it in Storybook and yeti-app

## Context

The setup spec's global stylesheet ends with `@import 'ngx-yeti/accessibility.css';` (setup.md:147, :167): one small package stylesheet whose every rule sits inside `@layer ngx-yeti` (ADR 0060 point 8; setup.md:210), published through ng-packagr assets and the package `exports` map (ticket 50 decision 68). INTENT.md Scope: in and its Corrections settle that M001 creates it empty, because its rules arrive with the items that own them (the first is `button` in M002), and that this early creation departs from setup.md:210, which has the first rule-writing spec create it; the departure is recorded as a row in the Departures table of `.claude/skills/ngx-yeti-specs/SKILL.md`, whose one-time-task bullet for the stylesheet changes in the same commit. The specifier does not resolve in the workspace today: there is no node_modules entry for ngx-yeti, and tsconfig paths do not apply to CSS `@import`. This is wave-1 blocker 3: Storybook and the Fixture app must both resolve and load it.

## Approach

- Create `packages/ngx-yeti/accessibility.css` holding only an empty `@layer ngx-yeti` block (and, if wanted, one comment saying rules arrive with the items whose ledger rows they close). Publish it: an ng-packagr `assets` entry in `packages/ngx-yeti/ng-package.json` and an `exports` entry `"./accessibility.css"` in `packages/ngx-yeti/package.json` (ng-packagr merges custom `exports` with the entry points it generates).
- Make the specifier resolve in both consumers, then import it as the last line of `packages/ngx-yeti/.storybook/styles.css` and of `apps/yeti-app/src/styles.css` (after the `attributes.css` import of the always-loaded group). The mechanism is the coder's: for example a Vite alias in `packages/ngx-yeti/.storybook/main.ts` plus a matching resolution for the `@angular/build` application, or an npm workspace link of `packages/ngx-yeti` (root `package.json` `workspaces` and `package-lock.json`) so both builds resolve it through the package `exports` map as a consumer would. Whichever you choose, the TypeScript path aliases in `tsconfig.base.json` keep resolving `ngx-yeti` imports, and nothing else in the two builds changes.
- Owned here in this wave: `packages/ngx-yeti/.storybook/main.ts`. The card-stories task in this wave must not edit it; Storybook's framework preset already turns on `resolve.tsconfigPaths`, so entry-point imports need nothing here.
- Layer 3, `packages/ngx-yeti/src/accessibility.node.spec.ts` (setup.md:330): every rule of the stylesheet is inside `@layer ngx-yeti`, no `--_yeti-*` custom property is read or written, no class selector names a package class; it also asserts that `ng-package.json` lists the file as an asset and the source `package.json` exports it. Parse the CSS with a parser already installed (for example `@eslint/css`'s or Yeti's `lightningcss`), never with ad hoc string matching of rules.
- In `.claude/skills/ngx-yeti-specs/SKILL.md`: add a Departures row (Record: setup.md:210; It says: the first spec that writes an accessibility rule creates the file; The workspace does: M001 creates it empty in `@layer ngx-yeti`, published and imported by Storybook and the Fixture app; Why: the setup spec's global stylesheet imports it, INTENT.md Corrections 2026-10-04; Skill: `ngx-yeti-specs`), and replace the one-time-task bullet about creating and resolving the stylesheet with the resolution actually built (the placeholder bullet stays for the placeholder task). Keep the table's Prettier formatting.
- Never edit `docs/specs/` or `vendor/yeti/`. Skills: `.claude/skills/ngx-yeti-specs/SKILL.md`, `.claude/skills/ngx-yeti-stories/SKILL.md` (how stories load Yeti), `.claude/skills/ngx-yeti-testing/SKILL.md` (Fixture app set up exactly as the setup spec documents), `.claude/skills/type-safety/SKILL.md`.

## Interface contract

- The package accessibility stylesheet is the source file packages/ngx-yeti/accessibility.css, every rule inside `@layer ngx-yeti` (empty in M001); ng-packagr copies it to the root of the built package, whose package.json `exports` maps `"./accessibility.css"` to it; a consumer imports it with `@import 'ngx-yeti/accessibility.css';` as the last line of the global stylesheet.

## Intent coverage

- SC5

## Acceptance criteria

1. `packages/ngx-yeti/accessibility.css` exists with only an empty `@layer ngx-yeti` block (comments allowed); `npx nx build ngx-yeti` copies it to the root of `dist/packages/ngx-yeti`, and the built `package.json` `exports` maps `"./accessibility.css"` to it.
2. `@import 'ngx-yeti/accessibility.css';` is the last line of `packages/ngx-yeti/.storybook/styles.css` and of `apps/yeti-app/src/styles.css`, and `npx nx build yeti-app` and `npx nx build-storybook ngx-yeti` both succeed with it; removing the resolution makes both builds fail on the import (the task Log records that check).
3. Under `npx nx test ngx-yeti`, `packages/ngx-yeti/src/accessibility.node.spec.ts` proves every rule is inside `@layer ngx-yeti`, no `--_yeti-*` token is read or written, no class selector names a package class, and the asset and `exports` entries exist.
4. `.claude/skills/ngx-yeti-specs/SKILL.md` has the Departures row for the early empty stylesheet and its one-time-task bullet for the stylesheet describes the resolution now in place.
5. `npx prettier --check .` and `npx nx run-many -t lint typecheck test -p ngx-yeti yeti-app` pass at the task commit.

## Verify

```bash
npm ci --no-audit --no-fund && npx nx build ngx-yeti && find dist -name accessibility.css | rg -q ngx-yeti && rg -q accessibility.css apps/yeti-app/src/styles.css && rg -q accessibility.css packages/ngx-yeti/.storybook/styles.css && npx nx build yeti-app && npx nx build-storybook ngx-yeti && test -f packages/ngx-yeti/src/accessibility.node.spec.ts && npx nx test ngx-yeti -- accessibility.node.spec && npx nx typecheck ngx-yeti
```

Heavy: no

## Log

- 2026-10-04 — created by planner
