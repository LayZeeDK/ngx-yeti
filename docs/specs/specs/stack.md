# Spec: stack (layout)

Ticket: [66. Spec: stack (layout)](../issues/66-spec-stack.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 16 and Part 1, [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 61 to 67 and grilling Q6, Q15, and Q16, [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md), and [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decisions 6 and 9. The stack owns no [ledger.md](../ledger.md) row; it shares A11Y-22, owned by `sidebar` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 49). `Y/` is `github.com/foundation/yeti/` at the **Pin**. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 49, 50, and 58), and each is cited where it applies.

## Problem Statement

Yeti's `stack` is the layout for things that sit one above another: it "Stacks its children vertically with one consistent gap between them" (`Y/src/layouts/stack/manifest.json`). It is a flex column with a `gap`, so the stack owns the space between its children and their own margins are zeroed. `data-align` sets the children's horizontal alignment (stretch by default), `data-fill` makes the stack at least as tall as the viewport, and `data-rule` draws a line in the middle of each gap. Three markers change one child: `data-split` pushes that child and everything after it to the end of a stack taller than its content (a card's actions at the bottom, a sticky footer), `data-space` gives the gap before that one child a different size, and `data-sticky` pins that child at `--yeti-sticky-offset` from the top of the scrollport while the rest scrolls past (`Y/src/layouts/stack/stack.css`, `docs.md`). There is no **Module** and there are no events.

An application developer using the package cannot write `class="stack"` or any of the stack's four attributes and three markers: the package's contract rule is that a consumer writes no Yeti class or attribute, and directives bind them from typed inputs ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1 and 2). In plain Yeti a misspelt `data-gap="medium"`, a `data-space="huge"`, or a `data-split` on a grandchild fails silently: the stack falls back to its default gap or the child stays where it is. The developer also needs the `stack` **Item file** loaded while a stack is on the page and removed when none is ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)). Without it the children lose the gap and keep their own margins, with no error.

Three things need care. `align` is an HTML attribute that Chromium and WebKit still read as a text-alignment hint on any element, so the package must keep the input's static form from aligning the stack's text (building-blocks 1.4; ticket 26 row 62). The stack is the layout most often nested inside and around other items, and one of its rules ties with `center`'s inside `@layer yeti.layouts`, so the order in which item files load matters ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) point 3; building-blocks 1.13). And a pinned child can cover what scrolls under it, which touches WCAG 2.2's 2.4.11 Focus Not Obscured (Minimum).

## Solution

Two directives in the secondary entry point `ngx-yeti/stack` ([building-blocks.md](../building-blocks.md) Part 2 row 16):

- **`YetiStack`**, the **Item directive**, on `[yetiStack]`. It binds `stack` as a static host class and four typed inputs to Yeti's attributes: `gap` (`YetiGap`) to `data-gap`, `align` (`YetiAlign`) to `data-align`, `fill` (`boolean`, `booleanAttribute`) to `data-fill`, and `rule` (`boolean`, `booleanAttribute`) to `data-rule` (ticket 26 rows 61 to 64, kind R). It binds `[attr.align]` to `null`, so that the input's static form never aligns the stack's text (the `removed` kind, building-blocks 1.4). It sets the static presence attribute `data-ngx-yeti-item-stack` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)), acquires the `stack` item file when it is created, on the server too, and releases it when destroyed, through `injectYetiItemStyles('stack')` from `ngx-yeti/styles` as the last statement of its constructor ([setup](setup.md); ticket 50 decisions 42 and 45). It provides `yetiStackToken`.
- **`YetiStackChild`**, the **Child directive** for a child that carries a marker, on `[yetiStackChild]`. It binds `data-split` from a `split` input (`boolean`, `booleanAttribute`), `data-space` from a `space` input typed `YetiGap`, and `data-sticky` from a `sticky` input (`boolean`, `booleanAttribute`) (ticket 26 rows 65 to 67, kind C; [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), whose kind C names this directive and these three inputs).

The developer writes `<div yetiStack gap="sm" align="start">` where Yeti's docs write `<div class="stack" data-gap="sm" data-align="start">`, and `<a href="/more" yetiStackChild split>` where they write `<a href="#" data-split>`. Unset inputs render nothing, so Yeti's defaults (`gap` `md`, `align` `stretch`, and no fill, rule, split, space, or sticky) apply from its CSS ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) rule 1).

Everything else is Yeti's CSS and the platform. The directives are **types only**: no listener, no render callback, no service, and no DI beyond the child's optional parent token and the item directive's use of ADR 0060's styles service (ticket 50 decision 18). Server HTML is Yeti's documented markup, so the layout renders the same on the server, before hydration, with JavaScript off, and inside any `@defer` or hydrate block. What Yeti's manifest limits (at most one `data-split` child, at least one child) are usage rules; their checks belong to a later milestone (map, Milestones).

## User Stories

