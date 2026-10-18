import { Directive, booleanAttribute, inject, input } from '@angular/core';
import { yetiOverlayToken } from './overlay-tokens';

/**
 * Yeti's `data-over` and `data-fill` markers on the held child of an overlay
 * (overlay spec, sections 2 to 4). It sets no class, no presence attribute,
 * and loads no item file: the overlay's own file holds the rules.
 *
 * Usage rules (numbered as on `YetiOverlay`):
 *
 * 2. Mark exactly one direct child of the overlay with
 *    `yetiOverlayChild over`; a marker on a grandchild does nothing. A
 *    component's host element is the child.
 * 3. Write `fill` only beside `over` on the same element.
 * 5. When the held child covers focusable content, make the covered content
 *    `inert` while it is covered; never put `inert` on the overlay itself.
 * 6. If the held child's content can be larger than the box minus the gap,
 *    make it a scroll region: `tabindex="0"`, a role such as `region`, and a
 *    name.
 * 7. Write `fill` bare or bound, never with a paint value such as
 *    `fill="red"`.
 * 8. Do not write `yetiStack` and a filled `yetiOverlayChild` on one element.
 * 9. On a centred held child, do not use anything that sets `translate`.
 * 11. Do not write `data-over` or `data-fill` by hand; the directive binds
 *     them.
 * 12. Bind `over` and `fill` from values that are the same on the server and
 *     the client.
 * 13. Import `YetiOverlayChild` in every component whose template writes it:
 *     a forgotten import with a static `over` renders the held child in the
 *     flow, with no error.
 *
 * Outside an overlay it still renders its markers, which then match no rule.
 */
@Directive({
  selector: '[yetiOverlayChild]',
  host: {
    '[attr.data-over]': "over() ? '' : null",
    '[attr.data-fill]': "fill() ? '' : null",
  },
  exportAs: 'yetiOverlayChild',
})
export class YetiOverlayChild {
  /** Takes this child out of the flow and centres it over the box. */
  readonly over = input(false, { transform: booleanAttribute });
  /**
   * With `over`, makes this child cover the box instead of sitting centred in
   * it. A static `fill` stays on the element and paints nothing, an `svg`
   * included, because neither `fill` nor `fill="true"` is a paint value.
   */
  readonly fill = input(false, { transform: booleanAttribute });

  constructor() {
    // The parent for the later in-item check; nothing reads it yet (overlay
    // spec, section 3). `skipSelf`: an element that is also an overlay finds
    // its parent overlay, not itself.
    inject(yetiOverlayToken, { optional: true, skipSelf: true });
  }
}
