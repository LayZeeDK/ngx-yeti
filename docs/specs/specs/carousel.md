# Spec: carousel (component item)

Ticket: [79. Spec: carousel (component)](../issues/79-spec-carousel.md)

Targets: Angular 22.2, Nx 23.2, Storybook 10.6 with `@storybook/angular-vite`, Vitest 4.1.x, TypeScript 6.0.x, and Yeti `f52d1e8b9` (`f52d1e8b93de5bbde322480ba77d5be26c49b0ef`, `develop`, 2026-09-25). Browser target: Chrome and Edge 141, Firefox 145, Safari and Safari iOS 26.2 ([ADR 0002](../adr/0002-browser-target-baseline-2025.md)). Accessibility target: WCAG 2.2 AA.

Deciding records: [ADR 0024](../adr/0024-carousel-slides-are-not-inert-before-live.md) (no slide is `inert` or hidden in the server HTML; the dots stay links); [building-blocks.md](../building-blocks.md) Part 2 row 29, its "Aria decisions (2026-10-03)" row 29 (the user's choice for the carousel's picker, "Custom: links + prev/next (Recommended)", quoted in the map's Standing rulings), and Part 1 (1.3, 1.4, 1.5, 1.6 rule 4, 1.9, 1.10, 1.11, 1.13, 1.15); [Prototype: Angular Aria for the four items that keep a native pattern](../issues/29-prototype-aria-for-the-native-pattern-items.md) and its [aria-carousel findings](../prototypes/aria-carousel/README.md) (why Aria Tabs was rejected, and WebKit's Tab skipping links); [Prototype: fitting Angular Aria to Yeti by directive composition](../issues/30-prototype-fitting-aria-by-directive-composition.md); [Research: where Angular Aria's attribute directives fit Yeti's own markup](../issues/32-research-aria-directives-on-yetis-own-markup.md); [Prototype: subclassing Aria's directives, and `[open]` against `[attr.open]`](../issues/34-prototype-subclassing-aria-and-open-binding-forms.md); [Decide: how the package maps each of Yeti's `data-*` attributes](../issues/26-decide-yeti-data-attributes-mapping.md) rows 104 to 108; the shared specs [fragment-links](fragment-links.md) (no history entry on a dot click), [events](events.md) (the `slide` output), [generated-ids](generated-ids.md), and [setup](setup.md); ledger row A11Y-4 ([ledger.md](../ledger.md)); [Decide: the open points of the specs](../issues/50-decide-open-points-of-the-specs.md) (decisions 2, 4, 6, 8, 10, 18, 42, 45, and 88); [ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md), [ADR 0004](../adr/0004-yeti-tokens-are-a-consumer-stylesheet-surface.md), [ADR 0005](../adr/0005-closed-unions-from-yetis-vocabularies.md), [ADR 0011](../adr/0011-rendering-modes-contract-for-yeti.md), [ADR 0014](../adr/0014-testing-stack-for-yeti.md), [ADR 0015](../adr/0015-wcag-2-2-aa-enforcement-over-yeti.md), [ADR 0023](../adr/0023-fragment-links-are-same-document-links.md), [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md), [ADR 0045](../adr/0045-each-item-marks-its-host-with-its-own-attribute.md), [ADR 0060](../adr/0060-item-styles-are-counted-links-to-the-consumers-yeti-build.md), [ADR 0070](../adr/0070-where-a-yeti-attribute-sits-decides-its-mapping.md), and [ADR 0080](../adr/0080-yeti-prefix-ngx-yeti-runtime-names-ngxyeti-on-collision.md). `Y/` is `github.com/foundation/yeti/` at the **Pin**; `NC/` is `github.com/angular/components/` at `708d4c6e2` (22.2.x); `NGP/` is `github.com/angular/angular/packages/` at 22.2.x; `APG/` is `github.com/w3c/aria-practices/` at `3f094fd`. The points the ticket listed as open were decided in [ticket 50](../issues/50-decide-open-points-of-the-specs.md) (decisions 121 to 135), and each is cited where it applies.

## Problem Statement

Yeti's `carousel` is "Slides on a scroll-snapping track with dots that link to each one, scrolled by the browser, with an optional module so following a dot costs no history entry" (`Y/src/components/carousel/manifest.json`). It is one **Identity class**, `carousel`, two **Attributes** (`data-slides`, how many slides show at once, and `data-gap`), and three **Markers**: `data-track` on the scrolling row, `data-slide` on each slide, and `data-dots` on a list of fragment links, one per slide. The track scrolls and snaps by itself, so dragging, swiping, a trackpad, and the arrow keys on the focused track all work with no script. Each dot is `<a href="#work-1">`, so the browser scrolls to the slide.

Following a fragment is a navigation, and each one adds a history entry: "A reader who looked at four slides then pressed back four times to leave the page is not going to forgive that" (`Y/src/components/carousel/carousel.js:1-5`). Yeti's optional **Module** `carousel.js` takes the click, scrolls the track itself with an absolute target measured against the writing direction's start edge, and dispatches the **Event** `yeti:slide` with `{ index, slide }` (`carousel.js:11-47`).

An Angular developer who uses that markup and Module directly meets these measured or read problems:

- Every Angular CLI application ships `<base href>`, so on any route but the base URL a bare `href="#work-1"` resolves to another document. On `/sub/tabs` a bare fragment reloads the document to `/sub/#id` and lands on the root route ([Prototype: Yeti's modules in a single-page Angular app](../issues/20-prototype-yeti-in-single-page-apps.md), measured in three engines). `carousel.js` selects only `a[href^="#"]` (`:12`), so a link written with the current path, which would not reload, is no longer a dot it handles.
- A template cannot bind `(yeti:slide)`: the compiler rejects the colon-named event ([Research: binding Yeti's `yeti:*` events in Angular templates](../issues/16-research-yeti-events-in-angular-templates.md), measured). A plain field written from a DOM listener does not refresh a zoneless view ([ticket 18](../issues/18-prototype-yeti-rendering-modes.md), measured).
- The carousel falls short of the APG Carousel pattern in three ways (ledger A11Y-4; [ticket 17](../issues/17-research-yeti-accessibility-and-standards.md), read and measured). There are no previous and next buttons, which the APG lists first among "Features needed to provide sufficient rotation control" (`APG/content/patterns/carousel/carousel-pattern.html:35`). The slides are unnamed `article`s with no `group` role or `aria-roledescription="slide"` (`:136-143`). Nothing marks the slide on screen: "They jump to a slide but cannot report which slide is showing, because CSS cannot know that" (manifest `a11y.notes`).
- In WebKit the Tab key skips links by default, so a keyboard user there never reaches a dot ([aria-carousel findings](../prototypes/aria-carousel/README.md) point 4, measured). Without previous and next buttons, Tab gives such a user no way to choose a slide.
- The developer would write `class="carousel"`, `data-slides`, `data-gap`, `data-track`, `data-slide`, and `data-dots` by hand, untyped, which the package's contract forbids ([ADR 0003](../adr/0003-directives-set-yetis-class-attributes-and-markers.md)).

Angular Aria's Tabs looked like a fit for the dots, and was measured and rejected. Aria renders `inert` on every unselected slide and `tabindex="-1"` on every tab in the server HTML. So before hydration, with JavaScript off, and inside `hydrate never`, the picker cannot be reached by keyboard, and a slide scrolled into view is visible but inert. A click still adds a history entry, the keys select without scrolling the track, and the selection does not follow a swipe ([aria-carousel findings](../prototypes/aria-carousel/README.md), measured in three engines; [ticket 30](../issues/30-prototype-fitting-aria-by-directive-composition.md): even fitted by composition, "the tab stop does not follow a swipe without Aria's private `activeItem`").

## Solution

Seven directives on the consumer's own markup, after Yeti's example ([building-blocks.md](../building-blocks.md) Part 2 row 29; "Aria decisions (2026-10-03)" row 29):

- `section[yetiCarousel]` (`YetiCarousel`), the **Item directive** and **Coordinating directive**. It binds the class `carousel`, sets `data-slides` and `data-gap` from typed inputs, loads the `carousel` **Item file**, declares the `slide` output that replaces `yeti:slide`, and exposes a read-only `current` signal: the index of the slide in view, from an `IntersectionObserver` over the slides with the track as root, created after the first render.
- `[yetiCarouselTrack]` (`YetiCarouselTrack`) sets the marker `data-track` and the track's `role="group"` and `tabindex="0"` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 127).
- `[yetiCarouselSlide]` (`YetiCarouselSlide`) sets the marker `data-slide`, `role="group"`, and `aria-roledescription="slide"`, and registers the slide with the carousel. The slide's name and `id` are the consumer's.
- `[yetiCarouselDots]` (`YetiCarouselDots`) sets the marker `data-dots`.
- `a[yetiCarouselDot]` (`YetiCarouselDot`) renders a same-document `href` from the consumer's `href="#work-1"` ([fragment-links](fragment-links.md)), so the dot stays in-page in every rendering mode. On a click it scrolls the track with `carousel.js`'s measurement and emits `slide`, so no history entry is added and the URL is left alone. It marks the dot of the slide in view with `aria-current="true"`.
- `button[yetiCarouselPrevious]` and `button[yetiCarouselNext]` (`YetiCarouselPrevious`, `YetiCarouselNext`) on buttons the consumer writes, with the consumer's text. Each scrolls the track to the adjacent slide and leaves focus on the button.

No slide ever carries `inert` or `hidden` in the server HTML ([ADR 0024](../adr/0024-carousel-slides-are-not-inert-before-live.md) point 1), and the dots stay links (point 2). No Module is loaded ([ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md)). The carousel has no autoplay, as Yeti's has none ([building-blocks.md](../building-blocks.md) 1.10).

```html
<section yetiCarousel aria-roledescription="carousel" aria-label="Featured work" (slide)="chosen.set($event.index)">
  <div yetiCarouselTrack aria-label="Slides">
    <div yetiCarouselSlide yetiBox surface="raised" yetiBorder id="work-1" aria-label="1 of 3"><h3>A trail map</h3><p>Printed in two colors.</p></div>
    <div yetiCarouselSlide yetiBox surface="raised" yetiBorder id="work-2" aria-label="2 of 3"><h3>A field guide</h3><p>Three hundred pages.</p></div>
    <div yetiCarouselSlide yetiBox surface="raised" yetiBorder id="work-3" aria-label="3 of 3"><h3>A season of posters</h3><p>Twelve of them.</p></div>
  </div>
  <ol yetiCarouselDots role="list">
    <li><a yetiCarouselDot href="#work-1"><span yetiVisuallyHidden>Slide 1</span></a></li>
    <li><a yetiCarouselDot href="#work-2"><span yetiVisuallyHidden>Slide 2</span></a></li>
    <li><a yetiCarouselDot href="#work-3"><span yetiVisuallyHidden>Slide 3</span></a></li>
  </ol>
  <div yetiCluster>
    <button type="button" yetiButton yetiCarouselPrevious>Previous slide</button>
    <button type="button" yetiButton yetiCarouselNext>Next slide</button>
  </div>
</section>
```

## User Stories

1. As an application developer, I want to write `yetiCarousel` on a `section`, so that it renders Yeti's carousel without my writing `class="carousel"`.
2. As an application developer, I want a `slides` input typed by Yeti's `slides` vocabulary (`'1'` to `'4'`), so that a value Yeti does not know fails to compile.
3. As an application developer, I want a `gap` input typed by Yeti's `gap` vocabulary, shared with every other item that reads it, so that `yetiCarousel gap="lg"` type-checks the same way as on a `stack`.
4. As an application developer, I want an unset `slides` and `gap` to render no attribute, so that Yeti's defaults (one slide, the `md` gap) apply from its CSS.
5. As an application developer, I want to write `yetiCarouselTrack`, `yetiCarouselSlide`, and `yetiCarouselDots` where Yeti's docs write `data-track`, `data-slide`, and `data-dots`, so that I write no Yeti attribute by hand.
6. As an application developer, I want the track to get its `role="group"` and `tabindex="0"` from the directive, so that I cannot forget the two attributes Yeti asks for on a scrolling region.
7. As a keyboard user, I want to Tab to the track and scroll it with the arrow keys, so that I can move through the slides without a pointer.
8. As a touch or trackpad user, I want to swipe the track and have it snap to a slide, so that the carousel feels native.
9. As an application developer, I want each slide announced as a slide in a group with its own name, so that a screen reader user knows where one slide ends and the next begins (APG Carousel; ledger A11Y-4).
10. As an application developer, I want to name each slide with my own `aria-label` (such as "2 of 3") or `aria-labelledby` its heading, so that the names are mine and translatable.
11. As an application developer on a non-English page, I want to replace the word "slide" in the role description with my own translated word, so that the announcement matches the page's language ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 130).
12. As an application developer, I want `yetiCarouselDot` on each dot link, with Yeti's `href="#work-2"`, so that the dot scrolls to its slide.
13. As a reader, I want following a dot to add no history entry and leave the URL alone, so that Back leaves the page instead of stepping back through slides.
14. As a reader of a page under a subpath `<base href>`, I want a dot never to reload my application, before or after it hydrates, so that I stay on the page.
15. As a reader using "open link in new tab" or a middle click on a dot, I want the browser to do what it always does, so that modified clicks belong to me.
16. As a reader, I want a dot to bring its slide to the start edge of the track, in left-to-right and right-to-left pages alike, so that the slide I picked is the first one I see.
17. As a reader who presses two dots in quick succession, I want the track to land on a slide and not between two, so that the carousel never parks half-way.
18. As a reader who prefers reduced motion, I want the track to jump rather than glide when I follow a dot or press previous or next, so that nothing animates against my setting.
19. As an application developer, I want a `(slide)` output carrying `{ index, slide }`, typed with no global augmentation, so that I can update a counter or a caption beside the carousel.
20. As an application developer, I want `(slide)` to fire on the choice, not when the scroll ends, so that it behaves as Yeti's `yeti:slide` did ("the event is about the choice, not the arrival", `carousel.js:38-41`).
21. As an application developer, I want `index` to be the slide's position among the carousel's own slides, so that it matches Yeti's `slides.indexOf(slide)`.
22. As an application developer, I want a read-only `current` signal with the index of the slide in view, so that I can show "Slide 2 of 5" that follows swipes too ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 121).
23. As a screen reader user, I want the dot of the slide in view to be marked `aria-current`, so that I hear which slide is showing (ledger A11Y-4).
24. As a screen reader user, I want that mark to follow the slide in view when I swipe or scroll the track, so that it never names a slide I have left.
25. As a screen reader user on a page without JavaScript, I want no dot to claim a current slide it cannot know, so that the page never tells me something false ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 123).
26. As a keyboard user in Safari, where Tab skips links, I want previous and next buttons that Tab reaches, so that I can still choose a slide.
27. As an application developer, I want to write the previous and next buttons myself, with my own text and look (for example `yetiButton`), so that they fit my page.
28. As a keyboard user, I want focus to stay on the previous or next button after I press it, so that I can press it again (APG Carousel).
29. As a screen reader user, I want the previous button marked unavailable on the first slide and the next button on the last, so that I know there is nothing further that way ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 124).
30. As a reader on a page without JavaScript, I want the previous and next buttons marked unavailable rather than looking ready and doing nothing, so that I use the dots and the track instead ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 124).
31. As an application developer, I want previous and next to emit `(slide)` like a dot does, so that one handler covers every choice ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 124).
32. As an application developer, I want the carousel to work with JavaScript off on my SSR and prerendered pages: styled, swipeable, the track reachable by Tab, and the dots following their fragments, so that the package's no-JavaScript guarantee holds.
33. As a reader who clicks a dot before the application hydrates, I want the dot to work at once, natively, so that my click is not lost.
34. As a reader of a carousel inside a `@defer (hydrate on ...)` block who clicks a dot before the block hydrates, I want the click to take effect when it hydrates, so that it is not lost.
35. As an application developer, I want no slide to be `inert` or hidden in the server HTML, so that a slide scrolled into view before hydration is never visible but unreachable (ADR 0024).
36. As an application developer, I want the server HTML and the hydrated DOM to be the same, so that hydration rewrites nothing and logs no mismatch.
37. As an application developer on zoneless change detection, I want `current`, `aria-current`, and the buttons' state to update from the observer, so that the view refreshes without zone.js.
38. As an application developer using `i18n`, I want the carousel's label, role description, slide names, dot names, and button text to be translatable and to hydrate under `withI18nSupport()`, so that a localised page is not re-rendered.
39. As an application developer, I want the carousel's styles to load with its first instance and leave after its last, so that I pay for them only on pages that show one.
40. As an application developer with a carousel inside a client-only `@defer` block, I want to preload its item file, so that its first frame is styled.
41. As an application developer, I want a carousel inside `hydrate never` to stay styled and swipeable with working dots, so that I know exactly what is lost there.
42. As an application developer, I want a slide added with `@for` after load to be counted, observed, and reachable by its dot, and I want to give a dot rendered with `@for` its slide's id through a binding, so that a carousel built from data works ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 126).
43. As an application developer, I want the dot's `href` to follow the URL when the Router reuses my component for another path, so that a dot never points at the previous route.
44. As a reader who opens a deep link to a slide's id, I want the track to show that slide, and the dot to mark it once the page is live, so that shared links land on the right slide.
45. As an application developer, I want template references `#c="yetiCarousel"` and the other `exportAs` names, so that I can read `c.current()` from my template.
46. As an application developer, I want the documentation to say which elements may host a slide, so that the slide's `group` role does not fail the accessibility check ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 129).
47. As an application developer, I want the documentation to list which attributes the directives render and which are mine, so that I do not write a static one that hydration writes back.
48. As a low-vision reader, I want each dot's circle to reach 3:1 against the carousel's background in the light and dark schemes, so that I can see the dots.
49. As a touch user, I want each dot's pressable area to be at least 24 by 24 CSS pixels, so that I can hit it.
50. As a reader in forced-colours mode, I want the dots to stay visible, so that I can still see and use them ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 131).
51. As an application developer, I want no `yeti:slide` DOM event dispatched by the package, so that a page does not hear two notifications for one choice.
52. As an implementer, I want every behaviour of `carousel.js` listed as kept, changed, or removed, so that the replacement can be checked against the pinned commit.
53. As an implementer, I want the contract check to fail when a pin move adds an attribute, a value, a marker, or an event to the carousel, so that the package's types follow Yeti.
54. As an accessibility reviewer, I want ledger row A11Y-4 to name what the package adds, its building blocks, and its tests, so that the APG compliance is traceable to ngx-yeti rather than to Yeti.
55. As an application developer, I want the carousel to keep its look beside Tailwind v4, so that I can use both.
56. As an application developer, I want to theme the dot's colour and size, the gap, and the scroll behaviour through Yeti's tokens in my own stylesheet, so that the package needs no theming input.
57. As an application developer, I want the whole carousel inside one hydration boundary in the documentation's examples, so that the dots and buttons work as soon as the carousel hydrates.
58. As a maintainer, I want an e2e test under a non-root `<base href>` that follows a dot before and after hydration and with JavaScript off, so that the measured reload can never come back unnoticed (ledger A11Y-16).

## Implementation Decisions

### 1. Yeti contract

Read at the Pin in `Y/src/components/carousel/manifest.json`, `carousel.css`, `carousel.js`, `docs.md`, and `example.html`, in `Y/src/tokens/components.css`, `Y/src/tokens/tokens.json`, `Y/schema/vocabulary.json`, and in Yeti's own test `Y/test/browser/components/carousel.spec.js` with its fixture:

| Manifest field | Value |
| --- | --- |
| `name`, `kind`, `group` | `carousel`, `component`, `Content` |
| `class` | `carousel` |
| `attributes` | `data-slides`: enum, vocabulary `slides` (`"1"`, `"2"`, `"3"`, `"4"`, `Y/schema/vocabulary.json:42`), default `1`: "How many slides are visible at once." `data-gap`: enum, vocabulary `gap`, default `md`: "Space between slides, and above the dots." |
| `classes` | empty |
| `children` | `> [data-track]` (exactly 1): "The scrolling track holding the slides. A scrolling region is an interactive one, so give it role=\"group\", a name, and tabindex=\"0\"." `[data-slide]` (2 or more): "One slide each, with an id a dot can link to." `> [data-dots]` (0 to 1): "A list of links, one per slide, each named by a span carrying visually-hidden or by an aria-label. With carousel.js loaded the module scrolls the track itself, so following one adds no history entry." |
| `markers` | `data-track` (boolean, `on: "> *"`), `data-slide` (boolean, `on: "> [data-track] > *"`), `data-dots` (boolean, `on: "> *"`) |
| `tokens` | public: `--yeti-carousel-dot` ("Colour of a dot"), `--yeti-carousel-dot-size`, `--yeti-control-size` ("The pressable area around a dot"), `--yeti-space-md`, `--yeti-carousel-scroll` ("How the track scrolls when a dot is followed"), `--yeti-space-xs`, `--yeti-duration-fast`, `--yeti-ease`; private: `--_yeti-slides`, `--_yeti-gap` |
| `a11y` | `requiredAttributes`: `aria-label \| aria-labelledby`; `keyboard`: Tab "Focuses the track, then each dot in turn.", ArrowLeft / ArrowRight "Scroll the track.", Enter "Scrolls to that dot's slide."; `notes`: label the region and give it `aria-roledescription="carousel"`; name each dot; "They jump to a slide but cannot report which slide is showing"; the module keeps Back useful; "Nothing essential should live behind a slide a reader has to find"; the track takes `role="group"`, an `aria-label`, and `tabindex="0"`, "a group rather than a region because the carousel itself is already the landmark" |
| `js` | `carousel.js`, optional; event `yeti:slide`, `detail` `{ index, slide }`: "Dispatched on the .carousel when a dot scrolls the track, with the slide's zero-based index." |
| `support` | `unguarded`: scroll snap, `scroll-behavior`, `scrollbar-width`; `guarded`: empty |
| `since` | `7.0.0` |

How it looks, in `@layer yeti.components` (`carousel.css`): `.carousel:not([data-gap])` and `.carousel:not([data-slides])` supply the private defaults (`:11-12`). `> [data-track]` is a flex row with the gap, `overflow-x: auto`, `overscroll-behavior-x: contain`, `scroll-snap-type: x mandatory`, `scroll-behavior: var(--yeti-carousel-scroll)`, and `scrollbar-width: none` (`:13-23`). Each direct child of the track takes `flex: 0 0 auto`, no margin, `scroll-snap-align: start`, and an equal share of the track less the gaps (`:24-29`). `> [data-dots]` is a centred flex row with no list style, `--yeti-space-xs` apart, and the gap above it (`:30-38`). Each dot link is a `--yeti-control-size` square holding a `::before` circle of `--yeti-carousel-dot-size` in `--yeti-carousel-dot`, which grows to 1.25 on hover over `--yeti-duration-fast` (`:41-57`). `--yeti-carousel-scroll` is `smooth`, and `auto` under `prefers-reduced-motion: reduce` (`Y/src/tokens/components.css:95`, `:178-181`). The carousel's CSS has no rule for `aria-current`, `aria-selected`, or `aria-disabled` (searched; [aria-carousel findings](../prototypes/aria-carousel/README.md) point 1).

