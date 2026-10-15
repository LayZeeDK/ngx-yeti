---
id: T070
title: Make run-job refuse a workflow name, job id, or matrix value that is not a safe name, and refuse a leg report folder outside its checkout folder
wave: 14
deps: [T053, T066]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - tools/ci-local/run-job.mjs
  - tools/ci-local/run-job.test.mjs
  - references/ci-local.md
---

# T070 — Make run-job refuse a workflow name, job id, or matrix value that is not a safe name, and refuse a leg report folder outside its checkout folder

## Context

Ninth build repair (2026-10-15): finding 1 of security review round 2 of M002 (range fb1a8c6..bc55b9e, HEAD bc55b9e; the git-ignored local record tmp/afk-m002/lars-review/security-r2.md). Its findings 2 to 5 are Informational and accepted as written; they are not planned. No file of this task changed between bc55b9e and 6ef32da, so the finding's line numbers hold at this task's base. Re-checked by the orchestrator in source at 6ef32da: tools/ci-local/run-job.mjs:698 builds the leg label from the workflow, job name and raw matrix values; `legPaths` (:471-480) joins it unsanitised into the host `out` path; :775 removes `out` recursively and the leg mounts it writable; only the container name is sanitised (:701). Settled earlier, not to be reopened: `fail()` keeps exiting as it does (round 3 declined thermos quality L3); `leg()` takes its checkout hash, volume, and `out` from one `legPaths` call (T066).

Finding 1 (Medium), verbatim:

"1. tools/ci-local/run-job.mjs:471-482 (`legPaths`), 698-699, 728, 775-776: [A01] [CWE-22] path traversal from workflow matrix values into a host-side recursive delete and a writable bind mount.
   - Evidence (measured, from reading the code at bc55b9e): `label = [workflow, jobName, ...Object.values(combo)].join('-')`. The values come straight from `strategy.matrix` in the workflow YAML and are only checked to be a mapping or list. `legPaths` builds `out = join(tmpdir(), 'ngx-yeti-run-job', checkout, label)`. The host then runs `rmSync(out, { recursive: true, force: true })` and `mkdirSync(out)`, and passes `-v ${out}:/out` to `docker run`. The container `name`, built from the same label, goes through `.replace(/[^\w.-]/g, '-')`. `out` gets no such cleaning.
   - Evidence (measured, node `path.join`): the label `ci-e2e-/../../../../../../Users/victim` resolves to `C:\Users\LARSGY~1\Users\victim`, which is outside the temp folder.
   - Failure scenario (inferred): a contributor PR sets a matrix value such as `configuration: ['/../../../../../../Users/<name>/Documents']` in ci.yml. Lars checks the PR out and runs `node tools/ci-local/run-job.mjs ci e2e`, as AGENTS.md says to do with every container job. Before Docker starts, the host deletes that folder recursively, recreates it, and mounts it writable into a container that runs the PR's own `run` text. The PR script can then write into a host folder such as the Startup folder or `~/.claude` and gain persistence on the host. A `:` in a value also changes the `-v` spec.
   - Range note (measured): the shape was there before this range (`out = join(tmpdir(), 'ngx-yeti-run-job', label)` at fb1a8c6, with the same `rmSync`). This range rewrote the line into `legPaths` and added a test for it. r1 item 3 covered only quoting into the container, where the container contains the damage. This issue happens on the host side.
   - Severity: the scan rated it Low. The reviewer raised it to Medium because it crosses the container boundary that the threat model relies on, and the documented "run every container job locally" practice makes the precondition realistic. It stays below High because jobs without a container already run PR code natively.
   - Fix direction: send `label` through the same `[^\w.-]` -> `-` cleaning as `name` before calling `legPaths`, or reject matrix values and job ids that fail `^[\w.-]+$` in `loadJob` or `combinations`, which covers every consumer. Also check that `out` resolves under `join(tmpdir(), 'ngx-yeti-run-job', checkout)` before `rmSync`. Add a run-job.test.mjs case with a `..` matrix value."

From the same report's Threat Patterns, verbatim: "One shared validator for matrix values and job ids in `loadJob` or `combinations` fixes every consumer at once." From its Missed surfaces, verbatim: "The shared validator from Finding 1 would cover both." (the `-e` env values at run-job.mjs:729-731 and the per-folder volume specs at :723).

Read by the planner at 6ef32da: the real names today are the workflows `ci` and `floor`; the job ids `static`, `package`, `unit`, `e2e`, `safari`, `voiceover`, `nvda` (ci.yml) and `chromium-141`, `firefox-145`, `webkit-26-4`, `firefox-146-e2e` (floor.yml); the matrix values `chromium`, `firefox`, `webkit`, `development`, `production`, `tailwind-c1`, `tailwind-c2` (ci.yml `e2e`) and the numbers `1`, `2` (floor.yml `firefox-146-e2e` `shard`). All of them match `^[\w.-]+$`.

## Approach

