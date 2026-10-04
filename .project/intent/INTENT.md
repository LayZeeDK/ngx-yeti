# Intent — ngx-yeti M001 walking-skeleton

Lane: milestone   <!-- derived from the approved ROADMAP.md entry M001; the entry lists no open questions, so research and decide are skipped -->

Lane reason: derived from the approved ROADMAP.md entry M001, which lists no open questions, so planning follows directly.

Review panel: off

Finding skeptics: off

Surfaces: Storybook stories, Fixture app routes, package entry points

## Summary

The setup spec and the card and lift items ship end to end, with item styles loaded as counted head links on the server and the client, each item at its own entry point, and every test layer, the contract check, and a packed consuming build running against real items instead of the placeholders. This is the first milestone of the program in `.project/CHARTER.md` and the walking skeleton of `.project/ROADMAP.md` (M001): it proves the ADR 0060 style loader, the secondary entry-point layout, and the release path on the smallest real slice before 47 more items build on them. Source: ROADMAP.md M001 Goal; program decisions in `.project/SYNTHESIS.md`.

## Problem

`ngx-yeti` has mature test, build, and CI infrastructure but no product: the published library exports two generator placeholders (`NgxYeti`, `Highlight`) from one entry point, and none of the 54 specs is implemented. Every later item depends on structures that do not exist yet — the per-item lazy style loader (ADR 0060), one secondary entry point per item (ADR 0011), the generated `yeti-types.ts`, `ngx-yeti/accessibility.css`, the per-spec contract check, and a packed consuming build. A defect in any of them would surface in every later milestone, so they must be proven on real items first.

## Users

- Angular 22.2 application developers who consume `ngx-yeti` to use Yeti (Foundation 7) with typed directives, SSR, hydration, and JavaScript-off rendering.
- The package maintainer (the user), who publishes the package and relies on the four test layers and CI to prove each item.
- Pipeline coders and reviewers in later milestones, who build every remaining item on the loader, entry-point layout, and test harness this milestone establishes.

## Success criteria

