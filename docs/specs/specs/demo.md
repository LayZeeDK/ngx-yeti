# Spec: demo (component)

Ticket: [80. Spec: demo (component)](../issues/80-spec-demo.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 30, Part 1, and its "Hydration constraints (2026-10-03)" section; [Decide: the spec list](../issues/11-decide-spec-list.md) row 30 and question 8; [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 109 to 113 and grilling question 9; [Decide: the building-blocks map for every ngx-yeti item](../issues/25-decide-building-blocks-map.md) point 9 (the `sandbox` attribute); [Research: the decided records against Angular's hydration constraints](../issues/33-research-decided-records-against-hydration-constraints.md) row 7 and its C2 measurement; [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decisions 2, 6, 8, 36, 42, and 44; [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). The item owns [ledger.md](../ledger.md) rows A11Y-7 and A11Y-24. `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x); `NGP/` is `github.com/angular/angular/packages/` at `5db6fc4453` (22.2.0); `APG/` is `github.com/w3c/aria-practices/content/patterns/` at `3f094fd`. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 136 to 145), and each is cited where it applies.

## Problem Statement

Yeti's `demo` is "a live example in a box the reader can drag narrower and wider, with a bar naming the example and the width stop the box is at, and the code beneath it" (`Y/src/components/demo/manifest.json:6`). Its docs place it in "Documentation, a pattern library, a design-system page", and never in content a reader has to have (`Y/src/components/demo/docs.md:3`). The preview box is a size container, so whatever Yeti markup sits in it responds as it would anywhere else, and the bar's label names the width stop it is at, `xs` to `2xl`.

A framed demo written by hand carries its example twice, once escaped into an `iframe`'s `srcdoc` and once as code under the box, and the two drift (`docs.md:28`). Yeti's optional module `demo.js` fixes that: it builds the `srcdoc` from the `pre` under the box and adds a grip on the box's end edge, a `separator` that a mouse, a finger, or the keyboard can move, because the browser's own resize corner "is invisible in Safari and does nothing for touch or keys" (`Y/src/components/demo/demo.js:14-17`).

An Angular author cannot use that module as it is:

- `demo.js` scans the document once at load and watches `body` with a `MutationObserver` (`demo.js:167-175`). The package replaces every module and loads none beside itself ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md)).
- It writes `srcdoc`, the grip, and its ARIA values into DOM that Angular rendered, which the hydration constraints forbid (map, Standing rulings, 2026-10-03, item 54).
- Writing `srcdoc` again with the same value reloads the frame in Chromium, Firefox, and WebKit ([ticket 33](../issues/33-research-decided-records-against-hydration-constraints.md) C2, measured), so anything that rewrites it at hydration loads the example twice.
- The frame runs whatever the code holds (`demo.js:74`), and nothing restricts it ([ticket 25](../issues/25-decide-building-blocks-map.md) point 9).
- The grip lacks two things the APG's window splitter asks for: `aria-controls` naming the pane, and Enter to collapse and restore (ledger A11Y-7; `APG/windowsplitter/windowsplitter-pattern.html:59-60`, `:95`).

`demo` is the only item whose markup the package generates, and so one of the package's two **Angular component**s, with the field's `YetiFieldError` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 159; ticket 11 row 30; building-blocks Part 2 row 30).

## Solution

`YetiDemo` is an Angular component in `ngx-yeti/demo`, written on the consumer's `figure` as `<figure yetiDemo>` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 136). The consumer gives it the example's name in `preview` and its markup in `code`, plus Yeti's `height`, `width`, `resize`, and `stylesheet` where wanted. The component renders Yeti's documented structure inside the figure:

- the consumer's projected `figcaption`;
- the preview box with its `data-preview` name and a generated id;
- a sandboxed `iframe` whose `srcdoc` it builds from `code`;
- after hydration, the grip;
- a `details` showing `code` in a `pre`, under the consumer's projected `summary`.

The server renders the frame and the code, so a reader with JavaScript off sees the example styled and can resize it with the browser's corner, as with Yeti and no module. Once the application is live, the grip appears. It is a window splitter: Arrow keys and Home and End as `demo.js` has them, plus Enter to collapse and restore, `aria-controls` to the box, and pointer capture for a drag. The frame loads a second time at hydration, because the platform reloads it on any `srcdoc` write; the spec documents this and measures it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 138).

## User Stories