- Reject, do not rewrite: the finding offers cleaning the label or rejecting the inputs; this task rejects. One shared check refuses the workflow name, the job id, and every matrix value (by its text, `String(value)`, so the numeric `shard` values pass) that does not match `^[\w.-]+$` or is made only of dots (`.`, `..`, `...`). It runs before `legPaths`, `rmSync`, `mkdirSync`, or `docker` see the value, also under `--dry-run`, and the error names the offending value and what it is (workflow name, job id, or matrix key). The job id is checked before it is looked up, so a job id with a separator gets this refusal, not "has no job". A non-scalar matrix value is refused the same way.
- Second layer, in `legPaths` or its caller: before anything is removed, the resolved `out` must lie strictly below `join(tmpdir(), 'ngx-yeti-run-job', <checkout>)` (not equal to it, not beside it, no `..` step, not on another drive); otherwise the run refuses and names the folder. Compare resolved paths (for example with `path.relative`), not string prefixes.
- Pitfall: `fail()` calls `process.exit(2)`, so a test that calls a refusing function in process ends the test runner. Either test through a child run of the script (as the existing `dryRun` helper does), or let the shared check throw and have the CLI path report it through `fail()`; the coder picks. `fail()` itself stays as it is.
- Pitfall: `loadJob` reads only `.github/workflows/<workflow>.yml` under the checkout. Do not add a fixture workflow under `.github/workflows/` (GitHub would run it) and do not touch `.github/workflows/`. A hostile matrix reaches the test through an exported function or a fixture outside `.github/workflows/` the coder chooses; leave no fixture file outside `tools/ci-local/run-job.test.mjs` unless it is created in a temporary folder and removed by the test.
- Tests in `tools/ci-local/run-job.test.mjs`: a `..` matrix value, a matrix value holding a path separator, a job id holding a path separator, and a label that would put `out` outside the checkout folder, each refused with the value named. Show each failing against the base `run-job.mjs` (6ef32da) on its assertion, not only on a missing export, and record the runs in the Log.
- Tests: load every job of `.github/workflows/ci.yml` and `.github/workflows/floor.yml` with `js-yaml` and show that each job id and each matrix value passes the shared check; and `--dry-run` every container job of both workflows (ci `unit`, ci `e2e`, floor `webkit-26-4`, floor `firefox-146-e2e`) and see exit 0. The dry runs need Git (`sourceFiles`), so they may skip on the existing `gitRefusal` probe with its reason; the YAML-level check never skips.
- Keep the dry run's printed output and the run's closing summary line (`pass  <label>  <time>  reports: <out>  log: <log>`) in their current shape; the existing dry-run mount test and the Verify read them.
- `references/ci-local.md` says which names `run-job.mjs` accepts (the workflow name, the job id, and every matrix value match `^[\w.-]+$` and are not made only of dots) and that it refuses any other before it creates or removes anything. It states what stays true, without history.
- Code comments: only what the code cannot say; no planning IDs, dates, or measurements.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/type-safety/SKILL.md`; `references/ci-local.md`; AGENTS.md "Scripts" and "Run CI locally".

## Interface contract

- The committed scripts are typed (T053): `tsconfig.scripts.json` at the repository root type-checks every committed `.mjs`, `.cjs`, and `.js` file outside `vendor/` and `docs/specs/`, each starting with `// @ts-check` (after a shebang, if any) and typed with JSDoc. `npm exec nx -- run @ngx-yeti/source:typecheck` runs `tsc -p tsconfig.scripts.json && node --test tools/typecheck/scripts-coverage.test.mjs` and exits 0. A task that edits one of these scripts keeps its `// @ts-check` line and its JSDoc types, adds no `any` and no unchecked assertion, and leaves that command at 0 errors.

## Intent coverage

- None

## Acceptance criteria

1. `tools/ci-local/run-job.mjs` refuses a workflow name, job id, or matrix value whose text does not match `^[\w.-]+$` or is made only of dots, with an error that names the value, before it computes `out`, removes or creates a folder, or starts Docker, with or without `--dry-run`; `node tools/ci-local/run-job.mjs ci 'e2e/..' --dry-run` exits 2 with an error naming `e2e/..` that is not "has no job".
2. Before any `rmSync`, the run refuses a leg whose resolved `out` is not strictly below `join(tmpdir(), 'ngx-yeti-run-job', <checkout>)`, and names the folder.
3. `tools/ci-local/run-job.test.mjs` has tests for a `..` matrix value, a matrix value with a path separator, a job id with a path separator, and an `out` outside the checkout folder, each asserting the refusal and the named value; the Log records each failing against the base `run-job.mjs` on its assertion.
4. A test loads every job of `.github/workflows/ci.yml` and `.github/workflows/floor.yml` and shows every job id and matrix value passes the check (never skipped), and a dry run of each of their four container jobs exits 0 (skipped only on the `gitRefusal` probe).
5. `references/ci-local.md` says which names `run-job.mjs` accepts and that it refuses others before creating or removing anything.
6. `node --test tools/ci-local/run-job.test.mjs` passes, `npm exec nx -- run @ngx-yeti/source:typecheck` exits 0, a real `ci unit` container leg through `run-job.mjs` passes and writes its `run-job.log` in the reports folder its summary names, and `npx prettier --check` passes on the task's files.

## Verify

```bash
set -o pipefail && npm ci && node --test tools/ci-local/run-job.test.mjs && refusal_log="$(mktemp)" && { node tools/ci-local/run-job.mjs ci 'e2e/..' --dry-run > "$refusal_log" 2>&1; refused=$?; cat "$refusal_log"; test "$refused" -eq 2; } && rg -q -F 'e2e/..' "$refusal_log" && ! rg -q -F 'has no job' "$refusal_log" && npm exec nx -- run @ngx-yeti/source:typecheck && leg_log="$(mktemp)" && node tools/ci-local/run-job.mjs ci unit -- npx nx run @ngx-yeti/source:test 2>&1 | tee "$leg_log" && report_log="$(rg -o -r '$1' '^pass  ci-unit  .*  log: (.+)$' "$leg_log")" && node -e 'process.exit(require("node:fs").statSync(process.argv[1]).size > 0 ? 0 : 1)' "$report_log" && npx prettier --check tools/ci-local/run-job.mjs tools/ci-local/run-job.test.mjs references/ci-local.md; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-15 — created by planner (build repair 9), from tmp/afk-m002/lars-review/security-r2.md finding 1; findings 2 to 5 accepted as written and not planned.
