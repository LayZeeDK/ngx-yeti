## When to use it

On something that has just changed and might otherwise be missed: the alert that appeared after a save, the total that moved when a quantity changed, the field the server rejected. It plays on load, so in practice it arrives with the element, whether that element came from a navigation or was written into the page.

Not as an ornament, and not on anything permanent. A pulse on a heading that has always been there is an instruction to look at something that has nothing to say.

```html
<p class="badge attention" data-attention="shake" data-variant="alert" role="status">Card declined</p>
```

## How it works

One run of one animation, over `--yeti-attention-duration`. `pulse` swells the element to `--yeti-attention-scale` at the halfway point and settles back; the peak is in the middle so the gesture is symmetrical, since something that grows and snaps back reads as a twitch. `shake` throws it `--yeti-attention-distance` to each side and back twice, because a single sideways move is a slide and it takes the return trip to read as a shake.

It runs once, and the iteration count is deliberately left at the initial `1` rather than reading `--yeti-motion-iterations`, which exists for the animations that never end. A gesture that keeps repeating stops being a moment that has passed and becomes a state the page is in, and the reader has no way to dismiss it.

No keyframe leaves the element anywhere but where it started, so no fill mode is needed and nothing here can strand an element off its mark.

## Accessibility

Motion is not an announcement. A screen reader hears nothing at all here, so a change worth pointing at is a change worth saying: put the element in a live region, or give it `role="status"`, and the gesture becomes the visual half of something that is already spoken.

Under reduced motion `--yeti-attention-duration` collapses and the element simply sits still, which is the whole of the accommodation — there is nothing left to see, and the live region is still heard.
