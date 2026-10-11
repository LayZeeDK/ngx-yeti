import { Directive, input } from '@angular/core';
import type {
  YetiAlign,
  YetiColumns,
  YetiGap,
  YetiJustify,
  YetiWidth,
} from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';
import { yetiColumnsToken } from './columns-tokens';

/**
 * Yeti's `columns` on the consumer's element: the `columns` class, the typed
 * `data-*` attributes, and the `columns` item file (columns spec, sections 2
 * to 4). The children share a row in equal shares while the container is
 * wider than the threshold, and each takes its own row when it is not. The
 * layout adds no role, no tab stop, and no listener.
 *
 * Named `NgxYetiColumns` because Yeti's typings already export
 * `YetiColumns`, the type of the `columns` input.
 *
 * Usage rules:
 *
 * 1. Put `yetiColumns` on the element whose DOM children are the columns,
 *    and give it at least two. Every direct child element is a column: an
 *    element, or a component's host element. `@for`, `@if`, and
 *    `ng-container` add no element, so the elements they render are the
 *    columns. A wrapper element inside a component makes that wrapper the
 *    single column.
 * 2. Put `yetiColumnsChild` only on a direct child of a `yetiColumns` host,
 *    and only on a child that takes a `span`. A plain column needs no
 *    directive. Outside a columns host it compiles and does nothing.
 * 3. Do not write `class="columns"`, any of Yeti's `data-*` attributes, or
 *    `data-ngx-yeti-item-columns` statically on either host; the directives
 *    bind them. A value newer than the pin goes through `$any`
 *    (`[columns]="$any('7')"`).
 * 4. Keep reading order as source order. Do not reorder columns visually
 *    with CSS `order` or a reversed direction (WCAG 1.3.2, 2.4.3).
 * 5. Choose a threshold at which each column's content fits its share.
 *    Above the threshold the children share the row whatever their content,
 *    and a long unbreakable word can overflow a narrow share (WCAG 1.4.10).
 * 6. Write `align` either way: `align="center"` or `[align]="alignment()"`.
 *    The directive removes the HTML `align` attribute that the static form
 *    leaves.
 * 7. Import `NgxYetiColumns`, and `YetiColumnsChild` where a template
 *    writes it, in every component whose template writes the attribute. A
 *    forgotten import renders plain blocks with no error unless an input is
 *    bound (`[columns]`) or a template reference names the `exportAs`.
 *
 * For a columns layout first rendered on the client, add `columns` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: '[yetiColumns]',
  providers: [{ provide: yetiColumnsToken, useExisting: NgxYetiColumns }],
  host: {
    class: 'columns',
    'data-ngx-yeti-item-columns': '',
    '[attr.data-threshold]': 'threshold() ?? null',
    '[attr.data-gap]': 'gap() ?? null',
    '[attr.data-align]': 'align() ?? null',
    '[attr.data-justify]': 'justify() ?? null',
    '[attr.data-columns]': 'columns() ?? null',
    // HTML's `align` is a text-alignment hint that Chromium and WebKit honour
    // on any element, so a static `align="center"` would centre the columns'
    // text as well as the columns.
    '[attr.align]': 'null',
  },
  exportAs: 'yetiColumns',
})
export class NgxYetiColumns {
  /**
   * The container width below which the columns become rows. Unset, Yeti's
   * `md` applies.
   */
  readonly threshold = input<YetiWidth>();
  /**
   * The space between columns and between rows. A pair such as `sm-lg`
   * grows fluidly from the first stop to the second. Unset, Yeti's `md`
   * applies.
   */
  readonly gap = input<YetiGap>();
  /**
   * The vertical alignment of the columns in a row. Unset, Yeti's `stretch`
   * applies. The static form (`align="center"`) never aligns the text.
   */
  readonly align = input<YetiAlign>();
  /**
   * How the columns are distributed along a row that has room left. Unset,
   * Yeti's `start` applies.
   */
  readonly justify = input<YetiJustify>();
  /**
   * The most columns on one row; every later child takes a full row. Unset,
   * every child shares the row.
   */
  readonly columns = input<YetiColumns>();

  constructor() {
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('columns');
  }
}
