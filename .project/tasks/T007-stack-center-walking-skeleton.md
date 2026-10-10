---
id: T007
title: Ship stack and center end to end with setup's item-links story and order case
wave: 2
deps: [T001, T002, T003]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - packages/ngx-yeti/stack/README.md
  - packages/ngx-yeti/stack/src/index.ts
  - packages/ngx-yeti/stack/src/stack.ts
  - packages/ngx-yeti/stack/src/stack-child.ts
  - packages/ngx-yeti/stack/src/stack-tokens.ts
  - packages/ngx-yeti/stack/src/stack.spec.ts
  - packages/ngx-yeti/stack/src/stack.ssr.spec.ts
  - packages/ngx-yeti/stack/src/stack.contract.node.spec.ts
  - packages/ngx-yeti/stack/src/stack.stories.ts
  - packages/ngx-yeti/center/README.md
  - packages/ngx-yeti/center/src/index.ts
  - packages/ngx-yeti/center/src/center.ts
  - packages/ngx-yeti/center/src/center.spec.ts
  - packages/ngx-yeti/center/src/center.ssr.spec.ts
  - packages/ngx-yeti/center/src/center.contract.node.spec.ts
  - packages/ngx-yeti/center/src/center.stories.ts
  - packages/ngx-yeti/styles/src/setup.stories.ts
  - packages/ngx-yeti/src/compile-errors.node.spec.ts
  - packages/ngx-yeti/compile-fixtures/center-max-large.ts
  - packages/ngx-yeti/eslint.config.mjs
  - packages/ngx-yeti/tsconfig.spec.json
  - apps/yeti-app/src/app/fixtures/stack-fixture.ts
  - apps/yeti-app/src/app/fixtures/center-fixture.ts
  - apps/yeti-app/src/app/fixtures/setup-fixture.ts
  - apps/yeti-app-e2e/src/stack.spec.ts
  - apps/yeti-app-e2e/src/center.spec.ts
  - apps/yeti-app-e2e/src/setup.spec.ts
  - apps/ngx-yeti-e2e/src/stack.spec.ts
  - tools/package/consumer/consumer.ts
  - packages/ngx-yeti/src/name-collision.node.spec.ts
  - packages/ngx-yeti/src/item-names.node.spec.ts
  - packages/ngx-yeti/README.md
  - packages/ngx-yeti/CHANGELOG.md
---

# T007 — Ship stack and center end to end with setup's item-links story and order case

## Context

This is the walking skeleton (SYNTHESIS For the planner): `stack` (docs/specs/specs/stack.md) and `center` (docs/specs/specs/center.md) at their own entry points with stories and the axe gate, layer-2 and layer-3 specs, the contract check, prerendered and server-rendered Fixture routes under JavaScript on and off, the packed consuming build, and the README and changelog, proving the per-item pattern every later task copies. It also lands two M001 carry-overs that need these items: the story `setup--item-links` (setup.md:303), which proves the loader inserts the tied `stack` and `center` files in Yeti's rank order (INTENT E1, ADR 0060 point 3), and the setup spec's layer-4 order case (setup.md:342). Center's compile-time fixture (center.md:274) needs a negative-compile check the workspace lacks, built here and reused by button. Box lands right after this task (T008, same wave) and adds every box composition of these two specs.

## Approach

