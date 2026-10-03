# Spec: alert (component item)

Ticket: [73. Spec: alert (component)](../issues/73-spec-alert.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [building-blocks.md](../building-blocks.md) Part 2 row 23 and Part 1 (1.3, 1.4, 1.6, 1.9, 1.10, 1.11, 1.13, 1.15), [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 87 to 89 and grilling question 8, [Decide: the spec list](../issues/11-decide-spec-list.md) row 23, [Decide: the building-blocks map for every ngx-yeti item](../issues/25-decide-building-blocks-map.md) grilling question 15, [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) (decisions 2, 3, 6, 8, 10, 18, 22, and 42), the shared [events](events.md) spec, [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0010](../adr/0010-animation-is-yetis-css-with-class-form-enter-and-leave.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0043](../adr/0043-light-dismiss-additions-are-host-listeners-not-cdk-services.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). The item owns no [ledger.md](../ledger.md) row (Part 2 row 23: "none (like-for-like; ADR 0040)"). `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x); `APG/` is `github.com/w3c/aria-practices/` at `3f094fd`. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 100 to 106), and each is cited where it applies.

## Problem Statement

Yeti's `alert` is "Something the reader should know now: the form was saved, the trial ends on Friday, the address did not validate. One message, one hue, in the flow of the page where it applies" (`Y/src/components/alert/docs.md`). It is one **Identity class**, `alert`, on a flex row holding an optional icon, the message, and an optional close button. Two **Attributes** configure it: `data-variant` (the hue) and `data-emphasis` (a tint, a fill, or the border alone). One **Marker**, `data-close`, names the close button. The author writes the live role: `role="status"` for the usual notice, `role="alert"` only for something urgent.

The close button does nothing on its own. Yeti's optional **Module** `alert.js` listens on the document: a click on `.alert > [data-close]` fades the alert with the Web Animations API over `--yeti-duration-fast`, dispatches the **Event** `yeti:close` on the alert while it is still in the page, removes the element, and, if focus was inside the alert, moves focus to the alert's parent with a temporary `tabindex="-1"` (`Y/src/components/alert/alert.js:3-31`).

An Angular developer who uses that markup and Module directly meets four measured or read problems:

- `alert.js` removes a node that Angular's view owns. Ticket 18 measured no error, and toggling the `@if` brings the alert back, but Angular's view no longer decides when its own element leaves ([Research: Yeti's JavaScript modules and what Angular adds](../issues/03-research-yeti-javascript-and-angular.md) section 6; [Prototype: Yeti under SSR, hydration, `@defer`, event replay, and `animate.enter` and `animate.leave`](../issues/18-prototype-yeti-rendering-modes.md)).
- A template cannot bind `(yeti:close)`: the compiler rejects the colon-named event ([Research: binding Yeti's `yeti:*` events in Angular templates](../issues/16-research-yeti-events-in-angular-templates.md), measured), so the developer has no typed way to learn that the reader dismissed the alert.
- In a production build the fade lasts 0.15 ms, not 150 ms. Angular's production CSS writes `--yeti-duration-fast: 150ms` as `.15s`, and `alert.js:12` passes `parseFloat` of it to `animate()` as milliseconds ([upstream-bugs.md](../upstream-bugs.md) Y1, measured in ticket 18).
- The developer would write `class="alert"`, `data-variant`, `data-emphasis`, and `data-close` by hand, untyped, which the package's contract forbids ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md)).

## Solution

Two directives on the consumer's own markup, after Yeti's example ([building-blocks.md](../building-blocks.md) Part 2 row 23):

- `[yetiAlert]` (`YetiAlert`), the **Item directive**, on the alert's element. It binds the class `alert`, sets `data-variant` and `data-emphasis` from typed inputs, loads the `alert` **Item file**, and declares the `closed` output that replaces `yeti:close`.
- `button[yetiAlertClose]` (`YetiAlertClose`), a **Part directive**, on the close button. It binds the static marker `data-close` and owns the close: on a click it moves focus to the alert's parent, as `alert.js:24-29` does, and the alert emits `closed`.

The consumer removes the alert with its own `@if` (or `@for`) in response to `(closed)`, and writes a class-form `animate.leave` on the alert so that it fades over Yeti's duration token before Angular removes it ([ADR 0010](../adr/0010-animation-is-yetis-css-with-class-form-enter-and-leave.md) point 2; building-blocks 1.6 rule 2). The live role stays the consumer's static attribute; the package adds no live region and no `LiveAnnouncer` (Part 2 row 23; [ADR 0043](../adr/0043-light-dismiss-additions-are-host-listeners-not-cdk-services.md) point 4). No Module is loaded ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md)).

```html
@if (saved()) {
  <div yetiAlert variant="success" role="status" animate.leave="leaving" (closed)="saved.set(false)">
    <svg aria-hidden="true" viewBox="0 0 16 16">...</svg>
    <div i18n><strong>Saved.</strong> Your changes are live.</div>
    <button type="button" yetiAlertClose aria-label="Dismiss" i18n-aria-label>×</button>
  </div>
}
```

## User Stories

1. As an application developer, I want to write `yetiAlert` on a `div`, so that it renders Yeti's alert without my writing `class="alert"`.
2. As an application developer, I want a `variant` input typed by Yeti's `variant` vocabulary, so that a misspelt hue fails to compile.
3. As an application developer, I want `variant="danger"` and `variant="alert"` to give the same hue, as Yeti documents, so that I can name the urgent hue without repeating the item's name.
4. As an application developer, I want an `emphasis` input typed `high`, `medium`, or `low`, so that I choose a solid fill, a tint, or the border alone.
5. As an application developer, I want an unset `variant` and `emphasis` to render no attribute, so that Yeti's own defaults (`primary`, `medium`) apply from its CSS.
6. As an application developer, I want to write `variant` and `emphasis` statically or bind them, so that a fixed alert and a state-driven alert are written the same way.
7. As an application developer, I want to write the role myself, `role="status"` or `role="alert"`, so that I decide whether a message interrupts.
8. As a screen reader user, I want a notice that appears after an action to be announced politely, so that I hear "Saved" without losing my place.
9. As a screen reader user, I want only urgent messages to interrupt me, so that routine notices do not cut off what I am reading.
10. As a screen reader user, I want an alert that was already on the page when it loaded to stay silent, so that a page does not shout its banners at me on arrival.
11. As a colour-blind reader, I want the words of the alert to say what kind of message it is, so that I do not depend on the hue.
12. As a low-vision reader, I want the message text to reach 4.5:1 against the alert's background at every emphasis and in light and dark schemes, so that I can read it.
13. As an application developer, I want an icon written as the alert's first child to be sized to the first line of text and coloured with the hue, so that I add no CSS for it.
14. As an application developer, I want `yetiAlertClose` on a `button`, so that it becomes Yeti's close button without my writing `data-close`.
15. As an application developer, I want a `(closed)` output on the alert, so that I know when the reader dismissed it and can remove it with my own `@if`.
16. As an application developer, I want `(closed)` to carry nothing, so that the binding is as simple as Yeti's `yeti:close`.
17. As an application developer, I want the alert's removal to stay in my template, so that Angular's view, not a script, decides when the element leaves.
18. As an application developer, I want a class-form `animate.leave` on the alert to fade it over Yeti's fast duration, so that dismissal looks as Yeti's module made it look.
19. As an application developer, I want the fade to last its real duration in a production build, so that the minified-token bug of `alert.js` does not reach my users.
20. As a reader who has asked for less motion, I want a dismissed alert to leave at once, so that I see no fade.
21. As a keyboard user, I want to reach the close button with Tab and dismiss the alert with Enter or Space, so that I need no pointer.
22. As a keyboard user, I want focus to move to where the alert was after I dismiss it, so that I keep my place instead of starting again at the top of the page.
23. As a keyboard user, I want the temporary `tabindex` that holds my focus there to go away once I move on, so that the alert's container does not stay focusable.
24. As an application developer whose alert sits in a container with its own `tabindex` (a focus trap, a scrollable region), I want that `tabindex` left untouched, so that the container keeps working.
25. As a pointer user in Safari, where a clicked button does not take focus, I want dismissal to leave focus where it was, so that clicking does not move my focus unexpectedly.
26. As a screen reader user, I want the close button to have a name I can hear, so that I know what it does.
27. As a touch user, I want the close button to be at least 24 by 24 CSS pixels, so that I can hit it.
28. As a keyboard user, I want a visible focus ring on the close button, so that I see where I am.
29. As an application developer, I want the close button to keep the alert no taller than its text, so that a dismissible alert lines up with one that is not.
30. As an application developer, I want no alert to dismiss itself on a timer, so that readers have the time they need.
31. As an application developer rendering on the server, I want the alert's class, attributes, and marker in the server HTML, so that it is styled at first paint and with JavaScript off.
32. As a reader of a server-rendered page who clicks the close button before the application hydrates, I want the click to take effect once it hydrates, so that my click is not lost.
33. As an application developer, I want the documentation to say that the close button does nothing with JavaScript off and inside a `hydrate never` block, so that I know what is lost.
34. As an application developer, I want the alert's styles to load with its first instance and leave after its last, including while it fades out, so that I pay for them only on pages that show an alert and see no unstyled frame while it leaves.
35. As an application developer with an alert inside a client-only `@defer` block, I want to preload its item file, so that its first frame is styled.
36. As an application developer using `i18n`, I want the message and the close button's label to be translatable and to hydrate under `withI18nSupport()`, so that a localised page is not re-rendered.
37. As an application developer on zoneless change detection, I want `(closed)` to update my view, so that removal works without zone.js.
38. As an application developer, I want a list of notices rendered with `@for` to remove each notice the reader closes, so that I can show several alerts at once.
39. As an application developer, I want a template reference `#a="yetiAlert"`, so that I can reach the directive from my template.
40. As an application developer, I want each directive's `exportAs`, so that a forgotten import shows up as a compile error wherever I use the reference.
41. As an application developer, I want the documentation to say which of my attributes the directives bind, so that I do not write a static one that hydration writes back.
42. As an application developer, I want the documentation to say where the close button goes (last, a direct child, a plain `button` with `type="button"`), so that Yeti's CSS places it.
43. As an application developer, I want the documentation to say where to write `animate.leave` (on the alert element, in the template whose `@if` removes it), so that the fade runs.
44. As an application developer, I want the documentation to give the one CSS rule my leave class needs, built on Yeti's duration token, so that I write no duration of my own.
45. As an application developer, I want no `yeti:close` DOM event dispatched by the package, so that a page does not hear two notifications for one dismissal.
46. As an application developer, I want a dismissed alert's `closed` to fire once per dismissal, so that my handler is not run twice.
47. As an application developer writing tests, I want the alert's behaviour asserted on the DOM (class, attributes, focus, removal), so that the tests follow what a reader sees.
48. As an implementer, I want every behaviour of `alert.js` listed as kept, changed, or removed, so that the replacement can be checked against the pinned commit.
49. As an implementer, I want the contract check to fail when a pin move adds an attribute, a value, or a marker to the alert, so that the package's types follow Yeti.
50. As an application developer, I want the alert to keep its look beside Tailwind v4, so that I can use both.
51. As an application developer, I want to theme the alert's radius, padding, edge width, and hues through Yeti's tokens in my own stylesheet, so that the package needs no theming input.
52. As a right-to-left reader, I want the thick edge on the inline start and the close button at the inline end, so that the alert mirrors with the page.
53. As an application developer, I want an alert in my persistent shell to stay put across route changes, so that a notice I have not dismissed does not vanish when I navigate.
54. As an application developer, I want the alert root and its close button in one hydration boundary in the documentation's examples, so that the close works as soon as the alert hydrates.

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/alert/manifest.json`, `alert.css`, `alert.js`, `docs.md`, and `example.html`, in `Y/src/layouts/attributes.css`, `Y/src/tokens/`, `Y/schema/vocabulary.json`, and in Yeti's own test `Y/test/browser/components/alert.spec.js` with its fixture:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `alert`, `component`, `Feedback` |
| `class` | `alert` |
| `attributes` | `data-variant`: enum, vocabulary `variant` (`primary`, `secondary`, `success`, `warning`, `alert`, `danger`, `neutral`, `black`, `white`), default `primary`: "Which hue: success for done, warning for careful, danger for wrong (alert is the same ... under its Foundation 6 name), primary for news." `data-emphasis`: enum, vocabulary `emphasis` (`high`, `medium`, `low`), default `medium`: "How loud: medium is a tint, high a solid fill, low the border alone." |
| `classes` | empty |
| `children` | `> svg` (0 to 1): "An icon, first, sized to the text." `> [data-close]` (0 to 1): "A button, last, that removes the alert when alert.js is loaded." `> *` (1 or more): "The message, in any element." |
| `markers` | `data-close`: boolean, `on: "> button"`: "The close button; removes the alert when alert.js is loaded." |
| `tokens` | public: `--yeti-alert-radius`, `--yeti-alert-padding`, `--yeti-alert-edge` (undeclared; "falls back to four times the local --yeti-border-width"), `--yeti-control-size`, `--yeti-border-width`, `--yeti-space-sm`, `--yeti-color-text`, `--yeti-color-primary` and its `-subtle`, `-soft`, `-strong`, `-text` stops, `--yeti-on-primary`, `--yeti-duration-fast` ("How long the alert takes to fade out when alert.js dismisses it"); private: `--_yeti-variant` and its five companions |
| `a11y` | `requiredAttributes` empty; `keyboard`: "Enter / Space: On the close button, removes the alert."; notes: role `status` for the usual notice, `alert` only for something urgent; content present at page load is not announced by either role; meaning carried by the colour must also be in the words; the close button needs a name; without the Module the button does nothing |
| `js` | `alert.js`, optional; event `yeti:close`: "Dispatched on the .alert after the fade and before it is removed, while it is still in the page." |
| `support` | `unguarded`: `lh unit`, `color-mix()`; `guarded`: empty |
| `since` | `7.0.0` |

How it looks, in `@layer yeti.components` (`alert.css`): `.alert` is a flex row with `align-items: flex-start` and a `--yeti-space-sm` gap, padded by `--yeti-alert-padding`, with a `--yeti-border-width` border in the hue and an inline-start border of `--yeti-alert-edge`, by default four times the local border width. `medium` is the base look (a `--_yeti-variant-subtle` tint); `[data-emphasis="high"]` fills the box with the hue and sets the text to `--_yeti-on-variant`; `[data-emphasis="low"]` makes the background transparent. `.alert:not([data-variant])` supplies the `primary` stops. Every child loses its margins, and every child except an `svg` and the close button takes `flex: 1`. The icon is `1.25em` square, centred on the first line by `1lh`, in `--_yeti-variant-text` (inherited at `high`). The close button is reset (`appearance: none`, no border or background), `--yeti-control-size` square (`2.5rem` by default, `Y/src/tokens/surface.css:19`), pulled into the first line's height, pushed to the inline end with `margin-inline-start: auto`, and shows a 12 % `currentColor` background on hover. The hue's stops for a set `data-variant` come from the **Always-loaded group**: `[data-variant="..."]` rules in `layouts/attributes.css:237-254`, where `danger` maps to the `alert` stops "so an alert that is an alert does not read data-variant=\"alert\"" (`:244-246`).

What the Module does (`alert.js`, 31 lines): one delegated `click` listener on `document`. It returns if the event's default was prevented ("The page's own listener ran first and asked for nothing to happen", `:5-6`) or the target is not inside `.alert > [data-close]` (`:7-8`). It records whether focus is inside the alert (`:11`), reads `--yeti-duration-fast` with `parseFloat` (`:12`), fades opacity from 1 to 0 with `Element.animate` (`:13`), and when the animation finishes dispatches `yeti:close` (`bubbles`, `composed`, not cancelable, no `detail`) on the alert while it is still connected (`:14-17`), removes it (`:18`), and, if focus had been inside, gives the parent `tabindex="-1"` when it has no `tabindex` of its own, focuses it with `preventScroll`, and removes the attribute on the parent's next `blur` if it added it (`:19-29`).

Yeti's own tests at the Pin assert: the three emphases' backgrounds; the start edge at four border widths and its token; the icon's size and colour; that the close button does not make the alert taller; that the Module removes the alert and that without it nothing happens; axe clean; that closing with the keyboard leaves focus off `body`; that a parent's own `tabindex` survives; that `yeti:close` reaches `document` from the connected alert with `bubbles`, `composed`, no `cancelable`, and `detail` `null`; and that `danger` and `alert` paint the same border (`Y/test/browser/components/alert.spec.js`).

Attributes left to the consumer: `role` on the alert, and `aria-label` and `type` on the close button (ADR 0003 point 3 and its consequence on "ARIA the markup must carry"; building-blocks 1.10, Names). Ticket 26 rows 87 and 88 give `variant` and `emphasis` "the consumer's binding only" as their pre-hydration source, and row 89 gives `data-close` "never".

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `alert` | static host class on `[yetiAlert]` (`YetiAlert`) | always | ADR 0003 point 1; Part 2 row 23 |
| Attribute `data-variant` | the hue | input `variant` on `yetiAlert`: `YetiVariant \| undefined`, bound `[attr.data-variant]`, `null` when unset | unset renders nothing; Yeti's `primary` applies through `.alert:not([data-variant])`. `variant` is not an HTML attribute | ticket 26 row 87 (R) |
| Attribute `data-emphasis` | how loud | input `emphasis` on `yetiAlert`: `YetiEmphasis \| undefined`, bound `[attr.data-emphasis]`, `null` when unset | unset renders nothing; Yeti's `medium` is the base rule. `emphasis` is not an HTML attribute | ticket 26 row 88 (R) |
| Marker `data-close` (on `> button`) | the close button | static host attribute `data-close=""` on `button[yetiAlertClose]` (`YetiAlertClose`); no input | always present on the part | ticket 26 row 89 (P) and grilling question 8; ADR 0070 kind P |
| Child `> svg` | the icon, first | no directive; the consumer's `svg` | not applicable | building-blocks 1.1 (a child styled only by element and position gets no directive) |
| Child `> *` | the message | no directive | not applicable | building-blocks 1.1 |
| Event `yeti:close` | on the `.alert`, after the fade, before removal | output `closed` on `YetiAlert`, `void`; emitted when the close button is activated, after the focus move and before the consumer's removal and its leave transition ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 100) | not applicable | [events](events.md) section 2; Part 2 row 23 |
| `role` on the alert | the author's (`status` or `alert`) | the consumer's static attribute; no input | not applicable | ADR 0003 point 3; Part 2 row 23 |
| `aria-label` on the close button | "The close button needs a name" | the consumer's | not applicable | building-blocks 1.10, Names |
| Token `--yeti-duration-fast` | the Module's fade | read by the consumer's leave class (section 9); the package reads and writes none | not applicable | ADR 0004; ADR 0010 point 2 |
| Tokens `--yeti-alert-radius`, `--yeti-alert-padding`, `--yeti-alert-edge`, `--yeti-control-size`, `--yeti-border-width`, `--yeti-space-sm`, `--yeti-color-text`, `--yeti-color-<hue>` and stops, `--yeti-on-<hue>` | the look | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--_yeti-variant` and companions | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-alert=""` on `[yetiAlert]` only | always present | ADR 0045; ADR 0060 point 2; ticket 50 decision 6 |
| Injection token | not Yeti's | `yetiAlertToken`, provided by `YetiAlert` | not applicable | building-blocks 1.3 and 1.9 |

The input value types are Yeti's own `YetiVariant` and `YetiEmphasis`, from the package's generated `yeti-types.ts`, re-exported by name and never redeclared (ADR 0080 point 5; ADR 0060 point 10). Each is the whole vocabulary, so no `Extract` is needed: the manifest names the vocabulary with no narrower `values` list. Shared vocabularies (building-blocks 1.4): `variant` is `YetiVariant` on all eleven items that read it, and `emphasis` is `YetiEmphasis` on `alert`, `badge`, and `button` (`Y/src/guides/components.md:37`, `:71`), so no two package directives on one element declare either name with different types.

`YetiAlertClose` sets no presence attribute and acquires no item file. Only an item's root directive does: Yeti's rule for the close button is `.alert > [data-close]`, which applies only under the root's class, and the root's presence attribute keeps the file loaded (ticket 50 decision 6).

**Module replaced** (`alert.js`, [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 23: "the delegated click, the `Element.animate` fade (Y1), the `yeti:close` event, the removal, the focus move"):

| `alert.js` behaviour | Lines | Fate | In the package |
| --- | --- | --- | --- |
| One delegated `click` listener on `document`, for alerts added at any time | `:4`, `:7` | changed | a `click` host listener on each `button[yetiAlertClose]`; it exists only where the directive is, works on any Angular-rendered alert in any rendering mode, and goes with its host (building-blocks 1.15) |
| Does nothing when the click's default was already prevented | `:5-6` | kept | the handler returns when `event.defaultPrevented` is true ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 103) |
| Finds the alert as the button's parent | `:9` | changed | the part reaches its alert through `yetiAlertToken` (building-blocks 1.9) |
| Records whether focus is inside the alert | `:11` | kept | read in the handler from the document's active element, before anything changes |
| Reads `--yeti-duration-fast` with `parseFloat`; fades with `Element.animate` | `:12-13` | removed | the fade is the consumer's class-form `animate.leave`, whose CSS rule reads the token in CSS, so no script parses it (ADR 0010 point 2 and consequences; building-blocks 1.6 rule 2; architecture-guide P19). Y1 cannot occur |
| Dispatches `yeti:close` on the connected alert | `:14-17` | changed | the `closed` output, `void`, on `YetiAlert`; no DOM event is dispatched (events spec rule 1; ADR 0040 consequences). It is emitted on the click, not after a fade, because the fade now follows the consumer's removal ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 100) |
| Removes the alert | `:18` | changed | the consumer's `@if` or `@for` removes it in response to `closed`; Angular's view stays in charge of its element (Part 2 row 23) |
| Moves focus to the parent, with a temporary `tabindex="-1"` only when the parent has none, `preventScroll`, and removes it on the parent's next `blur` | `:19-29` | kept, earlier | done in the click handler before `closed` is emitted, rather than after the removal, because the directive is destroyed with the alert (Part 2 row 23). The parent's one-shot `blur` listener outlives the directive ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 102) |
| Safe on a page with no alert | `:2` | kept | nothing runs where no directive is |

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The alert reads `--yeti-alert-radius` (`var(--yeti-radius-md)`) and `--yeti-alert-padding` (`var(--yeti-space-md)`, `Y/src/tokens/components.css:47-48`), `--yeti-alert-edge` (undeclared, read with the four-border-width fallback), `--yeti-border-width`, `--yeti-space-sm`, `--yeti-control-size`, `--yeti-color-text`, and the hue's stops through the private variant tokens. The consumer's leave class reads `--yeti-duration-fast` (and may read `--yeti-ease`), which collapses to `0.01ms` under `prefers-reduced-motion` (`Y/src/tokens/motion.css:5`, `:27`). The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block, in a **Theme** file after Yeti, or with a runtime `setProperty`; hues, chroma, and the scale only on `:root`, derived tokens such as `--yeti-alert-edge` on any element, including one alert (`Y/src/guides/theming.md:38`). **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- `YetiAlert` is a **Coordinating directive** in the narrow sense of building-blocks 1.9: it provides `yetiAlertToken` (`InjectionToken<YetiAlert>`, `useExisting`), declared with `import type` in the entry point's token file, and no part registers with it.
- `YetiAlertClose` injects `yetiAlertToken` as required, with no `optional` flag: building-blocks 1.9 makes a parent token required "when the part cannot exist alone", and a close button outside an alert has no alert to close and no Yeti rule to style it (`.alert > [data-close]`). Because DI follows the declaration site, the close button is declared in the same template as its alert host (usage rule 5); a close button projected into an Angular component that renders the alert fails to find the token and throws at creation.
- No host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix"), and no Aria pattern applies (section 6). The close button is not a `yetiButton`: Yeti styles it by `.alert > [data-close]` alone, and the `button` item's class would add a second look to it (usage rule 5).
- The only other injection is ADR 0060's root styles service, reached by `injectYetiItemStyles('alert')` from `ngx-yeti/styles` as the last statement of the constructor ([setup](setup.md); ticket 50 decisions 42 and 45), through which `YetiAlert` acquires and releases the item file. That service is the [setup](setup.md) spec's and ADR 0060's.
- Generated ids and the platform's relationship attributes: none. The alert renders no `id` and references none, so it does not use [generated-ids](generated-ids.md). The close button does not need `aria-controls`: it removes the alert rather than toggling it.

### 4. API

| Member | `YetiAlert` | `YetiAlertClose` |
| --- | --- | --- |
| Class name | not among the 46 names `yeti.d.ts` exports at the Pin, so it takes `Yeti` (ADR 0080 point 4; the orchestrator's list of 2026-10-03) | as left |
| Selector | `[yetiAlert]` (Part 2 row 23) | `button[yetiAlertClose]` (Part 2 row 23; manifest marker `on: "> button"`) |
| `exportAs` | `yetiAlert` | `yetiAlertClose` |
| Entry point | `ngx-yeti/alert` (building-blocks 1.3; ADR 0011 clause 10) | same |
| Inputs | `variant: YetiVariant \| undefined` (Yeti default `primary`); `emphasis: YetiEmphasis \| undefined` (`medium`); each `input()` with no default value | none |
| Outputs | `closed: void` (events spec; building-blocks 1.3) | none (building-blocks 1.4: the part detects the change and the root carries the output) |
| Models, methods | none ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 104) | none |
| Host | static `class: 'alert'`; static `data-ngx-yeti-item-alert: ''`; `[attr.data-variant]`, `[attr.data-emphasis]` from the inputs, `null` when unset | static `data-close: ''`; `(click)` listener |
| Providers | `yetiAlertToken` | none |
| Injection | the ADR 0060 styles service, through `injectYetiItemStyles('alert')` | `yetiAlertToken` (required); `DOCUMENT` |
| Lifecycle | acquires the `alert` item file, on the server too, with `injectYetiItemStyles('alert')` as the last statement of its constructor (ticket 50 decisions 42 and 45), after anything there that can throw (nothing does today), and releases it through `DestroyRef` (ADR 0060 point 2; ticket 50 decisions 18 and 42) | none |

The close handler, in order (Part 2 row 23; building-blocks 1.5 and 1.11 clause 5):

1. Return if `event.defaultPrevented` is true (`alert.js:6`, kept).
2. Read whether the document's active element is inside the alert's host element (`alert.js:11`).
3. If it is, and the alert's host has a parent element: if the parent has no `tabindex` attribute, set `tabindex="-1"` on it and add a one-shot `blur` listener on it that removes the attribute; then call `focus({ preventScroll: true })` on the parent (`alert.js:24-29`). These are imperative calls in a handler after hydration, as building-blocks 1.5 allows for `focus()`; the `tabindex` write is the one Part 2 row 23 decides.
4. Emit the alert's `closed`.

The handler calls no `preventDefault()`, so it is replay-safe as written (building-blocks 1.5, Keyboard; 1.11). It starts no timer and reads no layout. How the part makes the root emit is internal: the part calls the root's emitter through the token, and no public member is added for it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 104). `closed` is a signal-free notification; the consumer's handler writes its own signal, so the view refreshes zoneless (building-blocks 1.5; map, Standing rulings, item 43).

No input default differs from Yeti's (ADR 0070 rule 1). A static attribute type-checks as a string literal under `strictTemplates`, so `variant="success"` compiles and `variant="sucess"` does not (ADR 0070 rule 2; ticket 26 grilling question 14, read, not run).

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiAlert` on an element that holds flow content, a `div` as in Yeti's examples (or a `section` or `aside`), never a `p`, which cannot hold the message's `div`. Place it near the thing it describes (`Y/src/components/alert/docs.md`, Accessibility).
2. Write the role yourself: `role="status"` for the usual notice, `role="alert"` only for something urgent (manifest `a11y.notes`; ADR 0003 point 3). Neither role announces an alert that is in the page when it loads; the roles matter for alerts inserted later, with `@if` or `@for`. How reliably an alert inserted together with its role is announced is section 7's ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 105).
3. Say the kind of message in the words ("Saved.", "Payment failed."); the hue is decoration (manifest `a11y.notes`; WCAG 1.4.1; ADR 0015 point 4).
4. An icon is the alert's first child, a plain `svg` with `aria-hidden="true"` when the words already say what it shows (Yeti's example), with no item directive on it; `.alert > svg` sizes and colours it.
5. The close button is the alert's last direct child, a plain `<button type="button" yetiAlertClose aria-label="...">`, declared in the same template as its alert host (section 3), and not a `yetiButton`. `type="button"` keeps it from submitting a surrounding form; the directive does not bind `type`, as Yeti's markup leaves it to the author ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 106).
6. Write `yetiAlertClose` only on an alert you remove when `closed` fires. Without the removal the button moves focus and emits but the alert stays, as Yeti's docs say of a button without the Module ("leave it out").
7. Remove the alert with `@if` or `@for` in the template that declares it, and write `animate.leave` on the alert element itself in that template. Angular runs a child component's `animate.leave` only for elements in the removed element's own template, so a leave class written inside a child component that holds the alert does not run when a parent's `@if` removes that component (Angular's guide at `github.com/angular/angular/adev/src/content/guide/animations/enter-and-leave.md:60-68`, read). Use the class form only, never `(animate.leave)` (ADR 0010 point 2; `upstream-bugs.md` A1).
8. The leave class is yours: one rule in your stylesheet that ends at `opacity: 0` and transitions over `--yeti-duration-fast` (section 9; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 101).
9. Do not write `class="alert"`, `data-variant`, `data-emphasis`, `data-close`, or `data-ngx-yeti-item-alert` statically on either host. The directives bind them, and hydration writes a static attribute back before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"). A value newer than the Pin goes through `$any` (`[variant]="$any('info')"`, ADR 0070).
10. Bind `variant` and `emphasis` from values that are the same on the server and the client.
11. Keep the alert and its close button inside one **Hydration boundary**: a consumer `@defer` wraps the whole alert, never the close button alone (building-blocks 1.11 decision 6).
12. Do not dismiss an alert on a timer (APG alert pattern, `APG/content/patterns/alert/alert-pattern.html:32-34`; WCAG 2.2.1). Yeti never does, and the package offers none (Out of Scope).
13. Import `YetiAlert` and `YetiAlertClose` in every component whose template writes them. A **Forgotten import** of `YetiAlertClose` renders a plain button that takes `flex: 1` beside the message (`.alert > :not(svg, [data-close])`) and does nothing, with no error, because the directive has no input for the compiler to report; a template reference `#c="yetiAlertClose"` makes it NG8003 (building-blocks 1.9).