1. As an author of a pattern library, I want to write an example's markup once and see it both live and as code, so that the two never drift.
2. As an author, I want to write `<figure yetiDemo preview="Card" [code]="card">`, so that I write Yeti's element and an attribute, not Yeti's class or its `data-*` attributes.
3. As an author, I want `code` to be an input rather than a projected `pre`, so that the frame's `srcdoc` is the same string on the server and the client.
4. As an author, I want the visible code rendered from the same `code` value, so that the code under the box is always what the frame shows.
5. As an author, I want `preview` to name the example, so that the bar shows the name and assistive technology hears it.
6. As an author, I want a compile error when I leave out `preview` or `code`, so that I never ship an unnamed frame or an empty box.
7. As an author, I want `height`, `width`, and `resize` typed by Yeti's `height`, `width`, and `resize` vocabularies, so that a misspelt value fails to compile.
8. As an author, I want `stylesheet` to point the frame at another Yeti build, such as one in my brand's colours, so that the example looks as it will on the site it documents.
9. As an author, I want the frame to load Yeti's whole stylesheet from the build my application already serves, by default, so that I configure nothing extra.
10. As an author, I want relative picture paths in my example to resolve beside the frame's stylesheet, as `demo.js` arranges, so that one example works from any page.
11. As an author, I want my `figcaption` projected as the figure's first child, so that the demo has a title above the box, styled by Yeti.
12. As an author, I want my `summary` projected into the code's `details`, so that the toggle reads in my words and my language.
13. As an author, I want other content I write inside the figure, such as attribute controls, placed after the code, so that a docs page can add its own things, as Yeti's docs site does.
14. As an author, I want the template reference `#d="yetiDemo"`, so that the component follows the package's `exportAs` rule.
15. As an author, I want to import `YetiDemo` from `ngx-yeti/demo`, so that a `@defer` block can split it.
16. As an author, I want the package to state that `code` must be markup I wrote and never data from a user, so that I do not open my site to injected markup.
17. As a site owner, I want the frame sandboxed, so that an example's markup can never script my page, read its storage, or navigate it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 137).
18. As an author, I want to know that the frame runs no script, so that I write examples that show Yeti's CSS and the platform, which is what an ngx-yeti application shares with Yeti ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 137).
19. As an author, I want a `dialog` example's `form method="dialog"` close button to work inside the frame, so that platform-only examples behave as on a page.
20. As an author using Trusted Types, I want to know which policy name the frame needs, so that my content security policy allows it.
21. As a reader, I want to drag the grip with a mouse or a finger and see the example respond, so that I see the item's responsive behaviour.
22. As a keyboard user, I want Tab to reach the grip and Arrow Left and Arrow Right to step the box to the next width stop, so that I can resize without a pointer.
23. As a keyboard user, I want Home and End to take the box to its narrowest and widest, so that I reach the ends in one key.
24. As a keyboard user, I want Enter to collapse the box to its narrowest and Enter again to restore it, so that the grip follows the APG window splitter (A11Y-7).
25. As a screen-reader user, I want the grip to announce itself as a separator named after the example, valued by the width stop, so that I know what moves and where it stands.
26. As a screen-reader user, I want the grip's `aria-controls` to name the preview box, so that the relation between grip and pane is exposed (A11Y-7).
27. As a pointer user who cannot drag, I want a single-pointer way to change the width, so that the grip meets WCAG 2.2 2.5.7 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 144).
28. As a reader in a right-to-left page, I want the arrow keys and the drag mirrored, so that Arrow Right moves the edge toward the end of my reading direction.
29. As a reader, I want the grip on the box's end edge, halfway down, wherever the box's width is, so that I see what moves.
30. As a reader, I want the bar's stop label and the grip's value to flip at the same widths, so that what I see and what I hear agree.
31. As a reader with JavaScript off, I want the example rendered and styled in the frame and the code readable, so that the page keeps its content.
32. As a reader with JavaScript off, I want the browser's own resize corner to keep working, so that I can still narrow the box with a mouse.
33. As a reader, I want the frame titled with the example's name, so that I know what the frame holds before I enter it.
34. As a keyboard user, I want Tab to move from the frame's content to the grip and then to the code's summary, so that the frame does not trap focus.
35. As an author, I want the item file loaded when the first demo renders and removed after the last, so that pages without a demo load nothing for it.
36. As an author rendering on the server, I want the frame, the code, and the item link in the server HTML, so that the first paint is complete.
37. As an author, I want to know that the frame loads a second time at hydration, so that I do not rely on state a reader gave the example before the application was live.
38. As an author of a client-only `@defer` block, I want to know that `demo` in the preload list avoids unstyled frames, so that the box does not flash at its own size.
39. As an author, I want the component to work inside `hydrate never`, so that a static docs page needs no client code for its demos.
40. As an author, I want the component to work zoneless, so that it fits the package's change-detection rule.
41. As an author, I want the component's template to contain no `@boundary` and no `@defer`, so that my own blocks decide where those apply.
42. As an author, I want the component to render no string of its own, so that my demos read in my language.
43. As a maintainer, I want every behaviour of `demo.js` listed as kept, changed, or removed, so that the replacement is checkable against the pin.
44. As a maintainer, I want the stop table checked against the thresholds in Yeti's `demo.css` at the pin, so that a pin move that changes them fails a test.
45. As a maintainer, I want the frame's load count across hydration measured in three engines, so that the documented reload is evidence, not a guess.
46. As a maintainer, I want the sandbox measured (no script runs, forms submit, platform openers work), so that the security claim is tested.
47. As a maintainer, I want the contract check to cover the class, the four attributes, and the marker, so that a pin move that renames one fails before any story.
48. As a maintainer, I want ledger row A11Y-7 tested at layers 1, 2, and 4, so that the two additions over Yeti stay true.
49. As an accessibility reviewer, I want the grip's colour at rest checked against its neighbour at 3:1 and the bar's text at 4.5:1, so that the parts axe does not see are still checked.
50. As an Angular developer, I want the grip to appear only once the application is live, so that no control is focusable before it can do anything.
51. As an Angular developer, I want no DOM written outside bindings before hydration, so that the component meets the hydration constraints.
52. As a docs reader on a phone, I want the grip's hit area wider than the pill, as Yeti draws it, so that a finger can take it.

## Implementation Decisions

### 1. Yeti contract

From the manifest (`Y/src/components/demo/manifest.json`), the docs, and `demo.css`:

| Manifest field | At the pin |
| --- | --- |
| `name`, `kind`, `class` | `demo`, `component`, `demo`; `classes` empty |
| `attributes` | `data-height` (vocabulary `height`: sm, md, lg, xl, half, full; default `md`), `data-width` (vocabulary `width`: 2xs to 2xl; no default, full width when absent), `data-resize` (vocabulary `resize`: width, both; default `width`), `data-stylesheet` (string; "Read by the module") |
| `children` | `> figcaption` (0 to 1, "A title for the demo, above the box"); `> [data-preview]` (1, "The resizable box"); `> [data-preview] > iframe` (0 to 1, "Needs a title"); `> details` (0 to 1, "The code, collapsed: a summary reading View Code ... and a pre") |
| `markers` | `data-preview` (string, on `> div`): "Marks the resizable box and names the example" |
| `tokens` | 22 public (listed in section 2) and 7 private (`--_yeti-width`, `--_yeti-height`, `--_yeti-demo-inset`, `--_yeti-demo-max`, `--_yeti-demo-grip`, `--_yeti-demo-edge`, `--_yeti-demo-middle`) |
| `a11y` | keyboard: Enter and Space on the summary; Arrow Right and Arrow Left, Home and End on the grip "(with the module)". Notes: give the iframe a title; a framed box needs no `tabindex`; the grip is "a separator named "Resize" and the example's name, valued in pixels with the width stop as its text"; "a demo must never be the only place the markup appears"; the bar and stop label are generated content and not announced |
| `js` | `demo.js`, optional; no events |
| `support` | unguarded: container size queries, `resize`, `iframe srcdoc`; `:has()` is used and not declared (upstream-bugs Y8) |

How it works, in `@layer yeti.components` (`Y/src/components/demo/demo.css`): the box `.demo > [data-preview]` is a content-box grid of two rows (bar, example), a size container (`container-type: inline-size`), with `resize: horizontal` (`both` under `[data-resize="both"]`) and `overflow: auto`. Its inline size reads `--_yeti-width` from the always-loaded `[data-width]` mapping, capped at the container less its border and inset. Its block size reads `--_yeti-height`, `md` when `data-height` is absent (`:34-60`). An `iframe` in the box fills it with no border (`:66-72`). The bar is `::before` with `content: attr(data-preview)`, and the stop label is `::after`, whose `content` flips from `xs` at the literal thresholds 24, 32, 48, 64, and 80 rem (`:129-179`). The grip is a sibling `[role="separator"]` placed absolutely in the figure at `--_yeti-demo-edge` and `--_yeti-demo-middle`, which "the module measures and writes inline". Once it exists, the box's own corner keeps only height, and only under `[data-resize="both"]` (`:181-234`).

