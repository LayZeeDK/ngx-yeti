# Archive — 001-walking-skeleton

Milestone: walking-skeleton
Shipped: 2026-10-04
Final verdict: all criteria met; project verify passed
Waves: 6  Tasks: 17 done / 17 total  Review cycles used: 1/2/1/1/1/1
Carried forward: none

## Success criteria at ship

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| In Storybook, every story the `setup`, `card`, and `lift` specs name, except the cases carried to later milestones under Scope: out, passes its play function and the axe gate under `nx test-storybook ngx-yeti`; the CSS `:hover` assertions of `lift--default` and `lift--without` run in layer 2 or 4 under the hover departure row of `.claude/skills/ngx-yeti-specs/SKILL.md`. An item's Yeti file is in `<head>` while a host carrying its presence attribute is connected and is removed in the frame after the last such host leaves (ADR 0060 point 4). Walkthrough: in the built Storybook, `card--stretched-link` shows a styled card whose corner click follows the link while its footer button keeps its click, and `setup--shared-host` shows both the `card` and `lift` links in `<head>`. | met | packages/ngx-yeti/card/src/card.stories.ts; packages/ngx-yeti/styles/src/setup.stories.ts:48; packages/ngx-yeti/storybook-static/index.json; .claude/skills/ngx-yeti-specs/SKILL.md:37 |
| On the Fixture app, the prerendered `/card`, `/lift`, and `/setup` routes and the server-rendered `/server/card`, `/server/lift`, and `/server/setup` routes pass `yeti-app-e2e` with JavaScript on and off: styled from the server's head links, axe-clean on the `wcagTags` rule set, no `NG05xx`, `componentsSkippedHydration === 0`, and 0 `<link>` or `<style>` mutations after `DOMContentLoaded` (the loader adopts the server's links). Each item link carries `data-ngx-yeti-styles`, `data-ngx-yeti-app`, and `data-beasties-skip`. A `card` with `lift` inside `hydrate never` keeps both links after every live `lift` has left (ADR 0045). A client-only `@defer` with `preload` shows 0 unstyled frames. Leaving the card route removes the card link and returning re-inserts it. With JavaScript off, a click near a card's corner navigates to its stretched link and a hovered `yetiLift` card lifts. The setup spec's other layer-4 cases that need no later item pass (setup.md:335-346: `hydrate on interaction`, leave, boundaries, the dev-server run, the strict-CSP nonce route, the 66-file assets glob, and the A4 frame count recorded per engine). The JavaScript-off, axe, and hydration assertions, the `webServer` readiness URL, the build-output prerender assertions, and the axe negative controls that targeted the `highlight` placeholder now target `card`; the `replay` fixture and its test stay. Walkthrough: with JavaScript disabled, `/sub/card` shows a styled card and a click near its corner navigates. | met | .project/review/final-gap-1.md; .project/build/verify-ledger.jsonl (b5854c5, result pass); apps/yeti-app-e2e/src/setup.spec.ts:455-512; apps/yeti-app-e2e/src/card.spec.ts:257-270; .claude/skills/ngx-yeti-specs/SKILL.md:40; packages/ngx-yeti/README.md:87; apps/yeti-app/project.json (serve-ssr) |
| A consuming build against the `npm pack` tarball imports `YetiCard` and `YetiCardLink` from `ngx-yeti/card`, `NgxYetiLift` from `ngx-yeti/lift`, `injectYetiItemStyles` and `provideYetiStyles` from `ngx-yeti/styles`, and the types `YetiComponentName`, `YetiVariant`, `YetiWidth`, `YetiRatio`, and `YetiLift` from `ngx-yeti`, and resolves `ngx-yeti/accessibility.css`. The primary `ngx-yeti` entry point exports types only, no published `.d.ts` imports `yeti-css`, the package declares no `yeti-css` dependency or peer, the packed version matches the ADR 0017 format, and the changelog names the full Yeti commit `f52d1e8b93de5bbde322480ba77d5be26c49b0ef`. | met | tools/package/pack-check.mjs:141-168; tools/package/consumer/consumer.ts; packages/ngx-yeti/CHANGELOG.md; .project/review/final-gap-2.md |
| The contract check over the built manifest passes for `card` and `lift`, the ADR 0080 name-collision test passes for `YetiCard`, `YetiCardLink`, `yetiCardToken`, and `NgxYetiLift`, and no `NgxYeti` component, `Highlight` directive, or `highlight` fixture remains under `packages/`, `apps/`, or `tools/`; the skill pattern pointers that named the placeholder files name the card files. | met | packages/ngx-yeti/card/src/card.contract.node.spec.ts; packages/ngx-yeti/lift/src/lift.contract.node.spec.ts; packages/ngx-yeti/src/name-collision.node.spec.ts:38-41 |
| Under `nx test ngx-yeti`, the setup spec's layer-2 cases (setup.md:314-322, with probe directives) and its layer-3 cases pass: the SSR smoke with `card` and `lift` and a `lift` preload, two concurrent renders with the same `<head>`, the generated rank table (49 items in `yeti.css` order, every path present), `yeti-types.ts` equal to `yeti.d.ts`, the pin constant equal to `vendor/yeti/COMMIT`, no Yeti rule in the published output, every `accessibility.css` rule inside `@layer ngx-yeti`, and the version test; card and lift's SSR smoke asserts no package `jsaction`. | met | packages/ngx-yeti/styles/src/yeti-styles.spec.ts; packages/ngx-yeti/styles/src/setup.ssr.spec.ts:35,81; packages/ngx-yeti/styles/src/yeti-rank.node.spec.ts:48; docs/specs/specs/setup.md:314-327 |
| `nx e2e yeti-app-e2e` and `nx e2e ngx-yeti-e2e` start their web servers and pass both in a pipeline-created linked worktree and in the primary checkout, `ngx-yeti-e2e` including the card and lift Storybook-half cases (card.md:330, lift.md:247) on Chromium locally. | met | .project/build/verify-ledger.jsonl (b5854c5, result pass); .project/STATE.md Log (T008 AC3 primary checkout; integrated uncached checks at 2b5202d); apps/ngx-yeti-e2e/src/card.spec.ts; apps/ngx-yeti-e2e/src/lift.spec.ts |
| `npm run check` passes, docs-audit rulings 1 to 5 are applied, and the package README documents the setup spec's parts A to E, usage rules 1 to 11, and the `@boundary` section, with `provideYetiStyles` and `injectYetiItemStyles` JSDoc citing the rule numbers. | met | packages/ngx-yeti/README.md:33-149; packages/ngx-yeti/styles/src/provide-yeti-styles.ts:15-38; packages/ngx-yeti/styles/src/inject-yeti-item-styles.ts:18-21; .project/research/DOCS-AUDIT.md; .project/review/final-gap-3.md |

