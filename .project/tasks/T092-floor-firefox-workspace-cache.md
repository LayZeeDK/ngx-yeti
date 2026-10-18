---
id: T092
title: Keep the firefox-145 floor's Firefox and geckodriver download in the workspace's gitignored tmp/floor-firefox instead of the OS temp folder
wave: 22
deps: [T061, T086, T090]
status: pending
agent: null
base: null
worktree: null
task_branch: null
files:
  - packages/ngx-yeti/vitest.unit.config.mts
  - tools/playwright/vitest-configs.test.mjs
  - references/ci-local.md
  - .claude/skills/ngx-yeti-testing/SKILL.md
  - tmp/floor-firefox/firefox/win64-stable_145.0/core/firefox.exe
---

# T092 — Keep the firefox-145 floor's Firefox and geckodriver download in the workspace's gitignored tmp/floor-firefox instead of the OS temp folder

## Context

Final review, ship attempt 3, finding P001 (.project/review/PATCH-FINDINGS.md, source .project/review/final-gap-1.md), verbatim:

- **Locator**: Risk: project Verify
- **Evidence**: Project Verify failed at the reviewed commit.
- **Fix direction**: Resolve the recorded command failure before shipping.

The recorded project Verify output at 8222987 (.project/build/verify-ledger.jsonl, last entry, exit 1) fails in the firefox-145 floor step, `FLOOR_FIREFOX=true npm exec nx -- test ngx-yeti -- --project=browser`, with:

```
Error: Failed downloading firefox vstable_145.0 using {"unpack":true,"cacheDir":"C:\\Users\\LARSGY~1\\AppData\\Local\\Temp","platform":"win64","buildId":"stable_145.0","browser":"firefox","providers":[]}: All providers failed for firefox stable_145.0:
  - DefaultProvider: The browser folder (C:\Users\LARSGY~1\AppData\Local\Temp\firefox\win64-stable_145.0) exists but the executable (C:\Users\LARSGY~1\AppData\Local\Temp\firefox\win64-stable_145.0\core\firefox.exe) is missing
 ❯ ../../node_modules/@wdio/utils/build/node.js:137:13
 ❯ setupPuppeteerBrowser ../../node_modules/@wdio/utils/build/node.js:211:3
 ❯ startWebDriver ../../node_modules/@wdio/utils/build/node.js:433:34
```

Measured by the orchestrator: that folder holds only a 20-byte postSigningData file; the Firefox install was emptied after 2026-10-16 (inferred cause: an OS temp-folder cleanup). Every step before it passed (prettier, npm run check, build, pack-check); the later steps did not run.

Orchestrator research, measured: packages/ngx-yeti/vitest.unit.config.mts:21-28 configures `webdriverio({ capabilities: { browserVersion: 'stable_145.0' } })` with no cache directory. In WebdriverIO 9.32.0, node_modules/@wdio/utils/build/node.js:219-227, getCacheDir returns `caps['wdio:geckodriverOptions'].cacheDir || options.cacheDir || process.env.WEBDRIVER_CACHE_DIR || os.tmpdir()`, and that one directory holds both the downloaded Firefox (setupPuppeteerBrowser) and geckodriver; @puppeteer/browsers refuses to reinstall into an existing folder that lacks the executable. The chromium-141 floor already keeps its browser in the workspace: PLAN.md's Project verify installs Chrome for Testing 141 into `$(pwd)/tmp/floor-chrome`, and `tmp` is gitignored (.gitignore:5).

Planner's sweep at 8222987 (recorded here; the coder repeats it): the only WebdriverIO sites in apps/, packages/ and tools/ are packages/ngx-yeti/vitest.unit.config.mts (the FLOOR_FIREFOX provider at :24 and the SAFARI provider at :34) and apps/screen-reader-e2e/src/support/voiceover.ts:52 (`remote({ capabilities: { browserName: 'safari' } })`). Both Safari sites use the runner's safaridriver: startWebDriver's Safari branch (node_modules/@wdio/utils/build/node.js:423) never reads the cache directory, and the driver setup at :519-520 skips Safari. Playwright browsers live in Playwright's own cache, and the chromium-141 floor installs into tmp/floor-chrome. So the pattern (a floor browser download cached in the OS temp folder) has one site: the FLOOR_FIREFOX branch. The other `os.tmpdir()` uses in the workspace are fresh `mkdtempSync` scratch folders and run-job's leg folders, not browser caches. The Verify's last check runs the sweep's file-level rule over the tree; it lists vitest.unit.config.mts today.

## Approach

