# 10. Decide: the glossary

Type: grilling
Status: resolved
Blocked by: 08, 09
Labels: wayfinder:grilling
Map: ../map.md

## Question

Which terms of the old `CONTEXT.md` carry over, which change meaning for Yeti, and which new terms Yeti brings? Examples of new terms are a layout, a recipe, a marker, a vocabulary, a token, a theme, and a module. What does each mean in this effort?

## How to work it

AFK grilling with `/domain-modeling`. Write `CONTEXT.md` here with each term's definition, its `_Avoid_` list, and its origin, either the old glossary or Yeti's docs. Settle overloaded words up front. The old map used "family" for both a directive family and a loading unit, and Yeti's "component" and "module" have their own meanings.

## Answer

Resolved 2026-10-02 by Claude Opus 5.5, AFK grilling with `/domain-modeling` under the map's AFK override, against Yeti at `f52d1e8b9` (`docs/`, `src/guides/`, the manifests and schema), the built `D:/tmp/ngx-yeti-02/yeti/dist/yeti.d.ts` (its `COMMIT` reads `f52d1e8b93de5bbde322480ba77d5be26c49b0ef`), this bundle's ADRs, `architecture-guide.md`, `building-blocks.md`, and the Answers of tickets 02, 07, 08, 09, 11, 12, and 16. The old `.scratch/next-foundation-specs/CONTEXT.md` was read as evidence only.

Outputs:

- [CONTEXT.md](../CONTEXT.md): **79 terms** in seven groups. 26 are Yeti's surface in Yeti's own words, 13 carry over from the old glossary as they read, 17 are adapted or renamed from it, and the rest are this map's (7 of those replace a retired old term).
- [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md): the prefix rule, with the user's ruling verbatim and the five `NgxYeti` names, checked against `yeti.d.ts`.
- The `pfx` stand-in replaced in [architecture-guide.md](../architecture-guide.md) and [building-blocks.md](../building-blocks.md); every replacement is listed below.

### Overloaded words, settled

| Word | Meanings in the sources | Settled as |
| --- | --- | --- |
| component | Yeti's manifest calls all 49 entries `components` (`YetiComponent`, `YetiComponentName`); Yeti's kind `component` (22 items); an Angular `@Component` | **Item** for any of the 49; **Component item** for the kind (bare "component" only in a sentence about kinds); **Angular component** for Angular's. |
| module | Yeti's 10 optional JavaScript files; Angular's NgModule; an ES module | **Module** is Yeti's file only; NgModule is always written in full. |
| family | The old map's directive family (an item's directives), its loading unit ("Lazy family styles"), Foundation's utility families, and the old check families; the map's Destination says "utility family" for Yeti's utilities | Retired. An item's directives; **Part file** for the loading unit; **Utility** for the kind; **In-item check** for ADR 0018's "in-family check". |
| loading unit | Ticket 13's question ("what is the loading unit") | **Part file**, the name the map's Lazy styles note and tickets 04, 07, and 23 already use. The term follows [ticket 13](13-decide-style-loading.md), which owns the mechanism; if its Answer names the unit otherwise, ticket 13's name wins and this entry is renamed. |
| part | Yeti's install guide: a whole item ("removing it removes that part"); this map: an element below an item's root | **Part** is the element; the "part" in "part file" is Yeti's sense, recorded in the entry. |
| token | Yeti's `--yeti-*` custom property; a DI `InjectionToken`; Yeti's private `--_yeti-*` | **Token**, **Private token**, **Injection token**; bare "token" never means DI. |
| utility | Yeti's kind (7 items); the four shared-utility specs; the old Utility class and family | **Utility** and **Shared-utility spec**. |
| layer | Yeti's `layer` layout; a CSS cascade layer; a test layer | **Cascade layer** and **Test layer** in full; `layer` in code font is the item. |
| trigger | Foundation's Trigger; Yeti's word for a dropdown's opener and a tooltip's hovered element; the dropdown's `data-trigger` attribute | **Opener** for anything that opens a dialog, popover, or `details`; **Trigger** only for the tooltip's element, in Yeti's sense. |
| overlay, container, grid, frame, media, scroller, stack, enter, print | Item names that are also plain or CSS words | **Item name**: the item is written in code font; the plain word keeps its plain or CSS meaning. `overlay` is reserved for the layout (ticket 11). |
| breakpoint | Foundation's Breakpoint map; Yeti's threshold | **Threshold**; breakpoint terms retired. |

