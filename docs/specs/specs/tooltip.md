# Spec: tooltip (component)

Ticket: [92. Spec: tooltip (component)](../issues/92-spec-tooltip.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [ADR 0016](../adr/0016-light-dismiss-is-the-platforms-plus-focus-out-and-tooltip-escape.md) point 3 (the tooltip closes on Escape while its Trigger stays hovered or focused) and [ADR 0043](../adr/0043-light-dismiss-additions-are-host-listeners-not-cdk-services.md) point 2 (Escape is a `keydown` host listener setting a `dismissed` signal; `pointerleave` and `focusout` reset it; `aria-describedby` points at the consumer's Bubble with a generated id) and point 4 (`AriaDescriber` and `FocusMonitor` not injected in the first milestone); WCAG 2.2 1.4.13 Content on Hover or Focus (dismissible, hoverable, persistent); [ledger.md](../ledger.md) row A11Y-2; [building-blocks.md](../building-blocks.md) Part 2 row 42 and Part 1 (1.3, 1.4, 1.5, 1.6, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13, 1.15); the [generated-ids](generated-ids.md) spec (the Bubble's id and the description reference); the [events](events.md) spec (why the tooltip has no output); the [setup](setup.md) spec (the style loader); [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) row 159; [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decisions 2, 5, 6, 8, 10, 42, 45, and 46, and the orchestrator's cross-item open-state decision of 2026-10-03 (decision 91, amended by decision 222; no public `open()`, `close()`, or `toggle()`); [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0010](../adr/0010-animation-is-yetis-css-with-class-form-enter-and-leave.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0013](../adr/0013-parts-name-their-targets-by-reference.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0044](../adr/0044-generated-ids-count-per-application-and-are-adopted-at-hydration.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md); [CONTEXT.md](../CONTEXT.md)'s **Trigger** (the element whose hover or focus shows the Bubble; it opens nothing, so it is not an **Opener**) and **Bubble**. Material's `MatTooltip` and CDK's `AriaDescriber` are parity sources only, not used (ADR 0043 point 4). `popover` and anchor positioning: the shared popover patterns are the [dropdown](dropdown.md) spec's; the tooltip is deliberately not a popover (ADR 0016, considered options). `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x); `NGP/` is `github.com/angular/angular/packages/` at `5db6fc4453` (22.2.0); `APG/` is `github.com/w3c/aria-practices/content/patterns/` at `3f094fd`. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 215 to 221), and each is cited where it applies.

## Problem Statement

Yeti's `tooltip` is "a short hint that appears beside a control on hover and on focus, described to assistive tech and needing no script" (`Y/src/components/tooltip/manifest.json`). It is one **Identity class**, `tooltip`, on a wrapper; one **Attribute**, `data-placement` (which side of the Trigger the Bubble sits on); and two **Parts**: the Trigger, the wrapper's first child, and the Bubble, a `[role="tooltip"]` element that the Trigger names with `aria-describedby`. It has no **Module** (`"js": null`). Yeti's CSS does the whole job: `.tooltip:hover` and `.tooltip:has(:focus-visible)` show the Bubble (`tooltip.css:56-60`), and anchor positioning, behind an `@supports` guard, ties the Bubble and its caret to the Trigger (`tooltip.css:64-121`). Yeti chose not to make it a popover, "because nothing but script can open one of those" (`tooltip/docs.md`, "How it works").

An application developer using the package cannot write Yeti's markup as it stands:

- The consumer writes no `class="tooltip"`, no `data-placement`, and no id that links the Trigger to the Bubble ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md) points 1, 2, and 5; [ADR 0013](../adr/0013-parts-name-their-targets-by-reference.md) point 2). A misspelt `data-placement="left"` must fail to compile ([ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md)), and a hand-typed id must not be what connects the description to the control.
- The Bubble "cannot be dismissed while the trigger stays hovered or focused: WCAG 1.4.13 asks for that, and a tooltip with no script has no way to offer it" (`tooltip/docs.md`, Accessibility; `manifest.json` `a11y.notes`). [Ticket 17](../issues/17-research-yeti-accessibility-and-standards.md) measured it in three engines: Escape does not hide the Bubble while hovered or while focused ([ledger.md](../ledger.md) A11Y-2).
- The developer has no `tooltip` **Item file** loading while a tooltip is on the page ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md)).

And it must not get worse than Yeti: the Bubble must show on hover and keyboard focus with JavaScript off, before hydration, and inside `hydrate never`, and it must stay the consumer's own element with `role="tooltip"`, not a copy in a container elsewhere in the document (ADR 0043 point 4; ADR 0016, considered options).

## Solution

Three directives in the secondary entry point `ngx-yeti/tooltip` (building-blocks Part 2 row 42; 1.3):

- **`YetiTooltip`**, the **Item directive** and **Coordinating directive**, on `[yetiTooltip]` (a `span`, as Yeti's example writes it), `exportAs: 'yetiTooltip'`. It binds `tooltip` as a static host class, `data-placement` from the typed input `placement` (`YetiPlacement`), and the static presence attribute `data-ngx-yeti-item-tooltip` ([ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md)). It provides `yetiTooltipToken` and holds the `dismissed` signal. Its host listeners add the one thing Yeti's CSS cannot: Escape without a modifier dismisses the shown Bubble, and the pointer or focus leaving resets it (ADR 0043 point 2; A11Y-2). A second Escape listener on the document covers a Bubble shown by hover while focus is elsewhere ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 215), with a dated note on ADR 0043. It acquires the `tooltip` item file last in its constructor ([setup](setup.md); ticket 50 decisions 42 and 45).
- **`YetiTooltipTrigger`**, a **Part directive** on `[yetiTooltipTrigger]`, the wrapper's first child, `exportAs: 'yetiTooltipTrigger'`: the **Trigger**. It binds `aria-describedby` to the consumer's own ids followed by the Bubble's id (ticket 50 decision 46).
- **`YetiTooltipBubble`**, a Part directive on `[yetiTooltipBubble]`, the wrapper's second child, `exportAs: 'yetiTooltipBubble'`: the **Bubble**. It renders `role="tooltip"` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 218), its `id` (the consumer's static `id`, else a generated `ngx-yeti-tooltip-<n>`; [generated-ids](generated-ids.md)), and `hidden` while the root's `dismissed()` is true, which Yeti's `[hidden]` rule hides (`Y/src/base/reset.css:75-77`).

The developer writes:

```html
<span yetiTooltip placement="end">
  <button yetiButton yetiTooltipTrigger type="button" aria-label="Copy link" emphasis="low">...</button>
  <span yetiTooltipBubble>Copies the link</span>
</span>
```

where Yeti's docs write `<span class="tooltip" data-placement="end"><button class="button" type="button" aria-label="Copy" aria-describedby="copy-tip" data-emphasis="low">...</button><span role="tooltip" id="copy-tip">Copies the link</span></span>`. The server HTML is Yeti's markup with a generated id. Yeti's CSS still shows, places, and hides the Bubble; the directives render the contract and add Escape. No `popover`, no CDK Overlay, no `AriaDescriber`, and no Aria directive is used (Part 2 row 42; ADR 0043 point 4; Aria 22.2 has no tooltip pattern, `research/yeti-javascript-and-angular.md:169`).

## User Stories

