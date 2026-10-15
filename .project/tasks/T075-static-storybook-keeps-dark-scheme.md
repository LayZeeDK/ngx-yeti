---
id: T075
title: Build the static Storybook's CSS for the .browserslistrc floor so inline dark-scheme wrappers stay dark, and assert every wrapper story's colours in ngx-yeti-e2e
wave: 15
deps: []
status: done
agent: build_T075
base: cf6fd65f5a017d5fffab14228f2a5bcf3b29a58d
worktree: null
task_branch: null
files:
  - packages/ngx-yeti/.storybook/main.ts
  - apps/ngx-yeti-e2e/src/color-scheme-wrappers.spec.ts
---

# T075 — Build the static Storybook's CSS for the .browserslistrc floor so inline dark-scheme wrappers stay dark, and assert every wrapper story's colours in ngx-yeti-e2e

## Context

Final-review patch of M002 (2026-10-15), finding P003 of .project/review/PATCH-FINDINGS.md (reviewed HEAD f8aa2eacac8aabf1099271b52466cc8605b65aeb), source .project/review/final-gap-3.md (Gap verdict: blocked). Risk: the static Storybook build lowers `light-dark()`, so inline `color-scheme: dark` story wrappers render light colours in ngx-yeti-e2e's dark-scheme checks and on the Storybook stories surface. It is a final-review finding, so the patch-mode pattern rule applies (see the search below).

P003, verbatim:

