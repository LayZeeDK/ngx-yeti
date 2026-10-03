## When to use it

Words a screen reader needs and the page has no room for: the name of an icon-only button, the number on a carousel dot, the subject of the third "Read more" link on a page.

It is not the `hidden` attribute, and the difference is the whole point — it is also why this is the one class in Yeti with two words in its name. `hidden` takes the element out of the page and out of the accessibility tree with it, so a reader hears nothing. This class takes it out of sight and leaves it in the tree, so a reader hears everything. The [visibility guide](guides/visibility.md) has both, and the ten other ways to hide something, on one page.

```html
<a href="/trail-map.pdf">Read more<span class="visually-hidden"> about the trail map</span></a>
```

## How it works

The old clip-rect recipe, with `clip-path` in place of the deprecated `clip` property. The box is taken out of the flow with `position: absolute`, so it cannot open a gap in the line it sits in; it is sized a pixel square, because some engines drop a zero-size box altogether; and it is clipped to nothing with `clip-path: inset(50%)` and `overflow: hidden`. `white-space: nowrap` stops a long string being wrapped into a one-character column, which some screen readers read out letter by letter.

`display: none` and `visibility: hidden` are both shorter, and both do the one thing this must not: they take the text out of the accessibility tree.

Put only text in here. Everything inside is still in the page, so a link or a button inside would take Tab focus with nothing on screen to show for it, which is worse than either showing it or leaving it out.

## Accessibility

The text is announced in source order and becomes part of the accessible name of whatever contains it, which is what makes a button with a picture on its face and a word inside it a named button.

A control is named once. Where an `aria-label` is present the browser uses that and ignores the text inside, so pick one: the label when the name is a rewording of the content, the hidden text when the name *is* the content and the design has no room for it.

It is a tool of last resort. A control with room for a word should have the word.