1. As an application developer, I want to make a tooltip with one directive on its wrapper and one on each of its two parts, so that I never write Yeti's `tooltip` class, `role="tooltip"`, or `aria-describedby` by hand.
2. As an application developer, I want the server HTML to be Yeti's documented markup, so that Yeti's CSS and docs apply unchanged.
3. As an application developer, I want the Bubble's id generated and the Trigger's `aria-describedby` bound to it, so that I never type an id and a duplicated or misspelt one cannot happen.
4. As an application developer, I want my own static `id` on the Bubble to win, so that I can address it from my own code or tests.
5. As an application developer, I want the generated id to be the same on the server and the client, so that hydration rewrites nothing.
6. As an application developer, I want my own `aria-describedby` ids on the Trigger kept, first, with the Bubble's id after them, so that a description I already give the control is not lost.
7. As an application developer, I want a `placement` input typed by Yeti's `placement` vocabulary, so that `placement="bottom"` compiles and `placement="left"` does not.
8. As an application developer, I want an unset `placement` to render no attribute, so that Yeti's default, `top`, applies from its CSS.
9. As an application developer, I want `placement` to accept a bound signal, so that I can move the Bubble to another side from my own state.
10. As an application developer, I want to use `yetiButton` on the Trigger beside `yetiTooltipTrigger`, so that the Trigger looks like Yeti's example.
11. As an application developer, I want a link to work as a Trigger, so that a short hint can sit on a navigation link too.
12. As an application developer, I want a tooltip to fit inside a sentence, so that a `span` wrapper keeps the paragraph valid HTML.
13. As a pointer user, I want the Bubble to appear when I hover the Trigger, so that I learn what an icon-only control does.
14. As a pointer user, I want to move my pointer from the Trigger onto the Bubble without it disappearing, so that I can read a Bubble that covers the Trigger's neighbourhood (WCAG 1.4.13 hoverable).
15. As a pointer user, I want the Bubble to stay while I hover, with no timeout, so that I can read it at my own pace (1.4.13 persistent).
16. As a pointer user, I want Escape to hide the Bubble without my moving the pointer, so that I can see what it covers (1.4.13 dismissible; A11Y-2).
17. As a pointer user whose keyboard focus is somewhere else on the page, I want Escape to hide the Bubble I am hovering, so that dismissing does not depend on where focus happens to be ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 215).
18. As a keyboard user, I want the Bubble to appear when I Tab to the Trigger, so that I get the hint without a mouse.
19. As a keyboard user, I want Escape to hide the Bubble while focus stays on the Trigger, so that I can dismiss it without moving on (APG tooltip, `APG/tooltip/tooltip-pattern.html:44`, `:48`).
20. As a keyboard user, I want the Bubble to stay hidden after Escape until I leave the Trigger, so that it does not pop back while I am still there.
21. As a keyboard user, I want the Bubble back the next time I reach the Trigger, so that dismissing once does not hide it for good.
22. As a pointer user, I want a mouse click on the Trigger not to pin the Bubble open, so that clicking a button does not leave a hint over the page (Yeti's `:focus-visible` choice, `tooltip.css:52-55`).
23. As a user of a tooltip inside a dialog or an open dropdown panel, I want my first Escape to hide only the Bubble, so that I do not lose the dialog or the panel to dismiss a hint ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 216).
24. As a screen-reader user, I want the Trigger announced with the Bubble's text as its description, so that I hear the hint with the control (`docs.md`, Accessibility).
25. As a screen-reader user, I want the description to stay after the Bubble is dismissed, so that pressing Escape does not remove the hint from the control's description.
26. As a screen-reader user, I want an icon-only Trigger to have its own name, so that I hear "Copy link, button", with the hint as its description rather than its name.
27. As a touch user, I want everything the Bubble says to be available somewhere I can reach without hover, so that I do not miss it (`Y/src/guides/components.md:218`).
28. As a low-vision user, I want the Bubble's text to contrast at least 4.5:1 with its surface in both colour schemes, so that I can read it.
29. As a user at 320 CSS pixels wide, I want a Bubble that never causes horizontal scrolling, so that I never scroll in two dimensions to read the page (WCAG 1.4.10; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 220).
30. As a user in a scrolling container, I want the Bubble not to be clipped by the container where the browser supports anchor positioning, so that I can read all of it (`tooltip.css:62-63`).
31. As a forced-colours user, I want the Bubble's text to stay readable, so that high-contrast mode does not hide the hint.
32. As a user who prefers reduced motion, I want the Bubble to appear without its fade, so that motion follows my setting.
33. As a right-to-left reader, I want `placement="start"` and `"end"` to follow the writing direction, so that they mean the same in Arabic as in English.
34. As a user, I want the tooltip to show on hover and keyboard focus before hydration and with JavaScript off, so that the hint works while the page loads and on a server-rendered page without script.
35. As a user who pressed Escape on a focused Trigger before the application hydrated, I want the Bubble hidden once the application starts if focus is still there, so that my key press is honoured late rather than lost.
36. As an application developer, I want a tooltip inside a `hydrate never` block to keep showing on hover and focus and to keep its styles, so that static regions still work.
37. As an application developer, I want a tooltip inside a client-only `@defer` block not to flash its Bubble text inline before its styles arrive, so that I know to preload the item file (`provideYetiStyles({ preload: ['tooltip'] })`).
38. As an application developer using `withI18nSupport()`, I want a translated Bubble and Trigger label to hydrate without being re-rendered, so that localised pages keep the server's DOM.
39. As an application developer running zoneless, I want the dismissed state to refresh the Bubble with no zone, so that Escape works in a zoneless application.
40. As an application developer, I want the `tooltip` item file loaded while a tooltip is on the page and removed after the last leaves, so that I do not import `tooltip.css` globally.
41. As an application developer, I want no listener left behind when a tooltip is destroyed, so that a route change leaks nothing.
42. As an application developer, I want template references (`#hint="yetiTooltip"`), so that I can read `dismissed()` in my template or tests.
43. As an application developer, I want the vocabulary type re-exported by name (`YetiPlacement`), so that I can type my own signal that feeds the input.
44. As an application developer, I want the usage rules stated (two children, Trigger first, a focusable Trigger with its own name, short text, nothing interactive in the Bubble, never the only place something is said, one hydration boundary), so that I use the item as Yeti intends.
45. As an application developer, I want to know what to do when a field's control needs a hint, so that two directives never fight over its `aria-describedby` (Part 2 row 42; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 219).
46. As an application developer, I want no `open()`, `close()`, or `toggle()` method and no open model, so that the hint stays under the user's hover and focus, as Yeti designs it.
47. As a theme author, I want the Bubble's surface, text, radius, and timing to come from Yeti's tokens, so that I theme it in my stylesheet as Yeti documents.
48. As a package maintainer, I want the contract check to cover the class, the attribute, and every `placement` value, so that a pin move that adds one fails before release.
49. As a package maintainer, I want Escape tested while hovered and while focused in three engines, so that ledger row A11Y-2 is proved where it matters (ADR 0043 consequences).
50. As a package maintainer, I want the replayed `keydown` and `focusout` measured in the fixture app, so that ADR 0043's replay note is checked for the tooltip.
51. As a package maintainer, I want every behaviour of Yeti's CSS-only tooltip listed against the directives, so that what the package adds and what stays Yeti's is checkable against the Pin.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/tooltip/manifest.json`, `tooltip.css`, `docs.md`, and `example.html`, in `Y/schema/vocabulary.json`, `Y/src/tokens/components.css`, and `Y/src/base/reset.css`, and in Yeti's own test `Y/test/browser/components/tooltip.spec.js` with its fixture:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `tooltip`, `component`, `Feedback` |
| `class` | `tooltip` |
| `attributes` | `data-placement`: enum, vocabulary `placement` (`top`, `bottom`, `start`, `end`; `vocabulary.json:40`), default `top`, "Which side of the trigger the bubble sits on." |
| `classes` | empty |
| `children` | `> *` (min 2, max 2): "The trigger first, then the bubble." `> [role="tooltip"]` (min 1, max 1): "The bubble; the trigger names it with aria-describedby." |
| `markers` | none |
| `tokens` | public: `--yeti-tooltip-surface`, `--yeti-tooltip-text`, `--yeti-tooltip-radius` (defaults `--yeti-color-text`, `--yeti-color-surface`, `--yeti-radius-sm`, `Y/src/tokens/components.css:89-91`), `--yeti-text-sm`, `--yeti-space-xs`, `--yeti-space-sm`, `--yeti-duration-fast`, `--yeti-ease`; private: `--_yeti-caret`, `--_yeti-caret-overlap` |
| `a11y` | `requiredAttributes` empty; `keyboard`: "Tab: Focusing the trigger shows the bubble, so it is reachable without a mouse."; `notes`: the Trigger references the Bubble with `aria-describedby`, the Bubble carries `role="tooltip"`; a short hint, never the only place something is said; no link or button inside the Bubble; "The bubble cannot be dismissed while the trigger stays hovered or focused, a known limit of a tooltip with no script, which WCAG 1.4.13 asks content shown on hover or focus to offer." |
| `js` | `null`: no Module, no Events |
| `support` | `unguarded`: individual transform properties, `clip-path: polygon()`, `:has()`; `guarded`: "anchor positioning (fallback: the bubble and its caret are placed above the trigger with absolute positioning)" |
| `since` | `7.0.0` |

How it works, in `@layer yeti.components` (`tooltip.css`): `.tooltip` is `inline-block` and `position: relative` (`:7-10`). `.tooltip > [role="tooltip"]` is absolutely positioned above the Trigger, centred with `translate`, `max-content` wide up to `16rem`, with the tooltip's surface, text colour, radius, and small text, and hidden at rest with `opacity: 0` and `visibility: hidden`, transitioning both over `--yeti-duration-fast` (`:11-27`). A `::after` caret of the Bubble's colour bridges the gap, overlapping it by one pixel (`:28-50`). `.tooltip:hover > [role="tooltip"]` and `.tooltip:has(:focus-visible) > [role="tooltip"]` show it (`:56-60`); `:focus-visible` rather than `:focus-within`, so a mouse click on the Trigger shows nothing (`:52-55`). Under `@supports` for `anchor-name`, `anchor-scope`, `position-anchor`, and `position-area`, each `.tooltip` scopes the anchor name `--yeti-tooltip`, its first child carries it, and the Bubble is `position: fixed` at `position-area: block-start span-all`, or `block-end`, `inline-start`, or `inline-end` for the three other placements; the caret is anchored to the Trigger rather than to the Bubble, so it stays on the Trigger when the Bubble slides along a viewport edge (`:64-121`). Without anchor positioning every Bubble sits above its Trigger whatever `data-placement` says, and a scrolling ancestor can clip it (`docs.md`, "How it works"; Yeti's own test skips the placement and clipping cases there, `tooltip.spec.js:84`, `:138`). Yeti's always-loaded `[hidden] { display: none !important; }` hides any element carrying `hidden` (`reset.css:75-77`), which is the hook the package uses.

Attributes left to the consumer (ticket 26 row 159 maps the one attribute; nothing of Yeti's is left out): the Trigger's element, its `type`, and its name (text, or `aria-label` on an icon-only Trigger; building-blocks 1.10, Names); the Bubble's text; an optional static `id` on the Bubble; optional extra `aria-describedby` ids on the Trigger (ticket 50 decision 46).

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `tooltip` | static host class on `YetiTooltip` | always | ADR 0003 point 1; Part 2 row 42 |
| Attribute `data-placement` | which side of the Trigger the Bubble sits on | input `placement`: `YetiPlacement \| undefined`, bound `[attr.data-placement]`, `null` when unset | unset renders nothing; Yeti's `top` applies. `placement` is not an HTML attribute, so a static `placement="end"` stays inert on the host | ticket 26 row 159 (R); ADR 0070 rules 1 and 2 |
| Child `> *` (first) | the Trigger, the anchor-positioning target (`tooltip.css:66`) | `YetiTooltipTrigger` on `[yetiTooltipTrigger]`, binding `[attr.aria-describedby]` | always bound | ADR 0003 point 5; ADR 0013 point 2; Part 2 row 42 |
| Trigger `aria-describedby` | the author's, naming the Bubble's id | input `userAriaDescribedBy`, alias `aria-describedby`, `string \| null`; bound value: the consumer's ids, then the Bubble's id, split on white space, without duplicates. The static form is `output`: a consumer's static `aria-describedby` feeds the input and the binding replaces the attribute in the same hydration pass | always bound, never `null` (the Bubble's id is always there) | ticket 50 decision 46; building-blocks 1.4 (static form); ADR 0013 point 2 |
| Child `> [role="tooltip"]` | the Bubble | `YetiTooltipBubble` on `[yetiTooltipBubble]`, static `role="tooltip"` (ticket 50 decision 218) and `[attr.id]` | always | Part 2 row 42; ADR 0003 point 5; ticket 50 decision 5 |
| Bubble `hidden` | Yeti's `[hidden]` rule (`reset.css:75-77`); Yeti never sets it on a tooltip | `YetiTooltipBubble` binds `[attr.hidden]`: `''` while the root's `dismissed()` is true, else `null` | absent at first paint and on the server | ADR 0043 point 2; Part 2 row 42; A11Y-2; [research/hydration-constraints-audit.md](../research/hydration-constraints-audit.md) row 14 |
| State: shown | `:hover` and `:has(:focus-visible)` on the root (`tooltip.css:56-60`) | Yeti's CSS; read by the Escape handlers as a guard, never bound or mirrored | never bound | ADR 0016 point 3; building-blocks 1.4 |
| Module | none (`"js": null`) | nothing replaced; the Escape behaviour is new (section "Yeti's behaviours, mapped") | not applicable | ADR 0040 consequences (a new feature is a ledger row) |
| Events | none | no output: the tooltip has no Module and the records give it no Completion output | not applicable | [events](events.md) rule 4; Part 2 row 42 |
| Tokens (manifest, public) | the Bubble's look, its gap and caret size, its fade | the consumer's; the package writes none and reads none | not applicable | ADR 0004 |
| Private tokens (`--_yeti-caret`, `--_yeti-caret-overlap`) | Yeti's implementation | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-tooltip=""` on `YetiTooltip`'s host only | always present | ADR 0045; ADR 0060 point 2; ticket 50 decision 6 |
| Generated id (package) | Yeti's ids are the author's | `ngx-yeti-tooltip-<n>` on the Bubble unless the consumer wrote a static `id` | not applicable | ADR 0044; [generated-ids](generated-ids.md) |
| Injection token | not Yeti's | `yetiTooltipToken`, provided by `YetiTooltip` | not applicable | building-blocks 1.3, 1.9 |

