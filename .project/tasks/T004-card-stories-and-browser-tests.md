---
id: T004
title: Write the card stories and the card browser tests
wave: 1
deps: [T002]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - packages/ngx-yeti/card/src/card.stories.ts
  - packages/ngx-yeti/card/src/card.spec.ts
  - packages/ngx-yeti/.storybook/assets/trail.svg
---

# T004 — Write the card stories and the card browser tests

## Context

`docs/specs/specs/card.md` Testing Decisions fix the card's layer-1 stories and layer-2 browser tests; this task writes both for the `YetiCard` and `YetiCardLink` directives that the loader task builds in this wave. The stories are the first under a generator-made entry point, so they also prove the Storybook glob half of wave-1 blocker 2. INTENT.md trims the story list for M001: `card--layer-caption` and `card--grid-rows` move to M002 with `layer` and `grid`, `card--with-lift` arrives with lift in wave 2, and `card--default` uses section 8's markup with a plain `span` and a plain footer link in place of `yetiBadge` and `yetiButton` (the badge and button assertions land in M002 and M004). INTENT.md Scope: in also asks that `card--inputs` state upstream bug Y12's `2xs` behaviour (`docs/specs/upstream-bugs.md`).

## Approach

- Stories in `packages/ngx-yeti/card/src/card.stories.ts`, `meta.id: 'card'`, following `.claude/skills/ngx-yeti-stories/SKILL.md` (directive story pattern, template props named unlike inputs, the axe gate never lowered, no `title`) and `.claude/skills/type-safety/rules/storybook-stories.md`. Story ids and their assertions come from card.md:299-310: `card--default`, `card--stretched-link`, `card--inputs`, `card--figure`, `card--list`, `card--rtl`, `card--anti-pattern-wrapped-link` (an Anti-pattern story that switches off no rule), plus the contrast bullet. Leave out `card--layer-caption`, `card--grid-rows`, and `card--with-lift`.
- Token-independent geometry (card.md:293): set `threshold` and `ratio` explicitly, size the container against the literal stop (`xs` is `16rem` of content) plus a probe styled with the card's padding and border tokens, and read gaps and border widths from computed style. "Row form" and "stacked" mean what card.md:293 defines. Wait for the card's item link to load before measuring (upstream bug O2: stale computed styles right after a stylesheet insertion in Chromium and WebKit).
- Contrast: exact WCAG formula on computed colours with `contrastRatio` and friends from `'@ngx-yeti/testing'`, at least 4.5:1, in light and in dark (`withColorScheme('dark')` from the preview decorators); see `.claude/skills/ngx-yeti-accessibility/SKILL.md`.
- Images: every story `img` uses `NgOptimizedImage` in its `width` and `height` form (card.md usage rule 7). `packages/ngx-yeti/.storybook/main.ts` belongs to the accessibility-stylesheet task in this wave; do not edit it. Bring the picture in as a Vite-imported asset (`packages/ngx-yeti/.storybook/assets/trail.svg`, imported by URL from the story file), not through a new `staticDirs` entry.
- `card--inputs` carries a JSDoc comment stating that `threshold="2xs"` matches no rule in Yeti's `card.css` at the pin (upstream bug Y12), so a `2xs` card never switches to the row form.
- No CSS `:hover` assertion in any play function (Departures table hover row of `.claude/skills/ngx-yeti-specs/SKILL.md`); the card has none.
- Layer 2 in `packages/ngx-yeti/card/src/card.spec.ts`, card.md:313-320, through `TestBed.createDirective` and a small test host only where card.md says so; the one case of an `article` with both `yetiCard` and `yetiLift` lives in the lift task's spec, not here (nothing is tested twice). Count links through the DOM (`link[data-ngx-yeti-styles="card"]` in the head), never through the loader. Follow `.claude/skills/ngx-yeti-testing/SKILL.md` and `.claude/skills/type-safety/SKILL.md`.
- Every Verify that runs `test` or `test-storybook` also runs `nx typecheck ngx-yeti`.

