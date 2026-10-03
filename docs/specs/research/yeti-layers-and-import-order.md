# Research: Yeti's cascade layers and stylesheet order, for lazy loading

Ticket: [23. Research: Yeti's cascade layers and stylesheet order, for lazy loading](../issues/23-research-yeti-layers-and-import-order.md). Written 2026-10-01 by Opus 5.5. It builds on [research/yeti-styles-and-lazy-loading.md](yeti-styles-and-lazy-loading.md) (ticket 04). Nothing here is decided; [Decide: how component styles load and unload](../issues/13-decide-style-loading.md) chooses.

Each claim is labelled **measured** (run today in a browser or a build), **read** (from source or a spec, with a path and line or a section), or **inferred** (follows from what was measured or read, but was not run).

## 1. Sources and workspaces

- **Yeti** at `f52d1e8b9`, exported with `git archive` to `D:/tmp/ngx-yeti-23/yeti`, then `npm install` and `npm run build` ("build: wrote dist/ (29 entries)"). Paths below with no prefix are in that copy's `src/`, or in `bin/` and `test/` where the path says so. The clone at `github.com/foundation/yeti` was not changed.
- **CSS Cascade 5**, W3C Candidate Recommendation Snapshot, 13 January 2022 (https://www.w3.org/TR/css-cascade-5/), downloaded with curl because markdown.new got a Cloudflare challenge page. Cited as "Cascade 5 section n".
- **CSSOM**, Editor's Draft (https://drafts.csswg.org/cssom/), section 6.2 for the order of a document's style sheets.
- **Angular** source at `github.com/angular/angular` (`5db6fc4453`, the 22.2.0 release commit).
- **Angular workspace**: ticket 04's `D:/tmp/ngx-yeti-04/app` copied to `D:/tmp/ngx-yeti-23/app`. Its `src/app/app.ts` was replaced with 04's `measure/app.ts.base` (the version without the permanent `(animate.leave)` listener, so that unloading works), and the library and app were rebuilt. The ticket 04 workspace was not modified.
- **Browsers:** Playwright 1.63.0 (Yeti's own dev dependency), with Chromium, Firefox, and WebKit headless at 1280x900.
- **Scripts and raw results** in `D:/tmp/ngx-yeti-23/measure/`: `insert.mjs` and `insert2.mjs` (section 4), `diag.mjs` and `details.mjs` (section 4.3), `tie.mjs` (section 4.4), `probe.mjs` (sections 5 and 6), `ng.mjs` (section 4.5), and `summary.mjs`. The results are `insert-<engine>.json`, `insert-<engine>-style-prepend-statement.json`, `probe.json`, and the `.log` files.

## 2. Point 1: the layer names, their order, and where they are declared (read)

- **The statement.** `src/layers.css:7` is the whole file apart from its comment: `@layer yeti.reset, yeti.base, yeti.theme, yeti.layouts, yeti.components, yeti.utilities;`. Its comment says the order is "Declared once, here, and imported first", that every rule Yeti ships lives in one of these sublayers, and that "A user's plain, unlayered CSS beats all of them by default" (`layers.css:1-3`).
- **One definition in code.** `bin/lib/layers.js:3-12` holds `LAYER_NAMES` and builds `LAYER_STATEMENT` from it. `bin/validate.js:314-321` fails the build unless `layers.css` contains exactly that statement, and `:323-330` fails it unless `yeti.css` begins with `@import "layers.css";`. The smoke test reads the first rule of the first sheet, following `@import`s, and expects a `CSSLayerStatementRule` whose names equal `LAYER_NAMES` (`test/browser/smoke.spec.js:11-18`).
- **The minified file.** Lightning CSS folds the standalone statement into the layer blocks it emits, so `bin/build.js:90-93` writes `LAYER_STATEMENT` back at the top of `yeti.min.css`.
- **What the order means.** The six names are sublayers of one outer layer, `yeti`, created by the dotted names (Cascade 5 section 6.4.2). Layers are sorted "by the order in which they first are declared", with nested layers grouped inside their parent (section 6.4.3). For normal declarations a later layer beats an earlier one, whatever the specificity (section 6.1, "Layers"). So from weakest to strongest: `yeti.reset`, `yeti.base`, `yeti.theme`, `yeti.layouts`, `yeti.components`, `yeti.utilities`, then every unlayered rule. Because the statement comes first, rules added to these layers later in the document do not change the order (section 6.4.4.2, the note that the statement "allows establishing a layer order in advance").
- **`yeti.theme` is empty on purpose.** Yeti ships nothing in it (`layers.css:3-6`). `bin/validate.js:830-843` fails any Yeti file outside `themes/` and `starter/` that names it.

## 3. Point 2: which layer each file writes to, and the documented import order (read)

### 3.1 Layer per file

Read from the first `@layer` line of each file listed in `src/yeti.css`:

| Group | Files | Layer |
| --- | --- | --- |
| `layers.css` | 1 | the statement only (`:7`) |
| `tokens/*` | `scale`, `space`, `type`, `color`, `tone`, `motion`, `surface`, `components` | `yeti.base` (for example `tokens/color.css:18`, `tokens/components.css:3`) |
| `base/reset.css` | 1 | `yeti.reset` (`base/reset.css:4`) |
| `base/*` (the rest) | `typography`, `prose`, `controls`, `media`, `transitions` | `yeti.base` (for example `base/typography.css:2`, `base/transitions.css:33`) |
| `layouts/attributes.css` | 1 | `yeti.layouts` (`:4`) and `yeti.utilities` (`:332`, `:366`, `:403`) |
| `layouts/*` | 17 | `yeti.layouts` (for example `layouts/stack/stack.css:3`) |
| `recipes/*` | `media`, `hero`, `shell` | `yeti.layouts` (`recipes/media/media.css:6`, `recipes/hero/hero.css:4`, `recipes/shell/shell.css:4`) |
| `components/*` | 22 | `yeti.components` (for example `components/card/card.css:5`) |
| `utilities/*` | 7 | `yeti.utilities` (for example `utilities/enter/enter.css:9`) |
| `themes/soft.css`, `themes/sharp.css` | 2 | none: unlayered `:root` token blocks (`themes/soft.css:1-3`) |

Two exceptions to "every rule is in a layer":

- The six `@property` registrations in `tokens/color.css:11-16` are outside any layer; the comment at `:8-10` says so on purpose. `@property` is not a style rule, so it takes no part in layer order (inferred).
- The one `!important` in Yeti is `[hidden] { display: none !important; }` in `yeti.reset` (`base/reset.css:75-79`). For important declarations the earlier layer wins, and a layered important beats an unlayered one (Cascade 5 section 6.1, "Layers"). So this rule beats every other `display` declaration on the page, a consumer's unlayered `!important` included (inferred from the spec, not measured).

### 3.2 The documented import order

- **Entry point.** `src/yeti.css:1-3`: "layers.css must come first so the layer order is fixed before any rule is parsed. Tokens come before base, and the reset before the rest of base, because base reads tokens and overrides the reset." The list is at `:4-71`: layers, 8 tokens, reset, 5 base, attributes, 17 layouts, 3 recipes, 22 components, 7 utilities. Utilities come last so that "the file order should read the way the layers resolve", alphabetical because "nothing here depends on anything else here" (`:62-64`).
- **Enforced.** `bin/validate.js:335-372` ranks each import (`layers.css`, `tokens/`, `base/reset.css`, `base/`, `layouts/attributes.css`, `layouts/`, `recipes/`, `components/`, the rest) and fails on the first import that has a lower-ranked one after it. It also forbids importing `themes/` or `starter/` into `yeti.css` (`:360-365`).
- **Custom builds.** `guides/install.md:76-97`: copy `dist/css/yeti.css`, delete the lines you do not want. Four groups "always stay" (`:90-95`): `layers.css` first, which "fixes the order of Yeti's cascade layers before any rule is read, which is what lets the rest of the list arrive in any order and still resolve the same way" (`:92`); every `tokens/` file; every `base/` file; and `layouts/attributes.css`. The rest stands alone, but "Don't reorder the lines you keep: the layers settle which rules win between groups, but inside a group a later file still wins a tie" (`:97`). Bundling with esbuild keeps the layers and their order "because they are written in the CSS itself" (`:105`).
- **The default.** One `<link>` to `yeti.css` "before your own styles" (`guides/install.md:48-52`), with a theme as a second stylesheet that "loads after the first" (`:54-59`).

## 4. Point 3: a part arriving after render, or before its layer is declared (measured)

### 4.1 The rule (read)

- Layer order is global to the document (Cascade 5 section 6.4.3, note), and it is set by first declaration in **order of appearance**, not by when a sheet arrives. Order of appearance follows "final CSS style sheets", with linked sheets "concatenated in linking order" and imports substituted in place (section 6.1, "Order of Appearance"). The final CSS style sheets are the document's sheets in tree order, then the `adoptedStyleSheets` in array order (CSSOM section 6.2).
- So a part sheet placed **after** the sheet holding the statement only adds rules to a layer that already has its place. A part sheet placed **before** it declares its own layer first: `card.css` alone would make the order `yeti.components`, then `yeti.reset`, `yeti.base`, and so on, which puts components below the reset and the base (inferred from section 6.4.3). Inside one layer, ties of specificity still go to the later sheet in that same order of appearance (section 6.1).

### 4.2 Setup

`insert.mjs` used the 98 pages of ticket 04 (each of the 49 part files' `example.html` and its test fixture, scripts stripped). The reference was `dist/css/yeti.css` (FULL). The base page linked one `@import` list of every Yeti file except the part P. At run time P was inserted in one of these ways:

| Method | Where P goes |
| --- | --- |
| `style-append` | a `<style>` with P's text at the end of `<head>` (what Angular's `SharedStylesHost` does, section 4.5) |
| `link-append` | a `<link rel="stylesheet">` to P at the end of `<head>`, awaited until `load` |
| `adopted` | a constructed `CSSStyleSheet` added to `document.adoptedStyleSheets` |
| `style-prepend` | a `<style>` with P's text placed before Yeti's `<link>`, so before `layers.css` |
| `style-prepend-statement` (`insert2.mjs`) | as `style-prepend`, with Yeti's layer statement added as P's first line |

Each page then went through four steps: before (Yeti without P), inserted, removed, and inserted again. Every computed longhand of every element under the page root and its `::before` and `::after` was compared: inserted and reinserted against FULL, and removed against before. Animations were cancelled and `reducedMotion: 'reduce'` was set before each read. Each engine read 1,982 elements per step. A static config, REVERSED, also loaded the always-group and then every part in reverse order.

### 4.3 Results

The positive control held: on all 98 pages in all three engines, the page without P differed from FULL, so every insertion had something to change.

| Method | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| `style-append`, inserted / removed / reinserted differ | 5 / 4 / 7 pages | 0 / 0 / 0 | 2 / 3 / 2 |
| `link-append` | 5 / 4 / 5 | 0 / 0 / 0 | 0 / 3 / 1 |
| `adopted` | 7 / 4 / 7 | 0 / 0 / 0 | 2 / 3 / 2 |
| `style-prepend` | 66 / 0 / 66 | 65 / 0 / 65 | 66 / 3 / 66 |
| `style-prepend-statement` | 7 / 4 / 6 | 2 / 0 / 2 | 4 / 3 / 4 |
| REVERSED (static) | 2 | 2 | 2 |

What the numbers are:

- **The three append points match FULL, and unload and reload work.** Firefox gave 0 differences at every step. The few Chromium and WebKit pages are all on the same few pages whatever the method: accordion, demo, progress, and table in Chromium; button, table, and nav in WebKit. `diag.mjs` repeated each one and then replaced `<body>` with a fresh clone of itself, which gives new elements and a full style resolution. After that, every one of those pages had 0 differences from FULL when inserted, and 0 from before when removed, in both engines. So the cascade result was right, and what differed was stale computed style on elements that existed through the sheet change. In Chromium the accordion and demo cases are `<p>` and `<pre>` inside closed `<details>`. A narrower script (`details.mjs`) that read only those paragraphs did not reproduce it, so the trigger is not pinned down. I read this as a style-invalidation issue in the engines, the same for `<style>`, `<link>`, and adopted sheets and for removal, and not a matter of layer order (inferred). Whether it ever shows on screen was not checked.
- **Placing a part before the statement breaks the order on two thirds of the pages.** `style-prepend` differed on 66, 65, and 66 of 98 pages, across all four kinds (16 layout pages, 4 recipe, 39 component, 7 utility in Chromium). For example, on the stack example a heading lost its 32.8px `margin-block-start`, because `yeti.layouts` now sat below the reset and the base. Removing the prepended sheet restored the page exactly (0 differences from before, apart from WebKit's 3 nav pages, which are the invalidation case above). So the browsers recompute layer order when the sheet that declared a layer first goes away.
- **Adding the statement to the part fixes that.** With Yeti's statement as P's first line, the prepended part matched FULL apart from two pages in every engine, plus the same invalidation pages as the append methods. Those two pages, the `center` and `shell` fixtures, are a tie inside `yeti.layouts` (section 4.4). Repeating the statement in many sheets is harmless, because the first declaration fixes the order and later ones add nothing (Cascade 5 section 6.4.3, read).

### 4.4 Tie order inside one layer (measured)

REVERSED differed on two pages in all three engines, both the same rule pair:

- `layouts/stack/stack.css:12` `.stack > * { margin: 0; }` and `layouts/center/center.css:4-16` `.center { margin-inline: auto; ... }` have the same specificity in the same layer. In Yeti's order `stack` comes first (`yeti.css:20`, `:30`), so a `.center` inside a `.stack` keeps its auto margins. Reversed, it lost them (430px to 0px on the center fixture).
- `recipes/shell/shell.css:13` `.shell > * { margin: 0; }` comes after `center` in Yeti's order (`yeti.css:39`), so a `.center` directly inside a `.shell` has 0 margins. Reversed, it got 102px.

`tie.mjs` then reproduced the lazy case. The page had the always-group and `center.css`, and `stack.css` was inserted at run time. **Appended** after `center.css`, the stack rule won, and the center inside the stack went from 430px to 0px in all three engines. **Inserted before `center.css`'s `<link>`**, which is Yeti's order, it kept 430px. So the place where a lazy loader inserts a part changes results inside a layer, as `install.md:97` warns. Only one reversed order was run, so other pairs that tie may exist (not checked for every pair).

### 4.5 Angular component `styleUrl` (measured and read)

- **Where Angular puts it (read).** `SharedStylesHost.addElement` ends with `host.appendChild(element)` (`packages/platform-browser/src/dom/shared_styles_host.ts:239-251`), so a component's `<style>` is appended to the end of `<head>`. That is the `style-append` point.
- **Server HTML (measured, `ng.mjs`).** The `<head>` holds, in this order: Beasties' critical `<style>`, which begins with `@layer yeti.reset,yeti.base,yeti.theme,...`; the global `styles-*.css` `<link>` twice (once with `media="print"`, Beasties' async pattern, and once inside `<noscript>`); then the card's `<style ng-app-id>`, `@layer yeti.components{.card{...`. So the statement comes first in the document both before and after the full global sheet loads.
- **Client, same in all three engines (measured).** After hydration the sheets were: the critical `<style>`, the global `<link>` (now `media=all`, starting with the layer statement), then the card `<style>`. The `@defer` badge's `<style>` was appended after the card's. The card subtree and the badge matched Yeti's full stylesheet with 0 differing elements. Hiding the card removed its `<style>` (count 0); showing it re-added it (count 1), and the card matched again with 0 differences.
- **Order after a reload (measured).** After hide and show, the card's `<style>` came after the badge's. In Yeti's order the badge comes first (`yeti.css:42-43`), so this pair happens to match. In general, though, Angular orders part sheets by when they were last inserted, not by Yeti's order, so the `stack`/`center` case of section 4.4 applies to it (inferred from 4.4 and `addElement`).
- **Not measured:** `ViewEncapsulation.ShadowDom`. Layers are scoped to their origin and context, so a shadow root would have its own layer order and would need the statement in its own sheets (Cascade 5 section 6.4.3, last note, read). `Emulated` encapsulation rewrites selectors with attributes and so changes their specificity (inferred). Ticket 04 used `None`, and so did this ticket.

## 5. Point 4: where the consumer's unlayered CSS and themes sit (read and measured)

### 5.1 What the guides say (read)

- Anything outside a layer beats every Yeti rule "without a specificity fight" (`guides/install.md:54`; `layers.css:2-3`). For the base: "you can outrank it with one unlayered declaration of your own" (`guides/base.md:411`).
- A theme is `:root` blocks of public tokens "outside any layer", plus element rules in `@layer yeti.theme { ... }` limited to bare-element selectors (`guides/theming.md:94`). Its first line may repeat Yeti's layer statement, "the one statement a theme may make besides its blocks: a browser fixes the order of layers when it first meets them, so a theme that loads before `yeti.css` without it would put its element rules below the base instead of above it" (`guides/theming.md:99`, `:113`). The theme layer sits above the base and below every layout, component, and utility, so "a theme's `a { color }` never repaints a link that is a button" (`:115`).
- Tokens set by the consumer belong "in your own stylesheet, after Yeti's" (`guides/theming.md:11`, as cited in ticket 04). Ticket 04 measured that an unlayered `:root` block works before Yeti too.

### 5.2 Measured (`probe.mjs`, same in all three engines)

The page had the always-group and `button.css`, then `card.css`, `spinner.css`, and `toc.css` appended at run time as `<style>`:

| Consumer CSS | Before the parts | After the parts arrive |
| --- | --- | --- |
| none (control) | card padding 0px (no card file yet) | 18px |
| unlayered `.card { padding: 5px }` and `a { color: green }`, placed **before** Yeti | 5px; plain link green | 5px; plain link green, and the `a.button` link green too |
| `@layer app { .card { padding: 5px } }` placed **before** Yeti | 5px | 18px: `app` was declared first, so every Yeti layer beats it |
| the same `@layer app` block placed **after** Yeti's global sheet | 5px | 5px: `app` comes after `yeti`, so it beats the late card |
| theme `@layer yeti.theme { a { color: red } }` **before** Yeti, no statement | link keeps Yeti's colour: `yeti.theme` was declared first, below the base | same |
| the same theme with Yeti's statement first | red | red; `a.button` keeps its button colour |
| the same theme **after** Yeti | red | red; `a.button` keeps its button colour |

What this shows:

- **Unlayered consumer CSS wins over every part, whenever and wherever the part arrives**, as the spec says (Cascade 5 section 6.1). It also wins over components on elements the consumer did not mean: a bare `a { color }` unlayered repainted the button link, which the theme layer is there to prevent (`guides/theming.md:115`).
- **A consumer's own named layer** is placed by where it is first declared, compared with Yeti's statement. A lazy part never moves it, because the part's layer is already placed.
- **Themes** behave as `guides/theming.md:113` says. A theme loaded after Yeti's global sheet, or one that carries the statement, sits in `yeti.theme` whatever the parts do later.

## 6. Point 5: the rules that cross files

- **Busy button ring (read and measured).** The ring is `components/spinner/spinner.css:5` and `:24`, `.button[aria-busy="true"]::after`; `components/button/button.css:131` only dims the button and sets the cursor. In `probe.mjs`, a busy button with `button.css` alone had `::after` `content: none`. With `spinner.css` added it had `content: ""` and a solid border, and after removing `spinner.css` it went back to `none`, in all three engines. So unloading the last spinner removes the ring from every busy button.
- **Smooth scrolling (read and measured).** `components/toc/toc.css:6-9` sets `scroll-behavior: var(--yeti-toc-scroll)` on `html:has(.toc, .nav a[href^="#"]:not([href="#"]))`. The token is `smooth` (`tokens/components.css:102`) and `auto` under `prefers-reduced-motion: reduce` (`:178-182`). With a `.nav` of fragment links and no `.toc`, `html` had `scroll-behavior: auto` without `toc.css`, `smooth` with it, and `auto` again after removing it, in all three engines (run without reduced motion). So a page with nav fragment links scrolls smoothly only while some contents list keeps `toc.css` loaded.
- **Other cross-part selectors** (`affix` to `.button`, `buttons` to `.button`, `card` to `.layer` and `.grid`, `field` to `.affix`, `nav` to `.dropdown`, `toc` to `.nav` and `.cluster`, and `attributes.css` to `.table`; ticket 04, section 3.1) style the two parts used together. Install guide: they "simply match nothing once the other part is gone" (`guides/install.md:97`). Ticket 04's per-part runs found no other look that changes on unload.
- **Tie pairs inside a layer** are a second kind of cross-file rule: `stack` with `center`, and `shell` with `center` (section 4.4, measured).

## 7. Options for ticket 13: declaring the order once, and loading each part into its layer

None is chosen. They are grouped by the question each answers; one option from each group can be combined.

### 7.1 Where the layer order is declared

| Option | How | Holds when | Cost or risk |
| --- | --- | --- | --- |
| **L1. In the global always-group only** | The consumer's `styles` entry (or the package's own always-group file) starts with `layers.css`, as Yeti documents (`install.md:92`). Parts carry no statement. | Every part sheet comes after the global sheet in document order. Measured for `<style>` and `<link>` at the end of `<head>`, for adopted sheets, and for Angular `styleUrl` under SSR with Beasties (sections 4.3 and 4.5). | One misplaced part reorders the layers on most pages (66 of 98, measured). Nothing checks it at run time. Shadow roots need their own statement (read). |
| **L2. L1, plus the statement as each part's first line** | The library adds `@layer yeti.reset, ..., yeti.utilities;` to the top of each part's CSS (in the component's `styleUrl` file, or in a generated string). | Anywhere: the part sheet fixes Yeti's order even if it arrives first, for example before the global sheet, in a shadow root, or on a page where the always-group was forgotten. Measured for the prepend case: it went from 66 pages differing to only the two tie pages. | 88 bytes per part. It must stay identical to `bin/lib/layers.js`, which a test against `LAYER_STATEMENT` can check (inferred). |
| **L3. L1, plus a development-mode check** | A provider looks for a `CSSLayerStatementRule` with Yeti's names before the first part sheet, the way Yeti's smoke test does (`test/browser/smoke.spec.js:11-18`), and warns if it is missing or comes later. | Catches a consumer who left out the always-group or put a part first. | Code, and it runs only in the browser in development (inferred). Not built. |

### 7.2 Where a part's sheet is inserted

| Option | How | Tie order inside a layer | Status |
| --- | --- | --- | --- |
| **P1. Append (Angular's `SharedStylesHost`, a library `<style>`, a `<link>`, or an adopted sheet)** | At the end of `<head>`, or at the end of `adoptedStyleSheets` | Insertion order, not Yeti's: a lazily loaded `stack` after `center` un-centres a center inside a stack (measured). Reloading moves a part to the end (measured). | Measured in sections 4.3 to 4.5. Angular's `styleUrl` gives this point. |
| **P2. Insert in Yeti's order** | A library-owned loader (ticket 04's S2, or a counted `<link>`, S3) inserts each part's sheet before the next loaded part that comes later in `src/yeti.css`, using a rank table generated from that file. | Same as FULL (measured for `stack`/`center` with a `<style>` before a `<link>`). | Not possible through `SharedStylesHost`, which always appends (read). It needs the library's own style host, with the server-side and hydration handling that S2 already has to do (ticket 04, section 7). For adopted sheets the same works by array position (inferred). |
| **P3. Make the tie-sensitive parts global** | Put the parts known to tie (`stack`, `center`, `shell`) into the always-group, so they are always present in Yeti's order. Lazy parts then append. | Same as FULL for the known pairs. Unknown pairs stay possible (section 4.4). | Small: these three source files are 2.6 kB, 1.2 kB, and 1.5 kB with comments (measured with `wc -c`; not built). |
| **P4. Accept insertion order, and document the pairs** | P1, with the known pairs listed in the spec | Known pairs can differ from FULL | No work; the difference is visible only when both parts are on the page and one was loaded after the other. |

### 7.3 Cross-part rules on unload

| Option | How |
| --- | --- |
| **X1. Load the dependent rule with its host** | The button part also loads `spinner.css` (or only its `.button[aria-busy]` rules), and the nav part also loads `toc.css` (or its `html:has(...)` rule). Then the busy ring and the smooth scrolling depend on the button or nav being present, as the selectors do. |
| **X2. Keep the two rules global** | Put `spinner.css` and `toc.css` in the always-group. `spinner.css` is 1.4 kB and `toc.css` 3.9 kB of source with comments (measured with `wc -c`), and the scrolling rule is one line of `toc.css`. |
| **X3. Accept and document** | A busy button has no ring unless a spinner part is loaded, and nav fragment links scroll smoothly only while a contents list is loaded (measured). |

### 7.4 Consumer CSS and themes

These apply whatever 7.1 to 7.3 choose:

- The consumer's unlayered CSS and tokens work before or after Yeti, and win over late parts (measured). A consumer who wants Yeti's components to keep winning over their own element rules puts those rules in `@layer yeti.theme` or in a layer declared after Yeti's statement (measured: `app` after Yeti beats the late card; a theme rule did not repaint `a.button`).
- A theme file goes after the global always-group, or carries Yeti's statement (`guides/theming.md:113`, measured).
- A consumer layer declared before Yeti's statement sits below all of Yeti (measured). That is the documented way to make Yeti beat the consumer's own layered CSS.

## 8. Open points

- The stale computed styles of section 4.3 in Chromium and WebKit: what triggers them, and whether they show on screen. They appeared with every insertion method, so they do not tell the methods apart.
- Every pair of parts for tie order. Only one reversed order was run (section 4.4).
- Shadow DOM encapsulation, `ng serve` and HMR (where Vite's style injection may place sheets elsewhere), and a consumer whose global stylesheet is not in `<head>`. None was run.
- Whether P2's ordered insertion can be built on the hydration path without the leave-animation guard (ticket 04, section 6.2). Not tried.
