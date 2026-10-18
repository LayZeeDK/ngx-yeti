# Synthesis

Scope: milestone M002 layouts-and-button (milestone lane). Built against the program synthesis `.project/SYNTHESIS.md`, `.project/CHARTER.md`, and the M002 entry of `.project/ROADMAP.md`; the entry lists no open questions, so no milestone research or decide ran. Inspect ran at `f35b35f` (`research/evidence-codebase.md`, `research/DOCS-AUDIT.md`).

## Settled

- Source records and precedence — `docs/specs/` is immutable except its two living ledgers; user rulings > CHARTER > INTENT > Departures table in `.claude/skills/ngx-yeti-specs/SKILL.md` > records (program SYNTHESIS Settled; CHARTER Constraints)
- Milestone scope and success criteria — INTENT.md SC1 to SC9, its Edge coverage, Prohibitions, Scope in/out, and Constraints, which refine ROADMAP.md M002 after five record audits and the user's rulings of 2026-10-10 (INTENT.md Corrections)
- Cross-milestone cases — M002 builds each case's M002-owned part with a plain-HTML stand-in; the partner-dependent assertions land in M003, M004, M005, and M007 as INTENT.md Scope: out lists; the receiving roadmap entries gain matching lines at the next milestone-boundary re-slice (user ruling 2026-10-10)
- Entry points — one secondary entry point per item, created only with `nx g @nx/angular:library-secondary-entry-point --library=ngx-yeti --name={item} --skipModule`; the primary `ngx-yeti` entry point stays types-only (program SYNTHESIS Settled, Entry points; ADR 0011 clause 10)
- Item styles — reference-counted head links through the M001 `ngx-yeti/styles` loader, Yeti's rank order, one presence attribute per item set by its root directive only (program SYNTHESIS Settled, Item styles; ADR 0060; ADR 0045; ticket 50 decisions 6 and 7)
- Accessibility stylesheet — `ngx-yeti/accessibility.css` exists from M001 with the A11Y-30 workaround; A11Y-1a is its first item rule, and any rule a failing conditional measurement brings follows its ledger row (INTENT.md Scope in, E7; program SYNTHESIS Settled, Package accessibility stylesheet)
- Yeti dependency — vendored at pin `f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, built by `yeti-css:yeti-build`; pin held (program SYNTHESIS Settled; CHARTER Constraints)
- Rendering modes and JavaScript off — SSR, prerendering, hydration, `withI18nSupport()`, `@defer`, event replay; readable with JavaScript off; zoneless (program SYNTHESIS Settled, Rendering modes)
- Testing — four layers per ADR 0014 and the Departures table's floor and hover rows; screen-reader checks automated with Guidepup in a `voiceover` job (real VoiceOver, real Safari, `macos-26`) and an `nvda` job (`windows-2025`, Chromium and Firefox, also local), replacing ADR 0015 point 7's manual release tests through Departures rows (program SYNTHESIS Settled, Testing; INTENT.md SC9; user rulings 2026-10-10)
- Checks — every `ci.yml` and `floor.yml` job passes locally (container jobs through `tools/ci-local/run-job.mjs`; the macOS-only `safari` and `voiceover` jobs exempt) and in CI on the milestone PR before merge (INTENT.md SC8; user ruling 2026-10-10)
- Integration — `pull-request` for the project and this milestone (user ruling 2026-10-10; STATE.integration)
- Type gate — every Verify running `test`, `build-fast`, or a Storybook `-c fast` target also runs `nx typecheck` for that project (CHARTER Constraints; AGENTS.md)
- Shape and naming — directives first; `yeti` selectors, `Yeti`/`NgxYeti` classes (ADR 0080 for collisions, for example `NgxYetiEnter`, `NgxYetiPaint`); no import arrays (program SYNTHESIS Settled, Shape and naming)
- Browser target — Baseline 2025 (ADR 0002)
- Vetoed checks — every deferred check, generator, and `ng add` is out (CHARTER Full scope: out)
- Docs-audit alignment — queue rows 1 to 17 ruled accept-drift; nothing queued for planning (`research/DOCS-AUDIT.md` User rulings, 2026-10-10)
- Commits — Path subjects; every task commit bisect-safe per AGENTS.md "Commits" (CHARTER Constraints)
- Stack — Angular 22.2, Nx 23.2, TypeScript 6.0, Vitest 4.1, Storybook 10.6, Playwright 1.63, Node 24, npm (CHARTER Constraints)

## For the planner

- **Wave-1 blockers**: (1) the static attribute measurement of ticket 50 decision 9 (no painted frame with a written-back `align`, `border`, `nowrap`, or link `disabled`), because a failure switches nine M002 specs to bound-only inputs (INTENT E8); (2) Guidepup driving NVDA on this Windows 11 ARM64 machine with a native arm64 browser, and the `voiceover` job's setup on `macos-26`, before SC9's tests are written; (3) the preload-list growth and enter's with-and-without-preload need (INTENT E9, E15), settled by a Departures row or a second Fixture build configuration.
- **Walking skeleton**: `stack` and `center` at their own entry points with stories and the axe gate, layer-2 and layer-3 specs, prerendered and server-rendered Fixture routes under JavaScript on and off, the contract check, the packed consuming build, and `setup--item-links` proving their rank order; then `button` with A11Y-1a and event replay.
- **Pitfalls → tasks**: `fastCompile` never type-checks → every Verify adds `nx typecheck`. Generator only for entry points. Targets reading Yeti's `dist/` need `^yeti-build`. Upstream O2 → geometry assertions wait for the inserted stylesheet. Hover assertions in layer 2 or 4. No exact-array assertions on files a later task extends (LESSONS.md; existing `itemLinks` assertions). Same-wave tasks sharing a Fixture route need an integrated uncached run before wave review (LESSONS.md). Never edit `vendor/yeti` or `docs/specs` outside its two ledgers.

## User rulings

- 2026-10-10: automated screen-reader tests are always preferable; SC9 approved; all checks pass locally and in CI for every milestone and PR; macOS-only jobs exempt locally with NVDA as local coverage; pull-request integration; NVDA lane in M002; intent approved (INTENT.md Corrections, verbatim).

## Still unknown

- Whether the static attribute measurement passes — wave-1 measurement (INTENT E8).
- Whether Guidepup drives NVDA on Windows 11 ARM64 here — wave-1 spike (inferred from NVDA 2026.1+ and `@guidepup/setup` on `windows-11-arm`).
- Whether VoiceOver's phrase capture merges live-region phrases for spinner — measured by SC9; one human listen per release until proven.
