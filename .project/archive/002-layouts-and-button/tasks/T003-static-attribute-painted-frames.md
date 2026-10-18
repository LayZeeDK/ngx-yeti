---
id: T003
title: Measure whether a written-back static attribute ever paints, in three engines
wave: 1
deps: [T002]
status: done
agent: build_T003
base: c289e6cec5ae081ed8fb227cb37f7951f5ca622d
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
- 2026-10-10 — coder (build_T003): `static-attributes-fixture.ts` replaces the stub (the `data-fixture-stub` marker is gone, so fixture-app.spec's stub test for this route now skips itself) with the test-only directive `StaticAttributeProbe` (`[appStaticAttributeProbe]`, not exported from `packages/`): signal inputs `align`, `border`, `nowrap`, `start`, `disabled`, each rendered on `[attr.data-{name}]` and removed by `'[attr.{name}]': 'null'`. Hosts: `div#probe-block align="end"`, `table#probe-table border="1"`, `td#probe-cell align="right" nowrap` (inside an explicit `tbody`), `ol#probe-list start="2"`, `a#probe-link href="replay" disabled`. Nothing is hidden before hydration (N3). `style-probe.ts` gains `recordPaintedAttributes` with the contract signature; existing helpers unchanged. It is an init-script requestAnimationFrame probe that reads the attributes at the start of each frame's callbacks, a MutationObserver that applies changes made by later callbacks of the same frame, and a ResizeObserver re-armed each frame whose callback (after all frame callbacks and layout, before paint) records the frame. First draft counted every attribute present at the end of a task. It reported one frame per attribute in Chromium, a false positive. A diagnostic run showed why. Hydration's creation pass (`setupStaticAttributes` → `setUpAttributes`) writes each static attribute again. Angular's first `ApplicationRef.tick`, run from the zoneless scheduler's animation-frame callback, then removes it (`StaticAttributeProbe_HostBindings` → `removeAttribute`). That happens after the start-of-frame sample but before the same frame's resize step, which saw the attribute absent in every run. So the attribute exists in the DOM briefly but never reaches a paint. `static-attributes.spec.ts`, both route kinds: dev-only clean hydration; the E8 test (painted list must be empty, frame count annotated as `e8-frames`, then after hydration no removed attribute and every `data-*` value present); a positive control (an attribute set after hydration is listed); axe with JS on; with JS off every host visible with its `data-*` value and none of the five attributes (the server HTML never carries them), axe clean.
- E8 verdict: pass — 0 painted frames with a written-back `align`, `border`, `nowrap`, `start`, or link `disabled` in every engine, configuration, and route kind (painted entries / sampled frames, prerendered and server-rendered): Chromium development 0/11, 0/10; Chromium production 0/9, 0/12; Firefox development 0/27, 0/17; Firefox production 0/30, 0/14; WebKit development 0/6, 0/7; WebKit production 0/6, 0/8. Chromium ran locally; Firefox and WebKit ran through `node tools/ci-local/run-job.mjs ci e2e`. The removed-kind static form stays as the specs write it.
- 2026-10-10 — Verify (run in the worktree, full command as written): exit 0. `npm ci` ok; `npx playwright install chromium` ok; `test -f` ok; `nx run-many -t lint typecheck -p yeti-app yeti-app-e2e` passed; `nx e2e yeti-app-e2e -- static-attributes.spec.ts` 10 passed; production 8 passed / 2 skipped (development-only hydration diagnostics); ci-local Firefox development 10 passed (`pass ci-e2e-firefox-development`); ci-local WebKit development 10 passed (`pass ci-e2e-webkit-development`). Also: `npx prettier --check .` clean; `nx affected -t lint typecheck test test-storybook --base=HEAD` on the uncommitted tree passed. VERIFY: PASS.
- 2026-10-10 — orchestrator Verify (isolate gsd-path-task/T003): pass, exit 0; output tail:
  ```
  npm warn deprecated @angular/animations@22.2.1: @angular/animations is deprecated. Use `animate.enter` and `animate.leave` instead. For more information see: https://v22.angular.dev/guide/animations.
  npm warn deprecated @ngtools/webpack@22.2.1: Angular's Webpack support is deprecated. Use the esbuild and Vite-based "@angular/build" package instead.
  npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
  npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
  npm warn deprecated @angular-devkit/build-angular@22.2.1: Angular's Webpack support is deprecated. Use the esbuild and Vite-based "@angular/build" package instead.
  npm warn deprecated eslint@9.39.5: This version is no longer supported. Please see https://eslint.org/version-support for other options.
  npm warn allow-scripts 9 packages have install scripts not yet covered by allowScripts:
  npm warn allow-scripts   esbuild@0.27.7 (postinstall: node install.js)
  npm warn allow-scripts   @parcel/watcher@2.6.0 (install: node scripts/build-from-source.js)
  npm warn allow-scripts   edgedriver@6.3.1 (install: test -f ./dist/install.js && node ./dist/install.js || echo "Skipping install, project not build!")
  npm warn allow-scripts   esbuild@0.28.2 (postinstall: node install.js)
  npm warn allow-scripts   geckodriver@6.1.1 (postinstall: test -f ./dist/install.js && node ./dist/install.js || echo "Skipping install, project not built!")
  npm warn allow-scripts   lmdb@3.5.6 (install: node-gyp-build-optional-packages)
  npm warn allow-scripts   msgpackr-extract@3.0.4 (install: node-gyp-build-optional-packages)
  npm warn allow-scripts   nx@23.2.1 (postinstall: node -e "try{require('./dist/bin/post-install')}catch(e){}")
  npm warn allow-scripts   esbuild@0.25.12 (postinstall: node install.js)
  npm warn allow-scripts
  npm warn allow-scripts Run `npm approve-scripts --allow-scripts-pending` to review, or `npm approve-scripts <pkg>` to allow.
  [2m[WebServer] [22m[1m[33mPrebundling has been configured but will not be used because caching has been disabled.[39m[22m
  [2m[WebServer] [22m[1m[33mPrebundling has been configured but will not be used because caching has been disabled.[39m[22m
  ```
