# Patch Findings

Reviewed HEAD: f8aa2eacac8aabf1099271b52466cc8605b65aeb
State: ship/blocked

## Findings

### P001 — project Verify fails: the registry route check times out in Firefox development

- **Source**: `.project/review/final-gap-1.md`
- **Locator**: Risk: project Verify
- **Evidence**: Project Verify failed at the reviewed commit.
- **Fix direction**: Resolve the recorded command failure before shipping.

### P002 — control-yeti-app `down` locks out on a dead recorded root whose child holds the port

- **Source**: `.project/review/final-gap-2.md`
- **Locator**: Risk: control-yeti-app and control-ngx-yeti-storybook `down` on a dead recorded root PID whose descendant still holds the port (teardown lifecycle changed across waves 1, 2, 4, 9, 11 and 12)
- **Evidence**: control-ngx-yeti-storybook meets all three expectations: on a dead root it closes the session, names the child (pid 25352) and the port listener, removes the state file, and exits 1; a second down exits 2; `up` refuses only while the named process holds the port. control-yeti-app does not: on a dead root it never looks at the dead root's descendants or the port's listener. It exits 1 with `run down again`, keeps state.json with `survivors: []`, and repeats this on every later down. `up` stays refused (`already up ... run down first`). The SKILL.md advice (`Run down again`, SKILL.md:163) cannot work. The output never names the process to stop, so the caller has to find the listener by hand and stop it, or delete state.json. This breaks the 2026-10-15 user ruling ("down: Use Storybook's behaviour, fixed before shipping M002") and the INTENT.md:79 "proven end to end" scope for control-yeti-app. control.test.mjs has no dead-root, port-held case for this script.
- **Fix direction**: control-yeti-app only (.claude/skills/control-yeti-app/scripts/control.mjs `down`, :1012-1082). When `live` is undefined, do what Storybook's dead-PID path does (control-ngx-yeti-storybook control.mjs:975-990, 1085-1187). Collect the dead root's tree members, leaving out processes that started before the recorded `start`. Wait without stopping them. Query the port's listeners. Remove state.json even on exit 1, and end the message by naming `pid <survivors and listeners>` to stop by hand. Keep the kept-state, `run down again` path only for a live root. Update SKILL.md:128-131, :158-164 and the `down` row at :188 to match. Add a control.test.mjs case: a dead root whose child keeps the port, so down exits 1 naming the child and the port and removes state.json, and a second down exits 2.

### P003 — the static Storybook renders inline dark-scheme wrappers in light colours

- **Source**: `.project/review/final-gap-3.md`
- **Locator**: Risk: the static Storybook build lowers `light-dark()`, so inline `color-scheme: dark` story wrappers render light colours in ngx-yeti-e2e's dark-scheme checks and on the Storybook stories surface
- **Evidence**: on the Storybook stories surface (the static build at PLAN.md's Entry), no inline `color-scheme` wrapper keeps its own scheme. Both wrappers of a story always render the page media's scheme: measured light `oklch(0.99 0.02 250)` / `oklch(0.15 0.02 250)` inside "dark" wrappers under default media. The cause is Vite's default `build.cssTarget` (`baseline-widely-available`: chrome111, firefox114, safari16.4). Vite passes it to the lightningcss minify in `build`, and lightningcss lowers `light-dark()` into `prefers-color-scheme`-keyed `--lightningcss-*` variables that an inline `color-scheme` cannot switch. The dev transform keeps native `light-dark()`, so the play functions and `nx storybook` show the correct dark colours. In the static build, ngx-yeti-e2e's dark-scheme contrast checks at button.spec.ts:244, layer.spec.ts:52, overlay.spec.ts:213, and spinner.spec.ts:287/:320 measure, record, and pass on light colours. Their titles and annotations still claim the dark scheme. So the e2e layer gives no evidence for the dark halves of button.md:315, spinner.md:290/:292, overlay.md:291, and ledger A11Y-10b.
- **Fix direction**: in packages/ngx-yeti/.storybook/main.ts `viteFinal`, set `build.cssTarget` to targets derived from .browserslistrc in the returned `mergeConfig`. Take them from the installed `browserslist` (or lightningcss `browserslistToTargets`), converted to Vite's esbuild-style list, e.g. `chrome141, edge141, firefox145, safari26.2, ios26.2`. lightningcss then keeps `light-dark()` native, and no story changes. Do not set `css.lightningcss.targets`: Vite's `minifyCSS` overrides it (node.js:30543). Proof:
