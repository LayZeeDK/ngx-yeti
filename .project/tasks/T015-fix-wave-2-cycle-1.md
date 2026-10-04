---
id: T015
title: Fix wave 2 cycle 1 review findings in T007, T010, T011
wave: 4
deps: [T007, T010, T011]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - apps/yeti-app-e2e/playwright.config.mts
  - apps/yeti-app-e2e/src/card.spec.ts
  - apps/yeti-app-e2e/src/lift.spec.ts
  - apps/yeti-app-e2e/src/setup-boundaries.spec.ts
  - apps/yeti-app-e2e/src/setup-serving.spec.ts
  - apps/yeti-app-e2e/src/setup.spec.ts
  - apps/yeti-app/project.json
  - apps/yeti-app/src/app/app.config.server.ts
  - apps/yeti-app/src/app/app.config.ts
  - apps/yeti-app/src/app/fixtures/card-fixture.ts
  - apps/yeti-app/src/app/fixtures/fixtures.ts
  - apps/yeti-app/src/app/fixtures/lift-fixture.ts
  - apps/yeti-app/src/app/fixtures/setup-boundaries-fixture.ts
  - apps/yeti-app/src/app/fixtures/setup-fixture.ts
  - apps/yeti-app/src/server.ts
---

# T015 — Fix wave 2 cycle 1 review findings in T007, T010, T011

## Context

Repair task created from the wave 2 cycle 1 review of T007, T010, T011.
The failed criteria and every reviewer observation are recorded verbatim under Review findings.
The source task contracts are unchanged; read them and .project/intent/INTENT.md before editing.

## Approach

- Fix only what the Review findings name, inside the listed files; do not change the source
  tasks' acceptance criteria or interface contracts.
- Re-run the source tasks' Verify commands after the fix and record the result in the Log.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. On the Fixture app, the prerendered `/card`, `/lift`, and `/setup` routes and the server-rendered `/server/card`, `/server/lift`, and `/server/setup` routes pass `yeti-app-e2e` with JavaScript on and off: styled from the server's head links, axe-clean on the `wcagTags` rule set, no `NG05xx`, `componentsSkippedHydration === 0`, and 0 `<link>` or `<style>` mutations after `DOMContentLoaded` (the loader adopts the server's links). Each item link carries `data-ngx-yeti-styles`, `data-ngx-yeti-app`, and `data-beasties-skip`. A `card` with `lift` inside `hydrate never` keeps both links after every live `lift` has left (ADR 0045). A client-only `@defer` with `preload` shows 0 unstyled frames. Leaving the card route removes the card link and returning re-inserts it. With JavaScript off, a click near a card's corner navigates to its stretched link and a hovered `yetiLift` card lifts. The setup spec's other layer-4 cases that need no later item pass (setup.md:335-346: `hydrate on interaction`, leave, boundaries, the dev-server run, the strict-CSP nonce route, the 66-file assets glob, and the A4 frame count recorded per engine). The JavaScript-off, axe, and hydration assertions, the `webServer` readiness URL, the build-output prerender assertions, and the axe negative controls that targeted the `highlight` placeholder now target `card`; the `replay` fixture and its test stay. Walkthrough: with JavaScript disabled, `/sub/card` shows a styled card and a click near its corner navigates.
2. `apps/yeti-app-e2e/src/setup-serving.spec.ts` passes in the development and production configurations.

## Verify

```bash
set -e
(
npm ci --no-audit --no-fund && npx nx run-many -t typecheck -p yeti-app yeti-app-e2e && test -f apps/yeti-app-e2e/src/setup-boundaries.spec.ts && npx nx e2e yeti-app-e2e -- lift.spec.ts setup.spec.ts setup-boundaries.spec.ts
)
(
npm ci --no-audit --no-fund && npx nx run-many -t typecheck -p yeti-app yeti-app-e2e && test -f apps/yeti-app-e2e/src/setup-serving.spec.ts && npx nx e2e yeti-app-e2e -- setup-serving.spec.ts && FIXTURE_CONFIGURATION=production npx nx e2e yeti-app-e2e -- setup-serving.spec.ts
)
(
npm ci --no-audit --no-fund && npx nx run-many -t typecheck -p yeti-app yeti-app-e2e && rg -q 'hydrate never' apps/yeti-app/src/app/fixtures/card-fixture.ts && rg -q -i 'preload' apps/yeti-app-e2e/src/card.spec.ts && npx nx e2e yeti-app-e2e -- card.spec.ts
)
```

Heavy: yes

## Review findings

### sc2
Criterion: On the Fixture app, the prerendered `/card`, `/lift`, and `/setup` routes and the server-rendered `/server/card`, `/server/lift`, and `/server/setup` routes pass `yeti-app-e2e` with JavaScript on and off: styled from the server's head links, axe-clean on the `wcagTags` rule set, no `NG05xx`, `componentsSkippedHydration === 0`, and 0 `<link>` or `<style>` mutations after `DOMContentLoaded` (the loader adopts the server's links). Each item link carries `data-ngx-yeti-styles`, `data-ngx-yeti-app`, and `data-beasties-skip`. A `card` with `lift` inside `hydrate never` keeps both links after every live `lift` has left (ADR 0045). A client-only `@defer` with `preload` shows 0 unstyled frames. Leaving the card route removes the card link and returning re-inserts it. With JavaScript off, a click near a card's corner navigates to its stretched link and a hovered `yetiLift` card lifts. The setup spec's other layer-4 cases that need no later item pass (setup.md:335-346: `hydrate on interaction`, leave, boundaries, the dev-server run, the strict-CSP nonce route, the 66-file assets glob, and the A4 frame count recorded per engine). The JavaScript-off, axe, and hydration assertions, the `webServer` readiness URL, the build-output prerender assertions, and the axe negative controls that targeted the `highlight` placeholder now target `card`; the `replay` fixture and its test stay. Walkthrough: with JavaScript disabled, `/sub/card` shows a styled card and a click near its corner navigates.
- "pass `yeti-app-e2e`" — found: at the review base 86e702b, `npx nx e2e yeti-app-e2e --skip-nx-cache` (development, Chromium) fails 2 of 88 tests: setup-serving.spec.ts:92 and :137. The strict-CSP case's spec expects one card link on `/sub/server/card`, but T011's lifted cards add a lift link. The wave's own owned cases are green in isolation; the integrated wave is not. fix: as under T010 AC4. Update the two expectations in apps/yeti-app-e2e/src/setup-serving.spec.ts to the card route's current links, then re-run `npx nx e2e yeti-app-e2e --skip-nx-cache` and `FIXTURE_CONFIGURATION=production npx nx e2e yeti-app-e2e --skip-nx-cache` on a base that includes T011.

