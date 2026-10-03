## When to use it

Use a grid for a collection of like things that should line up in equal cells: cards, thumbnails, team members, products. The grid decides how many columns fit; you decide how narrow a cell may get and, when it matters, how many columns there may be at most.

## How it works

The track list is `repeat(auto-fit, minmax(<min>, 1fr))`, where `<min>` is the larger of `data-min` and the container divided by `data-columns`. Without `data-columns` that second value is zero, so the minimum width alone decides the count. With it, the container split N ways becomes the floor as soon as it is wider than the minimum, so there are never more than N columns, and still fewer when even N would squeeze a cell below the minimum. `data-min="none"` removes the width floor and gives exactly N. `data-min="none"` is meant to be paired with `data-columns`; alone it gives a single full-width column instead of a runaway number of tracks.

```html
<div class="grid" data-columns="4" data-min="none" data-gap="sm">
	<div>Always</div>
	<div>four</div>
	<div>across</div>
	<div>here</div>
</div>
```

Add `data-fold` and the count halves instead of stepping: with `data-min="xs"` and `data-columns="4"` the grid is four across while its content box is at least four `xs` widths, two by two while it is at least two, and a single column below that, never three. The thresholds are the width token's default multiplied by the count, so a theme that changes the token moves the token, not the fold. The closest thing with no container query is two `columns` nested in a third, and it is not the same result: it steps at its own thresholds (inner `sm`, outer `md`) rather than the fold's.

```html
<div class="columns" data-threshold="md">
	<div class="columns" data-threshold="sm"><div>One</div><div>Two</div></div>
	<div class="columns" data-threshold="sm"><div>Three</div><div>Four</div></div>
</div>
```

The fold is one attribute on one element; the nest is two wrappers. Use whichever you would rather explain.

`data-rows` lines up neighbours' parts: with `data-rows="3"` each child is a subgrid of three rows, so every first part sits in row one, every second in row two, and so on, across the row. Give the number of parts the fullest child has; a child with fewer leaves its last rows empty. A card in a grid with rows keeps its picture and footer aligned with its neighbours' and does not switch to its side-by-side row. A child that spans rows cannot also be a size container, because a size container cannot be a subgrid; the card turns its own container off inside such a grid for this reason.

## Tracks

`data-tracks` is the other mode: instead of fitting as many columns as there is room for, the grid has exactly that many equal tracks, two to twelve, and each child is placed on them by line. `data-start` on a child is the column line it begins on and `data-span` how many tracks it covers, both one to twelve. A child with neither flows into the next free track after the child before it and covers one; with only a span it flows the same way and covers that many; with only a start it begins there and covers one. A track nothing is placed on stays empty, which is the point: a wall with a work from line 2 across six tracks and a second from line 9 across four leaves track 1 and track 8 bare.

```html
<div class="grid" data-tracks="12" data-threshold="md">
	<figure data-start="2" data-span="6">The first work</figure>
	<figure data-start="9" data-span="4">The second work</figure>
</div>
```

A tracks grid measures itself, so it is a size container. Below `data-threshold` (`md` when absent), every child takes the whole row, in source order, so the wall reads as a column on a phone; at or above it, the placement applies. `data-tracks` replaces the fitted columns, so `data-min` and `data-columns` do nothing alongside it. It does not mix with `data-fold` either: the fold does nothing on a tracks grid, and `npm run validate` refuses the pair. A grid without `data-tracks` is not a container and none of this applies to it.

## Why this name

It is a grid and nothing else is. Foundation 6 readers: this replaces the Block Grid, and `data-columns="4"` is the intrinsic form of `large-up-4`, with the shrinking at narrow widths handled by the minimum instead of by `small-up-1 medium-up-2`.
