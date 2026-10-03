# Research: Yeti's styling model, and loading component styles lazily

Ticket: [04. Research: Yeti's styling model, and loading component styles lazily](../issues/04-research-yeti-styles-and-lazy-loading.md). Written 2026-10-01 by Opus 5.5. Nothing here is decided; [Decide: how component styles load and unload](../issues/13-decide-style-loading.md) chooses.

Each claim is labelled **measured** (run today in a browser or a build), **read** (from source, with a path and line), or **inferred** (follows from what was measured or read, not run). Where something could not be confirmed, the section says where I looked.

## 1. Sources and workspaces

- **Yeti** at `f52d1e8b9` (`7.0.0-alpha.0` in `package.json`), exported with `git archive` to `D:/tmp/ngx-yeti-04/yeti`, then `npm install` and `npm run build` ("build: wrote dist/ (29 entries)"). Paths below without a prefix are in that copy. The read-only clone at `github.com/foundation/yeti` was not changed.
- **Angular** source at `github.com/angular/angular` (`5db6fc4453`, the 22.2.0 release commit). The measured app runs `@angular/core` 22.2.1, `@angular/build` 22.2.0, and `ng-packagr` 22.2.4.
- **Browsers:** Playwright 1.63.0 (Yeti's own dev dependency): Chromium, Firefox, and WebKit, headless, 1280x900.
- **Measurement scripts** in `D:/tmp/ngx-yeti-04/measure/`: `static.mjs` (text read of every file), `alone.mjs` and `report.mjs` (point 1), `theme.mjs` (point 2), `ssr.mjs` and `libcss.mjs` (point 4). Raw results are in `alone.json` and `static.json`.
- **Angular workspace** at `D:/tmp/ngx-yeti-04/app` (point 4, section 5): Angular CLI 22.2.0 with SSR, plus a library project `yeti-lib` built by ng-packagr, with `yeti-css` installed from the `npm pack` tarball of the copy.
- **Old map evidence** (`.scratch/next-foundation-specs/`): the Answers of tickets 182 (`research-lazy-style-loading-from-directives`), 184 (`prototype-lazy-family-styles`), 188 (`prototype-unload-after-leave-without-private-api`), 189 (`prototype-link-loader-no-consumer-code`), 192 (`consult-fable-style-loading`), and 193 (`prototype-community-esbuild-builders`), and sections 6 and 7 of old map `research/yeti-foundation-7.md` (ticket 194). Tickets 190, 195, 197, and 198 were still `Status: claimed` with no `## Answer` when I read them, so nothing here rests on them.

## 2. How Yeti's CSS is built and packaged (read)

- **Build.** `bin/build.js` is "Concatenation only. No transforms" (`:2-3`). It writes `dist/yeti.css` (every file joined, in `src/yeti.css`'s order), `dist/yeti.min.css` (Lightning CSS, with the layer statement put back first, `:93`), and copies `src/` verbatim to `dist/css/` except `themes/` and `starter/` (`:95-99`). Themes go to `dist/themes/` (`:101-109`).
- **Exports.** `package.json` exports `"./css/*": "./dist/css/*"` and `"./themes/*": "./dist/themes/*"`, so `yeti-css/css/components/card/card.css` resolves through the exports map. The bare `.` export is `dist/yeti.css`.
- **Files.** `dist/css/` holds 66 CSS files (measured): `layers.css`, 8 under `tokens/`, 6 under `base/`, `layouts/attributes.css`, and 49 part files: 22 components, 17 layouts, 3 recipes, 7 utilities. `dist/css/yeti.css` is the `@import` list in the full build's order. Each part folder also carries `example.html`, `manifest.json`, and `docs.md`.
- **Layers.** `src/layers.css:7` declares `@layer yeti.reset, yeti.base, yeti.theme, yeti.layouts, yeti.components, yeti.utilities;`. Measured by text read (`static.mjs`): every part file has only `@layer` blocks of its own kind (components in `yeti.components`, layouts and recipes in `yeti.layouts`, utilities in `yeti.utilities`), and no rule outside a layer. The one unlayered content in the whole tree is the six `@property` registrations in `tokens/color.css:11-16`, which the file's comment says are not layered on purpose. `layouts/attributes.css` opens blocks in both `yeti.layouts` and `yeti.utilities`.
- **The always-group.** The install guide names four groups that "always stay": `layers.css` first, every `tokens/` file, every `base/` file, and `layouts/attributes.css` (`src/guides/install.md:90-95`). "Everything else stands alone ... Where one part's file mentions another, it is for the two used together ... those rules simply match nothing once the other part is gone. Don't reorder the lines you keep: the layers settle which rules win between groups, but inside a group a later file still wins a tie." (`:97`).
- **Sizes** (measured, unminified source with comments): part files run from 292 bytes (`layouts/container`) to 15,363 (`components/nav`); `layouts/attributes.css` is 37,182. Built in the app below, the always-group is `styles-*.css` at 59.40 kB raw and 6.53 kB transfer.

## 3. Point 1: per-component files and whether each loads alone

### 3.1 Static dependencies (measured by text read)

For every file, `static.mjs` listed the custom properties it reads with `var()` but does not define, and where each is defined:

- **No part file reads a custom property defined only in another part file.** Every outside read resolves to the always-group: tokens (including per-component tokens such as `--yeti-card-padding`, which live in `tokens/components.css`, not in the component file) or `layouts/attributes.css`.
- **Reads that resolve only in `layouts/attributes.css`:** `affix` (`--_yeti-size-space`, `--_yeti-size-text`), `card` (`--_yeti-variant`, `--_yeti-rows`), `box`, `columns`, `grid`, `scroller`, `stack`, and `recipes/hero`. Many more depend on it without a `var()` read, because the attribute file is what turns `data-variant`, `data-size`, `data-gap`, and the rest into private properties (`attributes.css:1-4`); point 1's browser run shows that.
- **Reads defined nowhere** are override-only inputs with a `var()` fallback: `--yeti-alert-edge`, `--yeti-progress-size`, `--yeti-seam-size`, `--yeti-toc-hover`, and in the always-group `--yeti-link-color`, `--yeti-link-color-hover`, `--yeti-base`, `--yeti-ratio`.
- **Selectors that name another part** (rules for the two used together): `affix` -> `.button`; `buttons` -> `.button`; `card` -> `.layer`, `.grid`; `field` -> `.affix`; `nav` -> `.dropdown`; `spinner` -> `.button`; `toc` -> `.nav`, `.cluster`; `attributes.css` -> `.table`. Two of these change another part's look when only one file is loaded:
  - The busy button's ring is drawn by `spinner.css` (`.button[aria-busy="true"]::after`, `components/spinner/spinner.css:5`, `:24`). `button.css:131` only dims it. With `button.css` loaded and `spinner.css` not, a busy button has no ring (inferred from the selectors; the button fixture's busy case is among the differences attributed to `spinner.css` below).
  - `toc.css:9` sets `scroll-behavior` on `html:has(.toc, .nav a[href^="#"]:not([href="#"]))`, so a page with a nav of fragment links scrolls smoothly only while `toc.css` is loaded (read).

### 3.2 Browser run (measured)

`alone.mjs` rendered each of the 49 part files on two pages: its `example.html` from `dist/css/`, and its test fixture body from `test/browser/fixtures/<kind>/<name>.html` (inline `<style>` kept, scripts removed so both sides are static). Every page ran in four configurations:

| Config | Stylesheets |
| --- | --- |
| FULL | `dist/css/yeti.css`, every file through `@import` |
| B | `layers.css`, `tokens/*`, `base/*`, and the part file (the ticket's "only the base and tokens") |
| BA | B plus `layouts/attributes.css` (Yeti's documented always-group) |
| LATE | every file except the part, then the part file appended last (a late insertion, as a lazy loader would make it) |

Animations were cancelled and `reducedMotion: 'reduce'` set before reading. For every element under the page root and its `::before` and `::after`, every computed longhand was compared with FULL. Each differing element was then attributed, from FULL's CSSOM, to the files whose rules match it, its ancestors, or its descendants. 98 pages per engine, 5,946 element readings across the three engines.

Results were the same in Chromium, Firefox, and WebKit:

- **BA: every one of the 49 files loads alone.** Every difference from FULL traces to another part that the example or fixture markup also uses (a button inside a card, a badge in a card footer, a `.icon` in a table cell, `.box` wrappers in layout fixtures). The six files whose difference was not caught by the ancestor and descendant attribution were checked by hand: `card` (example: the image's height follows the footer that holds a badge and a button), `table` (fixture: a row's height follows a sibling cell holding `.icon` and `.visually-hidden`), all geometry only (`block-size`, `height`, and the two origins). No difference was traced to the part file missing something of its own.
- **B: 40 of the 49 files need `layouts/attributes.css`.** Their differences are on elements matched by `attributes.css` rules. The 9 that showed no attribute dependence on these pages: `layouts/timeline`, `components/buttons`, `breadcrumbs`, `pagination`, `toc`, `accordion`, `tabs`, `dropdown`, `tooltip`. So "base and tokens" alone is not enough for most files; the four-group always-set is (measured).
- **LATE: 0 differing elements on all 98 pages in all three engines.** Appending a part file after all the others changed nothing on its own pages. Limit: tie order was only checked on each file's own example and fixture, which include some other parts (listed in `report.mjs` output), not on every pair of parts. An earlier run with a coarser attribution showed one LATE difference on the `demo` pages that the final run did not reproduce; I did not investigate it.

### 3.3 What point 1 does not cover

- JavaScript-set state (scripts were stripped), so states the optional modules set (`tabs.js`, `dialog.js`, `carousel.js`) were compared only in their static form.
- Dark scheme, other viewports, and themes: one light, 1280-pixel run.
- Custom properties were not compared (only standard longhands), so a wrong private property shows only where a longhand reads it.

## 4. Point 2: theming without a compile step

### 4.1 The model (read)

- **Tokens.** Public tokens are custom properties named `--yeti-<group>-<name>`, set on `:root` "in your own stylesheet, after Yeti's" (`src/guides/theming.md:11`). The tokens themselves are declared on `:root` inside `@layer yeti.base` (`src/tokens/color.css:19-20`, `tokens/components.css:3-4`).
- **Derivation at runtime.** Colour inputs are six hues and one chroma; every colour role is computed from them with `oklch()` and `light-dark()` (`theming.md:26`; `tokens/color.css`, 45 `light-dark()` uses, `surface.css` 2). Hues, chroma, and the scale inputs "only take effect on `:root`, because Yeti computes every derived token there"; derived tokens such as `--yeti-color-primary` can be overridden "on any element" (`theming.md:38`). Five hues and the chroma are registered with `@property` so a bad value falls back instead of breaking every derived colour (`color.css:8-16`).
- **Schemes.** `:root` declares `color-scheme: light dark`; forcing `color-scheme: light` or `dark` on any element flips everything under it (`theming.md:52`).
- **Themes.** A theme is a stylesheet of `:root` token values outside any layer, plus optional element rules in `@layer yeti.theme`, restricted by the validator to bare-element selectors (`theming.md:85-94`). "A component's skin stays token-only: a class name belongs to Yeti" (`:115`). Each component publishes its own tokens, such as `--yeti-button-radius` and `--yeti-card-padding` (`:117`). The shipped `themes/soft.css` is 15 token declarations and no rules.

### 4.2 Measured (`theme.mjs`, three engines, same results)

The consumer's settings were an unlayered `<style>:root { --yeti-hue-primary: 30; --yeti-card-padding: 3rem; }</style>` placed **before** every Yeti file; `card.css` and `button.css` were inserted with `<link>` after load.

- The late card had 48px padding and `--yeti-color-primary` resolved to `light-dark(oklch(0.52 0.15 30), oklch(0.70 0.15 30))`. An unlayered declaration beats Yeti's layered `:root` tokens whatever the order, so the consumer's settings do not need to come after Yeti, and a component file inserted later reads them.
- A card under `style="color-scheme: dark"` took the dark surface (`oklch(0.17 0.02 30)`) against the light one (`oklch(0.97 0.02 30)`) from the same file.
- Setting `--yeti-hue-primary: 145` on `document.documentElement` at runtime re-derived the primary and the card surfaces (`oklch(0.97 0.02 145)`). I read the button background during its own transition, so its values are not reported.

### 4.3 What this means for a consumer (inferred)

A consumer's customisation is a block of custom properties in any stylesheet, or a theme file, or a runtime `style.setProperty`. No setting reaches a selector or a file's presence, because Yeti has no setting-generated classes (194 found the vocabularies closed, `research/yeti-foundation-7.md` 6.3). So a part file compiled into a library is byte-for-byte what the consumer would have compiled, and the consumer's settings never depend on a compile step.

## 5. Point 4 measurement: a library `styleUrl` with `ViewEncapsulation.None`, under SSR (measured)

I took the cheap measurement the brief offered, and added a lazy part to it.

### 5.1 Setup

- `projects/yeti-lib/src/lib/yeti-lib.ts`: `YetiCard`, a component with selector `[yetiCard]`, host class `card`, `template: '<ng-content />'`, `styleUrl: './card.css'`, `encapsulation: ViewEncapsulation.None`. `card.css` is one line: `@import 'yeti-css/css/components/card/card.css';`.
- `projects/yeti-lib/badge/`: a **secondary entry point** `yeti-lib/badge` with `YetiBadge`, the same pattern over `badge.css`.
- App (`src/app/app.ts`): an eager card behind `@if` with a toggle, the badge inside `@defer (on interaction(trigger))`, server-rendered (`RenderMode.Server`), with `provideClientHydration()`. The always-group (16 files, Yeti's order) is `@import`ed in `src/styles.css`.
- Reference: a static page with `dist/yeti.css` and the same markup.

### 5.2 Results, the same in Chromium, Firefox, and WebKit

- **Library build.** ng-packagr resolved the bare `@import` through `yeti-css`'s exports map and inlined the file, minified, into the component's `styles` (`dist/yeti-lib/fesm2022/yeti-lib.mjs`). The output keeps `@layer yeti.components`, all 6 `@container` rules, the `:has(` selector, and both `container-type` declarations of the source; 6,298 bytes of source without comments became 5,651.
- **Budgets.** The production build gave no `anyComponentStyle` warning for the 5.65 kB card style; that budget measures the app's own component stylesheets, and library styles arrive already compiled (inferred from the clean output).
- **Server HTML.** The response carries `<style ng-app-id="ng">@layer yeti.components{.card{...` once. Beasties' inlined critical `<style>` (27,201 characters) starts with Yeti's layer statement and holds no card rule; the full global stylesheet follows as a `<link>`.
- **JavaScript off:** the eager card's computed `display`, padding, gap, radius, border, background, colour, `container-type`, font size, and direction match the reference page.
- **Hydration:** 0 `<style>` or `<link>` insertions or removals after `DOMContentLoaded`; the card matches the reference. Angular reuses the server `<style>` by its `ng-app-id` (`packages/platform-browser/src/dom/shared_styles_host.ts:65-92`, read).
- **Unload:** hiding the card removed its `<style>` (count 1 -> 0) and showing it re-added it (0 -> 1), through `SharedStylesHost`'s count (`shared_styles_host.ts:184-200`, read).
- **`@defer`, client-only, with the badge chunk delayed 0 and 300 ms:** before the trigger there was no badge `<style>` and the chunk was not fetched. When `#deferred` was inserted, a `MutationObserver` callback in the same task found the badge `<style>` already present and the badge's padding and background already applied, so the badge had no unstyled frame. Its styles matched the reference.
- **Chunks.** With both components in one entry point, the badge's CSS went into `main.js` with the card's, because one FESM file is one module (the same thing 193 measured). With the badge in its own secondary entry point, its CSS rode in a lazy chunk named `yeti-lib-badge` (1.60 kB raw, 575 bytes transfer), and `main.js` held only the card.
- **Cache busting.** Adding one declaration to the installed `badge.css` and rebuilding both renamed the badge chunk (`chunk-LM6FVTEH.js` -> `chunk-O3MYD675.js`) and `main.js` (which names it), and left the shared chunk's name unchanged. Restoring the file restored the names.
- **Leave-animation guard: still leaks.** With one permanent element carrying an `(animate.leave)` listener on the page (184's L3), hiding the card left its `<style>` in place (count stayed 1). The guard is `if (allLeavingAnimations.size === 0)` before `removeStyles` in `NoneEncapsulationDomRenderer.destroy()` (`packages/platform-browser/src/dom/dom_renderer.ts:679-686`, read), unchanged from what 188 cited.

### 5.3 Not measured here

Dehydrated instances under incremental hydration (184 point 7), L1 and L2 leave scenarios, `ng serve` and HMR, CSP nonces, several applications on one page, and enter animations. The workspace keeps the L3 listener in `src/app/app.ts`; `../measure/app.ts.base` is the version without it.

## 6. Point 3: the old map's mechanisms against Yeti's plain CSS

The old map measured these against Foundation 6.9's Sass:

| Old mechanism | Where measured | What changes under Yeti |
| --- | --- | --- |
| Consumer-compiled `None` carrier per family (M1/M1') | 182, 184 | The carrier no longer has to be compiled in the consumer's project. A library-compiled carrier is the same CSS (section 5, measured). Angular's counting gaps stay. |
| Library-owned `<style>` with a `RendererFactory2` that keeps styles from `SharedStylesHost` (`own-style`), adopted sheets | 188 | The runtime is unchanged. It still needs the CSS as a string in the library; with Yeti that string can be produced at library build, with no consumer build step (inferred). |
| Counted `<link>` to an `inject: false` bundle | 189 | No Sass bundle per family: the link can point at a Yeti file copied as an asset. The fetch gap on client-only `@defer`, Beasties' copy, and URL handling stay; cache busting can key on the Yeti version, because a file's content changes only with Yeti (inferred). |
| CSS in the directive's own chunk through a library esbuild plugin (192 A) | 192, 193 | The plugin compiled Sass with the consumer's settings. Yeti needs no plugin: ng-packagr inlines a plain `@import` at library build, and a secondary entry point gives the lazy chunk (section 5, measured). The unsupported `extensions` point and the `ng serve` prebundling and watch failures in 193 do not apply to this path (inferred, `ng serve` not run). |
| Settings fingerprint for unhashed bundles (192 B) | 192 | Not needed: there are no settings in the CSS. |
| Beasties pruning through CSSOM (192 C) | 192 | Applies only to paths that put part CSS in the global stylesheet or an `inject: false` bundle. Under the `styleUrl` path the part's rules were not in Beasties' copy (section 5, measured). |
| Paint gate, `file` loader, `createRenderer(dummy, {styles})`, grace period (192 D to G) | 192 (D, E, G untested) | Unchanged in kind; F still meets the leave guard. |

### 6.1 Constraints that disappear

- **The consumer's Sass settings reaching the CSS** (ADR 0012's reason for "No library component or directive carries `styles`"): Yeti's settings are runtime custom properties, measured to apply to a late-inserted file in section 4.2.
- **A consumer compile step or a build plugin:** the library's own `styleUrl` works with stock ng-packagr and `@angular/build` (section 5). With it go 184's 9 consumer files and 63 lines, 189's 24 JSON lines, 192 A's esbuild plugin and the `@experimental` `extensions` parameter it needed, and 193's community builders.
- **Adding the `@layer` order statement:** Yeti ships it and wraps every part rule in a layer (section 2). 184 point 9's unlayered Foundation globals do not exist: every base file is in `yeti.reset` or `yeti.base` (read).
- **Companion load order** (Menu before Dropdown Menu): every part file loads alone, and appending one last changed nothing on its pages (section 3.2, measured).
- **Beasties copying a family's rules into the critical `<style>`,** for the `styleUrl` path: the copy held no card rule (section 5, measured). It stays for paths that put part CSS in global or `inject: false` stylesheets (189, 192 C).
- **Unhashed names and a one-year cache** (189): under the `styleUrl` path the CSS is inside hashed JS chunks, renamed on a content change (measured).

### 6.2 Constraints that remain

- **Angular's leave-animation guard** (`dom_renderer.ts:683`; angular/angular#66244): measured again here for the `styleUrl` path (L3 leaks in all three engines). Any path that lets `SharedStylesHost` own part CSS keeps it; 188's library-owned paths avoid it.
- **Dehydrated instances are not counted** (184 point 7): not re-measured, but nothing in Yeti changes Angular's count (inferred).
- **Directives cannot carry styles.** Only components have `styles` and `styleUrl`, so a directive-first package still needs a carrier component, a library-owned `<style>`, or a link (read, Angular's component metadata; the reasoning of 182).
- **One chunk per entry point.** A packaged library's parts share one chunk unless each is its own secondary entry point (measured here and in 193).
- **The `<link>` fetch gap** on a client-only `@defer` is structural for any fetch-on-construct loader (189, 192 critique), and Yeti does not change it (inferred).
- **The always-group must be loaded globally.** It styles bare HTML and declares every token on `:root`; 40 of 49 part files differ without `attributes.css` (measured). In section 5 the consumer imported 16 files in `styles.css`; one file or one `angular.json` `styles` line would do the same (inferred).
- **Cross-part rules can change another part's look on unload,** for example a busy button losing its ring when the last spinner unloads, or nav fragment links losing smooth scrolling when the last contents list unloads (section 3.1, read).
- **Tie order inside a layer follows insertion order** (`install.md:97`). No differences on the measured pages (section 3.2), but not checked for every pair of parts.
- **Class names cannot be hashed:** they are Yeti's frozen public contract (194, `research/yeti-foundation-7.md` section 7).

## 7. Point 4: candidates for Yeti, and what each asks of the consumer

None is chosen here. "Measured" means in this ticket or the cited old ticket.

| Candidate | How it works | What the consumer does | Status |
| --- | --- | --- | --- |
| **S1. Library `styleUrl` on a `None` component, one secondary entry point per part** | The part's component (or a hidden carrier per directive, as in 182 and 184) has `styleUrl` over a one-line `@import` of the Yeti file; ng-packagr inlines it; `SharedStylesHost` counts it | Load the always-group globally (one `styles` entry or `@import`); nothing per part | Measured in section 5: server HTML, JS off, hydration, `@defer` at 300 ms, unload, hashed chunks. Leaks under the leave guard (measured, L3). Dehydrated count gap inherited (inferred) |
| **S2. Library-owned `<style>` from a CSS string in the part's module** (188 `own-style` runtime; 192 A's placement) | A library build step turns each Yeti file into a TS module exporting the string; the directive inserts and counts its own `<style>`, writes it on the server, and adopts it at hydration | Always-group globally; nothing per part | Runtime measured in 188 and 192 against Sass output; the build step for Yeti is not built (inferred to need no consumer plugin). Avoids the leave guard (188); the library takes over nonce, server writing, and the dehydrated hold |
| **S3. Counted `<link>` to Yeti's files** (189 loader) | The library appends `<link>` to each part file and removes it after the last host leaves | Always-group globally, plus an `assets` (or `inject: false` `styles`) entry that copies `yeti-css/css/` into the build | 189's runtime results carry over (inferred). Client-only `@defer` fetch gap, Beasties' copy if the files go through `styles`, URL prefixes under `baseHref`/`deployUrl`/i18n, and cache busting (could key on the Yeti version) remain |
| **S4. Everything global** | No lazy loading or unloading | One `styles` entry for `yeti-css` (`dist/yeti.css` or `yeti.min.css`) | Yeti's documented default (`install.md`); nothing to measure |

What S1 needs that Foundation 6.9's Sass ruled out: nothing from the consumer's build. 182 ruled the library's own `styles` out because "compiled at library build time, where the consumer's settings do not exist"; under Yeti the settings are runtime tokens (section 4.2), so that reason is gone and the remaining obstacles are Angular's (section 6.2).

## 8. Open points

- Whether S2's library build step can be done with ng-packagr alone (for example a generated `.ts` per part before `ng build`), and its HMR story. Not tried.
- Enter animations: Yeti's `enter` utility is a CSS animation with `backwards` fill (`utilities/enter/enter.css:1-14`). With S1 or S2 the CSS is present at insertion (measured for the badge), so the animation should start with the element (inferred). With S3, a late sheet would start it late rather than skip it, unlike Angular's `animate.enter` class, which is removed after one frame (189). Not measured.
- Dark scheme, themes, and JavaScript-driven states in point 1's run.
- Every pair of parts for tie order inside one layer.
- Native CSS module scripts (`import sheet from './x.css' with { type: 'css' }`) as a further way to get a sheet object were not checked against the browser target.
