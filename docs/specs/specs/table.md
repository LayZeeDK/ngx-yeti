# Spec: table (component item)

Ticket: [89. Spec: table (component)](../issues/89-spec-table.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 39, Part 1, and "Hydration constraints (2026-10-03)" (the `table` bullet); [Decide: the spec list](../issues/11-decide-spec-list.md) row 39 and Q9; [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 143 to 151 and Q10, Q15, Q16; [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md); [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 2, 6, 7, 8, 9, 10, 11, 39, 45, and 59; the [icon](icon.md) spec's usage rule 5, the [box](box.md) spec's usage rule 3, and the [scroller](scroller.md) spec's usage rule 1. `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x); `NG/` is `github.com/angular/angular/` at 22.2.x. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 195 to 197), and each is cited where it applies.

## Problem Statement

Yeti's `table` is "A data table styled in place: header rule, row lines, optional stripes, hover, and cell borders, with numeric columns that line up" (`Y/src/components/table/manifest.json`). It is one **Identity class**, `table`, on the `table` element, with six **Attributes**: `data-size` for padding and text size, and the booleans `data-striped`, `data-hover`, `data-border`, `data-nowrap`, and `data-fixed`. Three **Markers** go on its cells: `data-nowrap` on one `th` or `td`, `data-align` on a `th`, `td`, or `tr`, and `data-numeric`, which works on any element and, on a table's cells, also end-aligns the column. The table has no **Module** and no **Event** (manifest `js: null`).

An application developer using the package cannot write `class="table"`, `data-striped`, or `data-numeric`: a consumer writes no Yeti class and no Yeti `data-*` attribute, and directives set them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). A misspelt `data-size="smal"` or `data-align="middle"` is silent in plain Yeti; the package turns it into a compile error ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)). The developer also needs the `table` **Item file** loaded while a table is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)), while `data-numeric` alone, whose figures rule is always loaded, loads nothing.

Three facts make a table harder than other types-only items:

- **Hydration.** The browser's HTML parser inserts a `tbody` into a `table` written without one, so a template with `<table><tr>` gives a different DOM on the server and the client, which is one of Angular's documented hydration mismatches (`NG/adev/src/content/guide/hydration.md:113-125`, read; building-blocks "Hydration constraints (2026-10-03)").
- **Presentational HTML attributes.** Three of the input names are also old HTML attributes on these elements: `border` on a `table` and `align` on `th`, `td`, and `tr` draw borders and alignment of their own, and `nowrap` on a cell keeps its line (ticket 26 Q15).
- **Semantics.** A table is read through its structure: a name, header cells, and `scope`. Yeti's `a11y` note asks the author for all three, and says a wide table goes inside a `scroller` "so it stays a table for assistive tech" (manifest `a11y.notes`). None of it is something a directive can write for the consumer.

## Solution

One **Item directive**, one **Part directive**, and one any-element marker directive, in the secondary entry point `ngx-yeti/table` (building-blocks Part 2 row 39; [Decide: the spec list](../issues/11-decide-spec-list.md) row 39 and Q9):

- `YetiTable`, selector `table[yetiTable]`, `exportAs: 'yetiTable'`. It binds `table` as a static host class, sets `data-ngx-yeti-item-table` on its host, and acquires the `table` item file with `injectYetiItemStyles('table')` as the last statement of its constructor ([setup](setup.md); [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); ADR 0060 point 2). Inputs: `size` (`YetiSizeControl`) and the booleans `striped`, `hover`, `border`, `nowrap`, and `fixed`, each bound as its `data-*` attribute and rendering nothing when unset. It binds the HTML `border` attribute to `null`.
- `YetiTableCell`, selector `th[yetiTableCell], td[yetiTableCell], tr[yetiTableCell]`, `exportAs: 'yetiTableCell'`. Inputs: `nowrap` (`boolean`) for one cell's `data-nowrap`, and `align` (`YetiTableAlign`, which is `Extract<YetiAlign, 'start' | 'center' | 'end'>`) for a cell's or a row's `data-align`. It binds the HTML `align` attribute to `null` (ticket 26 rows 150 and 151).
- `YetiNumeric`, selector `[yetiNumeric]`, `exportAs: 'yetiNumeric'`, input `yetiNumeric` (`boolean`): `<td yetiNumeric>` renders `data-numeric`. It binds no class, sets no presence attribute, and acquires no item file, because its figures rule is in the always-loaded `layouts/attributes.css` (ticket 26 row 149, kind G; ticket 50 decision 7).
- A Part directive for a pinned header row, `YetiTableHead` on `thead[yetiTableHead]` with a `sticky` input that renders `data-sticky` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 195). Yeti's docs, CSS, and tests pin a `thead` with `data-sticky`, but the table's manifest declares no such marker, so no record mapped it before that decision.

Everything else is Yeti's CSS and the platform. The table keeps its native role and its native header relationships; the package adds no role, no Aria `Grid`, and no CDK table (Part 2 row 39). Every value is a host binding on an input signal, so the server HTML is Yeti's documented markup and the table renders the same before hydration, after it, with JavaScript off, and inside any `@defer` or hydrate block. The package writes no **Token** ([ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md)).

The hydration fact becomes a **Usage rule**: every table template writes an explicit `tbody`, its rows as `tr` elements, and text only inside cells and the caption. The semantic facts become usage rules for the name and `scope`, play-function assertions on the computed table, and contrast assertions with the exact WCAG formula ([ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md) points 2 to 4).

## User Stories

