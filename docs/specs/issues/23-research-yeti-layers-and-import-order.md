# 23. Research: Yeti's cascade layers and stylesheet order, for lazy loading

Type: research
Status: resolved
Blocked by: 04
Labels: wayfinder:research
Map: ../map.md

## Question

What do Yeti's documentation and CSS say about cascade layers and the order in which its stylesheets are imported (`src/layers.css`, the always-loaded group, and the per-part files)? And how can the package keep that order while it loads and unloads component styles lazily?

## User instruction, 2026-10-01

The user's own message to the orchestrator, verbatim:

> 33. Be careful to read Yeti's documentation on layers and ordering of imported styleshets and design how it can best be adopted in ngx-yeti with lazy loading/unloading of component styles.

## How to work it

Use a `/research` subagent, starting from [Research: Yeti's styling model, and loading component styles lazily](04-research-yeti-styles-and-lazy-loading.md). Sources:

- `github.com/foundation/yeti` at `f52d1e8b9`: `src/layers.css`, `src/yeti.css`, `src/guides/install.md` and its sections on order, `src/guides/components.md`, `theming.md`, and each part file's `@layer`;
- the CSS Cascade 5 spec.

Cover, citing `file:line`:

1. Yeti's layer names and order, and which file declares them.
2. Which layer each file writes to, and what the documented import order is.
3. What happens when a part file arrives after the page has rendered, or before its layer is declared.
4. Where a consumer's own unlayered CSS and themes sit.
5. The rules that cross files, which ticket 04 found (the spinner's busy ring, the table of contents' smooth scrolling).

Measure in Chromium, Firefox, and WebKit:

- each candidate insertion point for a lazily loaded part (a `<style>` appended to `<head>`, an Angular component `styleUrl`, a `<link>`), against Yeti's full stylesheet;
- an unload followed by a reload.

Then propose, as options for [Decide: how component styles load and unload](13-decide-style-loading.md), how the package declares the layer order once and loads each part into its layer.

Write `research/yeti-layers-and-import-order.md`, and append an `## Answer`. Decide nothing.

## Answer

Resolved 2026-10-01 (Opus 5.5). Findings: [research/yeti-layers-and-import-order.md](../research/yeti-layers-and-import-order.md). Yeti `f52d1e8b9` was built in `D:/tmp/ngx-yeti-23/yeti`, and ticket 04's Angular 22.2 SSR app was copied to `D:/tmp/ngx-yeti-23/app`. Both were measured in Chromium, Firefox, and WebKit through Playwright 1.63.0, on ticket 04's 98 pages per engine. Nothing is decided; 13 chooses.

- **Order (read).** `src/layers.css:7` declares `yeti.reset, yeti.base, yeti.theme, yeti.layouts, yeti.components, yeti.utilities` once. `bin/validate.js` requires `yeti.css` to import it first and the groups in order (tokens, reset, base, attributes, layouts, recipes, components, the rest), and keeps `yeti.theme` empty for themes. Tokens and base write to `yeti.base`, the reset to `yeti.reset`, layouts and recipes to `yeti.layouts`, and so on. `install.md:92-97`: `layers.css` first lets the rest arrive in any order, but inside a layer a later file still wins a tie. Order is fixed by first declaration in document order (Cascade 5 section 6.4.3, section 6.1).
- **Insertion points (measured).** A `<style>` or `<link>` appended to `<head>`, an adopted sheet, and Angular's `styleUrl` (appended by `SharedStylesHost`, after Beasties' statement-led critical `<style>` and the global `<link>`) all matched full Yeti, through unload and reload. Firefox was clean. A few pages in Chromium and WebKit showed stale computed styles with every method. A fresh copy of the elements cleared them, so they are engine invalidation, not layer order.
- **Before the statement (measured).** A part placed before `layers.css` broke 65 or 66 of 98 pages. Removing it restored them. With the statement as the part's first line, only two tie pages differed, apart from the stale-style pages in Chromium and WebKit.
- **Tie order (measured).** `stack`/`center` and `shell`/`center` tie in `yeti.layouts`. A lazy `stack` appended after `center` un-centres a center in a stack in all three engines. Inserting it in Yeti's order does not.
- **Consumer CSS (measured).** Unlayered CSS beats late parts wherever it sits, including over components (a bare `a` rule repainted `a.button`). A consumer layer before Yeti's statement sits below Yeti, and after it sits above. A theme needs to come after Yeti or carry the statement (`theming.md:113`).
- **Cross-part rules (measured).** Removing `spinner.css` removes every busy button's ring. Removing `toc.css` turns off smooth scrolling for nav fragment links.
- **Options for 13:**
  - Where the order is declared: L1, the global always-group only; L2, also the 88-byte statement atop each part; L3, a development-mode check.
  - Where parts are inserted: P1, append (`styleUrl`); P2, insert in Yeti's order through a library-owned host; P3, make `stack`, `center`, and `shell` global; P4, accept and document.
  - Cross-part rules: X1, load them with their host part; X2, make them global; X3, document.
