import { Directive, booleanAttribute, inject, input } from '@angular/core';
import { yetiBreakoutToken } from './breakout-tokens';

/**
 * Yeti's `data-bleed` marker on one child of a breakout (breakout spec,
 * sections 2 to 4). It sets no presence attribute and loads no item file:
 * the breakout's own file holds the rule.
 *
 * Usage rules (numbered as on `YetiBreakout`):
 *
 * 2. Put `yetiBreakoutChild` on a direct child of the breakout element; a
 *    marker on a grandchild does nothing. A component's host element is the
 *    child: write `<app-figure yetiBreakoutChild bleed>`.
 * 4. Do not write `data-bleed` by hand; the directive binds it.
 * 5. Bind `bleed` from a value that is the same on the server and the
 *    client.
 * 6. Import `YetiBreakoutChild` in every component whose template writes
 *    it: a forgotten import with a static `bleed` renders a plain child,
 *    with no error.
 *
 * Outside a breakout it still renders its marker, which then matches no
 * rule.
 */
@Directive({
  selector: '[yetiBreakoutChild]',
  host: {
    '[attr.data-bleed]': "bleed() ? '' : null",
  },
  exportAs: 'yetiBreakoutChild',
})
export class YetiBreakoutChild {
  /** Breaks the child out of the column to span the breakout's full width. */
  readonly bleed = input(false, { transform: booleanAttribute });

  constructor() {
    // The parent for the later in-item check; nothing reads it yet (breakout
    // spec, section 3). `skipSelf`: an element that is also a breakout finds
    // its parent breakout, not itself.
    inject(yetiBreakoutToken, { optional: true, skipSelf: true });
  }
}
