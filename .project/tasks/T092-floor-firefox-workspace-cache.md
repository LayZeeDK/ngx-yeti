---
id: T092
title: Keep the firefox-145 floor's Firefox and geckodriver download in the workspace's gitignored tmp/floor-firefox instead of the OS temp folder
wave: 22
deps: [T061, T086, T090]
status: done
agent: build_T092
base: b04cc90df9485f6250ec554e312e0da027daac8c
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
- 2026-10-18 — coder (build_T092): red first. Added the test "the unit config keeps the Firefox floor download in the workspace, outside packages/" to tools/playwright/vitest-configs.test.mjs (imports vitest.unit.config.mts?floor-firefox with FLOOR_FIREFOX=true; asserts browserVersion stable_145.0, cacheDir a string, absolute, inside the workspace root, first segment not packages, instances [{ browser: 'firefox' }]). On the unchanged config `node --test tools/playwright/vitest-configs.test.mjs`: tests 7, pass 6, fail 1, the new case failing at `assert.equal(typeof cacheDir, 'string')` (actual 'undefined').
- 2026-10-18 — coder: implementation. packages/ngx-yeti/vitest.unit.config.mts FLOOR_FIREFOX branch now passes `capabilities: { browserVersion: 'stable_145.0', 'wdio:geckodriverOptions': { cacheDir: path.join(import.meta.dirname, '../../tmp/floor-firefox') } }`; ticket 27 comment kept, one comment added on why the folder is out of the OS temp folder. SAFARI, FLOOR_WEBKIT, Chromium-floor and default branches unchanged. Confirmed in node_modules/@wdio/utils/build/node.js:219-227 that getCacheDir reads `caps['wdio:geckodriverOptions'].cacheDir` first and that one directory feeds setupPuppeteerBrowser (:433) and startGeckodriver (:445). Docs: references/ci-local.md firefox-145 row and .claude/skills/ngx-yeti-testing/SKILL.md FLOOR_FIREFOX row now name `tmp/floor-firefox` at the workspace root as the folder WebdriverIO downloads Firefox 145 and geckodriver into (prettier re-padded the skill table). No change to nx.json, ci.yml, floor.yml or package.json (git diff empty for them); no new dependency.
- 2026-10-18 — coder: Verify run exactly as written through the heavy lock (acquired after 0s): exit 0. node --test vitest-configs: tests 7, pass 7, fail 0. FLOOR_FIREFOX floor step (--skip-nx-cache): Test Files 27 passed (27), Tests 507 passed (507). tmp/floor-firefox/firefox/win64-stable_145.0/core/firefox.exe exists (695424 bytes) beside tmp/floor-firefox/geckodriver-0.37.1.exe. typecheck ngx-yeti and typecheck @ngx-yeti/source passed; prettier --check on the four files passed; the WebdriverIO sweep check printed nothing. Negative control untouched: C:\Users\LARSGY~1\AppData\Local\Temp\firefox\win64-stable_145.0 still holds only postSigningData (20 bytes, dated Oct 13), so the pass did not come from that folder.
- 2026-10-18 — coder: WebdriverIO site sweep repeated (rg for `from 'webdriverio'|'@vitest/browser-webdriverio'`, `remote(`, `webdriverio(` in apps, packages, tools): packages/ngx-yeti/vitest.unit.config.mts:27 FLOOR_FIREFOX provider — now names cacheDir; packages/ngx-yeti/vitest.unit.config.mts:42 SAFARI provider — safaridriver, no cache directory read; apps/screen-reader-e2e/src/support/voiceover.ts:52 `remote({ capabilities: { browserName: 'safari' } })` — Safari only, passes the check without cacheDir. No other site.
- 2026-10-18 — coder: Nx inputs. `nx show project ngx-yeti --json` and `nx show project @ngx-yeti/source --json` after the download: ngx-yeti targets use default/production ({projectRoot}/**/* = packages/ngx-yeti), browserEngines, browserFloor, storybook and named workspace files; none names tmp. @ngx-yeti/source:typecheck names `{workspaceRoot}/**/*.{mjs,cjs,js}` and its `default` covers the root, but Nx's file map excludes gitignored paths: .nx/workspace-data/file-map.json holds 0 paths under `tmp/` and 0 under tmp/floor-firefox (positive control: tools/playwright/engines.mjs present once). `git check-ignore -v` attributes the download to .gitignore:5 `tmp`; tsconfig.scripts.json:23 excludes `**/tmp`. So no target's inputs pick up the downloaded files.
- 2026-10-18 — coder: rule 13 checks. `npx prettier --check .`: all matched files use Prettier code style. `npm exec nx -- affected -t lint typecheck test test-storybook --base=HEAD` through the heavy lock: exit 0, 26 tasks successful across 9 projects (ngx-yeti test, test-storybook, lint, typecheck; @ngx-yeti/source test and typecheck; lint/typecheck of every affected app and e2e project), 5 from cache. Git index untouched.
- 2026-10-18 — coder: thermos triage fixes (orchestrator message). (1) The new test is now "the unit config downloads the Firefox floor into tmp/floor-firefox" and makes one exact assertion, `assert.deepEqual(browser.provider.options.capabilities, { browserVersion: 'stable_145.0', 'wdio:geckodriverOptions': { cacheDir: fileURLToPath(new URL('tmp/floor-firefox', root)) } })`, plus the instances assertion. The `isAbsolute, relative, sep` imports, the optional chaining and the typeof guard are gone. Red run with the config temporarily replaced by `git show HEAD:packages/ngx-yeti/vitest.unit.config.mts`: tests 7, pass 6, fail 1, the failing case being "the unit config downloads the Firefox floor into tmp/floor-firefox" (actual `{ browserVersion: 'stable_145.0' }`, expected adds `'wdio:geckodriverOptions'.cacheDir` = <worktree>\tmp\floor-firefox). With the change restored: tests 7, pass 7, fail 0. (2) The cacheDir comment now sits on the `'wdio:geckodriverOptions'` property and names @puppeteer/browsers as the download step that does not reinstall over a browser folder without its executable; the ticket 27 line is kept above `return`. (3) references/ci-local.md firefox-145 row adds: an interrupted download can leave tmp/floor-firefox without its executable; deleting tmp/floor-firefox makes the next run download again.
- 2026-10-18 — coder: Verify rerun exactly as written through the heavy lock (acquired after 0s): VERIFY EXIT 0. vitest-configs: tests 7, pass 7. Floor step: Test Files 27 passed (27), Tests 507 passed (507). firefox.exe exists; both typechecks, the four-file prettier check and the sweep check passed. Rule 13: `npx prettier --check .` exit 0. `nx affected -t lint typecheck test test-storybook --base=HEAD` through the lock was killed by Claude Code's low-memory reaper (the host ran critically low on memory while the session sat idle; this is not a task failure) after 24 of its 26 tasks had passed, ngx-yeti test-storybook, test, lint and typecheck among them. The two that did not finish are @ngx-yeti/source:typecheck (it passed in the Verify run above, --skip-nx-cache) and @ngx-yeti/source:test (not rerun after the fixes; it passed in the first affected run before the fixes). The reaper notice says not to restart the run unasked, so it was not restarted. The Nx daemon it left behind was stopped, and the holder and child processes are gone (a waiter reclaims the stale lock entry). Git index untouched.
- NEEDS-ORCHESTRATOR: Should @ngx-yeti/source:test (the one rule 13 task unproven after the fixes) be rerun before landing? Readings: rerun `npm exec nx -- test @ngx-yeti/source` (or the full affected) once memory allows / accept the pre-fix pass plus the post-fix `node --test tools/playwright/vitest-configs.test.mjs` pass, which is the file in that target the fixes changed.
- Orchestrator answer: land now; the authoritative task Verify reruns in the finish sidecar, and the orchestrator runs the rule 13 per-commit check (prettier plus nx affected -t lint typecheck test test-storybook, @ngx-yeti/source:test included) on the landed commit before the wave review — AGENTS.md Commits (per-commit check before push), as done for T091 at 3ef902d.
- 2026-10-18 — orchestrator Verify (isolate gsd-path-task/T092): pass, exit 0; output tail:
  ```
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/table
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/timeline
  - Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Compiling with Angular sources in partial compilation mode.
  [32m✔[39m Generating FESM and DTS bundles
  [32m✔[39m Built ngx-yeti/visually-hidden
  npm notice run @ngx-yeti/source@0.0.0 npx
  npm notice run nx typecheck ngx-yeti --skip-nx-cache
  npm notice run @ngx-yeti/source@0.0.0 npx
  npm notice run nx typecheck @ngx-yeti/source --skip-nx-cache
  npm notice run @ngx-yeti/source@0.0.0 npx
  npm notice run prettier --check packages/ngx-yeti/vitest.unit.config.mts tools/playwright/vitest-configs.test.mjs references/ci-local.md .claude/skills/ngx-yeti-testing/SKILL.md
  npm notice run @ngx-yeti/source@0.0.0 npx
  npm notice run nx daemon --stop
  ```