1. As an application developer, I want to mark an element as a stack with one directive attribute, so that I never write Yeti's `stack` class by hand.
2. As an application developer, I want the directive to render Yeti's exact `class="stack"` in the DOM, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want to set the space between children with a `gap` input typed by Yeti's gap vocabulary, including the fluid pairs such as `sm-lg`, so that `gap="medium"` fails to compile and I get the same 29 values Yeti documents.
4. As an application developer, I want to set the children's horizontal alignment with an `align` input typed `start`, `center`, `end`, `stretch`, or `baseline`, so that a badge or a button in a stack keeps its own width when I ask for `start`.
5. As an application developer, I want an unset input to render no attribute, so that Yeti's own default applies and moves with the pin.
6. As an application developer, I want a static `align="start"` to align the children and never the stack's text, so that the HTML `align` hint does not change my copy.
7. As an application developer, I want `fill` to make the stack at least as tall as the viewport, so that with a split footer I get a sticky footer with one attribute.
8. As an application developer, I want `rule` to draw a line between each pair of children without changing the gap, so that a legend or a settings list is separated without boxes.
9. As an application developer, I want `[fill]="false"` and `[rule]="false"` to remove their attributes, so that I can toggle them from state.
10. As an application developer, I want to push a child and everything after it to the end of the stack with `split` on a child directive, so that a card's actions sit at the bottom however short its body is.
11. As an application developer, I want to change the gap before one child with `space` on the child directive, typed by the same vocabulary as `gap`, so that a heading gets more room above it while the rest of the stack keeps its rhythm.
12. As an application developer, I want to pin one child with `sticky` on the child directive, so that a section heading or a toolbar stays in view while the rest of the stack scrolls past.
13. As an application developer, I want a child with no marker to need no directive, so that a plain stack of paragraphs carries no extra attributes.
14. As an application developer, I want the stack's item file loaded when the first stack renders, so that I do not import `stack.css` globally.
15. As an application developer, I want the item file removed after the last stack leaves the page, so that a route without a stack carries none of its CSS.
16. As an application developer, I want the item file in the server HTML when a server-rendered page has a stack, so that the first paint already has the gaps.
17. As an application developer, I want a `center` inside a stack to keep its auto margins whichever of the two loads first, so that a lazily loaded stack never un-centres my content.
18. As an application developer, I want the layout correct with JavaScript off under SSR and prerendering, so that a page is readable before any script runs.
19. As an application developer, I want hydration to change nothing on a stack or its children, so that I get no `NG05xx` error and no layout shift.
20. As an application developer, I want the stack to work under zoneless change detection, including any input bound from a signal, so that the package fits Angular's recommended mode.
21. As an application developer, I want a stack inside a `@defer (hydrate on ...)` block to keep its layout before and after the block hydrates, so that incremental hydration does not collapse the gaps.
22. As an application developer, I want a stack inside a `hydrate never` block to keep its styles for as long as it is on the page, so that a dehydrated section is not unstyled when a live stack elsewhere leaves.
23. As an application developer, I want to know that a stack inside a client-only `@defer` block needs `stack` in the preload list for a flash-free first paint, so that I can avoid unstyled frames.
24. As an application developer using `withI18nSupport()`, I want translated children to hydrate without being re-rendered, so that localised pages keep the server's DOM.
25. As an application developer, I want children rendered with `@for` and `@if` to be the stack's children with no wrapper, so that the gap and the markers reach them.
26. As an application developer, I want to nest stacks with different gaps, and to put `yetiStack` and `yetiStackChild` on one element, so that a child that is itself a stack can also be split, spaced, or pinned in its parent.
27. As an application developer, I want to put `yetiBox`, `yetiCard`, or `yetiCluster` beside `yetiStack` or `yetiStackChild`, so that I can compose items as Yeti's examples do.
28. As an application developer, I want to know that `yetiStackChild` works only on direct children, and that a component's host element is the child, so that I put the markers on the right element.
29. As an application developer, I want the usage rules for the cases Yeti's docs describe (one split child, a space on the first child, a ruled child that draws its own `::before`) stated in the JSDoc, so that I do not write markers that do nothing.
30. As an application developer, I want to know that a `fill` on a stack that is also an overlay's child means both things Yeti gives it, so that I am not surprised by one attribute doing two jobs.
31. As an application developer, I want to set the default gap, the fill height, the rule's width and colour, and the sticky offset through Yeti's public tokens, so that my theme controls them.
32. As an application developer, I want the package to offer no input per token, so that the stack's API stays the size of Yeti's contract.
33. As an application developer, I want my own classes and attributes on the stack and its children to be kept, so that I can style them beside the directive.
34. As an application developer, I want template references (`#s="yetiStack"`, `#c="yetiStackChild"`), so that the stack follows the package's `exportAs` rule.
35. As an application developer, I want to import both directives from `ngx-yeti/stack`, so that a `@defer` block can split them with the rest of the item.
36. As a screen-reader user, I want the stack to add no role, so that a form, a list, or a definition list is announced as the author wrote it.
37. As a screen-reader user, I want children in source order, including a split child, so that what I hear matches the visual order.
38. As a keyboard user, I want the stack to add no tab stop and no key handling, so that focus moves through the children's own controls in source order.
39. As a keyboard user, I want a control I tab to never be hidden under a pinned child, so that I can always see where focus is.
40. As a low-vision user, I want the stack to reflow at 320 CSS pixels with no horizontal scrolling, so that I can read every child at high zoom.
41. As a low-vision user who overrides text spacing, I want children to grow with their content, so that my spacing settings do not clip text.
42. As a package maintainer, I want the contract check to cover the class, all four attributes, and all three markers, so that a pin move that adds or renames one fails before release.
43. As a package maintainer, I want the SSR smoke to assert the server HTML of a stack, a marked child, the removed `align`, and the item link, so that the first paint is proven.
44. As a package maintainer, I want the fixture app to render a stack in a prerendered route and a server route, with JavaScript on and off, so that both rendering paths of the JavaScript-off ruling are tested.
45. As a package maintainer, I want no test to depend on a public token's default value, so that a pin move that changes a default does not fail a test for no reason.
46. As a package maintainer, I want the class names checked against Yeti's typings at the pin, so that a future Yeti type named `YetiStack` is caught at the pin move.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/layouts/stack/manifest.json`, `stack.css`, `docs.md`, and `example.html`:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `stack`, `layout`, `Boxes and Stacks` |
| `class` | `stack` |
| `attributes` | `data-gap` (vocabulary `gap`, 29 values, default `md`), "Space between children. A pair such as sm-lg grows fluidly from the first stop to the second."; `data-align` (vocabulary `align`: `start`, `center`, `end`, `stretch`, `baseline`, default `stretch`), "Horizontal alignment of the children."; `data-fill` (boolean), "Make the stack at least as tall as the viewport, so a child carrying data-split reaches the bottom."; `data-rule` (boolean), "A line between children, of the border width in the border color, in the middle of each gap. The gap is unchanged." |
| `classes` | empty |
| `children` | `> *` (min 1): "Anything. Each child's margins are reset; the stack owns the space between them."; `> [data-split]` (min 0, max 1): "At most one child may carry data-split" |
| `markers` | `data-split` (boolean, on `> *`): "Pushes the child and everything after it to the end of the stack when the stack is taller than its content."; `data-space` (vocabulary `gap`, on `> *`): "The gap before this one child ... Does nothing on the first child; data-split wins on a child carrying both."; `data-sticky` (boolean, on `> *`): "Pins this child at --yeti-sticky-offset from the top of the scrollport ... It keeps the full width of the column" |
| `tokens` | public: `--yeti-space-md` ("The default gap"), `--yeti-cover-height` ("The minimum block size when data-fill is set"), `--yeti-border-width` and `--yeti-color-border` (the rule's width and colour); private: `--_yeti-gap`, `--_yeti-align`, `--_yeti-stack-gap`, `--_yeti-rule-at` |
| `a11y` | `requiredAttributes` and `keyboard` empty; notes: "Purely visual. Reading order is source order." |
| `js` | `null`: no Module, no events |
| `support` | `unguarded`: "flexbox gap"; `guarded`: empty |
| `since` | `7.0.0` |

The rules, in `@layer yeti.layouts` (`stack.css`): `.stack` is a flex column with `align-items: var(--_yeti-align)` and `gap: var(--_yeti-gap)` (`:4-9`); `:not([data-gap])` and `:not([data-align])` set the private defaults (`:10-11`); `.stack > *` zeroes margins (`:12`). `data-space` keeps the flex gap for everyone and gives the marked child, if it is not the first, a `margin-block-start` of the difference, which may be negative; the stack re-exports its gap as `--_yeti-stack-gap` so the child reads its parent's gap (`:22-23`). `> [data-split]` takes `margin-block-start: auto` and so wins over `data-space` (`:24`). `[data-fill]` sets `min-block-size: var(--yeti-cover-height)` (`:25`). `[data-rule]` hangs an absolutely positioned `::before` with a `border-block-start` above every child but the first, at half the gap before that child (`:37-47`); `:where()` keeps the `position: relative` at zero specificity so a child that positions itself wins.

The value rules that set `--_yeti-gap`, `--_yeti-space`, and `--_yeti-align` are in the **Always-loaded group** (`Y/src/layouts/attributes.css:5-37`, `:111-145`, `:147-152`), not in the item file. So is the whole of `data-sticky`: it is a marker rule in `@layer yeti.utilities`, `[data-sticky] { position: sticky; inset-block-start: var(--yeti-sticky-offset); z-index: 2; }` (`attributes.css:332-343`), unscoped to any parent, whose comment explains that a stack "stretches on the inline axis instead, which costs a sticky child nothing". Yeti's root scroll padding reads `--yeti-scroll-padding`, which defaults to the sticky offset (`Y/src/base/typography.css:7-8`; `Y/src/tokens/space.css:61`, `:69`).

`docs.md` states the limits the usage rules repeat: the default stretch makes an inline thing as wide as the column; `data-space` does nothing on the first child, and a marked child that is itself a stack with its own `data-gap` reads its own gap; the rule's line is lost on a child that draws its own `::before`, on a child that clips its overflow ("a card, a frame, an accordion or a progress bar"), and on a replaced element such as an image; a ruled stack directly inside another ruled stack places its line by its own gap. Yeti's validator has no stack-specific check (`Y/bin/validate.js`, searched at the pin).

Attributes left to the consumer: none (ticket 26 rows 61 to 67). A role on the host (`role="list"` on a `ul` used as a stack) is the consumer's, as building-blocks 1.1 and ticket 26 leave roles.

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `stack` | static host class on `[yetiStack]` (`YetiStack`) | always present | ADR 0003 point 1; Part 2 row 16 |
| Attribute `data-gap` | space between children | input `gap` on `yetiStack`: `YetiGap \| undefined`, bound `[attr.data-gap]` | unset renders nothing (Yeti's `md` applies) | ticket 26 row 61 (R) |
| Attribute `data-align` | children's horizontal alignment | input `align`: `YetiAlign \| undefined`, bound `[attr.data-align]`; plus `'[attr.align]': 'null'` | unset renders nothing (Yeti's `stretch` applies); `align` kind `removed` | ticket 26 row 62 (R); building-blocks 1.4; ADR 0070 consequences |
| Attribute `data-fill` | at least viewport-tall | input `fill`: `boolean` with `booleanAttribute`, bound `[attr.data-fill]` as `''` when true and `null` when false | default `false`, renders nothing; `fill` kind `inert` | ticket 26 row 63 (R) |
| Attribute `data-rule` | a line in each gap | input `rule`: `boolean` with `booleanAttribute`, bound `[attr.data-rule]` as `''` or `null` | default `false`, renders nothing | ticket 26 row 64 (R) |
| Marker `data-split` | pushes the child and what follows to the end | input `split` on `yetiStackChild`: `boolean` with `booleanAttribute`, bound `[attr.data-split]` as `''` or `null` | default `false` | ticket 26 row 65 (C) |
| Marker `data-space` | the gap before this child | input `space` on `yetiStackChild`: `YetiGap \| undefined`, bound `[attr.data-space]` | unset renders nothing (the stack's gap) | ticket 26 row 66 (C) |
| Marker `data-sticky` | pins the child | input `sticky` on `yetiStackChild`: `boolean` with `booleanAttribute`, bound `[attr.data-sticky]` as `''` or `null` | default `false` | ticket 26 row 67 (C) |
| Children | `> *` | a child with no marker needs no directive | not applicable | ticket 26 grilling Q6 |
| Events | none | no output | not applicable | manifest `js: null`; [events](events.md) |
| Token `--yeti-space-md` | default gap | the consumer's; the package writes none | not applicable | ADR 0004 |
| Token `--yeti-cover-height` | least height with `fill` | the consumer's | not applicable | ADR 0004 |
| Tokens `--yeti-border-width`, `--yeti-color-border` | the rule's width and colour | the consumer's | not applicable | ADR 0004 |
| Tokens `--yeti-sticky-offset`, `--yeti-scroll-padding` (read by the always-loaded group, not listed in the stack's manifest) | where a pinned child stops; where a scroll into view stops | the consumer's | not applicable | ADR 0004; building-blocks 1.13 |
| Tokens `--_yeti-gap`, `--_yeti-align`, `--_yeti-stack-gap`, `--_yeti-rule-at` (and the unlisted `--_yeti-space`) | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-stack=""` on `[yetiStack]` only | always present | ADR 0045; ADR 0060 point 2; ADR 0080 point 2; ticket 50 decision 6 |

The presentational-attribute kinds (building-blocks 1.4), confirmed for this item's hosts:

- `align` on `yetiStack`: `removed`. HTML's `align` is a text-alignment hint that Chromium and WebKit honour on any element (ticket 26 row 62 and grilling Q15, from old ticket 139's measurement M1), so a static `align="center"` would centre the stack's text as well as its children. The directive binds `'[attr.align]': 'null'` with a source comment naming the effect it prevents. The binding is unconditional. The consumer may write `align` statically: hydration writes the static value back and the `null` binding removes it in the same pass, so the final DOM equals the server's (ticket 50 decision 9).
- `fill` on `yetiStack`: `inert`. HTML has no `fill` attribute; SVG's `fill` paints only on an SVG element, and a stack's host is an HTML element whose children are laid out by flex, so a static `fill` stays on the host beside `data-fill=""` and does nothing (ticket 26 row 63).
- `gap`, `rule`, `split`, `space`, and `sticky` are not HTML attributes; their static forms stay on the element and do nothing.

**Module replaced:** none. Yeti's `stack` has no Module ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 16, "Yeti module: none").

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The item reads four public tokens: `--yeti-space-md` (the default gap), `--yeti-cover-height` (the filled stack's least height, `100dvh` at the pin, `Y/src/tokens/space.css:54`), `--yeti-border-width`, and `--yeti-color-border` (the rule). Through the always-loaded value rules it reads the space token named by any `gap` or `space` value, and a sticky child reads `--yeti-sticky-offset`. The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block, in a **Theme** file after Yeti, or with a runtime `setProperty`; none is a hue, chroma, or scale input, so each also takes effect on one stack and its descendants (`Y/src/guides/theming.md:38`). Two of them reach further than the stack: `--yeti-cover-height` also sizes the `cover`, the `hero`, and the `shell` ([cover](cover.md) section 2), and `--yeti-scroll-padding` is read only on the root, "so it is a root-level setting: on a section it does nothing" (`space.css`, comment above `:69`). **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- `YetiStack` provides `yetiStackToken` (`InjectionToken<YetiStack>`, `useExisting`), building-blocks 1.9 and 1.3's token naming.
- `YetiStackChild` injects it with `{ optional: true, skipSelf: true }` ([ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md) kind C). `skipSelf` matters here: an element carrying both `yetiStack` and `yetiStackChild` (a nested stack that is split, spaced, or pinned in its parent) finds its parent stack, not itself. The child reads nothing from the token in the first milestone: no behaviour depends on the parent, and the **In-item check** that would use it (a second split child) belongs to a later milestone (map, Milestones). A child outside a stack renders its markers; `split` and `space` then do nothing, because Yeti's rules are `.stack > [data-split]` and `.stack > * + [data-space]`, while `sticky` still pins, because its rule is not scoped to a parent (section 1). The usage rules keep the child directive on a stack's children (rule 2).
- No host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix"). A consumer composes by writing directives beside each other, as Yeti's example puts `box` on each child.
- Shared input names (building-blocks 1.4, shared vocabularies; ticket 26 grilling Q16): `gap` is `YetiGap` on every item that has it, `align` is `YetiAlign` wherever the vocabulary is `align`, `fill` is `boolean` on `yetiOverlayChild` too, and `sticky` is `boolean` on `yetiSidebarChild`, `yetiShellRegion`, and `yetiNav`. So no two package directives on one element declare one input name with different types. Where two directives on one element share an input name, one static attribute feeds both and both render one `data-*` attribute, which is what Yeti's single attribute means: a `fill` on an element that is both a stack and an overlay's child makes it viewport-tall and makes it cover the overlay's box, as `data-fill` does in plain Yeti (`docs.md`: "on a child of an `overlay`, the same word means the child covers its box"). `YetiStack` and `YetiStackChild` share no input name, so they compose on one element.
- The only other injection is the root styles service of ADR 0060, through `injectYetiItemStyles('stack')` ([setup](setup.md)), with which `YetiStack` acquires and releases the item file. That service is the [setup](setup.md) spec's and ADR 0060's. `YetiStackChild` sets no presence attribute and acquires nothing, because Yeti's rules for `split` and `space` apply only under a `.stack`, whose own host keeps the link, and `sticky`'s rule is in the always-loaded group (ticket 50 decision 6).
- Generated ids and the platform's relationship attributes: none. The stack renders no `id` and references none, so it does not use [generated-ids](generated-ids.md).

### 4. API

| Member | `YetiStack` | `YetiStackChild` |
| --- | --- | --- |
| Class name | checked at the Pin: `yeti.d.ts` exports 46 names and neither is among them, so each takes `Yeti`, not `NgxYeti` (ADR 0080 point 4) | as left |
| Selector | `[yetiStack]` | `[yetiStackChild]` |
| `exportAs` | `yetiStack` | `yetiStackChild` |
| Entry point | `ngx-yeti/stack` (building-blocks 1.3; ADR 0011 clause 10) | same |
| Inputs | `gap: YetiGap \| undefined` (Yeti default `md`); `align: YetiAlign \| undefined` (Yeti default `stretch`); `fill: boolean`, `booleanAttribute`, default `false`; `rule: boolean`, `booleanAttribute`, default `false` | `split: boolean`, `booleanAttribute`, default `false`; `space: YetiGap \| undefined`; `sticky: boolean`, `booleanAttribute`, default `false` |
| Host | static `class: 'stack'`; static `data-ngx-yeti-item-stack: ''`; `[attr.data-gap]` and `[attr.data-align]` from the inputs, `null` when unset; `[attr.data-fill]` and `[attr.data-rule]`: `''` when true, else `null`; `'[attr.align]': 'null'` | `[attr.data-space]` from the input, `null` when unset; `[attr.data-split]` and `[attr.data-sticky]`: `''` when true, else `null` |
| Providers | `yetiStackToken` | none |
| Models, outputs, methods | none | none |
| Lifecycle | `injectYetiItemStyles('stack')` from `ngx-yeti/styles` is the last statement of its constructor, after anything there that can throw (nothing does today); it acquires the `stack` item file, on the server too, and releases it through `DestroyRef` (ADR 0060 point 2; building-blocks 1.9; [setup](setup.md); ticket 50 decisions 42 and 45) | none |

Types come from the generated `yeti-types.ts` copy of Yeti's typings at the pin, re-exported by name (ADR 0060 point 10; building-blocks 1.3). The selectors are the ones Part 2 row 16 and ADR 0070 name; this spec fixes them, as ticket 26 left child selectors to the specs.

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiStack` on the element that holds the children, with at least one child (manifest `children`, `> *` min 1). The element's semantics are the consumer's: a `form`, a `ul` or `ol` with `role="list"`, a `dl`, an `article`, or a plain `div`.
2. Put `yetiStackChild` on direct children of the stack element, and only on a child that needs `split`, `space`, or `sticky`. Yeti's selectors for `split` and `space` are child selectors, so a marker on a grandchild does nothing. A component's host element is the child: write `<app-actions yetiStackChild split>`. `@if`, `@for`, and `ng-container` add no element and need no care.
3. Mark at most one child with `split` (manifest `children`, `> [data-split]` max 1). The split takes effect only when the stack is taller than its content: give the stack `fill`, or let its parent stretch it (a grid cell is as tall as its row).
4. `space` does nothing on the first child, and `split` wins on a child that carries both (manifest `data-space`). A child that is itself a stack with its own `gap` reads its own gap for `space`; give it a plain wrapper (`stack.css` comment, `docs.md`).
5. With `rule`, a child that draws its own `::before`, a child that clips its overflow (a card, a frame, an accordion, a progress bar), or a replaced element such as an image gets no line; a ruled stack directly inside a ruled stack places its line by its own gap (`docs.md`). Wrap such a child in a plain element.
6. With the default `align` (stretch), an inline thing put straight into the stack (a badge, a button) becomes as wide as the column; set `align="start"` or wrap it in a paragraph (`docs.md`).
7. A `sticky` child stops at `--yeti-sticky-offset` from the top of the scrollport. When it is taller than that offset, set `--yeti-scroll-padding` on `:root` to its height so that a control pulled into view by focus, a fragment jump, or `scrollIntoView` is not hidden under it (`Y/src/tokens/space.css`, comments above `:61` and `:69`; WCAG 2.4.11; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 49; ledger row [A11Y-22](../ledger.md), owned by `sidebar`).
8. Do not write `class="stack"`, any of the stack's `data-*` attributes or markers, or `data-ngx-yeti-item-stack` statically. The directives bind them, and hydration writes a static attribute again before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"; ADR 0070 consequences). A value newer than the pin goes through `[gap]="$any('4xl')"` (ADR 0070). Writing `align` statically is allowed (ticket 50 decision 9).
9. Bind every input from values that are the same on the server and the client, never from a browser-only read such as the window's height. `fill` already follows the viewport through `--yeti-cover-height` (`100dvh`) in CSS (building-blocks 1.7), and the hydration constraints require the same DOM on both sides.
10. Import every directive class the template writes. A **Forgotten import** of `YetiStackChild` with a static `split` renders an unsplit child, and one of `YetiStack` with static inputs renders a plain block, both with no error; only a bound input (`[gap]`, `[split]`) makes the compiler report it (NG8002) (building-blocks 1.9).
11. Do not write `yetiStack` with `fill` on a filled `yetiOverlayChild`: the one `fill` sets both, and `.stack[data-fill]` makes the held child at least as tall as the viewport (measured on 2026-10-03 in Chromium and Firefox: a `.stack` held child with `data-fill` in a 200 px box was 800 px tall; `stack.css:25`). Put the stack inside the held child instead, never `yetiStack` with `fill` on the held child itself (the [overlay](overlay.md) spec's usage rule 8; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 50).

### 5. Material comparison

| Aspect | ngx-yeti `stack` | Nearest in Angular Material |
| --- | --- | --- |
| Shape | an item directive on the consumer's element, plus a child directive on a marked child | no layout primitive; the nearest piece is `mat-divider`, a component placed between items (`NC/src/material/divider/divider.ts:13`) |
| Spacing | `gap` and `space` from Yeti's vocabulary | none; consumer CSS |
| Separators | `rule`: a decorative `::before` line in each gap, no element and no role | `mat-divider` with `role="separator"` and `aria-orientation` (`divider.ts:15-16`), an element the consumer writes between items |
| Pinning | `sticky` on a child: CSS `position: sticky` | none in Material components; CDK's table pins rows and columns with its own sticky styler (`NC/src/cdk/table/sticky-styler.ts`) |
| Styling | Yeti's item file, loaded per item; tokens in the consumer's stylesheet | component styles and Sass theming |
| Accessibility | none of its own | the divider exposes a separator role |

One difference matters for accessibility: Material's divider is a `separator` in the accessibility tree, while Yeti's rule is a pseudo-element with no content, so screen readers hear no separator. That matches the manifest's "Purely visual", and a consumer who wants announced separation uses list or heading semantics, not the rule. The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one. Nothing is taken from Material.

### 6. Implementation level and primitives

Native platform, level 1, types only (Part 2 row 16; building-blocks 1.2). The reason, row 1's, which row 16 takes: Yeti's CSS does the whole job; the directives add the class, the typed attributes and markers, the item-file acquisition, and `exportAs`. Flexbox `gap`, `position: sticky`, `dvh` units, `:where()`, and logical properties are all inside Baseline 2025 (building-blocks 1.2; [Research: Angular 22's browser baseline against what Yeti expects](../issues/01-research-browser-baseline-vs-yeti.md), whose table lists `sticky-positioning` as widely available and among the features `layouts/attributes.css` uses). No Aria pattern applies (the layout has no role), and no CDK piece is used: there is no id, focus, keyboard, observer, or direction read (Yeti's rules are logical, so they follow the writing direction by themselves).

### 7. ARIA, keyboard, and the ledger

- **APG pattern:** none. The stack adds no role, state, or property, and no tab stop.
- **Keyboard:** none.
- **Names:** none. The host's semantics are the consumer's (usage rule 1). A `ul` or `ol` used as a stack takes `role="list"` when its markers should go, because Yeti's reset removes markers and padding only from lists with that role (`Y/src/base/reset.css:83-86`).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The stack's elements are the consumer's; the directives add no role. The rule is a pseudo-element with empty content, so it adds nothing to the accessibility tree (section 5). |
| 1.3.2 Meaningful Sequence | The stack is a single flex column with no `order` and no reversed direction; `split` moves a child down with an auto margin and `space` with a margin, so the visual order is the source order. The manifest's note says "Reading order is source order", and ticket 17 read the stack among the layouts whose reading order equals source order. Layer 1 asserts that the accessibility tree order equals the DOM order. |
| 1.4.3 Contrast (Minimum) | The stack renders no text and sets no text colour. Text inside it is the consumer's or another item's; the **Story gate** runs axe on it. No ledger row names the stack, and ticket 17's summary lists no contrast finding for its example. |
| 1.4.11 Non-text Contrast | The rule's line is a decorative separator, not a user-interface component or a graphic needed to understand the content, so the criterion does not require a ratio for it; no play function asserts one, and there is no ledger row ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 58). Its colour is `--yeti-color-border`, the consumer's token. |
| 1.4.4 Resize Text | Gaps come from the space scale and the fill height from `dvh`; zoomed text grows the children, and the stack grows with them (read, not measured). |
| 1.4.10 Reflow | The stack is one column as wide as its container, with no minimum width of its own. Layer 4 asserts no horizontal overflow at a 320 px viewport for the default, ruled, and filled stories. Content wider than the column is the consumer's. |
| 1.4.12 Text Spacing | The rules set no height except the fill's minimum, and no overflow; overridden spacing grows the children (read). |
| 2.4.3 Focus Order | Focusable content keeps DOM order (1.3.2 above). |
| 2.4.11 Focus Not Obscured (Minimum) | A `sticky` child can sit over content that scrolls under it. Yeti's root scroll padding defaults to the sticky offset, which is a gap, not the child's height; usage rule 7 has the consumer set `--yeti-scroll-padding` to the pinned child's height, so a control pulled into view by focus stops below it. Layer 4 tabs through a stack with a pinned heading and asserts each focused control is not entirely covered. The package adds nothing here; the stack shares ledger row [A11Y-22](../ledger.md), owned by `sidebar` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 47 and 49). |

**Ledger rows owned:** none (Part 2 row 16). The stack shares [A11Y-22](../ledger.md), owned by `sidebar`, for a pinned child over content ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 49). No other row: the stack adds no feature Yeti lacks.

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<div yetiStack gap="lg" fill>
  <h2 yetiBox surface="raised" border>A heading</h2>
  <p yetiBox surface="raised" border i18n>A paragraph that follows it at the stack's gap.</p>
  <h2 yetiBox surface="raised" border yetiStackChild space="3xl">A heading with more room above it</h2>
  <p yetiBox surface="raised" border yetiStackChild split>Pushed to the bottom when the stack has room.</p>
</div>
```

and a ruled definition list, after Yeti's docs:

```html
<dl yetiStack rule gap="sm">
  <div yetiCluster justify="between"><dt>Distance</dt><dd yetiNumeric>14.2 km</dd></div>
  <div yetiCluster justify="between"><dt>Ascent</dt><dd yetiNumeric>1,120 m</dd></div>
</dl>
```

Server HTML and the hydrated DOM are the same. The first stack carries `yetistack=""`, `gap="lg"`, `fill=""` (inert), `class="stack"`, `data-ngx-yeti-item-stack=""`, `data-gap="lg"`, and `data-fill=""`, and no `data-align`, `data-rule`, or `align`. The third child carries `yetistackchild=""`, `space="3xl"`, and `data-space="3xl"`; the fourth carries `split=""` and `data-split=""`. Each child also carries the box's own class and attributes. The definition list carries `rule=""`, `data-rule=""`, and `data-gap="sm"`. A stack written `<div yetiStack align="start">` renders `data-align="start"` and no `align` attribute (removed).

The server also writes one item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>layouts/stack/stack.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="stack"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5). The client adopts that link at bootstrap. The stack has no open or closed state.

The delta from Yeti's docs markup: the consumer writes `yetiStack` where the docs write `class="stack"`, the input names where they write each `data-*` attribute, and `yetiStackChild` with `split`, `space`, or `sticky` where they write a marker.

### 9. Animation

None. The stack has no state and no transition, and Yeti's reduced-motion handling does not reach it (building-blocks 1.6 point 4). A consumer may remove a stack with a class-form `animate.leave`; the item link stays until Angular removes the host, because removal waits for the DOM (ADR 0060 point 4). A stack that is server-rendered never takes `animate.enter` (ADR 0011 clause 12). A child entering through `@if` or `@for`, or an input changed at run time, moves the layout at once, as Yeti's CSS has it; a consumer who wants a child to arrive animated uses the `enter` utility on the child.

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attributes and markers, the removed `align`, and the item link in `<head>` (section 8). Everything at first paint is a host binding (ADR 0011 clause 1). Nothing is **Pre-hydration state**: no person and no Yeti module can change a `data-*` attribute (ticket 26 grilling Q12). Sticky positioning and the fill height are CSS and apply before any script.
- **Before hydration:** the directives create no node, read no layout, start no timer or observer, and touch no `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is `YetiStack`'s item acquisition, which ADR 0060 runs on the server too.
- **Full hydration:** every element is claimed as is; bindings computed from the same inputs give the same values (usage rule 9); 0 style mutations (ADR 0060 point 5, measured for the mechanism).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the stack and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4, measured for the mechanism). A stack and its marked children share one **Hydration boundary** by construction, because `yetiStackChild` must sit on direct children (usage rule 2); a deferred block inside a stack makes its own wrapper element the child, unless the block's content is the child itself.
- **`hydrate never`:** the stack is its server HTML and stays styled while its host is connected, whatever live stacks do (ADR 0060 point 4; ADR 0045). There is no Angular behaviour to lose; a bound input simply never changes.
- **Client-only `@defer`:** the item file is fetched when `YetiStack` is constructed, which can show unstyled frames; the consumer closes the gap with `provideYetiStyles({ preload: ['stack'] })` (ADR 0060 point 6; [setup](setup.md)). A sticky child pins even before the file arrives, because its rule is always loaded. No entry animation needs the file.
- **Event replay:** the directives declare no listener, so nothing replays and no `jsaction` is added by them.
- **`withI18nSupport()`:** child text is translated with `i18n` in the consumer's component. The directives add no `i18n` block; the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** inputs are signals and host bindings read them, so any bound input refreshes with no zone (map, Standing rulings, item 43; ADR 0070 rule 4).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the children are spaced, aligned, split, ruled, and pinned, because the attributes and the item link are in the server HTML. Nothing is lost: the stack has no behaviour. A client-only application gets no such promise.

### 11. Hydration constraints

The stack complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class and presence attribute are static; every `data-*` attribute comes from an input whose value usage rule 9 keeps equal on both sides; `[attr.align]` is always `null`.
- **No direct DOM manipulation:** the directives write nothing to the DOM outside host bindings. The item link is the ADR 0060 service's, which writes it on the server and adopts it on the client.
- **Valid HTML:** the directives change no element. The consumer's markup must be valid as written: a `dl` stack's children are `div` groups or `dt` and `dd` pairs, a `ul` stack's children are `li`, and a `@for` inside either renders those elements.
- **`preserveWhitespaces`:** the directives have no template. Whitespace text between children is not a flex item.
- **No output branched on the platform:** none.
- **Static attributes the directives bind:** usage rule 8 keeps the consumer from writing the `data-*` attributes. The static forms of `gap`, `fill`, `rule`, `split`, `space`, and `sticky` are the inputs' own and stay on the element unchanged on both sides. The static form of `align` is the one static attribute a directive also binds (to `null`); hydration writes it back and the binding removes it again in the same pass, so the final DOM equals the server's. This form is allowed by ticket 50 decision 9, and layer 4 asserts that no frame paints with `align` present.

### 12. Single-page application

None. The stack has no navigation or fragment behaviour, so it uses neither [navigation-close](navigation-close.md) nor [fragment-links](fragment-links.md). On a route change, a route's stacks leave with the route, and the item link is removed in the animation frame after no `[data-ngx-yeti-item-stack]` host is connected (ADR 0060 point 4; ADR 0045). A route that renders a stack again re-inserts it in Yeti's order. A fragment jump to a target under a pinned child stops at `--yeti-scroll-padding` (usage rule 7), as the fragment-links spec's own sticky-header rule has it.

### 13. Item file

`yeti-css/css/layouts/stack/stack.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiStack]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:20`, the rank table of point 3), and removed after the last host carrying `data-ngx-yeti-item-stack` has left the DOM. The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds every stack value rule, the whole `data-sticky` rule, and the tokens), and optionally `provideYetiStyles({ preload: ['stack'] })`. The stack adds nothing to it. Cross-item files acquired: none (`stack.css` has no rule for another item; ADR 0060 point 9).

One order matters inside `yeti.layouts` (measured in ticket 23): `.stack > *` sets `margin: 0`, and `.center` sets `margin-inline: auto`, at equal specificity, so a `center` that is a stack's child keeps its inline centring only because `center.css` comes after `stack.css` in `yeti.css` (`:20`, `:30`). Appended after `center.css`, a lazily loaded `stack.css` took the centre from 430 px to 0 px in all three engines; inserted before it, the centre held ([Research: Yeti's cascade layers and stylesheet order, for lazy loading](../issues/23-research-yeti-layers-and-import-order.md), section 4.4). ADR 0060 point 3 inserts links in Yeti's order whichever directive is created first, and its prototype measured this pair. Layer 4 tests it for the stack.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class, attributes, and markers in the DOM, the item link, the gaps, where children land, and the reading order. It never asserts a private field, the parent token's value, or how the styles service counts. No test depends on a public token's default value ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): where a test needs a gap, a height, a width, or an offset, it reads the token's computed value in the same page, as Yeti's own `test/browser/layouts/stack.spec.js` does with its `token()` helper (`--yeti-space-md`, `--yeti-space-sm`, `--yeti-border-width`, `--yeti-sticky-offset`), or compares with the viewport's height for `fill`. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `stack` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). No contrast assertion: the stack owns no ledger row and renders no text of its own. Story ids:

