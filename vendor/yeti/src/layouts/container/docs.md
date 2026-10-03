## When to use it

Around anything that should change shape at its own width, when the thing itself cannot measure its own box. A layout can query itself and change its children, but nothing can change its own tracks from inside its own query; wrap it in a container and query that.

## How it works

One declaration: the box becomes a size container. Nothing else. To target it by name in your own CSS, give the container a name in your stylesheet, since a name cannot come from an attribute:

```css
.container.sidebar-slot { container-name: slot; }
@container slot (inline-size < 30rem) { .cluster { flex-direction: column; } }
```

The Yeti layouts that query themselves (`grid` with `data-fold` or `data-tracks`, `cluster` with `data-threshold`, `breakout` with notes, `timeline`) do not need one; this is for your own queries and for components that must restyle themselves.

Two markers read this box directly. `data-show` shows an element only while the container is at least that wide, and `data-hide` removes it once the container is that wide; both take a width from the same scale as `data-threshold`, and both mean "at or above", so `data-show="md"` is *shown from `md` up* and `data-hide="md"` is the same sentence the other way round. The widths are the tokens' defaults written as literals, because a container condition cannot read a custom property, so a theme that changes `--yeti-width-md` moves `data-threshold="md"` but not `data-show="md"`.

```html
<div class="container">
	<p data-show="md">Shown once this column is 32rem or wider.</p>
	<p data-hide="md">Gone once this column is 32rem or wider.</p>
</div>
```

They measure the nearest size container, not the window, which is the whole reason they exist: the same markup in a sidebar and in a full-width section makes two different decisions on one page. A `container` carrying `data-show` or `data-hide` itself is measured against its own nearest ancestor container, never its own box, because an element cannot query itself. Reach for them last. A component that can change shape at its own threshold should do that instead — the two versions of a thing, one shown and one hidden, are two things to keep in step forever — and an element removed this way is removed from the accessibility tree with it, so nothing a reader needs may live only in the narrow version.

With no size container anywhere above it, a container query never matches and neither marker does anything: the element stays visible at every width. That is the failure mode to know. These layouts are size containers with no conditions attached, so anything inside one is already covered: `container`, `nav`, `pagination`, `timeline`, and the preview box inside a `demo`. Five more are containers only in a particular shape — a `grid` with `data-fold` or with `data-tracks`, a `cluster` with `data-threshold`, a `card` whose first child is a figure, and a `breakout` holding a note — and anything else needs a `container` around it.

The [visibility guide](guides/visibility.md) puts these beside the platform's own ways of hiding something, and says which to reach for first.

## Why this name

It contains, and it is what a container query measures. Foundation 6's `.grid-container` was a page column; that job is `center`.