## Interface contract

- ngx-yeti/card exports `YetiCard`, `YetiCardLink`, and `yetiCardToken: InjectionToken<YetiCard>`. `YetiCard`: selector `[yetiCard]`, exportAs `yetiCard`, inputs `variant: YetiVariant | undefined`, `threshold: YetiWidth | undefined`, `ratio: YetiRatio | undefined`, and `raised: boolean` through `booleanAttribute` (default false); host: static class `card`, static `data-ngx-yeti-item-card=""`, `data-variant`, `data-threshold`, and `data-ratio` from the inputs and absent when unset, `data-raised=""` only while `raised` is true; provides `yetiCardToken`; acquires the `card` item file. `YetiCardLink`: selector `a[yetiCardLink]`, exportAs `yetiCardLink`, input `stretch: boolean` through `booleanAttribute` (default false), host `data-stretch=""` only while true; no presence attribute and no item file.
- The loader writes one item link per acquired item into the document head, `<link rel="stylesheet" href="{url}{kind}/{name}/{name}.css?v=f52d1e8b93de5bbde322480ba77d5be26c49b0ef" data-ngx-yeti-styles="{name}" data-ngx-yeti-app="{APP_ID}" data-beasties-skip>` plus `nonce` when `CSP_NONCE` is provided, with `url` defaulting to `'yeti-css/'` relative to the base href; item links stand in the import order of Yeti's built yeti.css; each preload item adds `<link rel="preload" as="style" href="{same href}">`; each item root directive's host carries the static presence attribute `data-ngx-yeti-item-{name}=""`.
- Card stories live in packages/ngx-yeti/card/src/card.stories.ts with `meta.id: 'card'` and the ids `card--default`, `card--stretched-link`, `card--inputs`, `card--figure`, `card--list`, `card--rtl`, and `card--anti-pattern-wrapped-link`.

## Intent coverage

- SC1

## Acceptance criteria

1. The seven card stories exist with the contract's ids and each play function asserts what card.md:299-310 lists for it, including the stretched link's accessible name equal to the heading text, a press near the bottom-right corner landing on and following the link, a footer button taking its own click without navigating, the Tab order, `outline-style` not `none` on the focused link, and the anti-pattern link's name containing the paragraph text; all pass their play functions and the axe gate under `npx nx test-storybook ngx-yeti`.
2. `card--default` renders section 8's markup with a plain `span` and a plain footer link (`tabindex="-1"`) in place of `yetiBadge` and `yetiButton`, and asserts no `data-variant`, `data-ratio`, or `data-raised`, `data-stretch` without a presence attribute on the link, the bleed in the stacked form, and the row form when wide.
3. `card--default` and `card--inputs` assert at least 4.5:1 for the heading link and the paragraph, and `card--figure` for the caption, in light and dark schemes, with the exact formula on computed colours.
4. Every story image uses `NgOptimizedImage`, and `packages/ngx-yeti/.storybook/main.ts` is unchanged by this task.
5. `card--inputs` carries the Y12 `2xs` statement.
6. `packages/ngx-yeti/card/src/card.spec.ts` covers card.md:315-320 (attributes on and off, one shared link for two cards removed in the frame after both are destroyed, `YetiCardLink` alone, no host listener, the token, template references, static `raised`, `stretch`, and `threshold`, a `routerLink` anchor, the consumer's own `class`) and passes under `npx nx test ngx-yeti`.
7. `npx prettier --check .` and `npx nx run-many -t lint typecheck test test-storybook -p ngx-yeti` pass at the task commit.

## Verify

```bash
npm ci --no-audit --no-fund && test -f packages/ngx-yeti/card/src/card.stories.ts && npx nx test ngx-yeti -- card.spec && npx nx test-storybook ngx-yeti -- card.stories && npx nx typecheck ngx-yeti
```

Heavy: yes

## Log

- 2026-10-04 — created by planner