Attributes left to the consumer: none (ticket 26 rows 109 to 113). The `figcaption` and `summary` text and any `id` on the figure are the consumer's.

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `demo` | static host class on `figure[yetiDemo]` (`YetiDemo`) | always | ADR 0003 point 1; Part 2 row 30; selector ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 136) |
| Attribute `data-height` | box height | input `height`: `YetiHeight \| undefined`, `[attr.data-height]` | unset renders nothing; Yeti's `md` applies. Static form: `inert` (HTML `height` is a hint on `img`, `table`, `iframe`, `video`, `canvas`, not on `figure`) | ticket 26 row 109 (R); building-blocks 1.4 |
| Attribute `data-width` | starting width | input `width`: `YetiWidth \| undefined`, `[attr.data-width]` | unset renders nothing; full width. Static form: `inert` | ticket 26 row 110 (R) |
| Attribute `data-resize` | which way the corner drags | input `resize`: `YetiResize \| undefined`, `[attr.data-resize]` | unset renders nothing; Yeti's `width` applies. `resize` is not an HTML attribute | ticket 26 row 111 (R) |
| Attribute `data-stylesheet` | the frame's stylesheet | input `stylesheet`: `string \| undefined`, `[attr.data-stylesheet]`; also read to build the frame | unset renders nothing; the frame then loads `yeti.css` from the setup's `url` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 142) | ticket 26 row 112 (R); ADR 0070 rule 3 |
| Marker `data-preview` (on `> div`) | names the box and the example | input `preview` on `YetiDemo`: `input.required<string>()`, bound `[attr.data-preview]` on the preview box the template renders | required: a frame needs a title and a separator a name (WCAG 4.1.2), building-blocks 1.4's "the spec lists any default it changes and why" | ticket 26 row 113 (P) and grilling question 9 |
| Child `> figcaption` | title above the box | the consumer's, projected first (`<ng-content select="figcaption">`) | optional | manifest `children` |
| Child `> [data-preview] > iframe` | the framed example | rendered by the template: `title` from `preview`, static `sandbox`, `srcdoc` from `code` | always | Part 2 row 30; sandbox ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 137) |
| Child `> details` | the code | rendered by the template: projected `summary`, then `pre > code` with `code`'s text | always | manifest `children` and `a11y.notes` ("a demo must never be the only place the markup appears"); strings ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 140) |
| Package input `code` | not Yeti's (the module read the `pre`) | `input.required<string>()` | required | building-blocks "Hydration constraints (2026-10-03)"; ticket 33 row 7 |
| Grip `[role="separator"]` | inserted by `demo.js:98-106` | rendered by the template after hydration (section 7) | absent in server HTML ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 139) | Part 2 row 30 |
| Events | none | no output | not applicable | manifest `js`; [events](events.md) |
| Tokens `--_yeti-demo-edge`, `--_yeti-demo-middle` | private, "Written inline by the module" (`demo.css:204-206`) | style bindings on the grip, in pixels, from signals | absent until the first measurement; Yeti's fallbacks `100%` and `50%` apply | ADR 0004, amended by a dated note to allow it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 141) |
| Token `--yeti-space-md` | "Padding of the framed document's body, written by the module" | written into the frame document's `body` style, as `demo.js:74` does | always | manifest `tokens` |
| Other public tokens (`--yeti-height-md`, `--yeti-height-sm`, `--yeti-demo-border`, `--yeti-demo-radius`, `--yeti-demo-label`, `--yeti-color-text`, `--yeti-weight-strong`, `--yeti-control-border`, `--yeti-width-xs`, `--yeti-border-width`, `--yeti-space-xs`, `--yeti-space-sm`, `--yeti-text-sm`, `--yeti-color-text-muted`, `--yeti-font-mono`, `--yeti-leading-md`, `--yeti-color-border-strong`, `--yeti-color-focus`, `--yeti-color-surface`, `--yeti-radius-full`, `--yeti-duration-fast`) | read by `demo.css` | the consumer's; the package writes none | not applicable | ADR 0004 |
| Other private tokens | `--_yeti-width`, `--_yeti-height`, `--_yeti-demo-inset`, `--_yeti-demo-max`, `--_yeti-demo-grip` | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-demo=""` on the host | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2 |
| Generated id (package) | not Yeti's | `ngx-yeti-demo-<n>` on the preview box, from `injectYetiId('demo')` in the internal directive `YetiDemoPreview` | always | ADR 0044; [generated-ids](generated-ids.md) |

The input value types are Yeti's own, from the package's generated `yeti-types.ts`, re-exported by name and never redeclared ([ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md) point 5; ADR 0060 point 10). `YetiHeight`, `YetiWidth`, and `YetiResize` are among the 46 names `yeti.d.ts` exports; `YetiDemo` and `YetiDemoPreview` are not, so both take `Yeti` (ADR 0080 point 4 and its 2026-10-03 note).

**Module replaced: `demo.js`** (175 lines; ADR 0040; Part 2 row 30). Line by line:

| `demo.js` | Behaviour | Here |
| --- | --- | --- |
| `:27-29` `widthFromDrag` | a drag moves the end edge with the pointer, mirrored in right-to-left, clamped to the box's min and max | kept, as a pure function |
| `:34-40` `stepWidth` | a key steps to the next stop strictly beyond the current width; past the last stop, to the max or min | kept, as a pure function |
| `:44-49` `stopName` | the stop a width is at, named as the bar's label names it; `xs` below `sm` | kept, as a pure function |
| `:51-53` `stylesheetFor` | `data-stylesheet`, else the host page's `link[href$="yeti.css"]` | changed: `stylesheet`, else `yeti.css` under the setup's `url`; an ngx-yeti page has no `yeti.css` link (ADR 0060) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 142) |
| `:55-67` `fill` (finding) | fills an empty box or an `iframe` without `srcdoc`; leaves a filled frame and direct markup alone | changed: the template always renders the frame from `code`; direct markup in the box is out of scope |
| `:63` frame title | `` `${preview \|\| 'Example'}, live` `` | changed: the title is `preview` itself, which the manifest says it carries; ", live" and "Example" are package strings ([architecture-guide](../architecture-guide.md) P21) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 140) |
| `:68-74` frame document | `<base>` beside the stylesheet, the stylesheet `<link>`, a module `<script>` for `yeti.js`, a `body` with no margin and `--yeti-space-md` padding, then the code, trimmed | changed: the same document with no `<script>`, and a relative `<base>` built from `stylesheet` by string, so no `document.baseURI` read is needed ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 137 and 142) |
| `:79-83` stops | the width tokens' defaults in rem, times the root font size | kept; the root font size is read in render callbacks |
| `:85` `contentWidth` | the box's computed inline size | kept, in render callbacks and handlers |
| `:88-96` `limits` | min and max read by writing `0px` and `100000px` and restoring | kept, after hydration only ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 143) |
| `:98-106` grip | a `div`, `role="separator"`, `aria-orientation="vertical"`, `aria-label` "Resize" plus the name, `tabIndex = 0`, inserted after the box | changed: rendered by the template once live ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 139); named by `preview` alone ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 140); adds `aria-controls` (A11Y-7) |
| `:111-122` `update` | `aria-valuemin`, `-max`, `-now` rounded, `aria-valuetext` "<stop>, <n> pixels", and the two private tokens | kept as bindings from signals; value text is the stop name ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 140); private tokens ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 141) |
| `:123-126` `set` | writes the box's inline `inlineSize` | changed: a `[style.inline-size.px]` binding from a signal |
| `:127-129` two `ResizeObserver`s | on the box (values) and the figure (limits) | kept, created in `afterNextRender`, disconnected on destroy (Part 2 row 30) |
| `:131-149` pointer | primary button only, `preventDefault`, focus, pointer capture, `pointermove` until `lostpointercapture` | kept, as template listeners on the grip; a release with no width change becomes a single-pointer step ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 144) |
| `:151-160` keys | Arrow Left and Right step (mirrored in right-to-left), Home and End | kept; Enter added (A11Y-7) |
| `:163-175` `enhance`, `enhanceAll`, `MutationObserver` on `body` | finds every `.demo` at load and later | removed: each component instance sets itself up (ADR 0040) |

### 3. Hierarchy and DI shape

- `YetiDemo` is one of the package's two **Angular component**s, with `YetiFieldError` (ticket 50 decision 159). It provides no **Injection token**, injects no parent, hosts no directive, and is hosted by none (Part 2, "Two findings that hold across the matrix").
- `YetiDemoPreview` is an internal directive on the preview box in the component's own template, `exportAs: 'yetiDemoPreview'`. It is not exported from the entry point. It calls `injectYetiId('demo')` in a field initializer and binds the result as `[attr.id]`, because the directive whose host renders the id calls the helper ([generated-ids](generated-ids.md), "Who calls `injectYetiId`"). The grip binds `aria-controls` to that value through a template reference. The component does not call `injectYetiId` itself, because adoption would read the figure's own `id`, and a consumer's `id` there would become a second element's id.
- Injections in `YetiDemo`: `DomSanitizer`, to mark the frame document trusted (section 4); `DestroyRef`; the configuration of `provideYetiStyles()` for the default stylesheet ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 142); the item-file helper of [setup](setup.md), `injectYetiItemStyles('demo')`, as the last statement of the constructor (ticket 50 decision 42).
- `Directionality` is not injected: the arrow keys and the drag follow the box's computed `direction`, read in the handler ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 143).
- `imports`: `YetiDemoPreview` (building-blocks 1.9).

### 4. API

| Member | `YetiDemo` |
| --- | --- |
| Class name | `YetiDemo`, not among the 46 names `yeti.d.ts` exports (ADR 0080 point 4) |
| Selector | `figure[yetiDemo]` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 136; Part 2 row 30, which wrote `<yeti-demo>`, is amended) |
| `exportAs` | `yetiDemo` |
| Entry point | `ngx-yeti/demo` (building-blocks 1.3; ADR 0011 clause 10) |
| Metadata | `changeDetection: OnPush`, `encapsulation: ViewEncapsulation.None`, no `styles` or `styleUrl` (ADR 0060: the item file is a counted link) |
| Inputs | `preview: string`, required; `code: string`, required; `height: YetiHeight \| undefined` (Yeti default `md`); `width: YetiWidth \| undefined` (full width); `resize: YetiResize \| undefined` (`width`); `stylesheet: string \| undefined` |
| Host | static `class: 'demo'`; static `data-ngx-yeti-item-demo: ''`; `[attr.data-height]`, `[attr.data-width]`, `[attr.data-resize]`, `[attr.data-stylesheet]` from the inputs, `null` when unset |
| Models, outputs, public methods | none |
| Private state (signals) | `live` (set in `afterNextRender`); `widthPx` (the dragged width, `undefined` until a drag or key); `nowPx`, `minPx`, `maxPx`, `edgePx`, `middlePx` (from the observers); `collapsedFrom` (the width Enter restores) |
| Lifecycle | `afterNextRender`: sets `live`, creates the two `ResizeObserver`s, and registers their `disconnect` on `DestroyRef`. Constructor: acquires the `demo` item file last |

The template, in order: `<ng-content select="figcaption">`; the preview box (`div`, `YetiDemoPreview`, `[attr.data-preview]`, `[style.inline-size.px]="widthPx()"`) holding the `iframe` (`[title]="preview()"`, static `sandbox`, `[srcdoc]` from a `computed`); `@if (live())` the grip; the `details` with `<ng-content select="summary">` and a `pre` holding a `code` whose text is `code()`; then `<ng-content>` for anything else. It contains no `@defer` (ADR 0011 clause 10) and no `@boundary` (ticket 50 decision 44).

**The frame document.** A `computed` builds one string from `stylesheet` (or the default) and `code`. Its parts are a `<base href>` set to the stylesheet's folder (everything up to its last `/`), a `<link rel="stylesheet">` to its file name, a `body` with `margin: 0` and `padding: var(--yeti-space-md)`, and `code`, trimmed. This is `demo.js:74`'s document with no script ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 137). Relative URLs resolve because an `iframe srcdoc` document's fallback base URL is its container's (inferred from the HTML standard; layer 4 measures it under a non-root `<base href>`). The string depends only on inputs, so it is equal on the server and the client.

The component binds the string to `[srcdoc]` through `DomSanitizer.bypassSecurityTrustHtml`. `iframe|srcdoc` is an HTML security context (`NGP/core/src/sanitization/dom_security_schema.ts:79`). Angular's HTML sanitizer keeps none of `link`, `base`, `style`, or `data-*` (`NGP/core/src/sanitization/html_sanitizer.ts:52-112`), so a sanitized value would lose Yeti itself. The bypass is safe only because `code` is the author's markup (usage rule 2) and the frame is sandboxed ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 137). `sandbox` is a static attribute in the template: Angular refuses to bind it on an `iframe` and removes a frame that has one bound (`dom_security_schema.ts:127-153`; `NGP/core/src/sanitization/iframe_attrs_validation.ts:15-34`). That is also why the component offers no `sandbox` input. Under Trusted Types the bypassed value goes through the `angular#unsafe-bypass` policy (`NGP/core/src/util/security/trusted_types_bypass.ts:44-45`; `sanitization.ts:63-69`).

