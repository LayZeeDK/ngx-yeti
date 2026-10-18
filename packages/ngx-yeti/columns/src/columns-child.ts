import { Directive, inject, input } from '@angular/core';
import type { YetiSpan } from 'ngx-yeti';
import { yetiColumnsToken } from './columns-tokens';

/**
 * Yeti's `span` marker on one column of a columns layout (columns spec,
 * sections 2 to 4). It sets no presence attribute and loads no item file:
 * the layout's own file holds the rule.
 *
 * Usage rules (numbered as on `NgxYetiColumns`):
 *
 * 2. Put `yetiColumnsChild` only on a direct child of a `yetiColumns` host,
 *    and only on a child that takes a `span`. A plain column needs no
 *    directive. Outside a columns host it compiles and does nothing.
 * 3. Do not write `data-span` by hand; the directive binds it.
 * 7. Import `YetiColumnsChild` in every component whose template writes it:
 *    a forgotten import with a static `span` renders a single share, with no
 *    error.
 */
@Directive({
  selector: '[yetiColumnsChild]',
  host: {
    '[attr.data-span]': 'span() ?? null',
  },
  exportAs: 'yetiColumnsChild',
})
export class YetiColumnsChild {
  /**
   * How many shares of the row this column takes, as a multiple of its
   * siblings' share. The static form (`span="2"`) stays on the element beside
   * `data-span` and does nothing there.
   */
  readonly span = input<YetiSpan>();

  constructor() {
    // The parent for the later in-item check; nothing reads it yet (columns
    // spec, section 3). `skipSelf`: an element that is also a columns layout
    // finds its parent layout, not itself.
    inject(yetiColumnsToken, { optional: true, skipSelf: true });
  }
}
