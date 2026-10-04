---
id: T008
title: Add the card and lift Storybook-half e2e cases to ngx-yeti-e2e
wave: 2
deps: [T001, T004, T006]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - apps/ngx-yeti-e2e/src/card.spec.ts
  - apps/ngx-yeti-e2e/src/lift.spec.ts
---

# T008 — Add the card and lift Storybook-half e2e cases to ngx-yeti-e2e

## Context

Layer 4 has a Storybook half that drives the static Storybook build with real input and media emulation (ADR 0014 point 4; `openStory` from the e2e project's own helper opens a story by URL with `embed=true`). card.md:330 and lift.md:247 name its cases; INTENT.md SC6 requires `nx e2e ngx-yeti-e2e` to include them and to pass on Chromium in a pipeline-created linked worktree and in the primary checkout. These cases are where the CSS `:hover`, real Tab, container resizing, zoom, reduced-motion, and forced-colours behaviour of the two items is proven, because Storybook's own `userEvent` cannot set `:hover` (Departures table hover row).

## Approach

- `apps/ngx-yeti-e2e/src/card.spec.ts` (card.md:330): on `card--default`, resize the story's container (not the viewport) across the `xs` stop and assert the row form above it and the stacked form below it (definitions in card.md:293, token-independent), a 320 px viewport with no horizontal overflow and a stacked card, and the switching width rising with 200 % text zoom; on `card--stretched-link`, a real mouse click near the corner navigates, a real click on the footer button does not, and real Tab presses reach only the stretched link and the footer button (skip in WebKit, where headless WebKit does not move focus on Tab); on `card--inputs` with `raised`, under `emulateMedia({ forcedColors: 'active' })`, record (annotation, not assertion) the card's edge and the focused link's outline (ticket 50 decision 119).
- `apps/ngx-yeti-e2e/src/lift.spec.ts` (lift.md:247): real hover on `lift--default` (the rise card's top decreases and `box-shadow` changes; the scale card's `scale` equals the computed `--yeti-lift-scale`); real Tab on `lift--keyboard` (skip in WebKit); under `emulateMedia({ reducedMotion: 'reduce' })` the hovered card's top stays put within one decimal and `translate` is `none`, `0px`, or `0px 0px`, while `box-shadow` still changes; under `emulateMedia({ forcedColors: 'active' })` the focused link keeps a visible outline (record the reading).
- Give each story its state through the story's args; `openStory` takes no props. Use `expectNoAxeViolations` only for states no play function reaches. Wait for the item links before geometry (upstream bug O2). Read token values from computed style, never hard-code them.
- Run the suite in the pipeline worktree (the Verify) and once in the primary checkout, and log both runs.
- Skills: `.claude/skills/ngx-yeti-testing/SKILL.md` (layer 4, `openStory`, engines), `.claude/skills/ngx-yeti-stories/SKILL.md`, `.claude/skills/type-safety/SKILL.md`.

## Interface contract

- Card stories live in packages/ngx-yeti/card/src/card.stories.ts with `meta.id: 'card'` and the ids `card--default`, `card--stretched-link`, `card--inputs`, `card--figure`, `card--list`, `card--rtl`, and `card--anti-pattern-wrapped-link`.
- Lift and setup stories: `lift--default`, `lift--keyboard`, `lift--bound`, and `lift--without` in packages/ngx-yeti/lift/src/lift.stories.ts (`meta.id: 'lift'`), `setup--shared-host` in packages/ngx-yeti/styles/src/setup.stories.ts (`meta.id: 'setup'`), and `card--with-lift` added to the card stories file.

## Intent coverage

- SC6

## Acceptance criteria

1. `apps/ngx-yeti-e2e/src/card.spec.ts` passes card.md:330's Storybook-half cases on Chromium: container resize across `xs`, 320 px reflow, 200 % text zoom, real corner and footer-button clicks, real Tab stops, and the recorded forced-colours reading.
2. `apps/ngx-yeti-e2e/src/lift.spec.ts` passes lift.md:247's cases on Chromium: real hover rise and scale, real Tab lift, reduced motion keeping the top and still changing the shadow, and the recorded forced-colours outline.
3. `npx nx e2e ngx-yeti-e2e` with these cases passes in a pipeline-created linked worktree and in the primary checkout; the task Log records both runs.
4. `npx prettier --check .` and `npx nx run-many -t lint typecheck -p ngx-yeti-e2e` pass at the task commit.

## Verify

```bash
npm ci --no-audit --no-fund && npx nx typecheck ngx-yeti-e2e && test -f apps/ngx-yeti-e2e/src/lift.spec.ts && npx nx e2e ngx-yeti-e2e -- card.spec.ts lift.spec.ts
```

Heavy: yes

## Log

- 2026-10-04 — created by planner
