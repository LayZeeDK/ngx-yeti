---
id: T049
title: Rename the package stylesheet accessibility.css to ngx-yeti-globals.css and update every reference
wave: 4
deps: [T040]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - packages/ngx-yeti/accessibility.css
  - packages/ngx-yeti/ngx-yeti-globals.css
  - packages/ngx-yeti/package.json
  - packages/ngx-yeti/ng-package.json
  - packages/ngx-yeti/README.md
  - packages/ngx-yeti/CHANGELOG.md
  - packages/ngx-yeti/.storybook/styles.css
  - apps/yeti-app/src/styles.css
  - tools/package/pack-check.mjs
  - packages/ngx-yeti/src/published-output.node.spec.ts
  - packages/ngx-yeti/src/accessibility.node.spec.ts
  - packages/ngx-yeti/src/accessibility.spec.ts
  - packages/ngx-yeti/enter/src/enter.spec.ts
  - apps/ngx-yeti-e2e/src/spinner.spec.ts
  - docs/specs/ledger.md
  - docs/specs/upstream-bugs.md
  - .claude/skills/ngx-yeti-specs/SKILL.md
  - .claude/skills/ngx-yeti-accessibility/SKILL.md
  - .claude/skills/ngx-yeti-testing/SKILL.md
  - .claude/skills/yeti-pin/SKILL.md
---

# T049 — Rename the package stylesheet accessibility.css to ngx-yeti-globals.css and update every reference

## Context

Third build repair. User rulings of 2026-10-12, verbatim: "Rename accessibility.css to a broader term but not package.css. something like ngx-yeti-globals.css?" and, settling the name, "If it's a global stylesheet the consumer has to load explicitly, use an `ngx-yeti-` prefix". The file is `packages/ngx-yeti/ngx-yeti-globals.css`, the `exports` key is "./ngx-yeti-globals.css", and the consumer specifier is "ngx-yeti/ngx-yeti-globals.css".

Why the old name no longer fits: the stylesheet holds more than accessibility rules. Besides the ledger rows' rules (A11Y-32, and A11Y-1a when T020 lands), it holds the Firefox scale workaround (A11Y-30, the `--_yeti-t` redefinition, upstream Firefox bug) and the enter `once` fix (A11Y-33, upstream Y14), both workarounds for upstream bugs. All are normal declarations inside `@layer ngx-yeti`, and every consumer's global stylesheet imports the file after Yeti with `@layer yeti, ngx-yeti;` declared first.

The records name the old specifier, and `docs/specs/` is read-only except its two ledgers: ticket 50 decision 68, verbatim, "**The accessibility stylesheet's specifier** (point 2; MEDIUM, MEDIUM). `@import 'ngx-yeti/accessibility.css';`, published through the package's `exports` map."; ADR 0060 point 8, "**The package's own CSS is one small global stylesheet** in `@layer ngx-yeti`, holding the accessibility rules the user allowed (2026-10-02, "Accessibility CSS: Yes."), imported by the consumer ..."; and setup.md's "accessibility stylesheet" wording. A Departures row carries the difference.

References at HEAD 85ff4eb, from `rg -l "accessibility\.css"` with hidden files and without `docs/specs/specs`, `.project`, and `tmp`: the files of this task's `files` list, plus `docs/decisions/2026-10-03-test-infrastructure.tsv`, a dated decision log that stays as written. The Interface contract below is the sanctioned-selector contract of T039 with the new path; T020, T021, T023, and T044 carry the same text.

## Approach

