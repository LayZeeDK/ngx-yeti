import { Directive, booleanAttribute, inject, input } from '@angular/core';
import type { YetiGap } from 'ngx-yeti';
import { yetiStackToken } from './stack-tokens';

/**
 * Yeti's markers on one child of a stack: `split`, `space`, and `sticky`
 * (stack spec, sections 2 to 4). It sets no presence attribute and loads no
 * item file: the stack's own file holds the rules for `split` and `space`,
 * and the rule for `sticky` is always loaded.
 *
 * Usage rules (numbered as on `YetiStack`):
 *
 * 2. Put `yetiStackChild` on direct children of the stack element, and only
 *    on a child that needs `split`, `space`, or `sticky`. A marker on a
 *    grandchild does nothing. A component's host element is the child.
 * 3. Mark at most one child with `split`. The split takes effect only when
 *    the stack is taller than its content.
 * 4. `space` does nothing on the first child, and `split` wins on a child
 *    that carries both. A child that is itself a stack with its own `gap`
 *    reads its own gap for `space`; give it a plain wrapper.
 * 7. A `sticky` child stops at `--yeti-sticky-offset` from the top of the
 *    scrollport. When it is taller than that offset, set
 *    `--yeti-scroll-padding` on `:root` to its height, so that a focused
 *    control is not hidden under it (WCAG 2.4.11).
 * 8. Do not write `data-split`, `data-space`, or `data-sticky` by hand; the
 *    directive binds them.
 * 9. Bind every input from values that are the same on the server and the
 *    client.
 * 10. Import `YetiStackChild` in every component whose template writes it:
 *     a forgotten import with a static `split` renders an unsplit child,
 *     with no error.
 *
 * Outside a stack it still renders its markers: `split` and `space` then
 * match no rule, while `sticky` still pins the element.
 */
@Directive({
  selector: '[yetiStackChild]',
  host: {
    '[attr.data-split]': "split() ? '' : null",
    '[attr.data-space]': 'space() ?? null',
    '[attr.data-sticky]': "sticky() ? '' : null",
  },
  exportAs: 'yetiStackChild',
})
export class YetiStackChild {
  /**
   * Pushes this child and everything after it to the end of a stack that is
   * taller than its content.
   */
  readonly split = input(false, { transform: booleanAttribute });
  /** The gap before this one child. Unset, the stack's gap applies. */
  readonly space = input<YetiGap>();
  /**
   * Pins this child at `--yeti-sticky-offset` from the top of the scrollport
   * while the rest scrolls past.
   */
  readonly sticky = input(false, { transform: booleanAttribute });

  constructor() {
    // The parent for the later in-item check; nothing reads it yet (stack
    // spec, section 3). `skipSelf`: an element that is also a stack finds
    // its parent stack, not itself.
    inject(yetiStackToken, { optional: true, skipSelf: true });
  }
}
