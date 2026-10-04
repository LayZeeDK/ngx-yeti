# Charter — ngx-yeti

<!-- Written by /gsd-path-define program mode. Enduring program intent:
     vetoes and constraints here override every milestone. Amended only by an
     explicit user ruling recorded under Corrections. Lives at .project/
     top level and persists across milestones; it never archives. -->

Review panel: off

Source documents: `docs/specs/` (start at `docs/specs/README.md`; scope and standing rulings in `docs/specs/map.md` §Destination and §Notes). Ground truth: `.project/research/evidence-codebase.md`, `.project/research/DOCS-AUDIT.md` (audited HEAD `5a279bd`).

## Vision

`ngx-yeti` is an Angular 22.2 package that wraps Yeti (Foundation 7, `yeti-css`) at a pinned `develop` commit: directives first on the markup the consumer writes, every Yeti class, attribute, and `yeti:*` event managed through typed inputs and outputs, WCAG 2.2 AA with every gap Yeti leaves recorded in `ledger.md`, zoneless, SSR- and hydration-safe, readable with JavaScript off under SSR and prerendering, and loading each item's Yeti styles only while an instance renders. The program ends when all 54 specs are implemented, Yeti's five Examples run on ngx-yeti in an Analog app and an Angular SSR app that verify every rendering mode, and the package is release-ready for the user to publish.

## Full scope: in

