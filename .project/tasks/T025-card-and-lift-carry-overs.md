---
id: T025
title: Land card's grid, layer, and button carry-overs and the card route's grid
wave: 4
deps: [T002, T010, T015, T020, T030]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - packages/ngx-yeti/card/src/card.stories.ts
  - packages/ngx-yeti/card/src/card.ssr.spec.ts
  - apps/yeti-app/src/app/fixtures/card-fixture.ts
  - apps/yeti-app-e2e/src/card.spec.ts
  - apps/yeti-app-e2e/src/fixture-app.spec.ts
  - apps/ngx-yeti-e2e/src/card.spec.ts
---

# T025 — Land card's grid, layer, and button carry-overs and the card route's grid

## Context

M001 shipped card with plain-HTML stand-ins where grid, layer, and button were missing (`apps/yeti-app/src/app/fixtures/card-fixture.ts` lines 9 to 16 say so). With grid (T010), layer (T015), and button (T020) landed, this task lands those cases (INTENT Scope in): the composite stories `card--layer-caption` and `card--grid-rows` (card.md:303-304), the button-link assertions of card's section 8 markup (card.md:239, :300, :324), and the card Fixture route's grid of cards as a `yetiGrid` with the footer links as `yetiButton` (card.md:332). The card route then also carries the `grid`, `button`, and `spinner` links, which breaks the exact `itemLinks` arrays on that route (INTENT Constraints, LESSONS); this task owns those spec files. It also delivers the Fixture app routes surface of the Surface contract. The badge of section 8 stays M004's.

## Approach

- Stories (card.md:296-306), in `packages/ngx-yeti/card/src/card.stories.ts`: replace the footer stand-in (line 73) with a `yetiButton` link in `card--default` and `card--stretched-link`, keeping every existing assertion (the footer link with `tabindex="-1"` is not a Tab stop; a footer `button` still takes its click); add `card--layer-caption` (a `figure yetiLayer` first child with a caption over the picture: the caption's bottom equals the picture's within 1 px and its background is not transparent; no contrast assertion over the picture, A11Y-10b is the layer's) and `card--grid-rows` (three cards of different lengths as `li` children of a `yetiGrid` with `rows`, each with a footer: every footer's bottom equal within 1 px and the picture still bleeding). Every static `img` uses `NgOptimizedImage`.
- `packages/ngx-yeti/card/src/card.ssr.spec.ts`: the card link sits after the `button` link (card.md:324; the `badge` order is M004's); replace the stand-in noted near lines 16 and 17.
- Fixture route (card.md:332-339), `apps/yeti-app/src/app/fixtures/card-fixture.ts`: the grid of lifted cards becomes a `yetiGrid`, and the footer links become `yetiButton`; keep the shared `card` and `lift` host in `hydrate never`, the client-only `@defer` card, the link to `/replay`, and the one `i18n` text, and update the stand-in comment.
- `apps/yeti-app-e2e/src/card.spec.ts` and the style-mutation test of `apps/yeti-app-e2e/src/fixture-app.spec.ts` (lines 63 to 69): the exact `itemLinks` arrays at card.spec.ts lines 148, 183, 217, 295, 304, and 367 change; where Yeti's rank order is the claim, assert the exact ordered list of item links the route now has; elsewhere assert containment (`expect.arrayContaining`), so a later item on the route breaks nothing (LESSONS). The card route's JavaScript-off, shared-host, preload, and navigation cases keep passing in development and production. `apps/ngx-yeti-e2e/src/card.spec.ts`: the `card--stretched-link` real-click and Tab cases keep passing with the `yetiButton` footer link; M001's integration commit landed with this test failing in Firefox ("focus has left the card"), so run it in Firefox and WebKit (the Verify does).
- Prohibitions (judgment): N1: must not reach a green axe gate by switching off rules or hiding content from assistive technology; no story disables an axe rule except a documented anti-pattern exception under the ngx-yeti-stories skill, and no fix adds aria-hidden, role=presentation, inert, or visually-hidden to content a user needs. N3: must not keep content out of reach until hydration to avoid an unstyled frame; no item or Fixture route hides content (opacity, visibility, display, or inert) until the client boots; with JavaScript off every item's content is visible and readable.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/ngx-yeti-stories/SKILL.md`, `.claude/skills/ngx-yeti-accessibility/SKILL.md`, `.claude/skills/type-safety/SKILL.md`; records card.md and lift.md.

## Interface contract

- Preload list (T002): `provideYetiStyles({ preload })` in apps/yeti-app/src/app/app.config.ts lists `card` and every M002 item except `enter`; `lift` and `enter` stay out.

## Intent coverage

- SC1
- SC3

## Acceptance criteria

1. `card--layer-caption` and `card--grid-rows` pass their play functions and the axe gate, and `card--default` and `card--stretched-link` pass with the footer link as a `yetiButton`; the card SSR spec asserts the card link after the `button` link.
2. With JavaScript on and off, `/sub/card` and `/sub/server/card` show the cards in a `yetiGrid` laid out in columns with `yetiButton` footer links, and every card route case passes in development and production, with the route's item links asserted by containment except where the rank order is the claim.
3. `apps/ngx-yeti-e2e/src/card.spec.ts` passes in Chromium, Firefox, and WebKit.
4. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && test -f apps/yeti-app-e2e/src/card.spec.ts && test -f packages/ngx-yeti/card/src/card.stories.ts && npm exec nx -- run-many -t lint typecheck -p ngx-yeti ngx-yeti-e2e yeti-app yeti-app-e2e && npm exec nx -- test ngx-yeti -- card/src && npm exec nx -- test-storybook ngx-yeti -- card/src && npm exec nx -- e2e ngx-yeti-e2e -- card.spec.ts && npm exec nx -- e2e yeti-app-e2e -- card.spec.ts fixture-app.spec.ts && FIXTURE_CONFIGURATION=production npm exec nx -- e2e yeti-app-e2e -- card.spec.ts fixture-app.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e ngx-yeti-e2e -- --project=firefox card.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=firefox card.spec.ts fixture-app.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e ngx-yeti-e2e -- --project=webkit card.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=webkit card.spec.ts fixture-app.spec.ts; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-10 — created by planner
- 2026-10-10 — orchestrator: plan-defect repair (Verify only), user ruling "Resolve the NX_DAEMON=false issue". Verify now ends by stopping the Nx daemon and keeps its own exit code. Measured cause: for a serial task, the pipeline reverts and deletes the verify sidecar right after Verify (`git restore`, then `git clean -fdx`); a daemon that Verify left running rewrites `.nx/workspace-data` and `node_modules/.vite-temp` during that cleanup and it fails with "Directory not empty" (2 of 2 with T004's diff; passes once the daemon is stopped). Run Verify exactly as written; never set NX_DAEMON.
- 2026-10-11 — planner: build repair (user ruling "Wave-1 defects: Approve recommendation."). `deps` gains T030: T030 (wave 2) changes the stub-route tests of apps/yeti-app-e2e/src/fixture-app.spec.ts, the file whose style-mutation test this task edits. Acceptance criteria, files, wave, and Verify are unchanged.
