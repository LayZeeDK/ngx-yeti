import { Directive, input } from '@angular/core';
import type { YetiColumns, YetiGap, YetiWidthOrNone } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';

/**
 * Yeti's `masonry` on the consumer's element: the `masonry` class, the typed
 * `data-*` attributes, and the `masonry` item file (masonry spec, sections 2
 * to 4). The layout adds no role, no tab stop, no listener, and no
 * reordering.
 *
 * Usage rules:
 *
 * 1. Put `yetiMasonry` on the element whose DOM children are the items, and
 *    give it at least two. Every direct child element is an item: an
 *    element, or a component's host element. `@for`, `@if`, and
 *    `ng-container` add no element, so the elements they render are the
 *    items. A wrapper element inside a component makes that wrapper the
 *    single item.
 * 2. Use `min="none"` only together with `columns`, which then gives an
 *    exact count. Alone it gives one full-width column.
 * 3. Write the items in a source order that makes sense when read down each
 *    column and when read across. On the multi-column path, which every
 *    target browser takes unless it passes Yeti's guard, items read and take
 *    focus down the first column, then the next. On the native path they
 *    read roughly across. Screen readers and Tab follow source order on
 *    both. Where the order carries meaning (a timeline, ranked results,
 *    steps), use `grid` or `stack` instead (WCAG 1.3.2, 2.4.3).
 * 4. Do not reorder items visually with CSS `order`, `grid-row`,
 *    `grid-column`, or a reversed direction. Either path places items from
 *    source order, and a reorder on top would break usage rule 3.
 * 5. Do not give the items a margin: the layout sets the space under each
 *    item. An unlayered item margin wins over Yeti's rule and changes the gap
 *    on the multi-column path only.
 * 6. Give every image in an item its dimensions (`NgOptimizedImage` with
 *    `width` and `height`), so that the multi-column path can balance its
 *    columns before the image loads.
 * 7. Do not write `class="masonry"`, any of Yeti's `data-*` attributes, or
 *    `data-ngx-yeti-item-masonry` by hand on the host; the directive binds
 *    them. A value newer than the pin goes through `$any`
 *    (`[columns]="$any('7')"`).
 * 8. Import `YetiMasonry` in every component whose template writes the
 *    attribute. A forgotten import renders plain blocks with no error unless
 *    an input is bound or a template reference names `yetiMasonry`.
 *
 * For a layout first rendered on the client, add `masonry` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: '[yetiMasonry]',
  host: {
    class: 'masonry',
    'data-ngx-yeti-item-masonry': '',
    '[attr.data-min]': 'min() ?? null',
    '[attr.data-columns]': 'columns() ?? null',
    '[attr.data-gap]': 'gap() ?? null',
  },
  exportAs: 'yetiMasonry',
})
export class YetiMasonry {
  /**
   * The narrowest a column may be. `none` gives an exact count with
   * `columns`. Unset, Yeti's `xs` applies.
   */
  readonly min = input<YetiWidthOrNone>();
  /**
   * The most columns allowed. Fewer appear when the container cannot fit
   * that many at `min`.
   */
  readonly columns = input<YetiColumns>();
  /**
   * The space between columns and between items. Unset, Yeti's `md`
   * applies.
   */
  readonly gap = input<YetiGap>();

  constructor() {
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('masonry');
  }
}