- Records and skills: read the item spec's API, Implementation Decisions, and Testing Decisions sections in full (under `docs/specs/specs/`), the records its header names, and its rows in `docs/specs/ledger.md`. Follow `.claude/skills/ngx-yeti-specs/SKILL.md` (its Departures table wins over the records), `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/ngx-yeti-stories/SKILL.md`, `.claude/skills/ngx-yeti-accessibility/SKILL.md`, `.claude/skills/type-safety/SKILL.md`, and `.claude/skills/yeti-pin/SKILL.md`. The card item is the pattern for every file: `packages/ngx-yeti/card/src/card.ts`, `packages/ngx-yeti/card/src/card.spec.ts`, `packages/ngx-yeti/card/src/card.ssr.spec.ts`, `packages/ngx-yeti/card/src/card.contract.node.spec.ts`, `packages/ngx-yeti/card/src/card.stories.ts`, `apps/yeti-app/src/app/fixtures/card-fixture.ts`, `apps/yeti-app-e2e/src/card.spec.ts`, and `apps/ngx-yeti-e2e/src/card.spec.ts`.
- Entry point: T001 generated it. Fill its index.ts (classes, tokens, and package types; no import array, ADR 0018) and rewrite its README.md as `packages/ngx-yeti/card/README.md` reads. Never run the generator again and never edit tsconfig.base.json. Import another entry point by its package path (`ngx-yeti/box`), never by a relative path.
- Directive rules (binding records): only the item's root directive sets `data-ngx-yeti-item-{item}` and calls `injectYetiItemStyles('{item}')`, as the last statement of its constructor (ticket 50 decisions 6, 7, and 42); part, child, and any-element marker directives set no presence attribute and acquire no item file (E13). An unset input renders nothing: no directive writes Yeti's default value (ADR 0070:20). No host listener, ResizeObserver, JavaScript size read, breakpoint or viewport input, feature detection, or role beyond Yeti's (N4); the only package-written roles are scroller's static `role="region"` with `tabindex="0"` and `YetiButtonDisabledLink`'s `role="link"` with `aria-disabled`. No `@defer` in package templates, no `ngSkipHydration`, no Shadow DOM (ADR 0011 points 10 and 11), and no `animate.enter` (ADR 0010). An input name another package directive also declares (`gap` on 21 items, `align` on 8, `sticky` on three parts) uses the same exported type, such as `YetiGap` and `YetiAlign` from `ngx-yeti` (E14, building-blocks.md:53). No package CSS for a layout beyond a failing ledger assertion (each spec's Out of Scope).
- Usage rules: number them in the directive's JSDoc exactly as the spec's API section numbers them (CONTEXT.md:308; `packages/ngx-yeti/card/src/card.ts` line 10 is the pattern). Every rule that states package behaviour gets a test in this task (LESSONS.md).
- Stories (layer 1): `meta.id` is the item name and the story ids are the spec's; every story passes its play function and the axe gate. Prohibition N1 (judgment): must not reach a green axe gate by switching off rules or hiding content from assistive technology; no story disables an axe rule except a documented anti-pattern exception under the ngx-yeti-stories skill, and no fix adds aria-hidden, role=presentation, inert, or visually-hidden to content a user needs. A CSS `:hover` assertion the spec puts in a play function goes in layer 2 (pattern: `packages/ngx-yeti/lift/src/lift.spec.ts` lines 100 to 128, `userEvent.hover` from `vitest/browser`) or layer 4 (Departures row, ngx-yeti-specs SKILL.md:37). Contrast uses `contrastRatio` and `composite` from `@ngx-yeti/testing`, unrounded, 4.5:1 for text and 3:1 for a non-text part, in the light and the dark scheme (`withColorScheme('dark')`; ticket 50 decision 8), and never a token's text or default (ADR 0006:25): compare with probe elements that read the public token. A size-dependent change resizes the container, not only the viewport (building-blocks.md:96). Every static `img` uses `NgOptimizedImage` (building-blocks.md:35). No story or fixture writes a Yeti class, a Yeti `data-*` attribute, a presence attribute, or a static attribute on an attribute a directive binds (building-blocks.md:347; ADR 0003).
- Layers 2 and 3: the standard cases of every spec — class and presence attribute; inputs set through `bindings` render their `data-*` attribute and `undefined` removes it after `whenStable()`; one `link[data-ngx-yeti-styles]` for the item while a fixture lives, gone one frame after destroy, and two fixtures share one link until both are destroyed (E3); parts and markers acquire nothing (E13); no listener on the host; a small test host for template references, the consumer's own `class`, static forms, and same-element compositions. `{item}.ssr.spec.ts` renders through `renderServer()` with one `i18n` text and asserts the class, presence attribute, bound attributes, exactly one item link with `data-beasties-skip` and an `href` ending `{kind}/{item}/{item}.css?v=` and the pin, and no package `jsaction`. `{item}.contract.node.spec.ts` calls `checkContract` and pairs each `values` list with an `expectTypeOf` line, which only `nx typecheck` checks.
- Fixture route (layer 4): replace the T002 stub component(s) the Interface contract names; keep one `i18n` text and a server-rendered `routerLink`, so `waitForHydration` has a marker. Loop `routeKinds` so every case runs on `/sub/{key}` and `/sub/server/{key}`, with JavaScript on and off: `watchHydration` (no `NG05xx`, 0 skipped components, development build); with JavaScript off the item is styled and the `axeViolations` fixture finds nothing on `wcagTags`; a client-only `@defer` holding the item, which is in the preload list, paints 0 unstyled frames in the development run, while the production run records A4-affected frames as annotations (LESSONS.md; Departures row SKILL.md:40); a `hydrate never` host stays styled after `removeEveryHost`; leaving for `/replay` removes the item link and returning re-inserts it; no horizontal overflow at 320 px where the spec says so. Assert item links and preload hrefs by containment (`expect.arrayContaining`), never as an exact array, unless the order itself is the claim (E9, LESSONS.md). Prohibition N3 (judgment): must not keep content out of reach until hydration to avoid an unstyled frame; no item or Fixture route hides content (opacity, visibility, display, or inert) until the client boots; with JavaScript off every item's content is visible and readable.
- Recorded cases: Prohibition N2 (judgment): must not turn a recorded-only case into a pass or fail assertion, or drop it; every case the spec marks "record" is measured and written down as a Playwright annotation (`test.info().annotations`), not asserted, and a recorded result that crosses its record's threshold triggers the follow-up of E7.
- Engines and upstream bugs: wait for the item sheet before any geometry or colour read (`expectItemSheetsApplied` in `apps/ngx-yeti-e2e/src/item-styles.ts`, `itemSheetsLoaded` in `apps/yeti-app-e2e/src/support/style-probe.ts`), because of upstream O2's stale computed style after a stylesheet insertion; a layer-2 size read must also hold in stock Firefox 145, which needs the global stylesheet with the A11Y-30 workaround (upstream O3; `packages/ngx-yeti/lift/src/lift.spec.ts` lines 43 to 59 load it); real Safari in the `safari` job reports reduced motion, so no layer-2 test asserts an animation; forced-colours e2e checks run in Chromium and Firefox and skip in WebKit with the Departures reason (SKILL.md:43); Tab-to-link tests skip WebKit outside Linux with `skipUnlessTabReachesLinks` from `apps/ngx-yeti-e2e/src/tab-to-links.ts`; 200 % text zoom sets the root font size to 200 % (`apps/ngx-yeti-e2e/src/card.spec.ts` line 137).
- Cross-milestone stand-ins: where a case composes an item of a later milestone, build its M002 part with plain HTML in the partner's place (no partner directive, no hand-written Yeti class) and assert every M002 assertion of it; the partner-dependent assertions are not written (INTENT Scope out). Where a case composes an M002 item that lands in a later task, leave it to the task named in Approach.
- Cross-engine before hand-back: run this task's e2e specs in Firefox and WebKit through `node tools/ci-local/run-job.mjs ci e2e` (the Verify does). M001 landed on main with a Firefox focus failure and a real-Safari hover failure that a Chromium-only run missed.
- Stack (stack.md:284-326): `YetiStack` in `stack.ts` (inputs `gap`, `align` of the removed kind, `fill`, `rule`), `YetiStackChild` in `stack-child.ts` (`split`, `space`, `sticky`), `yetiStackToken` in `stack-tokens.ts`; the child's optional token resolves to the outer stack on an element carrying both. Stories: `stack--default`, `stack--settings`, `stack--align`, `stack--rule` (no separator in the tree), `stack--sticky`; write `stack--default`'s children as plain elements, because T008 adds `yetiBox` to each. Layer 2 and 3 per stack.md:294-309, including the static `align="center"` rendering `data-align` and no `align` attribute, and `fill` of the inert kind. Storybook half (stack.md:313, `apps/ngx-yeti-e2e/src/stack.spec.ts`): Yeti's `stack.spec.js` and `sticky.spec.js` geometry; on `stack--sticky` with `--yeti-scroll-padding` set to the pinned child's height, Tab through the links and assert no focused link is entirely covered (A11Y-22's shared row); 320 px with no horizontal overflow on the default, ruled, and filled stories. Fixture half (stack.md:315-322): the standard cases; a static `align="center"` stack shows no painted frame with `align` (use `recordPaintedAttributes` and follow T003's `E8 verdict` line); the tie: a center renders first and a stack holding a center renders later in a client-only `@defer`, and the inner center keeps its auto margins.
- Center (center.md:248-295): `YetiCenter` in `center.ts` (`max`, `gap`, `intrinsic`; a static `max="md"` stays inert beside `data-max`). Stories now: `center--default` (without its inner bordered box, which T008 adds), `center--unset`, `center--intrinsic`, `center--in-stack` (each center centred whichever of stack and center renders first), `center--controls`, `center--themed`. T008 adds `center--with-box`, the bordered box of `center--default`, A11Y-9's anti-pattern story, the `yetiCenter yetiBox` test host, and the A11Y-9 320 px case with the anti-pattern route. Layer 3: the center link sits after a `stack` link and before a later-ranked item's link. Fixture half: the standard cases and a stack of centers loaded in either order keeps every center centred (center.md:290). Center's Fixture spec has no Storybook-half cases.
- Compile-time fixture (center.md:274; INTENT SC4 and Corrections, 2026-10-10: "state SC4's compile-time fixtures as a separate failing-compile check"): `max="large"` must fail to compile. Build `packages/ngx-yeti/src/compile-errors.node.spec.ts` as the Interface contract says: it compiles `packages/ngx-yeti/compile-fixtures/center-max-large.ts` with the Angular compiler under the package's strict template options (precedent: `performCompilation` in `packages/ngx-yeti/vite.lib.config.mts` near line 187) and asserts the expected diagnostic (a TS2322 on the template binding), while the folder stays outside every tsconfig `typecheck` reads and outside type-aware lint (exclude it in `packages/ngx-yeti/eslint.config.mjs`, and in `packages/ngx-yeti/tsconfig.spec.json` if its includes reach it), so `nx typecheck` and `nx lint` stay green.
- `setup--item-links` in `packages/ngx-yeti/styles/src/setup.stories.ts` (setup.md:303): a toggle renders and removes a `yetiStack` holding a `yetiCenter`, then a center first and a stack after; the play function asserts the two links in `yeti.css` order after either arrival order, the inner center's computed inline margins equal on both sides, and both links gone in the frame after the toggle hides the last host (E1). The existing `setup--shared-host` keeps its assertions.
- Setup order case (setup.md:342): fill `SetupOrderFixture` (a `yetiStack`, then a `yetiCenter` inside it, rendered by the client in that order) and add the case to `apps/yeti-app-e2e/src/setup.spec.ts`: the center stays centred. Leave the existing setup routes and their exact `itemLinks` assertions as they are.
- Registries, owned by this task in this wave: `tools/package/consumer/consumer.ts` imports and uses one public symbol from each of `ngx-yeti/stack` and `ngx-yeti/center`; the positive list of `packages/ngx-yeti/src/name-collision.node.spec.ts` gains every new export; `packages/ngx-yeti/src/item-names.node.spec.ts` gains the two root directive files; `packages/ngx-yeti/README.md` gains both rows in its Entry points table and its status line (line 5) names the items now implemented; `packages/ngx-yeti/CHANGELOG.md` gains both entry points under the unreleased version, whose header already names the Yeti commit (ADR 0017). Leave CHANGELOG line 15 (no accessibility rule yet) to the button task.

