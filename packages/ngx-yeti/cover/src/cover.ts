import { Directive, input } from '@angular/core';
import type { YetiGap, YetiHeight } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';
import { yetiCoverToken } from './cover-tokens';

/**
 * Yeti's `cover` on the consumer's element: the `cover` class, the typed
 * `data-*` attributes, and the `cover` item file (cover spec, sections 2 to
 * 4). The cover is at least as tall as the viewport by default and centres
 * the one child marked with `yetiCoverChild center` in the space the others
 * leave. It adds no role, no tab stop, and no listener.
 *
 * Usage rules:
 *
 * 1. Put `yetiCover` on an element that holds flow content (`header`,
 *    `section`, `main`, `article`, `footer`, or `div`), with at least one
 *    child. On those hosts the static `height` attribute is inert.
 * 2. Mark exactly one direct child with `yetiCoverChild center`. With none,
 *    nothing is centred and every child sits at the top; with two, the free
 *    space is split between them. Toggling `center` between children is
 *    fine as long as one carries it at a time.
 * 3. Put `yetiCoverChild` on a direct child of the cover element. A marker
 *    on a grandchild does nothing. A component's host element is the child:
 *    write `<app-hero-copy yetiCoverChild center>`, not the directive inside
 *    the component's template. `@if`, `@for`, `@defer`, and `ng-container`
 *    add no element and need no care.
 * 4. When the cover is the page's hero, keep the page's `h1` inside it. The
 *    cover takes no role; the element you pick gives the semantics.
 * 5. Do not write `class="cover"`, `data-gap`, `data-height`, `data-center`,
 *    or `data-ngx-yeti-item-cover` statically; the directives bind them. A
 *    value newer than the pin goes through `[height]="$any('new')"`.
 * 6. Bind `gap`, `height`, and `center` from values that are the same on the
 *    server and the client, never from a browser-only read such as the
 *    window's height. The cover already follows the viewport in CSS.
 * 7. Import every directive class the template writes. A forgotten import
 *    of `YetiCoverChild` with a static `center` renders an uncentred child
 *    with no error; only a bound input (`[gap]`, `[center]`) makes the
 *    compiler report it.
 *
 * For a cover first rendered on the client, add `cover` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: '[yetiCover]',
  providers: [{ provide: yetiCoverToken, useExisting: YetiCover }],
  host: {
    class: 'cover',
    'data-ngx-yeti-item-cover': '',
    '[attr.data-gap]': 'gap() ?? null',
    '[attr.data-height]': 'height() ?? null',
  },
  exportAs: 'yetiCover',
})
export class YetiCover {
  /**
   * The least space between the centred child and whatever sits above or
   * below it. A pair such as `sm-lg` grows fluidly from the first stop to
   * the second. Unset, Yeti's `md` applies.
   */
  readonly gap = input<YetiGap>();
  /**
   * The band's least height. Content taller than the band grows it; nothing
   * is cut off. Unset, Yeti's `full` applies. The static form (`height="md"`)
   * stays on the element beside `data-height` and does nothing there.
   */
  readonly height = input<YetiHeight>();

  constructor() {
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('cover');
  }
}