The input value type is Yeti's own `YetiPlacement`, from the package's generated `yeti-types.ts`, re-exported by name and never redeclared (ADR 0080 point 5; ADR 0060 point 10). No other item reads the `placement` vocabulary, so no shared-type question arises (building-blocks 1.4). None of `YetiTooltip`, `YetiTooltipTrigger`, `YetiTooltipBubble`, or `yetiTooltipToken` is among the 46 names `yeti.d.ts` exports at the Pin; `YetiPlacement` is one of them and is reused, not declared (ADR 0080 point 4; ticket 50 decision 10).

The part directives set no presence attribute and acquire no item file: Yeti's part rules apply only under `.tooltip`, whose own attribute keeps the link (ticket 50 decision 6; ADR 0045's scope note).

**Yeti's behaviours, mapped.** The tooltip has no Module to replace (ADR 0040), so this lists every behaviour of Yeti's CSS-only tooltip and what the package does with it:

| Yeti behaviour | Source | Package | Kept, changed, or added |
| --- | --- | --- | --- |
| Hidden at rest, shown on hover of the wrapper (Trigger or Bubble) | `tooltip.css:24-26`, `:56` | Yeti's CSS | kept |
| Shown on keyboard focus, not on a mouse click's focus | `:52-57` | Yeti's CSS | kept |
| Placement on four sides, logical, with anchor positioning; above the Trigger without it | `:64-121`; `docs.md` | `placement` input renders `data-placement`; the package adds no positioner and no feature check | kept (P16; building-blocks 1.2, 1.8) |
| A caret that stays on the Trigger when the Bubble slides along an edge | `:75-89` | Yeti's CSS | kept |
| Escapes a scrolling ancestor where anchor positioning exists | `:62-63` | Yeti's CSS | kept |
| Fade over `--yeti-duration-fast`, collapsed under reduced motion by Yeti's tokens | `:26`; building-blocks 1.6 rule 4 | Yeti's CSS | kept |
| The Trigger names the Bubble with `aria-describedby`; the Bubble has `role="tooltip"` | manifest `a11y.notes`; `example.html` | rendered by the part directives with a generated id; the consumer's ids kept | changed: the package writes them (ADR 0003 point 5) |
| Cannot be dismissed while hovered or focused | `docs.md`, Accessibility; manifest `a11y.notes` | Escape sets `dismissed`, the Bubble gets `hidden` until the pointer and focus have left | added (A11Y-2; ADR 0016 point 3; ADR 0043 point 2) |
| Needs no script | `docs.md` | still true for showing and hiding; only Escape needs script | kept, with Escape lost when script is off (section 10) |

