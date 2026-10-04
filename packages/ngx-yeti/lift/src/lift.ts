import { Directive, input } from '@angular/core';
import type { YetiLift } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';

/**
 * Yeti's `lift` on the consumer's element: the `lift` class, the typed
 * `data-lift` gesture, and the `lift` item file (lift spec, sections 2 to 4).
 * Write it beside the element's other item directive, as in
 * `<article yetiCard yetiLift>`.
 *
 * Usage rules:
 *
 * 1. Put `yetiLift` on something that can be pressed and is big enough for
 *    the movement to read: a card that is a link, a tile in a grid of
 *    choices, a panel that opens something. Not on a button and not on
 *    static text.
 * 2. Keep the focusable thing inside the lifted element, or make the element
 *    itself focusable; the lift answers focus only through `:focus-visible`
 *    and `:has(:focus-visible)`.
 * 3. Write no static `class="lift"` or `data-lift` on an element that carries
 *    `yetiLift`; set the gesture through the input.
 * 4. Bind a gesture newer than the pin as `[yetiLift]="$any('new')"`.
 * 5. When colouring the lifted element on the same hover, set colours only;
 *    a `transition` declaration on the element replaces Yeti's and stops the
 *    shadow animating.
 * 6. Import `NgxYetiLift` in every component whose template writes
 *    `yetiLift`; a forgotten import renders a flat element with no error
 *    unless the input is bound.
 *
 * For a lifted element first rendered on the client, add `lift` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: '[yetiLift]',
  host: {
    class: 'lift',
    'data-ngx-yeti-item-lift': '',
    '[attr.data-lift]': 'yetiLift() || null',
  },
  exportAs: 'yetiLift',
})
export class NgxYetiLift {
  /**
   * The gesture: `rise` by `--yeti-lift-distance`, or `scale` by
   * `--yeti-lift-scale`. Unset or `''` (the bare attribute) renders no
   * `data-lift`, so Yeti's default, the rise, applies.
   */
  readonly yetiLift = input<YetiLift | ''>();

  constructor() {
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('lift');
  }
}
