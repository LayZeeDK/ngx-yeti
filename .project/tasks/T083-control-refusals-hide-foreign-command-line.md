---
id: T083
title: Make both control scripts' PID-mismatch refusals name only the image name and start time of the process that now holds the recorded PID
wave: 17
deps: [T074, T080, T084]
status: done
agent: build_t083
base: 7d1b527dcccef404abda620e0c3e81cb95e7519b
worktree: null
task_branch: null
files:
  - .claude/skills/control-yeti-app/scripts/control.mjs
  - .claude/skills/control-yeti-app/scripts/control.test.mjs
  - .claude/skills/control-yeti-app/SKILL.md
  - .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs
  - .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs
  - .claude/skills/control-ngx-yeti-storybook/SKILL.md
---

# T083 — Make both control scripts' PID-mismatch refusals name only the image name and start time of the process that now holds the recorded PID

## Context

Not from `.project/review/PATCH-FINDINGS.md`. The orchestrator added this task from Lars's ruling of 2026-10-16, verbatim: "Approve, resolve in M002", which covers the residual items final-gap-4.md leaves for Lars. Lars can drop this task at the patch-plan approval without touching T078 to T082.

Source: security review round 7, finding 3 (Low, A09 / CWE-532, CWE-200), verbatim: "When the recorded PID now belongs to another process, for example after a reboot or a server that died without `down`, `down` refuses. In that refusal it prints the full command line of whatever process now holds the PID (`command mismatch (live: ${live.cmd})`, and `live: { start, commandLine }`). Win32_Process returns the full argv of the same user's processes, so a `--token=...`, a `curl -H "Authorization: Bearer ..."` or a database URL lands in the agent transcript, and the transcript leaves the machine." Its fix direction, verbatim: "Print only the image name (the first argv token) and the start time, or a hash of the command line." It cites control-ngx-yeti-storybook control.mjs:1024-1026 and control-yeti-app control.mjs:1148-1154 at d63e7e0.

Measured by the gap reviewer at d63e7e0 (final-gap-4.md, case A3 and A4, finding (5)): a foreign node process started with `--token=FAKE-SECRET-123` on its command line held the recorded PID; storybook's `down` printed `command mismatch (live: ...node.exe -e "..." -- --token=FAKE-SECRET-123)`, and yeti-app's `down` printed `live.commandLine` holding `--token=FAKE-SECRET-123`.

T084 lands first and edits both skills' control.mjs, tests and SKILL.md (the process trees move to proctree.mjs, whose describe() prints an escaped command line), then T080 edits control-yeti-app's; find each site by its code.

## Approach