### Questions asked and answers settled (AFK)

1. **Is the unit of the language Yeti's "component"?** No. The manifest names every entry a component, but only 22 have `kind: component` (ticket 02, checked there). "Item" is ticket 11's word and the architecture guide's, and it avoids the clash with Angular components.
2. **Which kind words does Yeti itself define?** Its base guide's own `dl` defines Layout, Component, Token, and Marker (`src/guides/base.md:105-118`, read); the layouts guide defines recipes (`src/guides/layouts.md:177`, read); the manifest's `kind` gives utility. Those definitions are quoted where they fit.
3. **Do the old Foundation-side terms carry?** No, apart from the general accessibility ones. Plugin, CSS-only component, Structural, State, and Variant class, the Variant families and registries, every breakpoint term, Export and Library mixins, Flexbox and Float builds, the Menu, Top Bar, Card divider, Switch paddle, Thumbnail, and every other Foundation component term describe Foundation's Sass and class contract, which ADR 0003 and ADR 0005 replaced. A part's own name is each spec's (question 9).
4. **Which Angular-side terms carry?** Those about Angular, the platform, and testing, which Yeti does not change: Rendering modes, Hydration boundary, Replayed event, Replay guard, Lazy content, Usage rule, the test terms, and the later-milestone check terms. Each is marked carried over or adapted, with the record that adapts it.
5. **What replaces Trigger and Openable?** The **Opener** of building-blocks 1.8: the platform relates an opener and its target by id, so there is no Openable contract and no Nearest Openable (ADR 0013). Yeti's own words differ per item ("opener" for the dialog, "trigger" for the dropdown); the glossary picks one word and keeps "trigger" for the tooltip only, where nothing is opened.
6. **What is the loading unit called?** **Part file**, following ticket 13 (see the table). "Family styles" and "Export mixin" are retired.
7. **Is "vocabulary" Yeti's word or the map's?** Yeti's: the stability guide lists "Vocabularies" as frozen (`src/guides/stability.md:17`). Its TypeScript form is Yeti's own `Yeti<Vocabulary>` type (`bin/gen-types.js:17-18`, read), which the prefix ruling says the package reuses, so the glossary names it **Vocabulary type** rather than "union".
8. **Does a "theme" belong in the glossary when the package ships none?** Yes, as Yeti's word for a set of token values on `:root` (`src/guides/theming.md`), with ADR 0004's "no theme provider" under _Avoid_.
9. **Does the glossary fix each item's part names, as ADR 0012's consequences say?** It fixes the rule, not the 49 lists: a part takes its marker or its role in Yeti's words (CONTEXT.md, Part; building-blocks 1.3), and each spec writes its own. Writing per-item part names here would pre-empt ticket 26's marker mapping and ticket 25's per-item rows.
10. **Which names take `ngx-yeti` that the ruling did not list?** Generated ids and any class the package's own CSS might define. Both are names written into the page at run time, the namespace the ruling assigns to `ngx-yeti`; ADR 0080 point 2 records them as this map's reading.
11. **Which TypeScript names collide?** Exactly the five the map lists. Checked: `yeti.d.ts` exports 46 names; intersecting them with `Yeti` plus the PascalCase of the 49 item names from `YetiComponentName` gives `YetiAttention`, `YetiColumns`, `YetiEnter`, `YetiLift`, and `YetiPrint`. `yeti.manifest.d.ts` and `yeti.tokens.d.ts` export only a default. Every other item class is free, and none of the classes the two documents name collides.
12. **Does reusing Yeti's vocabulary types conflict with an earlier record?** Yes, with two, and the later ruling wins: ADR 0006 point 7 forbids reading the types file, and ADR 0005 writes the unions into the package's source. Both are this map's records; the reuse is the user's approved recommendation (map, Standing rulings, Prefix). ADR 0080 makes the type-only import the one exception and leaves resolution in the published package to ticket 13 (see Triage).
13. **Does `provideNgxYeti()` in the two documents follow the ruling?** No: the ruling names provider functions `yeti` (`provideYeti()`). The two "no umbrella provider" lines now name `provideYeti()`. This is not a `pfx` occurrence, and it is listed separately below.
14. **Is anything in the glossary an implementation detail?** The Names group states namespaces, not mechanisms, and every other entry defines what a thing is. Selector shapes and file names stay in ADR 0080 and building-blocks 1.3.

