import { Directive, booleanAttribute, input } from '@angular/core';
import type {
  YetiColumns,
  YetiGap,
  YetiRows,
  YetiTracks,
  YetiWidth,
  YetiWidthOrNone,
} from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';
import { yetiGridToken } from './grid-tokens';

/**
 * Yeti's `grid` on the consumer's element: the `grid` class, the typed
 * `data-*` attributes, and the `grid` item file (grid spec, sections 2 to
 * 4). The grid adds no role, no tab stop, and no listener.
 *
 * Usage rules:
 *
 * 1. Put `yetiGrid` on the element that holds the cells, with at least one
 *    child. When the cells are a list of like things, use a `ul` or `ol`
 *    with `role="list"`; the role is yours.
 * 2. Put `yetiGridChild` on direct children of the grid element, and only on
 *    a cell that needs `start` or `span`. A marker on a grandchild does
 *    nothing. A component's host element is the child: write
 *    `<app-work yetiGridChild start="2">`. `@if`, `@for`, and `ng-container`
 *    add no element and need no care.
 * 3. Use `start` and `span` only in a grid with `tracks`; in a fitted grid
 *    they do nothing. Keep each placement inside the tracks: `start` at most
 *    `tracks`, and `start` plus `span` minus one at most `tracks`. A line
 *    past the last track makes an implicit track, not an error.
 * 4. Use `fold` only with `columns` set to `'2'`, `'4'`, or `'6'`, never with
 *    `tracks`, and not with `min="none"`: the fold needs a width per column.
 * 5. Pair `min="none"` with `columns`; alone it gives a single full-width
 *    column.
 * 6. With `tracks`, leave `min` and `columns` unset; they have no effect on a
 *    tracks grid. `threshold` has an effect only with `tracks`.
 * 7. With `rows`, give the number of parts of the fullest cell; a cell with
 *    fewer leaves its last rows empty, and a cell that spans rows cannot also
 *    be a size container.
 * 8. Do not write `class="grid"`, any of the grid's `data-*` attributes or
 *    markers, or `data-ngx-yeti-item-grid` by hand; the directives bind them.
 *    A value newer than the pin goes through `$any`
 *    (`[columns]="$any('7')"`).
 * 9. On a child that is an `ol`, `start` places the cell and never sets the
 *    list's first number; set that with `value` on the first `li`. Writing
 *    `start` statically is allowed.
 * 10. Bind every input from values that are the same on the server and the
 *     client, never from a browser-only read such as the window's width. The
 *     grid already responds to its own width in CSS.
 * 11. Import every directive class the template writes. A forgotten import
 *     of `YetiGridChild` with static `start` and `span` renders an unplaced
 *     cell, and one of `YetiGrid` with static inputs renders a plain list,
 *     both with no error; only a bound input makes the compiler report it.
 *
 * Tailwind v4 also generates `.grid` when its scanner finds the word; its
 * rule sets the same `display` as Yeti's and changes nothing visible, so a
 * consumer running both needs only the shared layer statement.
 *
 * For a grid first rendered on the client, add `grid` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: '[yetiGrid]',
  providers: [{ provide: yetiGridToken, useExisting: YetiGrid }],
  host: {
    class: 'grid',
    'data-ngx-yeti-item-grid': '',
    '[attr.data-min]': 'min() ?? null',
    '[attr.data-columns]': 'columns() ?? null',
    '[attr.data-gap]': 'gap() ?? null',
    '[attr.data-rows]': 'rows() ?? null',
    '[attr.data-fold]': "fold() ? '' : null",
    '[attr.data-tracks]': 'tracks() ?? null',
    '[attr.data-threshold]': 'threshold() ?? null',
  },
  exportAs: 'yetiGrid',
})
export class YetiGrid {
  /** The narrowest a cell may be. Unset, Yeti's `xs` applies. */
  readonly min = input<YetiWidthOrNone>();
  /**
   * The most columns allowed. Fewer appear when the container cannot fit
   * that many at `min`.
   */
  readonly columns = input<YetiColumns>();
  /**
   * The space between cells. A pair such as `sm-lg` grows fluidly from the
   * first stop to the second. Unset, Yeti's `md` applies.
   */
  readonly gap = input<YetiGap>();
  /**
   * How many rows each cell spans, one per part, so the parts of
   * neighbouring cells line up.
   */
  readonly rows = input<YetiRows>();
  /** Halves the column count as the grid narrows, instead of stepping. */
  readonly fold = input(false, { transform: booleanAttribute });
  /**
   * A fixed number of equal tracks that cells are placed on with
   * `yetiGridChild`, in place of the fitted columns.
   */
  readonly tracks = input<YetiTracks>();
  /**
   * With `tracks`: the grid's own width below which every cell takes the
   * whole row in source order. Unset, Yeti's `md` applies.
   */
  readonly threshold = input<YetiWidth>();

  constructor() {
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('grid');
  }
}
