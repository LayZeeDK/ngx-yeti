---
status: accepted
---

# The package targets Yeti's Baseline 2025

Angular 22's own browser baseline is Baseline widely available on 2026-05-07: Chrome, Edge, and Firefox 119, and Safari 17. Yeti targets Baseline 2025 (`README.md`, "Browser support"), and it uses 33 features outside Angular's set, 27 of them unguarded ([Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md)). The user ruled that the package targets "Yeti's Baseline 2025 or the least common denominator browser set/baseline supporting browser/CSS features Yeti relies on". The orchestrator computed the lowest common set as Chrome and Edge 136, Firefox 144, and Safari 26.2, against Baseline 2025's 141, 145, and 26.2 ([Decide: the browser target](../issues/06-decide-browser-target.md), Orchestrator analysis). Asked which to state, the user chose Baseline 2025.

We therefore decided that the package's browser target is Yeti's Baseline 2025, the features that reached Baseline by the end of 2025. That implies Chrome 141, Edge 141, Firefox 145, Safari 26.2, and Safari iOS 26.2.

## Considered options

- Angular 22's own baseline: ruled out by the user. Yeti's unguarded features break components in those browsers: `light-dark()` for every colour, and invoker commands for the dialog.
- The lowest common set for what Yeti relies on, at the pin: the same Safari reach and a little wider Chrome, Edge, and Firefox reach. But it is a computed number that moves with every pin and every feature Yeti adds or removes, and package code would be checked against a computed list.

## Consequences

- Package code may use any Baseline 2025 feature without a guard; anything newer needs a fallback, as Yeti does.
- Yeti's guarded features keep Yeti's fallbacks below their support: anchor positioning, scroll-driven animations, `field-sizing`, and `interpolate-size`. Each spec states the fallback it relies on.
- Specs say "Baseline 2025" and the implied versions, not Angular's baseline. Yeti's stability guide says its browser minimums "track Baseline" and are not frozen, so a pin move that changes Yeti's target reopens this record.
- No test runs at the floor versions today, because Playwright ships current engines only (ticket 18). The testing decision says how the floor is checked.
