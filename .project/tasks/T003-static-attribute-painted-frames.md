---
id: T003
title: Measure whether a written-back static attribute ever paints, in three engines
wave: 1
deps: [T002]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - apps/yeti-app/src/app/fixtures/static-attributes-fixture.ts
  - apps/yeti-app-e2e/src/static-attributes.spec.ts
  - apps/yeti-app-e2e/src/support/style-probe.ts
---

# T003 — Measure whether a written-back static attribute ever paints, in three engines

## Context

Ticket 50 decision 9 keeps a static form for "removed"-kind inputs: a consumer may write `align="end"` on a host, the directive takes it as an input, renders `data-align`, and removes the `align` attribute. Hydration writes static attributes again before the binding wins (building-blocks.md:347), so a frame might paint with the presentational attribute present (`align` on a block or cell, `border` on a `table`, `nowrap` on a cell, `start` on an `ol`, `disabled` on a link). INTENT E8: if any painted frame shows a written-back attribute, every removed-kind spec (cluster, columns, grid, icon, layer, sidebar, stack, table, button) switches to bound-only inputs (cluster.md:309, icon.md:302), which changes nine public APIs. This task measures it before any of those items is written and gives the later tasks the probe helper.

## Approach

- Fill the stub `StaticAttributesFixture` (registered by T002 at `/sub/static-attributes` and `/sub/server/static-attributes`) with a test-only probe directive that follows the removed-kind pattern of the Interface contract exactly, applied with static attributes on: a `div` with `align="end"`, a `table` with `border="1"`, a `td` with `align="right"` and `nowrap`, an `ol` with `start="2"`, and an `a` with `href` and `disabled`. Keep the probe directive in the fixture file; it is not package code and must not be exported from `packages/`.
- Add the helper of the Interface contract to `apps/yeti-app-e2e/src/support/style-probe.ts`, built from the patterns of `recordHostAttributes` (an init-script MutationObserver) and `recordFrames` (a requestAnimationFrame sampler) in the same file.
- `apps/yeti-app-e2e/src/static-attributes.spec.ts`: for both route kinds, from the first paint through hydration, assert that no painted frame shows any of the five attributes and that after hydration none is present while each `data-*` value is. Run it in the development and the production configuration, and in Chromium, Firefox, and WebKit (the Verify runs the last two through `node tools/ci-local/run-job.mjs`).
- Write the verdict as one Log line, `E8 verdict: pass` or `E8 verdict: fail`, followed by the frame counts per engine and configuration. On fail, keep the test as a recorded measurement (annotations) rather than a failing assertion, and say in the Log which attribute and engine painted; the item tasks then follow the fail branch of the Interface contract. In production, upstream A4 can paint one unstyled frame (LESSONS); that concerns styles, not attributes, so it does not excuse an attribute frame.
- Prohibition N3 (judgment): must not keep content out of reach until hydration to avoid an unstyled frame; no item or Fixture route hides content (opacity, visibility, display, or inert) until the client boots; with JavaScript off every item's content is visible and readable.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/type-safety/SKILL.md`. Records: ticket 50 decision 9 (`docs/specs/issues/50-decide-open-points-of-the-specs.md`), building-blocks.md:347, cluster.md:309.

## Interface contract

- Fixture key `static-attributes` → `StaticAttributesFixture` in `apps/yeti-app/src/app/fixtures/static-attributes-fixture.ts`.
- Static attributes (T003): a removed-kind static attribute (ticket 50 decision 9) is a signal input named as the attribute, rendered on its `data-*` attribute, and removed from the host by the host binding `'[attr.{name}]': 'null'`. T003's Log holds one line `E8 verdict: pass` or `E8 verdict: fail`. On pass, the static form stays as the specs write it; on fail, every removed-kind input becomes bound-only as cluster.md:309 and icon.md:302 state, and the static-form story and test cases are dropped.
- `apps/yeti-app-e2e/src/support/style-probe.ts` exports `recordPaintedAttributes(page: Page, selector: string, attributes: readonly string[]): Promise<() => Promise<readonly string[]>>`, called before `goto`: an init-script MutationObserver plus a requestAnimationFrame probe; the returned function lists one entry `{element} {attribute}` for each animation frame in which an element matching `selector` carried one of `attributes`, so an empty list means no painted frame showed them.

## Intent coverage

- SC3

## Acceptance criteria

1. E8: `apps/yeti-app-e2e/src/static-attributes.spec.ts` measures, on `/sub/static-attributes` and `/sub/server/static-attributes`, in the development and production builds and in Chromium, Firefox, and WebKit, whether any painted frame shows a written-back `align`, `border`, `nowrap`, `start`, or link `disabled`; the Log records `E8 verdict: pass` or `E8 verdict: fail` with the counts, and a fail is stated as the switch of every removed-kind spec (nine M002 specs, table and button included) to bound-only inputs.
2. `recordPaintedAttributes` exists with the Interface contract's signature and behaviour, and the existing helpers of `apps/yeti-app-e2e/src/support/style-probe.ts` are unchanged.
3. The probe directive lives only in the fixture file and follows the removed-kind pattern of the Interface contract.
4. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && test -f apps/yeti-app-e2e/src/static-attributes.spec.ts && npm exec nx -- run-many -t lint typecheck -p yeti-app yeti-app-e2e && npm exec nx -- e2e yeti-app-e2e -- static-attributes.spec.ts && FIXTURE_CONFIGURATION=production npm exec nx -- e2e yeti-app-e2e -- static-attributes.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=firefox static-attributes.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=webkit static-attributes.spec.ts
```

Heavy: yes

## Log

- 2026-10-10 — created by planner
