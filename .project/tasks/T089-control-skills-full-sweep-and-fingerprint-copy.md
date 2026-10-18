---
id: T089
title: Bring both control skills to the 2026-10-18 verification contract with fresh fingerprint.mjs copies and Full sweep and Manual only feature-map sections
wave: 20
deps: [T084]
status: done
agent: build_t089
base: b28bfd8ca130fee6c252e094a577e121d813cb91
worktree: null
task_branch: null
files:
  - .claude/skills/control-yeti-app/scripts/fingerprint.mjs
  - .claude/skills/control-yeti-app/features/README.md
  - .claude/skills/control-ngx-yeti-storybook/scripts/fingerprint.mjs
  - .claude/skills/control-ngx-yeti-storybook/features/README.md
---

# T089 — Bring both control skills to the 2026-10-18 verification contract with fresh fingerprint.mjs copies and Full sweep and Manual only feature-map sections

## Context

Lars, verbatim, 2026-10-18: "Land the verification changes in M002 as T088" (T088 was then taken by the fix-task helper, so this task is T089). The global lars-create-verification skill changed on 2026-10-18. Measured by the planner at a1815a6 with C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/scripts/check-skill.mjs `--json` (exit 1 on both skills):

- .claude/skills/control-ngx-yeti-storybook: `fingerprint-copy` fails ("scripts/fingerprint.mjs differs from ...; copy it again, never edit the copy") and `readme-sections` fails ("missing: Full sweep, Manual only").
- .claude/skills/control-yeti-app: the same `fingerprint-copy` failure and `readme-sections` fails ("missing: Full sweep").

Every other check passes on both. The new global fingerprint.mjs has sha256 a8c6b2bd5e1fcea32a208caa6e4f6e3e173b85c34a19f605cdc84c827433f7f2 and hashes through `git hash-object --stdin-paths`; the peer session that owns the change measured the same check statuses on LF files with it. proctree.mjs is unchanged (`proctree-copy` passes). At a1815a6 both `node .claude/skills/<skill>/scripts/fingerprint.mjs check` exit 0 with the old copies. fingerprint.mjs never reads features/README.md (it excludes README from the feature ids), so a README edit cannot stale features/.proven.json.

The contract (C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/references/generated-skill.md, lines 40-80 and "Feature map"): features/README.md has the H2 sections Baseline preconditions, Driving conventions, Proof and skip reporting, Feature entry contract, Features, Full sweep, Manual only, in that order; other sections may follow them. `## Full sweep` links every top-level features/*.md except README.md exactly once as a Markdown link `[Name](./name.md)` (a backtick file name does not count), in the order a full pass drives them (the map order /lars-maintain-verification uses); check-skill's `full-sweep` check fails a sweep that leaves out, repeats or adds a file. A cross-cutting flows file under features/flows is optional and is linked last only when it exists; neither skill has one and this task does not add one. `## Manual only` lists what no agent can drive (for Angular: DevTools checks, OS dialogs, external auth providers, anything a probe showed playwright-cli cannot reach).

Current READMEs: control-yeti-app has Baseline preconditions, Driving conventions, Proof and skip reporting, Feature entry contract, Features (item-routes, javascript-off, hydration-and-replay, build-configurations as Markdown links) and Manual only, with no Full sweep. control-ngx-yeti-storybook has the first five sections, its Features is a table with backtick file names (stories.md, play-functions.md, axe-results.md), and it has no Full sweep and no Manual only. .prettierignore already lists `/.claude/skills/control-*/scripts/fingerprint.mjs` (line 19), so it needs no change. The last task that changed these four files is T084 (wave 17).

## Approach

- Copy the global fingerprint.mjs byte for byte over each skill's scripts/fingerprint.mjs (a file copy, never an edit, no line-ending conversion).
- Run /lars-maintain-verification's step 1 contract check (check-skill.mjs) on each skill for the two failing checks only; this is not a full maintenance pass. No live drive: the change adds README sections and a byte copy; no recipe, feature file, route or control script changes, and .proven.json stays fresh by the fingerprint check. Record in the Log that no live drive ran and why.
- control-yeti-app README: insert `## Full sweep` between Features and Manual only, linking each of its four feature files once, in map order. Keep Manual only's content.
- control-ngx-yeti-storybook README: add `## Full sweep` after Features, linking stories.md, play-functions.md and axe-results.md once each, in the order a full pass drives them; then add `## Manual only`, stating what agents cannot prove in this Storybook (from the skill's SKILL.md Gotchas, its feature files and the ngx-yeti-testing skill's screen-reader rule: real screen readers are automated, so they are not manual), or `None` with the reason when nothing is manual. Keep the Features table as it is.
- Write in the README's existing voice; no planning ids in the skill files. Do not touch .proven.json, SKILL.md, the feature files or the scripts other than fingerprint.mjs. If the fingerprint check is not fresh after the copy, stop and report it as blocked; do not re-record.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. Each skill's scripts/fingerprint.mjs is byte-identical to C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/scripts/fingerprint.mjs (`cmp` exits 0; sha256 d3c1150a8d79004cd2115299bf341c179f21082abbfcecf7513dd3f30595e03f), and check-skill's `fingerprint-copy` and `proctree-copy` pass on both.
2. Each features/README.md has Baseline preconditions, Driving conventions, Proof and skip reporting, Feature entry contract, Features, Full sweep and Manual only as H2s in that order; each Full sweep links every top-level feature file except README.md exactly once as a Markdown link, in map order; check-skill's `readme-sections` and `full-sweep` pass on both.
3. control-ngx-yeti-storybook's Manual only lists what no agent can prove in the Storybook, or says `None` with a reason; control-yeti-app's Manual only keeps its two existing items.
4. check-skill.mjs `--json` exits 0 on both skills, and `node <skill>/scripts/fingerprint.mjs check` exits 0 on both with the new copies (features/.proven.json unchanged and fresh). The Log records both check-skill results and that no live drive ran, with the reason.
5. `npx prettier --check` passes on both README.md files; .prettierignore is unchanged.

