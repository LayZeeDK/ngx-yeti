import { Directive, input } from '@angular/core';
import type { YetiWidth } from 'ngx-yeti';

/**
 * Yeti's `data-show` marker on any element: the element is displayed only
 * while the nearest size container is at least the given width wide
 * (container spec, sections 2 and 4). Below it the element is
 * `display: none`, and so out of the accessibility tree and the Tab order.
 * Its rules are always loaded, so the marker sets no class, no presence
 * attribute, and loads no item file.
 *
 * The widths are Yeti's literals, equal to the defaults of the
 * `--yeti-width-*` tokens: a theme that changes `--yeti-width-md` does not
 * move `yetiShow="md"`. Write `yetiShow="sm" yetiHide="md"` for a band.
 *
 * Usage rules (the container's, numbered as on `YetiContainer`):
 *
 * 1. Put `yetiShow` only on an element that has a size container above it: a
 *    `yetiContainer`, or an item Yeti makes one (`nav`, `pagination`,
 *    `timeline`, the `demo` preview, a `grid` with `fold` or `tracks`, a
 *    `cluster` with `threshold`, a `card` whose first child is a figure, a
 *    `breakout` holding a note). Without one, the marker does nothing.
 * 2. On a `yetiContainer` host the marker is measured against the nearest
 *    size container above that host, never against its own box.
 * 3. Nothing a reader needs may live only in the version a marker removes.
 * 4. To remove a table column at narrow widths, wrap the table in a
 *    `yetiContainer` and put the same marker on the header cell and every
 *    body cell of that column.
 * 5. Do not write `data-show` statically on a host; the directive binds it.
 * 7. Import `YetiShow` in every component whose template writes `yetiShow`.
 *    A forgotten import with a static value compiles, as an unknown
 *    attribute, and the element shows at every width; a bound
 *    `[yetiShow]` is reported as NG8002.
 */
@Directive({
  selector: '[yetiShow]',
  host: { '[attr.data-show]': 'yetiShow()' },
  exportAs: 'yetiShow',
})
export class YetiShow {
  /** The container width from which the element is displayed. */
  readonly yetiShow = input.required<YetiWidth>();
}
