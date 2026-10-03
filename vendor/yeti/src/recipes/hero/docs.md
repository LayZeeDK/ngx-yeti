## When to use it

The opening of a landing page: a headline and a call to action on one side, a picture on the other, filling the first screen, or a shorter band with `data-height`, as a cover takes it. Below the threshold the two become rows and the band grows to fit. Write the copy first, so a phone meets the headline before the picture, and use `data-side` to put the picture on the side you want while the two share a row; once stacked the source order holds. The copy must not have an img, video, or picture as a direct child (it would be taken for a second figure).

The two halves share the row equally unless a child says otherwise: `data-span="3"` on the picture beside `data-span="2"` on the copy gives the picture three fifths, the same marker `columns` uses. Below the threshold both are full width. Shares alone squeeze the copy at a middling width, so `data-min` on a child sets the narrowest it may get while side by side, from the width scale: `data-min="sm"` on the copy keeps its buttons in a row and the picture gives way instead. Stacked, it does nothing.

A headline that should grow with the band can carry the [billboard](billboard.md) utility. Make the copy a `container` first, so the line is sized by the column it is in and not by the whole band:

```html
<header class="hero">
	<div class="container">
		<h1 class="billboard" data-fit="xl-display">Build interfaces that read their own container</h1>
		<p>Fifteen layouts, one attribute vocabulary, no breakpoints.</p>
		<a href="#">Get started</a>
	</div>
	<img src="peak.jpg" alt="A snow ridge at first light">
</header>
```

## Built from primitives

A `cover` centers one child in the viewport's height. Give it `columns` carrying `data-center`, and inside the columns a `stack` for the copy and a `frame` for the picture. The threshold on the columns is what turns the two halves into rows.

```html
<header class="cover">
	<div class="columns" data-center data-threshold="lg" data-gap="lg" data-align="center">
		<div class="stack" data-gap="sm">
			<h1>Build interfaces that read their own container</h1>
			<p>Fifteen layouts, one attribute vocabulary, no breakpoints.</p>
			<a href="#">Get started</a>
		</div>
		<div class="frame" data-ratio="4/3">
			<img src="peak.jpg" alt="A snow ridge at first light">
		</div>
	</div>
</header>
```

The one-class form does the same in one element: a wrapping row whose lines are centered in the band's height. Its test measures both forms against each other.

## Why this name

"Hero" is what designers have called the big opening image since the print era, and every framework since Bootstrap 2 has shipped one under that name. The split is the common form; a hero with no picture is a `cover`.
