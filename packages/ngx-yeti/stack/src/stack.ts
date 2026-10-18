import { Directive, booleanAttribute, input } from '@angular/core';
import type { YetiAlign, YetiGap } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';
import { yetiStackToken } from './stack-tokens';

/**
 * Yeti's `stack` on the consumer's element: the `stack` class, the typed
 * `data-*` attributes, and the `stack` item file (stack spec, sections 2 to
 * 4). The stack adds no role, no tab stop, and no listener.
 *
 * Usage rules:
 *
 * 1. Put `yetiStack` on the element that holds the children, with at least
 *    one child. The element's semantics are yours: a `form`, a `ul` or `ol`
 *    with `role="list"`, a `dl`, an `article`, or a plain `div`.
 * 2. Put `yetiStackChild` on direct children of the stack element, and only
 *    on a child that needs `split`, `space`, or `sticky`. A marker on a
 *    grandchild does nothing. A component's host element is the child:
 *    write `<app-actions yetiStackChild split>`. `@if`, `@for`, and
 *    `ng-container` add no element and need no care.
 * 3. Mark at most one child with `split`. The split takes effect only when
 *    the stack is taller than its content: give the stack `fill`, or let its
 *    parent stretch it (a grid cell is as tall as its row).
 * 4. `space` does nothing on the first child, and `split` wins on a child
 *    that carries both. A child that is itself a stack with its own `gap`
 *    reads its own gap for `space`; give it a plain wrapper.
 * 5. With `rule`, a child that draws its own `::before`, a child that clips
 *    its overflow (a card, a frame, an accordion, a progress bar), or a
 *    replaced element such as an image gets no line; a ruled stack directly
 *    inside a ruled stack places its line by its own gap. Wrap such a child
 *    in a plain element.
 * 6. With the default `align` (stretch), an inline thing put straight into
 *    the stack (a badge, a button) becomes as wide as the column; set
 *    `align="start"` or wrap it in a paragraph.
 * 7. A `sticky` child stops at `--yeti-sticky-offset` from the top of the
 *    scrollport. When it is taller than that offset, set
 *    `--yeti-scroll-padding` on `:root` to its height, so that a control
 *    pulled into view by focus, a fragment jump, or `scrollIntoView` is not
 *    hidden under it (WCAG 2.4.11).
 * 8. Do not write `class="stack"`, any of the stack's `data-*` attributes or
 *    markers, or `data-ngx-yeti-item-stack` by hand; the directives bind
 *    them. A value newer than the pin goes through `$any`
 *    (`[gap]="$any('4xl')"`). Writing `align` statically is allowed.
 * 9. Bind every input from values that are the same on the server and the
 *    client, never from a browser-only read such as the window's height.
 *    `fill` already follows the viewport in CSS.
 * 10. Import every directive class the template writes. A forgotten import
 *     of `YetiStackChild` with a static `split` renders an unsplit child,
 *     and one of `YetiStack` with static inputs renders a plain block, both
 *     with no error; only a bound input makes the compiler report it.
 * 11. Do not write `yetiStack` with `fill` on a filled `yetiOverlayChild`:
 *     the one `fill` sets both, and the held child becomes at least as tall
 *     as the viewport. Put the stack inside the held child instead.
 *
 * For a stack first rendered on the client, add `stack` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: '[yetiStack]',
  providers: [{ provide: yetiStackToken, useExisting: YetiStack }],
  host: {
    class: 'stack',
    'data-ngx-yeti-item-stack': '',
    '[attr.data-gap]': 'gap() ?? null',
    '[attr.data-align]': 'align() ?? null',
    '[attr.data-fill]': "fill() ? '' : null",
    '[attr.data-rule]': "rule() ? '' : null",
    // HTML's `align` is a text-alignment hint that Chromium and WebKit honour
    // on any element, so a static `align="center"` would centre the stack's
    // text as well as its children.
    '[attr.align]': 'null',
  },
  exportAs: 'yetiStack',
})
export class YetiStack {
  /**
   * The space between children. A pair such as `sm-lg` grows fluidly from
   * the first stop to the second. Unset, Yeti's `md` applies.
   */
  readonly gap = input<YetiGap>();
  /**
   * The children's horizontal alignment. Unset, Yeti's `stretch` applies.
   * The static form (`align="start"`) never aligns the stack's text.
   */
  readonly align = input<YetiAlign>();
  /**
   * Makes the stack at least as tall as the viewport, so that a `split`
   * child reaches the bottom.
   */
  readonly fill = input(false, { transform: booleanAttribute });
  /**
   * Draws a line in the middle of each gap, of the border width in the
   * border colour. The gap is unchanged, and the line is decorative: it adds
   * no separator to the accessibility tree.
   */
  readonly rule = input(false, { transform: booleanAttribute });

  constructor() {
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('stack');
  }
}