What the Module does (`carousel.js`, 48 lines): one delegated `click` listener on `document` (`:11`). It finds the closest `.carousel > [data-dots] a[href^="#"]` (`:12`), and leaves to the browser any click whose default was prevented, that is not the primary button, or that carries Meta, Ctrl, Shift, or Alt (`:14-16`). It finds the carousel, its `:scope > [data-track]`, and the element whose id is the decoded fragment, and leaves the click to the browser unless the slide is inside the track (`:18-23`). It calls `preventDefault()` (`:25`), reads the track's computed `direction` and the two boxes, and calls `track.scrollTo({ left: track.scrollLeft + (rtl ? target.right - own.right : target.left - own.left) })` with no `behavior`, so the track's own `scroll-behavior` applies and reduced motion collapses it; the target is absolute because "a relative scrollBy is resolved against a smooth scroll still in flight, and WebKit then overshoots" (`:26-36`). It then dispatches `yeti:slide` on the carousel, `bubbles` and `composed`, with `{ index: slides.indexOf(slide), slide }` over the track's `:scope > [data-slide]` children (`:38-47`).

Yeti's own tests at the Pin assert: one slide fills the track and the track snaps; `data-slides="2"` halves each slide less the gap; a dot scrolls to its slide; under reduced motion the track's `scroll-behavior` is `auto`; each dot is a named link the size of `--yeti-control-size`; the track scrolls with no scrollbar; following a dot leaves `history.length` and `location.hash` unchanged; without the Module a dot still reaches its slide and sets the hash; two dots pressed quickly land on a slide; in right-to-left a dot brings its slide to the right edge; a modified click is left to the browser; axe is clean; and `yeti:slide` reaches `document` with `bubbles`, `composed`, `index` 2, and the slide (`Y/test/browser/components/carousel.spec.js`).

Attributes left to the consumer: `aria-label` or `aria-labelledby` and `aria-roledescription="carousel"` on the root; the track's `aria-label`; each slide's `id` and `aria-label` or `aria-labelledby`; `role="list"` on the dots list (building-blocks 1.1, which names `role="list"` the consumer's); each dot's name; the previous and next buttons' `type` and text (ADR 0003 point 3; building-blocks 1.10, Names and Strings). Ticket 26 rows 104 and 105 give `slides` and `gap` "the consumer's binding only" as their pre-hydration source, and rows 106 to 108 give the three markers "never".

### 2. Contract mapping

| Contract piece | Yeti | Package | Default and static form | Record |
| --- | --- | --- | --- | --- |
| Identity class | `carousel` | static host class on `section[yetiCarousel]` (`YetiCarousel`) | always | ADR 0003 point 1; Part 2 row 29 |
| Attribute `data-slides` | slides visible at once | input `slides` on `yetiCarousel`: `YetiSlides \| undefined`, bound `[attr.data-slides]`, `null` when unset | unset renders nothing; Yeti's `1` applies through `.carousel:not([data-slides])`. `slides` is not an HTML attribute | ticket 26 row 104 (R) |
| Attribute `data-gap` | space between slides and above the dots | input `gap` on `yetiCarousel`: `YetiGap \| undefined`, bound `[attr.data-gap]`, `null` when unset | unset renders nothing; Yeti's `md` applies through `.carousel:not([data-gap])`. `gap` is not an HTML attribute | ticket 26 row 105 (R) |
| Marker `data-track` (on `> *`) | the scrolling row | static host attribute `data-track=""` on `[yetiCarouselTrack]` (`YetiCarouselTrack`); no input | always present on the part | ticket 26 row 106 (P); ADR 0070 kind P |
| Marker `data-slide` (on `> [data-track] > *`) | one slide | static host attribute `data-slide=""` on `[yetiCarouselSlide]` (`YetiCarouselSlide`); no input | always present on the part | ticket 26 row 107 (P) |
| Marker `data-dots` (on `> *`) | the list of links | static host attribute `data-dots=""` on `[yetiCarouselDots]` (`YetiCarouselDots`); no input | always present on the part | ticket 26 row 108 (P) |
| Event `yeti:slide` | on the `.carousel`, when a dot scrolls the track | output `slide` on `YetiCarousel`, `YetiSlideDetail` (`{ index: number; slide: HTMLElement }`); emitted by a dot's click, and by previous and next ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 124) | not applicable | [events](events.md) section 2; Part 2 row 29 |
| Track `role="group"`, `tabindex="0"` | the author's (manifest `children`, `a11y.notes`) | static host attributes on `YetiCarouselTrack` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 127) | always | manifest `children[0]`; Part 2 row 14's scroller precedent |
| Track's name | the author's `aria-label` | the consumer's; no input | not applicable | building-blocks 1.10, Names |
| Slide `role="group"`, `aria-roledescription="slide"` | none (A11Y-4) | static host attributes on `YetiCarouselSlide`; a consumer's static `aria-roledescription` replaces the word ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 130) | always | Part 2 row 29; ledger A11Y-4; APG `carousel-pattern.html:136` |
| Slide's `id` and name | the author's | the consumer's (usage rule 3) | not applicable | building-blocks 1.5 (ids addressed from outside), 1.10 |
| Dot `href` | `#<slide id>` | the consumer's static `href="#<id>"`, read once through `HostAttributeToken('href')`, or the `yetiCarouselDot` input for a data-driven dot ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 126); `[attr.href]` bound to `injectSameDocumentHref(fragment)` | the current path and query plus the fragment, under `<base href>` | ADR 0023 point 1 and its 2026-10-03 note; ticket 50 decision 4; [fragment-links](fragment-links.md) section 4 |
| Dot `aria-current` | none (A11Y-4) | `[attr.aria-current]` on `YetiCarouselDot`: `'true'` for the dot of `current()`, else `null`; `null` until the observer first reports ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 123) | not in the server HTML | Part 2 row 29; ledger A11Y-4; ADR 0003 point 3 |
| Previous and next | none (A11Y-4) | `button[yetiCarouselPrevious]`, `button[yetiCarouselNext]`; `[attr.aria-disabled]` `'true'` while there is no slide that way or `current()` is `null`, else `null` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 124) | `aria-disabled="true"` in the server HTML | Part 2 row 29; ledger A11Y-4 |
| Root's name, `aria-roledescription="carousel"` | the author's | the consumer's; no input | not applicable | manifest `a11y`; building-blocks 1.10, Strings |
| `role="list"` on the dots list | the author's | the consumer's | not applicable | building-blocks 1.1 |
| Tokens `--yeti-carousel-dot`, `--yeti-carousel-dot-size`, `--yeti-control-size`, `--yeti-space-md`, `--yeti-space-xs`, `--yeti-carousel-scroll`, `--yeti-duration-fast`, `--yeti-ease` | the look and the scroll | the consumer's; the package writes none | not applicable | ADR 0004 |
| Tokens `--_yeti-slides`, `--_yeti-gap` | private | never read or written | not applicable | building-blocks 1.13 |
| Presence attribute (package) | not Yeti's | static `data-ngx-yeti-item-carousel=""` on `section[yetiCarousel]` only | always present | ADR 0045; ADR 0060 point 2; ticket 50 decision 6 |
| Injection token | not Yeti's | `yetiCarouselToken`, provided by `YetiCarousel` | not applicable | building-blocks 1.3 and 1.9 |

The input value types are Yeti's own `YetiSlides` and `YetiGap`, from the package's generated `yeti-types.ts`, re-exported by name and never redeclared (ADR 0080 point 5; ADR 0060 point 10). `YetiSlides` is Yeti's string union of `"1"` to `"4"`, so `slides="2"` compiles as a static string and a binding passes a string (`[slides]="'2'"`); there is no `numberAttribute`, because the vocabulary is strings (ticket 26 row 104). `gap` is `YetiGap` on all items that read it (building-blocks 1.4, Shared vocabularies), so `yetiCarousel` beside another package directive never declares `gap` with a different type. No class or type this spec names equals one of the 46 names `yeti.d.ts` exports at the Pin (ticket 50 decision 10), so every class takes `Yeti`.

Only `YetiCarousel` marks its host with the presence attribute and acquires the item file. Yeti's rules for the parts all sit under `.carousel >`, which applies only under the root's class, and the root's attribute keeps the file loaded (ticket 50 decision 6).

**Module replaced** (`carousel.js`, [ADR 0040](../adr/0040-package-replaces-yetis-optional-modules.md); Part 2 row 29: "the history-free dot scroll, `yeti:slide`"):

| `carousel.js` behaviour | Lines | Fate | In the package |
| --- | --- | --- | --- |
| One delegated `click` listener on `document`; dots added later work; safe on pages with none | `:10-11` | changed | a `click` host listener on each `a[yetiCarouselDot]`; it exists only where a dot is, works on any Angular-rendered dot in any rendering mode, and goes with its host (building-blocks 1.15) |
| Selects `.carousel > [data-dots] a[href^="#"]` | `:12` | changed | the directive is the dot. It reads its fragment from the consumer's static `href` and renders a same-document `href`, which `carousel.js`'s selector would no longer match (ADR 0023 point 1); usage rule 4 places it |
| Leaves non-primary and modified clicks (Meta, Ctrl, Shift, Alt) to the browser | `:14-16` | kept | the handler returns when `event.button` is not 0 or any of the four keys is held, before anything else |
| Leaves a click whose default was already prevented to the browser | `:16` | changed | not checked: Angular's own dispatcher prevents a click on an `<a>` carrying `jsaction` while it dispatches it, so the check would read Angular's prevention as a page's veto and lose a click replayed after hydration ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 125) |
| Finds the carousel with `closest('.carousel')` | `:18` | changed | the dot reaches its carousel through `yetiCarouselToken` (building-blocks 1.9) |
| Finds the track with `:scope > [data-track]` | `:19` | changed | the track registers with the carousel through the token |
| Finds the slide by `getElementById(decodeURIComponent(fragment))` | `:20` | changed | the carousel's registered slide whose element `id` equals the decoded fragment |
| Leaves the click to the browser unless the slide is inside the track | `:21-23` | kept | when no registered slide of this carousel has that id, the handler returns and the browser follows the same-document `href` natively (one history entry) |
| `preventDefault()`: no history entry, the URL left alone | `:1-8`, `:25` | kept, moved last | called as the handler's last statement, because `preventDefault()` throws during event replay and skips everything after it (building-blocks 1.5, Keyboard; 1.11) |
| Measures the boxes against the start edge of the track's computed `direction`; absolute `scrollTo` | `:26-36` | kept | the same formula, in the click handler, with `getComputedStyle(track).direction`, the one read of rendered layout building-blocks 1.5 allows instead of `Directionality` |
| No `behavior` passed, so the track's `scroll-behavior` token applies and reduced motion collapses it | `:28-33` | kept | no `behavior` passed (building-blocks 1.6 rule 4) |
| `index` is the slide's place among the track's `:scope > [data-slide]` children | `:38-42` | kept | the slide's position in the carousel's slide collection, kept in DOM order (building-blocks 1.9, Ordered parts) |
| Dispatches `yeti:slide` with `{ index, slide }`, `bubbles`, `composed`, on the choice and not the arrival | `:38-47` | changed | the `slide` output on `YetiCarousel`, `YetiSlideDetail`; no DOM event (events spec rules 1, 5, and 7). It fires before the scroll ends |
| Does not track the current slide ("the module deliberately does not track it either", `docs.md`) | none | added | the `current` signal and the dot's `aria-current` (A11Y-4) |
| Has no previous and next controls | none | added | `YetiCarouselPrevious` and `YetiCarouselNext` (A11Y-4) |
| Has no slide roles | none | added | `role="group"` and `aria-roledescription="slide"` on each slide (A11Y-4) |

