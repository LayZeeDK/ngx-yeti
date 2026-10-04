---
id: T012
title: Remove the NgxYeti and Highlight placeholders and move their assertions onto card
wave: 3
deps: [T001, T002, T003, T004, T005, T007, T010]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - packages/ngx-yeti/src/index.ts
  - packages/ngx-yeti/vite.lib.config.mts
  - packages/ngx-yeti/src/lib/highlight/highlight.ts
  - packages/ngx-yeti/src/lib/highlight/highlight.spec.ts
  - packages/ngx-yeti/src/lib/highlight/highlight.ssr.spec.ts
  - packages/ngx-yeti/src/lib/highlight/highlight.stories.ts
  - packages/ngx-yeti/src/lib/ngx-yeti/ngx-yeti.ts
  - packages/ngx-yeti/src/lib/ngx-yeti/ngx-yeti.html
  - packages/ngx-yeti/src/lib/ngx-yeti/ngx-yeti.css
  - packages/ngx-yeti/src/lib/ngx-yeti/ngx-yeti.spec.ts
  - packages/ngx-yeti/src/lib/ngx-yeti/ngx-yeti.stories.ts
  - packages/ngx-yeti/card/src/card.ssr.spec.ts
  - apps/yeti-app/src/app/fixtures/fixtures.ts
  - apps/yeti-app/src/app/fixtures/highlight-fixture.ts
  - apps/yeti-app/src/app/fixtures/replay-fixture.ts
  - apps/yeti-app-e2e/playwright.config.mts
  - apps/yeti-app-e2e/src/fixture-app.spec.ts
  - apps/yeti-app-e2e/src/build-output.spec.ts
  - apps/ngx-yeti-e2e/src/ngx-yeti.spec.ts
  - apps/ngx-yeti-e2e/src/open-story.spec.ts
  - .claude/skills/ngx-yeti-specs/SKILL.md
  - .claude/skills/ngx-yeti-testing/SKILL.md
  - .claude/skills/ngx-yeti-stories/SKILL.md
  - .claude/skills/type-safety/SKILL.md
  - .claude/skills/type-safety/rules/angular-components.md
  - .claude/skills/type-safety/rules/sifers-pattern.md
  - .claude/skills/eslint-conflict-audit/SKILL.md
---

# T012 — Remove the NgxYeti and Highlight placeholders and move their assertions onto card

## Context

The package still exports two generator placeholders from its primary entry point: the `NgxYeti` component and the `Highlight` directive in `packages/ngx-yeti/src/lib/`. They appear in no spec, yet they are today's test targets: the Fixture app's `highlight` fixture, the `yeti-app-e2e` hydration, JavaScript-off, and axe assertions, the `webServer` readiness URL, the build-output prerender assertions, the axe negative controls, the `ngx-yeti-e2e` story ids (`src-lib-ngx-yeti--heading`, `--primary`, `--missing`), the SSR spec pattern, and the skill pattern pointers all name them. Program and milestone synthesis settle that they go in the same change that moves those assertions onto `card` and makes the primary entry point types-only (`.claude/skills/ngx-yeti-specs/SKILL.md`, One-time tasks; INTENT.md SC4). The `replay` fixture and its event-replay test stay (card and lift declare no listener, so no replay assertion moves onto card), and docs-audit ruling 1 gives the replay fixture an `i18n` text; rulings 4 and 5 edit the same skill files as the pointer move, so they land here too (`.project/research/DOCS-AUDIT.md`, User rulings).

## Approach