**Tokens subsection** (ADR 0004; building-blocks 1.13). The item reads the public tokens the manifest lists. The package writes none, reads none, offers no input per token, and ships no theme. A consumer sets them in a `:root` block, in a **Theme** after Yeti, or on one tooltip or an ancestor, because they are plain public tokens read through the cascade (`Y/src/guides/theming.md:38`): `.legend { --yeti-tooltip-surface: var(--yeti-color-primary); }` in the consumer's stylesheet recolours the Bubbles inside an **Application class** `legend`, and the consumer then owns that pair's contrast. **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- **Root and parts.** `YetiTooltip` provides `yetiTooltipToken` (`InjectionToken` typed with `import type`, `useExisting`; building-blocks 1.9). `YetiTooltipTrigger` and `YetiTooltipBubble` inject it, required, because neither can exist alone (manifest `children` `min: 2`): a forgotten root fails at creation with Angular's DI error. The root is never on the same element as a part, so no `skipSelf` is needed.
- **The Bubble registers.** `YetiTooltipBubble` registers its id with the root at construction (an unordered part; architecture-guide P4) and unregisters on destroy. The root exposes the registered id as a signal, which the Trigger's binding reads. One Bubble per root (usage rule 1).
- **Ids and the relationship attribute.** The directive whose host renders the `id` generates it (ticket 50 decision 5; architecture-guide P4): `YetiTooltipBubble` calls `injectYetiId('tooltip')` in a field and binds `[attr.id]`. The consumer's static `id` wins (ADR 0044 step 1). `YetiTooltipTrigger` binds `[attr.aria-describedby]` from its `userAriaDescribedBy` input and the registered id (ADR 0013 point 2; ticket 50 decision 46). Both ends are host bindings with the same value on the server and the client, so hydration rewrites nothing (ADR 0044 point 4).
- **The `dismissed` state.** A `signal(false)` on the root, written only by the root's handlers (section 4), exposed as a read-only `Signal<boolean>` named `dismissed`, which the Bubble reads through the token for its `hidden` binding. Its initial value is `false` on the server and the client, so there is no element state to read at creation; the cross-item open-state decision of 2026-10-03 has nothing to apply to beyond its "no public `open()`, `close()`, or `toggle()`" (ticket 50).
- **No host directives.** Nothing from Aria or CDK is hosted (Part 2 row 42). `yetiButton` on the Trigger is written beside `yetiTooltipTrigger`, never hosted (building-blocks 1.9, "Two findings").
- **A Trigger that is a field's control.** `yetiFieldControl` also binds `aria-describedby` with the same merging rule ([field](field.md) section 4), and the field spec defers the conflict to this spec (its Out of Scope; Part 2 row 42). Two package directives must not both own one attribute on one element (building-blocks 1.4; ticket 25 point 11), so `yetiTooltipTrigger` is never written on a `yetiFieldControl` (usage rule 7; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 219). The tooltip entry point imports nothing from `ngx-yeti/field`.
- **Other injections.** `DestroyRef`; `DOCUMENT` (for the document-level Escape listener's target check, used only in handlers); the ADR 0060 styles service through `injectYetiItemStyles('tooltip')` ([setup](setup.md)). No Router: the tooltip opens nothing that could survive a navigation (section 12). No `Directionality`: placement is logical in Yeti's CSS.
- **Hydration boundary.** The root and both parts belong to one hydration boundary: a consumer's `@defer` wraps the whole tooltip, never one part (building-blocks 1.11 decision 6; usage rule 9).

### 4. API

| Member | `YetiTooltip` | `YetiTooltipTrigger` | `YetiTooltipBubble` |
| --- | --- | --- | --- |
| Selector | `[yetiTooltip]` | `[yetiTooltipTrigger]` | `[yetiTooltipBubble]` |
| `exportAs` | `yetiTooltip` | `yetiTooltipTrigger` | `yetiTooltipBubble` |
| Entry point | `ngx-yeti/tooltip` | same | same |
| Inputs | `placement: YetiPlacement \| undefined` (Yeti default `top`), `input()` with no default value | `userAriaDescribedBy: string \| null`, alias `aria-describedby`, default `null` (Material `MatInput`'s shape, `NC/src/material/input/input.ts:243`) | none |
| Read-only state | `dismissed: Signal<boolean>` | none | none |
| Model | none | none | none |
| Outputs | none | none | none |
| Methods | none (cross-item open-state decision, ticket 50) | none | none |
| Host | static `class: 'tooltip'`; static `data-ngx-yeti-item-tooltip: ''`; `[attr.data-placement]`, `null` when unset; listeners `(keydown)`, `(focusout)`, `(pointerleave)`, and `(document:keydown)` (ticket 50 decision 215) | `[attr.aria-describedby]` | static `role: 'tooltip'` (ticket 50 decision 218); `[attr.id]`; `[attr.hidden]` |
| Providers | `{provide: yetiTooltipToken, useExisting: YetiTooltip}` | none | none |
| Lifecycle | as its last constructor statement, `injectYetiItemStyles('tooltip')` | none | registers at construction, unregisters on destroy |

No input default differs from Yeti's (ADR 0070 rule 1). A static attribute type-checks as a string literal under `strictTemplates`, so `placement="bottom"` compiles and `placement="left"` does not (ADR 0070 rule 2). The Trigger's selector is any element, because Yeti's `children` selector is `> *` and its anchor is `> :first-child` (`tooltip.css:66`); usage rule 2 asks for a focusable one.

**Behaviour, by listener.** "Shown" means the root matches Yeti's own show selectors, `:hover` or `:has(:focus-visible)` (`tooltip.css:56-57`), read with `Element.matches` in the handler. A handler that runs while the Bubble is not shown does nothing, because ADR 0016 point 3 dismisses only "while its trigger stays hovered or focused", and Material's predicate is the same (`_isTooltipVisible()`, `NC/src/material/tooltip/tooltip.ts:942-948`).

1. **`keydown` on the root** (ADR 0043 point 2; A11Y-2). For `event.key === 'Escape'` with no modifier (`hasModifierKey`, `NC/src/cdk/keycodes/modifiers.ts:15`), while shown and not already dismissed: set `dismissed` to `true`; then, as its last statement, call `preventDefault()`, so the same Escape does not also close an enclosing `dialog` or popover ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 216); ADR 0043's dated note says its "no `preventDefault()`" consequence covers the focus-out listener, not this one. This is the focus case: the key event reaches the root only when focus is inside it. Any other key does nothing.
2. **`document:keydown`** ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 215, option D; ADR 0043 dated note). The same Escape test and the same guard, for an event whose target is outside the root: this is the hover case, where the Bubble shows under a resting pointer while focus is on another control or on `body`, and a key event never passes through the root. It sets `dismissed` to `true` and calls no `preventDefault()`, so the focused widget keeps its own Escape. An event whose target is inside the root is left to item 1.
3. **`pointerleave` on the root** (ADR 0043 point 2). When the root no longer matches `:has(:focus-visible)`, set `dismissed` to `false`. While keyboard focus is still on the Trigger the Bubble stays dismissed, so it does not pop back under the user who just dismissed it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 217). Not replayed (`NGP/core/primitives/event-dispatch/src/event_type.ts:287-292`).
4. **`focusout` on the root** (ADR 0043 point 2). When `event.relatedTarget` is outside the root and the root does not match `:hover`, set `dismissed` to `false` (the same reading as item 3; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 217). It moves no focus. Replayed; a replayed `focusout` that finds `dismissed` already `false` changes nothing.
5. **Destroy.** Nothing to restore: the listeners are `host` metadata and Angular removes them with the directive, including the `document:` one (building-blocks 1.15, Listeners). The Bubble leaves with its element.

