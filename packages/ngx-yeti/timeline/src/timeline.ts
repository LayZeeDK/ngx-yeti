import { Directive, booleanAttribute, input } from '@angular/core';
import type { YetiGap } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';

/**
 * Yeti's `timeline` on the consumer's `ol`: the `timeline` class, the typed
 * `data-*` attributes, and the `timeline` item file (timeline spec, sections
 * 2 to 4). Entries in order along a rail; the timeline adds no role, no tab
 * stop, and no listener.
 *
 * Usage rules:
 *
 * 1. Put `yetiTimeline` on an `ol`, so that the sequence is announced. The
 *    selector matches nothing else: on a `ul` or a `div` the attribute
 *    renders a plain element with no error, unless an input is bound or a
 *    template reference names `yetiTimeline`.
 * 2. Write `role="list"` statically on the `ol`. The timeline removes the
 *    list numbers, which removes the list semantics in some engines; the
 *    role restores them. The role is yours; the directive does not bind it.
 * 3. Make every direct child an `li`, and give the list at least two. A
 *    component that renders an entry takes an attribute selector on the
 *    `li` (`<li app-release>`). `@for`, `@if`, and `ng-container` add no
 *    element; a `@defer` block inside the list renders its placeholder and
 *    loading elements as children, so they are `li` too.
 * 4. Put a `time` element with a valid `datetime` in each entry, then a
 *    heading and text. The heading level follows the page's outline.
 * 5. Keep the entries in the order they happened, or in the order the page
 *    explains (newest first, for a changelog). Do not reorder them with CSS
 *    `order` or a reversed direction.
 * 6. Do not give the entries a margin or an inline padding; `gap` sets the
 *    space between them, and the start padding is the room for the rail.
 *    Put another item (a `card`, a `box`) inside the `li`, not on it.
 * 7. Put nothing meaningful in the rail or the entry dots. They are
 *    decorative and not checked for non-text contrast; show a status as
 *    text in the entry.
 * 8. Give the timeline a definite inline size from its container. The list
 *    is an inline-size container, so inside a shrink-to-fit parent (a flex
 *    item with no basis, an inline-block, a float) it collapses to its
 *    padding. In normal block flow nothing needs doing.
 * 9. Do not write `class="timeline"`, `data-gap`, `data-alternate`, or
 *    `data-ngx-yeti-item-timeline` statically on the host; the directive
 *    binds them. A value newer than the pin goes through `$any`
 *    (`[gap]="$any('4xl')"`).
 * 10. Import `YetiTimeline` in every component whose template writes the
 *     attribute. A forgotten import renders a plain numbered list with no
 *     error unless an input is bound or a template reference names
 *     `yetiTimeline`.
 *
 * For a timeline first rendered on the client, add `timeline` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: 'ol[yetiTimeline]',
  host: {
    class: 'timeline',
    'data-ngx-yeti-item-timeline': '',
    '[attr.data-gap]': 'gap() ?? null',
    '[attr.data-alternate]': "alternate() ? '' : null",
  },
  exportAs: 'yetiTimeline',
})
export class YetiTimeline {
  /**
   * The space between entries. A pair such as `sm-lg` grows fluidly from the
   * first stop to the second. Unset, Yeti's `lg` applies.
   */
  readonly gap = input<YetiGap>();
  /**
   * Puts the entries on alternate sides of a centred rail once the list is
   * at least 48rem wide; narrower, it stays single-sided.
   */
  readonly alternate = input(false, { transform: booleanAttribute });

  constructor() {
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('timeline');
  }
}
