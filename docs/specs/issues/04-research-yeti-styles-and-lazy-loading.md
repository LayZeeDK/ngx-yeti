# 04. Research: Yeti's styling model, and loading component styles lazily

Type: research
Status: resolved
Blocked by:
Labels: wayfinder:research
Map: ../map.md

## Question

How is Yeti's CSS built and packaged, and how could an Angular package load each component's styles lazily and unload them? The package would need to meet what the old map's lazy-styles work required. In that work, the loading unit was the CSS of one Foundation export mixin, and the requirements were:

- server HTML and hydration with no unstyled frame;
- `@defer`;
- unloading after leave animations;
- enter animations that play;
- cache busting;
- no consumer code.

## How to work it

Use a `/research` subagent against `github.com/foundation/yeti` (`src/layers.css`, `src/yeti.css`, `src/tokens/`, `src/themes/`, `src/components/*/`, `bin/`, and `package.json` `exports`, with `./css/*` per file). Cover:

1. Per-component files: their layers, their dependencies on base, tokens, and other components, and whether each loads alone. Check that by loading each `dist/css/*` file with only the base and tokens in Chromium, Firefox, and WebKit.
2. Theming: tokens, themes, `light-dark()`, and how a consumer customises them, so that the consumer's settings no longer depend on a compile step.
3. The old map's measured mechanisms, against Yeti's plain CSS. The evidence is in `.scratch/next-foundation-specs/`:
   - the research and prototypes of tickets 182 to 198;
   - the Answers in `issues/18*.md` and `issues/19*.md`;
   - `research/style-loading-consult.md`.
   Then which constraints disappear for Yeti (the consumer's Sass settings, compile steps, Beasties' copy) and which remain (Angular's leave-animation guard, angular/angular#66244).
4. Candidates for Yeti with what each needs from the consumer, including the library's own `styleUrl` with no consumer build, which Foundation 6.9's Sass ruled out.

Write `research/yeti-styles-and-lazy-loading.md`, and append an `## Answer`. Decide nothing; [Decide: how component styles load and unload](13-decide-style-loading.md) chooses.

## Answer

Note, 2026-10-01 (audit 0001, M2): the measurements cover static light-scheme pages at 1280 px with scripts stripped, each file's own example and fixture only. Section 3.2 of the findings records one earlier difference on the demo pages that the final run did not reproduce and nobody explained. That the library-owned `<style>` needs no consumer plugin is inferred, because its Yeti build step was not built.

Resolved 2026-10-01 (Opus 5.5). Findings: [research/yeti-styles-and-lazy-loading.md](../research/yeti-styles-and-lazy-loading.md). Yeti `f52d1e8b9` was built in `D:/tmp/ngx-yeti-04/yeti`, and an Angular CLI 22.2.0 SSR workspace with an ng-packagr library is at `D:/tmp/ngx-yeti-04/app`. Both were measured in Chromium, Firefox, and WebKit through Playwright 1.63.0, with the same results in all three. Old tickets 190, 195, 197, and 198 had no Answer yet and are not used. Nothing is decided; 13 chooses.

- **Packaging (read).** `bin/build.js` copies `src/` verbatim to `dist/css/`, exported as `yeti-css/css/*`: 49 part files (22 components, 17 layouts, 3 recipes, 7 utilities) and an always-group (`layers.css`, 8 token files, 6 base files, `layouts/attributes.css`). Every part rule sits in a `yeti.*` layer. No part file reads a custom property that only another part file defines (measured by reading the text).
- **Point 1 (measured).** Every one of the 49 part files loads alone with the four always-groups. Each was compared with full Yeti on its example and fixture (98 pages per engine), and every remaining difference traces to another part used in the same markup. With only base and tokens, 40 of the 49 files differ, because they need `layouts/attributes.css`. Appending a file last changed nothing on its pages. Two rules cross parts on unload (read): a busy button's ring lives in `spinner.css`, and `toc.css` sets smooth scrolling for nav fragment links.
- **Point 2.** Tokens are runtime custom properties, declared on `:root` in `@layer yeti.base` (read). An unlayered consumer `:root` block placed before Yeti reached a card file inserted later: padding went to 48px and the primary hue was re-derived. `color-scheme: dark` on an ancestor flipped the card, and a runtime `setProperty` re-derived the colours (measured). Hues work only on `:root`, and derived tokens work on any element (read). No consumer setting depends on a compile step.
- **Point 4 measurement taken.** A library component with `styleUrl` over `@import 'yeti-css/css/components/card/card.css'` and `ViewEncapsulation.None` was inlined by ng-packagr with its layer and container queries intact. It came out as one `<style ng-app-id>` in the server HTML, styled with JavaScript off, with 0 style mutations at hydration. Its `<style>` was removed and re-added with the last instance. A badge in its own secondary entry point, inside `@defer`, rode in a hashed lazy chunk of 575 bytes transfer and was styled when inserted, also with a 300 ms delay. In one entry point it went into `main.js`. Changing the file renamed the chunk.
- **Constraints that disappear:** the consumer's Sass settings, every consumer compile step or esbuild plugin (and the unsupported `extensions` point), the library's own `@layer` statement, companion load order, the settings fingerprint, and, for the `styleUrl` path, Beasties' copy and unhashed URLs. The library's own `styleUrl` is no longer ruled out (measured).
- **Constraints that remain:**
  - Angular's leave-animation guard (`dom_renderer.ts:683`, angular/angular#66244). It was measured again: the card's `<style>` stayed while an `(animate.leave)` listener was on the page.
  - Dehydrated instances not counted (inferred, not re-measured).
  - Directives cannot carry styles.
  - One chunk per entry point.
  - The `<link>` fetch gap on client-only `@defer`.
  - A global always-group of 59.4 kB raw and 6.5 kB transfer, which also feeds Beasties' 27 kB inline copy.
  - Tie order within a layer.
- **Candidates:**
  - **S1:** library `styleUrl` with one secondary entry point per part. The consumer only loads the always-group. Measured, apart from the leak.
  - **S2:** a library-owned `<style>` from a CSS string generated at library build, with 188's runtime. It needs the same from the consumer and avoids the guard. The Yeti build step is untested.
  - **S3:** 189's counted `<link>` to Yeti's files. The consumer also adds an assets copy, and the fetch gap and URL handling remain.
  - **S4:** everything global, one `styles` entry.

Note, 2026-10-01 ([Task: carry the old map's Yeti findings into this bundle](05-task-carry-yeti-findings-from-old-map.md)): sections 6 and 7 of [research/yeti-foundation-7.md](../research/yeti-foundation-7.md) are an earlier reading of the styling model and lazy loading.
