import { Directive, inject } from '@angular/core';
import { yetiBreakoutToken } from './breakout-tokens';

/**
 * Yeti's `data-note` marker: a margin note in a breakout, in the end gutter
 * beside the child it follows once the breakout is at least 64rem wide, in
 * the column below that (breakout spec, sections 2 to 4). It takes no input,
 * sets no presence attribute, and loads no item file.
 *
 * Usage rules (numbered as on `YetiBreakout`):
 *
 * 2. Put `yetiBreakoutNote` on a direct child of the breakout element; a
 *    marker on a grandchild does nothing.
 * 3. Put the note directly after the child it annotates, in source order,
 *    and at most one note per child.
 * 4. Do not write `data-note` by hand; the directive binds it.
 * 6. Import `YetiBreakoutNote` in every component whose template writes it:
 *    a forgotten import renders a plain child, with no error.
 *
 * Outside a breakout it still renders its marker, which then matches no
 * rule.
 */
@Directive({
  selector: '[yetiBreakoutNote]',
  host: { 'data-note': '' },
  exportAs: 'yetiBreakoutNote',
})
export class YetiBreakoutNote {
  constructor() {
    // The parent for the later in-item check; nothing reads it yet (breakout
    // spec, section 3).
    inject(yetiBreakoutToken, { optional: true, skipSelf: true });
  }
}