## Interface contract

- Entry points (T001): for each item of box, breakout, button, center, cluster, columns, container, cover, enter, frame, grid, icon, layer, masonry, overlay, scroller, sidebar, spinner, stack, table, timeline, and visually-hidden, the generator wrote `packages/ngx-yeti/{item}/ng-package.json`, `packages/ngx-yeti/{item}/README.md`, and `packages/ngx-yeti/{item}/src/index.ts`, and tsconfig.base.json maps `ngx-yeti/{item}` to that index.ts, which exports nothing until the item's task fills it.
- Fixture key `stack` → `StackFixture` in `apps/yeti-app/src/app/fixtures/stack-fixture.ts`.
- Fixture key `center` → `CenterFixture` and key `center-anti-pattern` → `CenterAntiPatternFixture`, both in `apps/yeti-app/src/app/fixtures/center-fixture.ts`.
- Fixture key `setup-order` → `SetupOrderFixture` in `apps/yeti-app/src/app/fixtures/setup-fixture.ts`.
- Static attributes (T003): a removed-kind static attribute (ticket 50 decision 9) is a signal input named as the attribute, rendered on its `data-*` attribute, and removed from the host by the host binding `'[attr.{name}]': 'null'`. T003's Log holds one line `E8 verdict: pass` or `E8 verdict: fail`. On pass, the static form stays as the specs write it; on fail, every removed-kind input becomes bound-only as cluster.md:309 and icon.md:302 state, and the static-form story and test cases are dropped.
- `apps/yeti-app-e2e/src/support/style-probe.ts` exports `recordPaintedAttributes(page: Page, selector: string, attributes: readonly string[]): Promise<() => Promise<readonly string[]>>`, called before `goto`: an init-script MutationObserver plus a requestAnimationFrame probe; the returned function lists one entry `{element} {attribute}` for each animation frame in which an element matching `selector` carried one of `attributes`, so an empty list means no painted frame showed them.
- Compile-error check (T007): `packages/ngx-yeti/src/compile-errors.node.spec.ts` compiles each fixture under `packages/ngx-yeti/compile-fixtures/` with the Angular compiler's strict template checking (the package's own `angularCompilerOptions`) and asserts its expected diagnostic; its table `compileErrorCases` holds `{ fixture: string; code: number }` rows, `fixture` a file name in that folder and `code` the `ts.Diagnostic.code` (an Angular `NG` error is `-99` followed by its number, so NG8002 is -998002). The folder sits outside every tsconfig the `typecheck` and `lint` targets read, so they stay green.

