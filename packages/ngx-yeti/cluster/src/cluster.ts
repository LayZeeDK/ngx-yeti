import { Directive, input } from '@angular/core';
import type { YetiAlign, YetiGap, YetiJustify, YetiWidth } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';

/**
 * Yeti's `cluster` on the consumer's element: the `cluster` class, the typed
 * `data-*` attributes, and the `cluster` item file (cluster spec, sections 2
 * to 4). The cluster adds no role, no tab stop, and no listener.
 *
 * Usage rules:
 *
 * 1. Put `yetiCluster` on the element whose children are the row's items: a
 *    `ul` when the items are a list, with `role="list"` as Yeti writes it; a
 *    `nav` with an `aria-label` for a row of site links; a `div` otherwise.
 *    The cluster adds no semantics of its own.
 * 2. Do not write `class="cluster"`, `data-gap`, `data-align`,
 *    `data-justify`, `data-threshold`, or `data-ngx-yeti-item-cluster`
 *    statically on the host. The directive binds them all; a static Yeti
 *    attribute is written back at hydration and removed again by the unset
 *    binding. A value newer than the pin goes through the input as
 *    `[gap]="$any('new')"`.
 * 3. Give a thresholded cluster a block that has a width. Do not make it an
 *    item of another cluster, or of any flex row that sizes its items by
 *    their content, unless it has a width of its own or `flex-grow`:
 *    otherwise it has no content width to offer and collapses to nothing.
 * 4. Do not reorder items visually (no `order` and no `row-reverse` in an
 *    application class on the items or the host), so that reading and focus
 *    order stay the source order.
 * 5. `align` may be written in its static form (`align="end"`); the
 *    directive removes the HTML attribute it would otherwise leave. The
 *    hydration rule of usage rule 2 does not cover this static form.
 * 6. Import `YetiCluster` in every component whose template writes
 *    `yetiCluster`. A forgotten import renders an unstyled element with no
 *    error when every input is written in its static form; a bound input
 *    (`[gap]`) makes the compiler report it.
 *
 * For a cluster first rendered on the client, add `cluster` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: '[yetiCluster]',
  host: {
    class: 'cluster',
    'data-ngx-yeti-item-cluster': '',
    '[attr.data-gap]': 'gap() ?? null',
    '[attr.data-align]': 'align() ?? null',
    '[attr.data-justify]': 'justify() ?? null',
    '[attr.data-threshold]': 'threshold() ?? null',
    // HTML's `align` is a text-alignment hint that Chromium and WebKit honour
    // on any element, so a static `align="end"` would end-align the text of
    // every item as well as the row.
    '[attr.align]': 'null',
  },
  exportAs: 'yetiCluster',
})
export class YetiCluster {
  /**
   * The space between items and between wrapped rows. A pair such as
   * `sm-lg` grows fluidly from the first stop to the second. Unset, Yeti's
   * `md` applies.
   */
  readonly gap = input<YetiGap>();
  /**
   * The items' vertical alignment within a row. Unset, Yeti's `center`
   * applies. The static form (`align="baseline"`) never aligns the items'
   * text.
   */
  readonly align = input<YetiAlign>();
  /** How the items share the row. Unset, Yeti's `start` applies. */
  readonly justify = input<YetiJustify>();
  /**
   * The cluster's own width below which every item takes the whole row.
   * Setting it makes the cluster an inline-size container, so it takes the
   * width of its block (usage rule 3). Unset, the cluster is a plain
   * wrapping row.
   */
  readonly threshold = input<YetiWidth>();

  constructor() {
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('cluster');
  }
}