### t010_ac4
Criterion: `apps/yeti-app-e2e/src/setup-serving.spec.ts` passes in the development and production configurations.
- `apps/yeti-app-e2e/src/setup-serving.spec.ts` passes in the development and production configurations. — found: it passes on the recorded isolated base (08f39ea plus the T010 patch; recorded Verify 4 passed and 3 passed + 1 skipped, both cache replays). It fails at its own landing commit 032ac76 and at the review base 86e702b, whose product tree is identical. T011 landed first (f7e7a29, the parent of 032ac76) and added lifted cards to the card route, so `/sub/server/card` now holds both the card and the lift item links. Reviewer's `npx nx e2e yeti-app-e2e --skip-nx-cache` (development, Chromium) at 86e702b: 82 passed, 4 skipped, 2 failed. (1) setup-serving.spec.ts:92 `expect(await itemLinks(page)).toEqual(['card'])` received `['card', 'lift']`. (2) setup-serving.spec.ts:137 `.toEqual([false])` received `[false, false]`. Both expectations depend only on the route's markup, so the production configuration fails the same way. The landed wave fails `nx e2e yeti-app-e2e`. fix: in apps/yeti-app-e2e/src/setup-serving.spec.ts, make the two expectations follow the card route as T011 left it. At :92, expect `['card', 'lift']`, or assert that the list contains `card`; the loop at :95-114 already requires the nonce on every item link. At :131-137, assert that every item link lacks `nonce` (for example, map to `hasAttribute('nonce')` and expect every value to be false, with at least one link). Then re-run `npx nx e2e yeti-app-e2e --skip-nx-cache -- setup-serving.spec.ts` in both configurations on a base that includes T011. Do not change card-fixture.ts.

## Log

- 2026-10-04 — created by dispatch_driver.py fix-tasks from wave 2 cycle 1
