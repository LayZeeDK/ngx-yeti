# M002 history rewrite, 2026-10-13

## Rulings (Lars, verbatim)

- "3: If there is a way we can rewrite Git history for this branch, that is acceptable, even preferable, when an
  opportunity is there."
- "When I say this branch, I didn't mean to disallow worktrees, I just meant Git history that hasn't landed in `main`
  yet."
- "Spike and rewrite", then "Mapped replay", then "Yes, run it".

## What changed

Branch `gsd-path/M002`, the 120 commits after `f35b35f8d2ae07cf82272bee4665ef5e978c71f1` (never pushed: no
`gsd-path/*` ref on origin). Old tip `a296345c262183bc9e24b1034a359ede4747cc10`, kept as
`refs/heads/backup/M002-pre-rewrite`; new tip `bca54902cee900fd63d9a3d754fcdbd15f401109`.

1. T044's brief: the backticks around `packages/ngx-yeti/accessibility.css` in its `## Context` are removed in every
   commit that holds the line. GSD Path's brief lint checks a landed brief at its own base, where that path had
   already been renamed by T049, so every lint and plan approval failed on it.
2. T044's title, its H1, its landing subject, and the matching heading of `review/wave-4.cycle1.md` now say what the
   task did: enter's behaviour did not change (its criterion was repaired to keep enter.md:253).
3. The fix of `packages/ngx-yeti/src/item-names.node.spec.ts` that T021 landed now lands with T020, so every commit
   from T020 on passes that spec. T020's `files:` gains the spec and the `Files:` lines of the T020 and T021 landing
   bodies follow.
4. Every rewritten commit's SHA is replaced by its new SHA inside `.project/` contents, commit messages, and the
   names of `plan/build-recovery-<sha>` folders. Authors, dates, and all other content are unchanged.

## Evidence this rewrite does not re-create

Every record made before the rewrite (task `base:` fields, the verify ledger, review files, STATE log entries)
now names the rewritten commits. The checks those records describe ran on the original commits. The trees of
the two are identical except for T044's task file (changes 1 and 2) and, from T020 to T021, the item-names spec
(change 3). After the move, `isolation.py recover`, `check_task_briefs.py`, `check_handoffs.py plan` and every
wave review, `build_state.py ready`, and the item-names spec at each rewritten commit from T020 to T021 passed
(measured; `tmp/afk-m002/m002-rewrite/run-report.json`). The map of every old commit to its new one is
`history-rewrite-2026-10-13.map.tsv` beside this file.
