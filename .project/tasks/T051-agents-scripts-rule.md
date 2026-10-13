---
id: T051
title: Add the Scripts section to AGENTS.md
wave: 4
deps: [T041]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - AGENTS.md
---

# T051 — Add the Scripts section to AGENTS.md

## Context

Fourth build repair (2026-10-13). Lars ruled on scripts in this repository on 2026-10-13, verbatim:

- "Add rules in AGENTS.md to prevent agents from creating and using .py and .sh scripts. GSD Path uses .py files in .gsd-path/ but they are not ours to maintain. Prefer typed (using JSDoc and enabling typecheck or including in a tsconfig, aligned with Nx conventions) .mjs scripts over .py and .sh everywhere in this repo, unless there is a compelling reason not to which must be approved by a human. Scripts that are committed to the repo must be code reviewed and optionally security reviewed depending on its impact."
- "Scripts that are not commited, for example temporary but reused multiple times must also be code reviewed."
- "To be clear: the .gsd-path/*.py scripts maintained by GSD Path should remain and allowed to be used."

The orchestrator drafted the section from these rulings. This task inserts it verbatim, as a new top-level section `# Scripts` after `# Run CI locally` and before `# Specs and skills` in `AGENTS.md`. The text to insert, verbatim (two paragraphs under the heading):

```markdown
# Scripts

Write every script in this repository as a typed `.mjs` module: `// @ts-check` with JSDoc types, checked by a `tsconfig` that includes it or by an Nx `typecheck` target. This covers committed scripts and temporary ones under `tmp/` or a scratchpad that run more than once. A `.py` or `.sh` script needs a human's approval of a compelling reason first; record that approval beside the script. GSD Path's Python helpers in `.gsd-path/` and its runtime belong to GSD Path: they stay, agents use them, and their code is left to GSD Path. `vendor/` and `docs/specs/` hold verbatim copies and keep their scripts as they are.

A script gets a code review before it runs a second time, committed or not. Add a security review when it handles credentials, network access, CI permissions, Git history, or deletes files.
```

Out of scope: the 27 committed `.mjs` files under `tools/` and `.claude/` that carry no `// @ts-check` (a strict `tsc --checkJs` over them reports 221 errors, measured 2026-10-13). Typing them is an open question for Lars, not this task.

## Approach

- Insert the block above exactly, with one blank line before and after it, so `AGENTS.md` keeps one blank line between top-level sections. Change no other line of `AGENTS.md`: the GSD Path part at the top and the other project sections stay byte-for-byte.
- Prettier formats Markdown with the repository's config (`.prettierrc`, default prose wrap), so the two long paragraphs stay single lines; if Prettier would reflow anything, the text is wrong, not Prettier.
- Do not add a check, script, or tsconfig change for the rule; that is the out-of-scope follow-up.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. `AGENTS.md` has a line exactly `# Scripts`, after the `# Run CI locally` heading and before the `# Specs and skills` heading, followed by the two paragraphs of the Context block verbatim.
2. Nothing else in `AGENTS.md` changes (the diff adds only the section and its separating blank line).
3. `npx prettier --check AGENTS.md` passes.

## Verify

```bash
npm ci && rg -q -x -F "# Scripts" AGENTS.md && rg -q -F "A script gets a code review before it runs a second time, committed or not." AGENTS.md && rg -q -F "and its runtime belong to GSD Path: they stay, agents use them, and their code is left to GSD Path." AGENTS.md && awk '/^# Run CI locally$/{a=NR} /^# Scripts$/{b=NR} /^# Specs and skills$/{c=NR} END{exit !(a && b && c && a<b && b<c)}' AGENTS.md && npx prettier --check AGENTS.md; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: no

## Log

- 2026-10-13 — created by planner (build repair 4), from the draft tmp/afk-m002/agents-scripts-rule.md.