1. In Storybook, every story the `setup`, `card`, and `lift` specs name, except the cases carried to later milestones under Scope: out, passes its play function and the axe gate under `nx test-storybook ngx-yeti`; the CSS `:hover` assertions of `lift--default` and `lift--without` run in layer 2 or 4 under the hover departure row of `.claude/skills/ngx-yeti-specs/SKILL.md`. An item's Yeti file is in `<head>` while a host carrying its presence attribute is connected and is removed in the frame after the last such host leaves (ADR 0060 point 4). Walkthrough: in the built Storybook, `card--stretched-link` shows a styled card whose corner click follows the link while its footer button keeps its click, and `setup--shared-host` shows both the `card` and `lift` links in `<head>`.
2. On the Fixture app, the prerendered `/card`, `/lift`, and `/setup` routes and the server-rendered `/server/card`, `/server/lift`, and `/server/setup` routes pass `yeti-app-e2e` with JavaScript on and off: styled from the server's head links, axe-clean on the `wcagTags` rule set, no `NG05xx`, `componentsSkippedHydration === 0`, and 0 `<link>` or `<style>` mutations after `DOMContentLoaded` (the loader adopts the server's links). Each item link carries `data-ngx-yeti-styles`, `data-ngx-yeti-app`, and `data-beasties-skip`. A `card` with `lift` inside `hydrate never` keeps both links after every live `lift` has left (ADR 0045). A client-only `@defer` with `preload` shows 0 unstyled frames. Leaving the card route removes the card link and returning re-inserts it. With JavaScript off, a click near a card's corner navigates to its stretched link and a hovered `yetiLift` card lifts. The setup spec's other layer-4 cases that need no later item pass (setup.md:335-346: `hydrate on interaction`, leave, boundaries, the dev-server run, the strict-CSP nonce route, the 66-file assets glob, and the A4 frame count recorded per engine). The JavaScript-off, axe, and hydration assertions, the `webServer` readiness URL, the build-output prerender assertions, and the axe negative controls that targeted the `highlight` placeholder now target `card`; the `replay` fixture and its test stay. Walkthrough: with JavaScript disabled, `/sub/card` shows a styled card and a click near its corner navigates.
3. A consuming build against the `npm pack` tarball imports `YetiCard` and `YetiCardLink` from `ngx-yeti/card`, `NgxYetiLift` from `ngx-yeti/lift`, `injectYetiItemStyles` and `provideYetiStyles` from `ngx-yeti/styles`, and the types `YetiComponentName`, `YetiVariant`, `YetiWidth`, `YetiRatio`, and `YetiLift` from `ngx-yeti`, and resolves `ngx-yeti/accessibility.css`. The primary `ngx-yeti` entry point exports types only, no published `.d.ts` imports `yeti-css`, the package declares no `yeti-css` dependency or peer, the packed version matches the ADR 0017 format, and the changelog names the full Yeti commit `f52d1e8b93de5bbde322480ba77d5be26c49b0ef`.
4. The contract check over the built manifest passes for `card` and `lift`, the ADR 0080 name-collision test passes for `YetiCard`, `YetiCardLink`, `yetiCardToken`, and `NgxYetiLift`, and no `NgxYeti` component, `Highlight` directive, or `highlight` fixture remains under `packages/`, `apps/`, or `tools/`; the skill pattern pointers that named the placeholder files name the card files.
5. Under `nx test ngx-yeti`, the setup spec's layer-2 cases (setup.md:314-322, with probe directives) and its layer-3 cases pass: the SSR smoke with `card` and `lift` and a `lift` preload, two concurrent renders with the same `<head>`, the generated rank table (49 items in `yeti.css` order, every path present), `yeti-types.ts` equal to `yeti.d.ts`, the pin constant equal to `vendor/yeti/COMMIT`, no Yeti rule in the published output, every `accessibility.css` rule inside `@layer ngx-yeti`, and the version test; card and lift's SSR smoke asserts no package `jsaction`.
6. `nx e2e yeti-app-e2e` and `nx e2e ngx-yeti-e2e` start their web servers and pass both in a pipeline-created linked worktree and in the primary checkout, `ngx-yeti-e2e` including the card and lift Storybook-half cases (card.md:330, lift.md:247) on Chromium locally.
7. `npm run check` passes, docs-audit rulings 1 to 5 are applied, and the package README documents the setup spec's parts A to E, usage rules 1 to 11, and the `@boundary` section, with `provideYetiStyles` and `injectYetiItemStyles` JSDoc citing the rule numbers.

## Scope: in

- The `setup` spec in full. This covers the `ngx-yeti/styles` loader of ADR 0060: reference-counted head links to the consumer's Yeti build at `yeti-css/` relative to base href, inserted in Yeti's rank order, with one presence attribute per item, written on the server and adopted on the client. It also covers `provideYetiStyles()`, the generated `yeti-types.ts`, the layer statement and global stylesheet in `yeti-app` and Storybook, and the ADR 0017 version format with its test.
- The `card` and `lift` items, each at its own secondary entry point. `lift` comes with `card` because the setup spec's `setup--shared-host` story and lift's own tests compose the two.
- The secondary entry-point layout is proven: `nx build ngx-yeti`, `nx build-fast ngx-yeti`, `nx typecheck ngx-yeti -c src`, the Storybook globs, and the Vitest spec roots pick up a generated entry point, and the primary `ngx-yeti` entry point becomes types-only.
- The placeholders `NgxYeti` and `Highlight` are removed in the same change that moves their fixture, story, SSR, and e2e assertions onto `card`.
- `ngx-yeti/accessibility.css` is created in `@layer ngx-yeti` for the setup spec's global stylesheet, published through ng-packagr assets and the package `exports` map, and resolved by Storybook and `yeti-app`. Its rules arrive with the items that own them, starting with `button` in M002. Because setup.md:210 has the first rule-writing spec create the file, this early creation is recorded as a row in the "Departures from the records" table of `.claude/skills/ngx-yeti-specs/SKILL.md`, and its one-time-task bullets are updated in the same change.
- Cross-milestone cases (ROADMAP.md slicing note on cross-milestone test cases): where a setup, card, or lift case composes an item that lands later, M001 builds the case with plain-HTML stand-ins for the unlanded partner (no partner directive, no hand-written Yeti class) and asserts every card, lift, or loader assertion of that case; the partner-dependent assertions land with the partner, as listed under Scope: out. In M001, `card--default`, the card SSR fixture, and the card Fixture route use section 8's markup with a plain `span` and a plain footer link in place of `yetiBadge` and `yetiButton`, the card route's card grid is a plain `ul role="list"`, and `lift--default`'s three cards sit in a plain container.
- Setup documentation in the package README: parts A to E, usage rules 1 to 11, and the `@boundary` section (setup.md:24, :137-187, :214-226, :276-285), with the `provideYetiFragmentLinks()` line added in M003 when that API exists; card's `threshold` JSDoc and `card--inputs` state upstream bug Y12's `2xs` behaviour (upstream-bugs.md:29).
- The per-spec contract check harness against the built manifest (`dist/yeti.manifest.json`), run for both items, with `^yeti-build` ordering for any target that reads Yeti's output.
- The Playwright `webServer` failure is reproduced or ruled out in a pipeline-created linked worktree and in the primary checkout. If it reproduces, the `webServer.command` in `yeti-app-e2e`, `ngx-yeti-e2e`, and `yeti-analog-e2e` is fixed. If not, the scratch location is recorded as the cause.
- A release-readiness skeleton: `nx build ngx-yeti`, `npm pack`, and a consuming build that imports every entry point present from the tarball, plus a changelog that each later milestone extends.
- Docs-audit rulings 1 to 5 of `.project/research/DOCS-AUDIT.md`, and the AGENTS.md "Commits" update to GSD Path subjects with the bisect-safe rule (charter Constraints, Commits).
- Per the roadmap's slicing notes, for each spec shipped: entry points created with `nx g @nx/angular:library-secondary-entry-point`; the four test layers of the spec's Testing Decisions; a prerendered and a server-rendered Fixture-app route checked with JavaScript on and off; the per-spec contract check; the packed consuming build extended to the new entry points; a changelog entry; and `nx typecheck` beside every `fastCompile` target.

