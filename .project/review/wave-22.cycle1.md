# Review — wave 22, cycle 1

Wave verdict: pass
Cycle: 1
Depth: full
Tasks reviewed: 2

## T092 — Keep the firefox-145 floor's Firefox and geckodriver download in the workspace's gitignored tmp/floor-firefox instead of the OS temp folder: pass

- ✅ With FLOOR_FIREFOX=true, the browser project of packages/ngx-yeti/vitest.unit.config.mts uses a webdriverio provider whose `capabilities['wdio:geckodriverOptions'].cacheDir` is the absolute path of tmp/floor-firefox at the workspace root, derived from the config file's location; `browserVersion` stays `stable_145.0`, and the SAFARI, FLOOR_WEBKIT, Chromium-floor and default branches are unchanged. — diff b75d41e^..b75d41e packages/ngx-yeti/vitest.unit.config.mts:25-34 adds `cacheDir: path.join(import.meta.dirname, '../../tmp/floor-firefox')` beside `browserVersion: 'stable_145.0'`; the only hunk in the file is inside the FLOOR_FIREFOX branch, so the other branches are untouched.
- ✅ tools/playwright/vitest-configs.test.mjs has a test that fails on the unchanged config and passes with the change, asserting that cacheDir is absolute, inside the workspace root, and outside packages/; the Log records the red run with the failing case name. `node --test tools/playwright/vitest-configs.test.mjs` passes. — test "the unit config downloads the Firefox floor into tmp/floor-firefox" (vitest-configs.test.mjs:132-150) deepEquals cacheDir to `fileURLToPath(new URL('tmp/floor-firefox', root))`, an exact absolute in-workspace path outside packages/, which implies all three properties (orchestrator-directed exact form, ambiguity rule applied). Log records red runs (initial and after the thermos fix) and the orchestrator Verify rerun: tests 7, pass 7, exit 0.
- ✅ In a fresh sidecar, `FLOOR_FIREFOX=true npm exec nx -- test ngx-yeti --skip-nx-cache -- --project=browser` downloads Firefox 145 into tmp/floor-firefox and passes, and `tmp/floor-firefox/firefox/win64-stable_145.0/core/firefox.exe` exists afterwards, while the emptied OS temp folder is left untouched. — orchestrator isolated Verify (isolate gsd-path-task/T092) exit 0; coder Log records Test Files 27 passed, Tests 507 passed, firefox.exe present (695424 bytes), negative-control OS temp folder untouched.
- ✅ The Log records that tmp/floor-firefox is outside every input of the ngx-yeti and `@ngx-yeti/source` targets, from `nx show project --json`, and repeats the WebdriverIO site sweep with the result per site. nx.json, ci.yml, floor.yml and package.json are unchanged. — Log "Nx inputs" and "WebdriverIO site sweep" entries present with per-site results; `git show --stat b75d41e` lists only the five declared paths, none of nx.json, ci.yml, floor.yml, package.json. `tmp` is gitignored (.gitignore:5), so the Nx file map excludes it.
- ✅ references/ci-local.md's firefox-145 row and the testing skill's FLOOR_FIREFOX row name tmp/floor-firefox as the folder WebdriverIO downloads Firefox 145 and geckodriver into. — references/ci-local.md:53 and .claude/skills/ngx-yeti-testing/SKILL.md:118 both read "downloads ... Firefox 145 and geckodriver into `tmp/floor-firefox` at the workspace root".
- ✅ Every file in apps/, packages/ and tools/ that imports `webdriverio` or `@vitest/browser-webdriverio` and names Firefox, Chrome, Chromium or Edge also names `cacheDir`; `npm exec nx -- typecheck ngx-yeti`, `npm exec nx -- typecheck @ngx-yeti/source` and `npx prettier --check` on the four changed files pass. — re-ran `rg -l webdriverio apps packages tools`: voiceover.ts (Safari only), vitest.unit.config.mts (names cacheDir), vitest-configs.test.mjs (names cacheDir). Orchestrator Verify output shows both typechecks and the four-file prettier check ran, exit 0.

