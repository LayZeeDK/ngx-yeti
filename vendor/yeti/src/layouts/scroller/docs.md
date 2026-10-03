## When to use it

A scroller is for a row that should stay a row: a strip of photos, a set of related cards, a filmstrip of steps. Where a cluster would wrap, a scroller keeps everything on one line and lets the visitor move along it.

## How it works

A flex row that does not wrap, with `overflow-x: auto`. Children are told not to shrink, so the row overflows and the container scrolls. `data-snap` adds scroll snapping so items land cleanly, at their start edge unless `data-justify` says `center` or `end`; `data-width` gives every item the same width so the strip reads as a sequence of equal frames. Because a scrolling region is an interactive one, the markup carries `tabindex="0"` and an accessible name; the validator insists. A media child (an `img`, a `picture`, a `video`, a `canvas`, an `svg`) is also exempt from the base reset's media cap, so one wider than the track overflows it instead of shrinking to fit; `data-width` still sets a child's width when one is wanted. A text child (a paragraph, a list item) is not media, so it keeps the usual prose measure instead of running to one long line. The scroller is a positioned ancestor, so a child positioned absolutely (a `visually-hidden` label in a header cell, say) stays inside the track and scrolls with it, instead of escaping to position against the page.

## Why this name

What the visitor does is scroll, so the layout is a scroller; a name for the mechanism (a reel, a track) would say less. Foundation 6 had no layout for a row that scrolls; people hid the overflow by hand.
