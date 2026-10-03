# 93. Decide: the browser provider and the floor engines for testing

Type: grilling
Status: resolved
Blocked by: 27
Labels: wayfinder:grilling
Map: ../map.md

## Question

[ADR 0014](../adr/0014-testing-stack-for-yeti.md) fixes the four test layers, but leaves two choices to [Research: testing at the browser floor](27-research-testing-at-the-browser-floor.md) and the decision that follows it: layer 2's Vitest browser provider (point 2), and where the floor browsers of [ADR 0002](../adr/0002-browser-target-baseline-2025.md) (Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2) are tested (point 7). Which provider, which engines, and in which layer?

## Answer

Resolved 2026-10-03 by the orchestrator (Claude Opus 5.5) under the user's full-AFK ruling (map, Standing rulings). This is the orchestrator's decision, not the user's. Its evidence is ticket 27's measurements. It is a trap-quadrant decision (HIGH impact: every spec's test layers depend on it; MEDIUM confidence: Safari 26.2 cannot be run on any available runner), so its options are recorded below so that an implementer can overrule it.

**Decision.**
1. **Layer 2 uses `@vitest/browser-playwright`** with the Playwright release the workspace already installs, in Chromium, Firefox, and WebKit at their current versions. This is the everyday run, and the one every spec's layer-2 tests target.
2. **Floor engines run in a separate CI job, not on every change.** It reruns layers 2 and 4 at the floor where an engine can be obtained:
   - Chromium 141 through a pinned Playwright 1.56.1, installed as an npm alias beside the current one. Ticket 27 measured four Playwright versions coexisting in one workspace, and 1.56.x bundling Chromium 141.
   - Firefox 145 through `@vitest/browser-webdriverio` with `browserVersion: 'stable_145.0'`, for layer 2 only. Ticket 27 measured it passing, and Playwright cannot drive stock Firefox 145 reliably.
   - Edge 141 is covered by Chromium 141, the same engine. WebdriverIO ignored the Edge pin, so Edge is not pinned separately.
   - Safari 26.2 is not run, because no GitHub macOS image carries it (26.5 to 27.0) and no grid lists it. The current-WebKit run and the static check below stand in for it.
3. **Every spec's CSS and script are held to the floor statically:** Lightning CSS `targets` and a Baseline 2025 lint on the package's own CSS and TypeScript, the way Tailwind, Primer, and Carbon hold theirs (ticket 27).
4. **The floor job runs on release branches and weekly.** A failure blocks a release, not a pull request.

**Options considered.**
- **A (chosen): current engines every run, plus a floor job and static checks.** Approved because each available floor engine is exercised with a measured method, the everyday run stays fast, and the gap ticket 27 found in other projects is closed as far as runners allow.
- **B: WebdriverIO as layer 2's only provider.** Dismissed: it has no parallel sessions, no traces, and no WebKit, and it is community-maintained from Vitest 5 (ticket 27, measured and read).
- **C: Playwright 1.56.1 as the only Playwright.** Dismissed: it pins every run to old engines and still cannot run Firefox 145 or Safari 26.2.
- **D: a cloud grid (BrowserStack or Sauce Labs open-source plans) for every floor engine.** Dismissed for now: neither lists Safari 26.2, and it adds an account and an outward-facing service the user has not set up. It is the upgrade path if a held macOS 26.2 runner never exists.
- **E: static checks only, as most projects do.** Dismissed: they cannot catch a behaviour difference, such as the invoker-command gap the dialog probe found below the floor (ticket 27).

**To overrule.** An implementer who picks D adds the grid capabilities to the floor job and keeps everything else. One who picks E removes the floor job, and states in each spec's Testing Decisions that the floor is held statically only.

ADR 0014 gets a dated note pointing here. Every spec's Testing Decisions name "layer 2" and "layer 4" without a provider, so no spec changes.

**Note (2026-10-03, audit 0004 M1 and L15).** The sentence above missed one change: 48 specs, building-blocks Part 4, the setup spec, and the map's gist of ticket 27 still said testing at the floor was not decided. Each now points here ("Floor engines: ticket 93"), and the Out of Scope bullets that listed it are removed.