Warnings (non-blocking):
- AC2 lists three separate properties; the test proves them through one exact equality. Accepted reading; tighten wording in future plans.
- Nx cache: vitest.unit.config.mts is covered by ngx-yeti's `{projectRoot}/**/*` and @ngx-yeti/source:test's `{apps,packages}/**/vitest*.config.*` input; vitest-configs.test.mjs by `tools/playwright/**/*`. The download folder is a tool cache, not a target output. No inputs/outputs gap.

Contract violations (blocking):
- none — task file diff changes only status/agent/base plus appended Log.

## T093 — Make pack-check find the packed tarball under both npm 11 and npm 12: pass

- ✅ `npm exec nx -- run ngx-yeti:pack-check --skip-nx-cache` passes on this machine under npm 12, and the Log records `npm --version` and the passing output. — Log Verify rerun: `npm --version` 12.2.0, pack-check succeeded printing ngx-yeti-0.220200.0-yeti.7.0.0-alpha.0.gf52d1e8.tgz; orchestrator isolated Verify (gsd-path-task/T093) exit 0.
- ✅ tools/package/pack-tarball.test.mjs passes and covers the npm 12 object shape (or single-tarball folder), the npm 11 array shape, and the no-tarball and several-tarball errors, each error with a clear message; the Log records the red run of the npm 12 case against the old parse expression. — pack-tarball.test.mjs:9-31 covers npm 12 object, npm 11 array, no-tarball (`[]`, `{}` -> []), several tarballs (both names); pack-check.mjs:98-104 turns zero or several into one failure "npm pack produced exactly one tarball" with the stdout. Under the orchestrator's triage reading (module returns names, check() owns the message) this is satisfied; malformed-output errors are asserted by message (test.mjs:34-54). Log records red run: npm 12 case "TypeError: object is not iterable". Tests 7 pass 7 in recorded Verify.
- ✅ pack-check.mjs takes the tarball from the new exported function and no longer destructures `JSON.parse(pack.stdout)` as an array. — pack-check.mjs:19 imports `packedTarballNames`; line 98 calls it; the `JSON.parse(pack.stdout)` destructure is removed.
- ✅ The root `@ngx-yeti/source:test` command runs tools/package/pack-tarball.test.mjs, its inputs hash tools/package/pack-tarball.mjs and tools/package/pack-tarball.test.mjs, and tools/nx/browser-floor-inputs.test.mjs asserts both; `npm exec nx -- run @ngx-yeti/source:test --skip-nx-cache` passes. — project.json:25 command and :40-41 inputs; browser-floor-inputs.test.mjs:171-172 adds both paths to the hashed-file loop; recorded Verify: root tests 96/96, cache-inputs 35/35.
- ✅ `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` passes, and prettier passes on every changed file. — orchestrator Verify output shows typecheck and the five-file prettier check, exit 0.
- ✅ No new dependency, no change to package contents, and no Nx target or input change other than criterion 4's. — stat lists no package.json/lock change; product files are tools only; the only project.json hunks are the test command and two inputs. ngx-yeti:pack-check inputs already include `{workspaceRoot}/tools/package/**/*` (packages/ngx-yeti/project.json:117-121), so pack-tarball.mjs is hashed there too; no Nx inputs gap.

Warnings (non-blocking):
- AC2 "each error with a clear message" is read per the orchestrator triage: the no-tarball and several-tarball messages live in pack-check.mjs check(), which the unit test does not exercise directly. Tighten the criterion wording.

Contract violations (blocking):
- none — task file diff changes only status/agent/base plus appended Log.

## Summary for orchestrator

- blocked findings: none
- repeat offenders: none
- warnings worth a human eye: AC2 readings on both tasks (exact-equality form for T092, check()-owned messages for T093). No Nx cache inputs/outputs gap in either task.
