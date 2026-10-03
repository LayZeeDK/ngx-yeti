## When to use it

An overlay holds one thing on top of another without taking part in the layout underneath: a "sold out" stamp on a product image, a loading message over a form, a notice over the whole page with `data-fixed`. It is the positioning half of a dialog; the behaviour half is a component's job. Compare `layer`, which stacks all its children in flow and grows to the tallest; an overlay's held child changes nothing about the box.

## How it works

The overlay is the box being covered, so it is positioned, and its plain children flow as usual. The one child carrying `data-over` is absolutely positioned with its top-left corner at the box's center, then translated back by half its own size, which centers it whatever its dimensions. Its maximum width and height are the box's minus a gap on each side, and it scrolls internally rather than growing beyond that. `data-fixed` on the overlay makes the held child `fixed`, so the box it centers on is the viewport.

`data-fill`, on the same child as `data-over`, covers the box instead of sitting centred in it. The gap is the inset a centred child keeps from the edges and a cover has none, so the size caps go with it. That is what a veil, a dimmer or a loading state wants, and it only pays off with something translucent behind it: `--yeti-color-scrim` is the framework's wash for exactly this, the surface thinned so it dims with the theme rather than tinting. On a `stack`, `data-fill` is the layout's own height instead: at least the viewport's.

It positions and nothing else. A veil that wants its own content centred puts a layout inside itself, the way every other layout composes:

```html
<form class="overlay">
	<label for="email">Email</label>
	<input id="email" type="email">
	<div class="cover" data-over data-fill style="background: var(--yeti-color-scrim)">
		<p data-center>Saving…</p>
	</div>
</form>
```

```html
<form class="overlay">
	<label for="email">Email</label>
	<input id="email" type="email">
	<p data-over>Saving…</p>
</form>
```

## Why this name

Overlay is what everyone already calls a thing that lies over other things. Foundation 6's Reveal was the modal; the plain positioning had no name.