- Delete the nine files under `packages/ngx-yeti/src/lib/` and their exports; `packages/ngx-yeti/src/index.ts` keeps only the type re-export of the generated Yeti types, so the primary entry point exports types only. Keep `packages/ngx-yeti/src/yeti-manifest.node.spec.ts`. If ng-packagr or `build-fast` (`packages/ngx-yeti/vite.lib.config.mts`) needs a change for a types-only primary entry, make it there and keep `build` and `build-fast` green.
- `packages/ngx-yeti/card/src/card.ssr.spec.ts` replaces the highlight SSR spec (card.md:324, minus the M004 assertion that the card link follows the `button` and `badge` links): `renderServer()` with `withI18nSupport()` and a fixture of section 8's markup with M001's stand-ins, a bound `ratio`, and a static `raised`; `whenStable()` resolves; the article's `class`, presence attribute, `data-threshold`, `data-ratio`, `data-raised=""`; the link's `data-stretch=""` and `href`; one card item link in the head with `data-beasties-skip` and an `href` ending in the card file and the pin query; no element carries a package `jsaction`.
- Fixture app: delete `apps/yeti-app/src/app/fixtures/highlight-fixture.ts` and its row in `apps/yeti-app/src/app/fixtures/fixtures.ts`; add one `i18n` text to `apps/yeti-app/src/app/fixtures/replay-fixture.ts` (docs-audit ruling 1) without changing the button text the replay test reads, or adjust that test's expectation in the same commit.
- `yeti-app-e2e`: in `apps/yeti-app-e2e/src/fixture-app.spec.ts` move the hydration, JavaScript-off styling, and JavaScript-off axe tests and the two axe negative controls from `highlight` to the `card` route (styled now means a computed property from the card's item file and the root font from Yeti's tokens, not a background colour); keep the replay test. Avoid repeating what the card route's own spec already asserts: if a moved test duplicates one, keep one copy. In `apps/yeti-app-e2e/src/build-output.spec.ts` the prerender assertions name the card route's prerendered output and its absent server twin; the 66-file assets test stays. In `apps/yeti-app-e2e/playwright.config.mts` the readiness URL of the existing `serve-ssr` entry names `card`; leave the command and any other entry as they are.
- `ngx-yeti-e2e`: `git mv apps/ngx-yeti-e2e/src/ngx-yeti.spec.ts apps/ngx-yeti-e2e/src/open-story.spec.ts`; its `openStory` and dark-scheme axe tests open `card--default` and an unknown `card--missing` id (with the matching error text).
- Skills: point every pattern pointer that names a placeholder file at the card files (`.claude/skills/ngx-yeti-testing/SKILL.md` layer 2 and layer 3 patterns, `.claude/skills/ngx-yeti-stories/SKILL.md` directive story pattern, `.claude/skills/type-safety/SKILL.md` demonstration files, `.claude/skills/type-safety/rules/sifers-pattern.md`, `.claude/skills/type-safety/rules/angular-components.md`, and the sample-file table of `.claude/skills/eslint-conflict-audit/SKILL.md`, which has no package component template any more), keeping each example true to the code it cites. In `.claude/skills/ngx-yeti-specs/SKILL.md` delete the placeholder one-time-task bullet and add a Departures row for the preload measurement split (Record: setup.md:341, card.md:337, and lift.md:249 measure a client-only `@defer` item with and without the preload list; The workspace does: the Fixture app preloads `card` and leaves `lift` out, so "with" is measured on card and "without" recorded on lift; Why: `provideYetiStyles` is root-only, one build has one preload list; Skill: `ngx-yeti-testing`).
- Docs-audit ruling 4: add `ngx-yeti-testing` to the `vitestConfig` project list in `.claude/skills/type-safety/SKILL.md`. Ruling 5: in `.claude/skills/ngx-yeti-stories/SKILL.md`, the sentence on `injectYetiItemStyles` names the `'ngx-yeti/styles'` entry point and the setup spec it arrives with. Re-run each audit claim check (`.project/research/DOCS-AUDIT.md` remediation rows 1, 4, 5) and log the result.
- Never edit `docs/specs/` or `vendor/yeti/`. Skills to follow: `.claude/skills/ngx-yeti-specs/SKILL.md`, `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/type-safety/SKILL.md`.

## Interface contract

