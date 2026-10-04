# Review — wave 6, cycle 1

Wave verdict: pass
Cycle: 1
Depth: full
Tasks reviewed: 1

## T017 — Record rather than assert A4-affected hydration frames in the production e2e run, and document Chromium's A4 frame: pass

- ✅ Under `FIXTURE_CONFIGURATION=production`, the three sites listed in Context (card.spec.ts "adopts the server's card link at hydration"; setup.spec.ts "adopts the server's links with no unstyled frame"; setup.spec.ts "keeps the leaving host styled while it leaves and drops its link after") assert no 0px count over frames A4 can reach; each records that count as a test annotation of type `a4-frames`. The string `a4-frames` appears in both spec files. — `git show 9ca088d`: card.spec.ts:260-268 `if (isProduction)` pushes `a4-frames` and skips the 0px assertion; setup.spec.ts:155-166 pushes `a4-frames` then returns (all other assertions of that test run before the return); setup.spec.ts:265-270 records the from-first-paint count as `a4-frames` in production and asserts only the post-styled leave window.
- ✅ In the development configuration the two adoption tests still assert 0 unstyled frames in Chromium from first paint, and the leaving-host test still asserts 0 unstyled frames in every engine; in production the leaving-host test still asserts 0 unstyled frames over the leave window. — card.spec.ts:268 `else if (browserName === 'chromium')` keeps the `toEqual([])`; setup.spec.ts:173-175 unchanged Chromium assertion; setup.spec.ts:257-263 asserts the leave window (sampled via `sampleFrames` after `not.toHaveCSS('padding-top','0px')`, before the removal click) in both configurations with a non-empty sample check; setup.spec.ts:271-275 asserts from first paint in development in every engine.
- ✅ The client-only preload 0-frame assertions (card.spec.ts "renders the preloaded client-only card with 0 unstyled frames while the server hosts are connected"; setup.spec.ts "renders the client-only card with 0 unstyled frames through the preload") are unchanged in both configurations. — diff touches neither test; card.spec.ts:341-344 and setup.spec.ts:~505-509 still assert `toEqual([])` without an `isProduction` branch.
- ✅ `FIXTURE_CONFIGURATION=production npx nx e2e yeti-app-e2e --skip-nx-cache -- card.spec.ts setup.spec.ts --repeat-each=10` and the development run of the same files pass. — orchestrator Verify in T017 Log: pass, exit 0; .project/build/verify-ledger.jsonl last entry `result: pass` (development 46 passed, 2 skipped); coder Log: production repeat 400 passed, 80 skipped.
- ✅ `.claude/skills/ngx-yeti-specs/SKILL.md` "Departures from the records" has a new row stating A4 reaches Chromium too, 1 of 20 production runs, and that production records the frames while development asserts 0; existing rows are unchanged. — diff is a single `+` line at SKILL.md:40 with the five columns (Record `setup.md:263`, `setup.md:338`; skill `ngx-yeti-testing`); no other line changed.
- ✅ `packages/ngx-yeti/README.md` carries an A4 note, in one paragraph or list item that names A4 and Chromium on the same source line, naming upstream bug A4 and saying Chromium showed a single frame in a production repeat run, not only Firefox, without recommending an inlining setting. — README.md:87, one line: "upstream bug A4 ... 1 to 2 such frames in Firefox; Chromium showed a single frame here too, in 1 of 20 production repeat runs ... Neither setting is recommended until both are measured." Banned-word rg over README: no hits.
- ✅ Nothing under `docs/specs/` changes. — `git diff --stat 173f52c 9ca088d -- docs/specs` is empty.
- ✅ Bisect-safe: `npx prettier --check .` and `npm exec nx -- run-many -t lint typecheck test` pass at this task's commit. — coder Log: `npx prettier --check .` exit 0; `nx run-many -t lint typecheck test -p yeti-app yeti-app-e2e` exit 0 (the only projects whose sources changed; README and SKILL.md are not lint/typecheck inputs); the task Verify (orchestrator, isolated) includes prettier on the four files and lint/typecheck of yeti-app-e2e.

Warnings (non-blocking):
- Site sweep re-run: rg of `toEqual([])` in apps/yeti-app-e2e/src finds no other 0px frame assertion on a server-rendered item; remaining ones are client-only (card.spec.ts:344, setup.spec.ts deferred card) or non-frame (style mutations, links, CSP, axe). lift.spec.ts and setup-serving.spec.ts carry no frame assertion.
- The orchestrator Verify tail in the Log shows only WebServer stack noise (expected server-error fixtures); the pass verdict comes from the recorded exit code and ledger.

Contract violations (blocking):
- none — changed paths are the four declared files plus the task file, whose diff touches only `status`, `agent`, `base` and appends Log entries.

## Summary for orchestrator

- blocked findings: none
- repeat offenders: none
- warnings worth a human eye: none