## Scope: out (vetoes)

- `@angular/cdk`, `@angular/aria`, and the shared specs `generated-ids`, `events`, `fragment-links`, and `navigation-close` — ROADMAP M001 Scope out: "each lands with its first consuming item, in M003 or M005."
- card's composite stories with `grid` and `layer` (`card--layer-caption`, `card--grid-rows`) — ROADMAP M001 Scope out: "they land with those layouts in M002."
- `apps/yeti-analog` — ROADMAP M001 Scope out: "first touched in M003."
- Committing an npm `allowScripts` policy — ROADMAP M001 Scope out: "No `allowScripts` policy is committed (synthesis decision 'npm allowScripts approvals'). This is revisited when CI's npm moves to 12."
- Every deferred check (ADR 0018 import checks and `strictParents`, in-item checks, misuse warnings, the runtime vocabulary check, the dev-mode contrast check, the setup dev checks), any generator, and `ng add` — user's words (charter): "Out of this program".
- Publishing to npm — user's words (charter): "Release-ready, you publish (recommended)".
- Editing anything under `docs/specs/`, or ruling `fix-doc` on it (charter Constraints).
- `deployUrl` / `--deploy-url` support — user's words (map.md Standing rulings): "Only `baseHref`/`--base-href`/`<base href>` should be supported."
- Changing Yeti itself or moving the Yeti pin — user's words (charter): "Hold the pin; move only between milestones (recommended)".
- `@angular/animations` or JavaScript-timed animation; import arrays exported from entry points; shipping or wrapping Yeti's theme files; a per-token input or theme provider; platform features beyond Baseline 2025; dispatching package-owned DOM events (charter vetoes).
- Each shipped spec's own Out of Scope section (`setup`, `card`, `lift`).
- Cases carried to later milestones (ROADMAP.md cross-milestone rule; none is dropped; each is listed in the receiving roadmap entry):
  - To M002 (button, stack, center, cover, cluster, grid, container): `setup--item-links` and setup's layer-4 order case; the button-link assertions of card's section 8 markup; `lift--default` with its cards in a `yetiCluster`; the card Fixture route's grid of cards as a `yetiGrid`; setup's Tailwind C1 and C2 Fixture build configurations (setup.md:344); `card--layer-caption` and `card--grid-rows` (already in M002).
  - To M004 (badge): `card--default`, the card SSR smoke, and the card Fixture route with section 8's `yetiBadge` and `yetiButton`, including the SSR assertion that the card link sits after the `button` and `badge` links (card.md:324); setup's layer-3 SSR fixture with `card`, `badge`, and `center` (setup.md:326).
  - To M006 (alert, field): `setup--client-defer-preload` and setup's layer-3 `alert` preload assertion (setup.md:305, :326); `setup--accessibility-layer`, which needs A11Y-6's rule (setup.md:306).
