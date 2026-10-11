---
id: T032
title: Fix wave 2 cycle 1 review findings in T007, T008
wave: 6
deps: [T007, T008]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - apps/ngx-yeti-e2e/src/stack.spec.ts
  - apps/yeti-app-e2e/src/box.spec.ts
  - apps/yeti-app-e2e/src/center.spec.ts
  - apps/yeti-app-e2e/src/setup.spec.ts
  - apps/yeti-app-e2e/src/stack.spec.ts
  - apps/yeti-app/src/app/fixtures/box-fixture.ts
  - apps/yeti-app/src/app/fixtures/center-fixture.ts
  - apps/yeti-app/src/app/fixtures/setup-fixture.ts
  - apps/yeti-app/src/app/fixtures/stack-fixture.ts
  - packages/ngx-yeti/CHANGELOG.md
  - packages/ngx-yeti/README.md
  - packages/ngx-yeti/box/README.md
  - packages/ngx-yeti/box/src/box-border.ts
  - packages/ngx-yeti/box/src/box-paint.ts
  - packages/ngx-yeti/box/src/box-text.ts
  - packages/ngx-yeti/box/src/box.contract.node.spec.ts
  - packages/ngx-yeti/box/src/box.spec.ts
  - packages/ngx-yeti/box/src/box.ssr.spec.ts
  - packages/ngx-yeti/box/src/box.stories.ts
  - packages/ngx-yeti/box/src/box.ts
  - packages/ngx-yeti/box/src/index.ts
  - packages/ngx-yeti/center/README.md
  - packages/ngx-yeti/center/src/center.contract.node.spec.ts
  - packages/ngx-yeti/center/src/center.spec.ts
  - packages/ngx-yeti/center/src/center.ssr.spec.ts
  - packages/ngx-yeti/center/src/center.stories.ts
  - packages/ngx-yeti/center/src/center.ts
  - packages/ngx-yeti/center/src/index.ts
  - packages/ngx-yeti/compile-fixtures/center-max-large.ts
  - packages/ngx-yeti/eslint.config.mjs
  - packages/ngx-yeti/src/compile-errors.node.spec.ts
  - packages/ngx-yeti/src/item-names.node.spec.ts
  - packages/ngx-yeti/src/name-collision.node.spec.ts
  - packages/ngx-yeti/stack/README.md
  - packages/ngx-yeti/stack/src/index.ts
  - packages/ngx-yeti/stack/src/stack-child.ts
  - packages/ngx-yeti/stack/src/stack-tokens.ts
  - packages/ngx-yeti/stack/src/stack.contract.node.spec.ts
  - packages/ngx-yeti/stack/src/stack.spec.ts
  - packages/ngx-yeti/stack/src/stack.ssr.spec.ts
  - packages/ngx-yeti/stack/src/stack.stories.ts
  - packages/ngx-yeti/stack/src/stack.ts
  - packages/ngx-yeti/styles/src/setup.stories.ts
  - packages/ngx-yeti/tsconfig.spec.json
  - tools/package/consumer/consumer.ts
---

# T032 — Fix wave 2 cycle 1 review findings in T007, T008

## Context

Repair task created from the wave 2 cycle 1 review of T007, T008.
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