- **Evidence**: on the Storybook stories surface (the static build at PLAN.md's Entry), no inline `color-scheme` wrapper keeps its own scheme. Both wrappers of a story always render the page media's scheme: measured light `oklch(0.99 0.02 250)` / `oklch(0.15 0.02 250)` inside "dark" wrappers under default media. The cause is Vite's default `build.cssTarget` (`baseline-widely-available`: chrome111, firefox114, safari16.4). Vite passes it to the lightningcss minify in `build`, and lightningcss lowers `light-dark()` into `prefers-color-scheme`-keyed `--lightningcss-*` variables that an inline `color-scheme` cannot switch. The dev transform keeps native `light-dark()`, so the play functions and `nx storybook` show the correct dark colours. In the static build, ngx-yeti-e2e's dark-scheme contrast checks at button.spec.ts:244, layer.spec.ts:52, overlay.spec.ts:213, and spinner.spec.ts:287/:320 measure, record, and pass on light colours. Their titles and annotations still claim the dark scheme. So the e2e layer gives no evidence for the dark halves of button.md:315, spinner.md:290/:292, overlay.md:291, and ledger A11Y-10b.
- **Fix direction**: in packages/ngx-yeti/.storybook/main.ts `viteFinal`, set `build.cssTarget` to targets derived from .browserslistrc in the returned `mergeConfig`. Take them from the installed `browserslist` (or lightningcss `browserslistToTargets`), converted to Vite's esbuild-style list, e.g. `chrome141, edge141, firefox145, safari26.2, ios26.2`. lightningcss then keeps `light-dark()` native, and no story changes. Do not set `css.lightningcss.targets`: Vite's `minifyCSS` overrides it (node.js:30543). Proof:

PATCH-FINDINGS.md's copy ends at "Proof:". The list that follows in final-gap-3.md's Fix direction, verbatim:

  1. Rebuild with `nx build-storybook ngx-yeti`, check that `rg -c "light-dark\(" packages/ngx-yeti/storybook-static/assets/iframe-*.css` is non-zero, and check that `lightningcss-dark` is absent.
  2. Re-run the wrapper probe and confirm the dark wrappers compute `oklch(0.13 0.02 250)` under page media light.
  3. Re-run `nx e2e ngx-yeti-e2e` for apps/ngx-yeti-e2e/src/button.spec.ts, layer.spec.ts, overlay.spec.ts, and spinner.spec.ts in Chromium, Firefox, and WebKit. The dark ratios may now cross 4.5:1, which triggers INTENT E7's follow-up.
  4. Re-run `nx test-storybook ngx-yeti` to show that the play functions are unchanged.

The reviewer's measurements (final-gap-3.md): the built iframe CSS holds 0 `light-dark(` and 48 `--lightningcss-light` / 48 `--lightningcss-dark` fallbacks, switched only on `:root` and in `@media (prefers-color-scheme:dark)`. The static build's affected stories: box--paint, box--paint-alerts-light, box--paint-alerts-dark, box--anti-pattern-low-contrast, breakout--dark-scheme, button--variants, icon--standalone, layer--dark-scheme, layer--badge, overlay--veil, spinner--default, spinner--variants, timeline--dark-scheme. In every one, the two wrappers render the same colours. In the dev transform each wrapper keeps its own scheme: dark `oklch(0.13 0.02 250)` / `oklch(0.93 0.02 250)`. The wrappers come from `withColorScheme` (packages/ngx-yeti/.storybook/decorators.ts:8) and the `data-scheme` wrappers in eight story files (box, spinner, button, icon, breakout, layer, timeline, overlay). button.spec.ts:311-315 and open-story.spec.ts:31-39 read the page scheme, not a wrapper, so the lowering does not affect them.

Pattern search by the planner at f8aa2ea, for every other build that lowers `light-dark()` the same way. Only packages/ngx-yeti/.storybook/main.ts is in scope:
- apps/yeti-analog/vite.config.ts sets `build.target: ['es2020']`, which Vite maps to old browser versions. That would lower `light-dark()`. But the app's src imports no yeti-css and sets no `color-scheme` (rg over apps/yeti-analog/src: no `yeti-css`, `light-dark` or `color-scheme`, measured). Its local built CSS under dist/apps/yeti-analog holds no `light-dark(` and no `lightningcss-dark` (measured on the existing local build, not rebuilt). So nothing there is lowered today. It is affected only if the app later imports Yeti's tokens (inferred).
- The Fixture app (apps/yeti-app) builds with the Angular application builder. Its local built CSS under dist/apps/yeti-app holds 92 `light-dark(` and no `lightningcss-dark` (measured on the 2026-10-15 local build), so it keeps the tokens native.
- The Vitest configs (packages/ngx-yeti/vitest.config.mts, vitest.unit.config.mts, packages/ngx-yeti-testing/vitest.config.mts) and `test-storybook` use Vite's serve transform, which runs no CSS minify. The reviewer measured native `light-dark()` in the dev transform; the same for Vitest is inferred.

## Approach

- packages/ngx-yeti/.storybook/main.ts `viteFinal`: add `build.cssTarget` to the returned `mergeConfig`, derived from the repository's .browserslistrc (`chrome 141`, `edge 141`, `firefox 145`, `safari 26.2`, `ios_saf 26.2`), so the static build has the same browser floor as the rest of the repository. Do not set `css.lightningcss.targets` (Vite's minify overrides it). Add no dependency and leave package.json unchanged: `browserslist` is only a transitive package, and `lightningcss` is a direct one. Reading the file's plain `<browser> <version>` lines is acceptable, mapping `ios_saf` to `ios`. An entry the code cannot map throws while the config loads, naming the entry. Keep the fastCompile swap and `server.fs.allow` as they are. Read references/fast-compile.md before the change, as AGENTS.md asks for any Storybook config change.
- No story, decorator or existing spec changes. The dark cases named in Evidence must now measure dark colours and still pass. A dark case that fails its threshold after the fix is INTENT E7's follow-up (a package rule and a ledger row). That is outside this task's files, so stop: record `NEEDS-ORCHESTRATOR` in the Log with the story, engine, colours and ratio. Do not weaken the assertion or change the story.
- The committed check, apps/ngx-yeti-e2e/src/color-scheme-wrappers.spec.ts, runs against the static build that ngx-yeti-e2e already serves on port 4401. For each story with an inline scheme wrapper, and each page scheme (`page.emulateMedia`), the dark wrapper's computed surface background and text must stay the dark scheme's and the light wrapper's the light scheme's. In practice: the dark wrapper is darker than the light wrapper (lower relative luminance of its background), and each wrapper's colours do not change with the page scheme. Write one test per story and page scheme, not a loop of `openStory` inside one test. T071's root check fails on a test that loops over page loads under a fixed budget. The story list covers every story whose source sets an inline `color-scheme` (directly, through `withColorScheme`, or as a `data-scheme` wrapper). A test in the same spec reads the story sources and fails when a story file sets one and none of its story ids is listed. Use the e2e app's existing helpers (`openStory`, the contrast and colour helpers in apps/ngx-yeti-e2e/src) rather than new ones.
- Show the new spec failing against the current build (before the main.ts change) on its colour assertion, in at least one engine, and record the run in the Log.
- Keep the TypeScript and lint rules of the e2e app (`.claude/skills/type-safety/SKILL.md`). Comments say only what the code cannot, with no planning id, date or measurement.
- The Verify builds Storybook and runs three container e2e legs and `test-storybook`, so the orchestrator runs this task with no other heavy command, coder or NVDA run. Port 4401 must be free.
- Skills: `.claude/skills/ngx-yeti-stories/SKILL.md`, `.claude/skills/ngx-yeti-testing/SKILL.md`, `.claude/skills/ngx-yeti-accessibility/SKILL.md`, `.claude/skills/type-safety/SKILL.md`; `references/fast-compile.md`, `references/ci-local.md`.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. `npm exec nx -- build-storybook ngx-yeti --skip-nx-cache` writes CSS under packages/ngx-yeti/storybook-static/assets that holds `light-dark(` and no `lightningcss-dark`. The CSS target comes from .browserslistrc, and `css.lightningcss.targets` is not set.
2. apps/ngx-yeti-e2e/src/color-scheme-wrappers.spec.ts asserts, for every story with an inline scheme wrapper under each page scheme, that the dark wrapper stays dark and the light wrapper stays light. It fails when a story file with an inline scheme wrapper has no listed story. The Log records it failing on the current build before the main.ts change.
3. The dark cases at button.spec.ts:244, layer.spec.ts:52, overlay.spec.ts:213, and spinner.spec.ts:287 and :320 measure dark colours (recorded in the Log from their annotations or the new spec's colours) and pass in Chromium, Firefox and WebKit through run-job.
4. `npm exec nx -- test-storybook ngx-yeti --skip-nx-cache` passes.
5. No `*.stories.ts` file, `packages/ngx-yeti/.storybook/decorators.ts`, or existing spec changes. package.json and package-lock.json are unchanged.
6. Lint and typecheck of ngx-yeti and ngx-yeti-e2e pass, and prettier passes on the two files.

## Verify

```bash
set -o pipefail && npm ci && npx playwright install chromium && npm exec nx -- build-storybook ngx-yeti --skip-nx-cache && rg -q -u 'light-dark\(' packages/ngx-yeti/storybook-static/assets && ! rg -q -u -F 'lightningcss-dark' packages/ngx-yeti/storybook-static/assets && npm exec nx -- run-many -t lint typecheck -p ngx-yeti ngx-yeti-e2e && npm exec nx -- test-storybook ngx-yeti --skip-nx-cache && node tools/ci-local/run-job.mjs ci e2e --matrix engine=chromium --matrix configuration=development -- npx nx run ngx-yeti-e2e:e2e --output-style=static -- --project=chromium && node tools/ci-local/run-job.mjs ci e2e --matrix engine=firefox --matrix configuration=development -- npx nx run ngx-yeti-e2e:e2e --output-style=static -- --project=firefox && node tools/ci-local/run-job.mjs ci e2e --matrix engine=webkit --matrix configuration=development -- npx nx run ngx-yeti-e2e:e2e --output-style=static -- --project=webkit && npx prettier --check packages/ngx-yeti/.storybook/main.ts apps/ngx-yeti-e2e/src/color-scheme-wrappers.spec.ts; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-15 — created by planner (final-review patch), from .project/review/PATCH-FINDINGS.md P003 (source .project/review/final-gap-3.md).
- 2026-10-15 — coder (build_T075): packages/ngx-yeti/.storybook/main.ts `viteFinal` now merges `build: { cssTarget }` read from .browserslistrc (plain `<browser> <version>` lines; `ios_saf` -> `ios`; an unmappable line throws while the config loads, naming the line). Result: `chrome141, edge141, firefox145, safari26.2, ios26.2`. `css.lightningcss.targets` is not set; fastCompile swap and `server.fs.allow` unchanged. New apps/ngx-yeti-e2e/src/color-scheme-wrappers.spec.ts: one test per story and page scheme (`page.emulateMedia`) for 16 stories (box--surfaces, box--paint, box--paint-alerts-light, box--paint-alerts-dark, box--text, box--anti-pattern-low-contrast, breakout--dark-scheme, button--variants, icon--standalone, layer--dark-scheme, layer--badge, overlay--default, overlay--veil, spinner--default, spinner--variants, timeline--dark-scheme). It reads every `[style*="color-scheme"]` wrapper in the story root and asserts a dark wrapper's surface luminance is below 0.18 and its text above, a light wrapper's the reverse, then flips the page scheme and asserts the wrapper colours are unchanged. A coverage test reads every `*.stories.ts` under packages/ngx-yeti whose source matches `color-scheme:` or `withColorScheme(` and fails when no listed story id has that file as its index.json `importPath`. The list adds box--surfaces, box--text and overlay--default to final-gap-3's 13 stories: their sources set an inline `color-scheme` wrapper too. No story, decorator, existing spec, package.json or lock file changed.
- 2026-10-15 — coder: before the main.ts change (original main.ts, Chromium, native, `nx run ngx-yeti-e2e:e2e --skip-nx-cache -- --project=chromium color-scheme-wrappers`): 32 failed, 1 passed (the coverage test). Every failure is the colour assertion, e.g. "dark wrapper: oklch(0.15 0.02 250) on oklch(0.99 0.02 250)" under a light page and "light wrapper: oklch(0.93 0.02 250) on oklch(0.13 0.02 250)" under a dark page. After the change, the same native Chromium run of color-scheme-wrappers, button, layer, overlay and spinner: 92 passed.
- 2026-10-15 — coder: dark colours measured in the Verify's run-job legs (blob-report annotations), identical in Chromium, Firefox and WebKit: every dark wrapper `oklch(0.93 0.02 250)` on `oklch(0.13 0.02 250)` and every light wrapper `oklch(0.15 0.02 250)` on `oklch(0.99 0.02 250)`, under both page schemes, for every listed story, including button--variants (button.spec.ts:244's story), layer--dark-scheme, overlay--veil, spinner--default and spinner--variants. a11y-10b-ratio for layer--dark-scheme: 16.500 on black, 11.309 on white; veil-scrim-ratio dark: 16.500 on black, 11.309 on white (all three engines). No dark case fell under its threshold, so INTENT E7's follow-up is not triggered.
- 2026-10-15 — coder: Verify run exactly as written, exit 0. build-storybook passed; built CSS (assets/iframe-so7-hU1g.css) holds `light-dark(`, no `lightningcss-dark`; lint and typecheck for ngx-yeti and ngx-yeti-e2e passed; test-storybook 25 files, 170 tests passed; run-job ci e2e: chromium 186 passed 1 skipped, firefox 186 passed 1 skipped, webkit 178 passed 9 skipped (skips are the existing forced-colours, Tab-to-buttons and animation-timeline engine skips); prettier passed on both files; Nx daemon stopped.
- 2026-10-15 — coder: rule-13 check: `npx prettier --check .` passed; `nx affected -t lint typecheck test test-storybook --base=HEAD` passed for 6 projects (ngx-yeti test 85 files / 705 tests, test-storybook 25 files / 170 tests, plus a 1-file / 1-test run).
- 2026-10-15 — orchestrator Verify (isolate gsd-path-task/T075): pass, exit 0; output tail:
  ```
  17.18.26 [vite] [33m[2m(client)[22m[39m [2m[console.warn] [22mNG02960: The NgOptimizedImage directive (activated on an <img> element with the `ngSrc="/.storybook/assets/trail.svg?no-inline"`) has detected that the intrinsic image is significantly larger than necessary. 
  Rendered image size: 250.469w x 140.875h. 
  Intrinsic image size: 1600w x 900h. 
  Recommended intrinsic image size: 500.938w x 281.75h. 
  Note: Recommended intrinsic image size is calculated assuming a maximum DPR of 2. To improve loading time, resize the image or consider using the "ngSrcset" and "sizes" attributes.
  17.18.26 [vite] [33m[2m(client)[22m[39m [2m[console.warn] [22mNG02960: The NgOptimizedImage directive (activated on an <img> element with the `ngSrc="/.storybook/assets/trail.svg?no-inline"`) has detected that the intrinsic image is significantly larger than necessary. 
  Rendered image size: 250.453w x 140.875h. 
  Intrinsic image size: 1600w x 900h. 
  Recommended intrinsic image size: 500.906w x 281.75h. 
  Note: Recommended intrinsic image size is calculated assuming a maximum DPR of 2. To improve loading time, resize the image or consider using the "ngSrcset" and "sizes" attributes.
  17.18.26 [vite] [33m[2m(client)[22m[39m [2m[console.warn] [22mNG02960: The NgOptimizedImage directive (activated on an <img> element with the `ngSrc="/.storybook/assets/trail.svg?no-inline"`) has detected that the intrinsic image is significantly larger than necessary. 
  Rendered image size: 250.453w x 140.875h. 
  Intrinsic image size: 1600w x 900h. 
  Recommended intrinsic image size: 500.906w x 281.75h. 
  Note: Recommended intrinsic image size is calculated assuming a maximum DPR of 2. To improve loading time, resize the image or consider using the "ngSrcset" and "sizes" attributes.
  17.18.31 [vite] [33m[2m(client)[22m[39m [2m[console.warn] [22mNG02952: The NgOptimizedImage directive (activated on an <img> element with the `ngSrc="/.storybook/assets/trail.svg?no-inline"`) has detected that the aspect ratio of the rendered image does not match the image's intrinsic aspect ratio. 
  Intrinsic image size: 1600w x 900h (aspect-ratio: 1.78). 
  Rendered image size: 960w x 411.422h (aspect-ratio: 2.33). 
  This issue can occur if "width" and "height" attributes are added to an image without updating the corresponding image styling. To fix this, adjust image styling. In most cases, adding "height: auto" or "width: auto" to the image styling will fix this issue.
  17.18.33 [vite] [31m[2m(client)[22m[39m [2m[console.error] [22mNG02955: The NgOptimizedImage directive (activated on an <img> element with the `ngSrc="http://127.0.0.1:62191/.storybook/assets/trail.svg?no-inline"`) has detected that this image is the Largest Contentful Paint (LCP) element but was not marked "priority". This image should be marked "priority" in order to prioritize its loading. To fix this, add the "priority" attribute.
  ```
