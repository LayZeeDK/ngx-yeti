---
status: accepted
---

# Entry points export directive classes and no import arrays; forgotten imports are caught by checks of a later milestone

Adapted from ADR 0046 (`forgotten-imports-caught-by-checks`) of `.scratch/next-foundation-specs/`, by [Decide: which ADRs carry over](../issues/08-decide-inherited-adrs.md), as [Decide: which standing preferences and user rulings carry over](../issues/07-decide-inherited-preferences-and-rulings.md) foresaw in its Forgotten imports row. That record bound nothing here. Its two halves were the user's choice of 2026-09-28 (no import arrays, and four checks), and the user's ruling of 2026-09-29 moved every check to a later milestone: "all checks should be deferred to a later milestone because at the core of it, this is an issue Angular should correct, not 3rd-party Angular component libraries", and "I want to keep the initial milestone simpler and smaller in scope" (this map's "Milestones" note). The adaptation below is this map's.

The problem is Angular's, and Yeti changes nothing about it: a static attribute that matches no imported directive is legal, so a forgotten import renders with no error (angular/angular#17874). Under [ADR 0003](0003-directives-set-yetis-class-attributes-and-markers.md) it is starker than it was for Foundation: the consumer writes no Yeti class or attribute, so an element whose directive was not imported gets no class, no `data-*` attribute, no generated id, and no ARIA, and renders as bare HTML under the always-loaded group.

We decided:

1. **No import arrays** (carried). Each entry point exports its directive and component classes and no array of them, as Angular Aria does; the old reason stands: an exported array hides its members from the unused-imports diagnostic and from `ng generate @angular/core:cleanup-unused-imports`.
2. **The first milestone has no import check.** A forgotten import renders without its directive, with no report, and every spec states the imports its markup needs as documented usage.
3. **The four checks of the old record remain the package's answer for a later milestone**, adapted to Yeti's contract: an in-family check (a part of an item reports a peer attribute with no instance, in development builds only); a static check on documented APIs only, matching each standalone component's `imports` against the package's selector manifest; a runtime manifest check reporting an element that carries one of the package's directive attributes with no directive on it; and an opt-in `strictParents` flag. Under Yeti the runtime check reads the directive attribute, not a class, because no class is bound until the directive runs.
4. **Whether this map writes that later-milestone spec** is [Decide: the spec list](../issues/11-decide-spec-list.md)'s, among its shared-utility specs. The old bundle's Spec: forgotten-import checks (shared utility), old map ticket 150, copied as [research/old-forgotten-import-checks-spec.md](../research/old-forgotten-import-checks-spec.md), and its two prototypes (old map tickets 145 and 149, not copied) are its evidence.

## Considered options

- **Abandon the checks for good**, since the user's reason says the fix belongs to Angular. Not adopted: the user deferred the checks and never withdrew them ("family/peer/parent/similar checks should be specced but deferred like missing import checks", the same message of 2026-09-29, old ticket 158), and the problem is unchanged.
- **An import array per entry point or per multi-part item.** Rejected, as in the old record and by the user's choice.
- **Required parent injection by default.** Rejected, as in the old record: a forgotten parent throws NG0201 in production too.

## Consequences

- The other check families of the old bundle have no cross-cutting successor here. Its build-time checks rested on Foundation's Sass; its Variant runtime checks (`strictVariantNames`, `strictVariantProperties`, `strictBreakpointSync`) rested on the registries and breakpoints that [ADR 0005](0005-closed-unions-from-yetis-vocabularies.md) and ticket 08 abandoned. Per-item misuse warnings and family checks follow their items' records, which ticket 08 has now decided against the spec list.
- NgModule consumers stay supported: the standalone directives remain importable into an NgModule's `imports`.
- 2026-10-02: [Decide: the glossary](../issues/10-decide-glossary.md) retires "family", so point 3's "in-family check" is called the **In-item check** from now on. Its rule is unchanged.
