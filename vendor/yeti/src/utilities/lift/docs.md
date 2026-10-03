## When to use it

On something that can be pressed and is big enough for the movement to read: a card that is a link, a tile in a grid of choices, a panel that opens something. On a button it is noise — a button already has a pressed and a hovered state — and on a paragraph it is a lie, because nothing happens when you click it.

```html
<article class="card lift" data-raised>
	<h3><a href="/yeti/" data-stretch>Yeti</a></h3>
	<p>for Websites</p>
</article>
```

## How it works

A transition on `translate` and `box-shadow`, and one rule that raises the element `--yeti-lift-distance` and swaps in `--yeti-lift-shadow`. It answers three selectors: `:hover`, `:focus-visible` on the element itself, and `:has(:focus-visible)`. The third is the one that matters most in practice, because the thing that takes focus is almost always inside — a card's stretched link, a button in a tile — and without it the lift would be an affordance only a pointer ever sees.

`translate` rather than `transform`, so an element that its own component already scales or rotates keeps that.

`data-lift="scale"` grows the element by `--yeti-lift-scale` instead of raising it, with the same deepened shadow. Reach for it on a tile in a row of tiles, where a rise would lift one out of the line; a growth keeps the line and still says "this one". Reduced motion takes the growth to one the way it takes the distance to zero.

## Accessibility

The lift sits on top of a focus ring; it never replaces one. The ring comes from the reset and nothing here touches it.

Reduced motion is answered differently here from everywhere else in Yeti, and on purpose. Everywhere else the animation runs once and ends, so collapsing its duration lands on the end state instantly, which is what was asked for. A hover has no end: its end state is a quarter of a rem up, so a collapsed duration would still move the element, just without the smooth part, and every pass of the pointer would jump the box out from under the cursor and drop it back on the way out. That is more startling than the animation it replaced. So `--yeti-lift-distance` goes to zero instead. The element does not move at all, the deeper shadow carries the whole hover, and the transition that is left has nothing to animate but that shadow.