**Tokens subsection** (ADR 0004 consequences; building-blocks 1.13). The carousel reads `--yeti-carousel-dot` (`var(--yeti-color-border-strong)`, `Y/src/tokens/components.css:93`), `--yeti-carousel-dot-size` (`0.75rem`, `:94`), `--yeti-carousel-scroll` (`smooth`, `:95`, and `auto` under reduced motion, `:181`), `--yeti-control-size` (`2.5rem`, `Y/src/tokens/surface.css:19`), `--yeti-space-md` (the default gap), `--yeti-space-xs` (between the dots), and `--yeti-duration-fast` and `--yeti-ease` (the dot's hover growth). The package writes none of them and offers no input, provider, or theme for them. A consumer sets them in a `:root` block, in a **Theme** file after Yeti, or with a runtime `setProperty`; a component token such as `--yeti-carousel-dot` may be set on one carousel (`Y/src/guides/theming.md:38`). A consumer who overrides `--yeti-carousel-scroll` also sets it to `auto` under `prefers-reduced-motion: reduce`, as Yeti's own rule does, after ticket 50 decision 15's pattern for the attention duration. **Private tokens** are never read or written.

### 3. Hierarchy and DI shape

- `YetiCarousel` is a **Coordinating directive** (building-blocks 1.9). It provides `yetiCarouselToken` (`InjectionToken<YetiCarousel>`, `useExisting`), declared with `import type` in the entry point's token file. The track and the slides register with it; the dots, previous, and next read it.
- Every part injects `yetiCarouselToken` as required, with no `optional` flag: building-blocks 1.9 makes a parent token required "when the part cannot exist alone", and Yeti styles every part only under `.carousel >`. Because DI follows the declaration site, the parts are declared in the same template as their carousel host (usage rule 8); a part projected into an Angular component that renders the carousel fails to find the token and throws at creation. `YetiCarouselDots` sets only its marker and injects nothing (Part 2 row 29, "static").
- **Ordered parts:** the slides register in `ngOnInit` and unregister on destroy, and the carousel keeps them in DOM order, as building-blocks 1.9 sets for ordered parts (Aria's `SortedCollection` shape), so a slide added by `@for` or `@if` after load is counted and observed. One track registers; a second is a usage-rule breach (manifest `max: 1`).
- **Current slide:** in its first `afterNextRender`, the carousel creates one `IntersectionObserver` with the track as its root and observes every registered slide; a slide registered later is observed when it registers, and one destroyed is unobserved (Part 2 row 29). The observer callback writes a signal, so `current`, `aria-current`, and the buttons' state refresh zoneless (building-blocks 1.5). The observer is disconnected on `DestroyRef` (building-blocks 1.9, 1.15). Which slide counts as current is section 4's ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 123).
- **Fragment links:** each dot calls `injectSameDocumentHref(fragment)` from `ngx-yeti/fragment-links` with the fragment of its static `href`, and injects `YetiFragmentLinks` eagerly, as the fragment-links spec has the carousel dot do (its section 3; Part 2 row 51), so bare links elsewhere on a page with a carousel stay same-document once the application is live.
- No host directives. No Yeti item always sits on another's element (Part 2, "Two findings that hold across the matrix"), and no Aria or CDK carousel exists (section 6). A slide that is also a `box` is written `yetiCarouselSlide yetiBox`, beside each other.
- The only other injection is ADR 0060's root styles service, through `injectYetiItemStyles('carousel')` ([setup](setup.md); ticket 50 decision 45).
- **Generated ids and the platform's relationship attributes:** none. The slides are addressed from outside the application by fragment, so their ids are the consumer's (building-blocks 1.5; [generated-ids](generated-ids.md), "A carousel slide ... takes a consumer id"). Previous and next carry no `aria-controls` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 133).

### 4. API

| Member | `YetiCarousel` | `YetiCarouselTrack` | `YetiCarouselSlide` | `YetiCarouselDots` | `YetiCarouselDot` | `YetiCarouselPrevious`, `YetiCarouselNext` |
| --- | --- | --- | --- | --- | --- | --- |
| Selector | `section[yetiCarousel]` (Part 2 row 29) | `[yetiCarouselTrack]` | `[yetiCarouselSlide]` | `[yetiCarouselDots]` | `a[yetiCarouselDot]` | `button[yetiCarouselPrevious]`, `button[yetiCarouselNext]` |
| `exportAs` | `yetiCarousel` | `yetiCarouselTrack` | `yetiCarouselSlide` | `yetiCarouselDots` | `yetiCarouselDot` | `yetiCarouselPrevious`, `yetiCarouselNext` |
| Entry point | `ngx-yeti/carousel` (building-blocks 1.3; ADR 0011 clause 10) | same | same | same | same | same |
| Inputs | `slides: YetiSlides \| undefined` (Yeti default `1`); `gap: YetiGap \| undefined` (`md`); each `input()` with no default value | none | none | none | `yetiCarouselDot: string \| undefined`, the slide's id for a data-driven dot ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 126) | none |
| Outputs | `slide: YetiSlideDetail` ([events](events.md)) | none | none | none | none (building-blocks 1.4: the part detects the choice and the root carries the output) | none |
| Read-only state | `current: Signal<number \| null>`: the index of the slide in view, `null` on the server and until the observer first reports ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 121) | none | none | none | none | none |
| Models, methods | none ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 121) | none | none | none | none | none |
| Host | static `class: 'carousel'`; static `'data-ngx-yeti-item-carousel': ''`; `[attr.data-slides]`, `[attr.data-gap]` from the inputs, `null` when unset | static `'data-track': ''`, `role: 'group'`, `tabindex: '0'` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 127) | static `'data-slide': ''`, `role: 'group'`, `'aria-roledescription': 'slide'` | static `'data-dots': ''` | `[attr.href]`; `[attr.aria-current]`; `(click)` | `[attr.aria-disabled]`; `(click)` |
| Providers | `yetiCarouselToken` | none | none | none | none | none |
| Injection | the ADR 0060 styles service | `yetiCarouselToken` (required) | `yetiCarouselToken` (required) | none | `yetiCarouselToken` (required); `HostAttributeToken('href')` (optional); `YetiFragmentLinks`; `injectSameDocumentHref` | `yetiCarouselToken` (required) |
| Lifecycle | creates the observer in `afterNextRender`, disconnects it on destroy; calls `injectYetiItemStyles('carousel')` as the constructor's last statement (ticket 50 decisions 42 and 45) | registers on creation, unregisters on destroy | registers in `ngOnInit`, unregisters on destroy | none | none | none |

**The dot's click handler**, in order (Part 2 row 29; building-blocks 1.5 and 1.11 clause 5):

1. Return if `event.button` is not 0, or `metaKey`, `ctrlKey`, `shiftKey`, or `altKey` is set (`carousel.js:14-16`, kept).
2. Find the carousel's registered slide whose `id` equals the decoded fragment. Return if there is none, or if no track has registered, leaving the click to the browser (`carousel.js:21-23`, kept).
3. Read the track's computed `direction`, its box, and the slide's box, and call `track.scrollTo({ left: track.scrollLeft + (rtl ? target.right - own.right : target.left - own.left) })` with no `behavior` (`carousel.js:34-36`, kept).
4. Emit the carousel's `slide` with `{ index, slide }`, `index` being the slide's position in the DOM-ordered collection (`carousel.js:42-46`).
5. Call `event.preventDefault()` last (building-blocks 1.5).

It does not check `event.defaultPrevented` (section 2, Module replaced; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 125). How the part makes the root emit is internal: it calls the root's emitter through the token, and no public member is added for it.

**The previous and next handlers** (Part 2 row 29: "scrolling to the adjacent slide"; the rules below are this spec's reading; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 124):

1. Find the step's starting slide: the slide most recently chosen by a dot, previous, or next while the observer has not yet reported it in view; otherwise the slide at the start edge, measured from the boxes at click time, the same measurement as the dot's.
2. The target is the next or the previous slide in DOM order. If there is none, return: no wrap-around, because the carousel does not rotate.
3. Scroll to the target with the dot's formula, emit `slide` with the target, and leave focus on the button ("Activating the rotation control, next slide, and previous slide do not move focus", `APG/.../carousel-pattern.html:93`). The handler calls no `preventDefault()`: a `button type="button"` has no default action to cancel.

**`current`** (Part 2 row 29: "a `current` signal from an `IntersectionObserver` over the slides with the track as root, created in `afterNextRender`"): the index of the first slide, in DOM order, that the observer reports at least half inside the track, which with `scroll-snap-align: start` is the slide at the start edge; `null` on the server, before the first callback, and when no slide qualifies ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 123). It follows arrival, not choice: after a dot click it changes when the scroll brings the slide in, while `slide` has already fired.

**`aria-current` and `aria-disabled`:** a dot binds `aria-current="true"` while its slide is `current()`, else nothing. Previous binds `aria-disabled="true"` while `current()` is `null` or `0`. Next binds it while `current()` is `null` or the last slide is at least half in view, because the track cannot scroll further. Both are computed from the observer's signal, so the server HTML and the client's first render carry the same values: no `aria-current` on any dot, and `aria-disabled="true"` on both buttons ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 123 and 124).

**Data-driven dots** ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 126). A dot's fragment comes from the consumer's static `href="#id"`, read once through `HostAttributeToken('href')` (ticket 50 decision 4). Inside `@for`, a static `href` cannot carry each slide's id, and an interpolated `href="#{{ id }}"` is a binding, which `HostAttributeToken` does not see and which competes with the directive's own `[attr.href]`. The spec's reading: `YetiCarouselDot` also takes a selector-named input, `yetiCarouselDot: string | undefined`, the slide's id without `#`, passed to `injectSameDocumentHref` as a signal (the fragment-links spec accepts "a string or a signal of one", its section 4). When the input is set, the consumer writes no `href`; when it is unset, the static `href` is read as above. The host attribute token is injected with `optional: true` for that reason. Without this input, a carousel built from data could not use the dots.

No input default differs from Yeti's (ADR 0070 rule 1). A static attribute type-checks as a string literal under `strictTemplates`, so `slides="2"` compiles and `slides="5"` does not (ADR 0070 rule 2).

**Usage rules** (numbered here and in the directives' JSDoc; the first milestone reports no breach, map, Milestones):

1. Put `yetiCarousel` on a `section` (the selector requires it), named with your own `aria-label` or `aria-labelledby`, and write `aria-roledescription="carousel"` yourself, in your page's language (manifest `a11y`; APG `carousel-pattern.html`, Basic carousel elements). The name does not contain the word "carousel".
2. Write exactly one `yetiCarouselTrack` as a direct child of the carousel, named with your own `aria-label`. Do not write `role` or `tabindex` on it: the directive renders them ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 127).
3. Write two or more slides as direct children of the track, each with `yetiCarouselSlide`, a unique `id` that its dot links to, and a name: `aria-label` ("2 of 5" where no unique name exists, APG `:138-143`) or `aria-labelledby` its heading. The name does not contain the word "slide". Host a slide on a `div`, `section`, `figure`, or `blockquote`, never an `article` or an `li`: `role="group"` is not allowed on those two, and axe's `aria-allowed-role` fails the **Story gate** ([aria-carousel findings](../prototypes/aria-carousel/README.md) point 4, measured; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 129). Never put `inert` or `hidden` on a slide ([ADR 0024](../adr/0024-carousel-slides-are-not-inert-before-live.md)).
4. The dots list is a direct child of the carousel: an `ol` (or `ul`) with `yetiCarouselDots` and your own `role="list"`, as Yeti's examples write it, holding one `li` per slide with one `a yetiCarouselDot href="#<slide id>"`. Name each dot with a `span yetiVisuallyHidden` inside it or an `aria-label` (manifest `children[2]`). Write the `href` as a static fragment, or, for dots rendered with `@for`, bind the slide's id to `[yetiCarouselDot]` and write no `href` (section 4, Data-driven dots; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 126). Never bind `[href]`, `[attr.href]`, or `routerLink` on a dot, and never interpolate its `href` ([fragment-links](fragment-links.md) usage rule 2; ticket 50 decision 4).
5. Write previous and next yourself, as `<button type="button" yetiCarouselPrevious>` and `<button type="button" yetiCarouselNext>` with visible text or an `aria-label`, inside the carousel but outside the track and the dots list. `yetiButton` beside them is welcome; Yeti's button styles `aria-disabled="true"` as disabled (`Y/src/components/button/button.css:88`). Do not write or bind `aria-disabled` on them, nor `disabled`, which would take the focused button out of the Tab sequence.
6. Put nothing essential on a slide a reader has to find (manifest `a11y.notes`). Do not add autoplay: the package offers none, and a rotating carousel needs the APG's rotation control.
7. Do not write `class="carousel"`, `data-slides`, `data-gap`, `data-track`, `data-slide`, `data-dots`, `aria-current`, or `data-ngx-yeti-item-carousel` on any host. The directives render them, and hydration writes a static attribute back before the binding wins (ADR 0003 points 1 and 2; building-blocks, "Hydration constraints (2026-10-03)"). The one exception is the dot's static `href` (usage rule 4). A value newer than the Pin goes through `$any` (ADR 0070).
8. Declare every part in the same template as its carousel host, and keep the whole carousel inside one **Hydration boundary**: a consumer `@defer` wraps the whole carousel, never part of it (building-blocks 1.11 decision 6).
9. Bind `slides` and `gap` from values that are the same on the server and the client.
10. Import every carousel directive your template writes. A **Forgotten import** renders the element bare with no error, unless an input is bound (`[slides]`, NG8002) or a template reference names an `exportAs` (NG8003) (building-blocks 1.9). A forgotten `YetiCarouselTrack` leaves the slides stacked, and a forgotten `YetiCarouselDot` leaves a bare `#id` link that reloads under a subpath `<base href>`.
11. To announce the slides in another language, write your own `aria-roledescription` on each slide (for example with `i18n-aria-roledescription`); a static attribute you write replaces the directive's ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 130).