**Usage rules** (numbered here and in the component's JSDoc; the first milestone reports no breach, map, Milestones):

1. Write `yetiDemo` on a `figure` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 136). Put a `figcaption` and a `summary` inside it if wanted, and anything else after them. The component renders the box, the frame, the grip, and the `details`.
2. `code` is markup the author wrote: a constant in the author's source. Never bind it from a user, a URL, a request, or a content store. The component marks it trusted for `srcdoc`, and the sandbox is a second line of defence, not the first.
3. `preview` names the example. It is the frame's `title` and the grip's name, so it says what the example is ("Card", "Nav with a drawer").
4. The frame runs no script ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 137). An example that needs a Yeti module shows its no-module state, which Yeti documents for every item. A `<script>` in `code` does nothing.
5. A demo is never the only place an example's markup appears, and never holds content a reader has to have (`docs.md:3`; manifest `a11y.notes`). The component always shows the code.
6. The frame does not see the host page's tokens or theme. To show the example in other colours, point `stylesheet` at a themed Yeti stylesheet, relative to `<base href>` or absolute, as Yeti's "plain yeti.css" advice does (`demo.js:8-12`).
7. Bind `code`, `preview`, and `stylesheet` from values that are the same on the server and the client. Hydration writes `srcdoc` again either way, and a different value shows a different example after hydration.
8. With Trusted Types enforced, allow the `angular#unsafe-bypass` policy name in the `trusted-types` directive.
9. Under a content security policy that blocks inline style attributes, the frame inherits the policy, so the frame body's padding is blocked; the example still renders (inferred; layer 4 records it).
10. Do not write `class="demo"`, a `data-*` attribute of Yeti's, or `data-ngx-yeti-item-demo` on the figure. (The markup inside `code` is a plain Yeti page and does write Yeti's classes and attributes; the rule is about the Angular template.) The component binds them, and hydration writes a static attribute back before the binding wins (ADR 0003; building-blocks, "Hydration constraints (2026-10-03)"). A value newer than the pin goes through `$any` (ADR 0070).
11. Import `YetiDemo` in every component whose template writes `yetiDemo`. A **Forgotten import** renders a bare `figure` with the projected content and no box; the required inputs make the compiler report it (NG8002) as soon as one is bound (building-blocks 1.9).