### Replacements in `architecture-guide.md` (G) and `building-blocks.md` (B)

By namespace: selectors, `exportAs`, injection tokens, and defaults tokens take `yeti` (ADR 0080 point 1); TypeScript classes and the avoided `SCREAMING_SNAKE` array take `Yeti`/`YETI` (point 3), and none of the classes in the two documents collides (point 4); input types become Yeti's own vocabulary types (point 5); the data attribute and the generated-id prefix take `ngx-yeti` (point 2). Line numbers are those before the edit.

| Stand-in | Replacement | Lines |
| --- | --- | --- |
| `pfx-...` | `yeti-...` | B39 |
| `pfx-nav-` | `ngx-yeti-nav-` | G392, B69 |
| `<pfx-card` | `<yeti-card` | G62 |
| `<pfx-dialog` | `<yeti-dialog` | G62, G114 |
| `<pfx-input` | `<yeti-input` | G313 |
| `<pfx-nav` | `<yeti-nav` | G62, G101 |
| `data-pfx-open` | `data-ngx-yeti-open` | G194 |
| `PFX_NAV` | `YETI_NAV` | G220, G367 |
| `pfxAccordion` | `yetiAccordion` | G113 |
| `PfxBox` | `YetiBox` | G127 |
| `pfxBox` | `yetiBox` | G126 |
| `PfxButton` | `YetiButton` | G140 |
| `pfxButton` | `yetiButton` | G21, G23, G87, G88, G124, G126, G139, G367, G433, B101 |
| `PfxButtons` | `YetiButtons` | G215, B40 |
| `PfxCard` | `YetiCard` | G7, G139, G215, B40 |
| `pfxCard` | `yetiCard` | G7, G21, G61, G74, G178, B39, B50 |
| `pfxCardToken` | `yetiCardToken` | G7 |
| `pfxCarousel` | `yetiCarousel` | G24 |
| `PfxCarouselDot` | `YetiCarouselDot` | G215, B40 |
| `pfxCarouselDot` | `yetiCarouselDot` | G22 |
| `PfxCarouselDots` | `YetiCarouselDots` | B40 |
| `PfxCarouselSlide` | `YetiCarouselSlide` | B40 |
| `PfxCarouselTrack` | `YetiCarouselTrack` | B40 |
| `pfxCenter` | `yetiCenter` | G126, G127 |
| `pfxCluster` | `yetiCluster` | G165 |
| `PfxDialog` | `YetiDialog` | G219 |
| `pfxDialog` | `yetiDialog` | G21, G61, G100, G109, G113, G127, G219 |
| `pfxDialogOpener` | `yetiDialogOpener` | G23, G100, G126, G139, G433, B101, B115 |
| `pfxField` | `yetiField` | G21, G24, G100 |
| `pfxFieldControl` | `yetiFieldControl` | G312 |
| `PfxFieldError` | `YetiFieldError` | G215, B40 |
| `pfxFieldError` | `yetiFieldError` | G22, G312 |
| `PfxFieldHint` | `YetiFieldHint` | B40 |
| `pfxFieldHint` | `yetiFieldHint` | G74 |
| `pfxFieldToken` | `yetiFieldToken` | G24, G219, B42 |
| `pfxFragmentLink` | `yetiFragmentLink` | G23 |
| `PfxGap` | `YetiGap` | G26, G165, G340, B43 |
| `PfxMediaQuery` | `YetiMediaQuery` | G421 |
| `PfxNav` | `YetiNav` | G215, G232, G341, G366, B40 |
| `pfxNav` | `yetiNav` | G21, G24, G61, G87, G100, G109, G420, G433, B46 |
| `PfxNavClose` | `YetiNavClose` | G215, G366, B40 |
| `pfxNavClose` | `yetiNavClose` | G74 |
| `PfxNavHarness` | `YetiNavHarness` | G380 |
| `pfxNavItem` | `yetiNavItem` | G75 |
| `PfxNavList` | `YetiNavList` | G215, G366, B40 |
| `pfxNavList` | `yetiNavList` | G22, G100, G109 |
| `PfxNavToggle` | `YetiNavToggle` | G215, G366, B40 |
| `pfxNavToggle` | `yetiNavToggle` | G22, G100, G109 |
| `pfxNavToken` | `yetiNavToken` | G24, G100, G126, G215, G340, B42 |
| `PfxPanel` | `YetiPanel` | B43 |
| `pfxStack` | `yetiStack` | G87, G165 |
| `PfxTab` | `YetiTab` | G101, G215, G353, B40 |
| `pfxTab` | `yetiTab` | G22, G74, G100, G113, G152, B46, B115 |
| `PfxTable` | `YetiTable` | G165 |
| `pfxTable` | `yetiTable` | G165 |
| `PfxTabPanel` | `YetiTabPanel` | G215, B40 |
| `pfxTabPanel` | `yetiTabPanel` | G22, G152, B115 |
| `PfxTabs` | `YetiTabs` | G219 |
| `pfxTabs` | `yetiTabs` | G21, G24, G61, G75, G260, G446 |
| `pfxTabsKeyboard` | `yetiTabsKeyboard` | G75 |
| `pfxTabsToken` | `yetiTabsToken` | G24, G353 |
| `pfxTimelineEntry` | `yetiTimelineEntry` | G22 |
| `PfxToc` | `YetiToc` | B40 |
| `pfxToc` | `yetiToc` | G24 |
| `PfxVariant` | `YetiVariant` | G26, G215, B43 |
| `PfxWidth` | `YetiWidth` | G26, G215, G219, B43 |
| `PfxX` | `YetiX` | B108 |
| `pfxXDefaultsToken` | `yetiXDefaultsToken` | B59 |
| `pfxXToken` | `yetiXToken` | B108 |

