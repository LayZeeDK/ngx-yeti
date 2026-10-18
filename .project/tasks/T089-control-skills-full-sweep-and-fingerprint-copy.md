---
id: T089
title: Bring both control skills to the 2026-10-18 verification contract with fresh fingerprint.mjs copies and Full sweep and Manual only feature-map sections
wave: 20
deps: [T084]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - .claude/skills/control-yeti-app/scripts/fingerprint.mjs
  - .claude/skills/control-yeti-app/features/README.md
  - .claude/skills/control-ngx-yeti-storybook/scripts/fingerprint.mjs
  - .claude/skills/control-ngx-yeti-storybook/features/README.md
---

# T089 — Bring both control skills to the 2026-10-18 verification contract with fresh fingerprint.mjs copies and Full sweep and Manual only feature-map sections

## Context

Lars, verbatim, 2026-10-18: "Land the verification changes in M002 as T088" (T088 was then taken by the fix-task helper, so this task is T089). The global lars-create-verification skill changed on 2026-10-18. Measured by the planner at a1815a6 with C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/scripts/check-skill.mjs `--json` (exit 1 on both skills):

- .claude/skills/control-ngx-yeti-storybook: `fingerprint-copy` fails ("scripts/fingerprint.mjs differs from ...; copy it again, never edit the copy") and `readme-sections` fails ("missing: Full sweep, Manual only").
- .claude/skills/control-yeti-app: the same `fingerprint-copy` failure and `readme-sections` fails ("missing: Full sweep").

Every other check passes on both. The new global fingerprint.mjs has sha256 a8c6b2bd5e1fcea32a208caa6e4f6e3e173b85c34a19f605cdc84c827433f7f2 and hashes through `git hash-object --stdin-paths`; the peer session that owns the change measured the same check statuses on LF files with it. proctree.mjs is unchanged (`proctree-copy` passes). At a1815a6 both `node .claude/skills/<skill>/scripts/fingerprint.mjs check` exit 0 with the old copies. fingerprint.mjs never reads features/README.md (it excludes README from the feature ids), so a README edit cannot stale features/.proven.json.

The contract (C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/references/generated-skill.md, lines 40-80 and "Feature map"): features/README.md has the H2 sections Baseline preconditions, Driving conventions, Proof and skip reporting, Feature entry contract, Features, Full sweep, Manual only, in that order; other sections may follow them. `## Full sweep` links every top-level features/*.md except README.md exactly once as a Markdown link `[Name](./name.md)` (a backtick file name does not count), in the order a full pass drives them (the map order /lars-maintain-verification uses); check-skill's `full-sweep` check fails a sweep that leaves out, repeats or adds a file. A cross-cutting flows file under features/flows is optional and is linked last only when it exists; neither skill has one and this task does not add one. `## Manual only` lists what no agent can drive (for Angular: DevTools checks, OS dialogs, external auth providers, anything a probe showed playwright-cli cannot reach).

Current READMEs: control-yeti-app has Baseline preconditions, Driving conventions, Proof and skip reporting, Feature entry contract, Features (item-routes, javascript-off, hydration-and-replay, build-configurations as Markdown links) and Manual only, with no Full sweep. control-ngx-yeti-storybook has the first five sections, its Features is a table with backtick file names (stories.md, play-functions.md, axe-results.md), and it has no Full sweep and no Manual only. .prettierignore already lists `/.claude/skills/control-*/scripts/fingerprint.mjs` (line 19), so it needs no change. The last task that changed these four files is T084 (wave 17).

## Approach

- Copy the global fingerprint.mjs byte for byte over each skill's scripts/fingerprint.mjs (a file copy, never an edit, no line-ending conversion).
- Run /lars-maintain-verification's step 1 contract check (check-skill.mjs) on each skill for the two failing checks only; this is not a full maintenance pass. No live drive: the change adds README sections and a byte copy; no recipe, feature file, route or control script changes, and .proven.json stays fresh by the fingerprint check. Record in the Log that no live drive ran and why.
- control-yeti-app README: insert `## Full sweep` between Features and Manual only, linking each of its four feature files once, in map order. Keep Manual only's content.
- control-ngx-yeti-storybook README: add `## Full sweep` after Features, linking stories.md, play-functions.md and axe-results.md once each, in the order a full pass drives them; then add `## Manual only`, stating what agents cannot prove in this Storybook (from the skill's SKILL.md Gotchas, its feature files and the ngx-yeti-testing skill's screen-reader rule: real screen readers are automated, so they are not manual), or `None` with the reason when nothing is manual. Keep the Features table as it is.
- Write in the README's existing voice; no planning ids in the skill files. Do not touch .proven.json, SKILL.md, the feature files or the scripts other than fingerprint.mjs. If the fingerprint check is not fresh after the copy, stop and report it as blocked; do not re-record.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. Each skill's scripts/fingerprint.mjs is byte-identical to C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/scripts/fingerprint.mjs (`cmp` exits 0; sha256 d3c1150a8d79004cd2115299bf341c179f21082abbfcecf7513dd3f30595e03f), and check-skill's `fingerprint-copy` and `proctree-copy` pass on both.
2. Each features/README.md has Baseline preconditions, Driving conventions, Proof and skip reporting, Feature entry contract, Features, Full sweep and Manual only as H2s in that order; each Full sweep links every top-level feature file except README.md exactly once as a Markdown link, in map order; check-skill's `readme-sections` and `full-sweep` pass on both.
3. control-ngx-yeti-storybook's Manual only lists what no agent can prove in the Storybook, or says `None` with a reason; control-yeti-app's Manual only keeps its two existing items.
4. check-skill.mjs `--json` exits 0 on both skills, and `node <skill>/scripts/fingerprint.mjs check` exits 0 on both with the new copies (features/.proven.json unchanged and fresh). The Log records both check-skill results and that no live drive ran, with the reason.
5. `npx prettier --check` passes on both README.md files; .prettierignore is unchanged.

## Verify

```bash
set -o pipefail && npm ci && S=C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/scripts && node $S/check-skill.mjs .claude/skills/control-yeti-app --json && node $S/check-skill.mjs .claude/skills/control-ngx-yeti-storybook --json && node .claude/skills/control-yeti-app/scripts/fingerprint.mjs check && node .claude/skills/control-ngx-yeti-storybook/scripts/fingerprint.mjs check && cmp $S/fingerprint.mjs .claude/skills/control-yeti-app/scripts/fingerprint.mjs && cmp $S/fingerprint.mjs .claude/skills/control-ngx-yeti-storybook/scripts/fingerprint.mjs && npx prettier --check .claude/skills/control-yeti-app/features/README.md .claude/skills/control-ngx-yeti-storybook/features/README.md; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: no

## Log

- 2026-10-18 — created by planner (build repair: the 2026-10-18 verification contract change)
- 2026-10-18 — orchestrator (plan gate, before approval): added `npm ci &&` at the start of Verify, because the finish sidecar starts without node_modules and `npx prettier` and the daemon stop need the workspace's packages.
- 2026-10-18 — orchestrator (plan-defect repair of an AC before dispatch): AC1's sha256 changed from a8c6b2bd5e1fcea32a208caa6e4f6e3e173b85c34a19f605cdc84c827433f7f2 to d3c1150a8d79004cd2115299bf341c179f21082abbfcecf7513dd3f30595e03f, because the global fingerprint.mjs changed again after planning (it now turns off git filter drivers before `git hash-object`, as verdict.mjs does; measured with certutil). The `cmp` against the global file is unchanged.