- Give the FLOOR_FIREFOX provider `capabilities['wdio:geckodriverOptions'].cacheDir` set to the absolute path of the workspace root's tmp/floor-firefox folder, resolved from the config file's own location (`import.meta.dirname`, as the coverage `reportsDirectory` already does), not from `process.cwd()`: Nx runs the target with cwd packages/ngx-yeti. Keep `browserVersion: 'stable_145.0'` and the ticket 27 comment.
- The folder must sit outside every Nx input of every ngx-yeti target and of the root `@ngx-yeti/source` targets. A folder under packages/ngx-yeti would fall under the `default` input of ngx-yeti:test. Check `npm exec nx -- show project ngx-yeti --json` and `npm exec nx -- show project @ngx-yeti/source --json` after a download and record in the Log that no target's inputs pick up the downloaded files (tmp is gitignored, and tsconfig.scripts.json excludes `**/tmp`).
- No self-healing deletion logic, no new dependency, and no change to nx.json, .github/workflows/ci.yml or .github/workflows/floor.yml. If a measured failure requires one, stop and report blocked. CI's floor job then downloads into the checkout's tmp/floor-firefox, and floor.yml's comment "WebdriverIO downloads Firefox 145 and geckodriver itself" stays true.
- Leave the broken folder C:\Users\LARSGY~1\AppData\Local\Temp\firefox\win64-stable_145.0 alone: it is outside the project, and while it exists it is a live negative control (the floor step passes only if WebdriverIO no longer looks there).
- Show it failing first: extend tools/playwright/vitest-configs.test.mjs, which already imports the configs through `importConfig(href, env)` with every floor variable cleared (FLOOR_FIREFOX at :39), with a test that imports packages/ngx-yeti/vitest.unit.config.mts with `{ FLOOR_FIREFOX: 'true' }` under a fresh query string and asserts that the browser project's provider options carry a `wdio:geckodriverOptions` cacheDir that is absolute, resolves inside the workspace root, and lies outside packages/. Record the red run on the unchanged config in the Log, then make it pass. Keep the existing restore test passing.
- Docs follow the change: references/ci-local.md:53 and .claude/skills/ngx-yeti-testing/SKILL.md:118 say WebdriverIO downloads stock Firefox 145 (and geckodriver); name the folder it now uses, tmp/floor-firefox at the workspace root.
- Follow the repository's script rules (typed `.mjs`, `// @ts-check`) and the type-safety skill.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. With FLOOR_FIREFOX=true, the browser project of packages/ngx-yeti/vitest.unit.config.mts uses a webdriverio provider whose `capabilities['wdio:geckodriverOptions'].cacheDir` is the absolute path of tmp/floor-firefox at the workspace root, derived from the config file's location; `browserVersion` stays `stable_145.0`, and the SAFARI, FLOOR_WEBKIT, Chromium-floor and default branches are unchanged.
2. tools/playwright/vitest-configs.test.mjs has a test that fails on the unchanged config and passes with the change, asserting that cacheDir is absolute, inside the workspace root, and outside packages/; the Log records the red run with the failing case name. `node --test tools/playwright/vitest-configs.test.mjs` passes.
3. In a fresh sidecar, `FLOOR_FIREFOX=true npm exec nx -- test ngx-yeti --skip-nx-cache -- --project=browser` downloads Firefox 145 into tmp/floor-firefox and passes, and `tmp/floor-firefox/firefox/win64-stable_145.0/core/firefox.exe` exists afterwards, while the emptied OS temp folder is left untouched.
4. The Log records that tmp/floor-firefox is outside every input of the ngx-yeti and `@ngx-yeti/source` targets, from `nx show project --json`, and repeats the WebdriverIO site sweep with the result per site. nx.json, ci.yml, floor.yml and package.json are unchanged.
5. references/ci-local.md's firefox-145 row and the testing skill's FLOOR_FIREFOX row name tmp/floor-firefox as the folder WebdriverIO downloads Firefox 145 and geckodriver into.
6. Every file in apps/, packages/ and tools/ that imports `webdriverio` or `@vitest/browser-webdriverio` and names Firefox, Chrome, Chromium or Edge also names `cacheDir`; `npm exec nx -- typecheck ngx-yeti`, `npm exec nx -- typecheck @ngx-yeti/source` and `npx prettier --check` on the four changed files pass.

## Verify

```bash
set -o pipefail && npm ci && node --test tools/playwright/vitest-configs.test.mjs && FLOOR_FIREFOX=true npm exec nx -- test ngx-yeti --skip-nx-cache -- --project=browser && test -f tmp/floor-firefox/firefox/win64-stable_145.0/core/firefox.exe && npm exec nx -- typecheck ngx-yeti --skip-nx-cache && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && npx prettier --check packages/ngx-yeti/vitest.unit.config.mts tools/playwright/vitest-configs.test.mjs references/ci-local.md .claude/skills/ngx-yeti-testing/SKILL.md && files="$(rg -l -g '*.{ts,mts,cts,mjs,cjs,js}' -g '!**/node_modules/**' -g '!**/dist/**' "from '(webdriverio|@vitest/browser-webdriverio)'" apps packages tools)" && test -n "$files" && ! for f in $files; do rg -q cacheDir "$f" || ! rg -q -i '\b(firefox|chrome|chromium|msedge|edge)\b' "$f" || echo "no cacheDir: $f"; done | rg .; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-18 — created by planner (final-review patch, ship attempt 3, P001)
- 2026-10-18 — planner notes: `--skip-nx-cache` on the floor step keeps a cached replay (no download) from reaching the `test -f` check. The last check was dry-run by the planner at 8222987 and prints "no cacheDir: packages\ngx-yeti\vitest.unit.config.mts" (exit 1); apps/screen-reader-e2e/src/support/voiceover.ts passes it (Safari only). The firefox.exe entry in files is the gitignored download the Verify checks, not a tracked file.
