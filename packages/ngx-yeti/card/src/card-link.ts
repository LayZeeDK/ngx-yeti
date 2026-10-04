import { Directive, booleanAttribute, inject, input } from '@angular/core';
import { yetiCardToken } from './card-tokens';

/**
 * Yeti's `data-stretch` marker on a card's link: with `stretch`, the link
 * covers the whole card, so the card is one press target while the link keeps
 * its own name (card spec, sections 2 to 4). It sets no presence attribute and
 * loads no item file; the card's own file holds the marker's rule.
 *
 * Usage rules (numbered as on `YetiCard`):
 *
 * 1. The card is an `article`, or an `li` in a list with `role="list"`.
 * 2. Never wrap a card in a link.
 * 3. Put this link inside the card's heading, write `yetiCardLink stretch`
 *    on it, and let the heading's text be its text. Give one link per card
 *    `stretch`.
 * 4. A footer link to the same destination takes `tabindex="-1"`; every other
 *    control keeps its own Tab stop and click above the stretched link.
 * 5. Put no positioned element between the card and this link.
 * 6. Put the card's picture first, with alternative text for what is visible
 *    after the crop.
 * 7. Use `NgOptimizedImage` with `width` and `height`, never `fill`.
 * 8. Put the `footer` last.
 * 9. Do not write `data-stretch` by hand; the directive binds it.
 * 10. Bind `stretch` from a value that is the same on the server and the
 *     client.
 * 11. Import `YetiCardLink` in every component whose template writes it: a
 *     forgotten import with a static `stretch` renders a link that does not
 *     stretch, with no error.
 *
 * Outside a card it renders `data-stretch`, which matches no rule there, so
 * the link stays an ordinary link.
 */
@Directive({
  selector: 'a[yetiCardLink]',
  host: {
    '[attr.data-stretch]': "stretch() ? '' : null",
  },
  exportAs: 'yetiCardLink',
})
export class YetiCardLink {
  /** Stretches the link over the whole card. */
  readonly stretch = input(false, { transform: booleanAttribute });

  constructor() {
    // The parent for the later in-item check; nothing reads it yet (card
    // spec, section 3).
    inject(yetiCardToken, { optional: true, skipSelf: true });
  }
}