- Each refusal that names the process now holding the recorded PID gives its image name (Win32_Process `Name`, or the executable's file name) and its start time, never its command line or arguments. The recorded values the script itself wrote (the launch's own `start` and command line) may still be shown.
- Keep each refusal's exit code (2), its error text up to the live details, and the state file kept on refusal; storybook's start-time and command checks still decide exactly as before. Comparisons still use the full command line; only the output changes.
- Look for any other output path of either script that prints a command line read from the process table for a process the launch did not start (`doctor`, `up`'s "already up"); give it the same treatment, and list each site in the Log.
- Tests: in each script's suite, a foreign process started by the test with the secret-looking argument `--token=FAKE-SECRET-123` holds the recorded PID of a stand-in state file; `down --json` (and the plain output) exits 2, names the image name and start time, and the secret string appears nowhere in stdout or stderr. Each test fails at d63e7e0 first (Log). Clean up every process the test starts, also on failure.
- SKILL.md: update any line that lists the refusal's fields or output.
- Typed scripts: keep `// @ts-check` and the JSDoc types; `npm exec nx -- typecheck @ngx-yeti/source` stays at 0 errors. Both skills stay runnable by /lars-verify (Lars, 2026-10-16: "Verification artifacts should be runnable by /lars-verify"): check-skill.mjs passes on each.
- Comments say only what the code cannot; no planning ids, dates or measurements in code.

## Interface contract

- None

## Intent coverage

- None

## Acceptance criteria

1. With a foreign process holding the recorded PID, each script's `down` exits 2, keeps the state file, and its output names the process's image name and start time and contains none of its arguments; a test in each suite proves it with `--token=FAKE-SECRET-123` and fails at d63e7e0 (Log).
2. No other output of either script prints a command line read from the process table for a process the launch did not start; the Log lists the sites checked.
3. Both control suites pass, check-skill.mjs passes on both skills, `npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache` passes, and Prettier passes on both skill folders.

## Verify

```bash
npm ci && npx playwright install chromium && rg -q -F 'FAKE-SECRET' .claude/skills/control-yeti-app/scripts/control.test.mjs && rg -q -F 'FAKE-SECRET' .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs && node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/scripts/check-skill.mjs .claude/skills/control-yeti-app --json && node C:/Users/LarsGyrupBrinkNielse/.claude/skills/lars-create-verification/scripts/check-skill.mjs .claude/skills/control-ngx-yeti-storybook --json && npm exec nx -- typecheck @ngx-yeti/source --skip-nx-cache && node --test .claude/skills/control-yeti-app/scripts/control.test.mjs && node --test .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs && npx prettier --check --ignore-unknown .claude/skills/control-yeti-app .claude/skills/control-ngx-yeti-storybook; status=$?; npx --no-install nx daemon --stop; exit $status
```

Heavy: yes

## Log

- 2026-10-16 — created by planner
- 2026-10-17 — deps updated by planner (build-repair of wave 17, Lars's ruling "Yes, wait for proctree and add T084"): T084 added, which edits both skills' control scripts, tests and SKILL.md before this task.
- 2026-10-17 — build_T083 (serial round, base 7d1b527): implementation. Each control.mjs gains `foreignProcess(record)`: `PID <p> (<image>, started <ISO start>)`, the image being the file name of the command line's program token (quoted path, or the first whitespace-separated word), escaped by `printable`; arguments are never printed. Comparisons are unchanged (`matches`/`stop` still use the full command line); exit codes, error texts and kept state file are unchanged.
- Output sites changed (both scripts): `down`'s root refusal `live` field (storybook `down()`: `live: describe(live)` -> `foreignProcess(live)`; yeti-app `down()`: same) and `down`'s port-holder line `holderLine` (`port <port> still held by PID ...`, a listener outside the recorded tree; was `describe(row)`).
- Sites checked and left: `recorded`/`refused[].process`/`notes`/`survived` print `describe` of records the script itself recorded (reason `reused` carries the recorded record, not the live one); `helper` and `survived` records and yeti-app `leftNote`/`unrecorded` are processes below the launch's recorded tree; `doctor`'s `process alive`/`process-alive` and `ports` lines, `up`'s `already up`, busy-port and ten-slot refusals, and `up`'s foreign-listener checks print PIDs only.
- Tests (one per suite, `down names only the image name and start time of a foreign process that holds the recorded PID`): a foreign `node -e ... -- --token=FAKE-SECRET-123` (spawned with `argv0: 'node'` so the secret sits inside describe's 120-character cut; cleaned up through its ChildProcess handle in `t.after`, registered before any assertion) holds the recorded root PID of a stand-in state file; `down --json` and plain `down` each exit 2, keep the state file, print `PID <p> (node, started <ISO>)`, and neither stdout nor stderr holds the secret or `setInterval`. Red at base 7d1b527 before the control.mjs change (both suites: `down --json printed the secret`, `"live": "PID ... (node -e \"setInterval(() => {}, 1 << 30)\" -- --token=FAKE-SECRET-123)"`); green after. Shown failing at 7d1b527 rather than d63e7e0: the test uses the proctree state format that T084 introduced, and d63e7e0 printed the same raw command line (final-gap-4.md A3/A4).
- SKILL.md (both): the root-mismatch refusal now documents `recorded` and `live` (image name and start time only); the port-holder text says `PID <p> (<image>, started <ISO time>)`; the test inventory names the new test.
- Verify (as written, through the heavy lock, in the primary checkout): exit 0. npm ci ok; playwright install ok; both rg checks ok; check-skill.mjs on both skills all checks `ok: true`; typecheck @ngx-yeti/source --skip-nx-cache passed; control-yeti-app suite 55/55 pass, 0 fail; control-ngx-yeti-storybook suite 41/41 pass, 0 fail; Prettier on both skill folders clean; daemon stopped by Verify's own last step.
- Rule 13: `npx prettier --check .` clean; `nx affected -t lint typecheck test test-storybook --base=HEAD` (affected: @ngx-yeti/source only) ran typecheck and test, both successful. No test or instance process left running (process table checked for FAKE-SECRET and control.mjs).
- 2026-10-17 — build_T083, review r9 fixes (tmp/afk-m002/script-review-r9-triage.md, "Fix in T083" items 1-4):
  - Item 1: control-yeti-app `leftNote` (up's `survivors` error text) and `down`'s `named` note for `unrecorded` processes now print `foreignProcess(record)` instead of `describe(record)`. Test: the yeti-app secret test also writes `unrecorded: [live]` to the state file and asserts `left PID <p> (node, started <ISO>) alone: a failed up found it running`. Red before the change (`down --json printed the secret`, from the note); green after. SKILL.md Launch text and test list updated.
  - Item 2: the port-holder line now has a test that catches a fallback to describe(): storybook's `down names a listener outside the tree ...` now holds the port from a child started with `--token=FAKE-SECRET-123` (argv0 node) and asserts the exact `still held by PID <p> (node, started <ISO>), not the recorded tree` text and no secret; yeti-app gains the stand-in test `down names a listener outside the tree only by its image name and start time` (the launch-based test's `\(.*\)` match is left as it is). Red with `holderLine` temporarily pointed back to `describe(row)` in both scripts (both: `down printed the secret: ... (node -e require('node:net').createServer().listen(<port>) -- --token=FAKE-SECRET-123)`); green after restoring `foreignProcess(row)`. Storybook SKILL.md test list updated.
  - Item 3: in all four tests `t.after` is registered right after the spawns, before `unref()`; the registry and evidence paths are created before the spawn.
  - Item 4: accepted, not coded. Win32_Process `Name` is not in proctree.mjs's fixed query (a byte copy this task may not edit), so an unquoted program path with spaces still gives its first word (for example `Program`) as the image name; it never prints an argument.
  - Verify (as written, through the heavy lock): exit 0. check-skill 39 checks ok, none failed; typecheck passed; control-yeti-app suite 56/56 pass; control-ngx-yeti-storybook suite 41/41 pass; Prettier on both folders clean; daemon stopped by Verify's last step. `npx prettier --check .` clean.
- 2026-10-17 — orchestrator Verify (sidecar gsd-path-verify/task-t083-verify): pass, exit 0; output tail:
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
