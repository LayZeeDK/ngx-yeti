import { Directive, booleanAttribute, input } from '@angular/core';
import type { YetiGap } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';
import { yetiOverlayToken } from './overlay-tokens';

/**
 * Yeti's `overlay` on the box being covered: the `overlay` class, the typed
 * `data-*` attributes, and the `overlay` item file (overlay spec, sections 2
 * to 4). It holds one child over the rest with CSS alone. Positioning only:
 * it adds no role, no tab stop, no listener, and no `inert`.
 *
 * Usage rules:
 *
 * 1. Put `yetiOverlay` on the box to be covered, with at least two direct
 *    children: the content underneath and the held child. A component's host
 *    element counts as a child; `@if`, `@for`, `@defer`, and `ng-container`
 *    add no element.
 * 2. Mark exactly one direct child with `yetiOverlayChild over`. A marker on
 *    a grandchild does nothing, and two held children are both centred on
 *    the same point. Write `<app-badge yetiOverlayChild over>`, not the
 *    directive inside the component's template.
 * 3. Write `fill` only beside `over` on the same element.
 * 4. For anything modal, or anything that interrupts the page and needs focus
 *    management or a way to dismiss it, use the dialog or the tooltip, not
 *    the overlay. A `fixed` held child is not in the top layer and does not
 *    make the page inert.
 * 5. When a held child covers focusable content, make the covered content
 *    `inert` for as long as it is covered, for example
 *    `[attr.inert]="saving() ? '' : null"` on a wrapper of the covered
 *    controls. Never put `inert` on the overlay itself, which would also make
 *    the held child inert.
 * 6. If a held child's content can be larger than the box minus the gap, it
 *    scrolls inside itself, so make it a scroll region: `tabindex="0"`, a
 *    role such as `region`, and a name. A status message such as "Saving..."
 *    is your live region (`role="status"`); the package adds no role.
 * 7. Write `fill` bare or bound (`fill`, `[fill]="saving()"`), never with a
 *    paint value such as `fill="red"`, which on an `svg` held child would
 *    paint it.
 * 8. Do not write `yetiStack` and a filled `yetiOverlayChild` on one element:
 *    the one `fill` sets both, and the held child becomes at least as tall as
 *    the viewport. Put the stack inside the held child instead. A `yetiCover`
 *    as a veil has the same least height by default; give that element
 *    `--yeti-cover-height: auto` so the veil is the box's height.
 * 9. On a centred held child (`over` without `fill`), do not use anything
 *    that sets `translate`: `yetiLift`, the `rise`, `fall`, and `slide`
 *    arrivals of `yetiEnter`, or `yetiAttention="shake"`. Each replaces the
 *    centring while it runs. The `fade` and `scale` arrivals are safe, and a
 *    moving element can go inside the held child instead.
 * 10. With `fixed`, the held child centres on the viewport unless an ancestor
 *     of the overlay establishes a containing block for fixed-position
 *     descendants: a `transform`, `translate`, `scale`, or `filter` other
 *     than none, `will-change` of one of them, or `contain: layout` or
 *     `paint`. A query container does not.
 * 11. Do not write `class="overlay"`, `data-gap`, `data-fixed`, `data-over`,
 *     `data-fill`, or `data-ngx-yeti-item-overlay` statically; the directives
 *     bind them. A value newer than the pin goes through
 *     `[gap]="$any('new')"`.
 * 12. Bind `gap`, `fixed`, `over`, and `fill` from values that are the same
 *     on the server and the client, never from a browser-only read.
 * 13. Import every directive class the template writes. A forgotten import of
 *     `YetiOverlayChild` with a static `over` renders the held child in the
 *     flow, with no error; only a bound input (`[over]`, `[gap]`) or a
 *     template reference makes the compiler report it.
 *
 * For an overlay first rendered on the client, add `overlay` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: '[yetiOverlay]',
  providers: [{ provide: yetiOverlayToken, useExisting: YetiOverlay }],
  host: {
    class: 'overlay',
    'data-ngx-yeti-item-overlay': '',
    '[attr.data-gap]': 'gap() ?? null',
    '[attr.data-fixed]': "fixed() ? '' : null",
  },
  exportAs: 'yetiOverlay',
})
export class YetiOverlay {
  /**
   * The least space kept between the held child and the box's edges. A pair
   * such as `sm-lg` grows fluidly from the first stop to the second. Unset,
   * Yeti's `md` applies.
   */
  readonly gap = input<YetiGap>();
  /**
   * Centres the held child on the viewport instead of the box, and keeps it
   * there while the page scrolls.
   */
  readonly fixed = input(false, { transform: booleanAttribute });

  constructor() {
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('overlay');
  }
}
