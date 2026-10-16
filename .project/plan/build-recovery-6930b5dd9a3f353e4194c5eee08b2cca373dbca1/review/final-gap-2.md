# Gap Review — 2: control-yeti-app and control-ngx-yeti-storybook `down` on a dead recorded root PID whose descendant still holds the port (teardown lifecycle changed across waves 1, 2, 4, 9, 11 and 12)

Reviewed HEAD: f8aa2eacac8aabf1099271b52466cc8605b65aeb
Gap verdict: blocked
Risk: control-yeti-app and control-ngx-yeti-storybook `down` on a dead recorded root PID whose descendant still holds the port (teardown lifecycle changed across waves 1, 2, 4, 9, 11 and 12)
Waves checked: 1, 2, 4, 9, 11, 12

## Checked evidence

Setup, in the verify sidecar (a linked worktree, so both scripts use derived ports; `npm ci` run first so `nx daemon --stop` resolves; the real scripts ran in place, no copies): `tmp/gap2/setup.mjs` spawns `tmp/gap2/parent.mjs`, which starts a detached `tmp/gap2/child.mjs` listening on 127.0.0.1:<derived port> and exits after 6 s. While the parent ran, setup read its start time and command line from `Get-CimInstance Win32_Process` (the format each `up` records) and wrote the state file with the fields each `up` writes (control-yeti-app control.mjs:679-692; control-ngx-yeti-storybook control.mjs:752-764).

- **Check**: `node tmp/gap2/setup.mjs yeti`, then `netstat -ano | Select-String ':4746'` and `Get-CimInstance Win32_Process` for the child
- **Observed**: recorded root pid 908 gone; child pid 13892, ParentProcessId 908, `TCP 127.0.0.1:4746 LISTENING 13892`; `tmp/control-yeti-app/state.json` holds pid 908, port 4746, no `survivors`.
- **Reference**: .claude/skills/control-yeti-app/scripts/control.mjs:679

- **Check**: `node .claude/skills/control-yeti-app/scripts/control.mjs down --json` (first)
- **Observed**: exit 1 after 2 m 50 s; `"error": "teardown incomplete; state kept at ...\\tmp\\control-yeti-app\\state.json; run down again"`, `"stopped": []`, `"survivors": []`, `"portFree": false`, both sessions `not-open`, `daemon.stopped: true`. state.json kept, rewritten with `"survivors": []`. Pid 13892 not stopped and not named anywhere in the output.
- **Reference**: .claude/skills/control-yeti-app/scripts/control.mjs:1016-1033 (dead-root branch stops only recorded survivors), :1068-1082 (keeps state, says run down again)

- **Check**: `node .claude/skills/control-yeti-app/scripts/control.mjs down --json` (second), then `node .claude/skills/control-yeti-app/scripts/control.mjs up --mode=ssr --configuration=production --json`
- **Observed**: second down identical: exit 1, `stopped: []`, `survivors: []`, `portFree: false`, same `run down again` message, state kept. `up` exit 2: `"already up (pid 908, port 4746); run down first"`.
- **Reference**: .claude/skills/control-yeti-app/scripts/control.mjs:611-616; .claude/skills/control-yeti-app/SKILL.md:158-164

- **Check**: manual recovery: `Stop-Process -Id 13892 -Force`, then `node .claude/skills/control-yeti-app/scripts/control.mjs down --json`
- **Observed**: down exit 0, `portFree: true`, state.json removed. Recovery needs the caller to find the listener on the port themselves (`Get-NetTCPConnection -LocalPort 4746`) and stop it, or delete state.json; the script output never names pid 13892.
- **Reference**: .claude/skills/control-yeti-app/scripts/control.mjs:1084

- **Check**: `node tmp/gap2/setup.mjs storybook`, then `node .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs down --json` (first)
- **Observed**: root pid 38536 gone, child 25352 on 4513. down exit 1 after 27 s: `"message": "teardown incomplete: pid 25352 still running; port 4513 still answers (listeners [25352])"`, `stoppedPids: []`, `survivors: [25352]`, `portFree: false`, session `not-open`, `daemon.stopped: true`. `tmp/control-ngx-yeti-storybook/state-static.json` removed (only `gap2-standin/` left).
- **Reference**: .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs:975-990, :1160-1187

- **Check**: `node .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs down --json` (second), then `node .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs up --json`
- **Observed**: second down exit 2, `"no state file at ...state-static.json; nothing to stop"`. `up` exit 2 before launching anything: `"refused: port 4513 is in use (listeners [25352])"`, `owner: [25352]`. Recovery: stop pid 25352, which both the down and the up output name; `up` is then no longer blocked by state or port (not launched, to avoid a Storybook build).
- **Reference**: .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs:694-720; .claude/skills/control-ngx-yeti-storybook/SKILL.md:102

- **Check**: cleanup: `Stop-Process -Id 25352 -Force`; `netstat -ano | Select-String ':4513 |:4746 '`; `Get-CimInstance Win32_Process` filtered on `gap2`
- **Observed**: no LISTENING entry on either port (TIME_WAIT only); no stand-in process left.
- **Reference**: none

- **Check**: `rg -n "Storybook's behaviour" D:/projects/github/LayZeeDK/ngx-yeti/.project/STATE.md` and INTENT.md:79 read
- **Observed**: STATE.md:172 `user ruling 2026-10-15, verbatim: "down: Use Storybook's behaviour, fixed before shipping M002" (control-yeti-app down dead-root lockout)`. INTENT.md:79 requires both control skills "proven end to end".
- **Reference**: .project/STATE.md:172; .project/intent/INTENT.md:79

## Finding

- **Found**: control-ngx-yeti-storybook meets all three expectations: on a dead root it closes the session, names the child (pid 25352) and the port listener, removes the state file, and exits 1; a second down exits 2; `up` refuses only while the named process holds the port. control-yeti-app does not: on a dead root it never looks at the dead root's descendants or the port's listener. It exits 1 with `run down again`, keeps state.json with `survivors: []`, and repeats this on every later down. `up` stays refused (`already up ... run down first`). The SKILL.md advice (`Run down again`, SKILL.md:163) cannot work. The output never names the process to stop, so the caller has to find the listener by hand and stop it, or delete state.json. This breaks the 2026-10-15 user ruling ("down: Use Storybook's behaviour, fixed before shipping M002") and the INTENT.md:79 "proven end to end" scope for control-yeti-app. control.test.mjs has no dead-root, port-held case for this script.
- **Fix direction**: control-yeti-app only (.claude/skills/control-yeti-app/scripts/control.mjs `down`, :1012-1082). When `live` is undefined, do what Storybook's dead-PID path does (control-ngx-yeti-storybook control.mjs:975-990, 1085-1187). Collect the dead root's tree members, leaving out processes that started before the recorded `start`. Wait without stopping them. Query the port's listeners. Remove state.json even on exit 1, and end the message by naming `pid <survivors and listeners>` to stop by hand. Keep the kept-state, `run down again` path only for a live root. Update SKILL.md:128-131, :158-164 and the `down` row at :188 to match. Add a control.test.mjs case: a dead root whose child keeps the port, so down exits 1 naming the child and the port and removes state.json, and a second down exits 2.