1. As an application developer, I want to style a data table with one directive attribute on the `table`, so that I never write Yeti's `table` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="table"` in the DOM, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want the table directive to match only a `table` element, so that putting it on a `div` fails to apply instead of styling a fake table.
4. As an application developer, I want to set the density with a typed `size` input (`sm`, `md`, `lg`), so that a misspelt size fails to compile.
5. As an application developer, I want a table with no `size` to get Yeti's default density, so that the plain directive looks right.
6. As an application developer, I want the package not to write Yeti's default `md` into my markup, so that a pin move that changes the default reaches my page.
7. As an application developer, I want `striped` to tint every other body row, so that long rows are easy to follow.
8. As an application developer, I want `hover` to tint the row under the pointer, so that a pointer user can follow a row across.
9. As an application developer, I want `border` to draw every cell's border, so that a dense grid of numbers reads as a grid.
10. As an application developer, I want `<table yetiTable border>` to draw only Yeti's cell borders, not the browser's old `border` attribute look, so that the table matches Yeti's design.
11. As an application developer, I want `nowrap` on the table to keep every cell on one line, so that a wide result stays compact inside a scroller.
12. As an application developer, I want `nowrap` on one cell to keep only that cell's line, so that a single long value does not wrap.
13. As an application developer, I want `fixed` to give every column an equal share of the width, so that a comparison reads across.
14. As an application developer, I want a width on a first-row header cell to widen that column under `fixed`, so that a feature column can be wider than the plan columns.
15. As an application developer, I want `align` on a cell to align that cell, so that a centred tick or an end-aligned label sits where I want it.
16. As an application developer, I want `align` on a row to align every cell in it, so that I set a row's alignment once.
17. As an application developer, I want a cell's own `align`, or its `yetiNumeric`, to win over its row's, so that one cell can differ from its row.
18. As an application developer, I want the `align` input typed with only `start`, `center`, and `end`, so that a value Yeti's table does not support, such as `stretch`, fails to compile.
19. As an application developer, I want to write `align="center"` statically on a cell, so that the input works like every other static input.
20. As an application developer, I want the HTML `align` attribute never to reach the server HTML or a painted frame, so that the browser's old alignment hint never fights Yeti's.
21. As an application developer, I want to mark a column of numbers with `yetiNumeric` on its cells and header, so that the digits line up and the column is end-aligned.
22. As an application developer, I want `yetiNumeric` on any element outside a table, a price or a legend's values, so that figures line up anywhere.
23. As an application developer, I want `yetiNumeric` to load no stylesheet on its own, so that marking a price costs no request.
24. As an application developer, I want to pin the header row while the rows scroll under it, as Yeti's docs show, so that a long table keeps its column names in view ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 195).
25. As an application developer, I want a wide table to scroll inside a `scroller` while the table stays a table, so that I follow Yeti's docs without turning rows into cards.
26. As an application developer, I want the usage rules to tell me to write an explicit `tbody`, so that my server-rendered tables hydrate without a mismatch.
27. As an application developer, I want the usage rules to tell me how to write a row component, so that a component that renders rows keeps the table valid.
28. As an application developer, I want rows from `@for` and `@if` to stripe correctly, so that Angular's control flow does not break the alternating tint.
29. As an application developer, I want the `table` item file loaded when the first table renders and removed after the last leaves, so that I do not import `table.css` globally.
30. As an application developer, I want the item file in the server HTML when a server-rendered page has a table, so that the first paint is styled.
31. As an application developer, I want tables styled with JavaScript off under SSR and prerendering, so that the data reads correctly before any script runs.
32. As an application developer, I want hydration to change nothing on a table, so that I get no `NG05xx` error and no flash.
33. As an application developer, I want every input to work under zoneless change detection, so that a bound `striped` or `align` updates without zone.js.
34. As an application developer, I want a table inside a `hydrate never` block to stay styled for as long as it is on the page, so that a dehydrated block is not unstyled when a live table elsewhere leaves.
35. As an application developer, I want to know that a table inside a client-only `@defer` block needs `table` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
36. As an application developer using `withI18nSupport()`, I want a translated caption and translated cells to hydrate without being re-rendered, so that localised pages keep the server's DOM.
37. As an application developer, I want to bind a value newer than the pin through the input with `$any`, so that I know the escape hatch when Yeti adds a value before the package does.
38. As an application developer, I want template references (`#t="yetiTable"`, `#c="yetiTableCell"`), so that the directives follow the package's `exportAs` rule.
39. As an application developer, I want the usage rules to say not to put `yetiBorder` or `yetiIcon` on the table's elements, so that two directives never fight over one attribute.
40. As an application developer, I want to set the stripe, border, and header-rule colours with Yeti's tokens in my stylesheet, so that my theme controls them.
41. As an application developer using Tailwind v4 beside the package, I want to know that `table` collides with a Tailwind name, so that I can plan my cascade-layer statement.
42. As a screen-reader user, I want the table announced as a table with its rows, columns, and headers, so that I can move by cell and hear each cell's headers.
43. As a screen-reader user, I want every table to have a name from its caption or a label, so that I know which table I am in.
44. As a screen-reader user, I want header cells to carry `scope`, so that each data cell is announced with its row and column headers.
45. As a screen-reader user, I want a wide table inside a scroller to stay a table, never stacked cards, so that the relationships I depend on survive narrow screens.
46. As a keyboard user, I want the table to add no tab stop, and a wide table's scroller to be one, so that I can scroll a wide table without a pointer.
47. As a low-vision user, I want cell text, header text, the caption, striped rows, and the hovered row to meet 4.5:1 in light and dark schemes, so that I can read every row.
48. As a low-vision user, I want a page with a wide table to reflow at 320 CSS pixels with only the table's own region scrolling sideways, so that the rest of the page never scrolls in two directions.
49. As a low-vision user who overrides text spacing, I want cells to grow rather than clip, so that my spacing settings keep every value visible.
50. As a forced-colours user, I want the cell borders and the header rule to stay visible, so that the grid of a bordered table remains ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 197).
51. As a package maintainer, I want the contract check to cover the table's class, six attributes, three markers, and their unions, so that a pin move that adds a value or a marker fails before release.
52. As a package maintainer, I want the SSR smoke to assert the server HTML of a table with every input, a static `border` and `align`, and an explicit `tbody`, so that the first paint is proven.
53. As a package maintainer, I want the fixture app to render a table route prerendered and server-rendered, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
54. As a package maintainer, I want a negative-control route without a `tbody` to record the hydration error, so that the usage rule's reason stays proven.
55. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default does not fail a test for no reason.
56. As a package maintainer, I want every exported class and type name checked against Yeti's typings at the pin, so that a collision is caught.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/table/manifest.json`, `table.css`, `docs.md`, `example.html`, and Yeti's own test `Y/test/browser/components/table.spec.js` with its fixture `Y/test/browser/fixtures/components/table.html`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `table`, `component`, `Content` |
| `class` | `table` |
| `attributes` | `data-size` (enum, vocabulary `size-control`: `sm`, `md`, `lg`; default `md`); `data-striped`, `data-hover`, `data-border`, `data-nowrap`, `data-fixed` (boolean, no default) |
| `classes` | empty |
| `children` | `> caption` (0 to 1, "The table's title"); `> thead` (0 to 1; "With data-sticky it pins at --yeti-sticky-offset as the rows scroll under it, painted with the surface and carrying its rule"); `> tbody` (**min 1**, no max, "The rows"); `[data-numeric]` (0 or more) |
| `markers` | `data-numeric` (boolean, `on: "*"`); `data-nowrap` (boolean, `on: "th, td"`); `data-align` (enum with its own values `start`, `center`, `end`, `on: "th, td, tr"`: "A cell's own data-align or data-numeric outranks its row's") |
| `tokens` | public: `--yeti-table-stripe`, `--yeti-table-border`, `--yeti-color-border-strong`, `--yeti-text-md`, `--yeti-space-sm`, `--yeti-weight-strong`, `--yeti-border-width`, `--yeti-color-surface`, `--yeti-color-surface-sunken`; private: `--_yeti-size-text`, `--_yeti-size-space` |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "Give the table a caption, or aria-label / aria-labelledby. Header cells carry scope="col" or scope="row". A table wider than its container goes inside a scroller with tabindex="0" and a label; the table itself never changes shape, so it stays a table for assistive tech." |
| `js` | `null`: no Module, no Events |
| `support` | `unguarded`: logical properties, `font-variant-numeric`; `guarded`: none |
| `since` | `7.0.0` |

`table.css` (`@layer yeti.components`) sets the table full width with collapsed borders and the size text (`:4-9`), gives the caption padding, start alignment, and strong weight (`:10-14`), pads every cell from the size step with a row rule beneath it (`:15-20`), gives head cells the strong weight and the strong rule (`:21-24`), end-aligns `.table [data-numeric]` (`:25-27`), keeps lines with the table's or a cell's `data-nowrap` (`:30`), sets `table-layout: fixed` (`:34`), aligns cells by their own `data-align` and rows by theirs, the row rule lowered with `:where` so a cell's own value or `data-numeric` wins (`:38-43`), tints even body rows (`:44`) and the hovered body row (`:45`), draws every cell's border with `data-border` (`:46-47`), and paints a `thead[data-sticky]`'s cells with the surface and an inset rule (`:53-57`). The always-loaded group adds three rules the item relies on: the `data-size` steps (`Y/src/layouts/attributes.css:256-259`), tabular figures on any `[data-numeric]` (`:458-460`), and `[data-border]:not(.table)` (`:462-465`), which leaves the table out "because its data-border means borders on every cell". The `[data-sticky]` rule that pins any marked element is also always loaded (`:318-344`). The base styles give a bare `table` full width, collapsed borders, padded cells with a row line, and a small muted caption (`Y/src/base/reset.css:70-73`, `controls.css:43-58`).

Attributes left to the consumer: none of Yeti's `data-*` (ticket 26). The consumer's own HTML, which no directive writes: the `caption` or `aria-label` or `aria-labelledby`, `scope` on header cells, `colspan`, `rowspan`, `headers`, and any inline width on a header cell under `fixed` (`docs.md`: `<th style="inline-size: 40%">`).

### 2. Contract mapping

