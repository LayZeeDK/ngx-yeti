import { Directive, inject, input } from '@angular/core';
import type { YetiSpan, YetiStart } from 'ngx-yeti';
import { yetiGridToken } from './grid-tokens';

/**
 * Yeti's markers on one cell of a tracks grid: `start` and `span` (grid
 * spec, sections 2 to 4). It sets no presence attribute and loads no item
 * file: the grid's own file holds the rules for its cells.
 *
 * Usage rules (numbered as on `YetiGrid`):
 *
 * 2. Put `yetiGridChild` on direct children of the grid element, and only on
 *    a cell that needs `start` or `span`. A marker on a grandchild does
 *    nothing. A component's host element is the child.
 * 3. Use `start` and `span` only in a grid with `tracks`; in a fitted grid
 *    they do nothing. Keep each placement inside the tracks: `start` at most
 *    `tracks`, and `start` plus `span` minus one at most `tracks`.
 * 8. Do not write `data-start` or `data-span` by hand; the directive binds
 *    them.
 * 9. On a child that is an `ol`, `start` places the cell and never sets the
 *    list's first number; set that with `value` on the first `li`. Writing
 *    `start` statically is allowed.
 * 10. Bind every input from values that are the same on the server and the
 *     client.
 * 11. Import `YetiGridChild` in every component whose template writes it: a
 *     forgotten import with static `start` and `span` renders an unplaced
 *     cell, with no error.
 *
 * Outside a tracks grid it still renders its markers, which then match no
 * rule.
 */
@Directive({
  selector: '[yetiGridChild]',
  host: {
    '[attr.data-start]': 'start() ?? null',
    '[attr.data-span]': 'span() ?? null',
    // HTML's `start` sets an `ol`'s first number, so the input's static form
    // would renumber a cell that is a list.
    '[attr.start]': 'null',
  },
  exportAs: 'yetiGridChild',
})
export class YetiGridChild {
  /** The column line this cell begins on. */
  readonly start = input<YetiStart>();
  /** How many tracks this cell covers. Unset, it covers one. */
  readonly span = input<YetiSpan>();

  constructor() {
    // The parent for the later in-item check; nothing reads it yet (grid
    // spec, section 3). `skipSelf`: an element that is also a grid finds its
    // parent grid, not itself.
    inject(yetiGridToken, { optional: true, skipSelf: true });
  }
}
