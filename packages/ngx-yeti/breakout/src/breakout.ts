import { Directive, input } from '@angular/core';
import type { YetiGap, YetiWidth } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';
import { yetiBreakoutToken } from './breakout-tokens';

/**
 * Yeti's `breakout` on the consumer's element: the `breakout` class, the
 * typed `data-*` attributes, and the `breakout` item file (breakout spec,
 * sections 2 to 4). A centred reading column with gutters; the breakout adds
 * no role, no tab stop, and no listener.
 *
 * Usage rules:
 *
 * 1. Put `yetiBreakout` on the element that holds a long read's flow
 *    (`article`, `main`, `section`, or `div`), with at least one child.
 * 2. Put `yetiBreakoutChild` and `yetiBreakoutNote` on direct children of
 *    the breakout element; a marker on a grandchild does nothing. A
 *    component's host element is the child: write
 *    `<app-figure yetiBreakoutChild bleed>`, not the directive inside the
 *    component's template. `@if`, `@for`, and `ng-container` add no element
 *    and need no care.
 * 3. Put a note directly after the child it annotates, in source order, and
 *    at most one note per child. A second note after the same child stacks
 *    below the first and pushes the next child down a row.
 * 4. Do not write `class="breakout"`, `data-max`, `data-gap`, `data-bleed`,
 *    `data-note`, or `data-ngx-yeti-item-breakout` statically; the
 *    directives bind them. A value newer than the pin goes through
 *    `[max]="$any('new')"`.
 * 5. Bind `max`, `gap`, and `bleed` from values that are the same on the
 *    server and the client, never from a browser-only read such as the
 *    window's width. The layout already responds to its own width.
 * 6. Import every directive class the template writes. A forgotten import
 *    of `YetiBreakoutChild` with a static `bleed` renders a plain child with
 *    no error; only a bound input (`[max]`, `[bleed]`) makes the compiler
 *    report it.
 *
 * For a breakout first rendered on the client, add `breakout` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: '[yetiBreakout]',
  providers: [{ provide: yetiBreakoutToken, useExisting: YetiBreakout }],
  host: {
    class: 'breakout',
    'data-ngx-yeti-item-breakout': '',
    '[attr.data-max]': 'max() ?? null',
    '[attr.data-gap]': 'gap() ?? null',
  },
  exportAs: 'yetiBreakout',
})
export class YetiBreakout {
  /**
   * The widest the reading column may be. Unset, Yeti's `md` applies. The
   * static form (`max="lg"`) stays on the element beside `data-max` and does
   * nothing there.
   */
  readonly max = input<YetiWidth>();
  /**
   * The gutter on each side and the space between children. A pair such as
   * `sm-lg` grows fluidly from the first stop to the second. Unset, Yeti's
   * `md` applies.
   */
  readonly gap = input<YetiGap>();

  constructor() {
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('breakout');
  }
}
