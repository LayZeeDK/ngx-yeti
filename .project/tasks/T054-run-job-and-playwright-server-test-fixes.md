---
id: T054
title: Key run-job.mjs output by checkout, end a leg when the host tar fails, accept only decimal counts, and make the Playwright server test survive load
wave: 9
deps: [T053]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - tools/ci-local/run-job.mjs
  - tools/ci-local/run-job.test.mjs
  - references/ci-local.md
  - tools/playwright-server/container.test.mjs
---

# T054 — Key run-job.mjs output by checkout, end a leg when the host tar fails, accept only decimal counts, and make the Playwright server test survive load

## Context

Fifth build repair (2026-10-13): survivors of review round 2 of M002 (range 4504b4c..7793730, which the history rewrite of 2026-10-13 maps to 0172a0a..fb1a8c6 with the same contents for these files; line numbers at 7793730 unless stated; triaged by Claude on 2026-10-13 in the git-ignored local record tmp/afk-m002/lars-review/r2/triage.md, items 2, 3, 9, and 16, with the source reports g4-code-reviewer.md and g4-silent-failure.md beside it). Every finding is inlined here; the lines have moved since (T052 and T053 landed after the review), so find each site by its quoted code. T053 types both files first, and this task keeps them typed.

Triage item 2 (minor): "run-job.mjs reports and log folders are keyed by label only (:495, :570, :422), so two worktrees running one leg delete each other's output (g4-code-reviewer F1). Fix: add the checkout hash to the folder; ci-local.md says it." Source evidence, verbatim: "tools/ci-local/run-job.mjs:495 (`const out = join(tmpdir(), 'ngx-yeti-run-job', label)`), :570 (`rmSync(current.out, { recursive: true, force: true })` at the start of each leg), :422 (`createWriteStream(log)` into that folder). ... the volume names carry a hash of the checkout path (:485-486, `ngx-yeti-run-job-${checkout}-...`), and references/ci-local.md:44 limits the rule to 'Run one job at a time per checkout', so two worktrees may run the same job at once. ... Failure: worktree B starting `ci e2e` leg `chromium-development` deletes worktree A's folder for the same leg while A is still writing to it. A loses its `run-job.log` and the `dist/.playwright` reports that its container copies into the bind-mounted `/out`, and A's closing summary points to a folder that now holds B's output. ... Fix direction: put the checkout hash in the folder (`join(tmpdir(), 'ngx-yeti-run-job', checkout, label)`) and state it in ci-local.md."

Triage item 3 (minor): "run-job.mjs: a failed host tar leaves docker stdin open (`{ end: false }`, :454) and the leg hangs (g4-silent-failure F1). Fix: end docker stdin or remove the container when tar exits non-zero or errors." Source evidence, verbatim: "tools/ci-local/run-job.mjs:454 (`tar.stdout.pipe(docker.stdin, { end: false })`), :438-452 and :364. ... this range added `{ end: false }` so that docker's stdin stays open for the new watchdog (:366-368). Before the change, the end of `tar.stdout` closed docker's stdin, so the container's `tar -xf - -C /src` hit EOF and failed loudly. Now nothing ever ends `docker.stdin`. The host tar's exit code (`tarStatus`) is read only inside `docker.on('close')`. Failure: say the host tar exits before it writes a complete archive. Causes include a tar that rejects `--null -T -` ..., tar missing from PATH, or an early abort. The container's `tar -xf -` then blocks forever on a stdin that never closes. Docker never closes, `done()` is never called, and the run neither ends nor exits non-zero. ... An AFK task Verify that chains `run-job.mjs ... &&` hangs until an outer timeout. ... Fix direction: in `tar.on('close')`, when the code is non-zero, or in tar's `error` handler, end `docker.stdin` or run `docker rm -f <name>`, then resolve the leg with 1. Leave `end: false` in place only for the success path." The g4 code reviewer measured that GNU tar 1.35 in the container exits after 24 ms with its stdin still open on the success path, so the watchdog design itself is sound.

Triage item 9 (cosmetic): "run-job.mjs `count()` accepts '' and non-decimal numbers (:30-38) (g4-silent-failure F5). Fix: /^\d+$/." Source evidence, verbatim: "`Number('')` is 0, so `--e2e-workers \"\"` (for example an unset shell variable in quotes) silently means 'CI's one worker'. `Number('0x3')` and `Number('1e1')` also pass. Fix direction: accept only `/^\d+$/` before calling `Number`."

Triage item 16 (minor): "tools/playwright-server/container.test.mjs:279 (readiness wait at :103) fails under load: 'run-server did not answer' at 25.5 s in T052's uncached run-many, 5/5 pass alone at ~6.3 s (measured, Claude, 2026-10-13). Fix: a readiness wait that does not race the whole suite's load (longer bound or wait on the server's own ready signal)." The failing test is "stops once no admitted connection has been open for the idle time"; the wait is `ready(port, token)`, which polls the token path 100 times at 200 ms and then throws `run-server did not answer`. This item is not in the brief's item list 1 to 14; the planner includes it because the STATE log of 2026-10-13 sends triage items 1 to 16 to this repair.

