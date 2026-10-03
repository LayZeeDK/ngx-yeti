## When to use it

A cover is the hero section, the sign-in screen, the "coming soon" page: one thing centered in the height of the viewport, with a navigation bar above it or a footnote below it when you want them.

## How it works

The cover is a flex column with a minimum block size: the viewport by default, from `--yeti-cover-height`, `100dvh` so it tracks the browser chrome on phones, or whatever `data-height` names, a stop of the height scale from `sm` to `xl`, `half` the viewport, or `full`. It is a minimum and never a fixed size, so a band whose content is taller than its name simply grows; nothing is cut off. A band with a heading in the middle of it is the answer to "more padding than the scale has": `data-height="md"` with the heading marked `data-center`. The child marked `data-center` gets automatic block margins, which take up all the free space equally above and below it; anything else sits at its natural size at the top or bottom. The gap keeps the centered child from touching its neighbours when the content is taller than the viewport.

## Why this name

The block covers the viewport. Foundation 6 had no primitive for this; people combined a full-height utility with vertical alignment classes on the grid.
