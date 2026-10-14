import { Directive, input } from '@angular/core';
import type { YetiGap, YetiSurface } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';

/**
 * Yeti's `box` on the consumer's element: the `box` class, the typed
 * `data-*` attributes, and the `box` item file (box spec, sections 2 to 4).
 * The box adds no role, no tab stop, and no listener.
 *
 * Usage rules:
 *
 * 1. Write `yetiBox` where Yeti's docs write `class="box"`, and bind the four
 *    inputs where they write the attributes. Do not write `class="box"`, a
 *    static `data-gap`, `data-gap-inline`, `data-gap-block`, `data-surface`,
 *    `data-border`, `data-paint`, `data-text`, or `data-ngx-yeti-item-box`
 *    on a host: the directives bind them. A value newer than the pin is
 *    bound as `[surface]="$any('new')"`.
 * 2. A box adds no semantics. Use a `section` or `article` when the content
 *    is one; the directive changes no element.
 * 3. Do not put `yetiBorder` on a `table[yetiTable]`. Yeti's border marker
 *    skips `.table`, and the table's own `data-border` means cell borders;
 *    use the table's `border` input.
 * 4. Do not put text on `yetiPaint="grey-40"`, `"grey-50"`, or `"grey-60"`:
 *    no text colour reaches full contrast on them. Use them for fills
 *    without text.
 * 5. A `yetiText` colour must reach 4.5:1, at any text size, against the
 *    background it sits on. The package cannot read the background, so this
 *    is the author's. A `yetiText` value on a painted element replaces the
 *    colour Yeti chose for that background.
 * 6. Inside a painted element, a link that carries any class keeps its own
 *    colour, because Yeti's inheritance rule matches only `a:not([class])`.
 *    A package directive that binds a class on a link (`yetiButton`) keeps
 *    its own colours by design; a link with an application class inside a
 *    band takes `yetiText` to stay readable.
 * 7. Import each directive in every component whose template writes its
 *    attribute. A forgotten import of `YetiBox` or `YetiBorder` with no
 *    bound input renders the bare element with no error; a bound input, or
 *    `yetiPaint` and `yetiText` with their required input, makes the
 *    compiler report it.
 * 8. Inside a painted element, use `yetiButton` for a button, or set a plain
 *    `button`'s text with `yetiText`. A plain `button` keeps Yeti's raised
 *    fill and inherits the band's text colour, so its words do not read.
 *
 * For a box first rendered on the client, add `box` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: '[yetiBox]',
  host: {
    class: 'box',
    'data-ngx-yeti-item-box': '',
    '[attr.data-gap]': 'gap() ?? null',
    '[attr.data-gap-inline]': 'gapInline() ?? null',
    '[attr.data-gap-block]': 'gapBlock() ?? null',
    '[attr.data-surface]': 'surface() ?? null',
  },
  exportAs: 'yetiBox',
})
export class YetiBox {
  /**
   * Padding on every side. A pair such as `sm-lg` grows fluidly from the
   * first stop to the second. Unset, Yeti's `md` applies.
   */
  readonly gap = input<YetiGap>();
  /** Padding on the two sides, over whatever `gap` set. */
  readonly gapInline = input<YetiGap>();
  /** Padding top and bottom, over whatever `gap` set. */
  readonly gapBlock = input<YetiGap>();
  /** Fills the box with one of the page's three tones. Unset, transparent. */
  readonly surface = input<YetiSurface>();

  constructor() {
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('box');
  }
}
