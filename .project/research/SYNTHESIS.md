# Synthesis

Scope: milestone M001 walking-skeleton (milestone lane). Built against the program synthesis `.project/SYNTHESIS.md`, `.project/CHARTER.md`, and the M001 entry of `.project/ROADMAP.md`; the entry lists no open questions, so no milestone research or decide ran.

## Settled

- Source records and precedence — `docs/specs/` is immutable; user rulings > CHARTER > INTENT > Departures table in `.claude/skills/ngx-yeti-specs/SKILL.md` > records (program SYNTHESIS Settled; CHARTER Constraints)
- Milestone scope and success criteria — INTENT.md SC1 to SC7 and its Scope in/out, which refine ROADMAP.md M001 under the roadmap's cross-milestone slicing note (INTENT.md Corrections, 2026-10-04)
- Cross-milestone cases — composed cases use plain-HTML stand-ins in M001; the partner-dependent assertions land in M002, M004, M006 as those roadmap entries list (INTENT.md Scope: out; ROADMAP.md re-slice approved 2026-10-04)
- Entry points — one secondary entry point per item plus `styles`; primary `ngx-yeti` types-only; created only with `nx g @nx/angular:library-secondary-entry-point --library=ngx-yeti --name={item} --skipModule` (program SYNTHESIS Settled, Entry points; ADR 0011 clause 10)
- Placeholders — `NgxYeti` and `Highlight` removed when setup makes the primary entry point types-only; their fixture, story, SSR, and e2e assertions move to card in the same change (program SYNTHESIS Settled, Placeholders)
- Accessibility stylesheet — created empty in `@layer ngx-yeti` in M001 with a Departures row, published through ng-packagr assets and the `exports` map, resolved by Storybook and `yeti-app` (INTENT.md Scope: in and Corrections; program SYNTHESIS For the planner wave-1 blocker 3)
- Item styles — reference-counted head links to the consumer's Yeti build at `yeti-css/` relative to base href, rank order, one presence attribute per item, server write and client adoption; no Yeti CSS shipped (program SYNTHESIS Settled, Item styles; ADR 0060; ADR 0045)
- Generated types — `yeti-types.ts` generated from `yeti.d.ts` at the pin; published declarations never import `yeti-css` (program SYNTHESIS Settled, Generated types)
- Yeti dependency — vendored at pin `f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, built by `yeti-css:yeti-build`, no `yeti-css` dependency or peer; pin held (program SYNTHESIS Settled, Yeti dependency; CHARTER Constraints)
- Angular peers and version format — peers `^22.2.0`; version `0.{major}{minor:2}{breaking:2}.{patch}-yeti.{Yeti version}.g{SHA}` (program SYNTHESIS Settled; ADR 0017)
- Rendering modes and JavaScript off — SSR, prerendering, hydration, `withI18nSupport()`, `@defer`; readable with JavaScript off; zoneless (program SYNTHESIS Settled, Rendering modes)
- Testing — four layers per ADR 0014 and the floor row of the Departures table (program SYNTHESIS Settled, Testing)
- Type gate — every Verify running `test`, `build-fast`, or a Storybook `-c fast` target also runs `nx typecheck` for that project (CHARTER Constraints; AGENTS.md)
- Shape and naming — directives first; `yeti` selectors, `Yeti`/`NgxYeti` classes; no import arrays (program SYNTHESIS Settled, Shape and naming)
- Browser target — Baseline 2025 (ADR 0002)
- Vetoed checks — every deferred check, generator, and `ng add` is out (CHARTER Full scope: out)
- npm allowScripts — no policy committed; plans do not build on the "withheld" claim (program SYNTHESIS decision "npm allowScripts approvals")
- Playwright webServer failure — wave-1 blocker: reproduce or rule out in a pipeline linked worktree and the primary checkout before any Verify uses `nx e2e`; fix `webServer.command` in all three e2e projects if it reproduces (program SYNTHESIS decision "Playwright webServer failure")
- Docs-audit alignment — rulings 1 to 5 of `research/DOCS-AUDIT.md` are folded into this plan as ordinary tasks (ROADMAP.md M001 Scope in; orchestrator acting as owner under the user's 2026-10-04 goal)
- Commits — Path subjects; every task commit bisect-safe; AGENTS.md "Commits" updated to say so (CHARTER Constraints, Commits)
- Stack — Angular 22.2, Nx 23.2, TypeScript 6.0, Vitest 4.1, Storybook 10.6, Playwright 1.63, Node 24, npm (CHARTER Constraints)

## For the planner

- **Wave-1 blockers**: (1) the Playwright `webServer` failure in a pipeline linked worktree and the primary checkout; (2) the secondary entry-point layout via the generator, proven by `nx build ngx-yeti`, `nx build-fast ngx-yeti`, `nx typecheck ngx-yeti -c src`, the Storybook globs, and the Vitest spec roots; (3) `ngx-yeti/accessibility.css` resolving in Storybook and `yeti-app`; (4) the ADR 0060 loader adopting server-inserted links at hydration with 0 link mutations after `DOMContentLoaded`.
- **Walking skeleton**: the `setup` spec's `ngx-yeti/styles` loader plus `card` and `lift` at their own entry points, each with stories and the axe gate, browser and SSR specs, prerendered and server-rendered Fixture-app routes under JavaScript on and off, the contract check, and a packed consuming build; placeholders removed in the same change that moves their assertions to `card`.
- **Pitfalls → tasks**: `fastCompile` never type-checks → every Verify adds `nx typecheck`. Hand-made entry points skip `typecheck -c src` → generator only. Targets that read Yeti's `dist/` need `^yeti-build`. Local runs are Chromium only → cross-engine claims need CI. Upstream O2 (stale computed styles after a link insertion in Chromium and WebKit) → geometry assertions wait for the inserted stylesheet. Hover assertions belong in layer 2 or 4 under the Departures hover row. Never edit `vendor/yeti` or `docs/specs`. Do not re-add `.project` to `.gitignore`.

## User rulings

- Docs-audit queue rulings 1 to 5: fold into the M001 plan → included (orchestrator acting as owner under the user's 2026-10-04 goal; the ROADMAP.md M001 scope names them).

## Still unknown

- Cause of the Playwright `webServer` failure — wave-1 spike.
- Whether geometry assertions after the first link insertion hit upstream O2 — accept risk; tests wait for the stylesheet.
