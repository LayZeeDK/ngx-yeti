---
id: T083
title: Make both control scripts' PID-mismatch refusals name only the image name and start time of the process that now holds the recorded PID
wave: 17
deps: [T074, T080]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - .claude/skills/control-yeti-app/scripts/control.mjs
  - .claude/skills/control-yeti-app/scripts/control.test.mjs
  - .claude/skills/control-yeti-app/SKILL.md
  - .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs
  - .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs
  - .claude/skills/control-ngx-yeti-storybook/SKILL.md
---

# T083 — Make both control scripts' PID-mismatch refusals name only the image name and start time of the process that now holds the recorded PID

## Context

Not from `.project/review/PATCH-FINDINGS.md`. The orchestrator added this task from Lars's ruling of 2026-10-16, verbatim: "Approve, resolve in M002", which covers the residual items final-gap-4.md leaves for Lars. Lars can drop this task at the patch-plan approval without touching T078 to T082.

Source: security review round 7, finding 3 (Low, A09 / CWE-532, CWE-200), verbatim: "When the recorded PID now belongs to another process, for example after a reboot or a server that died without `down`, `down` refuses. In that refusal it prints the full command line of whatever process now holds the PID (`command mismatch (live: ${live.cmd})`, and `live: { start, commandLine }`). Win32_Process returns the full argv of the same user's processes, so a `--token=...`, a `curl -H "Authorization: Bearer ..."` or a database URL lands in the agent transcript, and the transcript leaves the machine." Its fix direction, verbatim: "Print only the image name (the first argv token) and the start time, or a hash of the command line." It cites control-ngx-yeti-storybook control.mjs:1024-1026 and control-yeti-app control.mjs:1148-1154 at d63e7e0.

Measured by the gap reviewer at d63e7e0 (final-gap-4.md, case A3 and A4, finding (5)): a foreign node process started with `--token=FAKE-SECRET-123` on its command line held the recorded PID; storybook's `down` printed `command mismatch (live: ...node.exe -e "..." -- --token=FAKE-SECRET-123)`, and yeti-app's `down` printed `live.commandLine` holding `--token=FAKE-SECRET-123`.

T080 lands first and edits control-yeti-app's control.mjs, its test and SKILL.md; find each site by its code.

## Approach

- Each refusal that names the process now holding the recorded PID gives its image name (Win32_Process `Name`, or the executable's file name) and its start time, never its command line or arguments. The recorded values the script itself wrote (the launch's own `start` and command line) may still be shown.
- Keep each refusal's exit code (2), its error text up to the live details, and the state file kept on refusal; storybook's start-time and command checks still decide exactly as before. Comparisons still use the full command line; only the output changes.
- Look for any other output path of either script that prints a command line read from the process table for a process the launch did not start (`doctor`, `up`'s "already up"); give it the same treatment, and list each site in the Log.
- Tests: in each script's suite, a foreign process started by the test with the secret-looking argument `--token=FAKE-SECRET-123` holds the recorded PID of a stand-in state file; `down --json` (and the plain output) exits 2, names the image name and start time, and the secret string appears nowhere in stdout or stderr. Each test fails at d63e7e0 first (Log). Clean up every process the test starts, also on failure.
- SKILL.md: update any line that lists the refusal's fields or output.
- Typed scripts: keep `// @ts-check` and the JSDoc types; `npm exec nx -- typecheck @ngx-yeti/source` stays at 0 errors. Both skills stay runnable by /lars-verify (Lars, 2026-10-16: "Verification artifacts should be runnable by /lars-verify"): check-skill.mjs passes on each.
- Comments say only what the code cannot; no planning ids, dates or measurements in code.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. With a foreign process holding the recorded PID, each script's `down` exits 2, keeps the state file, and its output names the process's image name and start time and contains none of its arguments; a test in each suite proves it with `--token=FAKE-SECRET-123` and fails at d63e7e0 (Log).
2. No other output of either script prints a command line read from the process table for a process the launch did not start; the Log lists the sites checked.
3. Both control suites pass, check-skill.mjs passes on both skills, `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` passes, and Prettier passes on both skill folders.

## Verify

```bash
npm ci && npx playwright install chromium && rg -q -F 'FAKE-SECRET' .claude/skills/control-yeti-app/scripts/control.test.mjs && rg -q -F 'FAKE-SECRET' .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs && node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/scripts/check-skill.mjs .claude/skills/control-yeti-app --json && node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/scripts/check-skill.mjs .claude/skills/control-ngx-yeti-storybook --json && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && node --test .claude/skills/control-yeti-app/scripts/control.test.mjs && node --test .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs && npx prettier --check --ignore-unknown .claude/skills/control-yeti-app .claude/skills/control-ngx-yeti-storybook; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-16 — created by planner