### 5. Material comparison

| Aspect | ngx-yeti `demo` | Nearest in Angular Material and CDK |
| --- | --- | --- |
| Shape | one component on the consumer's `figure` | no Material or CDK splitter, frame, or code viewer; Aria has none (`NC/src/aria` lists accordion, combobox, grid, listbox, menu, tabs, toolbar, tree; Part 2 row 30) |
| Value text | the stop name, from Yeti's `width` vocabulary ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 140) | `MatSlider`'s `displayWith: (value) => string` feeds `aria-valuetext` (`NC/src/material/slider/slider.ts:366`, `:746`; `slider-input.ts:73`): a consumer function, the shape P21 names |
| Drag | pointer capture on the grip, about 10 lines | CDK `cdkDrag` (`NC/src/cdk/drag-drop/directives/drag.ts:61`) moves an element by transform; it resizes nothing and is not used |
| Ids | `injectYetiId` | CDK `_IdGenerator` (`NC/src/cdk/a11y/id-generator.ts:22`) underlies the package's helper (ADR 0044) |
| `exportAs` | `yetiDemo` | `matSlider` (`slider.ts:75`) |

Nothing from Material's API is adopted. The value-text function is the one shape the comparison offers, and point 5 weighs it.

### 6. Implementation level and primitives

Custom Angular, level 4 (Part 2 row 30). Reason: it is the only item whose markup the package generates (ticket 11 row 30), and the grip is a control no platform element gives. Neither Aria nor CDK has a window splitter (Part 2 row 30, `NC/src/aria` listing checked). CDK is used through the generated-ids helper only. The platform carries the rest: `iframe srcdoc` with `sandbox`, `details`, CSS `resize` for the no-script corner, container queries for the bar's label, pointer capture, and `ResizeObserver` (all inside Baseline 2025, building-blocks 1.2). DOM reads run in `afterNextRender` and in observer callbacks and handlers (building-blocks 1.5).

### 7. ARIA, keyboard, and the ledger

**APG pattern: window splitter** (`APG/windowsplitter/windowsplitter-pattern.html`), a variable vertical splitter whose primary pane is the preview box.

| Element | Role and attributes | Source |
| --- | --- | --- |
| Figure | native `figure`, named by a projected `figcaption` | HTML |
| Frame | `iframe` with `title` = `preview` | manifest `a11y.notes`; WCAG 4.1.2 |
| Preview box | `div` with `data-preview` and generated `id`; no `tabindex`, because the frame fills it and it never scrolls | manifest marker note |
| Grip | `role="separator"`, `aria-orientation="vertical"`, `tabindex="0"`, `aria-label` = `preview` (APG: "an accessible name that matches the name of the primary pane", `:35`; `:92-93`), `aria-controls` = the box's id (`:95`), `aria-valuemin`, `aria-valuemax`, `aria-valuenow` in rounded CSS pixels (`:82-90`), `aria-valuetext` = the stop name | `demo.js:102-116`; A11Y-7; point 5 |
| Code | native `details` and `summary`; the summary's text is the consumer's or the browser's default | Yeti markup; P21 |

Keyboard on the grip (handlers change state first and call `preventDefault()` last, building-blocks 1.5):

| Key | Action | Source |
| --- | --- | --- |
| Arrow Right / Arrow Left | step to the next wider or narrower stop, mirrored when the box's computed `direction` is `rtl` | `demo.js:158-159`; APG `:54-55` |
| Home / End | to the box's min or max | `demo.js:156-157`; APG `:63-68` (optional there) |
| Enter | at a width above the min, remember it and go to the min; at the min with a remembered width, restore it; at the min with none, nothing | APG `:59-60`; ledger A11Y-7 |
| Arrow Up / Down, F6 | nothing: a vertical splitter, and F6 is optional | APG `:56-57`, `:70` |

Pointer: a primary-button press on the grip focuses it and captures the pointer; moves set the width with `widthFromDrag`; the capture's end stops it. A press and release that changed nothing becomes a single-pointer step ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 144). Focus order: the frame's content, the grip, the summary, then projected trailing content. The grip's ring is Yeti's base `:focus-visible` ring, which ticket 17 found on every stop, and Yeti's CSS adds the focus colour to the pill and the box's end edge (`demo.css:233-234`).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.1.1 Non-text Content | The example's own alternatives are the author's; the frame is titled. |
| 1.3.1 Info and Relationships | Native `figure` with `figcaption` (point 1), `details`, a named frame; the grip's `aria-controls` exposes its pane (A11Y-7). The bar and stop label are generated content and are not announced, as Yeti designs (manifest `a11y.notes`). |
| 1.4.3 Contrast (Minimum) | The bar's text and the stop label are text that axe does not check (generated content); the play function asserts 4.5:1 for both in both schemes (ticket 50 decision 8). If Yeti's default fails, the spec adds a package rule under a new ledger row. |
| 1.4.10 Reflow | The box is capped at its container (`demo.css:49-52`); a long code line scrolls inside `pre`, which WCAG's understanding allows for code (ticket 17 measured `scrollWidth 333` from a `code` line; inferred acceptable). |
| 1.4.11 Non-text Contrast | The grip at rest (`--yeti-color-border-strong`) against the page and the box edge: asserted at 3:1 in the play function. |
| 2.1.1 Keyboard | Arrow keys, Home, End, and Enter on the grip once live. With JavaScript off, resizing is the browser's mouse-only corner, as Yeti documents for no module; the code and the example stay readable (section 10). |
| 2.1.2 No Keyboard Trap | Tab leaves the frame's content to the grip in three engines (layer 4; ticket 17 saw Firefox's walk end inside the frame at its 14-press limit). |
| 2.4.3 Focus Order | DOM order: frame, grip, summary. |
| 2.4.7 Focus Visible | Yeti's ring on the grip and the summary (ticket 17, measured on every stop). |
| 2.5.7 Dragging Movements | The grip's drag needs a single-pointer alternative; the native corner is the user agent's and exempt ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 144; ledger A11Y-24). |
| 2.5.8 Target Size (Minimum) | The pill is 6 by 40 px, and its `::before` hit area is 26 by 56 px (`demo.css:210-212`, `:224-229`); ticket 17 measured axe 0 violations with `target-size` on with the grip present (section 4.10). Layer 1 asserts the hit area is at least 24 px wide. |
| 4.1.2 Name, Role, Value | `separator` with name, value, and `aria-controls`; a titled frame; the Story gate runs axe's `frame-title` and `aria-*` rules. |