| Contract piece | Yeti | Package | HTML attribute kind (building-blocks 1.4) | Record |
| --- | --- | --- | --- | --- |
| Identity class | `table` | static host class on `table[yetiTable]` (`YetiTable`) | not applicable | ADR 0003 point 1; Part 2 row 39 |
| Attribute `data-size` | padding and text size; default `md` | `size` on `yetiTable`: `YetiSizeControl`, unset renders nothing | `inert`: HTML `size` belongs to form controls and does nothing on a `table` | ticket 26 row 143 (R); ADR 0070 rule 1 |
| Attribute `data-striped` | tint even body rows | `striped` on `yetiTable`: `boolean`, `booleanAttribute` | not an HTML attribute | ticket 26 row 144 (R) |
| Attribute `data-hover` | tint the hovered body row | `hover` on `yetiTable`: `boolean`, `booleanAttribute` | not an HTML attribute | ticket 26 row 145 (R) |
| Attribute `data-border` | every cell's border | `border` on `yetiTable`: `boolean`, `booleanAttribute` | `removed`: `'[attr.border]': 'null'` | ticket 26 row 146 (R) and Q15; ticket 50 decision 9 |
| Attribute `data-nowrap` | every cell keeps its line | `nowrap` on `yetiTable`: `boolean`, `booleanAttribute` | `inert`: HTML `nowrap` is a cell attribute and does nothing on a `table` | ticket 26 row 147 (R) |
| Attribute `data-fixed` | fixed table layout | `fixed` on `yetiTable`: `boolean`, `booleanAttribute` | not an HTML attribute | ticket 26 row 148 (R) |
| Marker `data-numeric` (`on: "*"`) | tabular figures anywhere; end-aligned in a table | `yetiNumeric` on `[yetiNumeric]` (`YetiNumeric`): `boolean`, `booleanAttribute` | `yetinumeric` is not an HTML attribute | ticket 26 row 149 (G); ADR 0070 kind G |
| Marker `data-nowrap` (`on: "th, td"`) | this cell keeps its line | `nowrap` on `yetiTableCell` (`YetiTableCell`): `boolean`, `booleanAttribute` | `removed`: `'[attr.nowrap]': 'null'` on `th`, `td`, and `tr`, because HTML's `nowrap` is obsolete ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 196) | ticket 26 row 150 (C) and Q15; ticket 50 decisions 9 and 196 |
| Marker `data-align` (`on: "th, td, tr"`) | aligns a cell, or a row's cells | `align` on `yetiTableCell`: `YetiTableAlign`, unset renders nothing | `removed`: `'[attr.align]': 'null'` | ticket 26 row 151 (C) and Q15; ticket 50 decision 9 |
| `data-sticky` on `> thead` (named in `children`, not declared as a marker) | pins the header row | `sticky` on `thead[yetiTableHead]` (`YetiTableHead`): `boolean`, `booleanAttribute` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 195) | not an HTML attribute | ticket 50 decision 195; manifest `children` `> thead` |
| Children `> caption`, `> thead`, `> tbody` | the title, the header row, the rows | the consumer's elements; `tbody` required by usage rule 1 | not applicable | manifest `children`; building-blocks "Hydration constraints (2026-10-03)" |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Tokens `--yeti-table-stripe`, `--yeti-table-border` | the stripe fill; row and cell borders | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--yeti-color-border-strong`, `--yeti-color-surface`, `--yeti-color-surface-sunken` | the header rule; a pinned head's fill; the hovered row | the consumer's | not applicable | ADR 0004 |
| Tokens `--yeti-text-md`, `--yeti-space-sm`, `--yeti-weight-strong`, `--yeti-border-width` | default text size and space step; caption and header weight; rule width | the consumer's | not applicable | ADR 0004 |
| Token `--yeti-sticky-offset` | where a pinned head stops (read by the always-loaded `[data-sticky]` rule) | the consumer's; may be set on the `thead` | not applicable | ADR 0004; `docs.md` |
| Private tokens `--_yeti-size-text`, `--_yeti-size-space` | Yeti's | never read or written | not applicable | ADR 0004; CONTEXT.md **Private token** |
| Host attribute (package) | not Yeti's | static `data-ngx-yeti-item-table` (empty value) on `table[yetiTable]` only | not applicable | [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md); ticket 50 decision 6 |
| Injection token | not Yeti's | `yetiTableToken`, provided by `YetiTable` | not applicable | ADR 0070 kind C; building-blocks 1.9 |

`YetiTableAlign` is `Extract<YetiAlign, 'start' | 'center' | 'end'>`. ADR 0070 rule 2 gives an attribute with its own value list the `Extract` of the vocabulary that holds its values, and ADR 0080 point 5 names a package-declared type `Yeti<Item><Input>`; the [scroller](scroller.md) spec's `YetiScrollerJustify` is the precedent ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 60). It is exported beside the re-exported vocabulary types.

The `removed` kind for `border` on a `table`: HTML's `border` attribute on a `table` is a presentational hint that draws an outer border and, through the user agent's own rules, a border on every cell. The directive binds `[attr.border]` to `null`, with a source comment naming that effect, so `<table yetiTable border>` renders only `data-border` and Yeti's cell borders. A static `border` that hydration writes back before the `null` binding removes it in the same pass is accepted; the SSR smoke writes the static form and layer 4 asserts that no frame paints with `border` present ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 9, a trap-quadrant decision whose record is there).

The `removed` kind for `align` on `th`, `td`, and `tr`: HTML's `align` on these elements is a text-alignment hint. The directive binds `[attr.align]` to `null`, with the same comment, as Material's `MatHint` does for `align`. Static `align="center"` is accepted on the same terms as `border` (decision 9).

The `removed` kind for `nowrap` on a cell: ticket 26 row 150 recommended `output`, because HTML's `nowrap` on a `th` or `td` means what `data-nowrap` means. But the HTML attribute is obsolete, so a cell carrying it would hold an attribute the Nu Html Checker reports, which Yeti's own markup never has, and `data-nowrap` already keeps the line. The directive binds `'[attr.nowrap]': 'null'` on all three hosts, with the same comment as `align`, so the server HTML stays Yeti's documented markup. Static `nowrap` is accepted on the same terms as `border` and `align` (decision 9) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 196).

The `inert` kinds: a static `size="sm"` or `nowrap` on a `table` stays on the element beside its `data-*` form and does nothing, because neither is a `table` attribute (ticket 26 rows 143 and 147); the directive binds nothing for them.

**Module replaced:** none. Yeti's `table` has no Module (manifest `js: null`; Part 2 row 39, "Yeti module: none"; [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md)). So no module behaviour is kept, changed, or removed. Every behaviour the item has is Yeti's CSS and the platform's:

| Behaviour | Whose | What the package does |
| --- | --- | --- |
| Table semantics, header association, `scope` | the platform's | nothing; the consumer writes the structure (usage rules 1, 4, 5) |
| Row tint under the pointer | Yeti's CSS (`:hover`) | renders `data-hover` from `hover` |
| A pinned header row | Yeti's CSS and the always-loaded `[data-sticky]` rule | renders `data-sticky` from `YetiTableHead`'s `sticky` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 195) |
| Sideways scrolling of a wide table | the `scroller` item | nothing here; the consumer wraps the table in `yetiScroller` (usage rule 7) |

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The table reads the nine public tokens above and `--yeti-sticky-offset` through the always-loaded sticky rule. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block in any stylesheet, in a **Theme** file after Yeti, or with a runtime `setProperty`. The stripe, border, and surface tokens are derived colour roles and may also be set on a table; `--yeti-sticky-offset` may be set on the `thead`, as Yeti's docs say ("Set the offset to `0` on the `thead` to pin it flush with the top"). Hues, chroma, and the scale stay on `:root` (`Y/src/guides/theming.md:38`). The scheme is the consumer's `color-scheme` (building-blocks 1.13).

### 3. Hierarchy and DI shape