### 5. Material comparison

Material has no carousel, and neither has CDK nor Aria (ticket 17 section 4.9, checked; Part 2 row 29).

| Aspect | ngx-yeti `carousel` | Angular Material, CDK, and Aria |
| --- | --- | --- |
| Carousel | directives on the consumer's scroll-snap markup | none |
| Slide picker | fragment-link dots, one Tab stop each (the APG's grouped picker, `carousel-pattern.html:110`) | Aria Tabs (`ngTabs`, `ngTabList`, `ngTab`, `ngTabPanel`), measured and rejected: `inert` slides and `tabindex="-1"` tabs in the server HTML, no scroll, and a selection that does not follow a swipe ([aria-carousel findings](../prototypes/aria-carousel/README.md)); `MatTabGroup`'s pagination arrows are not a carousel |
| Roving focus | none: every dot is a link in the Tab sequence | `FocusKeyManager` (`NC/src/cdk/a11y/key-manager/focus-key-manager.ts:22`), not used for that reason (Part 2 row 29) |
| Announcement | the dot's `aria-current`; no live region ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 128) | `LiveAnnouncer` (`NC/src/cdk/a11y/live-announcer/live-announcer.ts:37`), not used: there is no auto-rotation (Part 2 row 29) |
| Direction | the track's computed `direction` in the click handler (building-blocks 1.5) | `Directionality` (`NC/src/cdk/bidi/directionality.ts:43`), not used: scroll geometry follows the track's CSS direction (Part 2 row 29) |
| Event | `slide` output with Yeti's frozen keys | Material's change events carry a source component; not adopted ([events](events.md) section 5) |

### 6. Implementation level and primitives

Native platform, level 1 (scroll snap, `scroll-behavior`, fragment links, `<button>`, `<a>`), with custom Angular parts for the APG additions (Part 2 row 29). The reason, row 29's: "scroll snap, `scrollTo`, and `IntersectionObserver` are inside the target; what the APG adds is markup and three bindings". The user chose "Custom: links + prev/next (Recommended)" for the carousel's picker after tickets 29 to 34 (map, Standing rulings; building-blocks "Aria decisions (2026-10-03)" row 29), following their rule: "Generally, only reach for Angular Aria when it addresses an accesibility feature that Yeti is missing. If Angular Aria itself introduces accessibility or SSR/hydration issues or violates any other constraint, first see if it can be modified to fit using other patterns like directive composition. If fitting Angular Aria doesn't seem possible and CDK does not provide a suitable alternative either, add custom, modern Angular-native code." Aria Tabs broke ADR 0024 point 1 by itself, and fitting it by composition left a Tab stop that does not follow a swipe without private API ([ticket 30](../issues/30-prototype-fitting-aria-by-directive-composition.md); [ticket 32](../issues/32-research-aria-directives-on-yetis-own-markup.md): "custom (row 29)"). CDK offers no carousel, and its `FocusKeyManager`, `LiveAnnouncer`, and `Directionality` are not used (section 5). `IntersectionObserver`, `scrollTo`, and `getComputedStyle` are inside the browser target (building-blocks 1.2).

### 7. Accessibility (WCAG 2.2 AA), ARIA, and keyboard

- **APG pattern:** Carousel, the grouped style with link pickers (building-blocks 1.10: "the carousel is Carousel"; `APG/content/patterns/carousel/carousel-pattern.html`). The root is a named `section`, a region landmark, with the consumer's `aria-roledescription="carousel"` (`:117-127`). Previous and next are native buttons (`:129`). Each slide is `role="group"` with `aria-roledescription="slide"` and a name (`:136-143`). The picker is a series of Tab stops (`:110`). Three deviations from the grouped style are stated, not closed, because ADR 0024 point 2 keeps Yeti's links ([aria-carousel findings](../prototypes/aria-carousel/README.md) point 4): the pickers are links, not buttons; the dots list has no group name (`:175`); and the current picker carries `aria-current="true"`, not the APG's `aria-disabled` (`:182`).
- **Roles and states:** the root's region role comes from the named `section`; the track is `role="group"` with the consumer's name (manifest: "a group rather than a region because the carousel itself is already the landmark"); each slide is a named `group` with the role description; the dots are a list of named links; `aria-current="true"` marks the dot of the slide in view; `aria-disabled="true"` marks an unavailable previous or next.
- **Live region:** the track binds no `aria-live` ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 128). Part 2 row 29 left "whether it binds `aria-live=\"polite\"`, the APG's live region when there is no auto-rotation" to this spec. The APG makes it optional (`:147-150`). Scrolling a snap track changes no DOM, so a live region on it has nothing to announce (inferred, not measured with a screen reader).
- **Out-of-view slides once live:** they stay reachable; the package adds no `inert` after hydration either ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 122). ADR 0024 point 1 allows it only from the first render callback, and no record adds it.
- **Keyboard:** every key in the table is the platform's. The carousel declares no `keydown` handler, because the APG's key table for a carousel without tabs is Tab and the button pattern (`carousel-pattern.html:85-93`), which native links, buttons, and a focusable scroller already give (building-blocks 1.5, Keyboard).

| Key | Where | Result |
| --- | --- | --- |
| Tab, Shift+Tab | page | the track, the focusable content of the slides, each dot (Chromium, Firefox), and previous and next, in DOM order. WebKit skips the dots by default, so Tab there goes track, Previous, Next ([aria-carousel findings](../prototypes/aria-carousel/README.md), measured) |
| ArrowLeft, ArrowRight | the focused track | the browser scrolls the track, which snaps (manifest `a11y.keyboard`; ticket 17, measured) |
| Enter | a dot | the native `click`: the track scrolls to the dot's slide, with no history entry once the application is live |
| Enter, Space | previous, next | the native `click`: the track scrolls one slide that way; focus stays on the button |

- **Focus:** nothing moves focus. A dot keeps focus after its click, as a link does when its default is prevented; previous and next keep focus (APG `:93`). Tabbing to a control inside a slide out of view scrolls it into view natively (inferred).
- **WebKit:** WebKit's Tab skips links unless the reader turns on Safari's "Press Tab to highlight each item" or presses Option+Tab. The package adds no `tabindex` to the dots, which would override that preference; previous, next, and the focusable track are the keyboard path there ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 132).

WCAG 2.2 AA criteria the item touches, and how each is met:

| Criterion | How it is met |
| --- | --- |
| 1.3.1 Info and Relationships | Slides are named groups with a role description; the dots are a list; the track is a named group inside the named region (A11Y-4). No slide is `inert` or `hidden` while it can be scrolled into view (ADR 0024). |
| 1.4.3 Contrast (Minimum) | Slide content is the consumer's; play functions assert 4.5:1 on the story's slide text in both schemes (ticket 50 decision 8). |
| 1.4.10 Reflow | Each slide takes a share of the track's width and wraps its own text; the horizontal scroll is the carousel's interaction, not two-dimensional reading. Layer 4 asserts no page overflow at a 320 px viewport. |
| 1.4.11 Non-text Contrast | The dot's circle identifies the control: play functions assert at least 3:1 between `--yeti-carousel-dot`'s painted colour and the carousel's background, light and dark. A failing pair gets a ledger row and one package rule after the A11Y-10a pattern (ticket 50 decision 8). The focus ring is Yeti's base style. |
| 2.1.1 Keyboard | The track is focusable and scrolls with the arrow keys; dots are links; previous and next are buttons; in WebKit, previous, next, and the track cover the dots' function. |
| 2.2.2 Pause, Stop, Hide | Not applicable: nothing moves on its own (building-blocks 1.10). |
| 2.4.3 Focus Order | DOM order; no control moves focus. |
| 2.4.4 Link Purpose (In Context) | Each dot's name says which slide it shows (usage rule 4). |
| 2.4.7 Focus Visible | Yeti's ring on the track, the dots, and the buttons; the Story gate and layer 4 check it. |
| 2.4.11 Focus Not Obscured (Minimum) | A focused control inside a slide is scrolled into view by the browser; nothing sticky covers the track. |
| 2.5.7 Dragging Movements | Swiping is the platform's scroll; dots, previous, and next are single-pointer alternatives. |
| 2.5.8 Target Size (Minimum) | Each dot is `--yeti-control-size`, `2.5rem` by default; play functions assert at least 24 by 24 CSS pixels. Previous and next are the consumer's buttons; a `yetiButton` meets it. |
| 4.1.2 Name, Role, Value | Slides, dots, the track, and the buttons carry names from the consumer; `aria-current` and `aria-disabled` state what is current and unavailable. Play functions assert non-empty computed names. |

**Ledger rows owned:** A11Y-4 ([ledger.md](../ledger.md)). This spec confirms its building blocks (`IntersectionObserver` in `afterNextRender`, host bindings) and its tests; its "What the package adds" cell records the spec's readings: no `aria-live` on the track, `aria-current` absent until the observer reports, previous and next `aria-disabled` at the ends and until live, and previous and next as the keyboard path in WebKit ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 134). Like-for-like replacements of `carousel.js` (the history-free dot, `slide`) are not ledger rows (ADR 0040 consequences). The carousel's dot under `<base href>` is part of A11Y-16, owned by [fragment-links](fragment-links.md). **Forced colours:** the dot is a `::before` circle painted with `background-color`, which forced-colours mode may replace with the canvas colour, leaving only the focus ring (inferred, not measured). No ledger row and no package CSS now; layer 4 asserts that the dots stay visible under `forcedColors: 'active'`, and if they do not, a ledger row owned by `carousel` and one `@layer ngx-yeti` rule follow, after ticket 50 decision 88's pattern (ticket 50 decision 131).

**Manual release check** (ADR 0015 point 7): with a screen reader in each engine, that a slide is announced with its name and "slide", that the dot of the slide in view is announced as current, and that previous and next are announced as unavailable at the ends.

### 8. Rendered HTML

Consumer markup on a route `/gallery` of an application under `<base href="/sub/">`, after Yeti's example, with the slides moved from `article` to `div` (usage rule 3):