### 5. Material comparison

Material has no inline alert. The nearest is `MatSnackBar`, a toast opened from a service, which Yeti's docs exclude from this item ("For a message that arrives and leaves on its own, wait; that is not this").

| Aspect | ngx-yeti `alert` | Angular Material `MatSnackBar` |
| --- | --- | --- |
| Shape | an item directive and a part directive on the consumer's markup, in the flow of the page | a service that opens an Angular component in a floating container (`NC/src/material/snack-bar/snack-bar.ts:49`) |
| Announcement | the consumer's static `role="status"` or `role="alert"`, Yeti's documented form; no `LiveAnnouncer` (Part 2 row 23) | `politeness` in the config, default `'polite'` (`snack-bar-config.ts:26-27`); the container uses `aria-live` rather than a live role "because NVDA and JAWS have show inconsistent behavior with live roles" (`snack-bar-container.ts:127-128`) and moves the content into the live region after a timeout (`:357`) |
| Dismissal | `button[yetiAlertClose]` and the `closed` output; the consumer removes the alert | `dismiss()` and `afterDismissed()` on the ref (`snack-bar-ref.ts:62`, `:118`), `dismissWithAction()` (`:70`) |
| Auto-dismiss | none (APG alert pattern) | `duration`, default 0 (`snack-bar-config.ts:42`; `snack-bar-ref.ts:93`) |
| Focus after dismissal | to the alert's parent when focus was inside (Yeti's behaviour) | not moved by the snack bar (inferred from the ref's API; not traced) |
| `exportAs` | `yetiAlert`, `yetiAlertClose` | none: opened from code |

Nothing from Material's API is adopted. A `politeness` option would be an input per role, which the records leave to the consumer's attribute (ADR 0003 point 3), and Material's delayed live-region move is a workaround for content inserted with its live region, which section 7 answers with a usage rule and a manual release check rather than adopting ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 105). The comparison is recorded because building-blocks 1.14 item 5 asks every spec for one.

### 6. Implementation level and primitives

Native platform, level 1, plus Angular's `animate.leave` (Part 2 row 23; building-blocks 1.2). The reason, row 23's: "the fade was JavaScript-timed and misread the minified token; the class form reuses Yeti's own transition and keeps Angular's view in charge of removal". The button is a native `button`, so Enter and Space activate it with no key handler; the live roles are native ARIA the consumer writes; `focus()` and the `tabindex` attribute are platform calls.

No Aria pattern applies: Angular Aria has no alert or live-region directive, and the APG alert pattern has no keyboard interaction ("Not applicable", `APG/content/patterns/alert/alert-pattern.html:47-50`). CDK's `LiveAnnouncer` (`NC/src/cdk/a11y/live-announcer/live-announcer.ts:37`, `:95`) is not used: the live role is the consumer's static attribute, and an announcement from code would double it (Part 2 row 23; ticket 25 grilling question 15; ADR 0043 point 4). `FocusMonitor` and `InteractivityChecker` are not needed: the handler reads the active element once and focuses one element.

### 7. Accessibility (WCAG 2.2 AA), ARIA, and keyboard

- **APG pattern:** Alert (`APG/content/patterns/alert/alert-pattern.html`): role `alert` (`:52-55`); "it is crucial they do not affect keyboard focus" (`:28`), which concerns the alert's arrival; Yeti and the package move focus only after the reader's own dismissal, which the APG does not address ([Research: Yeti's JavaScript modules and what Angular adds](../issues/03-research-yeti-javascript-and-angular.md) section 2.1); "avoid designing alerts that disappear automatically" (`:32-34`). `role="status"` is the WAI-ARIA status role, the consumer's choice for the usual notice.
- **Roles and states:** the alert's role is the consumer's static attribute. Ticket 17 read the Chromium tree for Yeti's example as `status` with `live="polite"` and `atomic=true` ([Research: Yeti against WHATWG, WAI-ARIA, the APG, and Angular Aria, CDK, and Material patterns](../issues/17-research-yeti-accessibility-and-standards.md) section 4.3). The close button is a native `button`, named by the consumer's `aria-label`.
- **Keyboard:**

| Key | Where | Result |
| --- | --- | --- |
| Tab, Shift+Tab | page | reaches the close button in DOM order; nothing else in the alert is a tab stop unless the consumer's message holds a link |
| Enter, Space | close button | the native `click`: focus moves to the alert's parent, `closed` is emitted, and the consumer's removal follows (manifest `a11y.keyboard`) |

- **Focus:** after a keyboard dismissal focus is on the alert's parent, which takes `tabindex="-1"` only when it had none and loses it on its next `blur`. A parent's own `tabindex` is left as it is. Ticket 17 measured Yeti's version in three engines: Enter removed the alert and focus sat on the parent `main` with `tabindex="-1"` added (section 4.3). In WebKit a clicked button does not take focus, so a pointer dismissal moves no focus there, as in Yeti (read in `alert.js:11`; the WebKit fact from building-blocks 1.8).
- **Announcement on insertion:** the APG says "Dynamically rendered alerts are automatically announced by most screen readers" and that alerts present before page load completes are not (`APG/.../alert-pattern.html:24-25`). An alert inserted by `@if` carries its role from the moment it is inserted. That this is announced for `role="alert"` follows the APG; for `role="status"`, inserted with its content, Material's snack bar avoids live roles and delays its content because of inconsistent screen reader behaviour (section 5), so a polite announcement of an inserted `status` is not certain (inferred; not measured with a screen reader). The package's answer is a usage rule and a manual release check (ADR 0015 point 7), with no code ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 105).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | The message is the consumer's markup; the role is the consumer's (usage rule 2); the directives add no role. |
| 1.4.1 Use of Color | The words name the kind (usage rule 3; ADR 0015 point 4). Every story's text says it, and each play function asserts that the alert's text contains the story's kind word. |
| 1.4.3 Contrast (Minimum) | Each play function asserts at least 4.5:1 for the message text against the alert's painted background, with the exact WCAG formula on computed colours, for every variant and emphasis the story shows, in the light and dark schemes ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 8). Ticket 17 measured axe clean on Yeti's example, and Yeti's own contrast test covers the six fixture alerts it marks with `data-contrast` (`Y/test/browser/contrast.spec.js:29`, `:47`, read); the other pairs are not measured. A pair that fails gets a ledger row and one package rule in `@layer ngx-yeti` after the A11Y-10a pattern (decision 8), or a usage rule against that pair if the failure is the consumer's choice of hue on its own theme. |
| 1.4.11 Non-text Contrast | The close button has no border or background at rest, so its glyph is what identifies it; the play function asserts at least 3:1 between the glyph's colour and the alert's background. The hue border is decoration (the words carry the meaning), so it is not asserted. The focus ring is Yeti's base focus style; ticket 17 found a 2 px ring at every Tab stop (building-blocks 1.10). |
| 1.4.10 Reflow, 1.4.12 Text Spacing | The message takes `flex: 1` and wraps; the alert sets no height (read). Layer 4 asserts no horizontal overflow at a 320 px viewport. |
| 2.1.1 Keyboard | The close button is a native `button`. |
| 2.2.1 Timing Adjustable | No timer: the alert stays until the reader dismisses it (usage rule 12). |
| 2.4.3 Focus Order | After dismissal focus is on the parent, so the next Tab continues from where the alert was rather than from the top of the document. |
| 2.4.7 Focus Visible | Yeti's focus ring on the close button; the Story gate and layer 4 check it. A focused parent with `tabindex="-1"` shows the browser's focus style for a programmatically focused element (inferred, not measured). |
| 2.4.11 Focus Not Obscured (Minimum) | Focus lands on the alert's parent, which contained the alert the reader was looking at; `preventScroll` keeps the page still, as Yeti does. |
| 2.5.8 Target Size (Minimum) | The close button is `--yeti-control-size`, `2.5rem` by default. axe's `target-size` passed on Yeti's alert in Chromium (ticket 17). The play function asserts the button's box is at least 24 by 24 CSS pixels. |
| 4.1.2 Name, Role, Value | The close button's name is the consumer's `aria-label` (usage rule 5); the play function asserts a non-empty computed name. |
| 4.1.3 Status Messages | `role="status"` or `role="alert"` on the consumer's element, inserted with the message (usage rule 2; section 7, Announcement on insertion). |

**Ledger rows owned:** none ([ledger.md](../ledger.md); Part 2 row 23, "none (like-for-like; ADR 0040)"). The focus move and the parent's temporary `tabindex` are Yeti's own behaviour, kept; ADR 0040's consequences say a like-for-like replacement is not a ledger row. Forced colours: the alert's meaning is in its words, the close button's glyph is text in `currentColor`, and the focus ring remains; no package rule and no row, as for the `lift` and `box` items (ticket 50 decisions 26 and 30), with a layer-4 case that records the forced-colours rendering.

### 8. Rendered HTML

Consumer markup, after Yeti's example:

```html
@if (saved()) {
  <div yetiAlert variant="success" role="status" animate.leave="leaving" (closed)="saved.set(false)">
    <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" /></svg>
    <div i18n><strong>Saved.</strong> Your changes are live.</div>
    <button type="button" yetiAlertClose aria-label="Dismiss" i18n-aria-label>×</button>
  </div>
}
```

Server HTML and the hydrated DOM are the same. The alert carries `yetialert=""`, `variant="success"` (the static input attribute, matched by no rule), `role="status"`, `class="alert"`, `data-variant="success"`, `data-ngx-yeti-item-alert=""`, and no `data-emphasis`. The button carries `type="button"`, `yetialertclose=""`, `aria-label="Dismiss"`, and `data-close=""`, and no presence attribute. The server also writes the item link into `<head>` in Yeti's order: `rel="stylesheet"`, `href` `<url>components/alert/alert.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="alert"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided (ADR 0060 points 2, 3, and 5; `Y/src/yeti.css:52`, after `toc` and before `progress`). The client adopts the link at bootstrap. The button's `click` listener adds a `jsaction` attribute to the button in the server HTML for event replay (building-blocks 1.12, layer 3).

After a dismissal: the parent element carries `tabindex="-1"` if it had none and holds focus; the alert carries `class="alert leaving"` for the length of the transition and is then removed by Angular; the item link is removed in the animation frame after no `[data-ngx-yeti-item-alert]` host is connected (ADR 0060 point 4). After the parent's next `blur`, its `tabindex` is gone.

The delta from Yeti's docs markup: the consumer writes `yetiAlert` and input names where the docs write `class="alert"` and `data-*` names, `yetiAlertClose` where they write `data-close`, and adds `animate.leave` and `(closed)` with the `@if` that replace the Module's fade and removal.

### 9. Animation

- **No Yeti transition exists for the alert.** `alert.css` declares no `transition` and no keyframes, and Yeti ships no exit class: its only keyframes are the `enter`, `attention`, `progress`, and `spinner` ones (read by search over `Y/src/**/*.css`). The Module's fade was `Element.animate`, which the package does not use (ADR 0010; architecture-guide P19, Avoided: `element.animate()`).
- **The fade is the consumer's class-form `animate.leave`** on the alert element, removed by the consumer's `@if` or `@for` (Part 2 row 23; ADR 0010 point 2: "naming a Yeti class or a class whose rule reuses Yeti's tokens"). The class is the consumer's, named here `leaving` after architecture-guide P19's example, with one rule in the consumer's stylesheet ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 101):

  ```css
  .alert.leaving {
    opacity: 0;
    transition: opacity var(--yeti-duration-fast) var(--yeti-ease);
  }
  ```

  Angular adds the class when the element leaves, waits for the longest transition on it, and then removes the element (`enter-and-leave.md:46-48`). The CSS reads the token as CSS, so the production build's `.15s` is 150 ms and Y1 cannot occur (ADR 0010 consequences). Ticket 18 measured the class form with a Yeti dialog transition: the element was removed after 153 to 192 ms.
- **Styles while leaving:** the `alert` item link stays until Angular removes the last host from the DOM, because removal waits for the DOM, not for Angular (ADR 0060 point 4, measured: 0 unstyled frames while leaving).
- **Completion:** none in the package. The directive is destroyed when its view is, and the class form gives no completion notice; the function form, which would, is never used (ADR 0010 point 2; `upstream-bugs.md` A1). `closed` is not a **Completion output** in [CONTEXT.md](../CONTEXT.md)'s sense: it fires on the dismissal, before the removal it causes ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 100).
- **Reduced motion:** Yeti's `--yeti-duration-fast` collapses to `0.01ms` (`Y/src/tokens/motion.css:27`), so the leave class's transition is near zero and Angular removes the alert at once (ADR 0010 point 5; that Angular then removes it at once is inferred, and layer 4 measures it).
- **Entry:** an alert inserted on the client may arrive with Yeti's `enter` utility through `yetiEnter` on the alert, never `animate.enter="enter"` beside it ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 22; the [enter](enter.md) spec). A server-rendered alert never takes `animate.enter` (ADR 0011 clause 12).

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attributes, the static `data-close`, the consumer's role and label, the `jsaction` on the close button, and the item link in `<head>` (section 8). Everything at first paint is a host binding (ADR 0011 clause 1). Nothing is **Pre-hydration state**: no person and no Yeti mechanism can change `data-variant`, `data-emphasis`, or `data-close` (ticket 26 rows 87 to 89).
- **Before hydration:** neither directive creates a node, reads layout, starts a timer or observer, or touches `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The only constructor work is `YetiAlert`'s item acquisition, which ADR 0060 runs on the server too.
- **Full hydration:** both hosts are claimed as they are; bindings computed from the same inputs give the same values (usage rule 10); 0 style mutations (ADR 0060 point 5, measured for the mechanism).
- **Event replay:** the close button's `click` host listener is on Angular's replay list. A click before hydration reaches the handler once the alert's boundary hydrates; the handler reads the active element at that time (the clicked button, in engines where a click focuses a button), moves focus, and emits `closed`, and the consumer's removal follows: late, but once (events spec, Rendering modes; building-blocks 1.11). The handler calls no `preventDefault()`, so replay cannot throw in it. `closed` itself never replays (ADR 0011 consequences).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the alert and its link; a dehydrated host holds the link for as long as it is on the page (ADR 0060 point 4). `hydrate on interaction` replays the click that hydrates it (building-blocks 1.11), with the result above.
- **`hydrate never`:** the alert is its server HTML and stays styled while its host is connected (ADR 0060 point 4; ADR 0045). The close button renders and does nothing: no listener is attached, so the alert cannot be dismissed. This is the stated residue.
- **Client-only `@defer`:** the item file is fetched when `YetiAlert` is constructed, which can show an unstyled alert for a few frames; the consumer closes the gap with `provideYetiStyles({ preload: ['alert'] })` (ADR 0060 point 6; [setup](setup.md)). Alerts inserted after an action are usually client-rendered, so this is the alert's common case.
- **`withI18nSupport()`:** the message and the close button's `aria-label` are usually translated with `i18n` and `i18n-aria-label` in the consumer's component, which needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11). The directives add no `i18n` block and no string (building-blocks 1.10, Strings).
- **Zoneless:** inputs are `input()` signals read by host bindings; `closed` is an `output()` whose consumer handler writes the consumer's signal, so the `@if` re-renders with no zone (map, Standing rulings, item 43; building-blocks 1.5).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the alert is readable and styled, in its hue and emphasis, with its role in the markup. Lost: dismissal. The close button renders and does nothing, which Yeti's docs describe for a page without the Module. The package cannot leave the button out of the server HTML, because no output may branch on the platform (hydration constraints). A client-only application gets no such promise.
- **Hydration boundary:** the alert root and its close button belong in one boundary (usage rule 11), because the close button's handler reaches the alert through the token and the alert must be live to emit.

### 11. Hydration constraints

The item complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class, presence attribute, and marker are static; `data-variant` and `data-emphasis` come from inputs whose values usage rule 10 keeps equal on both sides.
- **No direct DOM manipulation:** the directives write nothing to the DOM outside host bindings before hydration. After hydration, in the click handler, the close part writes one attribute (`tabindex` on the parent, removed again by its `blur` listener) and calls `focus()`. Neither affects what the server rendered or what hydration compares, and Part 2 row 23 decides both. The removal is Angular's own, through the consumer's `@if`. The item link is the ADR 0060 service's.
- **Valid HTML:** the directives change no element. The consumer's markup must be valid as written: an alert on a `p` cannot hold the message's `div`, so the parser would repair it and differ from the server's DOM; usage rule 1 avoids it.
- **`preserveWhitespaces`:** the directives have no template. White-space-only text in a flex container is not a flex item, and `.alert > svg`, `> [data-close]`, and `> *` select elements only.
- **No output branched on the platform:** none. The close button is rendered on both sides even though it does nothing until hydration (section 10).
- **Static attributes the directives bind:** usage rule 9 keeps the consumer from writing them. The consumer's static `role`, `aria-label`, and `type` are not bound by any directive, so hydration writes back the same values the server rendered.

### 12. Single-page application

None of the shared pieces: the alert is not a top-layer panel, so it uses no [navigation-close](navigation-close.md), and it has no fragment link, so it uses no [fragment-links](fragment-links.md). An alert inside a routed view leaves with the route, with no `closed` and no focus move, because the reader did not dismiss it (events spec rule 9: a change the directive did not make emits nothing). An alert in the persistent shell outside the `router-outlet` stays across navigations until the reader dismisses it or the consumer's state removes it. The item link is removed in the animation frame after no `[data-ngx-yeti-item-alert]` host is connected (ADR 0060 point 4; ADR 0045), and a route that renders an alert again re-inserts it. A `blur` listener left on a parent outlives a route change only until that parent loses focus or leaves the DOM ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 102).

### 13. Item file

`yeti-css/css/components/alert/alert.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `[yetiAlert]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:52`, after `toc` and before `progress`), and removed after the last host carrying `data-ngx-yeti-item-alert` has left the DOM, which is after the leave transition (section 9). `YetiAlertClose` acquires nothing (section 2). The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns: Yeti's build at the Pin under `yeti-css`, the `assets` entry, the global stylesheet with the layer statement and the always-loaded group (which holds the `[data-variant]` stops and the tokens), optionally `provideYetiStyles({ preload: ['alert'] })`, and, for this item, the one leave rule of section 9 in the consumer's own stylesheet. Cross-item files acquired: none (`alert.css` has no cross-item rule; ADR 0060 point 9).

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class, attributes, and marker in the DOM, the item link, the painted colours, where focus is after a dismissal, that `closed` fired once, and that the alert left. It never asserts a private field, the token's value inside the directive, or how the styles service counts. No test depends on a public token's default value or on a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): a duration is compared with a probe styled `transition: opacity var(--yeti-duration-fast)` or the token's computed value, as Yeti's own test reads tokens with its `token()` helper. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `alert` item file through the directive, as a consumer would (ADR 0014 point 1), and its stylesheet holds section 9's `.alert.leaving` rule. Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Each play function asserts that no `yeti:*` event reached a `document` listener (events spec, layer 1). Story ids:

- `alert--default`: Yeti's example (`success`, `role="status"`, icon, message, close button) without the `@if`. Asserts `class="alert"`, `data-variant="success"`, `data-ngx-yeti-item-alert`, no `data-emphasis`; the button has `data-close` and a non-empty computed name; the icon is as wide as 1.25 times the alert's font size within 1 px; the alert is no taller than an alert without a close button and the same text (Yeti's own case); the button's box is at least 24 by 24 CSS pixels; the text contains "Saved"; contrast as in section 7.
- `alert--dismissible`: the alert inside `@if` with `animate.leave="leaving"` and `(closed)` bound to an action and to the signal, inside a parent `section` with no `tabindex`. Focuses the button, presses Enter: asserts `closed` fired once with no payload, focus is on the `section`, the `section` has `tabindex="-1"`, the alert carries `leaving` and is gone once its transition ends, and the `alert` item link is gone after the next animation frame. Tabs on: asserts the `section` no longer has `tabindex`. The events spec names this story id.
- `alert--parent-tabindex`: as `alert--dismissible` with the parent carrying `tabindex="0"`. Asserts the parent keeps `tabindex="0"` after the dismissal and after it blurs (Yeti's own case).
- `alert--pointer`: dismisses with a pointer click while focus is on an element outside the alert. Asserts `closed` fired, focus did not move to the parent, and no `tabindex` was added.
- `alert--variants`: one alert per value of `variant` at each value of `emphasis` (27), each with its kind in the words. Asserts each `data-variant` and `data-emphasis`, that `low` has a transparent background, that `danger` and `alert` paint the same border colour and `primary` a different one (Yeti's own case), and 4.5:1 text contrast and 3:1 glyph contrast for every pair in the light scheme and, with `color-scheme: dark` on the story root, the dark scheme ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 8).
- `alert--inputs`: Storybook controls bind `variant` and `emphasis`. The play function sets each, asserts the matching attribute, resets it to unset, and asserts the attribute is gone.
- `alert--edge`: an alert inside an element setting `--yeti-border-width: 2px`, and one with `--yeti-alert-edge: 1px` on the alert. Asserts the first's inline-start border is four times a probe's `var(--yeti-border-width)` within 1 px, and the second's is 1 px (Yeti's own cases).
- `alert--urgent`: a button inserts an alert with `role="alert"`, `variant="danger"`, `emphasis="high"` through `@if`. Asserts the inserted element has role `alert` in the accessibility tree and that focus stayed on the inserting button (APG: an alert does not affect focus).
- `alert--list`: three notices rendered with `@for` from a signal array, each with `animate.leave`. Dismissing the second removes only it; focus moves to the list's container element.
- `alert--rtl`: `alert--default` inside `dir="rtl"`. Asserts the thick border is on the right and the close button is the leftmost child.

### Layer 2: browser-level (`npx nx test <lib>`, `alert.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiAlert, { tagName: 'div' })`: the host has class `alert` and `data-ngx-yeti-item-alert`, and no `data-variant` or `data-emphasis`; with `bindings` setting `variant` and `emphasis`, the attributes follow after `whenStable()`, and binding `undefined` removes them.
- While a `YetiAlert` fixture lives, one `<link data-ngx-yeti-styles="alert">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- `createDirective(YetiAlertClose, { tagName: 'button' })` with `yetiAlertToken` provided in TestBed by a stand-in whose `closed` is a spy: the host has `data-close=""`, no presence attribute, and acquires no link. Without the token, creation throws (section 3).

A small test host covers what `createDirective` cannot: a close button inside a `yetiAlert` host resolves `yetiAlertToken` to the parent instance; template references `#a="yetiAlert"` and `#c="yetiAlertClose"` resolve; a static `variant="success"` sets the input; the consumer's own `class` on the alert host is kept. The handler: with focus on the button, a `click` focuses the parent, adds `tabindex="-1"`, and emits `closed` once, in that order (the output spy reads `document.activeElement`); a following `blur` of the parent removes `tabindex`; a parent with `tabindex="0"` keeps it; with focus outside the alert, a click emits and moves nothing; a click whose `defaultPrevented` is already true (a capture-phase listener on the document that calls `preventDefault()`) emits nothing and moves nothing; a click event whose `preventDefault` throws, standing in for a replayed event, still moves focus and emits (building-blocks 1.12, layer 2). Destroying the host while the parent holds the temporary `tabindex` leaves the parent's `blur` listener in place, and the next `blur` removes the attribute ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 102).

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `alert.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()` and a fixture of section 8's markup without the `@if`, whose message carries `i18n` and whose button carries `i18n-aria-label`, with `emphasis` bound (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the alert renders `class="alert"`, `data-ngx-yeti-item-alert`, `data-variant="success"`, `data-emphasis`, and the consumer's `role`; the button renders `data-close=""` and a `jsaction` for `click`; `<head>` holds one item link with `data-ngx-yeti-styles="alert"`, `data-beasties-skip`, and an `href` ending `components/alert/alert.css?v=<pin>`; no element carries a `tabindex` the package added.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `alert` has `YetiAlert`; `data-variant` and `data-emphasis` have inputs whose unions equal the manifest's vocabularies `variant` and `emphasis`; the marker `data-close` has the part directive `YetiAlertClose`; the item's one event `yeti:close` has the output `closed`. A pin move that adds an attribute, a value, a marker, or an event fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids, after Yeti's own `alert.spec.js`: on `alert--dismissible`, a real Enter and a real Space each dismiss the alert in Chromium, Firefox, and WebKit, with focus on the parent afterwards and not on `body`, and Shift+Tab after the parent blurs finds no extra tab stop; a real pointer click dismisses it in every engine, with focus moved only where the engine focused the button. With `emulateMedia({ reducedMotion: 'reduce' })`, the alert is gone within 50 ms of the key press. With `forcedColors: 'active'`, the alert's text and the close button's glyph remain visible and the focus ring is drawn on the button (recorded, after ticket 50 decisions 26 and 30). At a 320 px viewport, `alert--variants` has no horizontal overflow.

Fixture-app half, built with `outputMode: 'server'`, with an `/alert` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences). The route renders section 8's markup, the `@if` initially true:

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- with `main.js` held back, a click on the close button before hydration, then letting the bundle load: one `closed` after hydration, the alert removed once, and the parent holding focus (event replay);
- in the production build, the time from the key press to the alert's removal is at least the computed `--yeti-duration-fast` of a probe and under that plus 100 ms, so the minified `.15s` is read as 150 ms (Y1 cannot occur);
- with JavaScript disabled, the alert is styled in its hue, the close button does nothing when clicked, and `@axe-core/playwright` with the six tags reports no violation;
- an alert inside a `hydrate never` block stays styled after every live alert on the page is removed, and its close button does nothing;
- an alert inside a client-only `@defer` block with `alert` in the preload list shows no unstyled frame;
- a `role="alert"` alert inserted after hydration appears in the accessibility tree with role `alert`; whether a screen reader announces an inserted `role="status"` is a manual release check (ADR 0015 point 7; section 7);
- navigating from the alert route to a route without one removes the item link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and `docs.md` for the stories, and its `test/browser/components/alert.spec.js` with `test/browser/fixtures/components/alert.html` for the emphasis, edge, icon, height, focus, parent-`tabindex`, and hue cases; Yeti's `test/browser/contrast.spec.js` for the contrast pairs its fixture marks with `data-contrast`; ticket 18's fixture app and its alert and `animate.leave` measurements; ADR 0060's prototype for the server HTML and the item link; the [sidebar](sidebar.md) spec's probe technique for token-independent sizes.

## Out of Scope

- A message that arrives and leaves on its own (a toast or snack bar), any auto-dismiss timer, and a queue of alerts (Yeti's docs: "that is not this"; APG alert pattern).
- `LiveAnnouncer`, a live-region service, a `politeness` or `role` input, or any announcement from code (Part 2 row 23; ADR 0043 point 4).
- Package CSS for the leave transition, or a package-defined leave class (ADR 0060 point 8: the package's CSS is accessibility rules only; section 9).
- Dispatching a `yeti:close` DOM event for non-Angular listeners (ADR 0040 consequences: a later decision on request).
- A predicate input that vetoes a close (building-blocks 1.4): the `defaultPrevented` check stays like for like ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 103).
- An Angular component that renders the alert's markup, an `icon` or `message` input, or a generated close button (ADR 0003 point 6; building-blocks 1.1).
- Any check that the close button is a direct child, last, inside an alert, or named, or that the role is set. Checks belong to a later milestone (map, Milestones); the usage rules state them.
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Item directive `[yetiAlert]` with `variant`, `emphasis`, and `closed`; part directive `button[yetiAlertClose]` with the static `data-close` and the click | building-blocks Part 2 row 23; ticket 26 rows 87 to 89; [Decide: the spec list](../issues/11-decide-spec-list.md) row 23 |
| `data-close` is kind P: a static host attribute, no input | ADR 0070; ticket 26 row 89 and grilling question 8 |
| Static host class; the consumer writes no Yeti class or attribute | ADR 0003 points 1 and 2 |
| Inputs typed by Yeti's `YetiVariant` and `YetiEmphasis`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2; ADR 0080 point 5 |
| The role is the consumer's static attribute; no `LiveAnnouncer` | ADR 0003 point 3; Part 2 row 23; ticket 25 grilling question 15; ADR 0043 point 4 |
| `yeti:close` becomes the `void` output `closed` on the root; no DOM event | [events](events.md) sections 2 and 4; ADR 0040 consequences |
| `closed` fires on the dismissal, after the focus move and before the consumer's removal | Part 2 row 23; this spec's reading against the brief's "after the transition" ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 100) |
| Removal is the consumer's `@if` or `@for` with a class-form `animate.leave`; the leave class and its one rule are the consumer's | Part 2 row 23; ADR 0010 point 2; building-blocks 1.6 rule 2; architecture-guide P19 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 101) |
| Focus moves to the parent with a temporary `tabindex="-1"`, as `alert.js:24-29` does, in the click handler | Part 2 row 23 |
| The parent's one-shot `blur` listener outlives the directive | this spec's reading of `alert.js:28` against building-blocks 1.15 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 102) |
| `event.defaultPrevented` is honoured as `alert.js:6` does | ADR 0040 (like-for-like) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 103) |
| The part injects `yetiAlertToken` as required | building-blocks 1.9 |
| Only `YetiAlert` marks its host with `data-ngx-yeti-item-alert` and acquires the item file | ADR 0045; ticket 50 decision 6 |
| `exportAs` on both; class names with no collision | building-blocks 1.3; ADR 0080 points 3 and 4 |
| Entry point `ngx-yeti/alert` | building-blocks 1.3; ADR 0011 clause 10 |
| Native platform, level 1, plus `animate.leave` | building-blocks 1.2; Part 2 row 23 |
| No ledger row: a like-for-like replacement | ADR 0040 consequences; Part 2 row 23 |
| Text contrast asserted at 4.5:1 for every variant and emphasis, both schemes | ADR 0015 point 3; ticket 50 decision 8 |
| Tokens are the consumer's, `--yeti-duration-fast` included | ADR 0004 |
| Item file as a counted link in Yeti's order; it stays while the alert leaves | ADR 0060 points 2 to 6 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