- `YetiTable` provides `yetiTableToken` (`InjectionToken<YetiTable>`, `useExisting`), building-blocks 1.9 and 1.3's token naming.
- `YetiTableCell` injects it with `{ optional: true, skipSelf: true }` (ADR 0070 kind C). The cell reads nothing from the token in the first milestone: no behaviour depends on the table, and an **In-item check** that would use it belongs to a later milestone (map, Milestones). A cell of a table with no `yetiTable` renders its markers, which then do nothing, because Yeti scopes them under `.table` (`table.css:30`, `:38-43`). The token is absent when rows come from another component's template (building-blocks 1.9, content projection); the cell does not need it.
- `YetiTableHead` injects the token the same way and reads nothing ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 195).
- `YetiNumeric` injects nothing.
- One directive serves cells and rows, as ticket 26 row 151 and Part 2 row 39 name it: `align` is one marker on `th`, `td`, and `tr`, and a part's name is the spec's to fix (CONTEXT.md **Part**). `nowrap` is declared on the same directive but has a rule only on `th` and `td`; usage rule 3 keeps it off a `tr`.
- No host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix").
- Shared input names (building-blocks 1.4, shared vocabularies). `size` is `YetiSizeControl` on every item that has it, and `fixed` is `boolean` on `yetiOverlay` too. `align` on `yetiTableCell` is narrower than the `YetiAlign` that `icon`, `cluster`, `columns`, `layer`, `sidebar`, `stack`, `hero`, and `media` declare. So no item directive that declares `align` goes on a `yetiTableCell` host: a layout or an icon goes inside the cell (usage rule 6; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 39, which the [icon](icon.md) spec states from its side).
- One attribute, two owners: `[yetiBorder]` and `yetiTable`'s `border` both bind `data-border`, so they never share a host (usage rule 6; ticket 26 Q16; the [box](box.md) spec's usage rule 3).
- The only other injection is the root styles service of ADR 0060, reached through `injectYetiItemStyles('table')` in `YetiTable`'s constructor ([setup](setup.md); ticket 50 decision 45). `YetiTableCell` and `YetiTableHead` set no presence attribute and acquire nothing, because Yeti's rules for them apply only under `.table`, whose own host keeps the link ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 6). `YetiNumeric` sets none and acquires none (decision 7).
- Generated ids and the platform's relationship attributes: none. The table renders no `id` and references none, so it does not use [generated-ids](generated-ids.md). An `aria-labelledby` on the table, and the `id` a `headers` attribute points at, are the consumer's own static ids.

### 4. API

**`YetiTable`**

| Member | Value |
| --- | --- |
| Class | `YetiTable`. Checked at the Pin against the 46 names `yeti.d.ts` exports: no `YetiTable` (ADR 0080 point 4; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 10) |
| Selector, `exportAs` | `table[yetiTable]`, `yetiTable` (Part 2 row 39; building-blocks 1.3) |
| Host | `class: 'table'`; `'data-ngx-yeti-item-table': ''` (static); `[attr.data-size]` from `size`, `null` when unset; `[attr.data-striped]`, `[attr.data-hover]`, `[attr.data-border]`, `[attr.data-nowrap]`, `[attr.data-fixed]`: `''` when true, `null` when false; `'[attr.border]': 'null'` (removed kind) |
| Inputs | `size: YetiSizeControl \| undefined`, default `undefined` (Yeti's `md` applies from its CSS); `striped`, `hover`, `border`, `nowrap`, `fixed`: `boolean`, `booleanAttribute`, default `false` (ADR 0070 rule 1) |
| Models, outputs, methods | none |
| Providers | `{ provide: yetiTableToken, useExisting: YetiTable }` |
| Lifecycle | `injectYetiItemStyles('table')` as the last statement of the constructor, after anything that can throw, which acquires the item file and releases it through `DestroyRef` ([setup](setup.md); ticket 50 decisions 42 and 45) |

**`YetiTableCell`**

| Member | Value |
| --- | --- |
| Class | `YetiTableCell` (free of the 46 names) |
| Selector, `exportAs` | `th[yetiTableCell], td[yetiTableCell], tr[yetiTableCell]`, `yetiTableCell` |
| Host | `[attr.data-nowrap]`: `''` when `nowrap` is true, `null` otherwise; `'[attr.nowrap]': 'null'` (removed kind; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 196); `[attr.data-align]` from `align`, `null` when unset; `'[attr.align]': 'null'` (removed kind) |
| Inputs | `nowrap: boolean`, `booleanAttribute`, default `false`; `align: YetiTableAlign \| undefined`, default `undefined` |
| Models, outputs, methods | none |
| DI | `inject(yetiTableToken, { optional: true, skipSelf: true })`, unread |

**`YetiNumeric`**

| Member | Value |
| --- | --- |
| Class | `YetiNumeric` (free of the 46 names; ticket 50 decision 11 names the marker classes) |
| Selector, `exportAs` | `[yetiNumeric]`, `yetiNumeric` |
| Input | `yetiNumeric: boolean`, `booleanAttribute`, default `false` |
| Host | `[attr.data-numeric]`: `''` when true, `null` when false |
| Class, presence attribute, item file | none |

**`YetiTableHead`** ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 195)

| Member | Value |
| --- | --- |
| Class | `YetiTableHead` (free of the 46 names) |
| Selector, `exportAs` | `thead[yetiTableHead]`, `yetiTableHead` |
| Input | `sticky: boolean`, `booleanAttribute`, default `false`, the same name and type as `sticky` on `yetiStackChild`, `yetiSidebarChild`, `yetiShellRegion`, and `yetiNav` (ticket 26 rows 60, 67, 86, 126) |
| Host | `[attr.data-sticky]`: `''` when true, `null` when false |
| Class, presence attribute, item file | none |

**Type:** `YetiTableAlign = Extract<YetiAlign, 'start' | 'center' | 'end'>`, exported from `ngx-yeti/table` (section 2).

