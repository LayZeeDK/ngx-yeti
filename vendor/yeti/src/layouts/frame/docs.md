## When to use it

Use a frame wherever images of unpredictable shape must present as the same shape: card thumbnails, avatars, a video embed that should not reflow the page while it loads. The frame owns the shape; the media fills it.

## How it works

`aspect-ratio` sizes the frame from its width, and `overflow: hidden` clips. An image, video, `picture`, `iframe`, `embed` or `object` child is stretched to both dimensions with `object-fit: cover`, so it fills without distortion and loses only the overflow. Any other child, a placeholder or an icon, is centered with flexbox.

A frame that wants an edge, a map's neatline, a photo on a light page, takes `data-border`, which draws the border width in the border color around any element. For a different color set `--yeti-color-border` on the frame itself.

```html
<div class="frame" data-ratio="4/3" data-border style="--yeti-color-border: var(--yeti-color-text)">
	<img src="map.png" alt="The route from the car park to the summit">
</div>
```

A toned plate is a `filter` on the frame's media, the page's own art direction:

```html
<div class="frame" data-ratio="4/3">
	<img src="map.png" alt="The route from the car park to the summit" style="filter: grayscale(1)">
</div>
```

## Why this name

It is what a picture frame does: fix the shape and crop what is inside it. Foundation 6 had `.responsive-embed` for video ratios only; a frame does the same for anything.
