# 06. Decide: the browser target

Type: grilling
Status: resolved
Blocked by: 01
Labels: wayfinder:grilling
Map: ../map.md

## Question

Which browsers does the Angular package support? The options:

- Angular 22's baseline, Baseline widely available on 2026-05-07, where Yeti's unguarded newer features would fail;
- Yeti's Baseline 2025, which is narrower than Angular's;
- a stated combination.

And what does each spec say about a feature outside the chosen target?

The old map's browser rule was "a platform feature counts as available only if it was Baseline widely available on that date; anything newer needs a fallback or is not used". It was written for a framework built before those features existed. This ticket decides whether it carries over, is adapted, or is abandoned.

## User ruling, 2026-10-01

The user's own message to the orchestrator, verbatim:

> 26. Browser baseline: For this project, accept Yeti's Baseline 2025 or the least common denominator browser set/baseline supporting browser/CSS features Yeti relies on.

Orchestrator's reading: Angular 22's own baseline is not the package's target. The ticket still decides between the two options the user allows:

- Yeti's Baseline 2025, which implies Chrome and Edge 141, Firefox 145, and Safari 26.2 ([Research: Angular 22's browser baseline against what Yeti expects](01-research-browser-baseline-vs-yeti.md)).
- The least common denominator: the oldest browser versions that support every feature Yeti relies on without a guard. That is computed from the same research's feature table, and may be older than Yeti's set.

It also decides how a spec states the target, and what a spec says about a guarded feature, such as anchor positioning, which works with a fallback below that target.

## How to work it

AFK grilling (map, AFK override) against [Research: Angular 22's browser baseline against what Yeti expects](01-research-browser-baseline-vs-yeti.md) and the old map's Browser support note. Weigh three things:

- Angular 22's own support policy;
- Yeti's README and stability guide ("Browser support minimums, which track Baseline", not frozen);
- which unguarded features break which components.

Record the decision as an ADR in `adr/`. This is HIGH impact: every spec inherits it. Use the triage rule if confidence is not HIGH.

## Orchestrator analysis, 2026-10-01

The user asked for the orchestrator's recommendation on the two options of their ruling: "47. Browser target: Give me your recommendation after your research, analysis, prototyping, or whatever you plan to do to decide."

Computed from the appendix table of [Research: Angular 22's browser baseline against what Yeti expects](01-research-browser-baseline-vs-yeti.md): web-features first-support versions for the 170 features Yeti uses at least once without a guard, with the 31 fully guarded features left out. The lowest common set is the highest first-support version per browser:

| | Chrome | Edge | Firefox | Safari and Safari iOS |
| --- | --- | --- | --- | --- |
| Yeti's Baseline 2025 (the research's section 3) | 141 | 141 | 145 | 26.2 |
| Lowest common set | 136 | 136 | 144 | 26.2 |
| What sets the lowest common version | `print-color-adjust` (printing only) | `print-color-adjust` | invoker commands, view transitions | `accent-color`, invoker commands |

Even without `print-color-adjust`, invoker commands hold Chrome and Edge at 135. The script is the orchestrator's own (`lcd.mjs`, scratchpad), reading the committed table; no browser at either floor was run, because Playwright ships current engines only (ticket 18 lists the floor browsers as not run).

Recommendation, which the user has not yet ruled on: state Yeti's Baseline 2025 as the package's target.

1. **Reach is the same.** Safari 26.2, the binding constraint, is identical in both options. The lowest common set gains only Chrome and Edge 136 to 140 and Firefox 144, which evergreen updates leave few users on.
2. **It is a stable, named rule.** Yeti's README states Baseline 2025, and its stability guide says browser minimums "track Baseline". A named Baseline year is the vocabulary both projects use. The lowest common set is a number recomputed at every pin move, and it shifts whenever Yeti starts or stops using a feature.
3. **It gives the package's own code a clear rule.** Spec authors may use any feature in Baseline 2025 without a guard, the rule Yeti follows. Under the lowest common set, every new feature the package uses would need checking against a computed list.
4. **Guarded features stay as Yeti has them.** Anchor positioning, scroll-driven animations, `field-sizing`, and `interpolate-size` work with Yeti's fallbacks below their support. Each spec states the fallback it relies on.

## Answer

Resolved 2026-10-01 by the user's ruling. Asked to choose between the two options after the orchestrator's analysis above, the user chose "Baseline 2025 (Recommended)": the package targets Yeti's Baseline 2025, which implies Chrome and Edge 141, Firefox 145, and Safari and Safari iOS 26.2. Recorded as [ADR 0002](../adr/0002-browser-target-baseline-2025.md).

- Package code may use any Baseline 2025 feature without a guard; anything newer needs a fallback.
- Yeti's guarded features keep Yeti's fallbacks, and each spec states the one it relies on.
- A Yeti pin move that changes Yeti's own target reopens ADR 0002.
- The old map's rule ("Baseline widely available on that date") is abandoned for this map: it was written for Foundation 6.9's browser target.
