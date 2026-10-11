import { Directive, input } from '@angular/core';
import type { YetiAlign, YetiGap, YetiSide, YetiWidth } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';
import { yetiSidebarToken } from './sidebar-tokens';

/**
 * Yeti's `sidebar` on the consumer's element: the `sidebar` class, the typed
 * `data-*` attributes, and the `sidebar` item file (sidebar spec, sections 2
 * to 4). The two children sit side by side while the content keeps at least
 * half the width, and stack when it cannot. The sidebar adds no role, no tab
 * stop, and no listener.
 *
 * Usage rules:
 *
 * 1. Put `yetiSidebar` on an element that holds flow content (`div`,
 *    `section`, `main`, `article`, `aside`, `header`, `footer`, or `form`),
 *    and give it exactly two direct children. Each child is an element or a
 *    component's host element. `@if`, `@for`, `@defer`, and `ng-container`
 *    add no element, so the elements they render are the children; a
 *    `@defer` block's placeholder or loading element is a child while it
 *    shows.
 * 2. Put the content first in the source when it matters more, and use
 *    `side="end"` to show the sidebar after it. `side` picks which child is
 *    the sidebar and never reorders them, so the reading order is the source
 *    order on both sides. Do not reorder the children with CSS `order` or a
 *    reversed direction (WCAG 1.3.2, 2.4.3).
 * 3. Put `yetiSidebarChild` only on a direct child of a `yetiSidebar` host,
 *    and only on a child that sticks. A child that does not stick needs no
 *    directive.
 * 4. A sticky child must stay usable when it is stuck. Stick only a child no
 *    taller than the smallest viewport the page supports, so that its own
 *    content can be reached. Once the two children have stacked, a sticky
 *    child that comes first sits above the other one while it scrolls under,
 *    so set `--yeti-scroll-padding` on the root to at least the sticky
 *    child's height on pages where that happens, or stick only a child that
 *    comes last in the stacked order. Yeti's default scroll padding is the
 *    sticky offset, which clears no bar of its own (WCAG 2.4.11).
 * 5. Do not write `class="sidebar"`, `data-side`, `data-width`, `data-gap`,
 *    `data-align`, `data-sticky`, or `data-ngx-yeti-item-sidebar` statically
 *    on either host; the directives bind them. A value newer than the pin
 *    goes through `$any` (`[width]="$any('3xl')"`).
 * 6. Write `align` either way: `align="center"` or
 *    `[align]="alignment()"`. The directive removes the HTML `align`
 *    attribute that the static form leaves.
 * 7. Bind every input from values that are the same on the server and the
 *    client, never from a browser-only read such as the window's width. The
 *    sidebar already follows its own width in CSS.
 * 8. Import `YetiSidebar`, and `YetiSidebarChild` where a template writes
 *    it, in every component whose template writes the attribute. A
 *    forgotten import of `YetiSidebarChild` with a static `sticky` renders a
 *    child that does not stick, with no error; only a bound input
 *    (`[sticky]`, `[width]`) or a template reference makes the compiler
 *    report it.
 *
 * For a sidebar first rendered on the client, add `sidebar` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: '[yetiSidebar]',
  providers: [{ provide: yetiSidebarToken, useExisting: YetiSidebar }],
  host: {
    class: 'sidebar',
    'data-ngx-yeti-item-sidebar': '',
    '[attr.data-side]': 'side() ?? null',
    '[attr.data-width]': 'width() ?? null',
    '[attr.data-gap]': 'gap() ?? null',
    '[attr.data-align]': 'align() ?? null',
    // HTML's `align` is a text-alignment hint that Chromium and WebKit honour
    // on any element, so a static `align="center"` would centre the
    // sidebar's text as well as its children.
    '[attr.align]': 'null',
  },
  exportAs: 'yetiSidebar',
})
export class YetiSidebar {
  /**
   * Which child is the sidebar: the first (`start`) or the last (`end`). It
   * never reorders the children. Unset, Yeti's `start` applies.
   */
  readonly side = input<YetiSide>();
  /**
   * The sidebar's preferred width. The pair stacks below twice this width
   * plus the gap. Unset, Yeti's `sm` applies. The static form (`width="xs"`)
   * stays on the element beside `data-width` and does nothing there.
   */
  readonly width = input<YetiWidth>();
  /**
   * The space between the two children. A pair such as `sm-lg` grows
   * fluidly from the first stop to the second. Unset, Yeti's `md` applies.
   */
  readonly gap = input<YetiGap>();
  /**
   * The vertical alignment of the two children when side by side. Unset,
   * Yeti's `stretch` applies. The static form (`align="start"`) never aligns
   * the sidebar's text.
   */
  readonly align = input<YetiAlign>();

  constructor() {
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('sidebar');
  }
}