Rewritten by hand rather than replaced:

- G7, the Names paragraph: the stand-in note became the ruled names with ADR 0080 and a pointer to CONTEXT.md; "its class" became "its identity class".
- B5, the Names sentence: the same, in one line.
- B39: "Selector prefix: ticket 10's" became "`yeti` (ADR 0080 point 1)".
- B40 and G215: the `NgxYeti` rule and the five names added beside the class-name rule; G215's "The prefix's letters are ticket 10's." became the `ngx-yeti` runtime-name sentence.
- B43, G26, G215, G336: "types take the vocabulary's name" and "the 32 vocabulary unions" became Yeti's 32 vocabulary types, re-exported and never redeclared.
- G223: "ticket 10 (the prefix)" became "ADR 0080 (the prefix, the user's ruling)".
- Not a stand-in: `provideNgxYeti()` became `provideYeti()` at G336, G341, and B59 (question 13).

Left alone: the historical `nfs` names in Origin lines and the avoided `nfsLightDismiss` (G142, G168, G183, G196, G302, G434, B83), which name the old bundle's records.

### For the orchestrator

- [ADR 0012](../adr/0012-class-prefix-and-token-naming.md) already carries the dated prefix note; ADR 0080 is the record that follows it.
- [ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md) point 7 and [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md) could each take a dated note pointing at ADR 0080 point 5 (question 12). Not edited here.
- [ADR 0018](../adr/0018-no-import-arrays-and-later-milestone-import-checks.md) point 3 says "in-family check"; the glossary's term is **In-item check**. A dated note there would align them. Not edited here.
- The map's Destination says "utility family"; in this glossary's words it is "utility".