1. On the Fixture app, each of the 22 items has a prerendered `/<item>` and a server-rendered `/server/<item>` route that passes `yeti-app-e2e` with JavaScript on and off, axe-clean on the `wcagTags` rule set and with no hydration mismatch, plus every other layer-4 Fixture-app case its spec names: the client `@defer` with preload and `hydrate never` cases, the item link removed on leaving the route and re-inserted on return, no horizontal overflow at 320 px where the spec says so, the written-back static attributes (`align`, `border`, `nowrap`, a link's `disabled`) absent from every painted frame, the shared-host cases that keep both links, frame's zero layout shift, table's pinned-head Shift+Tab walk (table.md:416, A11Y-22's table repeat), scroller's focus and scroll position made before hydration surviving it (scroller.md:314), and `enter`'s `once` element keeping `data-once` through hydration and arriving only when scrolled to (enter.md:269). The negative-control routes the specs require (table without `tbody`, table.md:411; center's bordered anti-pattern, center.md:288) are labelled as what not to write, record their logged error or measurement, and are exempt from the no-mismatch and axe checks. The card route shows its cards in a `yetiGrid` with the footer links as `yetiButton`, the setup spec's layer-4 order case passes, and the Tailwind C1 and C2 Fixture build configurations pass (cases carried over from M001). Walkthrough: with JavaScript disabled, `/sub/stack` and `/sub/card` show styled layouts, the card grid lays out its cards in columns, and Tab on `/sub/scroller` focuses the scroller and ArrowRight scrolls it.
2. `/sub/stack`, `/sub/server/stack`, `/sub/center`, and `/sub/server/center` pass the standard Fixture cases with JavaScript on and off in the development and production builds; the static `align` stack shows no painted frame with `align` (per T003's verdict); the stack-later-in-`@defer` tie and the either-order stack of centers keep every center centred; the `setup-order` case keeps the center centred.

## Verify

```bash
set -e
(
npm ci && npx playwright install chromium && test -f packages/ngx-yeti/stack/src/stack.spec.ts && test -f packages/ngx-yeti/src/compile-errors.node.spec.ts && npm exec nx -- run-many -t lint typecheck -p ngx-yeti ngx-yeti-e2e yeti-app yeti-app-e2e && npm exec nx -- test ngx-yeti -- stack/src center/src styles/src src/compile-errors src/name-collision src/item-names && npm exec nx -- test-storybook ngx-yeti -- stack/src center/src styles/src && npm exec nx -- e2e ngx-yeti-e2e -- stack.spec.ts && npm exec nx -- e2e yeti-app-e2e -- stack.spec.ts center.spec.ts setup.spec.ts && FIXTURE_CONFIGURATION=production npm exec nx -- e2e yeti-app-e2e -- stack.spec.ts center.spec.ts setup.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e ngx-yeti-e2e -- --project=firefox stack.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=firefox stack.spec.ts center.spec.ts setup.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e ngx-yeti-e2e -- --project=webkit stack.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=webkit stack.spec.ts center.spec.ts setup.spec.ts && npm exec nx -- run ngx-yeti:pack-check; status=$?; npx --no-install nx daemon --stop; exit $status
)
(
npm ci && npx playwright install chromium && test -f packages/ngx-yeti/box/src/box.spec.ts && npm exec nx -- run-many -t lint typecheck -p ngx-yeti ngx-yeti-e2e yeti-app yeti-app-e2e && npm exec nx -- test ngx-yeti -- box/src center/src src/name-collision src/item-names && npm exec nx -- test-storybook ngx-yeti -- box/src stack/src center/src && npm exec nx -- e2e yeti-app-e2e -- box.spec.ts center.spec.ts && FIXTURE_CONFIGURATION=production npm exec nx -- e2e yeti-app-e2e -- box.spec.ts center.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=firefox box.spec.ts center.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=webkit box.spec.ts center.spec.ts && npm exec nx -- run ngx-yeti:pack-check; status=$?; npx --no-install nx daemon --stop; exit $status
); status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Review findings

### sc3
Criterion: On the Fixture app, each of the 22 items has a prerendered `/<item>` and a server-rendered `/server/<item>` route that passes `yeti-app-e2e` with JavaScript on and off, axe-clean on the `wcagTags` rule set and with no hydration mismatch, plus every other layer-4 Fixture-app case its spec names: the client `@defer` with preload and `hydrate never` cases, the item link removed on leaving the route and re-inserted on return, no horizontal overflow at 320 px where the spec says so, the written-back static attributes (`align`, `border`, `nowrap`, a link's `disabled`) absent from every painted frame, the shared-host cases that keep both links, frame's zero layout shift, table's pinned-head Shift+Tab walk (table.md:416, A11Y-22's table repeat), scroller's focus and scroll position made before hydration surviving it (scroller.md:314), and `enter`'s `once` element keeping `data-once` through hydration and arriving only when scrolled to (enter.md:269). The negative-control routes the specs require (table without `tbody`, table.md:411; center's bordered anti-pattern, center.md:288) are labelled as what not to write, record their logged error or measurement, and are exempt from the no-mismatch and axe checks. The card route shows its cards in a `yetiGrid` with the footer links as `yetiButton`, the setup spec's layer-4 order case passes, and the Tailwind C1 and C2 Fixture build configurations pass (cases carried over from M001). Walkthrough: with JavaScript disabled, `/sub/stack` and `/sub/card` show styled layouts, the card grid lays out its cards in columns, and Tab on `/sub/scroller` focuses the scroller and ArrowRight scrolls it.
- On the Fixture app, each of the 22 items has a prerendered `/<item>` and a server-rendered `/server/<item>` route that passes `yeti-app-e2e` with JavaScript on and off, axe-clean on the `wcagTags` rule set and with no hydration mismatch, plus every other layer-4 Fixture-app case its spec names: the client `@defer` with preload and `hydrate never` cases, the item link removed on leaving the route and re-inserted on return, no horizontal overflow at 320 px where the spec says so, the written-back static attributes (`align`, `border`, `nowrap`, a link's `disabled`) absent from every painted frame, the shared-host cases that keep both links, frame's zero layout shift, table's pinned-head Shift+Tab walk (table.md:416, A11Y-22's table repeat), scroller's focus and scroll position made before hydration surviving it (scroller.md:314), and `enter`'s `once` element keeping `data-once` through hydration and arriving only when scrolled to (enter.md:269). The negative-control routes the specs require (table without `tbody`, table.md:411; center's bordered anti-pattern, center.md:288) are labelled as what not to write, record their logged error or measurement, and are exempt from the no-mismatch and axe checks. The card route shows its cards in a `yetiGrid` with the footer links as `yetiButton`, the setup spec's layer-4 order case passes, and the Tailwind C1 and C2 Fixture build configurations pass (cases carried over from M001). Walkthrough: with JavaScript disabled, `/sub/stack` and `/sub/card` show styled layouts, the card grid lays out its cards in columns, and Tab on `/sub/scroller` focuses the scroller and ArrowRight scrolls it. — found: the center route's either-order stack-of-centers case fails 8 of 20 runs in the production Chromium build (apps/yeti-app-e2e/src/center.spec.ts:183, assertion at :60; gate center-repro.log), so `yeti-app-e2e` does not pass for `/server/center`. E8 held (static `align` painted-frame case passes), E9 held (stack and center specs assert links by containment except the order claims). E2 and E15 belong to later items. fix: as T007 criterion 3 above.

### t007_ac3
Criterion: `/sub/stack`, `/sub/server/stack`, `/sub/center`, and `/sub/server/center` pass the standard Fixture cases with JavaScript on and off in the development and production builds; the static `align` stack shows no painted frame with `align` (per T003's verdict); the stack-later-in-`@defer` tie and the either-order stack of centers keep every center centred; the `setup-order` case keeps the center centred.
- `/sub/stack`, `/sub/server/stack`, `/sub/center`, and `/sub/server/center` pass the standard Fixture cases with JavaScript on and off in the development and production builds; the static `align` stack shows no painted frame with `align` (per T003's verdict); the stack-later-in-`@defer` tie and the either-order stack of centers keep every center centred; the `setup-order` case keeps the center centred. — found: in the production build, Chromium, `apps/yeti-app-e2e/src/center.spec.ts:183` "the server-rendered center route keeps a stack of centers centred when the stack file loads first" fails 8 of 20 runs with `--retries=0` (orchestrator gate, center-repro.log; `expect(max).toBe(probeMax)` at center.spec.ts:60, received "1024px", expected "256px"), so the full `ci e2e` job fails on the chromium-production combination. `expectCentred` (center.spec.ts:28-69) polls only `itemSheetsLoaded` (`link.sheet !== null`, apps/yeti-app-e2e/src/support/style-probe.ts:392) and then reads `maxInlineSize` once; whether the center rule is truly late (product) or the read is early (test) is not measured. fix: reproduce with `--repeat-each=20 --retries=0 center.spec.ts:183` in the chromium-production ci-local job; first decide product vs test by recording `link.sheet.cssRules.length` and the computed `max-inline-size` over frames after the click. If the sheet is applied but read early, wait on the computed value (`expect(centers.first()).toHaveCSS('max-inline-size', probeMax)` or a cssRules-based wait like apps/ngx-yeti-e2e/src/item-styles.ts:9) before the one-shot read; if the rule really arrives late, fix the loader ordering. Done when 20 of 20 pass with retries off in chromium production and the full `ci e2e` job passes.

## Log

- 2026-10-11 — created by dispatch_driver.py fix-tasks from wave 2 cycle 1