- The primary entry point ngx-yeti re-exports with `export type *` every type of the generated file packages/ngx-yeti/src/yeti-types.ts, a copy of Yeti's built yeti.d.ts at the pin, including `YetiComponentName`, `YetiKind`, `YetiVariant`, `YetiWidth`, `YetiRatio`, and `YetiLift`; item entry points import these types with `import type { ... } from 'ngx-yeti'` and never from `'yeti-css'`.
- ngx-yeti/card exports `YetiCard`, `YetiCardLink`, and `yetiCardToken: InjectionToken<YetiCard>`. `YetiCard`: selector `[yetiCard]`, exportAs `yetiCard`, inputs `variant: YetiVariant | undefined`, `threshold: YetiWidth | undefined`, `ratio: YetiRatio | undefined`, and `raised: boolean` through `booleanAttribute` (default false); host: static class `card`, static `data-ngx-yeti-item-card=""`, `data-variant`, `data-threshold`, and `data-ratio` from the inputs and absent when unset, `data-raised=""` only while `raised` is true; provides `yetiCardToken`; acquires the `card` item file. `YetiCardLink`: selector `a[yetiCardLink]`, exportAs `yetiCardLink`, input `stretch: boolean` through `booleanAttribute` (default false), host `data-stretch=""` only while true; no presence attribute and no item file.
- Card stories live in packages/ngx-yeti/card/src/card.stories.ts with `meta.id: 'card'` and the ids `card--default`, `card--stretched-link`, `card--inputs`, `card--figure`, `card--list`, `card--rtl`, and `card--anti-pattern-wrapped-link`.
- Fixture key `card` in apps/yeti-app/src/app/fixtures/fixtures.ts maps to `CardFixture` in apps/yeti-app/src/app/fixtures/card-fixture.ts, served prerendered at `/sub/card` and server-rendered at `/sub/server/card`; it renders card.md section 8's markup with a plain `span` and a plain footer link in place of `yetiBadge` and `yetiButton`, an `h3` whose link carries `yetiCardLink stretch` and the text `Weekend in the hills`, and the `i18n` paragraph `Six miles, one summit, and a view worth the early start.`

## Intent coverage

- SC2
- SC4
- SC5
- SC7

## Acceptance criteria

1. No `NgxYeti` component, `Highlight` directive, or `highlight` fixture remains under `packages/`, `apps/`, or `tools/`; the primary entry point `ngx-yeti` exports types only; `npx nx build ngx-yeti` and `npx nx build-fast ngx-yeti` still pass.
2. The JavaScript-off, axe, and hydration assertions, the `webServer` readiness URL, the build-output prerender assertions, and the axe negative controls that targeted `highlight` now target `card`, and `apps/yeti-app-e2e/src/fixture-app.spec.ts` and `apps/yeti-app-e2e/src/build-output.spec.ts` pass; the `replay` fixture and its event-replay test are kept and pass.
3. `apps/ngx-yeti-e2e/src/open-story.spec.ts` replaces the old spec, opens card story ids, and passes.
4. `packages/ngx-yeti/card/src/card.ssr.spec.ts` passes under `npx nx test ngx-yeti` and asserts the card's server HTML and its head link, and that no element carries a package `jsaction`.
5. Every skill pattern pointer that named a placeholder file names a card file; the placeholder one-time-task bullet is gone from `.claude/skills/ngx-yeti-specs/SKILL.md`, which gains the preload-split Departures row.
6. Docs-audit rulings 1, 4, and 5 are applied: the replay fixture has an `i18n` text, the type-safety skill's `vitestConfig` list names `ngx-yeti-testing`, and the stories skill names `ngx-yeti/styles` for `injectYetiItemStyles`; the task Log records each re-run claim check.
7. `npx prettier --check .` and `npx nx run-many -t lint typecheck test -p ngx-yeti yeti-app yeti-app-e2e ngx-yeti-e2e` pass at the task commit.

## Verify

```bash
npm ci --no-audit --no-fund && ! rg -q -w 'NgxYeti|Highlight|HighlightFixture' packages apps tools && test ! -e packages/ngx-yeti/src/lib/highlight/highlight.ts && test -f packages/ngx-yeti/card/src/card.ssr.spec.ts && npx nx test ngx-yeti -- card.ssr.spec && npx nx run-many -t typecheck -p ngx-yeti yeti-app yeti-app-e2e ngx-yeti-e2e && npx nx run-many -t build build-fast -p ngx-yeti && npx nx e2e yeti-app-e2e -- fixture-app.spec.ts build-output.spec.ts && npx nx e2e ngx-yeti-e2e -- open-story.spec.ts && rg -q i18n apps/yeti-app/src/app/fixtures/replay-fixture.ts && rg -q ngx-yeti-testing .claude/skills/type-safety/SKILL.md && rg -q 'ngx-yeti.styles' .claude/skills/ngx-yeti-stories/SKILL.md
```

Heavy: yes

## Log

- 2026-10-04 — created by planner
