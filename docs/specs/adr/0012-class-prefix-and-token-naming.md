---
status: accepted
---

# Prefixed class names and camelCase `...Token` injection tokens; the prefix itself waits for the user

Adapted from ADR 0009 (`nfs-prefix-and-token-naming`) of `.scratch/next-foundation-specs/`, by [Decide: which ADRs carry over](../issues/08-decide-inherited-adrs.md), as [Decide: which standing preferences and user rulings carry over](../issues/07-decide-inherited-preferences-and-rulings.md) foresaw (its `Nfs` row). That record bound nothing here.

The Angular style guide favours bare class names, and the neighbouring libraries name their tokens differently: CDK and Material use `SCREAMING_SNAKE` with a `CDK_` or `MAT_` prefix, and Angular Aria exports unprefixed `SCREAMING_SNAKE` tokens and bare classes (`Tabs`, `Tab`, `TabList`, `TabPanel`, `Toolbar`; `src/aria/tabs/tabs.ts:57`, `src/aria/toolbar/toolbar.ts:59`, read in the 22.2.x clone). The package composes Aria's classes through `hostDirectives` where the implementation order reaches level 2 (the user's standing ruling 37 and this map's Implementation order note), and Yeti's items share names with Aria's (Yeti's `tabs` against Aria's `Tabs`). So bare names would collide.

We decided, independently of which prefix is chosen:

1. **Every directive and component class carries the package's class prefix**, followed by the PascalCase of the Yeti item and, for a part, the part's name (`<Prefix>Tabs`, `<Prefix>Dialog`).
2. **Every injection token is camelCase with a `Token` suffix** (`<prefix>TabsToken`). The planning repository's `AGENTS.md` (ngx-foundation-sites-next) fixes the form ("Injection tokens should use camelCase with a `Token` suffix"), and the old record's reason stands: one form throughout the package.
3. **`Nfs` and `nfs` are abandoned.** They abbreviate `ngx-foundation-sites`, and the package is now `ngx-yeti` (the user's ruling, map Notes, "Package name").
4. **The prefix must not equal a name Yeti's own typings export.** Yeti generates its TypeScript types as `Yeti` plus the PascalCase of each vocabulary (`bin/gen-types.js:18`, read at `f52d1e8b9`), so a `Yeti` class prefix would give some package classes the same name as a Yeti type (the orchestrator counted five item names among Yeti's 46 `Yeti*` types: `YetiColumns`, `YetiAttention`, `YetiEnter`, `YetiLift`, `YetiPrint`). Whichever prefix is chosen, the class names are checked against Yeti's exported type names at the pin.

**The prefix itself is not decided here.** It is the user's, and the user is deciding it. The user's own words, verbatim and in order, as relayed by the orchestrator: "Our new package name, replacing "ngx-foundation-sites" will be "ngx-yeti"". Then: "The project shorthand/prefix should no longer be "nfs" which was short for "ngx-foundation-sites". We need something else. I considered "yeti" but it might clash with the actual Yeti. I'm open to suggestions." Then: ""yt" doesn't work as it could be confused with "yt", owned by Google and possibly used by the YouTube package in the angular/components repo." Then: "I would actually prefer to just use "yeti" where no name clasing is possible or probable. Where would clashing risk exist?" The orchestrator has answered with a table per namespace and recommended `yeti` for Angular-side names (selectors, `exportAs`, injection tokens, provider functions, entry points) and `ngx-yeti` for anything written into Yeti's runtime namespaces (custom properties, cascade layers, data attributes), with TypeScript class names open because of point 4. That recommendation is not approved. This item is `OPEN FOR HUMAN` (ticket 08, `### Triage`); until the user rules, the specs write `<Prefix>` and `<prefix>`.

## Considered options

- **Bare class names, as the style guide prefers.** Rejected for the collisions with Aria's exports.
- **`SCREAMING_SNAKE` tokens in the CDK and Material style.** Rejected, as in the old record: mixing two forms in one package leaves consumers guessing.

## Consequences

- A part's name in the class follows Yeti's own name for the part (its marker or its docs term), which [Decide: the glossary](../issues/10-decide-glossary.md) fixes per item.
- Both choices are deliberate deviations from the Angular style guide, recorded so nobody "fixes" them.
- When the user rules, this record gains the prefix as a dated note, and the glossary and the selector prefix ([ticket 09](../issues/09-decide-inherited-principles-and-building-blocks.md)) follow it.

- 2026-10-02: the user decided the prefix, verbatim: "Prefix: Approve recommendation. Use an `NgxYeti` TypeScript naming prefix where collisions cannot be avoided." So the class prefix is `Yeti` (`YetiCard`, token `yetiTabsToken`), and `NgxYeti` where a `Yeti` name equals one Yeti's `yeti.d.ts` exports, which point 4 forbids: today `NgxYetiColumns`, `NgxYetiAttention`, `NgxYetiEnter`, `NgxYetiLift`, and `NgxYetiPrint`. Selectors, `exportAs`, DI tokens, and provider functions use `yeti`; custom properties, cascade layers, and data attributes the package writes use `ngx-yeti` (map, Standing rulings, Prefix).
