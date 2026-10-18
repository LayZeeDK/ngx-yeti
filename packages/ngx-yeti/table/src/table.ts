import { Directive, booleanAttribute, input } from '@angular/core';
import type { YetiSizeControl } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';
import { yetiTableToken } from './table-tokens';

/**
 * Yeti's `table` on the consumer's native `table`: the `table` class, the
 * typed `data-*` attributes, and the `table` item file (table spec, sections
 * 2 to 4). The table keeps its native role and header relationships; the
 * directive adds no role, no tab stop, and no listener.
 *
 * Usage rules:
 *
 * 1. Write the table's structure as the HTML parser builds it: an explicit
 *    `tbody` around the body rows, a `tr` inside `thead`, rows as `tr`
 *    elements, and text only inside a `caption`, `th`, or `td`. The browser
 *    inserts a missing `tbody` and moves misplaced content out of the table,
 *    so the server's DOM and the client's would differ, which is a hydration
 *    mismatch. `@for`, `@if`, and `ng-container` add no element, so rows
 *    they render are fine.
 * 2. A component that renders a row is an attribute-selector component on a
 *    `tr` (`<tr appTrailRow [trail]="t">`), as Material's rows are; never an
 *    element-selector host such as `<app-trail-row>` inside a `tbody`. The
 *    parser moves an unknown element in a `tbody` out of the table, which
 *    breaks usage rule 1.
 * 3. Put `yetiTableCell` on a `th`, `td`, or `tr` of a `yetiTable`. `nowrap`
 *    belongs on a `th` or `td`; on a `tr` it does nothing, because Yeti's
 *    rule is for cells. To keep a whole table's lines, use the table's
 *    `nowrap`.
 * 4. Name every table: a `caption` as the table's first child, or
 *    `aria-label` or `aria-labelledby` on the `table`. Translate a caption
 *    with `i18n` and an `aria-label` with `i18n-aria-label`. The directive
 *    declares no name input.
 * 5. Give header cells `scope="col"` or `scope="row"`. Use `headers` with
 *    your own ids only for a table whose headers `scope` cannot express.
 * 6. Do not write `class="table"`, a static `data-size`, `data-striped`,
 *    `data-hover`, `data-border`, `data-nowrap`, `data-fixed`, `data-align`,
 *    `data-numeric`, `data-sticky`, or `data-ngx-yeti-item-table`: the
 *    directives bind them, and hydration writes a static attribute again
 *    before the binding wins. The static `align` and `border` input forms
 *    are accepted. A value newer than the pin is bound as
 *    `[size]="$any('xl')"`. Do not put `yetiBorder` on a `table[yetiTable]`:
 *    use the table's `border` input, because both bind `data-border` and
 *    Yeti's border marker skips `.table`. Do not put `yetiIcon`, or any
 *    other item directive that declares `align`, on a `yetiTableCell` host:
 *    put it inside the cell.
 * 7. Put a table wider than its container inside a `yetiScroller`, as its
 *    one child, and name the scroller; never put `yetiScroller` on the
 *    `table` itself, because its `role="region"` would replace the table's
 *    role. With `nowrap`, a scroller is where the kept lines go.
 * 8. Keep the table a table: put no directive or style that changes
 *    `display` on the `table`, its rows, or its cells, and never restyle
 *    rows as cards at narrow widths. A layout goes inside a cell, not on it.
 * 9. Put the same `yetiNumeric` on a numeric column's header cell and its
 *    data cells, so that the header aligns with its figures. A cell's own
 *    `align` outranks its `yetiNumeric`, and a cell's `yetiNumeric` outranks
 *    its row's `align`.
 * 10. A pinned head (`sticky` on `yetiTableHead`) pins to the nearest scroll
 *     container. Inside a `scroller`, which scrolls sideways and so is also a
 *     scroll container on the other axis, the head does not pin to the page.
 *     Where the stuck head can sit above focusable content in the rows, set
 *     `--yeti-scroll-padding` on `:root` to at least the offset plus the
 *     head's height.
 * 11. Import each directive in every component whose template writes its
 *     attribute. A forgotten import of `YetiTable`, `YetiTableCell`, or
 *     `YetiNumeric` with no bound input renders the bare element with Yeti's
 *     base table look and no error; a bound input makes the compiler report
 *     it.
 *
 * Tailwind v4 also generates a `.table` utility, `display: table`, which a
 * `table` already has, so the collision changes nothing and needs no
 * `@source not inline('table')`; keep the shared layer statement.
 *
 * For a table first rendered on the client, add `table` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: 'table[yetiTable]',
  providers: [{ provide: yetiTableToken, useExisting: YetiTable }],
  host: {
    class: 'table',
    'data-ngx-yeti-item-table': '',
    '[attr.data-size]': 'size() ?? null',
    '[attr.data-striped]': "striped() ? '' : null",
    '[attr.data-hover]': "hover() ? '' : null",
    '[attr.data-border]': "border() ? '' : null",
    '[attr.data-nowrap]': "nowrap() ? '' : null",
    '[attr.data-fixed]': "fixed() ? '' : null",
    // HTML's `border` on a `table` draws an outer border and, through the
    // browser's own rules, a border on every cell, so a static `border`
    // would add the browser's grid to Yeti's cell borders.
    '[attr.border]': 'null',
  },
  exportAs: 'yetiTable',
})
export class YetiTable {
  /** Cell padding and text size. Unset, Yeti's `md` applies. */
  readonly size = input<YetiSizeControl>();
  /** Tints every other body row while true. */
  readonly striped = input(false, { transform: booleanAttribute });
  /** Tints the body row under the pointer while true. */
  readonly hover = input(false, { transform: booleanAttribute });
  /**
   * Draws every cell's border while true. The static form (`border`) never
   * draws the browser's own table border.
   */
  readonly border = input(false, { transform: booleanAttribute });
  /** Keeps every cell on one line while true; put the table in a scroller. */
  readonly nowrap = input(false, { transform: booleanAttribute });
  /** Shares the width equally between the columns while true. */
  readonly fixed = input(false, { transform: booleanAttribute });

  constructor() {
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('table');
  }
}