**Usage rules** (numbered here and in each directive's JSDoc; the first milestone reports no breach, map, Milestones):

1. Write the table's structure as the HTML parser builds it: an explicit `tbody` around the body rows, a `tr` inside `thead`, rows as `tr` elements, and text only inside a `caption`, `th`, or `td`. The browser inserts a missing `tbody` and moves misplaced content out of the table, so the server's DOM and the client's would differ, which is a hydration mismatch (building-blocks "Hydration constraints (2026-10-03)"; `NG/adev/src/content/guide/hydration.md:119`, `:125`, read). `@for`, `@if`, and `ng-container` add no element, so rows they render are fine.
2. A component that renders a row is an attribute-selector component on a `tr` (`<tr appTrailRow [trail]="t">`), as Material's rows are (`tr[mat-row]`, `NC/src/material/table/row.ts:111`); never an element-selector host such as `<app-trail-row>` inside a `tbody`. The parser moves an unknown element in a `tbody` out of the table (the HTML parser's "in table" insertion mode, inferred from the specification, not measured), which breaks usage rule 1.
3. Put `yetiTableCell` on a `th`, `td`, or `tr` of a `yetiTable`. `nowrap` belongs on a `th` or `td`; on a `tr` it does nothing, because Yeti's rule is for cells (`table.css:30`; manifest `data-nowrap` `on: "th, td"`). To keep a whole table's lines, use the table's `nowrap`.
4. Name every table: a `caption` as the table's first child, or `aria-label` or `aria-labelledby` on the `table` (manifest `a11y.notes`; building-blocks 1.10, Names). Translate a caption with `i18n` and an `aria-label` with `i18n-aria-label`. The directive declares no name input.
5. Give header cells `scope="col"` or `scope="row"` (manifest `a11y.notes`). Use `headers` with consumer ids only for a table whose headers `scope` cannot express.
6. Do not write `class="table"`, a static `data-size`, `data-striped`, `data-hover`, `data-border`, `data-nowrap`, `data-fixed`, `data-align`, `data-numeric`, `data-sticky`, or `data-ngx-yeti-item-table`: the directives bind them, and hydration writes a static attribute again before the binding wins (ADR 0003; ADR 0070's 2026-10-03 note; building-blocks "Hydration constraints (2026-10-03)"). The static `align` and `border` input forms are accepted (section 2). A value newer than the pin is bound as `[size]="$any('xl')"` (ADR 0070). Do not put `yetiBorder` on a `table[yetiTable]`: use the table's `border` input, because both bind `data-border` and Yeti's border marker skips `.table` (ticket 26 Q16; `attributes.css:462-465`). Do not put `yetiIcon`, or any other item directive that declares `align`, on a `yetiTableCell` host: put it inside the cell, as Yeti's docs wrap a tick in an `icon` (`docs.md`; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 39; building-blocks 1.4).
7. Put a table wider than its container inside a `yetiScroller`, as its one child, and name the scroller; never put `yetiScroller` on the `table` itself, because its `role="region"` would replace the table's role ([scroller](scroller.md) usage rules 1 and 2; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 59). With `nowrap`, a scroller is where the kept lines go (`docs.md`).
8. Keep the table a table: put no directive or style that changes `display` on the `table`, its rows, or its cells, and never restyle rows as cards at narrow widths (manifest `a11y.notes`: "the table itself never changes shape"). A layout goes inside a cell, not on it.
9. Put the same `yetiNumeric` on a numeric column's header cell and its data cells, so that the header aligns with its figures (`docs.md`). A cell's own `align` outranks its `yetiNumeric`, and a cell's `yetiNumeric` outranks its row's `align` (`table.css:25`, `:38-43`).
10. A pinned head (`sticky` on `yetiTableHead`) pins to the nearest scroll container. Inside a `scroller`, which scrolls sideways and so is also a scroll container on the other axis, the head does not pin to the page (inferred from CSS sticky positioning and `scroller.css:7`, not measured). Where the stuck head can sit above focusable content in the rows, set `--yeti-scroll-padding` on `:root` to at least the offset plus the head's height ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 195).
11. Import each directive in every component whose template writes its attribute. A **Forgotten import** of `YetiTable`, `YetiTableCell`, or `YetiNumeric` with no bound input renders the bare element with Yeti's base table look and no error; a bound input makes the compiler report it (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `table` | Angular Material `MatTable` |
| --- | --- | --- |
| Shape | attribute directives on the consumer's native `table`, rows written in the consumer's template | `table[mat-table]` (`NC/src/material/table/table.ts:32`), a component that renders rows from a `dataSource` through CDK's row and cell definitions (`cell.ts:25-101`) |
| Header cells and rows | the consumer's `th`, `tr`, with `scope` | `th[mat-header-cell]`, `td[mat-cell]` (`cell.ts:82`, `:101`); CDK sets cell roles from the table's own role (`NC/src/cdk/table/table.ts:480-482`) |
| Pinned header | `sticky` on `thead[yetiTableHead]`, Yeti's CSS ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 195) | `sticky` on `cdkHeaderRowDef` (`NC/src/cdk/table/row.ts:87`, `:95-106`), applied by CDK's sticky styler |
| Density, stripes, borders | `size`, `striped`, `hover`, `border`, `nowrap`, `fixed` from Yeti's attributes | theme density; no stripe or border input |
| Numbers | `yetiNumeric`: tabular figures and end alignment | none; the author's own styles |
| Sorting, paging, selection | none | `MatSort`, `MatPaginator`, a selection model |
| Accessibility | the native table's semantics, the consumer's name and `scope` | the same native table semantics; the name is the author's |

Nothing from Material's API is adopted. Its value is rendering rows from data, which the consumer's `@for` does here, and Part 2 row 39 rules CDK's table out for that reason. The pinned-header comparison is recorded because it is the one feature both have.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 39; building-blocks 1.2). The reason, row 1's, which row 39 takes: Yeti's CSS does the whole job, and the directives add the class, the typed attributes and markers, the item-file acquisition, and `exportAs`. Logical properties, `font-variant-numeric`, `table-layout`, `position: sticky`, and `:where()` are inside Baseline 2025 (manifest `support`; building-blocks 1.2).

Not used, with the reason from Part 2 row 39: Aria's `Grid` (`NC/src/aria/grid/grid-row.ts:36`, `grid-cell.ts:44`), because "a static table is not a grid composite", and a grid role is a promise of a full keyboard table the static data does not need (building-blocks 1.10, "a role is a promise"); CDK's table (`NC/src/cdk/table/table.ts:278`), because it "renders rows from data, which the consumer's template does". No CDK piece is used: there is no id, focus, keyboard, direction, or observer. Yeti's CSS is logical (`text-align: start`, `border-block-end`, `padding-block`), so right-to-left needs nothing from the package.

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** the APG's Table pattern (`content/patterns/table/` in the APG at `3f094fd`), a static `table` with native semantics: no `grid` role and no keyboard of its own. The package adds no role, state, or property.
- **Keyboard:** none. The table adds no tab stop. A wide table's keyboard path is its `scroller`, a focusable scroll container whose arrow keys are the browser's ([scroller](scroller.md) section 6).
- **Names:** the consumer's caption or label (usage rule 4).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The native `table`, `caption`, `thead`, `tbody`, `th`, and `scope` carry the structure; the directives add no role and change no element (Part 2 row 39). The name and `scope` are the consumer's (usage rules 4 and 5) and every story writes them. Stripes, hover, and borders carry no meaning the DOM must also carry. |
| 1.3.2 Meaningful Sequence | The table's DOM order is its reading order; Yeti never reorders or stacks it (usage rule 8). |
| 1.4.1 Use of Color | Not claimed by the directives: a status shown only by a cell's colour is the author's to also state in text. Stripes and the hover tint are visual aids that carry no information. |
| 1.4.3 Contrast (Minimum) | Yeti's own test asserts AA on header and body text, on a plain and a striped row, in light and dark (`table.spec.js:44-52`). Play functions compute, with the exact WCAG formula, unrounded, the header text, a body cell, a striped row's cell, the hovered row's cell, and the caption (small and muted from the base styles, `controls.css:46-50`) against their computed backgrounds, asserting at least 4.5:1 in light and dark schemes ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 8). |
| 1.4.10 Reflow | A wide table is the two-dimensional exception the criterion allows; it scrolls inside its `scroller` region, never the page (usage rule 7; Yeti's own test, `table.spec.js:38-42`). Layer 4 asserts no page overflow at 320 CSS pixels with a wide table in a scroller. |
| 1.4.11 Non-text Contrast | Not claimed. Row rules, cell borders, stripes, and the hover tint mark no UI component or state. |
| 1.4.12 Text Spacing | The rules set no height and no overflow on cells; overridden spacing grows the rows (read). `nowrap` cells grow sideways into the scroller. |
| 2.1.1 Keyboard | The table has nothing to operate. A wide table's scroller takes focus and scrolls with the arrow keys (usage rule 7). |
| 2.4.11 Focus Not Obscured (Minimum) | Only with a pinned head over focusable cell content: the table shares ledger row [A11Y-22](../ledger.md), through usage rule 10 and the layer-4 Shift+Tab walk ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 195). |
| 4.1.2 Name, Role, Value | The native `table` role and the consumer's name (usage rule 4). |

Forced colours: the platform replaces backgrounds, so the stripes and the hover tint disappear, while row rules, cell borders, and the header rule take system colours and stay (inferred, not measured). Neither tint draws a state, and forced colours is not an AA criterion of its own (ticket 17 section 2.6; ADR 0015 consequences). This spec adds no ledger row and no package CSS for it; layer 4 records the borders under `forcedColors: 'active'` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 197).

**Ledger rows owned:** none (Part 2 row 39, "Ledger: none"). Ticket 17 measured Yeti's table example as conforming. A pinned head shares the row [A11Y-22](../ledger.md), owned by `sidebar` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 195).

### 8. Rendered HTML

Consumer markup, after Yeti's `example.html`:

