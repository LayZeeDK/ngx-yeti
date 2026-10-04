# Review — wave 4, cycle 1

Wave verdict: pass
Cycle: 1
Depth: full
Tasks reviewed: 1

## T015 — Fix wave 2 cycle 1 review findings in T007, T010, T011: pass

- ✅ On the Fixture app, the prerendered `/card`, `/lift`, and `/setup` routes and the server-rendered `/server/card`, `/server/lift`, and `/server/setup` routes pass `yeti-app-e2e` with JavaScript on and off: styled from the server's head links, axe-clean on the `wcagTags` rule set, no `NG05xx`, `componentsSkippedHydration === 0`, and 0 `<link>` or `<style>` mutations after `DOMContentLoaded` (the loader adopts the server's links). Each item link carries `data-ngx-yeti-styles`, `data-ngx-yeti-app`, and `data-beasties-skip`. A `card` with `lift` inside `hydrate never` keeps both links after every live `lift` has left (ADR 0045). A client-only `@defer` with `preload` shows 0 unstyled frames. Leaving the card route removes the card link and returning re-inserts it. With JavaScript off, a click near a card's corner navigates to its stretched link and a hovered `yetiLift` card lifts. The setup spec's other layer-4 cases that need no later item pass (setup.md:335-346: `hydrate on interaction`, leave, boundaries, the dev-server run, the strict-CSP nonce route, the 66-file assets glob, and the A4 frame count recorded per engine). The JavaScript-off, axe, and hydration assertions, the `webServer` readiness URL, the build-output prerender assertions, and the axe negative controls that targeted the `highlight` placeholder now target `card`; the `replay` fixture and its test stay. Walkthrough: with JavaScript disabled, `/sub/card` shows a styled card and a click near its corner navigates. — landing b433b0d8 (base 7ea86a7d) changes only apps/yeti-app-e2e/src/setup-serving.spec.ts plus the task file; the two failing expectations named in finding sc2 are repaired (:92 now `['card', 'lift']`; :131-137 now asserts at least one item link and none carry `nonce`), so the nonce assertions still fail if a nonce is missing or leaks. Orchestrator Verify in T015 Log: all three blocks exit 0. Repair-evidence receipt repair-evidence-T015.json links this criterion; wave-2.cycle2.md judged the repaired product pass; integrated uncached run log integrated-w3.log ends 71 passed with no failures.
- ✅ `apps/yeti-app-e2e/src/setup-serving.spec.ts` passes in the development and production configurations. — orchestrator Verify block 2 (development and `FIXTURE_CONFIGURATION=production` runs of setup-serving.spec.ts) exit 0; coder Log records 4 passed and 3 passed + 1 skipped. Diff matches the t010_ac4 fix direction; card-fixture.ts untouched.

Warnings (non-blocking):
- none

Contract violations (blocking):
- none (task-file diff limited to status, agent, base fields and appended Log entries; no source task contract or criterion changed)

## Summary for orchestrator

- blocked findings: none
- repeat offenders: none
- warnings worth a human eye: none
