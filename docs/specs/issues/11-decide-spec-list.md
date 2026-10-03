# 11. Decide: the spec list

Type: grilling
Status: resolved
Blocked by: 02, 03, 07
Labels: wayfinder:grilling
Map: ../map.md

## Question

Which Yeti components, layouts, recipes, and utilities get a spec, and at what granularity: one per docs page, as the old map ruled, or another unit? For each, is it directives, a component, or nothing beyond documented usage? And which shared-utility specs does the package need?

## User instruction, 2026-10-01

The user's own message to the orchestrator, verbatim:

> Use the LLMs files, docs sitemap, and clone file/folder layout/structure to inform the number and names of specs the destination contains.

The three sources, as the orchestrator found them on 2026-10-01:

- **The LLMs files:** https://www.foundationcss.com/yeti/llms.txt and https://www.foundationcss.com/yeti/llms-full.txt, which the user confirmed are the intended files ("Oh, so the yeti/llms.txt and yeti/llms-full.txt URLs were what I intended.", 2026-10-01). They are identical to `docs/llms*.txt` at `f52d1e8b9` and list the manifest's 49 items.
- **The docs sitemap:** https://www.foundationcss.com/sitemap.xml, the one `robots.txt` names; `/yeti/sitemap.xml` returns 404. It holds 72 `/yeti/` URLs, including guides.
- **The clone's layout:** `github.com/foundation/yeti`.
  - `docs/` has 50 top-level `.md` pages.
  - `src/` has `components/`, `layouts/`, `recipes/`, `utilities/`, `base/`, `tokens/`, `themes/`, `guides/`, and `starter/`.
  - `src/` holds the 10 `.js` modules (`dist/js/` exists only after a build).

The counts differ (49 items, 50 docs pages, 72 sitemap URLs), so the decision reconciles them. Its Answer gives one table: each candidate spec, its name in each of the three sources, whether each source lists it, the reason for including it or leaving it out, and the final count and names. A spec's name follows Yeti's own name for the item, as the old map's naming rule did for Foundation.

## How to work it

AFK grilling against [Research: inventory of Yeti's components, layouts, recipes, utilities, and contract](02-research-yeti-inventory.md), [Research: Yeti's JavaScript modules and what Angular adds](03-research-yeti-javascript-and-angular.md), and [Decide: which standing preferences and user rulings carry over](07-decide-inherited-preferences-and-rulings.md). Record the list in this ticket's Answer, and add the Destination's count to the map. Each entry gets one line: the item, its kind, its docs page, its Angular shape, and why. The spec tickets graduate from this list.

## Answer

Resolved 2026-10-01 by Claude Opus 5.5, AFK grilling under the map's AFK override, against Yeti at `f52d1e8b9`. The map is not edited here; the Destination line for the orchestrator is at the end.

**Decision:** 53 specs. One spec per item of Yeti's manifest (49), named exactly as Yeti names the item, plus 4 shared-utility specs the package needs and Yeti has no item for. 48 items are directives and 1 (`demo`) is a component. No item is documented usage only and none waits for a later milestone. The tokens page, the 11 guides, the 10 example URLs, the docs root, and the always-loaded group get no spec.

### How the three sources' counts reconcile (checked)