```html
<table yetiTable striped>
  <caption i18n>Summits</caption>
  <thead>
    <tr><th scope="col">Peak</th><th scope="col" yetiNumeric>Height (m)</th></tr>
  </thead>
  <tbody>
    @for (summit of summits(); track summit.name) {
      <tr><td>{{ summit.name }}</td><td yetiNumeric>{{ summit.height }}</td></tr>
    }
  </tbody>
</table>
```

Server HTML and the hydrated DOM are the same. The `table` carries the consumer's static attributes as Angular renders them (`yetitable=""`, `striped=""`) and from the package `class="table"`, `data-ngx-yeti-item-table=""`, and `data-striped=""`; each numeric cell carries `yetinumeric=""` and `data-numeric=""`. The server also writes one item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>components/table/table.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="table"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The client adopts it at bootstrap.

Yeti's comparison example, with the static presentational forms:

```html
<table yetiTable fixed border aria-label="Plans compared" i18n-aria-label>
  <thead>
    <tr>
      <th scope="col" style="inline-size: 40%">Feature</th>
      <th scope="col" yetiTableCell align="center">Free</th>
      <th scope="col" yetiTableCell align="center">Walker</th>
    </tr>
  </thead>
  <tbody>
    <tr yetiTableCell align="center">
      <th scope="row" yetiTableCell align="start">Offline maps</th>
      <td>No</td>
      <td><span yetiIcon><svg aria-hidden="true" viewBox="0 0 16 16"><!-- tick --></svg></span><span yetiVisuallyHidden>Included</span></td>
    </tr>
  </tbody>
</table>
```

Server HTML: the `table` has `data-fixed=""` and `data-border=""` and no `border` attribute; each `yetiTableCell` host has its `data-align` and no `align` attribute. A `<td yetiTableCell nowrap>` renders `data-nowrap=""` and no `nowrap` attribute ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 196). A `<p>Total: <span yetiNumeric>1,345</span></p>` outside any table renders `data-numeric=""` and nothing else from the package: no class, no presence attribute, no link.

The delta from Yeti's docs markup: the consumer writes `yetiTable` and inputs where the docs write the class and `data-*` attributes, `yetiTableCell` with `nowrap` or `align` where they write those markers, and `yetiNumeric` where they write `data-numeric`. The table has no closed or open state.

### 9. Animation

None. The table has no state transition: the hover tint is an instant `:hover` background, and Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). A consumer may remove rows with a class-form `animate.leave` in a `@for`; the item link stays until Angular removes the last table host (ADR 0060 point 4). A server-rendered table never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static class, `data-ngx-yeti-item-table`, every bound `data-*` attribute on the table, its cells, and its numeric elements, plus the item link in `<head>` (section 8). No value is **Pre-hydration state**: no person and no Module changes these attributes (ADR 0003 point 4).
- **Before hydration:** the directives create no node, read no layout, start no timer or observer, and touch no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). `YetiTable`'s only constructor work is the item acquisition, which runs on the server too; the other directives do none.
- **Full hydration:** each element is claimed as is, provided usage rules 1 and 2 hold; the bindings compute the same values; a static `border`, `align`, or cell `nowrap` is written back and removed again in the same pass (decisions 9 and 196).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the table, its markers, and the link; a dehydrated host holds the link through `data-ngx-yeti-item-table` for as long as it is on the page (ADR 0060 point 4; ADR 0045). An input bound to state changes only after the block hydrates. Rows inside a hydrate block render on the server like any other content.
- **`hydrate never`:** the table is its server HTML and stays styled while its host is connected, whatever live tables do. Hover and a pinned head are CSS and keep working. Bound values stay at their server values.
- **Client-only `@defer`:** `YetiTable` fetches the item file when it is constructed, which can show frames with only the base table look; the consumer closes the gap with `provideYetiStyles({ preload: ['table'] })` (ADR 0060 point 6; [setup](setup.md)). `yetiNumeric`'s figures render at once; its end alignment waits for the item file.
- **Event replay:** no directive declares a listener, so nothing replays and no `jsaction` is added.
- **`withI18nSupport()`:** the caption and cells are the consumer's and usually carry `i18n`; the directives add no `i18n` block. The consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** every value is an `input()` signal read by a host binding, the form ticket 18 measured refreshing zoneless (ADR 0070 rule 4; map, Standing rulings, item 43).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the table is fully styled, striped, bordered, aligned, and hover-tinted, and a pinned head pins, because every attribute and the item link are in the server HTML and every behaviour is CSS. Nothing is lost. A client-only application gets no such promise.
- **Hydration boundary:** a table and its cells belong in one boundary, as a composite's root and parts do (building-blocks 1.11 decision 6). Rows may come from a child component's template inside the same block (usage rule 2). A consumer's `@defer` wraps the whole table, never part of it (building-blocks 1.11 decision 6).

### 11. Hydration constraints

The item complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static, and the `data-*` bindings read the same input values on both.
- **No direct DOM manipulation:** the directives write nothing outside host bindings. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directives change no element. The consumer's table structure must be what the parser builds: usage rules 1 and 2, the requirement the building-blocks "Hydration constraints (2026-10-03)" section places on this spec and Angular's guide names ("`<table>` without a `<tbody>`", `NG/adev/src/content/guide/hydration.md:119`). Layer 3 asserts the `tbody` in the server HTML, and a layer-4 negative control records the mismatch without it.
- **`preserveWhitespaces`:** the directives have no template. White space between rows is table text the parser keeps in place.
- **No output branched on the platform:** none.
- **Static attributes the directives bind:** usage rule 6 keeps the consumer from writing them. The one static form the records invite is the `removed` kind, `border`, `align`, and a cell's `nowrap` (decision 196), written back and removed again in one pass ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 9). The `inert` `size` and table-level `nowrap` are never bound, so hydration writes back what the server rendered.

### 12. Single-page application

None. The table has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). On a route change, a route's tables leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-table]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders a table again re-inserts it. A link inside a cell is the consumer's `routerLink` or `href`.

### 13. Item file