- Do not break: the passing `nx run-many -t lint typecheck test` baseline for every project; the Fixture app's hydration-diagnostic, JavaScript-off, and axe e2e coverage, which moves onto `card` and is never dropped; the `replay` fixture and its event-replay e2e test; the `yeti-app` build-output test that pins Yeti's copied CSS files; the CI and floor workflows; and the `yeti-css:yeti-build` dependency ordering and pin-keyed cache in `tools/yeti/nx-plugin.mjs`.

## Constraints

- Stack (charter): Angular 22.2, Nx 23.2 (inferred tasks, nothing on Nx 24's executor removal list), TypeScript 6.0, Vitest 4.1 browser mode, Storybook 10.6 `@storybook/angular-vite`, Playwright 1.63, Node 24, npm. Browser target Baseline 2025: Chrome/Edge 141, Firefox 145, Safari/iOS 26.2 (ADR 0002).
- The user's standing rulings in `docs/specs/map.md` §Notes "Standing rulings" and "Inherited preferences and rulings" bind this milestone as written there, including zoneless, hydration constraints, the JavaScript-off guarantee under SSR and SSG, per-item lazy styles, selector-named inputs, `yeti`/`ngx-yeti`/`NgxYeti` naming, and directives first.
- `docs/specs/` is an immutable baseline. Precedence: user rulings > CHARTER (incl. Corrections) > INTENT > "Departures from the records" table in `.claude/skills/ngx-yeti-specs/SKILL.md` > `docs/specs/` records. A spec-vs-workspace conflict is surfaced as NEEDS-USER or decided in SYNTHESIS, then recorded as a departure row.
- Coders and reviewers follow the project skills under `.claude/skills/`: `ngx-yeti-specs`, `ngx-yeti-testing`, `ngx-yeti-stories`, `ngx-yeti-accessibility`, `type-safety`, `yeti-pin`. Plans cite the relevant skill paths per task.
- Yeti pin held at `f52d1e8b93de5bbde322480ba77d5be26c49b0ef`.
- Commits: pipeline commits use GSD Path's subjects; every task commit is bisect-safe — `npx prettier --check .` and `nx run-many -t lint typecheck test` for the projects it touches pass at that commit.
- `fastCompile` targets never type-check: every Verify that runs `test`, `build-fast`, or a Storybook `-c fast` target also runs `nx typecheck` for that project.
- Secondary entry points are created only with `nx g @nx/angular:library-secondary-entry-point`; a hand-made entry point silently skips `typecheck -c src` (ROADMAP M001 Risks).
- Any target that reads Yeti's build output or manifest depends on `^yeti-build`.
- Integration: `direct`.
- Budget and deadline: none stated.

## Current state (brownfield only)

- **What exists**: An Nx 23.2 monorepo whose product, `packages/ngx-yeti`, is a generator scaffold with one ng-packagr entry point exporting the placeholders `NgxYeti` and `Highlight`. Test, build, and CI infrastructure is mature: `ngx-yeti-testing` (contrast maths, `replayShapedEvent`, `wcagTags`, `renderServer`), the `yeti-app` Fixture app with prerendered `/<item>` and server-rendered `/server/<item>` routes, Playwright e2e covering hydration, JavaScript off, axe, and event replay, and CI plus browser-floor workflows. Yeti is vendored at `vendor/yeti` (pin `f52d1e8`) and built by the inferred `yeti-css:yeti-build` target; `@angular/cdk` and `@angular/aria` are not installed; `apps/yeti-analog` is untouched generator output. At audited HEAD `5a279bd`, `nx run-many -t lint typecheck test` passed uncached for 7 projects; `test-storybook`, `build`, `build-fast`, and every e2e were not run (unverifiable).
- **Must not break**: see the "Do not break" line under Scope: out.
- **Doc-vs-code rulings** (recorded in `.project/research/DOCS-AUDIT.md` `## User rulings`, all in the user's words "Accept all as recommended (recommended)", 2026-10-04):
  - 1 — fix-code: give the replay fixture (`apps/yeti-app/src/app/fixtures/replay-fixture.ts`) an `i18n` text. Planned: no.
  - 2 — fix-doc: `references/fast-compile.md` says only served projects declare `typecheck-watch`. Planned: no.
  - 3 — fix-doc: add the `apps/yeti-analog-e2e` row to README.md's workspace table. Planned: no.
  - 4 — fix-doc: add `ngx-yeti-testing` to the `vitestConfig` project list in `.claude/skills/type-safety/SKILL.md`. Planned: no.
  - 5 — fix-doc: mark `injectYetiItemStyles` in `.claude/skills/ngx-yeti-stories/SKILL.md` as arriving with the setup spec. Planned: no.
  - 6 to 9 — accept-drift (dated benchmark measurements and recorded probes in `docs/benchmarks/fast-compile.md` and `references/fast-compile.md`).
- **Ground truth**: `.project/research/evidence-codebase.md`, `.project/research/DOCS-AUDIT.md`

## Risks

- The ADR 0060 loader under hydration, both adopting server-inserted links and inserting in rank order, is the base every later item builds on. A defect here reaches every later milestone.
- The cause of the Playwright `webServer` failure is unknown (synthesis, low confidence). If the failure is specific to worktrees, it blocks every e2e Verify in the pipeline until fixed.
- An entry point made by hand silently skips `typecheck -c src`. Only the generator is safe.
- A local green run proves Chromium only. Cross-engine claims need CI.
- Upstream bug O2 (upstream-bugs.md:50): after a stylesheet is inserted or removed, Chromium and WebKit can keep stale computed styles, so geometry assertions taken right after the first card or lift link insertion can read stale values.

## Open questions

- None

## Corrections

- 2026-10-04, user (during define, before approval): "Use subagent(s) to audit it against relevant specs and ADRs in docs/specs/"
- 2026-10-04, user goal: "Complete M001 autonomously in AFK mode. When in doubt, use the priority defined in your context, including auditing against relevant documents in docs/specs/. Feel free to apply the auto-trap quadrant but resolve trap quadrant decisions based on the GSD Path with you acting as the human, based on evidence from docs, our references (Yeti, Angular Aria/CDK/Material, WHATWG, WAI-ARIA, APG, WCAG 2.2 AA, and so on), prototypes, measurements, benchmarks, checks, and whatever makes sense."
- 2026-10-04, orchestrator rulings under that goal (not the user's words), from two record audits (setup slice: setup.md and ADRs 0060, 0011, 0017, 0004, 0018, 0002; items slice: card.md, lift.md, ADR 0014, ledger.md, upstream-bugs.md):
  - Cross-milestone cases follow ROADMAP.md's slicing note ("Each such case is listed in the milestone that lands it, and none is dropped"): M001 builds them with plain-HTML stand-ins and carries the partner-dependent assertions to M002, M004, and M006 as listed under Scope: out; the receiving roadmap entries gain matching lines through a milestone-boundary re-slice.
  - Event replay: card and lift declare no listener (card.md:264, lift.md:189), so no replay assertion moves onto card; the `replay` fixture stays (docs-audit ruling 1 edits it), and the first item replay case remains button in M002.
  - SC1 to SC7 rewritten so that each named surface has an observable walkthrough, the loader's adoption at hydration is asserted (setup.md:338, ADR 0060 point 5), the removal rule matches ADR 0060 point 4, setup layers 2 and 3 and the Storybook half of layer 4 are named, and the placeholder-removal check is scoped to code because `docs/specs/` is immutable and lift's class is `NgxYetiLift`.
  - `accessibility.css` ships empty in M001 because the setup global stylesheet imports it (setup.md:147, :167) and the roadmap's M001 scope and SYNTHESIS's planner brief place it here; the departure from setup.md:210 is recorded as a Departures row.
  - Tailwind C1 and C2 move to M002, which brings `container` and the first `@layer ngx-yeti` rule the case asserts (setup.md:344).
  - The derived "Do not break" line is accepted as protected behaviour.
