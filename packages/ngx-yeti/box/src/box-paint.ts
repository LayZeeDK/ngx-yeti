import { Directive, input } from '@angular/core';
import type { YetiPaint } from 'ngx-yeti';

/**
 * Yeti's `data-paint` marker on any element: a background by name, with the
 * text made for it (box spec, section 4). Its rule is always loaded, so the
 * marker sets no class, no presence attribute, and loads no item file. The
 * class is `NgxYetiPaint` because Yeti's typings export a type `YetiPaint`.
 *
 * Usage rules (the box's, numbered as on `YetiBox`):
 *
 * 1. Do not write `data-paint` on a host; the directive binds it.
 * 4. Do not put text on `yetiPaint="grey-40"`, `"grey-50"`, or `"grey-60"`:
 *    no text colour reaches full contrast on them. Use them for fills
 *    without text.
 * 6. Inside a painted element, a link that carries any class keeps its own
 *    colour, because Yeti's inheritance rule matches only `a:not([class])`.
 *    A link with an application class inside a band takes `yetiText` to
 *    stay readable.
 * 7. Import `NgxYetiPaint` in every component whose template writes
 *    `yetiPaint`; its required input makes the compiler report a forgotten
 *    import.
 */
@Directive({
  selector: '[yetiPaint]',
  host: { '[attr.data-paint]': 'yetiPaint()' },
  exportAs: 'yetiPaint',
})
export class NgxYetiPaint {
  /** The colour to fill the element with. */
  readonly yetiPaint = input.required<YetiPaint>();
}
