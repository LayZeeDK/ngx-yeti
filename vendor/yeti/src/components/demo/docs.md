## When to use it

Showing a piece of Yeti markup and letting the reader see how it behaves as its box gets narrower. Documentation, a pattern library, a design-system page. Not for content a reader has to have: the box is a demonstration, and the markup should be on the page as code as well.

## How it works

The preview box is a size container the reader can drag narrower and wider: from its bottom corner with the browser's own handle, or, with `demo.js` loaded, by a grip on its end edge. Whatever Yeti markup is inside responds exactly as it would anywhere else, because a Yeti component measures its own box; a card puts its picture beside the text once the box reaches `md`. A bar across the top of the box names the example, from the value of `data-preview`, and at its end a label names the stop the box is at, `xs` through `2xl`, flipping at the same widths the components change. That is the framework's responsive model, applied to itself.

The box can hold the example two ways. On a page that already loads Yeti, put the markup straight in; on any other page, the docs site among them, put an `iframe` in with the example in its `srcdoc` and a link to `yeti.css` and `yeti.js` ahead of it, so nothing from the host page leaks into the example and every module is there. Either way, the box starts at `data-height`'s height, `md` when absent: a frame cannot size to its content, and neither does the box, so a tall example scrolls inside whichever form it's in. `data-resize="both"` lets the reader pull the box taller too, never shorter than the `sm` height; width alone is the default, because width is what the demo is for. `data-width` sets the width the box starts at, using the width vocabulary, so a demo can open at `sm` and lead with the narrow form. That width names the example's own width: the box's edge and, on direct markup, its inset sit outside it, which is why the label in the bar agrees with the attribute, as long as the container is at least that wide. In a narrower container the box is capped at the container, and the label names the capped width instead. The code goes in a `details` under the box, collapsed behind a summary that reads as plain text and underlines when the pointer reaches it.

```html
<figure class="demo" data-width="lg">
	<div data-preview="Card" tabindex="0">
		<article class="card">
			<h2>Direct</h2>
			<p>Plain markup on a Yeti page.</p>
		</article>
	</div>
	<details>
		<summary>View Code</summary>
		<pre><code>&lt;article class="card"&gt;…&lt;/article&gt;</code></pre>
	</details>
</figure>
```

## With the module

A framed demo written by hand carries the example twice, escaped into `srcdoc` and again as code, and the two drift. Load `demo.js` and write the code once: an iframe with no `srcdoc`, or an empty box, is filled from the `pre` under it, with the host page's own `yeti.css` linked ahead of the example, or the stylesheet named in `data-stylesheet`, and `yeti.js` from the folder beside it, so the frame is a whole Yeti page and an example that needs a module has it. Relative picture paths resolve beside that stylesheet too. Without the module the code still shows and the box stays empty, so a page that never loads it loses nothing it wrote. The docs site does not use it: its pages are generated with the frame filled, so they work anywhere, GitHub included.

The module also puts a grip on each box's end edge, a small pill halfway down it, because the browser's own corner is easy to miss, Safari does not draw one on the box at all, and it does nothing for touch or the keyboard. Drag the grip with a mouse or a finger, and the edge follows; focus it with Tab, and the arrow keys step the box to the next or previous width stop, `sm`, `md`, `lg` and so on, with Home and End taking it to its narrowest and widest. Under the pointer, in focus or mid-drag, the grip and the box's whole end edge take the focus color. The browser's corner then handles only height, and only with `data-resize="both"`. Without the module nothing changes: the corner resizes the width, with a mouse or a trackpad.

```html
<figure class="demo">
	<div data-preview="Card"></div>
	<details>
		<summary>View Code</summary>
		<pre><code>&lt;article class="card"&gt;…&lt;/article&gt;</code></pre>
	</details>
</figure>
```

## Accessibility

Give the frame a `title`. Give a box holding direct markup `tabindex="0"`: markup taller than the box scrolls, and a scrollable region must be reachable from the keyboard. A framed box does not need one, because the iframe fills it exactly and it never scrolls. With the module, the grip is a separator in the tab order, named "Resize" and the example's name, that the arrow keys, Home and End move, and it announces the width stop and the width in pixels. Without it the handle is the browser's, which means a mouse or a trackpad; a keyboard or touch reader sees the demo at its starting size. Either way the code is there, and a demo must never be the only place the markup lives. The bar and the stop label are generated content and are not announced: the name in `data-preview` is a visual heading for the box, and the iframe's `title` carries the same name to assistive tech. The bar stays put while direct markup scrolls beneath it.