## Approach

- Reports and logs: the per-leg folder is `join(tmpdir(), 'ngx-yeti-run-job', <the checkout hash the volume names already use>, label)`; the leg log `run-job.log` and the copied reports go there, and the closing summary prints that path. `references/ci-local.md` says where a leg's output lands and that two checkouts no longer share it; keep its "Run one job at a time per checkout" rule.
- Host tar failure: when the host `tar` exits non-zero or emits `error`, end `docker.stdin` (or remove the leg's container with `docker rm -f <name>`), and the leg ends as FAIL with exit 1 and tar's status in its message. The success path keeps `end: false` and the stdin watchdog. Show the failure path once against a real container leg (for example a scratch checkout where one tracked file is deleted, so tar exits 2 with "Cannot stat"), and record the command, its wall time, and its exit code in the Log.
- `count()`: only `/^\d+$/` text reaches `Number`; `''`, `0x3`, `1e1`, `-1`, and ` 3` exit 2 with the existing message. Add `node:test` cases to `tools/ci-local/run-job.test.mjs` for the accepted and refused forms, through an export or by running the script with `--dry-run`.
- Readiness: the Playwright server test waits on run-server without racing the whole suite's load: either a bound derived from the observed worst case with margin, or the server's own ready signal. Do not raise the test's own assertion timeouts, and do not change `tools/playwright-server/container.mjs` (its hash recreates the shared server container; see T053). Reproduce the failure under load first (the root `test` target inside `npm exec nx -- run-many -t test --skip-nx-cache`, as in T052's run) and record whether and how often it fails at base; then show the fix passing the same load three times.
- Keep both scripts typed (Interface contract). Do not touch `.github/workflows/`; T028 owns any workflow change.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`; `references/ci-local.md`; AGENTS.md "Scripts".

## Interface contract

- The committed scripts are typed (T053): `tsconfig.scripts.json` at the repository root type-checks every committed `.mjs`, `.cjs`, and `.js` file outside `vendor/` and `docs/specs/`, each starting with `// @ts-check` (after a shebang, if any) and typed with JSDoc. `npm exec nx -- run @ngx-yeti/source:typecheck` runs `tsc -p tsconfig.scripts.json && node --test tools/typecheck/scripts-coverage.test.mjs` and exits 0. A task that edits one of these scripts keeps its `// @ts-check` line and its JSDoc types, adds no `any` and no unchecked assertion, and leaves that command at 0 errors.

## Intent coverage

- None

## Acceptance criteria

1. A leg's reports and `run-job.log` land in a folder under `ngx-yeti-run-job/<checkout hash>/<label>` in the OS temp folder, and `references/ci-local.md` says so.
2. When the host tar fails, the leg ends with exit 1 and names tar's status instead of hanging; the Log records one real run of that path with its exit code.
3. `--legs` and `--e2e-workers` accept only decimal digits: `''` and `0x3` exit 2 (tests in `tools/ci-local/run-job.test.mjs`), and the existing quoting and leg tests still pass.
4. `tools/playwright-server/container.test.mjs` passes three runs of `npm exec nx -- run-many -t test --skip-nx-cache`; the Log records the base measurement and the three runs.
5. `npm exec nx -- run @ngx-yeti/source:typecheck` exits 0 natively (the `static` job's check; its coverage test needs the Git index, which a container leg does not have), the root `test` target passes inside the `unit` container through `node tools/ci-local/run-job.mjs ci unit -- npx nx run @ngx-yeti/source:test`, and `npx prettier --check` passes on the four files.

## Verify

```bash
npm ci && npx playwright install chromium && (node tools/ci-local/run-job.mjs ci e2e --dry-run --e2e-workers 0x3; test $? -eq 2) && (node tools/ci-local/run-job.mjs ci e2e --dry-run --e2e-workers ""; test $? -eq 2) && node tools/ci-local/run-job.mjs ci e2e --dry-run --e2e-workers 2 && node --test tools/ci-local/run-job.test.mjs && npm exec nx -- run @ngx-yeti/source:typecheck --skip-nx-cache && npm exec nx -- run-many -t test --skip-nx-cache && npm exec nx -- run-many -t test --skip-nx-cache && node tools/ci-local/run-job.mjs ci unit -- npx nx run @ngx-yeti/source:test && npx prettier --check tools/ci-local/run-job.mjs tools/ci-local/run-job.test.mjs references/ci-local.md tools/playwright-server/container.test.mjs; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-13 — created by planner (build repair 5), from review round 2 triage items 2, 3, 9, and 16 (tmp/afk-m002/lars-review/r2/triage.md).
- 2026-10-13 — planner (build repair 5, correction measured by the orchestrator): the Verify's container leg ran the root `typecheck` target, which cannot pass in a container: its coverage test calls `git ls-files`, and `run-job.mjs` ships the tree as a tar of `git ls-files -co` with no `.git`. The leg now runs the root `test` target (`npx nx run @ngx-yeti/source:test`), which the `unit` job runs and which holds the `container.test.mjs` case this task makes survive load; the root `typecheck` stays native in the same Verify. Criterion 5 says so.
