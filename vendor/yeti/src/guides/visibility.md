---
raw: true
title: "Visibility"
description: "Every way to hide something, the platform's first and Yeti's second: who stops seeing it, whether it keeps its space, and what brings it back."
nav_group: "Guides"
nav_order: 6
---

# Visibility

<p class="lede">Hiding is two questions, not one. <em>From whom</em> — everybody, or only the eye, or only a screen reader? And <em>for how long</em> — until you take it away, until the reader asks for it, or until the box it sits in is a different size? Answer both and there is usually exactly one right tool, and most of the time it is the browser's, not Yeti's.</p>

## Hide it from…

<div class="scroller" role="region" aria-label="Ways to hide something" tabindex="0" markdown="1">

| Tool | Out of sight | Out of the accessibility tree | Keeps its space | What brings it back |
| --- | --- | --- | --- | --- |
| `hidden` attribute | yes | yes | no | removing the attribute |
| `display: none`, your own CSS | yes | yes | no | your rule not matching |
| `visibility: hidden`, your own CSS | yes | yes | **yes** | your rule not matching |
| `aria-hidden="true"` | **no** | yes | yes | removing the attribute |
| `inert` | **no** | yes | yes | removing the attribute |
| `visually-hidden` | yes | **no** | no | nothing; it is always out of sight |
| the skip link | yes | no | no | focus |
| `details`, `popover`, `dialog` | while shut | while shut | no | the reader asking |
| `data-show` / `data-hide` | yes | yes | no | the container's width |
| `print` / `print` with `data-print="none"` | in the other medium | in the other medium | no | the medium |
| `:has()` on a common ancestor, your own CSS | yes | yes | no | the state of a control elsewhere |
| a component's own `data-threshold` | it changes shape rather than going | — | — | the container's width |

</div>

## What the platform does

### The `hidden` attribute

The blunt one, and usually the right one. The element is gone: off the screen, out of the accessibility tree, out of the flow. Yeti's reset makes it win over any `display` a component sets, so it works on a `card` or a `nav` item the same as on a `div`.

```html
<p hidden>Not in the page at all until something removes this.</p>
```

State, not styling. If a script is going to show and hide something, this is the attribute to toggle — not a class.

### `display: none` and `visibility: hidden`

The same thing as `hidden` and a different thing, respectively, and the difference is space. `display: none` takes the box out of the layout; `visibility: hidden` leaves the box exactly where it is and paints nothing in it. When a row must not move as its contents come and go — a validation message, a counter, a spinner beside a button — `visibility: hidden` is what keeps it still. Foundation 6 called that `.invisible`; it is two words of your own CSS and Yeti does not wrap it.

```css
.form-status[data-state="quiet"] { visibility: hidden; }
```

Both take the element out of the accessibility tree.

### `aria-hidden="true"`

The opposite direction: still on the screen, gone from the accessibility tree. It is for something a sighted reader needs and a screen reader would only be delayed by — a decorative icon beside a word that already says what the icon says, or text duplicated for layout.

```html
<a href="/downloads"><svg aria-hidden="true" viewBox="0 0 16 16"><path d="M8 2v9m0 0 4-4m-4 4-4-4M2 14h12" fill="none" stroke="currentColor" stroke-width="2"/></svg> Download</a>
```

Never put it on anything focusable. A button a screen reader cannot see but can still land on is the worst of both.

### `inert`

Seen, but unreachable and unannounced: no focus, no clicks, no find-in-page, and out of the accessibility tree. It is for the page behind something — a custom overlay you built yourself, a form region disabled while a request is in flight.

```html demo sm md
<div inert>
	<p>Still visible. Nothing in here can be tabbed to or clicked.</p>
	<a href="/settings">Settings</a>
</div>
```

A native `dialog` opened with `showModal()` does this to the rest of the page for you, so a `dialog` needs none of it.

### `details`, `popover`, `dialog`

Hidden until the reader asks, with the browser keeping the state and announcing it. A disclosure is `details` and `summary`; a panel that closes on Escape and on a click outside is `popover`; a modal is `dialog`. None of the three needs a line of script, and each tells a screen reader what happened, which a toggled class never did.

```html demo sm md
<details>
	<summary>Shipping and returns</summary>
	<p>Ships within two days.</p>
</details>
```

```html demo sm md
<button popovertarget="notes">Notes</button>
<div id="notes" popover>
	<p>Only in the page while it is open.</p>
</div>
```

If you are about to write script to show something, this is the section to re-read first.

## What Yeti adds

Four things, for the four questions the platform has no single word for.

### `visually-hidden`

Out of sight, still announced. It is for the name a control needs when its face is a picture, or the words that make the third "Read more" on a page mean something different from the first two.

```html
<a href="/trail-map.pdf">Read more<span class="visually-hidden"> about the trail map</span></a>
```

It is the one two-word class in Yeti, and the second word is there because `hidden` is already taken by an attribute that does the opposite. Full page: [visually-hidden](../visually-hidden.md).

### The skip link

