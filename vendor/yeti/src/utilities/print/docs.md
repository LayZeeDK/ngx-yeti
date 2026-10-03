## When to use it

Two jobs, and they are opposites.

Something the paper needs and the screen does not: the address behind a link, since a printed link is a dead end; the date a page was printed; a note about where the document came from.

```html
<p class="print">Printed from https://foundationcss.com/guides/visibility</p>
```

Something the screen needs and the paper does not: a share button, a video, a "back to top" link, a cookie banner, a nav bar. Give those `data-print="none"`.

```html
<button class="button print" data-print="none" type="button">Share this page</button>
```

## How it works

Two rules in two media queries. `only`, which is what you get when the attribute is absent, hides the element everywhere but the printed page; `none` hides it on the printed page and nowhere else. Both use `display: none`, and both sit in the utilities layer, which is last in Yeti's cascade order, so a component's own `display` does not win: a `button` really does come off the page.

This is the one place in Yeti where a media query is the right tool. Every width in the framework is a container query, because a rule that switches on the window breaks the moment its element moves into a narrower box. A medium is not a width — no container is ever printed at a different medium from the page around it — so there is no box to measure here and nothing a container query could say.

Print styling stops there. Yeti does not set page margins, force a color scheme, or break pages for you; `@page`, `break-inside` and the rest are yours to write, and this utility is only about which elements are on the sheet at all.

## Accessibility

Both states are `display: none` in the medium they are not for, which takes the element out of the accessibility tree there too. That is the right behaviour for this job, and it has two consequences worth stating.

A paper-only line is not announced on screen. Never put anything a screen reader needs into one — an address a sighted reader can also see is fine, a warning is not. Text that should be heard and not seen is [visually-hidden](visually-hidden.md), which is a different tool for a different question; the [visibility guide](guides/visibility.md) has both side by side.

A screen-only control is not on the page a reader prints. Nothing on paper may depend on it, so a form whose only submit button carries `data-print="none"` has printed a form nobody can return.

`print` and `visually-hidden` do not combine on one element: on screen `print` removes it outright, so there is nothing left for `visually-hidden` to keep announced, and on paper the clip `visually-hidden` applies leaves a blank pixel where the printed content should be.
