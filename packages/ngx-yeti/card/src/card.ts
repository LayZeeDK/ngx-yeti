import { Directive, booleanAttribute, input } from '@angular/core';
import type { YetiRatio, YetiVariant, YetiWidth } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';
import { yetiCardToken } from './card-tokens';

/**
 * Yeti's `card` on the consumer's element: the `card` class, the typed
 * `data-*` attributes, and the `card` item file (card spec, sections 2 to 4).
 *
 * Usage rules:
 *
 * 1. Put `yetiCard` on an `article` for a card that stands alone, or on an
 *    `li` for cards in a list, and give that list `role="list"`.
 * 2. Never wrap a card in a link, and never put `yetiCard` on an `a` or a
 *    `button`.
 * 3. For a whole-card link, put the link inside the card's heading, write
 *    `yetiCardLink stretch` on it, and let the heading's text be its text.
 *    Give one link per card `stretch`.
 * 4. If the footer repeats the stretched link's destination as a link, give
 *    that footer link `tabindex="-1"`. Every other control keeps its own Tab
 *    stop and click.
 * 5. Put no positioned element between the card and the stretched link.
 * 6. Put the card's picture first, and write alternative text that describes
 *    what is visible after the crop (or empty text for a decorative picture).
 * 7. Use `NgOptimizedImage` on the card's `img` with `width` and `height`,
 *    never in `fill` mode.
 * 8. Put the `footer` last.
 * 9. Do not write `class="card"`, `data-variant`, `data-threshold`,
 *    `data-ratio`, `data-raised`, `data-stretch`, or `data-ngx-yeti-item-card`
 *    by hand on either host; the directives bind them.
 * 10. Bind every input from values that are the same on the server and the
 *     client, never from a browser-only read.
 * 11. Import `YetiCard`, and `YetiCardLink` where a template writes it, in
 *     every component whose template writes the attribute.
 *
 * For a card first rendered on the client, add `card` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: '[yetiCard]',
  providers: [{ provide: yetiCardToken, useExisting: YetiCard }],
  host: {
    class: 'card',
    'data-ngx-yeti-item-card': '',
    '[attr.data-variant]': 'variant() ?? null',
    '[attr.data-threshold]': 'threshold() ?? null',
    '[attr.data-ratio]': 'ratio() ?? null',
    '[attr.data-raised]': "raised() ? '' : null",
  },
  exportAs: 'yetiCard',
})
export class YetiCard {
  /** Tints the border and adds a bar along the top. Unset, the border is plain. */
  readonly variant = input<YetiVariant>();
  /**
   * The card's own width from which the picture sits beside the text instead
   * of on top. Unset, Yeti's `md` applies.
   *
   * Upstream bug Y12: `threshold="2xs"` matches no rule in `card.css`, which
   * has container blocks for `xs` to `2xl` only, so a `2xs` card keeps its
   * picture on top at every width.
   */
  readonly threshold = input<YetiWidth>();
  /**
   * The picture's aspect ratio while it sits on top of the body. Unset,
   * Yeti's `16/9` applies.
   */
  readonly ratio = input<YetiRatio>();
  /** A shadow instead of a border. */
  readonly raised = input(false, { transform: booleanAttribute });

  constructor() {
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('card');
  }
}
