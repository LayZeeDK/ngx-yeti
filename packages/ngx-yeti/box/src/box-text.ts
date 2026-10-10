import { Directive, input } from '@angular/core';
import type { YetiPaint } from 'ngx-yeti';

/**
 * Yeti's `data-text` marker on any element: the words' colour by name (box
 * spec, section 4). On a painted element it wins over the automatic text
 * colour. Its rule is always loaded, so the marker sets no class, no
 * presence attribute, and loads no item file.
 *
 * Usage rules (the box's, numbered as on `YetiBox`):
 *
 * 1. Do not write `data-text` on a host; the directive binds it.
 * 5. A `yetiText` colour must reach 4.5:1, at any text size, against the
 *    background it sits on. The package cannot read the background, so this
 *    is the author's. A `yetiText` value on a painted element replaces the
 *    colour Yeti chose for that background.
 * 7. Import `YetiText` in every component whose template writes `yetiText`;
 *    its required input makes the compiler report a forgotten import.
 */
@Directive({
  selector: '[yetiText]',
  host: { '[attr.data-text]': 'yetiText()' },
  exportAs: 'yetiText',
})
export class YetiText {
  /** The colour of the element's words. */
  readonly yetiText = input.required<YetiPaint>();
}
