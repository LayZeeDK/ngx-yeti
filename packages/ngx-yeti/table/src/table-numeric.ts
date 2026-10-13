import { Directive, booleanAttribute, input } from '@angular/core';

/**
 * Yeti's `data-numeric` marker on any element: tabular figures, and in a
 * `yetiTable` an end-aligned cell (table spec, sections 2 to 4). Its figures
 * rule is always loaded, so the marker sets no class, no presence attribute,
 * and loads no item file.
 *
 * Usage rules (numbered as on `YetiTable`):
 *
 * 6. Do not write `data-numeric` statically; the directive binds it.
 * 9. Put the same `yetiNumeric` on a numeric column's header cell and its
 *    data cells, so that the header aligns with its figures. A cell's own
 *    `align` outranks its `yetiNumeric`, and a cell's `yetiNumeric`
 *    outranks its row's `align`.
 * 11. Import `YetiNumeric` in every component whose template writes it: a
 *     forgotten import with a bare attribute renders proportional figures
 *     with no error; a bound `[yetiNumeric]` makes the compiler report it.
 */
@Directive({
  selector: '[yetiNumeric]',
  host: { '[attr.data-numeric]': "yetiNumeric() ? '' : null" },
  exportAs: 'yetiNumeric',
})
export class YetiNumeric {
  /** Lines the figures up while true; the bare attribute is `true`. */
  readonly yetiNumeric = input(false, { transform: booleanAttribute });
}
