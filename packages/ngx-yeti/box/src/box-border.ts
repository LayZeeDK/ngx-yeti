import { Directive, booleanAttribute, input } from '@angular/core';

/**
 * Yeti's `data-border` marker on any element: a border of the border width
 * in the border colour (box spec, section 4). Its rule is always loaded, so
 * the marker sets no class, no presence attribute, and loads no item file.
 *
 * Usage rules (the box's, numbered as on `YetiBox`):
 *
 * 1. Do not write `data-border` on a host; the directive binds it.
 * 3. Do not put `yetiBorder` on a `table[yetiTable]`. Yeti's border marker
 *    skips `.table`, and the table's own `data-border` means cell borders;
 *    use the table's `border` input.
 * 7. Import `YetiBorder` in every component whose template writes
 *    `yetiBorder`. A forgotten import with a bare attribute renders no
 *    border and no error; a bound `[yetiBorder]` makes the compiler report
 *    it.
 */
@Directive({
  selector: '[yetiBorder]',
  host: { '[attr.data-border]': "yetiBorder() ? '' : null" },
  exportAs: 'yetiBorder',
})
export class YetiBorder {
  /** Draws the border while true; the bare attribute is `true`. */
  readonly yetiBorder = input(false, { transform: booleanAttribute });
}