```html
<section yetiCarousel aria-roledescription="carousel" aria-label="Featured work" i18n-aria-roledescription i18n-aria-label (slide)="chosen.set($event.index)">
  <div yetiCarouselTrack aria-label="Slides" i18n-aria-label>
    <div yetiCarouselSlide yetiBox surface="raised" yetiBorder id="work-1" aria-label="1 of 3"><h3 i18n>A trail map</h3><p i18n>Printed in two colors.</p></div>
    <div yetiCarouselSlide yetiBox surface="raised" yetiBorder id="work-2" aria-label="2 of 3"><h3 i18n>A field guide</h3><p i18n>Three hundred pages.</p></div>
    <div yetiCarouselSlide yetiBox surface="raised" yetiBorder id="work-3" aria-label="3 of 3"><h3 i18n>A season of posters</h3><p i18n>Twelve of them.</p></div>
  </div>
  <ol yetiCarouselDots role="list">
    <li><a yetiCarouselDot href="#work-1"><span yetiVisuallyHidden i18n>Slide 1</span></a></li>
    <li><a yetiCarouselDot href="#work-2"><span yetiVisuallyHidden i18n>Slide 2</span></a></li>
    <li><a yetiCarouselDot href="#work-3"><span yetiVisuallyHidden i18n>Slide 3</span></a></li>
  </ol>
  <div yetiCluster>
    <button type="button" yetiButton yetiCarouselPrevious i18n>Previous slide</button>
    <button type="button" yetiButton yetiCarouselNext i18n>Next slide</button>
  </div>
</section>
```

Server HTML and the hydrated DOM at hydration are the same:

- The `section` carries the consumer's attributes, `class="carousel"`, and `data-ngx-yeti-item-carousel=""`, and no `data-slides` or `data-gap`.
- The track carries `data-track=""`, `role="group"`, `tabindex="0"`, and the consumer's `aria-label`.
- Each slide carries the consumer's `id` and `aria-label`, `data-slide=""`, `role="group"`, `aria-roledescription="slide"`, the `box` attributes, and no `inert` and no `hidden` (ADR 0024).
- The list carries `role="list"` and `data-dots=""`.
- Each dot carries `href="/sub/gallery#work-1"` (the current path and query plus the fragment, [fragment-links](fragment-links.md) section 4), a `jsaction` for `click`, and no `aria-current`.
- Previous and next carry `aria-disabled="true"`, `class="button"` from `yetiButton`, and a `jsaction` for `click`.
- `<head>` holds the item link: `rel="stylesheet"`, `href` `<url>components/carousel/carousel.css?v=<pin>` with `url` defaulting to `yeti-css/` relative to `<base href>`, `data-ngx-yeti-styles="carousel"`, `data-ngx-yeti-app="<APP_ID>"`, `data-beasties-skip`, and the `CSP_NONCE` when one is provided, in Yeti's order (`Y/src/yeti.css:60`, after `tooltip` and before `demo`) (ADR 0060 points 2, 3, and 5).

After the first observer callback, with the track at its start: the first dot carries `aria-current="true"`, Previous keeps `aria-disabled="true"`, and Next has no `aria-disabled`. After a click on the third dot with `slides` unset: `slide` has fired with `{ index: 2, slide: <the third div> }`, `history.length` and `location.hash` are unchanged, and once the scroll arrives the third dot carries `aria-current="true"` and Next carries `aria-disabled="true"`.

The delta from Yeti's docs markup: the consumer writes the directive attributes where the docs write `class="carousel"` and the three markers; leaves out `role="group"` and `tabindex="0"` on the track; uses a `div`, `section`, `figure`, or `blockquote` for each slide and names it; and adds the previous and next buttons. The directives add the slides' role and role description, the same-document `href`, `aria-current`, and `aria-disabled`.

### 9. Animation

- **Scrolling is Yeti's CSS.** The track's `scroll-behavior: var(--yeti-carousel-scroll)` makes a dot's or a button's `scrollTo` smooth, and the token collapses to `auto` under `prefers-reduced-motion: reduce`, so the jump is instant there (building-blocks 1.6 rule 4; `carousel.js:28-33`). The package passes no `behavior`, so the preference reaches the track through the token.
- **The dot's hover growth** is Yeti's transition on `::before` (`carousel.css:55-57`), over `--yeti-duration-fast`, which collapses under reduced motion (`Y/src/tokens/motion.css`).
- **No `animate.enter` or `animate.leave`:** nothing is inserted or removed by the package, and a server-rendered carousel never takes `animate.enter` (ADR 0011 clause 12).
- **Completion:** none. `slide` is a choice output and fires before the scroll ends (events spec rule 7); `current` follows the arrival through the observer. The package awaits no `scrollend`.

### 10. Rendering modes

- **Server output and first paint:** the static class and presence attribute, the bound `data-*` attributes, the three static markers, the track's role and `tabindex`, the slides' role and role description, the dots' same-document `href`s, the buttons' `aria-disabled="true"`, the consumer's names, `jsaction` on the dots and buttons, and the item link in `<head>` (section 8). Everything at first paint is a host binding (ADR 0011 clause 1). Nothing is **Pre-hydration state**: no person and no Yeti mechanism changes any attribute the directives bind (ticket 26 rows 104 to 108); the scroll position a person changes before hydration is the browser's.
- **Before hydration:** no directive creates a node, reads layout, starts an observer, or touches `window`, `history`, or `location` (ADR 0011 clauses 1 and 4). The track snaps and scrolls, and a dot follows its same-document fragment natively: the track scrolls to the slide, the URL takes the fragment, and one history entry is added, which is the stated residue (Part 2 row 29, rule 1.11; [aria-carousel findings](../prototypes/aria-carousel/README.md) point 3b, measured). The page may also scroll vertically to bring the slide into view (inferred; layer 4 records it). Previous and next do nothing.
- **Full hydration:** every host is claimed as it is; bindings computed from the same inputs and the same `null` signal give the same values. Then the observer starts in `afterNextRender`, and `aria-current` and the buttons' state follow the slide in view, including one a reader scrolled to before hydration.
- **Event replay:** the dot's and the buttons' `click` host listeners are on Angular's replay list. A dot click before full hydration has already navigated natively; once hydrated, the replayed click reaches the handler, which scrolls to where the track already is, emits `slide` late but once, and calls `preventDefault()` last, so a throw during replay skips nothing (events spec, Rendering modes; building-blocks 1.11). Ticket 29's prototype measured no `slide` for such a click and did not pin the cause; layer 4 measures the specified handler ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 125). A previous or next click before hydration replays and scrolls one slide. `slide` itself never replays (ADR 0011 consequences).
- **Incremental hydration (`@defer (hydrate on ...)`):** the server rendered the carousel and its link; a dehydrated host holds the link while it is on the page (ADR 0060 point 4). A dot click inside the dehydrated block is held: Angular's dispatcher calls `preventDefault()` on a click whose action element is an `<a>` with `jsaction` (`NGP/core/primitives/event-dispatch/src/dispatcher.ts:83-85`, `:127-140`; ADR 0011 clause 3), so the native navigation does not happen and the click replays to the handler when the block hydrates, which scrolls with no history entry and emits `slide`. With `hydrate on interaction` the click is also what hydrates the block. That the click is not lost relies on the handler not checking `defaultPrevented` (section 4; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 125); layer 4 measures it.
- **`hydrate never`:** the carousel is its server HTML and stays styled while its host is connected (ADR 0060 point 4; ADR 0045). The track scrolls and snaps, and the dots follow their fragments natively with one history entry each ([aria-carousel findings](../prototypes/aria-carousel/README.md) point 3c, measured). No dot carries `aria-current`, so none goes stale, and previous and next stay `aria-disabled="true"` and do nothing. `slide` never fires. This is the stated residue.
- **Client-only `@defer`, `@if`, routed views:** the directives set up their own elements when created (ADR 0040); the observer starts after the first render. The item file is fetched when `YetiCarousel` is constructed, which can show the slides stacked for a few frames; the consumer closes the gap with `provideYetiStyles({ preload: ['carousel'] })` (ADR 0060 point 6; [setup](setup.md)).
- **`withI18nSupport()`:** the root's label and role description, the track's label, the slides' names and content, the dot names, and the button text are the consumer's, translated with `i18n` and `i18n-<attribute>`, which needs `withI18nSupport()` to hydrate rather than re-render (ADR 0011 clause 11; building-blocks 1.11 decision 11). The directives add no `i18n` block. The one string they render, the static `aria-roledescription="slide"`, is replaced by the consumer's translated attribute (usage rule 11; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 130).
- **Zoneless:** inputs are `input()` signals read by host bindings; the observer callback writes a signal; `slide` is an `output()` emitted from a host listener (map, Standing rulings, item 43; building-blocks 1.5; events spec rule 11).
- **JavaScript off under SSR and prerendering** (map, Standing rulings, 2026-10-03, JavaScript off; ADR 0011 consequences): the carousel is styled, named, and readable; the track is focusable, swipes, snaps, and scrolls with the arrow keys; every slide is reachable; and each dot follows its same-document fragment to its slide without a reload ([ticket 18](../issues/18-prototype-yeti-rendering-modes.md) and [aria-carousel findings](../prototypes/aria-carousel/README.md), measured). Lost: the history-free dot (each dot adds a history entry and sets the hash), the current-slide mark, and previous and next, which stay `aria-disabled="true"` and do nothing. The package cannot leave the buttons out of the server HTML, because no output may branch on the platform (hydration constraints). A client-only application gets no such promise.
- **Hydration boundary:** the root, the track, the slides, the dots, and the buttons belong in one boundary (usage rule 8), because every part reaches the root through the token and the observer lives on the root.

### 11. Hydration constraints

The item complies with each of Angular's hydration constraints (map, Standing rulings, 2026-10-03, item 54):

- **Same DOM on the server and the client:** the class, presence attribute, markers, roles, role description, and `tabindex` are static; `data-slides` and `data-gap` come from inputs whose values usage rule 9 keeps equal; the dot's `href` is computed from the same URL on both ends; `aria-current` and `aria-disabled` are computed from a signal that is `null` on both ends until the observer's first callback, after hydration.
- **No direct DOM manipulation:** before hydration, nothing. After hydration, the handlers call `scrollTo` and `preventDefault()`, imperative calls building-blocks 1.5 allows in a handler; the observer only writes a signal. No directive writes an attribute outside its host bindings. ADR 0024's "no `inert` or `hidden`" holds in every mode, because nothing writes either.
- **Valid HTML:** the directives change no element. The consumer's markup must be valid: a `div` slide inside a `div` track, `li` children of the dots list, and buttons outside the list.
- **`preserveWhitespaces`:** the directives have no template. White-space-only text in the track or the dots list is not a flex item, and Yeti's selectors match elements only.
- **No output branched on the platform:** none. The buttons render on both sides, `aria-disabled` until live.
- **Static attributes the directives bind:** usage rule 7 keeps the consumer from writing them. The dot's static `href` is the one documented exception: it is read once and the bound value is written in the same hydration pass (ADR 0023's 2026-10-03 note; ticket 50 decision 4).

### 12. Single-page application

- **Fragment links:** the dot renders a same-document `href` through `injectSameDocumentHref`, which follows `Location.onUrlChange`, so a dot is never a bare `#id` under `<base href>` and follows the URL when the Router reuses the component ([fragment-links](fragment-links.md); building-blocks 1.15: "the carousel dot's directive scrolls the track and fires `slide` as `carousel.js` did, with no history entry"). Its handler calls `preventDefault()`, so `YetiFragmentLinks`'s document listener leaves the click alone (fragment-links section 11).
- **Deep links:** loading a URL whose fragment is a slide's id scrolls the track to that slide natively (inferred; the server never sees the fragment, building-blocks 1.11 decision 8), and the observer then marks its dot. The package does not scroll on load.
- **Navigation:** the carousel opens no top-layer panel, so it uses no [navigation-close](navigation-close.md). A carousel inside a routed view leaves with the route; its observer is disconnected and its registrations removed on destroy. The item link is removed in the animation frame after no `[data-ngx-yeti-item-carousel]` host is connected (ADR 0060 point 4; ADR 0045), and a route that renders a carousel again re-inserts it.