## Verify

```bash
set -o pipefail && npm ci && S=C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/scripts && node $S/check-skill.mjs .claude/skills/control-yeti-app --json && node $S/check-skill.mjs .claude/skills/control-ngx-yeti-storybook --json && node .claude/skills/control-yeti-app/scripts/fingerprint.mjs check && node .claude/skills/control-ngx-yeti-storybook/scripts/fingerprint.mjs check && cmp $S/fingerprint.mjs .claude/skills/control-yeti-app/scripts/fingerprint.mjs && cmp $S/fingerprint.mjs .claude/skills/control-ngx-yeti-storybook/scripts/fingerprint.mjs && npx prettier --check .claude/skills/control-yeti-app/features/README.md .claude/skills/control-ngx-yeti-storybook/features/README.md; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: no

## Log

- 2026-10-18 — created by planner (build repair: the 2026-10-18 verification contract change)
- 2026-10-18 — orchestrator (plan gate, before approval): added `npm ci &&` at the start of Verify, because the finish sidecar starts without node_modules and `npx prettier` and the daemon stop need the workspace's packages.
- 2026-10-18 — orchestrator (plan-defect repair of an AC before dispatch): AC1's sha256 changed from a8c6b2bd5e1fcea32a208caa6e4f6e3e173b85c34a19f605cdc84c827433f7f2 to d3c1150a8d79004cd2115299bf341c179f21082abbfcecf7513dd3f30595e03f, because the global fingerprint.mjs changed again after planning (it now turns off git filter drivers before `git hash-object`, as verdict.mjs does; measured with certutil). The `cmp` against the global file is unchanged.
- 2026-10-18 — build_T089 (coder, serial round in the primary at b28bfd8): before any change, check-skill.mjs `--json` exited 1 on both skills: control-yeti-app failed `fingerprint-copy` and `readme-sections` ("missing: Full sweep"); control-ngx-yeti-storybook failed `fingerprint-copy` and `readme-sections` ("missing: Full sweep, Manual only"); every other check passed; both `fingerprint.mjs check` exited 0 (4/4 and 3/3 fresh); both `cmp` against the global fingerprint.mjs exited 1 (differ at byte 1164, line 15). Changes: copied the global fingerprint.mjs with `cp` over both scripts/fingerprint.mjs (sha256 d3c1150a8d79004cd2115299bf341c179f21082abbfcecf7513dd3f30595e03f for the global file and both copies); control-yeti-app README gained `## Full sweep` between Features and Manual only (item-routes, javascript-off, hydration-and-replay, build-configurations as Markdown links, the Features order; Manual only's two items kept); control-ngx-yeti-storybook README gained `## Full sweep` (stories, play-functions, axe-results as Markdown links, the Features table order) and `## Manual only` (Angular DevTools; the manager UI's Accessibility and Interactions panels), and the "Manual only:" bullet under Proof and skip reporting moved into that section so the list lives in one place; the Features table is unchanged. No live drive ran: the change is two README sections and a byte copy of fingerprint.mjs; no recipe, feature file, route or control script changed, and features/.proven.json is unchanged and fresh by `fingerprint.mjs check`. Verify exactly as written: exit 0 (npm ci; check-skill `--json` 21/21 checks ok on control-yeti-app and 20/20 on control-ngx-yeti-storybook, including fingerprint-copy, proctree-copy, readme-sections and full-sweep; fingerprint check 4/4 and 3/3 fresh; both cmp exit 0; prettier check of both READMEs passes; daemon stopped). `npx prettier --check .`: all files pass. `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD` (through the heavy lock): affected project @ngx-yeti/source only, typecheck and test passed (2/2 tasks, test from cache). .prettierignore unchanged; Git index untouched.
- 2026-10-18 — orchestrator Verify (sidecar gsd-path-verify/task-t089-verify): pass, exit 0; output tail:
  ```
  npm warn deprecated @angular/platform-browser-dynamic@22.2.1: @angular/platform-browser-dynamic is deprecated. Use `@angular/platform-browser` instead.
  npm warn deprecated @yuku-parser/binding-win32-arm64@0.10.2: yuku-parser runs on yuku-core since 0.14
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
  ```
