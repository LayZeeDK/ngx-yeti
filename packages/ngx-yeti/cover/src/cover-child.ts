import { Directive, booleanAttribute, inject, input } from '@angular/core';
import { yetiCoverToken } from './cover-tokens';

/**
 * Yeti's `center` marker on the one child of a cover that sits in the middle
 * of the free space (cover spec, sections 2 to 4). It sets no presence
 * attribute and loads no item file: the cover's own file holds the rule.
 *
 * Usage rules (numbered as on `YetiCover`):
 *
 * 2. Mark exactly one direct child with `yetiCoverChild center`. With none,
 *    nothing is centred; with two, the free space is split between them.
 *    Toggling `center` between children is fine as long as one carries it
 *    at a time.
 * 3. Put `yetiCoverChild` on a direct child of the cover element. A marker
 *    on a grandchild does nothing. A component's host element is the child.
 * 5. Do not write `data-center` by hand; the directive binds it.
 * 6. Bind `center` from values that are the same on the server and the
 *    client.
 * 7. Import `YetiCoverChild` in every component whose template writes it: a
 *    forgotten import with a static `center` renders an uncentred child,
 *    with no error.
 *
 * Outside a cover it still renders its marker, which then matches no rule.
 */
@Directive({
  selector: '[yetiCoverChild]',
  host: {
    '[attr.data-center]': "center() ? '' : null",
  },
  exportAs: 'yetiCoverChild',
})
export class YetiCoverChild {
  /** Centres this child in the space the cover's other children leave. */
  readonly center = input(false, { transform: booleanAttribute });

  constructor() {
    // The parent for the later in-item check; nothing reads it yet (cover
    // spec, section 3). `skipSelf`: an element that is also a cover finds
    // its parent cover, not itself.
    inject(yetiCoverToken, { optional: true, skipSelf: true });
  }
}