**Ledger rows owned:** A11Y-7, closed by `aria-controls` to the box's generated id and Enter's collapse and restore (ledger; Part 2 row 30). Its "Tested by" reads L1; this spec tests it at L1, L2, and L4 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 145; the ledger cell now reads L1, L2, L4). The row for 2.5.7 is [A11Y-24](../ledger.md), also owned by this item (decision 144).

### 8. Rendered HTML

Consumer markup:

```html
<figure yetiDemo preview="Card" width="lg" [code]="cardCode">
  <figcaption>A card, side by side from md</figcaption>
  <summary>View Code</summary>
</figure>
```

Server HTML: the `figure` carries `yetidemo=""`, `preview="Card"`, `width="lg"` (inert), `class="demo"`, `data-width="lg"`, and `data-ngx-yeti-item-demo=""`, and no `data-height`, `data-resize`, or `data-stylesheet`. Its children, in order:

1. the `figcaption`;
2. `<div data-preview="Card" id="ngx-yeti-demo-0">` holding `<iframe title="Card" sandbox="allow-forms" srcdoc="...">`, whose `srcdoc` is the frame document, escaped;
3. `<details>` holding the `summary` and `<pre><code>` with the code as text.

There is no grip. The server writes the item link into `<head>`: `href` `<url>components/demo/demo.css?v=<pin>`, with `data-ngx-yeti-styles="demo"`, `data-ngx-yeti-app`, `data-beasties-skip`, and the `CSP_NONCE` when provided (ADR 0060 points 2, 3, and 5).

Hydrated DOM: the same, and then, in the frame after hydration, a `div` after the box: `role="separator"`, `aria-orientation="vertical"`, `tabindex="0"`, `aria-label="Card"`, `aria-controls="ngx-yeti-demo-0"`, the four value attributes, and `style="--_yeti-demo-edge: ...px; --_yeti-demo-middle: ...px"`. Yeti's CSS then hands the width to the grip (`resize: none` on the box, `demo.css:197-201`). After a drag, the box carries `style="inline-size: ...px"`.

The delta from Yeti's docs markup: the consumer writes `figure yetiDemo` with inputs where the docs write the class, `data-*`, the box, the `details`, and the `pre`; the code is one input; the frame has a `sandbox`; the frame and grip are named by `preview` alone.

### 9. Animation

None of the package's. Yeti's CSS transitions the grip's and the edge's colour over `--yeti-duration-fast` (`demo.css:198-199`, `:222`), which Yeti's tokens collapse under reduced motion (building-blocks 1.6 point 4). The width changes at once. The grip enters by `@if` with no `animate.enter`, because it is not server-rendered and needs no entrance (ADR 0010).

### 10. Rendering modes

- **Server output and first paint:** section 8. The host attributes, the box's `data-preview` and id, the frame's `title`, `sandbox`, and `srcdoc`, the code, and the item link are all bindings or template output (ADR 0011 clause 1). The `srcdoc` property serialises as an attribute on the server (Angular's DOM emulation reflects `srcdoc`; read in the installed platform-server 21.0.6, inferred for 22.2; layer 3 asserts it). Nothing is **Pre-hydration state**: the frame's content belongs to the frame, and dragging the native corner before hydration writes an inline size on the box that hydration leaves alone, because the binding is `undefined` (inferred; layer 4 checks).
- **Before hydration:** the component creates no node outside its template, reads no layout, starts no observer, and touches no `window`. The only constructor work is the item acquisition, which runs on the server too (ADR 0060).
- **Full hydration:** the nodes are claimed; the id is adopted (ADR 0044); `srcdoc` is written again on the first client pass, so the frame loads a second time and loses anything a reader did inside it (ticket 33 C2 measured the platform half; the Angular half is inferred). The spec documents this rather than avoiding it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 138; decision 36 for `frame`). After the first render, `live` turns on and the grip appears.
- **Incremental hydration:** the dehydrated demo is its server HTML: the frame shows, the corner resizes, and no grip exists. When the block hydrates, the frame reloads once and the grip appears. The presence attribute keeps the item link while the host is connected (ADR 0060 point 4).
- **`hydrate never`:** as dehydrated, for good. No grip ever appears, and the native corner stays.
- **Client-only `@defer`:** the item file is fetched when the component is constructed, so the box can show unstyled for a few frames; `provideYetiStyles({ preload: ['demo'] })` closes the gap (ADR 0060 point 6; [setup](setup.md)). The frame loads once.
- **Event replay:** the only listeners are the grip's, which does not exist before hydration. Nothing replays and nothing needs to; the `details` toggles natively.
- **`withI18nSupport()`:** the component's template has no `i18n` block and no string. A projected `figcaption` or `summary` with `i18n` is the consumer's component's, which needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11).
- **Zoneless:** inputs are signals, and the observers and handlers write signals (building-blocks 1.5).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, JavaScript off; ADR 0011 consequences): the example renders styled in the frame, the code opens and closes, and the browser's corner resizes the box with a mouse. Lost: the grip and with it keyboard and touch resizing, as Yeti documents for no module (`docs.md:30`). A client-only application gets no promise.
- **Hydration boundary:** the component is one unit; its grip and box are in one template.
- **`@boundary`:** none in the template (ticket 50 decision 44, from upstream-bugs A8). A consumer may wrap a demo in its own `@boundary` with no package change (decision 41); the frame's content is a separate document whose errors never reach Angular ([Research: what `@boundary` and `@error` could add](../issues/36-research-boundary-and-error-blocks.md)).

### 11. Hydration constraints

- **Same DOM on the server and the client:** the frame document depends only on inputs (usage rule 7); the grip is absent on both ends at hydration and added by a later render, not by a platform branch; the dragged width and the observer values are `undefined` until the client measures.
- **No direct DOM manipulation:** everything is a binding or template output, except the min and max probe of `demo.js:88-96`, which writes and restores the box's inline size inside a handler or observer callback after hydration ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 143, with a note in building-blocks 1.5). Pointer capture and `focus()` are imperative calls in handlers (building-blocks 1.5).
- **Valid HTML:** `figcaption` first in a `figure`, `summary` first in `details`, `iframe` in a `div`; an element host would make a projected `figcaption` invalid ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 136).
- **`preserveWhitespaces`:** the template is compiled once with the package, and the `pre > code` content is one interpolation with no template whitespace inside it.
- **No output branched on the platform:** none; `live` is a lifecycle signal, the same on every platform at the first render.
- **The same-value `srcdoc` write:** measured to reload the frame (ticket 33 C2). Point 3 records the choice.

