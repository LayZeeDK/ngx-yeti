## When to use it

The one sentence under a page's heading that says what the page is, before the page begins. A standfirst. Put it on that paragraph and nothing else: a second lede on a page is not a lede.

## How it works

It is a class rather than a rule about position, because a lede is a role and not a place. The obvious alternative, styling the paragraph that follows the heading, encodes where the paragraph happens to sit, so the day someone wraps the heading and the paragraph in a `stack` the lede quietly becomes body copy. A class survives being moved.

The size is a token, so a theme sets how much larger a lede reads. It carries its own measure, because a lede set larger at the body's measure runs to a longer line than the prose it introduces. Change one and change the other: `ch` is a unit of the font, so raising the size raises what the count is worth.

```html
<h1>Card</h1>
<p class="lede">A bordered surface for one thing.</p>
<p>One thing in a box: an article in a listing, a product, a person, a plan.</p>
```

## Accessibility

Nothing to do. A lede is a paragraph that is set larger; it takes no role and announces nothing of its own, which is correct, because the sentence is ordinary prose and its position already says what it is.