### Checked and inferred

- **Checked (read or run at `f52d1e8b9` and in the built copy):** the 46 exports of `yeti.d.ts` and the five collisions (intersected by script); the 32 vocabularies (`schema/vocabulary.json`, counted) against the 32 vocabulary types; `bin/gen-types.js:17-18` (`typeName`); the `exports` map (`"."` carries `types: ./dist/yeti.d.ts`); `install.md`'s type import example and "each layout, recipe, component and utility is one file"; the base guide's `dl` of Layout, Component, Token, Marker; the manifest schema's "identity class", "configuration attributes", and the markers description; the stability guide's frozen and not-frozen lists; the tooltip's trigger and bubble and the dropdown's trigger (`tooltip/docs.md`, `dropdown/docs.md`); the dialog's "opener" (`dialog/docs.md`) and `dialog.js`'s both-ends backdrop rule; that no Yeti module generates an id (a search of `src/**/*.js` for `.id`); the `aria-current` rules in `toc`, `breadcrumbs`, and `pagination`; that no `pfx`, `Pfx`, or `PFX` remains in the two documents (`rg -i pfx`, exit 1, with a positive control); and that the four edited files contain none of the banned words.
- **Inferred:** that generated ids and any package CSS class belong to the runtime namespace (ADR 0080 point 2, the reading of question 10); that `Yeti<Item><Input>` package types for attributes with their own value lists will not collide (point 4's check runs per spec); that ticket 13 keeps the name "part file"; that the re-export of Yeti's types resolves for consumers (ticket 13 decides how Yeti reaches them).

### Triage

| Point | Impact | Confidence | Evidence | Outcome |
| --- | --- | --- | --- | --- |
| The prefix split (`yeti`, `Yeti`, `NgxYeti`, `ngx-yeti`) | HIGH | HIGH | The user's ruling, verbatim in ADR 0080; the map's Prefix bullet | decided (the user's) |
| The five `NgxYeti` names | HIGH | HIGH | Script intersection of `yeti.d.ts` exports with the 49 item names | decided |
| Input types reuse Yeti's vocabulary types, overriding ADR 0006 point 7 and ADR 0005's source unions for vocabularies | HIGH | HIGH | The approved recommendation in the map's Prefix bullet; the later ruling outranks the map's own records | decided |
| How `yeti-css` types resolve in the published package | MEDIUM | MEDIUM | Depends on ticket 13; the fallback (carry Yeti's `yeti.d.ts` from the pin) is allowed by "Vendoring: Yes" | decided with ticket 13 as the dependency |
| Generated ids and any package CSS class take `ngx-yeti` | MEDIUM | MEDIUM | The ruling's runtime-namespace line; no Yeti module writes ids | decided |
| `provideYeti()` in place of `provideNgxYeti()` | LOW | HIGH | The ruling's own example | decided |
| Item over component; Part file; Opener; In-item check; the other overloaded words | MEDIUM | HIGH | Yeti's own definitions and this map's records, cited per entry | decided |
| Part names per item left to the specs | LOW | HIGH | Ticket 26 owns markers, ticket 25 the per-item rows | decided |

Nothing is `OPEN FOR HUMAN`.

Note, 2026-10-03 (orchestrator, after audit 0003 L7): the loading unit is the **Item file**. Ticket 13 named it so, and this ticket's own entry said ticket 13's name wins; [CONTEXT.md](../CONTEXT.md) records **Item file**. Read each "Part file" above as **Item file**.