## Intent coverage

- SC1
- SC2
- SC3
- SC4
- SC5

## Acceptance criteria

1. Every stack story and the center stories this task owns pass their play functions and the axe gate under `npm exec nx -- test-storybook ngx-yeti`, and `setup--item-links` passes: the `stack` and `center` links in `yeti.css` order after either arrival order, equal inline margins on the inner center, and both links gone in the frame after the toggle hides the last host (E1).
2. `apps/ngx-yeti-e2e/src/stack.spec.ts` passes in Chromium, Firefox, and WebKit: Yeti's stack and sticky geometry, the `stack--sticky` Tab walk with scroll padding (no focused link entirely covered), and no horizontal overflow at 320 px.
3. `/sub/stack`, `/sub/server/stack`, `/sub/center`, and `/sub/server/center` pass the standard Fixture cases with JavaScript on and off in the development and production builds; the static `align` stack shows no painted frame with `align` (per T003's verdict); the stack-later-in-`@defer` tie and the either-order stack of centers keep every center centred; the `setup-order` case keeps the center centred.
4. The layer-2, layer-3, and contract specs of stack and center pass, including the stack child's token resolving to the outer stack and two fixtures sharing one link (E3); `packages/ngx-yeti/src/compile-errors.node.spec.ts` asserts that `center-max-large.ts` fails to compile with the expected diagnostic, while `npm exec nx -- typecheck ngx-yeti` and `npm exec nx -- lint ngx-yeti` stay green.
5. `npm exec nx -- run ngx-yeti:pack-check` compiles a consumer that imports a public symbol from `ngx-yeti/stack` and from `ngx-yeti/center`; the contract checks of both items pass over the built manifest; the name-collision positive list holds every new export.
6. The JSDoc of each directive carries the spec's numbered usage rules; the package README's Entry points table and status line and the changelog name both items.
7. `npx prettier --check .` and `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD~1` pass at the task commit.

## Verify

```bash
npm ci && npx playwright install chromium && test -f packages/ngx-yeti/stack/src/stack.spec.ts && test -f packages/ngx-yeti/src/compile-errors.node.spec.ts && npm exec nx -- run-many -t lint typecheck -p ngx-yeti ngx-yeti-e2e yeti-app yeti-app-e2e && npm exec nx -- test ngx-yeti -- stack/src center/src styles/src src/compile-errors src/name-collision src/item-names && npm exec nx -- test-storybook ngx-yeti -- stack/src center/src styles/src && npm exec nx -- e2e ngx-yeti-e2e -- stack.spec.ts && npm exec nx -- e2e yeti-app-e2e -- stack.spec.ts center.spec.ts setup.spec.ts && FIXTURE_CONFIGURATION=production npm exec nx -- e2e yeti-app-e2e -- stack.spec.ts center.spec.ts setup.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e ngx-yeti-e2e -- --project=firefox stack.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=firefox stack.spec.ts center.spec.ts setup.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e ngx-yeti-e2e -- --project=webkit stack.spec.ts && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx e2e yeti-app-e2e -- --project=webkit stack.spec.ts center.spec.ts setup.spec.ts && npm exec nx -- run ngx-yeti:pack-check; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-10 — created by planner
- 2026-10-10 — orchestrator: plan-defect repair (Verify only), user ruling "Resolve the NX_DAEMON=false issue". Verify now ends by stopping the Nx daemon and keeps its own exit code. Measured cause: for a serial task, the pipeline reverts and deletes the verify sidecar right after Verify (`git restore`, then `git clean -fdx`); a daemon that Verify left running rewrites `.nx/workspace-data` and `node_modules/.vite-temp` during that cleanup and it fails with "Directory not empty" (2 of 2 with T004's diff; passes once the daemon is stopped). Run Verify exactly as written; never set NX_DAEMON.