### 12. Single-page application

None. The component closes nothing on navigation and owns no fragment link, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). A fragment link inside the example resolves against the frame's `<base>` and navigates the frame, a Yeti residue the package does not change. On a route change the component's observers disconnect, and the item link is removed once no `[data-ngx-yeti-item-demo]` host is connected (ADR 0060 point 4; ADR 0045).

### 13. Item file

`yeti-css/css/components/demo/demo.css`, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired by `injectYetiItemStyles('demo')`, the last statement of `YetiDemo`'s constructor (ticket 50 decision 42; [setup](setup.md)), on the server too. It is inserted in Yeti's order (`Y/src/yeti.css:61`, after `carousel` and before the components that follow) and removed after the last host carrying `data-ngx-yeti-item-demo` leaves. Cross-item files acquired: none (`demo.css` has no rule on another item's class; ADR 0060 point 9). The frame loads its own whole Yeti stylesheet, independently of the host's item links (point 7).

## Testing Decisions

A good test asserts what a reader or an author observes: the host's class and attributes, the server HTML, the frame's `title`, `sandbox`, and loaded stylesheet, the grip's role, name, values, and `aria-controls`, the box's width after a key or a drag, and what the frame lets its content do. It never asserts a signal, the sanitizer call, or how the styles service counts. No test depends on a public token's default (ADR 0006; ADR 0015 point 3): widths are compared with probes styled from the tokens, as Yeti's own `content()` and `token()` helpers do (`Y/test/browser/components/demo.spec.js:25-31`). Every test runs zoneless. The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Story gate on every story (six tags, `parameters.a11y.test = 'error'`). Story ids:

- `demo--default`: section 8's markup with a card example. Asserts the host's class, `data-width`, the presence attribute; the box's `data-preview="Card"` and id; the frame's `title="Card"` and `sandbox="allow-forms"`; the frame's document has the stylesheet applied (a card in it has Yeti's computed border radius) and its body padding equals a probe's `var(--yeti-space-md)`; the `pre` text equals the input. Waits for the grip, then asserts `role`, `aria-orientation`, `tabindex`, `aria-label="Card"`, `aria-controls` equal to the box's id, and the value attributes against the box's measured width. Contrast: the bar's text and the stop label at 4.5:1, the grip at rest at 3:1, in light and dark schemes (ticket 50 decision 8). The grip's hit area is at least 24 px wide (2.5.8).
- `demo--keyboard`: focuses the grip and asserts Arrow Left steps to the next narrower stop (the stop label and `aria-valuetext` agree), Arrow Right the reverse, Home to `aria-valuemin`, End to `aria-valuemax`, Enter to the min and Enter again back to the remembered width (A11Y-7).
- `demo--pointer`: drags the grip by a fixed distance and asserts the box's width changed by the travel, clamped at the min; a press and release with no movement makes the single-pointer step ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 144).
- `demo--rtl`: `demo--keyboard` inside `dir="rtl"`; Arrow Right narrows; the grip sits on the box's left edge.
- `demo--resize-both`: `resize="both"` and `height="lg"`; asserts `data-resize="both"`, `data-height="lg"`, and the box's computed `resize` is `vertical` once the grip exists.
- `demo--stylesheet`: `stylesheet` pointing at a themed copy; asserts the frame's card takes the theme's colour while the host page keeps its own.
- `demo--sandbox`: code with a `<script>` that sets a mark, a `details`, a `popovertarget` button, and a `command="show-modal"` dialog with a `form method="dialog"` button. Asserts no mark, and that clicking each opener in the frame opens its target and the dialog's button closes it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 137).

### Layer 2: browser-level (`npx nx test <lib>`, `demo.spec.ts`)

- `TestBed.createComponent(YetiDemo, { bindings })` (the tag is inferred from the selector, `NGP/core/src/render3/component_ref.ts:213-216`; `NGP/core/testing/src/test_bed.ts:704`): with `preview` and `code` bound, the host is a `figure` with class `demo` and the presence attribute and no `data-height`, `data-width`, `data-resize`, or `data-stylesheet`; binding each input renders it, and binding `undefined` removes it.
- The `srcdoc` string: with `stylesheet` unset it links `yeti.css` under the setup's `url`; with `stylesheet="themes/brand/yeti.css"` its `<base href>` is `themes/brand/`; it contains no `<script>`; `code` is trimmed; the string is equal for two renders with equal inputs.
- `live`: no grip after construction; a grip after `whenStable()` and one animation frame.
- Keys: after a `keydown` whose `preventDefault` throws, the width has still changed (building-blocks 1.5); Enter's collapse and restore; Space does nothing.
- `TestBed.createDirective(YetiDemoPreview, { tagName: 'div' })`: the host's `id` is `ngx-yeti-demo-<n>`; with a static `id` on the host it keeps it (ADR 0044 step 1).
- One `<link data-ngx-yeti-styles="demo">` while a fixture lives; gone an animation frame after `destroy()`; the observers are disconnected (no callback after destroy).
- A test host projects `figcaption` and `summary` and asserts their order, and a template reference `#d="yetiDemo"` resolves.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`)

- Pure logic (`demo-geometry.spec.ts`): `widthFromDrag`, `stepWidth`, `stopName`, and the Enter state, with Yeti's own cases from `Y/test/tools/demo.test.js` ported. The stop table equals the `@container` thresholds of `demo.css` at the pin (24, 32, 48, 64, 80 rem, `demo.css:170-179`) plus `2xs` and `xs` from `demo.js:79`, so the label and the value text flip together.
- SSR smoke (`demo.ssr.spec.ts`) through `renderServer()` with `withI18nSupport()`, a projected `figcaption` with `i18n`, and section 8's markup: `whenStable()` resolves; the server HTML holds the host attributes, the box's id `ngx-yeti-demo-0`, the frame with `title`, `sandbox`, and a `srcdoc` attribute equal to the expected document, the code text, the item link, no `[role="separator"]`, and no `jsaction` from the component.
- **Contract check** (ADR 0014 point 3): class `demo` has `YetiDemo`; `data-height`, `data-width`, `data-resize` have inputs whose unions equal the vocabularies; `data-stylesheet` has a `string` input; the marker `data-preview` is rendered from `preview`; the item has no events. The manifest attribute-and-value check sees only declared names and values in every story.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 ids, after Yeti's `demo.spec.js`: real arrow keys, Home, End, and Enter in three engines; a real mouse drag and a touch drag (`touch-action: none`, `demo.css:220`); a container resize moves `aria-valuemax`; Tab from the last focusable element inside the frame reaches the grip and then the summary (2.1.2); the forced-colours case records the grip's visibility (no row unless it fails); the `demo--sandbox` script mark is absent and the openers work in all three engines.

Fixture-app half, `outputMode: 'server'`, a `/demo` route under `RenderMode.Prerender` and `RenderMode.Server`, each with JavaScript on and off (ticket 50 decision 2), under a non-root `<base href>`:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`; the box's id is unchanged;
- the frame's `load` events across first load and hydration are counted and recorded (expected 2; ticket 33 C2). If the count confirms the reload, an Angular row is added to `upstream-bugs.md`, as ticket 50 decision 36 has it for `frame` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 138);
- the frame's stylesheet loads from `<base href>` plus the setup's `url` (the fallback base URL);
- JavaScript off: the frame shows the styled example, the box's computed `resize` is `horizontal`, a mouse drag on the corner narrows it, there is no `[role="separator"]`, the code opens, and `@axe-core/playwright` with the six tags reports no violation;
- a corner drag before hydration keeps its width after hydration (section 10);
- a route with `require-trusted-types-for 'script'` and `trusted-types angular angular#unsafe-bypass` shows no violation; a route with a strict `style-src` records whether the frame body's padding is blocked (usage rule 9);
- a demo in a client-only `@defer` with `demo` preloaded shows no unstyled frame; a demo in `hydrate never` keeps its link and its corner after every live demo leaves.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `test/browser/components/demo.spec.js` with `test/browser/fixtures/components/demo.html` (box geometry, the label's flips, the grip's place, keys, drags, axe) and `test/tools/demo.test.js` (the pure functions); ticket 33's C2 page for the reload count; ADR 0060's prototype for the item link; the [frame](frame.md) spec's load-count case.

