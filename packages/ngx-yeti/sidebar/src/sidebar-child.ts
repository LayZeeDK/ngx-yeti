import { Directive, booleanAttribute, inject, input } from '@angular/core';
import { yetiSidebarToken } from './sidebar-tokens';

/**
 * Yeti's `sticky` marker on one child of a sidebar (sidebar spec, sections 2
 * to 4). It sets no presence attribute and loads no item file: the
 * sidebar's own file holds the start alignment a stuck child needs, and the
 * rule for `sticky` is always loaded.
 *
 * Usage rules (numbered as on `YetiSidebar`):
 *
 * 3. Put `yetiSidebarChild` only on a direct child of a `yetiSidebar` host,
 *    and only on a child that sticks. A child that does not stick needs no
 *    directive. A component's host element can be the child.
 * 4. A sticky child must stay usable when it is stuck. Stick only a child no
 *    taller than the smallest viewport the page supports, so that its own
 *    content can be reached. Once the two children have stacked, a sticky
 *    child that comes first sits above the other one while it scrolls under,
 *    so set `--yeti-scroll-padding` on the root to at least the sticky
 *    child's height on pages where that happens, or stick only a child that
 *    comes last in the stacked order. Yeti's default scroll padding is the
 *    sticky offset, which clears no bar of its own (WCAG 2.4.11).
 * 5. Do not write `data-sticky` by hand; the directive binds it.
 * 7. Bind `sticky` from values that are the same on the server and the
 *    client.
 * 8. Import `YetiSidebarChild` in every component whose template writes it:
 *    a forgotten import with a static `sticky` renders a child that does not
 *    stick, with no error.
 *
 * Outside a sidebar it still renders its marker, and the child still sticks,
 * but a stretched flex or grid item has nowhere to move.
 */
@Directive({
  selector: '[yetiSidebarChild]',
  host: {
    '[attr.data-sticky]': "sticky() ? '' : null",
  },
  exportAs: 'yetiSidebarChild',
})
export class YetiSidebarChild {
  /**
   * Pins this child at `--yeti-sticky-offset` from the top of the scrollport
   * while the other child scrolls past. A stuck child takes its own height
   * rather than the row's.
   */
  readonly sticky = input(false, { transform: booleanAttribute });

  constructor() {
    // The parent for the later in-item check; nothing reads it yet (sidebar
    // spec, section 3). `skipSelf`: an element that is also a sidebar finds
    // its parent sidebar, not itself.
    inject(yetiSidebarToken, { optional: true, skipSelf: true });
  }
}