### 13. Item file

`yeti-css/css/components/carousel/carousel.css`, one of Yeti's 49, loaded as a counted `<link>` by the root styles service of ADR 0060: acquired when the first `section[yetiCarousel]` is created, on the server too, inserted in Yeti's order (`Y/src/yeti.css:60`), and removed after the last host carrying `data-ngx-yeti-item-carousel` has left the DOM. `YetiCarousel` calls `injectYetiItemStyles('carousel')` as the last statement of its constructor ([setup](setup.md); ticket 50 decisions 42 and 45). The parts acquire nothing (section 2). The consumer's part is ADR 0060 point 11's setup, which the [setup](setup.md) spec owns. Cross-item files acquired: none (`carousel.css` has no cross-item rule; ADR 0060 point 9). Items the consumer writes inside the carousel (`yetiBox`, `yetiVisuallyHidden`, `yetiButton`, `yetiCluster`) acquire their own files.

## Testing Decisions

A good test asserts what a reader or a consumer observes: the class, attributes, markers, roles, and names in the DOM; the item link; where the track's scroll lands against the slide's box; `history.length` and `location.hash`; that `slide` fired once with its payload; `aria-current` and `aria-disabled` after each step; and where focus is. It never asserts a private field, the observer's options, or how the styles service counts. No test depends on a public token's default value or on a manifest default ([ADR 0006](../adr/0006-yeti-pinned-develop-commit-vendored-and-gated.md); ADR 0015 point 3): a gap is compared with a probe styled with `var(--yeti-space-md)`, and a dot's size with a probe of `var(--yeti-control-size)`, as Yeti's own test reads tokens with its `token()` helper. Every test runs zoneless (map, Standing rulings, item 43). The four layers are [ADR 0014](../adr/0014-testing-stack-for-yeti.md)'s.

### Layer 1: story play functions (`npx nx test-storybook <lib>`)

Every story loads the always-loaded group globally and the `carousel` item file through the directive, as a consumer would (ADR 0014 point 1). Axe runs on every story with the six tags and `parameters.a11y.test = 'error'` (the **Story gate**). Each play function asserts that no `yeti:*` event reached a `document` listener (events spec, layer 1). Story ids:

- `carousel--default`: section 8's markup. Asserts the class, presence attribute, markers, the track's `role` and `tabindex`, each slide's `role="group"` and `aria-roledescription="slide"` and no `inert` or `hidden`, each dot's `href` ending `#work-n`, non-empty computed names for the region, track, slides, dots, and buttons; one slide as wide as the track within 1 px; each dot's box at least 24 by 24 CSS pixels and equal to a `var(--yeti-control-size)` probe within 1 px; 3:1 between the dot's painted colour and the background and 4.5:1 on the slide text, in light and, with `color-scheme: dark` on the story root, dark (ticket 50 decision 8). After the first observer callback: the first dot has `aria-current="true"`, Previous has `aria-disabled="true"`, Next has none. Clicks the third dot: `slide` fired once with `index` 2 and the third slide; `history.length` and `location.hash` unchanged; once the scroll settles, the third slide's start edge is within 1 px of the track's, the third dot has `aria-current`, and Next has `aria-disabled`. Focus stays on the dot. The events spec names this story id.
- `carousel--previous-next`: presses Next twice with the keyboard, waiting for the scroll between presses: the second slide, then the third, at the start edge; `slide` fired twice with `index` 1 and 2; focus stayed on Next; Next is then `aria-disabled` and a third press emits nothing and does not scroll. Presses Previous: the second slide, `index` 1.
- `carousel--swipe`: scrolls the track to the second slide with `scrollTo` (standing in for a swipe): `aria-current` moves to the second dot, `slide` did not fire, and `current()` read through `#c="yetiCarousel"` in the story's template shows 1.
- `carousel--two-up`: `slides="2"` and `gap="lg"`. Asserts `data-slides="2"` and `data-gap="lg"`; each slide is half the track less a `var(--yeti-space-lg)` probe's width within 1 px (Yeti's own case); the first dot is current and Next becomes `aria-disabled` when the last slide is at least half in view.
- `carousel--inputs`: Storybook controls bind `slides` and `gap`. The play function sets each, asserts the attribute, resets it to unset, and asserts the attribute is gone.
- `carousel--rtl`: `carousel--two-up` inside `dir="rtl"` with four slides. Clicking the third dot brings the third slide's right edge within 1 px of the track's right edge (Yeti's own case).
- `carousel--modified-click`: dispatches a `click` with `metaKey` and one with `button` 1 on a dot. Asserts neither was prevented, no `slide` fired, and the track did not move (Yeti's own case).
- `carousel--no-dots`: a track and previous and next only, as Yeti's fixture has a carousel without dots. Asserts the buttons work and the story gate passes.
- `carousel--localised`: each slide carries the consumer's `aria-roledescription="dias"`. Asserts the attribute is `dias`, not `slide`.
- `carousel--dynamic`: slides and dots from a signal array with `@for`, each dot bound through `[yetiCarouselDot]` with no `href`; each dot's rendered `href` ends with its slide's id; adding a fourth slide and its dot after render makes the fourth dot scroll to it with `index` 3, and removing the first slide shifts every index down by one.
- `carousel--article-slides`: an **Anti-pattern story** with Yeti's `article` slides, which switches off only `aria-allowed-role` and shows why usage rule 3 exists.

### Layer 2: browser-level (`npx nx test <lib>`, `carousel.spec.ts`)

Through `TestBed.createDirective` (map, Standing rulings, Directive testing; ADR 0014's 2026-10-03 note):

- `createDirective(YetiCarousel, { tagName: 'section' })`: the host has class `carousel` and `data-ngx-yeti-item-carousel`, and no `data-slides` or `data-gap`; with `bindings` setting `slides` and `gap`, the attributes follow after `whenStable()`, and binding `undefined` removes them. `current()` is `null`.
- While a `YetiCarousel` fixture lives, one `<link data-ngx-yeti-styles="carousel">` is in `document.head`; after `fixture.destroy()` and an animation frame it is gone; two fixtures share one link until both are destroyed.
- `createDirective(YetiCarouselTrack, { tagName: 'div' })` and `createDirective(YetiCarouselSlide, { tagName: 'div' })` with `yetiCarouselToken` provided by a stand-in: the static markers, roles, `tabindex`, and role description; no presence attribute; no link. Without the token, creation throws (section 3). `createDirective(YetiCarouselDots, { tagName: 'ol' })` renders `data-dots` with no token.
- `createDirective(YetiCarouselPrevious, { tagName: 'button' })` with a stand-in whose `current` is a writable signal: `aria-disabled="true"` at `null` and `0`, none at `1`.

A test host covers what `createDirective` cannot (static attributes read through `HostAttributeToken`, content, and layout), with `provideLocationMocks()` and `APP_BASE_HREF` set to `/sub/`:

- the dot's `href` is the mocked path and query plus `#work-2`, and follows `Location.go` to another path; a dot with `[yetiCarouselDot]` bound and no static `href` renders the same form, and changing the bound id changes the `href`;
- a dot click scrolls the track so the slide's start edge meets the track's (the formula), emits `slide` once with the index and the element, and is prevented; inside a fixture wrapped in `dir="rtl"`, the right edges meet;
- a click whose `preventDefault` throws, standing in for a replayed event, still scrolls and emits (building-blocks 1.12, layer 2), and a click already prevented by a capture-phase listener still scrolls and emits (section 4);
- a dot whose fragment names a slide of another carousel, or no element, is not prevented and emits nothing;
- `current` follows a programmatic scroll of the track, and the dot's `aria-current` with it; a slide added after render is observed; after the host is destroyed, scrolling changes nothing and no observer callback runs;
- template references `#c="yetiCarousel"` and each part's `exportAs` resolve; a static `slides="2"` sets the input; the consumer's own `class` on the root and a slide is kept; a consumer's static `aria-roledescription="dias"` on a slide replaces the directive's `slide` (Angular's merge order, inferred until this test runs).

### Layer 3: node-level and SSR smoke (`npx nx test <lib>`, `carousel.ssr.spec.ts`)

Through the shared `renderServer()` helper with `withI18nSupport()`, the URL `/sub/gallery?view=all`, `APP_BASE_HREF` `/sub/`, and section 8's markup with its `i18n` texts and `slides` bound (building-blocks 1.11 decision 11, 1.12): `whenStable()` resolves; the root renders `class="carousel"`, `data-ngx-yeti-item-carousel`, and `data-slides`; the track renders `data-track`, `role="group"`, and `tabindex="0"`; each slide renders `data-slide`, `role="group"`, and `aria-roledescription="slide"`, and **no slide carries `inert` or `hidden`** ([ADR 0024](../adr/0024-carousel-slides-are-not-inert-before-live.md) consequences); each dot renders `href="/sub/gallery?view=all#work-n"` and no `aria-current`; both buttons render `aria-disabled="true"`; the dots and buttons carry a `jsaction` for `click`; `<head>` holds one item link with `data-ngx-yeti-styles="carousel"`, `data-beasties-skip`, and an `href` ending `components/carousel/carousel.css?v=<pin>`; no `document`, `window`, or `IntersectionObserver` access throws on the server.

The **Contract check** ([ADR 0014](../adr/0014-testing-stack-for-yeti.md) point 3) covers the item through the contract mapping: class `carousel` has `YetiCarousel`; `data-slides` and `data-gap` have inputs whose unions equal the manifest's vocabularies `slides` and `gap`; the markers `data-track`, `data-slide`, and `data-dots` have `YetiCarouselTrack`, `YetiCarouselSlide`, and `YetiCarouselDots`; the event `yeti:slide` has the output `slide` typed with the keys `index` and `slide`. A pin move that adds an attribute, a value, a marker, or an event fails here before any story does.

### Layer 4: Playwright e2e (three engines in CI)

Storybook half, on the layer-1 story ids, after Yeti's own `carousel.spec.js`:

- on `carousel--default`, a real click and a real Enter on the third dot each scroll to it with `history.length` and `location.hash` unchanged, in Chromium, Firefox, and WebKit;
- two dots clicked in quick succession land on the second slide within 2 px (Yeti's WebKit case), and Next pressed twice in quick succession lands on a slide;
- on `carousel--rtl`, the third slide's right edge meets the track's;
- the Tab walk is recorded per engine: track, three dots, Previous, Next in Chromium and Firefox; track, Previous, Next in WebKit (the measured skip); ArrowRight on the focused track scrolls it in every engine;
- a horizontal wheel or touch swipe moves `aria-current` to the slide in view;
- with `emulateMedia({ reducedMotion: 'reduce' })`, the track's computed `scroll-behavior` is `auto` and a dot lands within one frame;
- with `forcedColors: 'active'`, each dot's circle and its focus ring are visible, by a computed-style assertion and a screenshot ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 131);
- at a 320 px viewport, `carousel--default` has no page overflow.

Fixture-app half, built with `outputMode: 'server'`, served under `<base href="/sub/">`, with a `/carousel` route marked `RenderMode.Prerender` and one marked `RenderMode.Server`, each run with JavaScript on and off ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 2; ADR 0011 consequences; ledger A11Y-16, "under `/sub/`: ... carousel dot ...; reload is a failure"):

- hydration logs no `NG05xx` and `componentsSkippedHydration === 0`;
- with JavaScript disabled: the carousel is styled, no slide is `inert` or `hidden`, a dot click scrolls the track to its slide with no reload (a marker on `window` survives) and the URL `/sub/carousel#work-2`, previous and next are `aria-disabled` and do nothing, and `@axe-core/playwright` with the six tags reports no violation;
- with `main.js` held back: a dot click before hydration follows the fragment natively (one history entry, recorded); after the bundle loads, the dot of the slide in view has `aria-current` and `slide` has fired once ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decisions 123 and 125);
- inside `@defer (hydrate on interaction)`: a dot click before the block hydrates ends, after hydration, with the track at the slide, `history.length` unchanged, and `slide` fired once;
- inside `hydrate never`: the carousel stays styled after every live carousel on the page is removed; the dots follow their fragments; no dot has `aria-current`; previous and next stay `aria-disabled`;
- inside a client-only `@defer` block with `carousel` in the preload list: no unstyled frame;
- loading `/sub/carousel#work-3`: the third slide is at the track's start edge and, after hydration, its dot is current; the page's vertical scroll is recorded;
- a `routerLink` to the same component with another parameter updates every dot's `href` (fragment-links case 5);
- navigating from the carousel route to a route without one removes the item link, and navigating back re-inserts it.

Floor engines: [ticket 93](../issues/93-decide-testing-at-the-browser-floor.md) (a weekly and release-branch job; Safari 26.2 held statically).

Prior art: Yeti's `example.html` and `docs.md` for the stories, and its `test/browser/components/carousel.spec.js` with `test/browser/fixtures/components/carousel.html` for the slide widths, the scroll, the history, the quick-succession, the right-to-left, and the modified-click cases; the [aria-carousel prototype](../prototypes/aria-carousel/README.md)'s variant (A), which sketched these directives and measured them in three engines; ticket 18's fixture app; ADR 0060's prototype for the item link; the [fragment-links](fragment-links.md) spec's subpath cases; the [alert](alert.md) spec's part-to-root output and replay-safe handler tests.

## Out of Scope

- Autoplay, a rotation control, and pausing on hover or focus: Yeti's carousel does not rotate (building-blocks 1.10).
- Aria Tabs for the dots, a tabbed carousel, or roving focus over the dots ("Aria decisions (2026-10-03)" row 29; ADR 0024 point 2).
- `LiveAnnouncer`, a live region, or any announcement from code (Part 2 row 29; section 7).
- `inert` or `hidden` on slides out of view, in the server HTML (ADR 0024 point 1) or after hydration (section 7; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 122).
- A visible style for the current dot: Yeti has no rule for it, and the package's CSS is accessibility rules only (ADR 0060 point 8). A consumer may style it in its own stylesheet.
- A `tabindex` on the dots for WebKit (section 7; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 132).
- Wrap-around previous and next, infinite looping, and cloned slides.
- A public method to scroll to a slide, and an index model (section 4; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 121).
- Dispatching a `yeti:slide` DOM event for non-Angular listeners (ADR 0040 consequences: a later decision on request).
- An Angular component that renders the carousel's markup, generated dots, generated slide ids, or generated buttons (ADR 0003 point 6; building-blocks 1.1).
- Any check that the parts are placed, named, or numbered as the usage rules say. Checks belong to a later milestone (map, Milestones).
- How the styles service counts, inserts, and removes links (ADR 0060; the [setup](setup.md) spec).

## Further Notes

### Design decisions

| Decision | Record |
| --- | --- |
| Seven directives: root, track, slide, dots, dot, previous, next | building-blocks Part 2 row 29; ticket 26 rows 104 to 108 |
| Custom Angular on links and buttons, not Aria Tabs | "Aria decisions (2026-10-03)" row 29 (the user's choice); tickets 29, 30, 32, 34; ADR 0024 point 2 |
| No slide is `inert` or `hidden` in the server HTML | ADR 0024 point 1 |
| Markers are kind P: static host attributes, no input | ADR 0070; ticket 26 rows 106 to 108 |
| Inputs typed by Yeti's `YetiSlides` and `YetiGap`; unset renders nothing | ADR 0005; ADR 0070 rules 1 and 2; ADR 0080 point 5 |
| `yeti:slide` becomes the `slide` output on the root, `YetiSlideDetail`, fired on the choice; no DOM event | [events](events.md) sections 2 and 4; ADR 0040 consequences; `carousel.js:38-41` |
| A read-only `current` signal from an `IntersectionObserver` with the track as root, in `afterNextRender` | Part 2 row 29 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 121, on the model 1.4 names) |
| `aria-current="true"` on the dot of the slide in view; none until the observer reports | Part 2 row 29; ledger A11Y-4 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 123, on the server state and the definition) |
| `role="group"` and `aria-roledescription="slide"` on each slide; the name is the consumer's | Part 2 row 29; ledger A11Y-4; building-blocks 1.10 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 130, on the string) |
| Previous and next on consumer-written buttons; no wrap; `aria-disabled` at the ends and until live; they emit `slide` | Part 2 row 29; ledger A11Y-4 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 124) |
| The dot reads its static `href` once and binds a same-document `href` | ADR 0023 point 1 and its note; ticket 50 decision 4; fragment-links |
| A data-driven dot takes its fragment from the selector-named input `yetiCarouselDot` | fragment-links section 4 ("a string or a signal of one"; the source is the owning spec's) ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 126) |
| The dot's handler: modifiers kept, `defaultPrevented` not checked, `preventDefault()` last | `carousel.js:14-16`; building-blocks 1.5 and 1.11 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 125) |
| The scroll formula, computed `direction`, and no `behavior` | `carousel.js:26-36`; building-blocks 1.5 (RTL exception) and 1.6 rule 4 |
| The track's `role="group"` and `tabindex="0"` are static host attributes | manifest `children[0]`; the scroller precedent in Part 2 row 14 ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 127) |
| No `aria-live` on the track | Part 2 row 29 leaves it to this spec ([ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 128) |
| Parts inject `yetiCarouselToken` as required; slides register in DOM order | building-blocks 1.9 |
| No `FocusKeyManager`, `LiveAnnouncer`, or `Directionality` | Part 2 row 29 |
| Only `YetiCarousel` marks its host and acquires the item file | ADR 0045; ticket 50 decision 6 |
| `injectYetiItemStyles('carousel')` last in the constructor | setup spec; ticket 50 decisions 42 and 45 |
| `exportAs` on every directive; no class name collides | building-blocks 1.3; ADR 0080; ticket 50 decision 10 |
| Ledger: owns A11Y-4; the dot's subpath case is A11Y-16's | ledger; Part 2 rows 29 and 51 |
| Directive tests through `TestBed.createDirective` | map, Standing rulings, Directive testing; ADR 0014 note |
| Fixture app `outputMode: 'server'` with prerendered and server routes | ticket 50 decision 2 |

### Usage examples

The carousel with two slides in view and a counter beside it:

```html
<section yetiCarousel #c="yetiCarousel" slides="2" aria-roledescription="carousel" aria-label="Quotes" i18n-aria-roledescription i18n-aria-label>
  <div yetiCarouselTrack aria-label="Quotes" i18n-aria-label>
    @for (quote of quotes(); track quote.id; let i = $index) {
      <blockquote yetiCarouselSlide [id]="quote.id" [attr.aria-label]="(i + 1) + ' of ' + quotes().length"><p>{{ quote.text }}</p></blockquote>
    }
  </div>
  <ol yetiCarouselDots role="list">
    @for (quote of quotes(); track quote.id; let i = $index) {
      <li><a [yetiCarouselDot]="quote.id" [attr.aria-label]="'Quote ' + (i + 1)"></a></li>
    }
  </ol>
  <p>@if (c.current() !== null) { Quote {{ c.current()! + 1 }} of {{ quotes().length }} }</p>
</section>
```

The dots here take their fragment from the selector-named input, because a static `href` cannot be written inside `@for` (section 4, "Data-driven dots"; [ticket 50](../issues/50-decide-open-points-of-the-specs.md) decision 126). The slide's `[id]` binding is the consumer's id from data that is the same on the server and the client; [generated-ids](generated-ids.md) usage rule 3 forbids a bound `id` only on hosts whose directive generates one. The counter is the consumer's own markup.

```ts
import { YetiCarousel, YetiCarouselDot, YetiCarouselDots, YetiCarouselNext, YetiCarouselPrevious, YetiCarouselSlide, YetiCarouselTrack } from 'ngx-yeti/carousel';
import { YetiVisuallyHidden } from 'ngx-yeti/visually-hidden';

@Component({
  selector: 'app-featured-work',
  imports: [YetiCarousel, YetiCarouselTrack, YetiCarouselSlide, YetiCarouselDots, YetiCarouselDot, YetiCarouselPrevious, YetiCarouselNext, YetiVisuallyHidden],
  templateUrl: './featured-work.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedWork {
  protected readonly chosen = signal(0);
}
```

A theme that makes the dots larger and darker on one page, in the consumer's stylesheet: `.featured { --yeti-carousel-dot-size: 1rem; --yeti-carousel-dot: var(--yeti-color-text); }`. A page whose carousel renders inside a client-only `@defer` block preloads the item: `provideYetiStyles({ preload: ['carousel'] })`.

### Styles

Per building-blocks 1.13:

1. **Item file:** `components/carousel/carousel.css`, loaded by `YetiCarousel` as a counted link (section 13). The consumer writes nothing for the item beyond the [setup](setup.md) spec's one-time configuration.
2. **Always-loaded rules relied on:** `tokens/` declares `--yeti-carousel-dot`, `--yeti-carousel-dot-size`, `--yeti-carousel-scroll` with its reduced-motion collapse (`Y/src/tokens/components.css:93-95`, `:178-181`), `--yeti-control-size`, the space scale, and the motion tokens; the base layer draws the focus ring; `layouts/attributes.css` styles `data-surface` and `data-border` on a `box` slide.
3. **Cross-item rules:** none in `carousel.css`. A `box` slide, a `visually-hidden` dot name, `button` controls, and a `cluster` row are separate items with their own files.
4. **Tokens:** reads the tokens of section 2; writes none.
5. **What breaks without the item file:** the slides stack as blocks with no snapping and no horizontal scroll, and the dots are a numbered list of links with empty-looking names (their text is visually hidden). The dots still scroll to their slides, previous and next still scroll the track (which no longer scrolls horizontally, so nothing moves), and every slide stays readable.
6. **Tailwind name collision:** none. [Prototype: the package beside Tailwind v4](../issues/24-prototype-ngx-yeti-with-tailwind-v4.md) found only `container`, `grid`, and `table` (plus the attribute name `hidden`) producing a utility (measured); `carousel` produced none.

### Platform features to adopt when the browser target moves

Not checked against web-features data for this spec; each is adopted when every engine of [ADR 0002](../adr/0002-browser-target-baseline-2025.md)'s target ships it:

- CSS scroll markers (`::scroll-marker`, `::scroll-marker-group`, `:target-current`) and `scroll-target-group` would draw the dots and mark the current one in CSS. Yeti's docs name them: "Browser-drawn scroll markers will one day do this in CSS and report the current slide as well. Today they are in one engine, so the module is the honest answer." When a pin move adopts them, the observer and `aria-current` binding may go.
- `::scroll-button()` would draw previous and next in CSS, replacing `YetiCarouselPrevious` and `YetiCarouselNext`.
- The `scrollsnapchange` event would report the snapped slide directly, replacing the `IntersectionObserver` for `current`.
- `scrollend` would let previous and next base their step on a settled position rather than the last choice.

### Single-page-application pieces relied on

The [fragment-links](fragment-links.md) spec's `injectSameDocumentHref` and `YetiFragmentLinks`; the [events](events.md) spec for `slide`'s name, payload, and rules; the [setup](setup.md) spec's `injectYetiItemStyles` and `provideYetiStyles`. None of [generated-ids](generated-ids.md) or [navigation-close](navigation-close.md).