No other key handler: Tab, Shift+Tab, and Enter on the Trigger are the platform's and the Trigger's own; the APG names Escape only (`APG/tooltip/tooltip-pattern.html:44`). No timer and no show delay: Yeti's CSS shows the Bubble at once and fades it in (section 9); Material's `showDelay` and `hideDelay` have no counterpart because Yeti has no token for them (building-blocks 1.4, "Removed options").

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. A tooltip has exactly two children, both direct children of the `yetiTooltip` element: the `yetiTooltipTrigger` element first, then one `yetiTooltipBubble` element (manifest `children`; Yeti's CSS uses `>` and `:first-child`, `tooltip.css:11`, `:66`).
2. Make the Trigger focusable: a `button` (with `type="button"`), or a link with `href`. A disabled `button` cannot take focus, so keyboard users would never see its hint; do not make a disabled control a Trigger (manifest `a11y.keyboard`).
3. Give the Trigger its own name: its text, or `aria-label` on an icon-only Trigger. The Bubble is a description, never the name (manifest `a11y.notes`; building-blocks 1.10, Names; APG `tooltip-pattern.html:58-59`).
4. Keep the Bubble to a few words of text, with no link, button, or other focusable content: there is no way to reach it (manifest `a11y.notes`; APG `tooltip-pattern.html:31`).
5. Never put anything in the Bubble that is said nowhere else: touch has no hover, so the same information lives in the Trigger's label, a field's hint, or the surrounding text (`Y/src/guides/components.md:218`; `docs.md`, "When to use it").
6. Do not write `class="tooltip"`, `data-placement`, `hidden`, or `data-ngx-yeti-item-tooltip`; the directives bind them, and hydration writes a static attribute back before the binding wins (ADR 0003; building-blocks, "Hydration constraints (2026-10-03)"). A static `id` on the Bubble is allowed and wins (ADR 0044 step 1); never bind `[id]` on it ([generated-ids](generated-ids.md) usage rule 3). A static `aria-describedby` on the Trigger is allowed and merged (ticket 50 decision 46); never bind `[attr.aria-describedby]` on it, which would compete with the directive's binding. A static `role="tooltip"` on the Bubble is harmless and redundant.
7. Never write `yetiTooltipTrigger` on a `yetiFieldControl`. Use the field's hint (`yetiFieldHint`), which "sits under the control permanently and is almost always the better answer" (`docs.md`, Accessibility); if a hint must also sit in a tooltip, put the tooltip on a separate button beside the label (building-blocks 1.4, one owner per attribute; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 219).
8. Use a `span` as the root inside phrasing content (a paragraph, a label, a table cell's text), as Yeti does, so the markup stays valid HTML; a `div` is fine in flow content.
9. Put the whole tooltip, root and both parts, inside one hydration boundary; never `@defer` one part (building-blocks 1.11 decision 6).
10. Bind every input from values that are the same on the server and the client (hydration constraints).
11. Import all three directives where a template writes them. A **Forgotten import** of `YetiTooltip` leaves the Bubble as plain inline text beside the Trigger, always visible, because no `.tooltip` rule applies; of `YetiTooltipBubble`, a Bubble with no `role`, no `id`, and no description link, so Escape does nothing either; of `YetiTooltipTrigger`, a control with no description (building-blocks 1.9; ADR 0018; read from `tooltip.css`, inferred for the result). A bound input or a template reference makes the compiler report it (NG8002, NG8003).
12. Keep a Trigger that sits near the inline end of the page to a short hint: in browsers without anchor positioning, which include the target's floor, Yeti centres the Bubble on the Trigger with no sliding, so a Bubble wider than twice the Trigger's distance from the edge reaches past it, even while hidden (section 7, 1.4.10; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 220).

### 5. Material comparison

| Aspect | ngx-yeti `tooltip` | Angular Material `MatTooltip` |
| --- | --- | --- |
| Shape | three attribute directives on the consumer's wrapper, Trigger, and Bubble; the Bubble is the consumer's element, in place in the DOM | one directive on the trigger, `[matTooltip]` (`NC/src/material/tooltip/tooltip.ts:187`), whose `mat-tooltip-component` CDK Overlay attaches elsewhere (`:959`) |
| Text | the Bubble's content, written in the template (and translatable with `i18n`) | a string input, `matTooltip` (`:330`) |
| Showing | Yeti's CSS, `:hover` and `:has(:focus-visible)`, before hydration and with no script | `mouseenter` and `FocusMonitor` handlers after bootstrap (`:412`, `:788`) |
| Placement | Yeti's anchor positioning; `placement`: `top`, `bottom`, `start`, `end` | CDK Overlay's measured positions; `matTooltipPosition`: `left`, `right`, `above`, `below`, `before`, `after` (`:59`, `:230`) |
| Delays | none (Yeti's fade only) | `matTooltipShowDelay`, `matTooltipHideDelay` (`:286`, `:298`) |
| Description | `aria-describedby` to the consumer's Bubble, consumer's ids kept first | `AriaDescriber` with a hidden message container (`:198`, `:932`) |
| Escape | `dismissed` until the pointer and focus have left; a root listener for the focus case, a document listener for the hover case | an overlay keydown subscription, fed by CDK's body-level keyboard dispatcher through a predicate (visible, Escape, no modifier), that calls `preventDefault()` and `stopPropagation()` and hides the tooltip (`:561-568`, `:942-948`) |
| Touch | Yeti's CSS only; usage rule 5 keeps the information elsewhere | `matTooltipTouchGestures` (`:327`) |
| State and methods | read-only `dismissed`; no methods | `show()`, `hide()`, `toggle()` (`:451`, `:474`, `:488`) |
| `exportAs` | `yetiTooltip`, `yetiTooltipTrigger`, `yetiTooltipBubble` | `matTooltip` (`:188`) |

Borrowed: the Escape predicate (shown, Escape, no modifier) and the layered Escape that hides the tooltip before an enclosing dialog ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 216). Not borrowed: the overlay and its positions (building-blocks 1.8), `AriaDescriber` (ADR 0043 point 4: the Bubble is Yeti's markup, and a second description element would duplicate it), the delays and touch gestures (no Yeti counterpart), the string message (Yeti's Bubble is content), and the methods (cross-item open-state decision, ticket 50).

### 6. Implementation level and primitives

Native platform, level 1 (Part 2 row 42): CSS `:hover` and `:has(:focus-visible)` show the Bubble, and Yeti's guarded anchor positioning places it (building-blocks 1.2; P16). What remains is "two listeners and one binding" (row 42's reason): the Escape listener and the resetting listeners, and the Bubble's `hidden`.

- `@angular/aria` is not used: Aria 22.2 has no tooltip pattern (`research/yeti-javascript-and-angular.md:169`; [research/aria-on-yeti-markup.md](../research/aria-on-yeti-markup.md), the tooltip row).
- `@angular/cdk` is used only for `hasModifierKey` (building-blocks 1.5). `AriaDescriber` (`NC/src/cdk/a11y/aria-describer/aria-describer.ts:41`) is not used: it appends its own hidden message container, and the Bubble is the consumer's own element (ADR 0043 point 4). `FocusMonitor` is not used: Yeti's `:focus-visible` already tells keyboard focus from a click's, and the handlers read it from the element. CDK Overlay is not used (building-blocks 1.8).
- `popover="hint"` is not used: Yeti chose a tooltip that needs no script to show, and `hint` needs script or `interestfor` to open (ADR 0016 and ADR 0043, considered options; `tooltip.css:1-5`).
- Custom Angular pieces: the root's four listeners, one signal, and the parts' bindings, all per instance.

### 7. ARIA, keyboard, accessibility, and the ledger

- **APG pattern:** Tooltip (`APG/tooltip/tooltip-pattern.html`; marked work in progress by the APG itself, `:22-24`). Ticket 17 found Yeti's tooltip matching it except for Escape (`research/yeti-accessibility-and-standards.md`, 4.21).
- **Roles:** the Bubble is `tooltip` (rendered by `YetiTooltipBubble`); the Trigger keeps its own role (`button` or `link`). Ticket 17 measured Chromium's tree as `button "Save" desc="Saves without closing"`.
- **Properties:** the Trigger's `aria-describedby` names the Bubble (`tooltip-pattern.html:58-59`), with the consumer's ids first. The Bubble takes no focus (`:31`).
- **States:** none in ARIA. Shown is Yeti's CSS state; `hidden` marks a dismissed Bubble. A Bubble hidden with `hidden` still feeds the Trigger's description, because the accessible-description computation includes content referenced by `aria-describedby` even when it is hidden (inferred from the accname algorithm; layer 1 asserts it).
- **Names:** the Trigger's text or the consumer's `aria-label` (usage rule 3); the directives declare no name input (building-blocks 1.10).

| Key | With focus on the Trigger | With the Bubble shown by hover and focus elsewhere | Record |
| --- | --- | --- | --- |
| Tab, Shift+Tab | onto the Trigger, the Bubble shows; off it, the Bubble hides unless the pointer still hovers | the platform's | Yeti's CSS; manifest `a11y.keyboard` |
| Escape | hides the Bubble, focus stays; an enclosing dialog or popover stays open (ticket 50 decision 216) | hides the Bubble, pointer and focus stay (ticket 50 decision 215) | ADR 0016 point 3; ADR 0043 point 2; A11Y-2; APG `:44`, `:48` |
| Enter, Space | the Trigger's own action | the focused control's own action | platform |

Focus: the package never moves focus. The focus ring is the Trigger's own (Yeti's base rule, or `button.css` under `yetiButton`). A mouse click on the Trigger gives it focus without `:focus-visible`, so the Bubble does not stay for a click (`tooltip.css:52-55`; Yeti's own test, `tooltip.spec.js:35-57`).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value | `role="tooltip"` on the Bubble and `aria-describedby` on the Trigger, both rendered with matching ids on the server; the Trigger's own name (usage rule 3). Play functions assert the Trigger's role, name, and description through the accessibility tree. |
| 1.4.3 Contrast (Minimum) | The Bubble's text on `--yeti-tooltip-surface`, at least 4.5:1, light and dark, asserted on the shown Bubble with the exact WCAG formula on computed colours (ADR 0015 point 3; ticket 50 decision 8). Yeti's own contrast test covers the same fixture (`Y/test/browser/contrast.spec.js:34`). |
| 1.4.10 Reflow | Where anchor positioning exists, the Bubble slides to stay in the viewport (`tooltip.spec.js:98-109`). In Yeti's fallback the Bubble is centred above its Trigger with `max-content` width up to `16rem` and "overflows the edge rather than sliding" (`tooltip.spec.js:101`); it is laid out while hidden (`visibility: hidden`), so a Trigger near the inline end can widen the page's scrollable area at rest (inferred from the CSS, not measured). The browser target's floor uses the fallback in all three engines: the anchor-positioning keys Yeti guards on reach Chrome 151, Firefox 151, and Safari 27 ([research/browser-baseline-vs-yeti.md](../research/browser-baseline-vs-yeti.md):281, ticket 01, from web-features data). Usage rule 12, ledger row [A11Y-29](../ledger.md), and a layer-4 measurement; no package CSS until measured ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 220). |
| 1.4.11 Non-text Contrast | The Bubble draws no state by colour against a neighbour; its edge against the page is a filled surface, and its caret is decoration. The Trigger's focus ring is the Trigger's item's. No ratio is asserted for the Bubble's edge. Under forced colours, see the note below. |
| 1.4.13 Content on Hover or Focus | Dismissible: Escape hides the Bubble without moving the pointer or focus, by the root listener with focus inside and the document listener under a resting pointer (A11Y-2; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 215 for the document listener). Hoverable: the Bubble is a child of the root, so moving the pointer onto it keeps `.tooltip:hover` (measured in three engines, ticket 17), and Yeti's caret bridges the gap. Persistent: Yeti's CSS keeps it until hover and focus leave, or Escape; nothing times it out. `tooltip--escape` and layer 4 assert all three. |
| 2.1.1 Keyboard | The Bubble shows on keyboard focus (`:has(:focus-visible)`) and Escape hides it; the Trigger must be focusable (usage rule 2). |
| 2.4.7 Focus Visible | The Trigger's own ring; the tooltip adds none and removes none. |
| 2.4.11 Focus Not Obscured (Minimum) | A Bubble shown by a resting pointer can sit over a control that keyboard focus moves to. It is at most `16rem` wide and a few words tall (usage rule 4), and Escape hides it without moving focus or the pointer (the document listener). Layer 4 records a Tab past a hovered Trigger onto a neighbour (inferred). |
| 2.5.8 Target Size (Minimum) | The Trigger's own item (`button`); the Bubble is not a target. |
| 3.2.1 On Focus | Showing a description on focus is not a change of context. |

Forced colours: the Bubble is drawn by a background with no border, and its caret by a background with a `clip-path` (`tooltip.css:21`, `:41-50`), so under `forced-colors: active` the Bubble's edge against the page and the caret may disappear while its text remains readable. This spec adds no package CSS and no ledger row, after the decisions for decoration and surfaces ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 26, 30, and 78); layer 4 asserts the text's contrast under `forcedColors: 'active'` and records the Bubble's computed border and a screenshot in three engines ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 221).

**Ledger rows owned:** A11Y-2 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 215 to 217) and A11Y-29 (decision 220) ([ledger.md](../ledger.md); Part 2 row 42). Escape does not dismiss the Bubble while the Trigger stays hovered or focused (WCAG 2.2 1.4.13 dismissible; APG `tooltip-pattern.html:44`). The package adds the root's `keydown` listener setting `dismissed`, the Bubble's `[attr.hidden]` through Yeti's `[hidden]` rule, and the resetting `pointerleave` and `focusout` listeners. A11Y-2's "What the package adds" column names the `document:keydown` listener for the hover case, `preventDefault()` on a dismissing Escape in the focus case, and the reset only once neither hover nor keyboard focus remains (decisions 215 to 217). Its "Tested by" stays L1 (focus the Trigger, press Escape, the Bubble gets `hidden`) and L4 (hover then Escape, three engines), plus the layer-2 cases below. A11Y-29 records the fallback's reflow: usage rule 12 and a layer-4 `scrollWidth` case, with no package CSS until measured (decision 220).

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
<span yetiTooltip placement="bottom">
  <button yetiButton yetiTooltipTrigger type="button" emphasis="medium" i18n>Save</button>
  <span yetiTooltipBubble i18n>Saves without closing</span>
</span>
```

Server HTML and the hydrated DOM are the same (attribute order aside):

```html
<span yetitooltip placement="bottom" class="tooltip" data-ngx-yeti-item-tooltip="" data-placement="bottom" jsaction="keydown:;focusout:;">
  <button yetibutton yetitooltiptrigger type="button" emphasis="medium" class="button" data-ngx-yeti-item-button="" data-emphasis="medium" aria-describedby="ngx-yeti-tooltip-0">Save</button>
  <span yetitooltipbubble role="tooltip" id="ngx-yeti-tooltip-0">Saves without closing</span>
