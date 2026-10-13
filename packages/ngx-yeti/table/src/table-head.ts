import { Directive, booleanAttribute, inject, input } from '@angular/core';
import { yetiTableToken } from './table-tokens';

/**
 * Yeti's pinned header row on the `thead` of a `yetiTable` (table spec,
 * sections 2 to 4; ticket 50 decision 195). It sets no presence attribute
 * and loads no item file: the table's own file holds the rule.
 *
 * Usage rules (numbered as on `YetiTable`):
 *
 * 6. Do not write `data-sticky` statically; the directive binds it.
 * 10. A pinned head pins to the nearest scroll container. Inside a
 *     `scroller`, which scrolls sideways and so is also a scroll container on
 *     the other axis, the head does not pin to the page. Where the stuck head
 *     can sit above focusable content in the rows, set
 *     `--yeti-scroll-padding` on `:root` to at least the offset plus the
 *     head's height.
 * 11. Import `YetiTableHead` in every component whose template writes it: a
 *     forgotten import with a static `sticky` leaves the head unpinned with
 *     no error.
 */
@Directive({
  selector: 'thead[yetiTableHead]',
  host: { '[attr.data-sticky]': "sticky() ? '' : null" },
  exportAs: 'yetiTableHead',
})
export class YetiTableHead {
  /**
   * Pins the header row at `--yeti-sticky-offset` while the rows scroll
   * under it, while true.
   */
  readonly sticky = input(false, { transform: booleanAttribute });

  constructor() {
    // The table for the later in-item check; nothing reads it yet (table
    // spec, section 3).
    inject(yetiTableToken, { optional: true, skipSelf: true });
  }
}
