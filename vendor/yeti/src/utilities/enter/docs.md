## When to use it

Once, near the top of a page, on the thing the page is about: a row of product cards, a hero's headline, the three panels a landing page is built from. An arrival is a punctuation mark, and a page that punctuates every sentence is harder to read than one that punctuates none. If everything on the page enters, nothing has entered.

## How it works

One animation, one run, ending exactly where the layout already put the element. Every keyframe list names only a `from`, so the `to` is the element's own computed style: `enter` has no opinion about where anything belongs and cannot move it. The animation fills backwards, which means its first frame applies from the moment the element is painted, so nothing has to be given `opacity: 0` by a rule of its own. That detail is what makes the whole utility safe to fail: an element whose animation never runs is visible, not stranded.

`data-enter` picks the arrival. `fade` is the default and is the quietest. `rise` starts `--yeti-enter-distance` below its place, which is the one to reach for when the element is a card or a panel arriving into a row. `scale` starts at `--yeti-enter-scale` of its size, for something that should feel like it landed rather than slid.

`fall` is the rise's opposite, from `--yeti-enter-distance` above, for something that drops into place from a bar or a heading. `slide` comes in from the side, the start edge unless `data-side="end"` says otherwise, and the sides are logical: in a right-to-left page the start edge is the right one, and the slide follows without the markup changing.

`data-stagger` moves the animation down one level: the element itself no longer animates and each of its children does, every one `--yeti-enter-stagger` behind the one before it. Put it on the layout that holds the row, not on the items.

```html
<ul class="grid enter" data-enter="rise" data-stagger data-min="xs" role="list">
	<li class="card"><h3>One</h3></li>
	<li class="card"><h3>Two</h3></li>
	<li class="card"><h3>Three</h3></li>
</ul>
```

An element on its own can also be timed: set `--yeti-enter-delay` on it and it waits that long before it arrives. That is how a legend's rows land in time with markers drawn on a map, an order a stagger's count cannot express.

Past the ninth child the delay stops growing and every remaining child shares the ninth's. A stagger that kept counting would turn a list of thirty into a ten-second wait, and the gesture is long over by then.

`data-view` ties the arrival to scroll position rather than to time: the animation's progress follows how far the element has crossed into the scrollport, so it plays backwards when the reader scrolls back up and plays again on the way back down. That is a deliberate scroll-linked effect, not a single arrival that merely waits for the viewport — an element with `data-view` announces itself on every crossing, not once. It is guarded twice, and both fallbacks land on the same place: the element plays its arrival on load. Once for `@supports`, because `animation-timeline: view()` is not yet Baseline — Chromium and Safari have it, Firefox does not, and that line will move; and once for `prefers-reduced-motion`, because a scroll-driven animation is paced by the scroll and never reads `animation-duration`, so the collapsed token that stills everything else in Yeti would sail straight past this one.

`data-once` arrives once, as it first comes near the viewport, rather than on load. `enter.css` gives it `animation: none` while the attribute is there, so it simply sits present and unanimated; `enter.js` removes the attribute the moment an `IntersectionObserver` says the element is near, which is the whole mechanism — the rules underneath apply exactly as if `data-once` had never been there, and the animation that starts is a new one, not a resumption of anything, so scrolling away and back never replays it. Without the script `data-once` does nothing useful on its own: `enter.css`'s fallback is to leave the attribute alone and simply not animate the element at all, so it needs `enter.js` to ever arrive. With `data-stagger` the same attribute removal reaches the parent, and each child's own arrival rule applies underneath it exactly as it would for any other `.enter[data-stagger]`.

Because it is enter.js that decides when the arrival starts and enter.css that decides how it plays, `data-once` combines with `data-view` without either needing to know about the other: once the attribute is gone, an element with both simply becomes an ordinary `data-view` element, scroll-linked from that point on.

## Accessibility

Nothing here changes reading order, focus order, or what any element is. The only way an element is ever hidden is the animation's own backwards fill, so a browser that cannot run the animation shows the content instead of swallowing it. `data-once` is safe the same way from the other direction: without `enter.js` the element simply keeps `animation: none` and stays visible, present but never animated, rather than stranded invisible.

Under reduced motion both `--yeti-enter-duration` and `--yeti-enter-stagger` collapse, so every element is simply present at once — the step collapses too, because a stagger with the smooth part removed is still a row of boxes popping into place one after another. The delay collapses as well, even one set on the element itself, so a delayed element is simply present. The scroll-driven form is switched off outright for the same reader, and they get the collapsed load-timed animation instead. `data-once` still waits for the viewport either way; the collapse only means that once it starts, it is instant rather than visibly animated.