A special case of the same recipe, and you get it for nothing. The first link in the body, if it points at a fragment, is hidden the way `visually-hidden` hides — out of sight, in the tree, still in Tab order — until it takes focus, at which point it appears at the corner of the window. There is no class; being the first link in the body is the whole contract, which is why the base rule is written that way and why a body whose first link is something else will find it hidden. It is a base rule like any other, and the [base guide](base.md#the-skip-link) lists it among the rest of what a page gets for free.

```html
<body>
	<a href="#main">Skip to content</a>
	<!-- the furniture -->
	<main id="main">…</main>
</body>
```

Foundation 6 called this `.show-on-focus`.

### `data-show` and `data-hide`

By the space available, measured on the nearest size container rather than on the window. Both take a width from the same scale as `data-threshold` and both mean *at or above*: `data-show="md"` is shown from `md` up, `data-hide="md"` is gone from `md` up.

```html demo md sm
<div class="container">
	<p data-show="md">Shown once this column is 32rem or wider.</p>
	<p data-hide="md">Gone once this column is 32rem or wider.</p>
</div>
```

They need a size container above them and do nothing without one. [container](../container.md) is what makes a box into one, and lists which layouts already are.

A table is not a size container, so a column that should drop on a phone needs one around the table. Wrap the region in a `container`, and mark the header cell and every body cell of that column with the same `data-show`:

```html demo md sm
<div class="container">
	<table class="table">
		<caption>Summits</caption>
		<thead>
			<tr><th scope="col">Peak</th><th scope="col" data-numeric>Height (m)</th><th scope="col" data-show="sm">Range</th></tr>
		</thead>
		<tbody>
			<tr><td>Ben Nevis</td><td data-numeric>1,345</td><td data-show="sm">Grampians</td></tr>
			<tr><td>Snowdon</td><td data-numeric>1,085</td><td data-show="sm">Snowdonia</td></tr>
			<tr><td>Scafell Pike</td><td data-numeric>978</td><td data-show="sm">Southern Fells</td></tr>
		</tbody>
	</table>
</div>
```

`npm run validate` warns about a `data-show` or `data-hide` with no size container above it, since that element would never change.

### `print`

By medium. `print` on its own is for paper and nowhere else; `print` with `data-print="none"` is for everywhere but paper.

```html
<p class="print">Printed from https://foundationcss.com/guides/visibility</p>
<button class="button print" data-print="none" type="button">Share this page</button>
```

Full page: [print](../print.md).

## Show one of two things from a control

A price that is monthly or yearly, a distance in miles or kilometres, a map or a list: two alternatives in place, and a control somewhere else on the page choosing between them. Put both alternatives in the markup, and let `:has()` on an element that holds the control and the alternatives both read which one is checked. The control is the [segmented control](../buttons.md), native radios, so it submits with a form and the arrow keys move it; the switch is one rule of your own CSS, and there is no script anywhere.

```html demo sm
<style>
	.plans:not(:has([value="yearly"]:checked)) .yearly,
	.plans:has([value="yearly"]:checked) .monthly { display: none; }
</style>
<section class="plans stack" data-gap="md">
	<fieldset>
		<legend>Billing</legend>
		<div class="buttons" data-affix>
			<label class="button" data-emphasis="medium"><input type="radio" name="billing" value="monthly" checked> Monthly</label>
			<label class="button" data-emphasis="medium"><input type="radio" name="billing" value="yearly"> Yearly</label>
		</div>
	</fieldset>
	<p>Walker: <span class="monthly">£3 a month</span><span class="yearly">£30 a year</span></p>
</section>
```

The ancestor is whichever element holds both, and the closer the better: a `:has()` on `body` works, and makes the browser look at the whole page every time anything inside it changes. The hidden alternative is `display: none`, so it is out of the accessibility tree as well as out of sight, and a screen reader reads only the price that applies. It does not announce the change as the radio moves, which is right for a price further down the page: the reader meets the new one when they get there.

Yeti does not ship this as an attribute, a `data-when` naming a control's id and a `data-scope` naming the ancestor, because that would be wiring state between elements the framework knows nothing about: which control, which ancestor, which state of it, and which of its values. Every one of those is a question about your page, and the rule above already answers all four in one line. An attribute would only move the same four answers into markup, where they are harder to read, and add a vocabulary to keep in step with them.

## Not hiding, but the same family

A component with a `data-threshold` does not hide anything — it changes shape. A `nav` collapses its links behind a toggle, a `pagination` drops to the compact form, a `card` puts its figure above the text instead of beside it. That is always the better answer than shipping two versions of a thing and hiding one, because two versions are two things to keep in step forever. The [responsive guide](responsive.md) is the whole story.

`prefers-reduced-motion` is the same shape of question — who gets what — applied to movement rather than to presence. Yeti honours it through the motion tokens, so nothing you write has to ask; the [animations guide](animations.md) says how.

## What Yeti does not ship

There is no `hide-for-small`, no `show-for-large`, no viewport visibility class of any kind, and there will not be one.

A viewport rule breaks the moment the element moves. A `columns` that was tuned against a wide window is suddenly inside a `sidebar`, or inside a card, or inside a dialog; the window has not changed and the box has, and every `medium-` and `large-` prefix in the markup is now lying. That was true in Foundation 6 too — it was just impossible to fix, because the box could not be measured. It can be now, so `data-show` and `data-hide` measure it, and nothing in Yeti asks the window how wide a component should be.

There is also no `-only` band — no "shown at `md` and not above". A band is two elements with a marker each, or a nested container, and the `-only` classes were the rarest of the set. If you find yourself wanting one, it is usually a sign the component should be changing shape instead.