- `stack--default`: section 8's first example (Yeti's `example.html` with `yetiBox` on each child, `gap="lg"`, `fill`, one `space="3xl"` child, one `split` child). Asserts `class="stack"` and `data-ngx-yeti-item-stack` on the stack, `data-gap="lg"` and `data-fill`, no `data-align`, `data-space="3xl"` and `data-split` on the two marked children only, and no `tabindex` or role added by the package. Asserts every child's computed margins are 0 apart from the marked ones (Yeti's "children have no margins" case), the gap before the spaced child equals `--yeti-space-3xl`, the split child's bottom equals the stack's bottom, and the accessibility tree order equals the DOM order.
- `stack--settings`: every `YetiStack` input and every `YetiStackChild` input on one chosen child bound from Storybook controls. Asserts each attribute follows its control, that clearing a control removes the attribute, and that toggling `fill`, `rule`, `split`, and `sticky` adds and removes the attribute.
- `stack--align`: `align="start"` beside the default. Asserts a child of the `start` stack is narrower than the stack and a child of the default stack is as wide as it (Yeti's case), and that neither host carries an `align` attribute.
- `stack--rule`: section 8's ruled `dl`, plus a ruled stack with a `space="xs"` child and a child that is itself a stack with its own gap. Asserts the gaps are unchanged by the rule, the first child's `::before` content is `none`, each later child's line has the computed `--yeti-border-width` and sits at minus half the gap before it, including the spaced child and the nested stack (Yeti's case), and that the accessibility tree has no separator.
- `stack--sticky`: a tall stack in a scrolling container with one `sticky` child and focusable links after it. Asserts that after scrolling the pinned child's top equals the computed `--yeti-sticky-offset` and its width equals the stack's (Yeti's `sticky.spec.js` case).

### Layer 2: browser-level (`npx nx test <lib>`, `stack.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiStack, { tagName: 'div' })`: the host has class `stack` and `data-ngx-yeti-item-stack`, and none of the four `data-*` attributes; with `bindings` setting each input (`gap` `'sm-lg'`, `align` `'start'`, `fill` `true`, `rule` `true`), each attribute follows, and setting them back to `undefined` or `false` removes them; the host never has an `align` attribute.
- While a `YetiStack` fixture lives, one `<link data-ngx-yeti-styles="stack">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- `createDirective(YetiStackChild, { tagName: 'p' })`: no `data-split`, `data-space`, or `data-sticky` by default; bound `split` `true`, `space` `'xl'`, and `sticky` `true` render them; the host carries no presence attribute and acquires no link (ticket 50 decision 6).
- No directive adds a listener to its host.

A small test host covers what `createDirective` cannot: template references `#s="yetiStack"` and `#c="yetiStackChild"` resolve; static `fill`, `rule`, `split`, and `sticky` set their inputs through `booleanAttribute`; a static `fill` renders both `fill=""` and `data-fill=""` (the `inert` kind); a static `align="center"` renders `data-align="center"` and no `align` attribute, and the stack's text alignment is `start` (the `removed` kind); an element carrying both `yetiStack` and `yetiStackChild` inside an outer stack renders both directives' attributes, and its child directive's optional token resolves to the outer stack, not itself; a child outside any stack renders its markers with no error; and the consumer's own `class` and `role` on each host are kept.

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `stack.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture whose children carry `i18n` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the stack renders `class="stack"`, `data-ngx-yeti-item-stack`, and `data-gap="lg"` from a bound input; a child renders `data-split`, `data-space`, and `data-sticky`; a stack written with static `align="center"` renders `data-align="center"` and no `align` attribute (building-blocks 1.4: the static form is written and the attribute asserted absent); `<head>` holds one item link with `data-ngx-yeti-styles="stack"`, `data-beasties-skip`, and an `href` ending `layouts/stack/stack.css?v=<pin>`; no element carries a `jsaction` from the package.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the stack through the contract mapping: class `stack` has `YetiStack`; `data-gap`, `data-align`, `data-fill`, and `data-rule` have inputs whose types are the manifest's vocabularies or `boolean`; `data-split`, `data-space`, and `data-sticky` have inputs on `YetiStackChild`; the manifest's events for `stack` are empty. A pin move that adds an attribute or marker fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids: the geometry of Yeti's own `stack.spec.js` cases (the gap equals the token, `space` changes one gap only and does nothing on the first child, `split` reaches the end, `align="start"` stops stretching, `fill` makes the stack as tall as the viewport with the split child at its bottom, the rule's line placement) and `sticky.spec.js`'s stack case (the pinned child keeps the column's width and stops at the offset). On `stack--sticky` with `--yeti-scroll-padding` set to the pinned child's height in the story's `:root`, Tab through the links and assert each focused link's box is not entirely covered by the pinned child (2.4.11). At a 320 px viewport the default, ruled, and filled stories have no horizontal overflow (1.4.10).

Fixture-app half, built with `outputMode: 'server'`, with a `/stack` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences):

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- with JavaScript disabled the gaps, the split child, the rule, and the pinned child land as in the Storybook half, and `@axe-core/playwright` with the six tags reports no violation;
- a stack inside a client-only `@defer` block with `stack` in the preload list shows no unstyled frame; a stack inside a `hydrate never` block stays styled after a live stack on the page is removed;
- a stack written with static `align="center"`: no frame paints with an `align` attribute on it, from the first paint through hydration, and its text stays start-aligned (ticket 50 decision 9);
- the tie with `center`: on a route whose `center` renders first and whose stack, holding a `center` child, renders later inside a client-only `@defer`, the inner center keeps its auto margins (its inline size and position equal those of the same markup with both files loaded at first paint);
- navigating from the stack route to a route without one removes the item link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` for the default story, its `test/browser/layouts/stack.spec.js` and `sticky.spec.js` with their fixtures for the geometry cases; ticket 23's `tie.mjs` for the order case; ticket 18's fixture app and ADR 0060's prototype for the server HTML and the item link.

## Out of Scope

- An input per token, including the fill height, the rule's width and colour, and the sticky offset (ADR 0004).
- A shared any-element `[yetiSplit]`, `[yetiSpace]`, or `[yetiSticky]` directive (ADR 0070, considered options; ticket 26 grilling Q6).
- `split`, `space`, or `sticky` inputs on `YetiStack`, or `gap` on the child (ADR 0070 kinds R and C).
- Any check of a second split child, of markers on grandchildren, or of a stack with no child. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- A `role="separator"` or any element for the rule, or any other role written by the package (building-blocks 1.1; manifest `a11y.notes`).
- Setting `--yeti-scroll-padding` or `--yeti-sticky-offset` from a sticky child's measured height; the package reads no layout for a types-only item (building-blocks 1.2, "types only"; ADR 0004).
- A viewport-keyed input or any JavaScript size read (building-blocks 1.7).
- Package CSS for the stack.
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `[yetiStack]` with `gap`, `align`, `fill`, `rule`; child directive `[yetiStackChild]` with `split`, `space`, `sticky` | building-blocks Part 2 row 16; ticket 26 rows 61 to 67; ADR 0070 kind C |
| `data-split`, `data-space`, and `data-sticky` are kind C (they change a child) | ADR 0070; ticket 26 rows 65 to 67 and grilling Q6 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by Yeti's vocabulary types; booleans with `booleanAttribute`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2; building-blocks 1.4 |
| `align` is `removed`, unconditionally; `fill` is `inert` | building-blocks 1.4; ticket 26 rows 62 and 63 and grilling Q15; ADR 0070 consequences |
| Static `align` allowed; the `null` binding removes it in the hydration pass | ticket 50 decision 9 |
| Child injects `yetiStackToken` optionally with `skipSelf` and reads nothing from it | ADR 0070 kind C; building-blocks 1.9 |
| Shared input names take one type and one attribute (`fill` with the overlay child, `sticky` with the sidebar child) | building-blocks 1.4; ticket 26 grilling Q16 |
| A stack on a filled overlay held child goes inside it (usage rule 11) | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 50; the [overlay](overlay.md) spec's usage rule 8 |
| Only the item directive marks its host and acquires the item file | ADR 0045; ticket 50 decision 6 |
| `injectYetiItemStyles('stack')` last in the constructor | [setup](setup.md); ticket 50 decisions 42 and 45 |
| `exportAs` on both; class names with no collision | building-blocks 1.3; ADR 0080 points 3 and 4 |
| Entry point `ngx-yeti/stack` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, types only | building-blocks 1.2; Part 2 row 16 |
| Tokens are the consumer's | ADR 0004 |
| Item file as a counted link in Yeti's order (the tie with `center`); presence attribute `data-ngx-yeti-item-stack` | ADR 0060 points 2 to 6; ADR 0045; building-blocks 1.13 |
| A pinned child taller than the offset needs `--yeti-scroll-padding` on `:root` (2.4.11) | Yeti's token comments; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 49; shared ledger row A11Y-22 |
| The rule is decorative under 1.4.11 | [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 58 |
| Usage rules stated now, checked in a later milestone | map, Milestones |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

Grid cells whose actions always sit at the bottom, however long each summary is (a `card` does this for its own `footer`, `Y/src/components/card/docs.md`):

```html
<ul yetiGrid min="xs" role="list">
  @for (plan of plans(); track plan.id) {
    <li yetiBox surface="raised" border yetiStack align="start">
      <h3>{{ plan.name }}</h3>
      <p>{{ plan.summary }}</p>
      <a yetiButton yetiStackChild split [routerLink]="['/plans', plan.id]">Choose</a>
    </li>
  }
</ul>
```

```ts
import { RouterLink } from '@angular/router';
import { YetiBox } from 'ngx-yeti/box';
import { YetiButton } from 'ngx-yeti/button';
import { YetiGrid } from 'ngx-yeti/grid';
import { YetiStack, YetiStackChild } from 'ngx-yeti/stack';

@Component({
  selector: 'app-plans',
  imports: [RouterLink, YetiBox, YetiButton, YetiGrid, YetiStack, YetiStackChild],
  templateUrl: './plans.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Plans {
  readonly plans = input.required<readonly Plan[]>();
}
```

A page with a sticky footer: `<div yetiStack fill><main>...</main><footer yetiStackChild split>...</footer></div>`.

A form whose labels sit close to their fields, with more room above the actions:

```html
<form yetiStack gap="md" align="start">
  <label for="name">Name</label>
  <input yetiStackChild space="xs" id="name" />
  <button yetiButton yetiStackChild space="xl" type="submit">Save</button>
</form>
```

A long settings page whose section heading stays in view, with the root scroll padding set to the heading's height in the consumer's stylesheet:

```html
<section yetiStack gap="sm">
  <h2 yetiStackChild sticky>Notifications</h2>
  <!-- the settings -->
</section>
```

```css
:root {
  --yeti-scroll-padding: 4rem;
}
```

A page whose stack renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['stack'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `layouts/stack/stack.css`, loaded by `YetiStack` as a counted link in Yeti's order (section 13). The consumer writes nothing for the stack beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `layouts/attributes.css` maps every `data-gap`, `data-space`, and `data-align` value to its private property (section 1) and holds the whole `data-sticky` rule in `yeti.utilities`; `tokens/space.css` declares the space scale, `--yeti-cover-height`, `--yeti-sticky-offset`, and `--yeti-scroll-padding`; `tokens/surface.css` declares `--yeti-border-width`; `base/typography.css` sets the root scroll padding; `base/reset.css` removes a `role="list"` list's markers and padding.
3. **Cross-item rules:** none in `stack.css`. The tie with `center` (`.stack > *` against `.center`) is settled by ADR 0060 point 3's order (section 13). Items composed on the stack or its children (`box`, `card`, `cluster`, `center`) load their own files through their own directives.
4. **Tokens:** reads `--yeti-space-md`, `--yeti-cover-height`, `--yeti-border-width`, and `--yeti-color-border`, and through its markers `--yeti-sticky-offset`; writes none (section 2).
5. **What breaks without the item file:** the children lose the gap and keep their own margins, `align`, `split`, `space`, `fill`, and `rule` do nothing, and nothing errors. A `sticky` child still pins, because its rule is always loaded.
6. **Tailwind name collision:** none. Of Yeti's class and attribute names, ticket 24 measured Tailwind generating only `container`, `grid`, `table`, and `hidden`, and its page's stack and its center-in-a-stack matched Yeti alone under the shared layer statement ([Prototype: the package beside Tailwind v4 in one Angular application](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md)); the consumer still uses the shared layer statement of ADR 0060 point 7.

### Platform features to adopt when the browser target moves

None. Every feature the stack's rules and markers use is inside Baseline 2025 (building-blocks 1.2): flexbox `gap`, which the manifest lists as unguarded, and `position: sticky`, `dvh` units (through `--yeti-cover-height`), `:where()`, and logical properties, which it does not list.

### Single-page-application pieces relied on

None: the stack uses none of the shared-utility specs ([events](events.md), [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), [navigation-close](navigation-close.md)). It relies on ADR 0060's styles service for route changes (section 12).