## Contents

- build/evidence.json
- build/verify-ledger.jsonl
- intent/INTENT.md
- plan/PLAN.md
- research/DOCS-AUDIT.md
- research/RESEARCH.md
- research/SYNTHESIS.md
- research/evidence-codebase.md
- research/evidence-pitfalls.md
- research/evidence-stack.md
- review/FINAL.md
- review/PATCH-FINDINGS.md
- review/final-gap-1.md
- review/final-gap-2.md
- review/final-gap-3.md
- review/wave-1.cycle1.md
- review/wave-2.cycle1.md
- review/wave-2.cycle1.repair-T015.json
- review/wave-2.cycle2.md
- review/wave-3.cycle1.md
- review/wave-4.cycle1.md
- review/wave-5.cycle1.md
- review/wave-6.cycle1.md
- tasks/T001-webserver-start-in-worktrees.md
- tasks/T002-styles-loader-and-card-entry-points.md
- tasks/T003-accessibility-stylesheet.md
- tasks/T004-card-stories-and-browser-tests.md
- tasks/T005-card-fixture-route-and-hydration-adoption.md
- tasks/T006-lift-item-and-setup-stories.md
- tasks/T007-lift-and-setup-fixture-routes.md
- tasks/T008-card-and-lift-storybook-e2e.md
- tasks/T009-contract-check-and-name-collision.md
- tasks/T010-setup-serving-cases.md
- tasks/T011-card-route-shared-host-preload-navigation.md
- tasks/T012-remove-placeholders-move-assertions-to-card.md
- tasks/T013-release-readiness-skeleton.md
- tasks/T014-setup-documentation-and-docs-rulings.md
- tasks/T015-fix-wave-2-cycle-1.md
- tasks/T016-route-level-provide-yeti-styles-no-effect.md
- tasks/T017-production-a4-frames-recorded-not-asserted.md

## Notes

- none