## Out of Scope

- Direct markup in the box, the "page that already loads Yeti" form (`docs.md:9`). Part 2 row 30 specifies the frame only. An author shows Angular markup live with the item directives on the page itself.
- Running Yeti's modules or any script in the frame ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 137).
- A `sandbox`, `allow`, or `referrerpolicy` input: Angular refuses to bind them (section 4).
- Rendering the frame only after hydration to avoid its second load ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 138).
- F6 between panes, the APG's optional key.
- Strings of the package's own: ", live", "Resize", "pixels", "Example", "View Code" (architecture-guide P21; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 140).
- An input per token, a theme for the frame, or reading the host page's theme into it (ADR 0004).
- Highlighting the code's syntax.
- Any check that `code` is trusted, that `preview` is meaningful, or that the host is a `figure`: checks are a later milestone (map, Milestones).
- How the styles service counts and inserts links ([setup](setup.md); ADR 0060).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| `demo` is one of the package's two Angular components (with `YetiFieldError`, ticket 50 decision 159); its template renders the box, the frame, the grip, and the code | ticket 11 row 30 and question 8; Part 2 row 30; ADR 0003 point 6 |
| Selector `figure[yetiDemo]`, not `<yeti-demo>` | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 136 (architecture-guide P1; valid HTML) |
| The code comes from a `code` input, not a projected `pre` | building-blocks "Hydration constraints (2026-10-03)"; ticket 33 row 7 |
| `sandbox="allow-forms"`; no script in the frame | ticket 25 point 9 leaves it to this spec; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 137 |
| `srcdoc` bound through `bypassSecurityTrustHtml` | `dom_security_schema.ts:79`; `html_sanitizer.ts:52-112` (read) |
| The second load at hydration is documented and measured | ticket 33 row 7; ticket 50 decision 36; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 138 |
| The grip renders after hydration | ADR 0011 JavaScript-off note; `docs.md:30`; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 139 |
| Names and value text from `preview` and the vocabulary; no package strings | architecture-guide P21; APG `:35`; manifest `a11y.notes`; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 140 |
| The grip's place through the two private tokens | `demo.css:204-206`; ADR 0004; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 141 |
| `aria-controls` to a generated id on the box, from an internal directive | ledger A11Y-7; ADR 0044; [generated-ids](generated-ids.md) |
| Enter collapses to the min and restores | ledger A11Y-7; APG `:59-60` |
| No `@boundary` and no `@defer` in the template | ticket 50 decision 44; ADR 0011 clause 10 |
| The item file acquired last in the constructor | ticket 50 decision 42; [setup](setup.md) |
| A single-pointer alternative to the drag | WCAG 2.2 2.5.7; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 144 |

### Usage examples

A design-system page, with the example's markup kept as a constant in the author's own source (Yeti markup, as Yeti's docs write it, because the frame is a plain Yeti page):

```ts
import { Component } from '@angular/core';
import { YetiDemo } from 'ngx-yeti/demo';

const cardHtml = `<article class="card">
  <h2>Weekend in the hills</h2>
  <p>Drag the grip.</p>
</article>`;

@Component({
  selector: 'app-card-page',
  imports: [YetiDemo],
  template: `
    <figure yetiDemo preview="Card" width="md" [code]="card">
      <figcaption>Card</figcaption>
      <summary>View Code</summary>
    </figure>
  `,
})
export class CardPage {
  protected readonly card = cardHtml;
}
```

Another stylesheet for the frame, and a taller box the reader can pull down:

```html
<figure yetiDemo preview="Nav" resize="both" height="lg"
        stylesheet="themes/brand/yeti.css" [code]="navCode">
</figure>
```

### Styles

1. Item file: `components/demo/demo.css`, a counted link (section 13); preload `demo` for client-only rendering.
2. Always-loaded rules relied on: the `[data-width]` and `[data-height]` mappings in `layouts/attributes.css` (the box's `--_yeti-width` and `--_yeti-height`), the base `details` and `pre` rules that `demo.css` overrides, and the base focus ring.
3. Cross-item rules: none. The example inside the frame loads all of Yeti through the frame's own stylesheet.
4. Tokens read: the 22 public tokens of section 2, set by the consumer on the host page. Written: `--yeti-space-md` is read, not written, inside the frame's body style; `--_yeti-demo-edge` and `--_yeti-demo-middle` are written (point 6). Inside the frame, tokens come from the frame's stylesheet only.
5. Without the item file: no box border, no bar or stop label, no size container, no `resize`; the frame shows at the user agent's 300 by 150, and the grip, an unstyled `div`, sits after the box with no size.
6. Tailwind: no name collision (`demo` is not a Tailwind class).

### Platform features to adopt when the browser target moves

None. `srcdoc`, `sandbox`, `details`, CSS `resize`, container queries, pointer capture, and `ResizeObserver` are inside the target (building-blocks 1.2; the manifest's `support` list).

### Single-page-application pieces relied on

None. The component uses [generated-ids](generated-ids.md) for the box's id and [setup](setup.md) for its item file and default stylesheet URL. It has no event, so [events](events.md) applies only as "no output".