`yeti-css/css/components/table/table.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `YetiTable` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:46`, after `affix` and before `seam`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-table` has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds the `data-size` steps, tabular figures, the border marker's table exception, and the sticky rule), and optionally `provideYetiStyles({ preload: ['table'] })`. Cross-item files acquired: none. `table.css` names no other item, and the only other rule naming `.table` is in the always-loaded `attributes.css:465` (ADR 0060 point 9).

`YetiTableCell`, `YetiTableHead`, and `YetiNumeric` acquire no item file and set no presence attribute ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 6 and 7). A page with `yetiNumeric` and no table keeps no `table.css` loaded.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class and attributes in the DOM, the absence of the HTML `border` and `align` attributes, the item link, the computed padding, rules, tints, borders, white space, layout, and alignment, the computed table role and name, and the contrast. It never asserts a private field or how the styles service counts. No test depends on a public token's default value ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): where a test needs to know a rule applied, it compares a computed value with another element in the same story (a striped row against an unstriped one, a `sm` cell's padding against a default cell's, as Yeti's own `table.spec.js` does) or with a probe whose inline style reads the same public token. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `table` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Every story's table has a name and `scope` on its header cells. Story ids:

- `table--default`: Yeti's example (`striped`, a caption, a numeric column). Asserts `class="table"`, `data-ngx-yeti-item-table`, `data-striped`, `data-numeric` on the numeric cells, no `tabindex`, and no `role` attribute from the package; the computed role is `table` with the caption as its accessible name; a header cell's computed weight is heavier than a body cell's; even body rows' background differs from odd rows'; the numeric cells are end-aligned with `tabular-nums`; contrast of header text, a body cell on an odd and an even row, and the caption, at least 4.5:1 in light and dark schemes.
- `table--sizes`: three tables with `size="sm"`, none, and `size="lg"`. Asserts `data-size` only where bound, and cell padding `sm` < default < `lg`. Toggling a bound `size` to `undefined` removes `data-size`.
- `table--hover`: `hover` on a table; the play function hovers a body row and asserts its background changed and its text still meets 4.5:1 against the new background, in both schemes.
- `table--border`: `<table yetiTable border size="sm">`. Asserts `data-border`, no `border` attribute, a cell's border width above 0, the table's own top border 0 (Yeti's test, `table.spec.js:29-30`), and the header rule's colour unlike the cell border's.
- `table--nowrap`: a table with `nowrap` and one with a single `yetiTableCell nowrap` cell. Asserts `white-space: nowrap` on every cell of the first, on the marked cell only in the second, `data-nowrap` and no `nowrap` attribute on the marked cell (ticket 50 decision 196), and the table-level `nowrap` attribute left as written (inert).
- `table--fixed`: four columns with `fixed`; asserts equal header widths; a second table with a first header at `inline-size: 40%` asserts that column wider and the rest equal.
- `table--align`: Yeti's comparison table (section 8), with static `align` on cells and a row. Asserts `data-align` on each host and no `align` attribute; a centred row's cells are centred, a cell's own `start` outranks its row, a numeric cell outranks its row; the tick inside `span yetiIcon` is centred in its cell (Yeti's test, `table.spec.js:67-77`); the cell's accessible text includes the visually hidden "Included".
- `table--numeric-anywhere`: `yetiNumeric` on a `span` in a paragraph and on `dd` values, with no table on the story. Asserts `data-numeric`, `tabular-nums`, no end alignment, no class, and no `table.css` link.
- `table--row-headers`: a table whose first column is `th scope="row"`. Asserts the computed row headers through the accessibility tree.
- `table--wide`: a wide `nowrap` table as the one child of a named `yetiScroller`. Asserts the scroller overflows, the table's computed `display` is `table`, and the table's role is unchanged (Yeti's test, `table.spec.js:38-42`).
- `table--sticky-head` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 195): a long table whose `thead` has `yetiTableHead sticky`. After scrolling, asserts the head's top equals a probe reading `--yeti-sticky-offset`, its cells' background equals the page surface, and its rule is an inset shadow (Yeti's test, `table.spec.js:79-91`).

### Layer 2: browser-level (`npx nx test <lib>`, `table.spec.ts`)

Through `TestBed.createDirective(type, { tagName, bindings })` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `YetiTable` with `tagName: 'table'`: class `table` and `data-ngx-yeti-item-table`; with no bindings none of the six `data-*` attributes; with `bindings` for each input, each attribute carries its value (`''` for booleans), and setting a bound signal to `undefined` or `false` removes it after `whenStable()`; no `border` attribute in any state;
- `YetiTable`: while the fixture lives, one `<link data-ngx-yeti-styles="table">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed;
- `YetiTableCell` with `tagName` `td`, `th`, and `tr`: `align` renders `data-align` and never `align`; `nowrap` renders `data-nowrap` and never `nowrap`, and removes `data-nowrap` when false ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 196); no class, no presence attribute, no item link;
- `YetiNumeric`: `true` renders `data-numeric=""`, `false` renders none; no class, no presence attribute, no item link;
- `YetiTableHead` with `tagName: 'thead'`: `sticky` renders `data-sticky` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 195);
- no directive leaves a listener on its host.

A small test host covers what `createDirective` cannot: static `border` on the table and static `align="center"` on a cell are input values (`true`, `'center'`) with no HTML attribute after `whenStable()`; the cell inside a `yetiTable` receives the table through `yetiTableToken`, and a cell in a plain table gets `null` without an error; the template references resolve to their instances; the consumer's own `class` is kept beside `table`.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `table.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture whose table has an `i18n` caption, a `thead`, an explicit `tbody` with rows from `@for`, a static `border`, a static `align="center"` on a cell and a row, a `nowrap` cell, and numeric cells (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the table renders `class="table"`, `data-ngx-yeti-item-table`, and its bound attributes, and no `border` attribute; the aligned hosts render `data-align` and no `align`; the `nowrap` cell renders `data-nowrap` and no `nowrap` (ticket 50 decision 196); the server HTML holds the consumer's `tbody` with the rows inside it; `<head>` holds exactly one item link with `data-ngx-yeti-styles="table"`, `data-beasties-skip`, and an `href` ending `components/table/table.css?v=<pin>`; a fixture with only `yetiNumeric` writes no item link; no element carries `jsaction`.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `table` has `YetiTable`; `data-size` has `size` with `YetiSizeControl`; the five boolean attributes have their `boolean` inputs; markers `data-numeric`, `data-nowrap`, and `data-align` have `yetiNumeric`, `nowrap`, and `align`, and `YetiTableAlign`'s members equal the manifest's own `values` (`start`, `center`, `end`); the table has no events. A pin move that adds a value, an attribute, or a marker fails here before any story does. `data-sticky` on the `thead` is outside the manifest, so the check cannot cover it; [upstream-bugs.md](../upstream-bugs.md) records the manifest gap ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 195).

### Layer 4: Playwright e2e (three engines in CI)

