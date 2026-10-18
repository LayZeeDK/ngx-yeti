import { Directive, booleanAttribute, inject, input } from '@angular/core';
import type { YetiAlign } from 'ngx-yeti';
import { yetiTableToken } from './table-tokens';

/** The values of a table cell's or row's `data-align` (table spec, section 2). */
export type YetiTableAlign = Extract<YetiAlign, 'start' | 'center' | 'end'>;

/**
 * Yeti's `data-nowrap` and `data-align` markers on a cell or a row of a
 * `yetiTable` (table spec, sections 2 to 4). It sets no presence attribute
 * and loads no item file: the table's own file holds the rules.
 *
 * Usage rules (numbered as on `YetiTable`):
 *
 * 3. Put `yetiTableCell` on a `th`, `td`, or `tr` of a `yetiTable`.
 *    `nowrap` belongs on a `th` or `td`; on a `tr` it does nothing, because
 *    Yeti's rule is for cells. To keep a whole table's lines, use the
 *    table's `nowrap`.
 * 6. Do not write `data-nowrap` or `data-align` statically; the directive
 *    binds them. The static `align` and `nowrap` forms are accepted. Do not
 *    put `yetiIcon`, or any other item directive that declares `align`, on
 *    a `yetiTableCell` host: put it inside the cell.
 * 9. A cell's own `align` outranks its `yetiNumeric`, and a cell's
 *    `yetiNumeric` outranks its row's `align`.
 * 11. Import `YetiTableCell` in every component whose template writes it: a
 *     forgotten import with a static `align` renders a start-aligned cell
 *     with no error; a bound `[align]` makes the compiler report it.
 */
@Directive({
  selector: 'th[yetiTableCell], td[yetiTableCell], tr[yetiTableCell]',
  host: {
    '[attr.data-nowrap]': "nowrap() ? '' : null",
    '[attr.data-align]': 'align() ?? null',
    // HTML's `nowrap` on a cell is obsolete, and its `align` on a cell or a
    // row is a text-alignment hint, so neither static form may stay on the
    // element beside Yeti's marker.
    '[attr.nowrap]': 'null',
    '[attr.align]': 'null',
  },
  exportAs: 'yetiTableCell',
})
export class YetiTableCell {
  /**
   * Keeps this cell on one line while true. The static form (`nowrap`)
   * never stays on the cell.
   */
  readonly nowrap = input(false, { transform: booleanAttribute });
  /**
   * Aligns this cell, or every cell of this row. Unset, the cell follows its
   * row, its `yetiNumeric`, or Yeti's `start`. The static form
   * (`align="center"`) never stays on the element.
   */
  readonly align = input<YetiTableAlign>();

  constructor() {
    // The table for the later in-item check; nothing reads it yet (table
    // spec, section 3).
    inject(yetiTableToken, { optional: true, skipSelf: true });
  }
}