A notice after a save, removed by the reader:

```html
@if (saved()) {
  <div yetiAlert variant="success" role="status" animate.leave="leaving" (closed)="saved.set(false)">
    <div i18n><strong>Saved.</strong> Your changes are live.</div>
    <button type="button" yetiAlertClose aria-label="Dismiss" i18n-aria-label>×</button>
  </div>
}
```

```ts
import { YetiAlert, YetiAlertClose } from 'ngx-yeti/alert';

@Component({
  selector: 'app-profile-form',
  imports: [YetiAlert, YetiAlertClose],
  templateUrl: './profile-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileForm {
  protected readonly saved = signal(false);
}
```

The consumer's leave rule, once, in any stylesheet the application loads:

```css
.alert.leaving {
  opacity: 0;
  transition: opacity var(--yeti-duration-fast) var(--yeti-ease);
}
```

An urgent message, filled, with no close button:

```html
@if (paymentFailed()) {
  <div yetiAlert role="alert" variant="danger" emphasis="high">
    <div><strong>Payment failed.</strong> The card was declined.</div>
  </div>
}
```

A list of notices from state:

```html
@for (notice of notices(); track notice.id) {
  <div yetiAlert role="status" [variant]="notice.variant" animate.leave="leaving" (closed)="dismiss(notice.id)">
    <div>{{ notice.text }}</div>
    <button type="button" yetiAlertClose aria-label="Dismiss" i18n-aria-label>×</button>
  </div>
}
```

