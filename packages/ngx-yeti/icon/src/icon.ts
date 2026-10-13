import { Directive, input } from '@angular/core';
import type { YetiAlign, YetiGap } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';

/**
 * Yeti's `icon` on the consumer's link, button, or `span` that holds one
 * inline SVG and its text: the `icon` class, the typed `data-gap` and
 * `data-align` attributes, and the `icon` item file (icon spec, sections 2
 * to 4). The SVG is the consumer's element: the directive never touches it,
 * and adds no role, no tab stop, and no listener.
 *
 * Usage rules:
 *
 * 1. Put `yetiIcon` on the element that holds the SVG and its text: a link,
 *    a button, or a `span` inside a list item, a heading, or a paragraph. It
 *    makes that element an inline flex row.
 * 2. Give it exactly one inline `svg` as a direct child. Yeti's rule is a
 *    child selector, so an SVG inside a wrapper element is not sized; a
 *    component's host element is the child, so an SVG inside a component's
 *    template is not sized either. `@if`, `@for`, and `ng-container` add no
 *    element and need no care. Draw the SVG in `currentColor` (`stroke` or
 *    `fill`) so that it follows the text's colour.
 * 3. The accessible name:
 *    - Decorative, beside text that already says what the icon shows: give
 *      the SVG `aria-hidden="true"`. The text is the name. Never also give
 *      it an `aria-label`, which would hide nothing and repeat the name.
 *    - Meaningful and standing alone, as in an icon-only button or link:
 *      give the SVG `role="img"` and an `aria-label` that says what the
 *      control does ("Close", not "X icon"). An `aria-label` on the control
 *      itself gives the same name.
 *    - Meaningful beside text, where the glyph adds information the text
 *      does not carry (a warning sign before a message): give the SVG
 *      `role="img"` and an `aria-label` naming that information
 *      ("Warning").
 *    - Where a control has visible text, its accessible name contains that
 *      text, so a speech-input user can say it; the decorative form gives
 *      exactly that.
 *    - The directive writes no `aria-hidden`, no `role`, and no
 *      `aria-label`, and declares no input for them.
 * 4. Do not write `class="icon"`, `data-gap`, `data-align`, or
 *    `data-ngx-yeti-item-icon` statically. The directive binds them, and
 *    hydration writes a static attribute again before the binding wins. A
 *    value newer than the pin goes through `[align]="$any('new')"`.
 * 5. Do not put `yetiIcon` on a `th`, `td`, or `tr`. Wrap the cell's SVG in
 *    a `span yetiIcon` inside the cell.
 * 6. Make an icon-only control at least 24 by 24 CSS pixels, or give it the
 *    spacing WCAG 2.5.8 allows. An icon-only `yetiButton` gets Yeti's
 *    control size from the button item; an icon-only link or a bare `button`
 *    with only `yetiIcon` is one em square.
 * 7. Bind `gap` and `align` from values that are the same on the server and
 *    the client, never from a browser-only read.
 * 8. Import `YetiIcon` in every component whose template writes `yetiIcon`.
 *    A forgotten import with static `gap` and `align` renders an unsized SVG
 *    with no error; only a bound input (`[align]`) makes the compiler report
 *    it (NG8002).
 *
 * For an icon first rendered on the client, add `icon` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: '[yetiIcon]',
  host: {
    class: 'icon',
    'data-ngx-yeti-item-icon': '',
    '[attr.data-gap]': 'gap() ?? null',
    '[attr.data-align]': 'align() ?? null',
    // HTML's `align` is a text-alignment hint that Chromium and WebKit honour
    // on any element, so a static `align="end"` would end-align the text
    // beside the icon as well as the row.
    '[attr.align]': 'null',
  },
  exportAs: 'yetiIcon',
})
export class YetiIcon {
  /**
   * The space between the icon and its text. A pair such as `sm-lg` grows
   * fluidly from the first stop to the second. Unset, Yeti's `xs` applies.
   */
  readonly gap = input<YetiGap>();
  /**
   * How the icon lines up with the text: centred on the line, or on the
   * baseline with Yeti's one-eighth-em nudge. Unset, Yeti's `center`
   * applies. The static form (`align="baseline"`) never aligns the text.
   */
  readonly align = input<YetiAlign>();

  constructor() {
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('icon');
  }
}