</span>
```

`jsaction` appears for the replayable listeners only: `keydown` and `focusout` on the root. `pointerleave` is not on Angular's replay list (`NGP/core/primitives/event-dispatch/src/event_type.ts:287-292`, `MOUSE_SPECIAL_EVENT_TYPES`), and `document:` listeners are never replayed (building-blocks 1.11). The exact `jsaction` value is Angular's; the SSR smoke asserts which events it names, not its text. Unset `placement` renders no `data-placement`. A consumer `id="save-tip"` on the Bubble gives `id="save-tip"` and `aria-describedby="save-tip"`. A consumer `aria-describedby="save-note"` on the Trigger gives `aria-describedby="save-note ngx-yeti-tooltip-0"`.

Shown and dismissed: the DOM does not change when the Bubble shows; shown is Yeti's CSS state on `:hover` and `:has(:focus-visible)`, and no attribute marks it. After Escape the Bubble alone gains `hidden=""`, and loses it once the pointer and keyboard focus have both left the root. The server never renders `hidden`, because `dismissed` starts `false`.

The server also writes the item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>components/tooltip/tooltip.css?v=<pin>` (`Y/src/yeti.css:59`, after `dialog` and before `carousel`), with `data-ngx-yeti-styles="tooltip"`, `data-ngx-yeti-app`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided ([ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md) points 2, 3, and 5). The Trigger's `yetiButton` writes the `button` and `spinner` links ([button](button.md)).

The delta from Yeti's docs markup: the consumer writes three directive attributes where the docs write `class="tooltip"`, `role="tooltip"`, `aria-describedby`, and the shared `id`, and `placement` where they write `data-placement`.

### 9. Animation

Yeti's own transition only: `opacity` and `visibility` over `--yeti-duration-fast` with `--yeti-ease` when the Bubble shows and hides (`tooltip.css:26`). The directives add no class and no inline style (ADR 0010 point 1; building-blocks 1.6 rule 1). A dismissed Bubble disappears at once, because `hidden` sets `display: none` (`reset.css:75-77`), as the platform's Escape hides a popover at once; nothing waits for a transition, and the tooltip has no Completion output to time. Reduced motion is Yeti's: its tokens collapse the duration (building-blocks 1.6 rule 4). No `animate.enter` or `animate.leave`: the Bubble persists in the DOM and is server-rendered (ADR 0011 clause 12). A tooltip the consumer inserts or removes with `@if` may carry a class-form `animate.enter` or `animate.leave` of the consumer's on its root, and its item link stays until Angular removes the last host (ADR 0060 point 4).

### 10. Rendering modes

- **Server output and first paint:** the root's class, presence attribute, and bound `data-placement`; the Trigger's `aria-describedby`; the Bubble's `role` and id; no `hidden`; the item link (section 8). Every value is a host binding or a static host attribute (ADR 0011 clause 1). No listener runs on the server.
- **Pre-hydration state:** none the package owns. The shown state is CSS and has no attribute; `dismissed` is Angular state that does not exist before the app is live and is never in the server HTML, so hydration has nothing to write back over a person's action (ADR 0003 point 4).
- **Before hydration:** Yeti's tooltip, unchanged: hover and keyboard focus show the Bubble, and the description is in the tree. Escape does nothing until the app is live.
- **Event replay:** the root's `keydown` replays. An Escape pressed on a focused Trigger before hydration reaches the handler once the boundary hydrates; the guard reads the root then, so the Bubble is dismissed only if it is still shown (focus still on the Trigger, or the pointer over the root), and an Escape whose moment has passed changes nothing (ADR 0043's 2026-10-03 note says a replayed Escape dismisses the tooltip; this spec adds the guard's condition, read from ADR 0016 point 3). The handler sets the state first and calls `preventDefault()` last, which throws during replay after the state has changed (building-blocks 1.5, 1.11). `focusout` replays and at most resets a `false` signal to `false`. `pointerleave` and the `document:keydown` listener are never replayed, which is correct: before hydration nothing was dismissed.
- **Full hydration:** the three elements are claimed as they are; the Bubble's id is adopted from the server's (ADR 0044 step 2); `aria-describedby` and the other bindings give the same values (usage rule 10); 0 style mutations for the link (ADR 0060 point 5). A consumer's static `aria-describedby` on the Trigger is written back at hydration and replaced by the merged value in the same pass (ticket 50 decision 46; layer 4 asserts no `NG05xx`).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the tooltip and its link; before the trigger it behaves as before hydration, with the presence attribute holding the link (ADR 0060 point 4). `hydrate on interaction` hydrates on a keydown on the focused Trigger and replays it, so an Escape that hydrates the block also dismisses the Bubble if it is still shown. `hydrate on hover` hydrates when the pointer enters; the `document:keydown` listener then answers Escape at once, because it does not depend on a `pointerenter` (inferred; layer 4).
- **`hydrate never`:** the residue is Yeti's tooltip: it shows on hover and keyboard focus, is described, and never dismisses on Escape. It stays styled while its host is connected (ADR 0060 point 4; ADR 0045).
- **Client-only `@defer`:** the directives set up their own hosts when created (ADR 0011 clause 5), so Escape works from the first interaction. The item file is fetched on construction; until it arrives no `.tooltip` rule hides the Bubble, so its text shows inline beside the Trigger for a few frames (read from `tooltip.css`, inferred for the frames). `provideYetiStyles({ preload: ['tooltip'] })` closes the gap (ADR 0060 point 6; [setup](setup.md)).
- **`withI18nSupport()`:** the Bubble's text and the Trigger's label are usually translated with `i18n`; the directives add no `i18n` block, and the consumer's component needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11).
- **Zoneless:** `dismissed` is a signal written from host listeners, and the Bubble's `hidden` binding reads it; Angular's listener wrapper schedules the check with no zone (map, Standing rulings, item 43; building-blocks 1.5). The `document:keydown` listener does the same for every key press on the page while a tooltip is on it; its handler returns after one key comparison for any key but Escape ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 215, which accepts the cost).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the tooltip shows on hover and keyboard focus, is placed by Yeti's CSS, and is described to assistive technology. Lost: Escape dismissal (A11Y-2's addition), so with script off the item is back to Yeti's own 1.4.13 gap. A client-only application gets no such promise.
- **Hydration boundary:** the whole tooltip (usage rule 9; building-blocks 1.11 decision 6).

### 11. Hydration constraints

The item complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class, the presence attribute, and `role` are static host attributes; `data-placement`, the id, and `aria-describedby` are host bindings whose values are equal on both sides (usage rule 10; ADR 0044); `hidden` is `null` on both sides until a live Escape.
- **No direct DOM manipulation:** none. Every write is a host binding on a signal; the handlers only read the root with `matches()` and write the signal (building-blocks 1.5). No `focus()`, no node creation, no imperative call.
- **Valid HTML:** the directives change no element. A `span` root holds a phrasing Trigger and a `span` Bubble (usage rule 8).
- **`preserveWhitespaces`:** no template. The white space between the Trigger and the Bubble does not affect layout, because the Bubble is positioned out of flow (`tooltip.css:12`, `:68`); it is the consumer's template setting and equal on both sides.
- **No output branched on the platform:** none.
- **Static attributes the directives bind:** usage rule 6 keeps the consumer from writing them, with three allowed forms: a static `id` on the Bubble, read through `HostAttributeToken` and bound with the same value (ADR 0044 step 1); a static `aria-describedby` on the Trigger, fed to the input and replaced by the merged value in the same pass (ticket 50 decision 46); and a static `role="tooltip"`, equal to the bound one.

### 12. Single-page application

None of the item's own. The tooltip opens nothing in the top layer, so nothing can survive a navigation over the new route, and [navigation-close](navigation-close.md) does not apply (ADR 0041 covers popovers and dialogs). A tooltip in a destroyed route leaves with its element; a dismissed tooltip in the persistent shell resets when the pointer and focus leave it, as anywhere else. A link used as a Trigger is the consumer's: a `routerLink`, or a bare `href="#id"` that needs `provideYetiFragmentLinks()` under `<base href>` ([fragment-links](fragment-links.md); [setup](setup.md)). On a route change the item link is removed after its last host leaves (ADR 0060 point 4).

### 13. Item file

`yeti-css/css/components/tooltip/tooltip.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060 through `injectYetiItemStyles('tooltip')`, the last statement of `YetiTooltip`'s constructor ([setup](setup.md); ticket 50 decisions 42 and 45): acquired when the first `YetiTooltip` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:59`), and removed after the last host carrying `data-ngx-yeti-item-tooltip` has left the DOM and the live count is zero. The parts acquire nothing (ticket 50 decision 6).

Cross-item files: none acquired by the tooltip. A Trigger styled as a button acquires `button` and `spinner` through its own `yetiButton`. Yeti's install guide names the tooltip among the files a site can leave out (`Y/src/guides/install.md:76-84`), which the per-item loader does by itself.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class, attributes, and ids in the DOM; whether the Bubble carries `hidden`; its computed `visibility` and `opacity` under real hover and focus; roles, names, and descriptions in the accessibility tree; where focus is; and computed colours. It never asserts a private field or which listener ran. No test depends on a public token's default value (ADR 0006; ADR 0015 point 3). Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