- `git mv packages/ngx-yeti/accessibility.css packages/ngx-yeti/ngx-yeti-globals.css`. The rules, their order, their selectors, and the `@layer ngx-yeti` block do not change. Only the header comment changes: it describes a global stylesheet of the package's own rules, the accessibility rules that close ledger rows and the workarounds for upstream bugs, all in `@layer ngx-yeti`. No date, task id, or ruling in the comment.
- Publishing: the `exports` map of `packages/ngx-yeti/package.json` has `"./ngx-yeti-globals.css": "./ngx-yeti-globals.css"` and no "./accessibility.css" key; `packages/ngx-yeti/ng-package.json` copies `ngx-yeti-globals.css` as an asset; `tools/package/pack-check.mjs` checks the specifier "ngx-yeti/ngx-yeti-globals.css" and its message names it. Nothing keeps the old specifier as an alias: the package is unreleased (the CHANGELOG's version is marked unreleased), so no consumer imports it.
- Consumers in the repository: `apps/yeti-app/src/styles.css` and `packages/ngx-yeti/.storybook/styles.css` import "ngx-yeti/ngx-yeti-globals.css" at the same place in their layer order.
- Specs: `packages/ngx-yeti/src/published-output.node.spec.ts`, `packages/ngx-yeti/src/accessibility.node.spec.ts`, and `packages/ngx-yeti/src/accessibility.spec.ts` read and describe `ngx-yeti-globals.css`; each test keeps what it asserts. Keep the two accessibility spec file names: they test the accessibility rules and the stylesheet's limits, not the file name, and the pending tasks' Verify filters (`src/accessibility`) name them. `packages/ngx-yeti/enter/src/enter.spec.ts`'s tripwire message and `apps/ngx-yeti-e2e/src/spinner.spec.ts`'s comment and two annotation types name the new file; `rg` the repository for each annotation type before renaming it.
- Docs: the README's entry-point table row and its setup steps, and the CHANGELOG's stylesheet entry, name "ngx-yeti/ngx-yeti-globals.css" and call it the package's global stylesheet. `docs/specs/ledger.md` (rows A11Y-30 and A11Y-33) and `docs/specs/upstream-bugs.md` (row Y14), the two living ledgers, name the new path wherever they state where a rule lives; a verbatim quote of the user stays as it was. The skills (`ngx-yeti-specs`, `ngx-yeti-accessibility`, `ngx-yeti-testing`, `yeti-pin`) name the new file and call it the global stylesheet where they name the file.
- Departures: one row in the Departures table of `.claude/skills/ngx-yeti-specs/SKILL.md` for ticket 50 decision 68 (specifier "ngx-yeti/accessibility.css"), ADR 0060 point 8, and setup.md's "accessibility stylesheet" wording, against "ngx-yeti/ngx-yeti-globals.css", with the user's ruling quoted verbatim and the reason (the file holds upstream workarounds as well as accessibility rules). The existing Departures rows that name the stylesheet (building-blocks 1.13, the enter `once` row) name the new file. Prettier formats the table.
- Never edit `docs/specs/specs/`, `docs/specs/adr/`, `docs/specs/issues/`, or `docs/decisions/`. Nothing under vendor/ changes.
- One commit is enough if it passes the bisect checks; the rename and every reference move together, so no commit has a dangling import.
- Skills: `.claude/skills/ngx-yeti-specs/SKILL.md`, `.claude/skills/ngx-yeti-accessibility/SKILL.md`, `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/yeti-pin/SKILL.md`.

## Interface contract

- Sanctioned selectors (T039): `packages/ngx-yeti/src/published-output.node.spec.ts` holds the table `sanctionedSelectors`, which maps a row id of `docs/specs/ledger.md` to every selector of that row's rule in `packages/ngx-yeti/ngx-yeti-globals.css`, one string per comma-separated selector. The spec fails when a selector of that stylesheet names a Yeti class and is outside `@layer ngx-yeti` or absent from the table, when a table entry matches no selector of the stylesheet, and when a key is not a row id of the ledger. A task that adds, changes, or removes such a rule changes its entry in the same commit.
- Global stylesheet (T049): the package's own stylesheet is `packages/ngx-yeti/ngx-yeti-globals.css`, published as "ngx-yeti/ngx-yeti-globals.css" through the `exports` key "./ngx-yeti-globals.css"; its rules live inside one `@layer ngx-yeti` block. No file of the repository outside `docs/specs/`, `docs/decisions/`, `.project/`, and verbatim quotes names `accessibility.css`.

## Intent coverage

- None

## Acceptance criteria

1. `packages/ngx-yeti/ngx-yeti-globals.css` exists with the rules and `@layer ngx-yeti` block of the old file unchanged and a header comment describing the package's global stylesheet; `packages/ngx-yeti/accessibility.css` does not exist.
2. The `exports` map has "./ngx-yeti-globals.css" and no "./accessibility.css"; `npm exec nx -- run ngx-yeti:pack-check` passes and checks "ngx-yeti/ngx-yeti-globals.css" in the packed tarball.
3. The Fixture app and Storybook import "ngx-yeti/ngx-yeti-globals.css", and the published-output, accessibility, and enter specs pass against it.
4. Outside `docs/specs/`, `docs/decisions/`, `.project/`, `tmp/`, and the new Departures row, no file names `accessibility.css`; the two ledgers name the new path where they say where a rule lives.
5. The ngx-yeti-specs Departures table has the row for ticket 50 decision 68, ADR 0060 point 8, and setup.md's wording, quoting the user's ruling.
6. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && test -f packages/ngx-yeti/ngx-yeti-globals.css && ! test -e packages/ngx-yeti/accessibility.css && rg -q -F '"./ngx-yeti-globals' packages/ngx-yeti/package.json && ! rg -q -F "accessibility.css" --hidden --glob '!.git/**' --glob '!docs/**' --glob '!.project/**' --glob '!tmp/**' --glob '!.claude/skills/ngx-yeti-specs/SKILL.md' . && npx prettier --check packages/ngx-yeti/README.md packages/ngx-yeti/CHANGELOG.md docs/specs/ledger.md docs/specs/upstream-bugs.md .claude/skills/ngx-yeti-specs/SKILL.md .claude/skills/ngx-yeti-accessibility/SKILL.md .claude/skills/ngx-yeti-testing/SKILL.md .claude/skills/yeti-pin/SKILL.md && npm exec nx -- run-many -t lint typecheck build -p ngx-yeti yeti-app ngx-yeti-e2e && npm exec nx -- run ngx-yeti:pack-check && npm exec nx -- test ngx-yeti -- src/published-output src/accessibility enter/src; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-12 — created by planner (build repair #3; the user's two rename rulings quoted in Context). At 85ff4eb `packages/ngx-yeti/ngx-yeti-globals.css` does not exist, so the Verify fails if this task is skipped. deps T040 is file overlap with the last done wave-4 task that edited the stylesheet, the specs, the ledgers, the README, the CHANGELOG, and the ngx-yeti-specs skill; T035, T036, T038, and T039 are reached through it. Every pending wave-4 task that shares a file with this one now depends on it (T020, T021, T023, T024, T026, T041, T044, T046, T048), and the pending tasks that named `accessibility.css` (T020, T021, T023, T024, T044) now name `ngx-yeti-globals.css`. The Verify ends by stopping the Nx daemon and keeps its own exit code; run it exactly as written and never set NX_DAEMON.
