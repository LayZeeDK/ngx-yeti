import { Directive, booleanAttribute, input } from '@angular/core';
import type { YetiGap, YetiWidth } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';

/**
 * Yeti's `center` on the consumer's element: the `center` class, the typed
 * `data-*` attributes, and the `center` item file (center spec, sections 2
 * to 4). The center adds no role, no tab stop, and no listener.
 *
 * Usage rules:
 *
 * 1. Put `yetiCenter` on the wrapper of a page or a section. The center
 *    carries no landmark of its own: use `main`, `section`, or another
 *    element whose semantics the content needs.
 * 2. Do not write `class="center"`, `data-max`, `data-gap`,
 *    `data-intrinsic`, or `data-ngx-yeti-item-center` by hand on the host;
 *    the directive binds each of them. A value newer than the pin goes
 *    through the input as `$any('new-value')`.
 * 3. Do not put an inline border on the center's own element, and do not
 *    set the box's `gapInline` on it: the center's width leaves room for its
 *    own gutters only, so either one makes the column wider than its
 *    container below the maximum (WCAG 1.4.10). Put the border or the extra
 *    inline padding on a `yetiBox` inside the center.
 * 4. Import `YetiCenter` in every component whose template writes
 *    `yetiCenter`. A forgotten import of a center written with bound inputs
 *    fails to compile; a bare `<main yetiCenter>` renders an uncentred
 *    element with no error.
 *
 * For a center first rendered on the client, add `center` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: '[yetiCenter]',
  host: {
    class: 'center',
    'data-ngx-yeti-item-center': '',
    '[attr.data-max]': 'max() ?? null',
    '[attr.data-gap]': 'gap() ?? null',
    '[attr.data-intrinsic]': "intrinsic() ? '' : null",
  },
  exportAs: 'yetiCenter',
})
export class YetiCenter {
  /**
   * The widest the content column may be. Unset, Yeti's `xl` applies. The
   * static form (`max="md"`) stays on the element beside `data-max` and does
   * nothing there.
   */
  readonly max = input<YetiWidth>();
  /**
   * The gutter on each side. A pair such as `sm-lg` grows fluidly from the
   * first stop to the second. Unset, Yeti's `md` applies.
   */
  readonly gap = input<YetiGap>();
  /**
   * Shrinks the column to its content and centres each child on its own
   * width.
   */
  readonly intrinsic = input(false, { transform: booleanAttribute });

  constructor() {
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('center');
  }
}