Yeti's tooltip shows on CSS `:hover`, which only a real pointer sets; Storybook's `userEvent.hover` dispatches synthetic events and does not set it (inferred from how `:hover` is computed). So the shown state under a pointer is asserted in layers 2 and 4, which drive real input through Playwright, as Yeti's own test does with `page.hover` (`tooltip.spec.js:19-26`). Layer 1 reaches the focus case through the keyboard.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group and the package's accessibility stylesheet globally and the item files through the directives, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Story ids:

- `tooltip--default`: Yeti's example (a "Save" Trigger with `yetiButton`, `placement="bottom"`). Asserts `class="tooltip"`, `data-ngx-yeti-item-tooltip`, `data-placement="bottom"`, `role="tooltip"` and an `ngx-yeti-tooltip-<n>` id on the Bubble equal to the Trigger's `aria-describedby`, and no `hidden`. The Trigger's accessible description is "Saves without closing". Tab focuses the Trigger and the Bubble's computed `visibility` becomes `visible` (keyboard focus sets `:focus-visible`); Escape adds `hidden` and focus stays on the Trigger (A11Y-2, L1); the description is still "Saves without closing"; Tab away removes `hidden`. Asserts the shown Bubble's text at least 4.5:1 on its surface, light and dark (ticket 50 decision 8). Asserts one `<link data-ngx-yeti-styles="tooltip">` in `<head>`.
- `tooltip--placements`: four tooltips with `placement` unset, `bottom`, `start`, and `end`. Asserts the attribute on the three set ones and none on the first.
- `tooltip--icon-only`: Yeti's docs example, an icon-only Trigger with `aria-label="Copy link"` and `placement="end"`. Asserts the name "Copy link" and the description "Copies the link", and that the Bubble's text is not part of the name.
- `tooltip--escape`: a focused Trigger dismissed with Escape stays dismissed while focus stays; Shift+Tab away and Tab back shows it again; an Escape with Shift held does nothing; an Escape with the Bubble not shown (focus elsewhere, no hover) adds no `hidden`.
- `tooltip--consumer-ids`: a Bubble with `id="save-tip"` and a Trigger with `aria-describedby="save-note"` pointing at a paragraph. Asserts `aria-describedby="save-note save-tip"`, no generated id, and a description of both texts in that order.
- `tooltip--in-dialog`: a tooltip inside an open `dialog[yetiDialog]`. With focus on the Trigger, the first Escape adds `hidden` and the dialog stays open; the second closes the dialog ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 216).
- `tooltip--rtl`: `tooltip--placements` inside `dir="rtl"`; the attributes are unchanged (placement is logical in Yeti's CSS). The geometry is layer 4's.
- `tooltip--in-sentence`: a `span` tooltip inside a `p`, after Yeti's fixture (`Y/test/browser/fixtures/components/tooltip.html`). Asserts the markup has no invalid nesting (the root and both parts are `span` and `button`).

### Layer 2: browser-level (`npx nx test <lib>`, `tooltip.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note) for the root alone, and a small test host for the composed cases, which need content (ADR 0014's note). Pointer cases use Vitest browser mode's own `userEvent`, which drives Playwright and sets `:hover` (inferred; the case first asserts that the root matches `:hover` after the hover):

- `createDirective(YetiTooltip, { tagName: 'span' })`: the host has class `tooltip` and `data-ngx-yeti-item-tooltip`, and no `data-placement`; with `bindings` setting `placement`, the attribute follows after `whenStable()`, and `undefined` removes it. `dismissed()` is `false`. One `<link data-ngx-yeti-styles="tooltip">` is in `document.head` while the fixture lives, and it is gone an animation frame after `fixture.destroy()`.
- A test host with the three directives: the Bubble has `role="tooltip"` and an `ngx-yeti-tooltip-<n>` id equal to the Trigger's `aria-describedby`; a static Bubble `id` wins; a static Trigger `aria-describedby="a b a"` gives `"a b <bubble id>"`; neither part carries a presence attribute; a part outside a root throws Angular's DI error.
- Escape, focus case: with the Trigger focused by `userEvent.keyboard('{Tab}')`, an Escape `keydown` sets `dismissed()` and the Bubble's `hidden`, and its `defaultPrevented` is `true`; Escape with `Alt`, `Control`, `Meta`, or `Shift` does nothing; a second Escape while dismissed does nothing and does not call `preventDefault()`. The handler driven with an event whose `preventDefault` throws still sets the state (building-blocks 1.12, replay-safe handlers).
- Escape, hover case: with the pointer over the root and focus on a `button` outside it, an Escape dispatched by the keyboard on that button sets `dismissed()`, and its `defaultPrevented` stays `false`; the same Escape with the pointer elsewhere does nothing ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 215).
- Reset: after a hover-only dismissal, moving the pointer off resets `dismissed()`; after a focus-only dismissal, Tab away resets it; after a dismissal while both hovered and focused, moving the pointer off keeps it, and Tab away then resets it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 217).
- Destroy: after `fixture.destroy()`, an Escape on `document` throws nothing and changes nothing.
- No `CustomEvent` is dispatched on the host or the document (events rule 5).

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `tooltip.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and section 8's markup, whose texts carry `i18n`, plus a second tooltip with `placement="end"`, a static Bubble `id`, and a static Trigger `aria-describedby` (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the root renders `class="tooltip"`, the presence attribute, and `data-placement` only where set; the Bubble renders `role="tooltip"` and its id, generated `ngx-yeti-tooltip-0` and the consumer's; each Trigger's `aria-describedby` is its Bubble's id, after the consumer's ids where given; no `hidden` is rendered; `jsaction` on the root names `keydown` and `focusout` and nothing names `pointerleave`; `<head>` holds one `tooltip` link with `data-beasties-skip` and an `href` ending `components/tooltip/tooltip.css?v=<pin>`.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `tooltip` has `YetiTooltip`; `data-placement` has an input whose union equals the vocabulary `placement`; the item has no markers, no Module, and no events.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids, with real input in Chromium, Firefox, and WebKit (WebKit with Alt+Tab, as Yeti's test does, `tooltip.spec.js:53`):

- `tooltip--default`: hover shows the Bubble (`visibility: visible`, `opacity` near 1 after the transition settles, Yeti's `settle` helper as the model, `tooltip.spec.js:10-11`); moving onto the Bubble keeps it (1.4.13 hoverable); a mouse click on the Trigger followed by moving the pointer away leaves it hidden (`tooltip.spec.js:35-57`); hover then Escape hides it with the pointer still over the Trigger (A11Y-2, L4); moving off and back shows it again; Tab, Escape, and Tab back, likewise.
- Hover with focus elsewhere: focus a control outside the tooltip, rest the pointer on the Trigger, press Escape; the Bubble is hidden and focus has not moved ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 215). With focus in a text input, the input keeps its own Escape behaviour (its `keydown` is not cancelled).
- Both at once: focus the Trigger by Tab, hover it, press Escape, move the pointer off; the Bubble stays hidden while focus stays; Tab away and back shows it.
- `tooltip--in-dialog`: in each engine, the first Escape with focus on the Trigger leaves the dialog open and the Bubble hidden; the second closes the dialog ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 216, recorded per engine).
- Placement and geometry, where anchor positioning is supported: the Bubble above its Trigger by default and beside it for `end`, after Yeti's test (`tooltip.spec.js:59-69`); in `tooltip--rtl`, `start` puts the Bubble on the Trigger's right. Where it is not supported, records that every Bubble sits above its Trigger.
- Reflow: a 320 px viewport with a tooltip whose Trigger is at the inline end; asserts `document.documentElement.scrollWidth` is at most the viewport width at rest and with the Bubble shown, where anchor positioning is supported; records the same where it is not, and in the floor job's Chromium 141 run ([ticket 93](../issues/93-decide-testing-at-the-browser-floor.md); [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 220).
- A Tab past a hovered Trigger onto its neighbour: records whether the shown Bubble covers the newly focused control, and that Escape then hides it.
- Under `emulateMedia({ reducedMotion: 'reduce' })`, the Bubble is visible within one frame of the hover. Under `emulateMedia({ forcedColors: 'active' })` (Chromium and Firefox; Playwright does not emulate it in WebKit, ticket 17), the shown Bubble's text contrast at least 4.5:1 on its computed background, its computed border and a screenshot recorded ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 221).

Fixture-app half, built with `outputMode: 'server'`, with a `/tooltip` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). The route renders section 8's markup, a tooltip with a static Trigger `aria-describedby`, a tooltip inside `@defer (hydrate on interaction)`, one inside `@defer (hydrate never)`, and one inside a client-only `@defer`:

- hydration logs no `NG05xx`, `componentsSkippedHydration === 0`, and the Bubbles' ids and the Triggers' `aria-describedby`, the merged one included, are unchanged by hydration;
- with JavaScript disabled: hover and Tab show the Bubble, Escape does not hide it (Yeti's gap, as stated in section 10), and `@axe-core/playwright` with the six tags reports no violation with a Bubble shown;
- with `main.js` held back: Tab to a Trigger, press Escape, release the bundle; after hydration the Bubble carries `hidden` while focus is still on the Trigger (ADR 0043's replay note, measured here). Then the same with focus moved away before release: no `hidden` after hydration;
- the `hydrate on interaction` tooltip: Tab to its Trigger and press Escape; the block hydrates, and the replayed `keydown` hides the Bubble;
- the `hydrate never` tooltip shows on hover and focus, ignores Escape, and keeps its link after every live tooltip leaves the page (ADR 0045);
- the client-only `@defer` tooltip with `tooltip` in the preload list shows no frame with the Bubble's text inline;
- navigating to a route without a tooltip removes the link, and back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically). It matters more here than for most items, because the floor uses Yeti's fallback placement in all three engines (section 7, 1.4.10).

Prior art: Yeti's `example.html` and `docs.md` for the stories, and `test/browser/components/tooltip.spec.js` with its fixture `test/browser/fixtures/components/tooltip.html` for the show, hide, click, placement, caret, clipping, and axe cases; Yeti's `test/browser/contrast.spec.js` for the Bubble's contrast; ticket 17's `tip.mjs` for hover, focus, and Escape in three engines; ticket 18's fixture app for replay; the [dropdown](dropdown.md) spec's layer-4 shape for a listener that adds to Yeti's CSS-and-platform behaviour; the [field](field.md) spec's `aria-describedby` merge cases.

## Out of Scope

- A popover-based or overlay-based tooltip, `popover="hint"`, `interestfor`, CDK Overlay, or a measured placement (ADR 0016 and ADR 0043, considered options; building-blocks 1.2, 1.8).
- `AriaDescriber`, `FocusMonitor`, and Aria (ADR 0043 point 4; Aria has no tooltip pattern).
- Show and hide delays, touch gestures, a message input, a `disabled` input, and a positioning-at-origin option, Material's options with no Yeti counterpart (building-blocks 1.4, "Removed options"; P14).
- An open model, `opened` and `closed` outputs, and `show()`, `hide()`, or `toggle()` methods: the records give the tooltip none (Part 2 row 42), and the cross-item open-state decision forbids the methods (ticket 50).
- Interactive content in the Bubble, or a "toggletip" opened by a click: that is a dialog or a dropdown (manifest `a11y.notes`; APG `tooltip-pattern.html:31-32`).
- Merging the tooltip's description into a field control's `aria-describedby` (usage rule 7; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 219).
- Package CSS for the fallback's reflow or for forced colours (P16; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 17, 26, 30, 78, 220, and 221).
- Checks that a tooltip has two children, a focusable Trigger with a name, or no interactive Bubble content: a later milestone (map, Milestones); the usage rules state them.

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Three directives: `YetiTooltip` (root), `YetiTooltipTrigger`, `YetiTooltipBubble` | building-blocks Part 2 row 42; 1.3 |
| Showing, hiding, placement, and the caret are Yeti's CSS; no popover, no positioner | ADR 0016 point 3 and considered options; Part 2 row 42; P16; building-blocks 1.8 |
| Escape without a modifier sets `dismissed`, rendered as the Bubble's `hidden` through Yeti's `[hidden]` rule | ADR 0016 point 3; ADR 0043 point 2; A11Y-2; building-blocks 1.10 |
| The Escape handlers act only while the Bubble is shown | ADR 0016 point 3 ("while its trigger stays hovered or focused"); Material's predicate |
| A `document:keydown` listener for the hover case | this spec's reading of 1.4.13 and A11Y-2 (ticket 50 decision 215) |
| `preventDefault()` on a dismissing Escape in the focus case | building-blocks 1.5; Material parity; against ADR 0043's consequence (ticket 50 decision 216; ADR 0043 dated note) |
| `dismissed` resets once neither hover nor keyboard focus remains | ADR 0043 point 2's listeners; ADR 0016 point 3 (ticket 50 decision 217) |
| `aria-describedby` merges the consumer's ids with the Bubble's id | ticket 50 decision 46; ADR 0013 point 2 |
| The Bubble's id generated by the Bubble's directive; the consumer's id wins | ADR 0003 point 5; ADR 0044; ticket 50 decision 5 |
| `role="tooltip"` a static host attribute of the Bubble's directive | Part 2 row 42; ADR 0003 (ticket 50 decision 218) |
| No `yetiTooltipTrigger` on a `yetiFieldControl` | building-blocks 1.4 (one owner per attribute); Part 2 row 42 (ticket 50 decision 219) |
| Input `placement: YetiPlacement`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2; ticket 26 row 159 |
| No model, no outputs, no methods | Part 2 row 42; events rule 4; cross-item open-state decision (ticket 50) |
| Only the root marks its host and acquires the item file, last in its constructor | ADR 0045; ticket 50 decisions 6, 42, and 45 |
| No `AriaDescriber`, `FocusMonitor`, or Aria | ADR 0043 point 4; building-blocks 1.2 |
| Native platform, level 1 | building-blocks 1.2; Part 2 row 42 |
| Tokens are the consumer's | ADR 0004 |
| Directive tests through `TestBed.createDirective`; fixture app with prerendered and server routes | map, Standing rulings, Directive testing; ADR 0014 note; ticket 50 decision 2 |

### Usage examples

An icon-only action with a hint, in a toolbar row:

```html
<div yetiCluster gap="xs">
  <span yetiTooltip>
    <button yetiButton yetiTooltipTrigger type="button" emphasis="low" aria-label="Archive" i18n-aria-label (click)="archive()">
      <svg aria-hidden="true" focusable="false">...</svg>
    </button>
    <span yetiTooltipBubble i18n>Moves it out of your inbox</span>
  </span>
  <span yetiTooltip placement="bottom" #print="yetiTooltip">
    <button yetiButton yetiTooltipTrigger type="button" emphasis="low" aria-label="Print" i18n-aria-label (click)="print()">
      <svg aria-hidden="true" focusable="false">...</svg>
    </button>
    <span yetiTooltipBubble i18n>Prints the page</span>
  </span>
