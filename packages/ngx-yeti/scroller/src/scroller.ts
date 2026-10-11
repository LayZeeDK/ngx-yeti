import { Directive, booleanAttribute, input } from '@angular/core';
import type { YetiGap, YetiJustify, YetiWidth } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';

/** Where a snapping item settles: the three `justify` values Yeti's scroller takes. */
export type YetiScrollerJustify = Extract<
  YetiJustify,
  'start' | 'center' | 'end'
>;

/**
 * Yeti's `scroller` on the consumer's element: the `scroller` class, the
 * static `role="region"` and `tabindex="0"` Yeti's manifest requires, the
 * typed `data-*` attributes, and the `scroller` item file (scroller spec,
 * sections 2 to 4). The focus stop and the arrow-key scrolling are the
 * browser's; the directive adds no listener.
 *
 * Usage rules:
 *
 * 1. Put `yetiScroller` on a `div` or a `section`. Never put it on a `ul`,
 *    `ol`, `table`, `nav`, or other element whose own role the page depends
 *    on: `role="region"` would replace that role. A list of cards keeps its
 *    semantics as the items' own markup; a wide table goes inside the
 *    scroller as its one child.
 * 2. Name every scroller with `aria-label` or `aria-labelledby` on the same
 *    element, and translate an `aria-label` with `i18n-aria-label`. When the
 *    strip has a visible title, put the heading before the scroller, not
 *    inside it, and point `aria-labelledby` at the heading's own static
 *    `id`. An unnamed scroller is a Tab stop announced only as "region".
 * 3. Do not write `class="scroller"`, `role`, `tabindex`, `data-gap`,
 *    `data-width`, `data-snap`, `data-justify`, or
 *    `data-ngx-yeti-item-scroller` on the element. The directive renders
 *    them; a static `role` or `tabindex` of the consumer replaces the
 *    directive's, and a static `data-*` copy is written back and removed
 *    again at hydration. There is no opt-out of the focus stop. A value newer
 *    than the pin goes through `$any` (`[width]="$any('3xl')"`).
 * 4. Set `justify` only with `snap`. Without `data-snap`, `data-justify` does
 *    nothing on a scroller.
 * 5. Do not put `yetiScroller` on the same element as another layout that
 *    sets `display` (`yetiCluster`, `yetiColumns`, `yetiGrid`, `yetiStack`,
 *    and the rest); write the other layout inside an item instead. `yetiBox`
 *    beside it is fine, and one `gap` feeds both.
 * 6. Give the scroller at least one element child. Every direct child is an
 *    item: an element, or a component's host element. `@for`, `@if`,
 *    `@defer`, and `ng-container` add no element, so the elements they
 *    render are the items. A wrapper element inside a component makes that
 *    wrapper the single item.
 * 7. Keep reading order as source order: do not reorder items with CSS
 *    `order` or a reversed direction.
 * 8. Bind the inputs from values that are the same on the server and the
 *    client, never from a browser-only read such as the window's width.
 * 9. Import `YetiScroller` in every component whose template writes the
 *    attribute. A forgotten import renders a plain element with no class, no
 *    role, and no `tabindex`, with no error, unless an input is bound
 *    (`[width]`) or a template reference names `yetiScroller`.
 *
 * For a scroller first rendered on the client, add `scroller` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: '[yetiScroller]',
  host: {
    class: 'scroller',
    role: 'region',
    tabindex: '0',
    'data-ngx-yeti-item-scroller': '',
    '[attr.data-gap]': 'gap() ?? null',
    '[attr.data-width]': 'width() ?? null',
    '[attr.data-snap]': "snap() ? '' : null",
    '[attr.data-justify]': 'justify() ?? null',
  },
  exportAs: 'yetiScroller',
})
export class YetiScroller {
  /**
   * The space between items. A pair such as `sm-lg` grows fluidly from the
   * first stop to the second. Unset, Yeti's `md` applies.
   */
  readonly gap = input<YetiGap>();
  /**
   * One width for every item instead of its natural one. A static
   * `width="sm"` also stays on the host as an HTML attribute, which does
   * nothing on a `div` or a `section`.
   */
  readonly width = input<YetiWidth>();
  /** Snaps each item into place as the track scrolls. */
  readonly snap = input(false, { transform: booleanAttribute });
  /**
   * Where each item settles while `snap` is on (usage rule 4). Unset, items
   * settle at their start edge.
   */
  readonly justify = input<YetiScrollerJustify>();

  constructor() {
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('scroller');
  }
}