A banner present at first paint needs no role to be seen; it takes one to be right (`Y/src/guides/components.md:194`): `<div yetiAlert role="status" emphasis="low">Maintenance on Sunday from 02:00.</div>`. A thinner start edge on one alert, in the consumer's stylesheet: `.compact-notice { --yeti-alert-edge: 2px; }`. A page whose alerts render inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['alert'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/alert/alert.css`, loaded by `YetiAlert` as a counted link (section 13). The consumer writes nothing for the item beyond the [setup](setup.md) spec's one-time configuration and the one leave rule of section 9.
2. **Always-loaded rules relied on:** `layouts/attributes.css:237-254` maps each `data-variant` value to the private variant stops; `tokens/` declares the hue stops, `--yeti-border-width`, `--yeti-space-*`, `--yeti-control-size`, `--yeti-alert-radius`, `--yeti-alert-padding`, and the motion tokens with their reduced-motion collapse (`tokens/motion.css`); the base layer draws the focus ring.
3. **Cross-item rules:** none in `alert.css`. An `svg` icon carries no `yetiIcon` (usage rule 4); a close button carries no `yetiButton` (usage rule 5).
4. **Tokens:** reads the tokens of section 2; writes none. The consumer's leave rule reads `--yeti-duration-fast` and `--yeti-ease`.
5. **What breaks without the item file:** the alert renders as a plain block with no border, tint, or padding; the icon and the close button stack with the message, the icon at its intrinsic size and the button as the browser's default button. The `data-variant` attributes still set their private stops, which nothing reads. The words still carry the meaning, and the close button still works.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) compiled all 49 of Yeti's class names and its attribute names with Tailwind 4.3.3, and only `container`, `grid`, and `table` (plus the attribute name `hidden`) produced a utility (measured). `alert` produced none.

### Platform features to adopt when the browser target moves

None for the item. Its two unguarded features, the `lh` unit and `color-mix()`, are inside Baseline 2025 (the `lh` unit "two weeks past the target date", [research/yeti-foundation-7.md](../research/yeti-foundation-7.md)), and Yeti guards nothing for the alert. A completion notice for the leave transition would come from Angular (a fix of angular/angular#66244 making the function form safe, `upstream-bugs.md` A1), not from the platform; if it lands, ADR 0010's considered option on the function form reopens and with it whether `closed` could fire after the fade. That is inferred; nothing was checked against web-features data for this spec.

### Single-page-application pieces relied on

The [events](events.md) spec for the `closed` output's name, payload, and rules. None of [generated-ids](generated-ids.md), [fragment-links](fragment-links.md), or [navigation-close](navigation-close.md). It relies on ADR 0060's styles service for route changes (section 12).