- Shared specs (5): setup (Yeti build at the pin, `assets` entry, layer order, providers, `accessibility.css`), generated-ids, events, fragment-links, navigation-close — `docs/specs/specs/{setup,generated-ids,events,fragment-links,navigation-close}.md`.
- Utilities (7): attention, billboard, enter, lede, lift, print, visually-hidden.
- Layouts (17): box, breakout, center, cluster, columns, container, cover, frame, grid, icon, layer, masonry, overlay, scroller, sidebar, stack, timeline.
- Recipes (3): hero, media, shell.
- Components (22): accordion, affix, alert, badge, breadcrumbs, button, buttons, card, carousel, demo, dialog, dropdown, field, nav, pagination, progress, seam, spinner, table, tabs, toc, tooltip.
- Package structure each spec requires: one secondary entry point per item (`ngx-yeti/<item>`, ADR 0011), the generated `yeti-types.ts`, the per-item lazy style loader (ADR 0060), and `@angular/cdk` / `@angular/aria` as dependencies and peer dependencies.
- Accessibility and parity: every `docs/specs/ledger.md` row implemented and tested; the package's `accessibility.css` in the `ngx-yeti` layer.
- Tests per each spec's Testing Decisions across the four layers (stories with the axe gate, browser unit, node/SSR, Playwright e2e with JavaScript on and off), Fixture-app routes per item (prerendered and server-rendered), and the per-spec contract check against Yeti's manifest.
- Replacing the generator placeholders (`NgxYeti`, `Highlight`) once real items take over their role as test-infrastructure targets.
- `apps/yeti-analog`: demonstrates ngx-yeti under Analog SSR, SSG, and prerendering (user's words: "To demonstrate Analog SSR/SSG/prerendering support").
- Release readiness: build and `npm pack` output, the version format `0.<Angular major><Angular minor, 2 digits><breaking counter, 2 digits>.<patch>-yeti.<Yeti version>.g<Yeti commit SHA>` (ADR 0017), peer dependencies, changelog — without publishing.
- Docs-audit alignment: rulings 1–5 in `.project/research/DOCS-AUDIT.md` `## User rulings` (`planned: no`).
- Yeti's five docs-site Examples (https://www.foundationcss.com/yeti/examples/: Exhibition, Article, Landing page, Dashboard, Settings screen) rebuilt with ngx-yeti directives in two demo apps, `apps/yeti-analog` and a new Angular CLI SSR examples app (`apps/yeti-app` stays the per-item test fixture), to demonstrate and verify ngx-yeti under CSR, SSR, SSG, hydration, incremental hydration, i18n, `@defer`, event replay (JSAction, `withEventReplay()`), and JavaScript off (Corrections, 2026-10-04).
- Example logic: one typed API contract (the dashboard's data; settings load and save with server-side validation errors) implemented by Analog Nitro API routes and by the Angular SSR app's Express server, consumed by the same Angular client code in both apps (Corrections, 2026-10-04).

## Full scope: out (vetoes)

- Every deferred check — ADR 0018 import checks and `strictParents`, in-item checks, misuse warnings, the runtime vocabulary check (ADR 0005), the dev-mode contrast check (ADR 0015), the setup dev checks, any generator or `ng add` (`docs/specs/map.md:143`) — user's words: "Out of this program".
- Publishing to npm from the pipeline — user's words: "Release-ready, you publish (recommended)". The user runs `npm publish`.
- Editing anything under `docs/specs/`, or ruling `fix-doc` on it (see Constraints).
- `deployUrl` / `--deploy-url` support — user's words (map.md Standing rulings): "`deployUrl`/`--deploy-url` is unsupported/to-be-removed ... so we don't need to support it. Only `baseHref`/`--base-href`/`<base href>` should be supported."
- Foundation for Sites 6.9 support; changing Yeti itself; filing upstream issues or pull requests without the user's confirmation (`docs/specs/map.md:271-273`).
- `@angular/animations` or JavaScript-timed animation; function-form `(animate.leave)` (map.md Inherited preferences, Animation).
- Import arrays exported from entry points (map.md:143); shipping or wrapping Yeti's theme files (ADR 0004); a per-token input or theme provider.
- Platform features beyond the Baseline 2025 target (`closedby`, `interestfor`, scroll markers, Navigation API) until the browser target moves (ADR 0017); dispatching package-owned DOM events (ADR 0040).
- Each spec's own Out of Scope section.

## Constraints

- Stack: Angular 22.2, Nx 23.2 (inferred tasks, nothing on Nx 24's executor removal list), TypeScript 6.0, Vitest 4.1 browser mode, Storybook 10.6 `@storybook/angular-vite`, Playwright 1.63, Node 24, npm. Browser target Baseline 2025: Chrome/Edge 141, Firefox 145, Safari/iOS 26.2 (ADR 0002).
- The user's standing rulings in `docs/specs/map.md` §Notes "Standing rulings" and "Inherited preferences and rulings" bind every milestone as written there (verbatim quotes in that file), including: implementation order native → Aria → CDK → custom, and Aria only where it closes an accessibility gap Yeti leaves, hosted by composition (`hostDirectives`); hydration constraints; zoneless; JavaScript-off guarantee under SSR and SSG; per-item lazy styles; selector-named inputs; `yeti`/`ngx-yeti`/`NgxYeti` naming; directives first, components only where the records name them.
- `docs/specs/` is an immutable baseline: never edit it, never rule fix-doc on it. Precedence: user rulings > CHARTER (incl. Corrections) > INTENT > "Departures from the records" table in `.claude/skills/ngx-yeti-specs/SKILL.md` > `docs/specs/` records (internal order per ngx-yeti-specs). A spec-vs-workspace conflict is surfaced as NEEDS-USER or decided in SYNTHESIS, then recorded as a departure row; spec text stays untouched. (User confirmed: "Confirm both as written (recommended)".)
- Coders and reviewers follow the project skills: `ngx-yeti-specs` (records, placement, naming), `ngx-yeti-testing` (four layers, browser floor), `ngx-yeti-stories` (axe story gate), `ngx-yeti-accessibility` (WCAG 2.2 AA, ledger rows), `type-safety` (all TypeScript), `yeti-pin` (vendored Yeti), all under `.claude/skills/`. Plans cite the relevant skill paths per task. (User confirmed: "Confirm both as written (recommended)".)
- Yeti pin: hold `f52d1e8b93de5bbde322480ba77d5be26c49b0ef` for each milestone; a pin move happens only between milestones as its own roadmap entry, through the `yeti-pin` skill — user's words: "Hold the pin; move only between milestones (recommended)".
- Commits: pipeline commits use GSD Path's subjects (`T###: <title>`, `plan:`, `roadmap:`, `build:`, `ship:`, `integrate:`); AGENTS.md's Conventional Commits rule governs work outside the pipeline. Every task commit is bisect-safe: `npx prettier --check .` and `nx run-many -t lint typecheck test` for the projects it touches pass at that commit. A task updates AGENTS.md "Commits" to say so — user's words: "Accept Path subjects, keep bisect-safe (recommended)".
- `fastCompile` targets never type-check: every Verify that runs `test`, `build-fast`, or a Storybook `-c fast` target also runs `nx typecheck` for that project (AGENTS.md "fastCompile and typecheck").
- Integration: `direct` (project default).
- Budget and deadline: none stated.

## Program success criteria

1. Every item of Yeti's manifest (49) and every shared spec (5) is implemented as its spec's contract mapping describes, each item at its own `ngx-yeti/<item>` entry point, and the per-spec contract check against the built manifest passes for all 49 items.
2. At the final integration commit, `npm run check` (lint, typecheck, test, test-storybook) passes, and the CI workflow (builds, every e2e project, the production Fixture-app e2e, the Safari job) and the floor workflow pass.
3. The Fixture app serves a prerendered and a server-rendered route for every item; `yeti-app-e2e` runs each with JavaScript on and off, axe-clean on the `wcagTags` rule set and with no hydration mismatch.
4. Every `docs/specs/ledger.md` row is implemented, and the test that row names exists and passes.
5. `apps/yeti-analog` renders ngx-yeti items under Analog SSR, SSG, and prerendering, and its e2e proves each mode.
6. `nx build ngx-yeti` followed by `npm pack` produces a package whose version matches the ADR 0017 format, whose every `ngx-yeti/<item>` entry point resolves in a consuming build, whose peer dependencies name Angular 22.2, `@angular/cdk`, and `@angular/aria`, and which has a changelog; nothing is published.
7. Docs-audit rulings 1–5 are applied, and a fresh docs audit finds no stale or aspirational claim in the workspace's own docs (`docs/specs/` excluded as descriptive records).
8. All five Examples (Exhibition, Article, Landing page, Dashboard, Settings screen) render in both `apps/yeti-analog` and the Angular SSR examples app. In each app, every example passes e2e with no hydration mismatch and stays readable with JavaScript off, and each of CSR, SSR, SSG, incremental hydration, i18n (a second locale), and `@defer` is exercised by at least one example and verified by that app's e2e. In each app, event replay (JSAction, `withEventReplay()`) is verified on the Examples: a user interaction on an ngx-yeti element made before hydration completes is replayed and takes effect after hydration, on at least one interactive ngx-yeti item per example that has one.
10. Event replay works with ngx-yeti for every item whose spec lists replayed events: the Fixture app's e2e performs each such interaction before hydration and asserts it takes effect after hydration.
9. In both apps, the Dashboard loads its data through the shared API contract during server rendering (no refetch after hydration), and the Settings screen saves through it, showing server-side validation errors on the affected fields; both servers pass the same API contract tests.

## Open questions

- [RESEARCH] Which @angular/cdk and @angular/aria versions match Angular 22.2.1, and do upstream bugs A5, A6, A9 (docs/specs/upstream-bugs.md:40-44) still reproduce at those versions?
- [RESEARCH] How far apps/yeti-analog demonstrates the package: which items or rendering modes per milestone, and what Analog's SSG/prerender support needs from ngx-yeti.
- [RESEARCH] Whether npm 11 allow-scripts withholding nx, esbuild, and msgpackr-extract install scripts breaks build, Storybook, or Playwright paths, and whether approvals should be committed.

## Corrections

<!-- Verbatim user rulings that amend this charter. Append-only. -->
- 2026-10-04 (during roadmap review): "What about one or more milestones at/towards the end where we implement the *Examples* of https://www.foundationcss.com/yeti's sidebar: - [Exhibition](https://www.foundationcss.com/yeti/examples/exhibition/) - Article - Landing page - Dashboard - Settings screen. Maybe in the same or a separate milestone implement client-side and/or server-side logic/API in Angular and Analog SSR/SSG/prerendering."
- 2026-10-04: "I want to use both an Analog app and an Angular SSR app to demonstrate *and* verify how ngx-yeti supports CSR, SSR, SSG, hydration, incremental hydration, i18n, `@defer`, and *no JavaScript*."
- 2026-10-04, choices: Angular app "A new Angular SSR examples app (recommended)"; mode matrix "Every mode at least once per app (recommended)"; logic "One API contract, both servers (recommended)"; milestones "Two: static ports, then logic (recommended)".
- 2026-10-04 (during roadmap review): "We must also verify event replay (JSAction, `withEventReplay()`) working with ngx-yeti, including on Examples"
- Orchestrator default stated to the user without objection, not the user's words: port the examples faithfully where the docs-site content (markup, photographs, fonts, drawings, copy) is licensed for reuse, else with own or placeholder assets of the same structure; the licence check is an open question of the examples milestone's research. The example sources are not in the Yeti repository at the pin or at `develop` (checked 2026-10-04); they exist only as rendered docs-site pages.
