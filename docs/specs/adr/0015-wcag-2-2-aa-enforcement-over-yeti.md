---
status: accepted
---

# Every directive and component meets WCAG 2.2 AA, enforced by the story gate and by play-function assertions

Adapted from ADR 0022 (`wcag-2-2-aa-enforcement`) of `.scratch/next-foundation-specs/`, by [Decide: which ADRs carry over](../issues/08-decide-inherited-adrs.md). That record bound nothing here. The requirement is this map's "Accessibility" note: the user's decision in the old bundle (restated there on 2026-09-26), carried by [Decide: which standing preferences and user rulings carry over](../issues/07-decide-inherited-preferences-and-rulings.md), with every gap the package closes recorded in `ledger.md` under the user's standing ruling 36. This record is how it is enforced; its wording is this map's.

The old enforcement rested on Foundation's Sass: a failing Foundation default was answered by a Sass setting the consumer must set or by the smallest rule a library mixin added, and non-text contrast, which axe does not check, was checked at compile time from the Sass colour settings. Yeti has no Sass and no compile step ([Research: Yeti's styling model](../issues/04-research-yeti-styles-and-lazy-loading.md) 4.3), so none of that machinery has a successor. Yeti also starts from a better place: axe-core 4.13.0 with the WCAG 2.2 AA tags found 0 violations on all 49 docs examples in three engines, in light and dark schemes, and what remains is behaviour, five items whose contrast axe left incomplete, and the absence of `forced-colors` rules ([Research: Yeti against WHATWG, WAI-ARIA, the APG](../issues/17-research-yeti-accessibility-and-standards.md), measured).

We decided:

1. **WCAG 2.2 AA is a requirement in every spec, never a recommendation** (carried). Each spec has a criteria subsection naming the criteria its item touches and how each is met, and each row that the package meets and Yeti does not is a `ledger.md` row.
2. **The story gate is the enforcing check** (carried): axe per story in layer 1 with the six tags of [ADR 0014](0014-testing-stack-for-yeti.md) and `parameters.a11y.test = 'error'`. A per-story exception exists only for a story that shows a documented anti-pattern.
3. **What axe does not check is asserted in the story's play function** (adapted from the old compile-time check). Tokens are runtime custom properties, so a story's computed colours are the ones a consumer on Yeti's defaults sees; a play function computes non-text contrast (1.4.11) and any contrast axe leaves incomplete from computed styles with the exact WCAG formula, unrounded. It is a test, not a consumer check, so the Milestones deferral does not reach it. It asserts the criterion's ratio, never a token's value, so it keeps [ADR 0006](0006-yeti-pinned-develop-commit-vendored-and-gated.md)'s rule that no test depends on a public token's default; a pin move that makes it fail has found a real regression. The five items ticket 17 left for a manual contrast check (timeline, layer, breakout, media, lede) get such an assertion if their spec keeps them.
4. **A requirement on content the directives cannot read is stated as a requirement**, shown in every example, and asserted by every story's play function (carried from the old record's 2026-09-28 note): for example an alert's text names its kind, and a progress bar shows its value as text.
5. **Where Yeti's behaviour fails, the directive owns the fix**: ARIA, focus, and keyboard handling the directive binds, each a `ledger.md` row (ticket 17's deviations: the tooltip's Escape, focus-out closing, the carousel pattern, `aria-orientation` on vertical tabs, the required marker in a field's name).
6. **Where Yeti's CSS is what fails, the fix is not settled here.** Whether the package may ship CSS of its own over Yeti's classes is `OPEN FOR HUMAN` in [Decide: which standing preferences and user rulings carry over](../issues/07-decide-inherited-preferences-and-rulings.md), `### Triage`, and this record inherits that item rather than deciding it. Until it is answered, a spec whose item fails through Yeti's CSS states the gap, the criterion, and the options that ticket lists.
7. **Assistive-technology checks the sources cannot replace stay human-only by kind** (carried): each is a manual release test in its spec.

## Considered options

- **Recommend fixes and let consumers opt in.** Rejected, as in the old record: stories and defaults would fail the gate, and a consumer on Yeti's defaults would inherit the failure without a signal.
- **A development-mode contrast check in the directives.** Rejected, as in the old record, and also by the carried Milestones note: computed colours vary by theme, and checks are a later milestone. The play-function assertion in point 3 tests the package's own stories instead.
- **Required token values the consumer must set, as the old record's required Sass settings.** Not adopted as the default answer: [ADR 0004](0004-yeti-tokens-are-a-consumer-stylesheet-surface.md) keeps tokens a consumer surface and the package ships no theme, so a failing default would still fail for every consumer who sets nothing. A spec may still document a token that fixes a gap.

## Consequences

- The consistency review checks that every spec carries the criteria subsection and its `ledger.md` rows.
- [Research: Yeti against WHATWG, WAI-ARIA, the APG](../issues/17-research-yeti-accessibility-and-standards.md) classes forced colours as not a WCAG 2.2 AA criterion (measured there, "not a WCAG AA criterion"). The open item in point 6 is therefore also a question of whether the package goes beyond AA, which the person deciding it should know.
- The old record's exact-formula Sass helper has no successor; the formula lives in a test helper.
- 2026-10-02: point 6 is settled. The user ruled "Accessibility CSS: Yes." (map, Standing rulings): where Yeti's CSS fails, the package adds one small documented rule in its own `ngx-yeti` cascade layer, recorded as a [ledger](../ledger.md) row that [Decide: the building-blocks map for every ngx-yeti item](../issues/25-decide-building-blocks-map.md) gives an owning spec.
