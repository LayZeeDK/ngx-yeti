---
id: T035
title: Record WebKit's pending-sheet frames in the setup-boundaries reset case and add upstream row O17
wave: 4
deps: []
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - apps/yeti-app-e2e/src/setup-boundaries.spec.ts
  - docs/specs/upstream-bugs.md
  - .claude/skills/ngx-yeti-specs/SKILL.md
---

# T035 — Record WebKit's pending-sheet frames in the setup-boundaries reset case and add upstream row O17

## Context

Build repair before wave 4. User ruling, verbatim (2026-10-11): "1-3: Approve." It approves three items put to the user; this task is the second: "2 fix the setup-boundaries WebKit flake in a small task". The test "keeps the preloaded card styled after $reset()" in `apps/yeti-app-e2e/src/setup-boundaries.spec.ts` (line 99) sometimes samples one `padding-top: 0px` frame of `#reset-card` in WebKit and fails. CI sets `failOnFlakyTests`, so a pass on a retry still fails the job, and SC8 needs every job green. The file is M001's; no M002 task had touched it.

Measured on 2026-10-11 in the ci-local containers, with the test's own steps plus a per-frame sampler, `--repeat-each=20 --retries=0`, on both route kinds:

- ci e2e, WebKit, production: 6 of 40 runs failed (3 prerendered, 3 server-rendered).
- ci e2e, WebKit, development: 4 of 40 (2 and 2).
- floor webkit-26-4 (the Playwright 1.59.1 image, WebKit 26.4): 2 of 40.
- Together 12 of 120 WebKit runs (10 %). Chromium and Firefox painted 0 unstyled card frames (measured earlier, commit ad2e786).
- Every unstyled frame had one state (11 of 11 sampled): the card link is in the head and its sheet is loaded with rules, from the preload, with no card.css request; the lift link is in the head with `sheet === null`, because lift.css is fetched again (Playwright's routing turned the cache off) and is still in flight; `document.styleSheets.length` is 2, not 4; the global stylesheet is loaded; and `border-top-width` is 0px too. In the next frame the card's sheet joins the document together with lift's.
- It is not upstream A4: the frame also appears in the development build, which inlines no critical CSS; the global stylesheet is loaded in every failing frame; and every card rule is missing, not only the token values.

The cause, read in WebKit's source: Style::Scope::didRemovePendingStylesheet (Source/WebCore/style/StyleScope.cpp) returns early while hasPendingSheets() is true, so a stylesheet that has finished loading joins the active set only when no other stylesheet is pending. After `$reset()` the loader inserts `card` and `lift` in one pass; card.css comes from the preload at once, and until lift.css lands WebKit keeps the card's loaded sheet out of the cascade. Headless Linux WebKit fires few frames a second, so a frame lands in that window of 0 to about 50 ms in about one run in ten. No package code is wrong: `packages/ngx-yeti/README.md` already says that listing every item of such a host is the inferred cover.

## Approach

- In WebKit, record the unstyled card frames as an annotation and do not assert them. Keep the assertion in Chromium and Firefox. Keep the request assertion (`requests()`) in every engine: it proves the preload's cover, because without the preload card.css is fetched again in Chromium and WebKit (measured at ad2e786). So WebKit keeps a regression check on the preload.
- The annotation's type is `webkit-pending-sheet-frames` in WebKit and `frames` elsewhere, with the count of unstyled and sampled frames as today. Do not reuse `a4-frames`: the cause is not A4. The precedent for recording frames an engine causes is `expectHydrationFrames` in `apps/yeti-app-e2e/src/support/style-probe.ts` and the inline copy in `apps/yeti-app-e2e/src/setup.spec.ts`.
- Write the branch inline in the test, as the test is written now. T036 moves every such site to one shared helper afterwards.
- One comment on the WebKit branch names the cause (WebKit applies no newly loaded sheet while another is pending) and the ledger row O17. No date, run count, or task id in a comment.
- Rejected alternatives: adding `lift` to the Fixture app's preload list removes the "without a preload" premise of the next test and of setup.md:343; a new per-frame link-state probe is new code for what the request assertion already proves.
- `docs/specs/upstream-bugs.md`: add row O17 to the table under "Other upstreams", in that table's seven columns. Upstream: WebKit (Playwright 1.63's WebKit 26.6 and the 26.4 floor build). Bug: the early return above, and its effect on a loaded sheet. Evidence: this spec file and the WebKit source file. Verified: measured, with the counts above and the state of the failing frame. Minimal reproduction: none. Upstream report: not searched; nothing is filed upstream. Check first that the id O17 is still unused.
- `.claude/skills/ngx-yeti-specs/SKILL.md`: the Departures row for setup.md:284 and setup.md:343 says the test asserts 0 unstyled frames of the preloaded card in every engine and that the cause of WebKit's wait is unknown. Change it to what the test now does: the assertion in Chromium and Firefox, WebKit's frames recorded as `webkit-pending-sheet-frames`, the request check in every engine, and the cause with row O17. Prettier formats the table.
- Never edit a spec under docs/specs; the ledger row and the Departures row carry the difference.
- The Verify runs the test 20 times per route kind in three WebKit container runs, then the whole spec once in Chromium and Firefox. The e2e servers use fixed ports (4310 to 4312), so the orchestrator serializes heavy runs.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/ngx-yeti-specs/SKILL.md`, and `.claude/skills/type-safety/SKILL.md`; read `references/ci-local.md` before running a container job.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. In WebKit the reset case records its unstyled and sampled card frames in an annotation of type `webkit-pending-sheet-frames` and does not assert them. In Chromium and Firefox it still expects no unstyled frame. In every engine it still expects the styled end state, the item links `card` and `lift`, and the request list with no card.css request.
2. The case passes 20 times on each route kind with `--retries=0` in the ci e2e WebKit production run, the ci e2e WebKit development run, and the floor `webkit-26-4` run: 120 runs, of which 12 failed before.
3. `docs/specs/upstream-bugs.md` holds row O17 in the Other upstreams table with the measured counts, the state of the failing frame, and the cause; nothing was filed upstream.
4. The Departures row for setup.md:284 and setup.md:343 states what the test asserts and what it records, and names O17 where it said the cause is unknown.
5. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && rg -q -F "webkit-pending-sheet-frames" apps/yeti-app-e2e/src/setup-boundaries.spec.ts && rg -q -F "| O17 " docs/specs/upstream-bugs.md && npm exec nx -- run-many -t lint typecheck -p yeti-app-e2e && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=production -- npx nx e2e yeti-app-e2e --output-style=static -- --project=webkit -g "preloaded card" setup-boundaries.spec.ts --repeat-each=20 --retries=0 && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e yeti-app-e2e --output-style=static -- --project=webkit -g "preloaded card" setup-boundaries.spec.ts --repeat-each=20 --retries=0 && node tools/ci-local/run-job.mjs floor webkit-26-4 -- npx nx e2e yeti-app-e2e --output-style=static -- --project=webkit -g "preloaded card" setup-boundaries.spec.ts --repeat-each=20 --retries=0 && node tools/ci-local/run-job.mjs ci e2e --matrix engine=chromium --matrix configuration=development -- npx nx e2e yeti-app-e2e --output-style=static -- --project=chromium setup-boundaries.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e yeti-app-e2e --output-style=static -- --project=firefox setup-boundaries.spec.ts; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-11 — created by planner (build repair before wave 4; user ruling "1-3: Approve.", item 2). The evidence in Context is from a spike of 2026-10-11 in a sidecar at c92e1b4; its files are not in the repository. The Verify ends by stopping the Nx daemon and keeps its own exit code; run it exactly as written and never set NX_DAEMON.
