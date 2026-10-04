---
id: T008
title: Add the card and lift Storybook-half e2e cases to ngx-yeti-e2e
wave: 2
deps: [T001, T004, T006]
status: done
agent: build_T008
base: 45394edf71cb8ab113ec3818717741fe8db3af64
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
- 2026-10-04 — build_T008: added apps/ngx-yeti-e2e/src/card.spec.ts (card--default container resize across xs via a token probe, 320 px reflow, 200 % text zoom through root font-size; card--stretched-link real corner click navigates, real footer-button click does not, real Tab reaches link then button then leaves, skipped in WebKit; card--inputs raised set through Storybook's `updateStoryArgs` channel event, forced colours recorded as annotations, skipped in WebKit) and apps/ngx-yeti-e2e/src/lift.spec.ts (lift--default real hover rise plus shadow and scale equal to computed --yeti-lift-scale with translate none; reduced motion keeps top within 0.1, translate none/0px/0px 0px, shadow changes; lift--keyboard real Tab lifts, skipped in WebKit; forced-colours outline asserted visible and recorded; lift--without hover does not move, as the story's comment promises). Every geometry read waits for the item sheets (O2) and reads transitions after they finish. 320 px case clears the story frame's fixed 40rem hand-resize width so the card is measured at the page's own width. No axe call: every state reached is a play-function state or is media-only.
- 2026-10-04 — Verify in pipeline worktree (T008): `npm ci && npx nx typecheck ngx-yeti-e2e && test -f ... && npx nx e2e ngx-yeti-e2e -- card.spec.ts lift.spec.ts` exit 0, 12 passed on Chromium; rerun with --skip-nx-cache also 12 passed; web server started (no PATH failure). `npx prettier --check .` and `npx nx run-many -t lint typecheck -p ngx-yeti-e2e` pass. Recorded forced-colours readings (Chromium): card--inputs raised edge "border solid 1px rgb(0, 0, 0); box-shadow none", focused link outline "solid 2px rgb(55, 0, 110)"; lift--keyboard focused link outline "solid 2px rgb(55, 0, 110)".
- 2026-10-04 — primary-checkout run not done by the coder: this is a parallel round and the brief forbids editing D:\projects\github\LayZeeDK\ngx-yeti, where the new specs do not exist until landing. AC3's primary-checkout run is for the orchestrator after landing: `npx nx e2e ngx-yeti-e2e -- card.spec.ts lift.spec.ts`.
- 2026-10-04 — orchestrator Verify (isolate gsd-path-task/T008): pass, exit 0; output tail:
  ```
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
  
  [7m[1m[33m NX [39m[22m[27m  [33mNx detected a flaky task[39m
  
    yeti-css:yeti-build
  
  Flaky tasks can disrupt your CI pipeline. Automatically retry them with Nx Cloud. Learn more at https://nx.dev/ci/features/flaky-tasks
  ```