| Source | Count | What it holds | Items in it |
| --- | --- | --- | --- |
| LLMs files (`docs/llms.txt`, `docs/llms-full.txt`, identical to `/yeti/llms*.txt` per [ticket 14](14-research-foundationcss-llms-txt.md)) | 49 `## <name> (<kind>, class="<name>")` sections, plus a `## Tokens` catalogue in `llms-full.txt` (`:2786`) | 17 layouts, 3 recipes, 22 components, 7 utilities | all 49 |
| Clone, `docs/` | 50 top-level `.md` pages (53 entries: 50 pages, `guides/`, `llms.txt`, `llms-full.txt`) | the 49 item pages plus `tokens.md` (generated from `src/tokens/tokens.json`, `docs/tokens.md:8`) | all 49 |
| Clone, `src/` | 49 item folders: `layouts/` 17 (plus `attributes.css`), `recipes/` 3, `components/` 22, `utilities/` 7; `guides/` 11; `base/`, `tokens/`, `themes/`, `starter/` | 10 `.js` modules in 9 item folders (`field` has `range.js` and `validate.js`; `dropdown`'s is `hover.js`) | all 49 |
| Sitemap (`https://www.foundationcss.com/sitemap.xml`, fetched 2026-10-01 with `curl`, HTTP 200, 94 `<loc>` entries, `lastmod` 2026-09-25) | 72 `/yeti/` URLs | 49 item pages, `tokens/`, 11 `guides/<name>/`, 10 `examples/` URLs (5 examples, each an overview and a `page/`: article, dashboard, exhibition, landing, settings), and the root `/yeti/` | all 49 |

So 49 + 1 = 50 docs pages, and 49 + 1 + 11 + 10 + 1 = 72 sitemap URLs. Every source lists the same 49 items under the same name; every name agrees across the manifest, the LLMs heading, `docs/<name>.md`, `/yeti/<name>/`, and `src/<kind>s/<name>/`. The differences are all things that are not items. The example pages are site-only: nothing in the clone builds them (`rg exhibition` finds only prose in `src/layouts/grid/grid.css:120` and `src/guides/layouts.md:58`). That the docs site's source lives outside the clone is inferred.

### Candidates left out

| Candidate | LLMs | Sitemap | Clone | Decision and reason |
| --- | --- | --- | --- | --- |
| `tokens` (reference page) | `## Tokens` in `llms-full.txt` only | `/yeti/tokens/` | `docs/tokens.md`, `src/tokens/` | No spec. [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md): tokens are a consumer stylesheet surface, and each item spec's Tokens subsection names the tokens it reads. A spec would have nothing to specify: no input, provider, or service per token. |
| The 11 guides (animations, base, color, components, install, layouts, migrating, responsive, stability, theming, visibility) | no | `/yeti/guides/<name>/` | `src/guides/`, `docs/guides/` | No spec. They describe setup and the rules behind the items, and define no class or attribute of their own. The attributes they show belong to items, for example `data-show`/`data-hide` (container) and `data-print` (print). Ticket 07 keeps guides as evidence only. Checked for `visibility`, `animations`, `responsive`, `color`. |
| The 5 examples (10 URLs) | no | `/yeti/examples/<name>/` and `.../page/` | not present | No spec. They are showcase pages composed from items ("A dashboard built with nothing but Yeti", from the `page/` meta description, fetched). They are suitable as Storybook composition stories or e2e fixtures for the testing decision. |
| Docs root `/yeti/` | no | yes | `README.md` | No spec: a landing page. |
| The always-loaded group: `layers.css`, `src/tokens/*.css`, `src/base/*`, `src/layouts/attributes.css` | no | no | yes | No spec, per the map's "always-loaded group" record. They style bare HTML, and no directive manages them. |
| Themes (`soft`, `sharp`) and starter (`index.html`, `theme.css`) | mentioned (starter) | no | `src/themes/`, `src/starter/` | No spec. ADR 0004 says the package does not ship or wrap themes. The starter is a page to copy, not an item. |
| Editor data, types, manifest and tokens JSON exports | no | no | `dist/` after build | No spec. Build outputs. The manifest and `schema/vocabulary.json` are the source of the input unions (ADR 0005), not a spec. |
| `demo.js`'s docs-only role | listed under `demo` | `/yeti/demo/` | `src/components/demo/` | Not left out. `demo` is a manifest item like the others; see its row. |

### The 49 item specs

Each spec is named after Yeti's item (the class prefix comes from the glossary, [ticket 10](10-decide-glossary.md)). Its docs page is `docs/<name>.md` = `https://www.foundationcss.com/yeti/<name>/`, its folder is `src/<kind>s/<name>/`, and each is listed in all three sources. "Directives" means a host directive per element role that the manifest declares (root, plus the children and markers it lists), following [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md). All shapes are subject to [ticket 13](13-decide-style-loading.md). If it rules that lazy styles need a `styleUrl`, the root directive of an item becomes a component under standing ruling 28. The structural reason given here stays.

| # | Item | Kind | Angular shape | Why |
| --- | --- | --- | --- | --- |
| 1 | box | layout | directives | Attribute-only. It also carries the any-element markers `data-border`, `data-paint`, `data-text` (`on: "*"`, `src/layouts/box/manifest.json:41-55`). Their rules live in `attributes.css`, so those marker directives load no item file. |
| 2 | breakout | layout | directives | Attribute-only; `data-bleed` and `data-note` child markers. |
| 3 | center | layout | directives | Attribute-only. |
| 4 | cluster | layout | directives | Attribute-only. |
| 5 | columns | layout | directives | Attribute-only; `data-span` child marker. |
| 6 | container | layout | directives | No attributes. It carries the any-element markers `data-show`/`data-hide` (`on: "*"`), whose rules are in `attributes.css`. |
| 7 | cover | layout | directives | Attribute-only; `data-center` child marker. |
| 8 | frame | layout | directives | Attribute-only. |
| 9 | grid | layout | directives | Attribute-only; `data-start`, `data-span` child markers. |
| 10 | icon | layout | directives | Attribute-only on the consumer's element and `svg`. |
| 11 | layer | layout | directives | Attribute-only; self-alignment child markers. |
| 12 | masonry | layout | directives | Attribute-only. |
| 13 | overlay | layout | directives | Attribute-only; `data-over`, `data-fill` child markers. |
| 14 | scroller | layout | directives | Attribute-only. The manifest requires `tabindex` and a name. The directive binds `tabindex="0"`, and the spec says how the name is required (ticket 17's one layout exception). |
| 15 | sidebar | layout | directives | Attribute-only; `data-sticky` child marker. |
| 16 | stack | layout | directives | Attribute-only; `data-split`, `data-space`, `data-sticky` child markers. |
| 17 | timeline | layout | directives | Attribute-only on the consumer's `ol > li`. |
| 18 | hero | recipe | directives | Attribute-only; `data-min`, `data-span` child markers. |
| 19 | media | recipe | directives | Attribute-only. |
| 20 | shell | recipe | directives | Attribute-only; `data-sticky` on the body row's `nav`/`aside`. The manifest says "Meant for body or the page's outermost element" (`a11y.notes`). A template cannot reach `<body>`, so the spec places it on the outermost element the application renders (inferred, to be confirmed by the spec). Its `nav` and `dialog` children use the navigation-close shared spec. |
| 21 | accordion | component | directives | Native `details`/`summary`, no module. A directive owns `open` only as pre-hydration state (ADR 0003 point 4, measured in ticket 18). |
| 22 | affix | component | directives | No attributes or module; class plus the child roles. |
| 23 | alert | component | directives | `alert.js` closes it. The directive replaces that with an output for `yeti:close` and class-form `animate.leave` (ticket 18). |
| 24 | badge | component | directives | Attribute-only. |
| 25 | breadcrumbs | component | directives | Attribute-only. The required name and `aria-current` on the current item are bound or required as the spec states. |
| 26 | button | component | directives | Attribute-only, on `button`, `a`, or `input`; native state stays the consumer's. |
| 27 | buttons | component | directives | Attribute-only. `role="group"` and a name are required (`buttons/manifest.json:21`). A toggle set may use Aria Toolbar (ticket 17); the spec decides. |
| 28 | card | component | directives | Attribute-only; `data-stretch` on the stretched link. |
| 29 | carousel | component | directives | Scroll snap does the work. The directives replace `carousel.js`, and the spec decides what to add: current-slide marking, slide roles, previous/next (ticket 17's deviations). Event `yeti:slide`. Dots use the fragment-links shared spec. |
| 30 | demo | component | **component** | The only item whose markup the package should generate: `demo.js` builds the iframe's `srcdoc` from the `<pre>` code and adds a keyboard grip (`demo.js:1-20`). A template renders both on the server, while a directive would have to create them imperatively. Kept despite being docs-oriented: Yeti lists it as a frozen item for "Documentation, a pattern library, a design-system page" (`docs/demo.md`), and the scope rule excludes nothing for being niche. The grip's missing `aria-controls` and Enter collapse go in the ledger (ticket 17). |
| 31 | dialog | component | directives | Native `dialog` with invoker commands rendered with generated ids (ADR 0003 point 5); replaces `dialog.js`; events `yeti:open`, `yeti:close`; uses the navigation-close spec. |
| 32 | dropdown | component | directives | Native `popover`. The directive replaces `hover.js` (`data-trigger="hover"`) and adds focus-out closing (ticket 17), and uses the navigation-close spec. |
| 33 | field | component | directives | Replaces `range.js` (`--yeti-range-value` as a host style binding, ADR 0004 exception 1) and `validate.js` (forms integration: `aria-invalid`/`aria-describedby`, ticket 19); `data-hint`/`data-error` markers; event `yeti:invalid`. One spec, because both modules belong to this one item. |
| 34 | nav | component | directives | `popover` panel with `data-brand`, `data-close`, `data-actions` markers; focus-out closing; uses the navigation-close spec. |
| 35 | pagination | component | directives | Attribute-only; required name; `aria-current`. |
| 36 | progress | component | directives | Attribute-only on the native or ARIA progress; `data-scroll` boolean. |
| 37 | seam | component | directives | Attribute-only. |
| 38 | spinner | component | directives | Attribute-only. |
| 39 | table | component | directives | Attribute-only. It has cell markers, and the any-element `data-numeric`, whose rules are in both `table.css` and `attributes.css`. |
| 40 | tabs | component | directives | Replaces `tabs.js` with Aria Tabs as host directives, plus a `hidden` binding for Yeti's CSS (ticket 03). Selection is Angular-owned pre-hydration state (ticket 18). Event `yeti:select`. Hash reveal goes through the fragment-links spec. |
| 41 | toc | component | directives | Replaces `toc.js` (current-heading tracking, `aria-current`); event `yeti:current`; links use the fragment-links spec. |
| 42 | tooltip | component | directives | CSS-only. The directive adds Escape dismissal through Yeti's `[hidden]` (WCAG 1.4.13, ticket 17) and generated ids for `aria-describedby`. |
| 43 | attention | utility | directives | Attribute-only. |
| 44 | billboard | utility | directives | Attribute-only. |
| 45 | enter | utility | directives | Replaces `enter.js` (load-once in an SPA, ticket 20). `data-once` is Angular-owned (ticket 18). `animate.enter="enter"` was measured to play it. |
| 46 | lede | utility | directives | Class only. |
| 47 | lift | utility | directives | Attribute-only. |
| 48 | print | utility | directives | Attribute-only. |
| 49 | visually-hidden | utility | directives | Class only. Yeti's own class, not CDK's `cdk-visually-hidden`. |

### Shared-utility specs (4)

None of these is a Yeti item, so none has a Yeti name. Each name avoids a Yeti item name. In particular, "overlay" is Yeti's layout (row 13), so the navigation spec does not use that word.

| # | Spec | Shape | What it specifies | Used by | Evidence |
| --- | --- | --- | --- | --- | --- |
| 50 | navigation-close | service or directive, router-aware | Close open popovers and modal dialogs on `NavigationStart`, and return focus to the opener. | dialog, dropdown, nav, shell | [Ticket 20](20-prototype-yeti-in-single-page-apps.md): shell popovers and a shell modal dialog stay open across `routerLink` navigation, and the modal dialog leaves the page inert. The fix measured about 15 lines. |
| 51 | fragment-links | click interceptor | Bare `#id` links under `<base href>` move to the fragment instead of reloading. `location.hash` is kept so Yeti's hash behaviour (tab reveal, `toc`) still works. | toc, carousel dots, tabs, skip links in any consumer markup | Ticket 20: a bare `href="#id"` reloads to `/sub/#id`. The `location.hash` interceptor fixes it and keeps the reveal; the `router.navigate` form loses the reveal. |
| 52 | events | output contract | How each of Yeti's six frozen events (`yeti:close`, `yeti:open`, `yeti:select`, `yeti:slide`, `yeti:invalid`, `yeti:current`) becomes an `output()`: the output names, `detail` types from the frozen `detail` keys, signal-backed so zoneless views refresh, and whether a directive that replaces a module also dispatches the DOM event for non-Angular listeners. | alert, dialog, carousel, field, tabs, toc | [Ticket 16](16-research-yeti-events-in-angular-templates.md): `(yeti:close)` is a compile error, while a directive `output()` works and is typed. None of the options replays. [Ticket 18](18-prototype-yeti-rendering-modes.md): a plain field does not refresh zoneless. |
| 53 | generated-ids | shared helper | Hydration-stable ids for the pairings the directives render: `popovertarget`/`popover`, `commandfor`, `aria-controls`, `aria-describedby`, `aria-labelledby`. | dialog, dropdown, nav, tabs, tooltip, field, carousel | ADR 0003 point 5: opening attributes are rendered with generated ids, as attribute writes, because Angular's DOM schema has no property for them (ticket 03). Ticket 17 names CDK `_IdGenerator` as the candidate; whether a leading-underscore API is acceptable is [ticket 25](25-decide-building-blocks-map.md)'s call. |

Considered and not made a spec:

- **Module ownership.** Yeti's modules are replaced, not loaded, and a loaded module must not fight an owner directive (ticket 20: `preventDefault` to keep `tabs.js` out). Ticket 25 owns this ("which of Yeti's JavaScript modules does each replace or keep"), and each item spec applies it.
- **Forms integration.** It lives in the `field` spec, which owns both form modules.
- **Forced colours.** This is CSS the package would add. Whether the package may add CSS at all was `OPEN FOR HUMAN` in ticket 07 when this was written; the user ruled it on 2026-10-02, "Accessibility CSS: Yes." ([map](../map.md), Standing rulings, Package CSS for accessibility). Each rule belongs to the item spec whose ledger row it closes, so it still gets no spec of its own.
- **A typed union of token names.** Nothing needs one under ADR 0004.

### Grilling record (both sides, AFK)

1. **What unit does a spec cover: docs page, manifest item, manifest group, or kind?** The manifest item. It is what the frozen contract names, and what the item files, tokens, LLMs slices, and folders are keyed by. All three sources the user named agree on the 49 items and their names. A group-level unit (9 `group` values, for example "Boxes and Stacks" with 8 items) would mix items that have different elements and modules. It would also break the naming rule, since a group is not a Yeti item name. Ticket 07 Q14 had already adapted "per docs page" to "per manifest item".
2. **Is `tokens` the 50th spec?** No. It is a reference page generated from the token catalogue, and ADR 0004 rules tokens out as an input contract.
3. **Do any of the 72 sitemap URLs name an item missing from the manifest?** No. The 23 extra URLs are guides, examples, `tokens/`, and the root (checked by listing).
4. **Does any guide define something that needs its own directive?** No. Each attribute a guide shows belongs to an item's manifest (checked in four guides; the other seven describe setup, migration, stability, layouts, base, components, and theming).
5. **Does Yeti mark any item as superseded, the way Foundation's Float Grid was?** No. No manifest says deprecated, superseded, or legacy, and every `since` is `7.0.0` (checked with `rg`).
6. **Should any item wait for a later milestone, in the shape of the user's 2026-09-30 later-milestone ruling?** No. The user's instruction for this ticket ties the number of specs to the three sources, and all three list all 49. The old ruling deferred Foundation families that generate many classes, and Yeti has none of those. Leaving an item without a spec would also leave its item file to be loaded globally, which works against the library-wide lazy-styles requirement (inferred). The map stops at specs, so ordering their implementation is the implementing repository's planning and does not change this count.
7. **Is any item "documented usage only"?** No. The scope-shape ruling says being CSS-only never excludes an item. Even `lede` and `visually-hidden` get a static host class and an `exportAs`.
8. **Which items need a component rather than directives?** Only `demo`, because the package should render its iframe and grip. Every other item's structure is markup the consumer writes. Ticket 13 may still turn root directives into components for `styleUrl`.
9. **Where do the any-element markers (`data-paint`, `data-text`, `data-border`, `data-show`, `data-hide`, `data-numeric`) live?** In the spec of the item whose manifest declares them (box, container, table), as marker directives usable on any element. Their rules are in `attributes.css` (checked), so they load no item file. [Ticket 26](26-decide-yeti-data-attributes-mapping.md) decides the per-attribute input form.
10. **Does `field` split into field, range, and validate specs?** No. One item, one spec. The two modules are this item's behaviour.
11. **Which shared specs does the package need?** The four above. Each one answers a failure that was measured in more than one item. Module ownership is ticket 25's, not a spec.
12. **What are the shared specs called?** Package names, because Yeti has none. Each avoids a Yeti item name, so "overlay closing" became navigation-close.

### Terms for the glossary ([ticket 10](10-decide-glossary.md); not written to `CONTEXT.md` from here)

- **item**: one entry of Yeti's manifest, of any kind. Avoid "component" for all four kinds, even though the manifest's object key is `components`; only 22 have `kind: component`.
- **shared-utility spec**: a spec for package behaviour that no Yeti item owns.
- **example page**: a showcase page on the docs site. It is not an item and not a spec.
- **overlay**: reserved for Yeti's layout. Avoid it for popovers and dialogs as a group.

### Checked and inferred

- **Checked:**
  - the three counts and their breakdown (local LLMs files, the clone listing, and the live sitemap fetched with `curl`);
  - that names agree across sources;
  - the module-to-item mapping;
  - that no item is deprecated;
  - where the any-element marker rules live;
  - `shell`'s `a11y.notes`;
  - `demo.js`'s purpose;
  - the examples' absence from the clone.
- **Inferred:**
  - that the docs site's source lives outside the clone;
  - that `shell` works on the outermost element an Angular application renders;
  - that a spec-less item works against lazy styles;
  - every Angular shape (taken from the research and prototype tickets, not run here).

### Triage

| Point | Impact | Confidence | Evidence | Outcome |
| --- | --- | --- | --- | --- |
| Unit is one spec per manifest item (49) | HIGH | HIGH | The user's instruction for this ticket. All three sources agree on 49 names. Ticket 07 Q14. | decided |
| No item deferred and none documented usage only | HIGH | HIGH | The instruction ties the count to the sources. The scope-shape ruling. Yeti has no generated-class families. | decided |
| `demo` is a component | MEDIUM | MEDIUM | `demo.js` generates the frame; directives first otherwise (ADR 0003 point 6) | decided |
| Four shared-utility specs | MEDIUM | MEDIUM | Tickets 16, 18, 20, ADR 0003 point 5 | decided; any can merge into an item spec at spec time without changing the item count |
| `shell` placement off `<body>` | LOW | MEDIUM | `shell/manifest.json` `a11y.notes` | decided; the spec confirms |
| Shapes may become components under ticket 13 | MEDIUM | n/a | ticket 13 open | dependency, not open here |

Nothing is `OPEN FOR HUMAN`.

### For the orchestrator: Destination count

53 specs under `specs/`. That is 49 item specs (17 layouts: box, breakout, center, cluster, columns, container, cover, frame, grid, icon, layer, masonry, overlay, scroller, sidebar, stack, timeline; 3 recipes: hero, media, shell; 22 components: accordion, affix, alert, badge, breadcrumbs, button, buttons, card, carousel, demo, dialog, dropdown, field, nav, pagination, progress, seam, spinner, table, tabs, toc, tooltip; 7 utilities: attention, billboard, enter, lede, lift, print, visually-hidden), plus 4 shared-utility specs (navigation-close, fragment-links, events, generated-ids). The Destination becomes 53 specs plus the building-blocks map and the ledger.

Note, 2026-10-02 (orchestrator): the line above was cut off mid-sentence when the agent's response stopped; the orchestrator completed it from the "Shared-utility specs (4)" table (rows 50 to 53).

Note, 2026-10-03 (orchestrator, after audit 0003 M1): the list is now 54 specs. On 2026-10-02 the user chose "Add a `setup` spec (Recommended)" ([map](../map.md), Standing rulings, Ticket 25's open items), a fifth shared-utility spec. Per [ticket 25](25-decide-building-blocks-map.md)'s "For the orchestrator" item 3, it owns the consumer-facing setup: the cascade-layer statement, the `assets` entry for the Yeti build, `provideYetiStyles()`, the package's accessibility stylesheet, and `provideYetiFragmentLinks()`.

Note, 2026-10-03 (orchestrator): "part file" in this ticket now reads "item file", the glossary's name (CONTEXT.md, **Item file**; [ticket 50](50-decide-open-points-of-the-specs.md) decision 7).

Note, 2026-10-03 (orchestrator, full AFK mode): row 30's component has the selector `figure[yetiDemo]`, an attribute-selector component with class `YetiDemo` and `exportAs: 'yetiDemo'`, not an element named `<yeti-demo>` ([ticket 50](50-decide-open-points-of-the-specs.md) decisions 136 and 223). Its kind, a component, stands.