On the fixture app, built with `outputMode: 'server'`, with a `/table` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). The route renders section 8's two tables and a wide table in a scroller:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`; after hydration the table has no `border` attribute and the cells and row no `align` and the cells no `nowrap`; a `MutationObserver` with a `requestAnimationFrame` probe asserts that no frame paints while a written-back `border`, `align`, or `nowrap` is present (decision 9);
- with JavaScript disabled the table's stripes, borders, alignment, and numeric alignment match the JavaScript-on render, hovering a row tints it, and `@axe-core/playwright` with the six tags reports no violation;
- a negative-control route, labelled as what not to write, renders a `table` without a `tbody` and records the hydration error it logs, so usage rule 1's reason stays measured;
- a table inside a client-only `@defer` block with `table` in the preload list shows no frame with only the base look; a table inside a `hydrate never` block stays styled after the live tables on the page are removed;
- navigating from the table route to a route without a table removes the item link, and navigating back re-inserts it; a route with only `yetiNumeric` loads no `table.css`;
- at a 320 px viewport the page has no horizontal overflow while the wide table scrolls inside its scroller (1.4.10), and Tab reaches the scroller;
- with `emulateMedia({ forcedColors: 'active' })` a bordered table's cell borders and header rule keep a visible computed border, recorded as behaviour with a screenshot in three engines ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 197);
- with a pinned head ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 195), a Shift+Tab walk through links in the rows is recorded with Yeti's defaults and asserted with usage rule 10 followed, after the [sidebar](sidebar.md) spec's case for A11Y-22.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html`, `docs.md` examples, and `test/browser/components/table.spec.js` with its fixture for the stories and their assertions; the [box](box.md) spec's probe pattern and the [columns](columns.md) spec's no-frame probe for a `removed`-kind input; the [scroller](scroller.md) spec's `scroller--wide-table` story; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link; ticket 17's contrast harness for the formula.

## Out of Scope

- Rendering rows from data, sorting, paging, filtering, selection, column resizing, or any CDK or Material table feature (Part 2 row 39). The consumer's template renders rows with `@for`. `yetiTable` on a `table[mat-table]` is not specified.
- A `grid` role, Aria `Grid`, or any keyboard navigation between cells (Part 2 row 39; building-blocks 1.10).
- Generating the caption, the name, `scope`, or `headers` (building-blocks 1.10, Names; usage rules 4 and 5).
- Responsive card layouts for narrow screens, which Yeti refuses (manifest `a11y.notes`).
- An input per token, or a theme (ADR 0004).
- Package CSS for forced colours: none now; layer 4 records the borders and the header rule, and a row and one `@layer ngx-yeti` rule follow only if they vanish (ticket 50 decision 197).
- A check that a table has a `tbody`, a name, or `scope`, or that `nowrap` is not on a `tr`. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- `data-border`, `data-paint`, and `data-text` as any-element markers (the [box](box.md) spec), and `data-show` and `data-hide` (the `container` spec).
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| One item directive `table[yetiTable]`, one part directive `yetiTableCell` on `th`, `td`, and `tr`, and the any-element `yetiNumeric`, one entry point | building-blocks Part 2 row 39; [Decide: the spec list](../issues/11-decide-spec-list.md) row 39 and Q9; ticket 26 rows 149 to 151 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| `size`, `striped`, `hover`, `border`, `nowrap`, `fixed` as root inputs typed `YetiSizeControl` and `boolean` | ticket 26 rows 143 to 148; ADR 0070 R; ADR 0005 |
| `align` typed `YetiTableAlign = Extract<YetiAlign, 'start' \| 'center' \| 'end'>` | ticket 26 row 151; ADR 0070 rule 2; ADR 0080 point 5; ticket 50 decision 60 (precedent) |
| `border`, `align`, and cell-level `nowrap` are `removed`; `size` and table-level `nowrap` are `inert`; static `removed` forms accepted | building-blocks 1.4; ticket 26 Q15; ticket 50 decisions 9 and 196 |
| Cell-level `nowrap` is `removed` | ticket 26 row 150; ticket 50 decision 196 |
| Unset inputs render nothing; Yeti's `md` comes from its CSS | ADR 0070 rule 1 |
| Selector-named, class-free `yetiNumeric`; class `YetiNumeric` | ticket 26 row 149 and Q10; ADR 0070 G; the user's "Selector name (Recommended)" (map, Standing rulings); ticket 50 decision 11 |
| Class names checked against the 46 names of `yeti.d.ts` | ADR 0080 point 4; ticket 50 decision 10 |
| `yetiTableToken` provided, injected optionally by the part directive, unread | ADR 0070 kind C; building-blocks 1.9 |
| Explicit `tbody` and parser-shaped structure; row components on `tr` | building-blocks "Hydration constraints (2026-10-03)"; map, Standing rulings, item 54 |
| No `yetiBorder` on the table; no `yetiIcon` or other `align` item on a cell | ticket 26 Q16; ticket 50 decision 39; building-blocks 1.4 |
| A wide table goes inside a scroller, never under it | Part 2 row 39; ticket 50 decision 59 |
| No Aria `Grid`, no CDK table | Part 2 row 39 |
| Name and `scope` are the consumer's | building-blocks 1.10, Names; manifest `a11y.notes` |
| Native platform, level 1, types only; no ledger row | building-blocks 1.2; Part 2 row 39 |
| Item file as a counted link; presence attribute on the table only | ADR 0060 points 2 to 6; ADR 0045; ticket 50 decisions 6, 7, and 45 |
| Contrast at 4.5:1 for every text checked | ticket 50 decision 8 |
| `YetiTableHead` with `sticky` for the pinned head | ticket 50 decision 195 |
| Forced colours: no row, no package CSS, recorded in layer 4 | ticket 50 decision 197 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A results table with a numeric column, rows from a signal:

```html
<table yetiTable striped hover size="sm">
  <caption i18n>Stage distances</caption>
  <thead>
    <tr>
      <th scope="col" i18n>Stage</th>
      <th scope="col" yetiNumeric i18n>Kilometres</th>
    </tr>
  </thead>
  <tbody>
    @for (stage of stages(); track stage.id) {
      <tr>
        <th scope="row">{{ stage.name }}</th>
        <td yetiNumeric>{{ stage.km }}</td>
      </tr>
    }
  </tbody>
</table>
```

```ts
import { YetiNumeric, YetiTable } from 'ngx-yeti/table';

@Component({
  selector: 'app-stages',
  imports: [YetiTable, YetiNumeric],
  templateUrl: './stages.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stages {
  readonly stages = input.required<readonly Stage[]>();
}
```

A row component, written on the `tr` so the table stays valid (usage rule 2):

```ts
@Component({
  selector: 'tr[appStageRow]',
  imports: [YetiNumeric],
  template: `
    <th scope="row">{{ stage().name }}</th>
    <td yetiNumeric>{{ stage().km }}</td>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StageRow {
  readonly stage = input.required<Stage>();
}
```

```html
<tbody>
  @for (stage of stages(); track stage.id) {
    <tr appStageRow [stage]="stage"></tr>
  }
</tbody>
```

A wide, compact result inside a scroller, after Yeti's docs:

```html
<div yetiScroller aria-labelledby="q-results">
  <table yetiTable size="sm" border nowrap>
    <caption id="q-results" i18n>Quarterly results</caption>
    <thead>
      <tr><th scope="col">Region</th><th scope="col" yetiNumeric>Q1</th><th scope="col" yetiNumeric>Q2</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row">North</th><td yetiNumeric>120</td><td yetiNumeric>132</td></tr>
    </tbody>
  </table>
</div>
```

Its imports are `YetiScroller`, `YetiTable`, and `YetiNumeric`. Alignment bound from state: `<td yetiTableCell [align]="column.align">`. A value newer than the pin: `<table yetiTable [size]="$any('xl')">`. Figures outside a table: `<dd yetiNumeric>14.2 km</dd>`.

A pinned head, flush with the top ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 195):

```html
<table yetiTable aria-label="Stages" i18n-aria-label>
  <thead yetiTableHead sticky style="--yeti-sticky-offset: 0">
    <tr><th scope="col">Stage</th><th scope="col" yetiNumeric>Kilometres</th></tr>
  </thead>
  <tbody><!-- rows --></tbody>
</table>
```

A theme that softens the stripes and the borders, in the consumer's stylesheet after Yeti:

```css
:root {
  --yeti-table-stripe: oklch(0.97 0.005 250);
  --yeti-table-border: oklch(0.9 0.01 250);
}
```

A page whose table renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['table'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/table/table.css`, loaded by `YetiTable` as a counted link (section 13). The other directives load none. The consumer writes nothing for the table beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps `data-size` to the private size properties (`:256-259`), gives `[data-numeric]` tabular figures (`:458-460`), skips `.table` in the border marker (`:465`), and pins any `[data-sticky]` (`:318-344`); the base styles give a bare table its width, collapsed borders, cell padding, row line, and caption look (`reset.css:70-73`, `controls.css:43-58`); `tokens/components.css:28-29` declares `--yeti-table-stripe` and `--yeti-table-border`.
3. **Cross-item rules:** none in `table.css`. A cell's tick in a `yetiIcon` is the icon's own rule (`docs.md`); a wide table's scrolling is the scroller's.
4. **Tokens:** reads the manifest's nine public tokens and `--yeti-sticky-offset`, writes none (section 2).
5. **What breaks without the item file:** the table keeps the base look (full width, padded cells, a line under each row, bold start-aligned headers), so it stays readable, with no error. Lost: the size steps, the strong header rule, the caption's weight and padding, stripes, hover, cell borders, `nowrap`, `fixed`, `align`, the end alignment of numeric cells (their tabular figures remain), and a pinned head's surface and rule (the head still sticks, and rows show through it).
6. **Tailwind name collision:** yes, and harmless as measured. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) compiled all 49 of Yeti's class names with Tailwind 4.3.3, and `table` was one of the four names that produced a utility (`container`, `grid`, `table`, and the attribute name `hidden`). Tailwind's `.table` sets `display: table`, which a `table` already has, and the prototype's Yeti table "came out the same", its width matching Yeti alone in every mix (`prototypes/yeti-tailwind/README.md:95-97`, measured). No `@source not inline('table');` is needed; the consumer keeps the shared layer statement of ADR 0060 point 7.

### Platform features to adopt when the browser target moves

None. `table.css` uses logical properties, `font-variant-numeric`, `table-layout`, `position: sticky`, and `:where()`, all inside Baseline 2025 (manifest `support`; building-blocks 1.2). If a stuck-state query enters the target, a pinned head's focus question (usage rule 10) could be revisited with it, as the sidebar's A11Y-22 record says of `@container scroll-state(stuck: top)` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 47, option B).

### Single-page-application pieces relied on

None: the item uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
