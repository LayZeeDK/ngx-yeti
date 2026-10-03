# 72. Spec: affix (component)

Type: task
Status: resolved
Blocked by: 25, 26, 39, 40, 41, 42
Labels: wayfinder:task
Map: ../map.md

## Question

What is the Angular API of Yeti's `affix` component, and what does its spec say? Its decisions are already made in the records: its row in `building-blocks.md` Part 2 (and the "Aria decisions" section where it applies), its rows in [Decide: how the package maps each of Yeti's `data-*` attributes](26-decide-yeti-data-attributes-mapping.md), its item file under [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), its ledger rows, and the shared specs it links to.

## How to work it

Write `specs/affix.md` with the `/to-spec` template and the map's Spec shape note, from the records only. The spec decides nothing a record has not decided. Anything it needs and no record settles goes under the ticket's `### Open` for the orchestrator. Append an `## Answer` that links the spec.

### Open

1. **How a meaningful prefix's id reaches a control that the field's control directive also describes** (spec usage rule 3, section 3, section 11; HIGH impact, MEDIUM confidence; trap quadrant).
   - **Question.** Yeti asks the developer to give a meaningful `span` an id and list it in the control's `aria-describedby` (`affix/manifest.json` `a11y.notes`). Part 2 row 22 keeps that attribute the consumer's. But inside a package field the control carries `yetiFieldControl`, which binds `aria-describedby` from the hint's and error's ids (Part 2 row 33; ADR 0020 point 2). A bound `aria-describedby` replaces the consumer's static one, and building-blocks' "Hydration constraints (2026-10-03)" bullet says a consumer writes no static attribute that a directive binds. As the records stand, the prefix silently falls out of the control's description inside every package field, which is where Yeti says the affix usually sits (WCAG 1.3.1).
   - **Option A (recommended): the field's control directive composes the consumer's ids.** It declares an input aliased `aria-describedby`, the consumer writes `aria-describedby="price-unit"` on the control, and the directive binds the consumer's ids followed by the hint's and the error's. This is Material's shape (`NC/src/material/input/input.ts:243` `userAriaDescribedBy`; `form-field.ts:759` `_syncDescribedByIds`) and the old bundle's abide decision 12 ([research/yeti-validate-and-signal-forms.md](../research/yeti-validate-and-signal-forms.md) line 119). Approve: it keeps Yeti's documented markup working unchanged, needs no affix code, and serves any consumer description, not only the affix's. The static attribute is written back at hydration and replaced by the composed value in the same pass, the same shape as ticket 50 decision 9, so the field spec's e2e should assert no `NG05xx` and the composed value after hydration.
   - **Option B: a usage rule only, "inside a package field, say the unit in the label".** The manifest's second form ("Price in dollars"). Dismissed as the only answer: it removes Yeti's first documented form, and a domain or long suffix reads badly in a label. It stays in the spec as the form that is always correct.
   - **Option C: a part directive on the attachment `span`** (`[yetiAffixAddon]`) that generates an id and registers it with `yetiFieldToken`, so the field's control directive adds it. Dismissed: Part 2 row 22 makes the affix class only and says the consumer's id does the job; it adds a part, a cross-item DI link, and a generated id for a case a consumer id already covers.
   - **Evidence and confidence.** The collision is read from Part 2 rows 22 and 33 and ADR 0020 point 2. Material's composition is read at `708d4c6e2`. The field spec (ticket 83) is being written in parallel, so whether it already chose A is not known; that is why confidence is MEDIUM.
   - **To overrule.** For B: replace usage rule 3's field case with "say the unit in the label", remove the description assertion from `affix--default` and use the label in the examples. For C: add `YetiAffixAddon` to sections 2 to 4, use [generated-ids](../specs/generated-ids.md), and amend Part 2 row 22. Either way the field spec states the matching rule. Decided 2026-10-03 in ticket 50, decision 46 (orchestrator, full AFK mode).

## Answer

Resolved 2026-10-03 by Claude Opus 5.5. Spec: [specs/affix.md](../specs/affix.md).

One directive in `ngx-yeti/affix`: the item directive `YetiAffix` on `[yetiAffix]` (`exportAs: 'yetiAffix'`) binds the static class `affix` and the presence attribute `data-ngx-yeti-item-affix` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)) and acquires the `affix` item file ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). No inputs, outputs, token, provider, or part directive; native platform, level 1, types only (Part 2 row 22). No module to replace (`js: null`). No ledger row. No cross-item acquisition: `button` and `field` load through their own directives. The focus lift (`.affix > :focus-visible`) is read here and measured for `buttons` in ticket 29; the spec's layer 4 measures it for `affix`.

Counts: 50 user stories, 8 usage rules, 7 story ids, 1 open point (HIGH impact, MEDIUM confidence, so it is in the trap quadrant and is recorded with its options above). It does not block the spec: the spec carries option A as its reading and keeps the label form, which is correct under every option. The point needs the field spec (ticket 83) to state the matching rule.