</div>
```

```ts
import { YetiButton } from 'ngx-yeti/button';
import { YetiCluster } from 'ngx-yeti/cluster';
import { YetiTooltip, YetiTooltipBubble, YetiTooltipTrigger } from 'ngx-yeti/tooltip';

@Component({
  selector: 'app-row-actions',
  imports: [YetiButton, YetiCluster, YetiTooltip, YetiTooltipBubble, YetiTooltipTrigger],
  templateUrl: './row-actions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RowActions {
  archive(): void { /* ... */ }
  print(): void { /* ... */ }
}
```

A hint on a term inside a sentence, with the Bubble on the inline end, where the same explanation is also in the glossary the term links to (usage rule 5):

```html
<p i18n>
  Rates follow the
  <span yetiTooltip placement="end">
    <a yetiTooltipTrigger routerLink="/glossary" fragment="base-rate">base rate</a>
    <span yetiTooltipBubble>Set by the central bank each quarter</span>
  </span>
  unless your contract says otherwise.
</p>
```

Keeping an existing description: `<button yetiTooltipTrigger type="button" aria-describedby="limits-note">` gives `aria-describedby="limits-note ngx-yeti-tooltip-<n>"`. Moving the Bubble from a signal: `<span yetiTooltip [placement]="side()">` with `side = signal<YetiPlacement>('top')`. A page whose tooltips render inside a client-only `@defer` block preloads the file: `provideYetiStyles({ preload: ['tooltip'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/tooltip/tooltip.css`, loaded by `YetiTooltip` as a counted link (section 13). The consumer writes nothing for the item beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `[hidden] { display: none !important; }` (`Y/src/base/reset.css:75-77`), which is how a dismissed Bubble hides; the tokens (the text and surface colours the tooltip's tokens default to, `--yeti-radius-sm`, `--yeti-text-sm`, the spacing, `--yeti-duration-fast` and its reduced-motion value, `--yeti-ease`); the base focus ring on the Trigger. The tooltip file needs no rule of `layouts/attributes.css` ([research/yeti-styles-and-lazy-loading.md](../research/yeti-styles-and-lazy-loading.md), finding B). `[data-sticky]`'s `z-index: 2` sits above the level a tooltip takes, by Yeti's design (`Y/src/layouts/attributes.css:333-342`).
3. **Cross-item rules:** none read by the tooltip; `button.css` styles a Trigger that carries `yetiButton`. The `overlay` layout's docs send anything needing dismissal to the dialog or the tooltip (`Y/src/layouts/overlay/manifest.json:65`); nothing in either file reads the other.
4. **Tokens:** reads the manifest's public tokens through Yeti's CSS; the package reads and writes none (section 2).
5. **What breaks without the item file:** the Bubble is never hidden: its text shows inline after the Trigger, unstyled, at all times, and Escape's `hidden` then hides a visible element instead of a hint; with no error (read from `tooltip.css`, inferred).
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) found only `container`, `grid`, and `table` (and the attribute name `hidden`) among Yeti's class names producing a utility (measured); `tooltip` produced none. Tailwind's `hidden` utility is a class, not the `hidden` attribute this item binds.

### Platform features to adopt when the browser target moves

- **Anchor positioning** is already used through Yeti's `@supports` guard; when the target covers the keys Yeti guards on, the fallback's placement and reflow limits (section 7, 1.4.10) stop applying and nothing changes in the package (building-blocks 1.2; P16).
- **`popover="hint"` with `interestfor`:** the platform's own tooltip, with light dismiss and close requests (ticket 17, 4.21). It would replace the Escape listeners and the `hidden` binding, but only if Yeti moves its tooltip onto it; Yeti rejected `popover` for a tooltip that needs no script (`tooltip.css:1-5`), so this waits for Yeti, not only for the target (ADR 0016, considered options).

### Single-page-application pieces relied on

[generated-ids](generated-ids.md) (`injectYetiId`), [events](events.md) (rule 4: no output without a Module), [setup](setup.md) (`injectYetiItemStyles`, `provideYetiStyles`, and `provideYetiFragmentLinks()` for a bare fragment link used as a Trigger), and [fragment-links](fragment-links.md) for those links.
