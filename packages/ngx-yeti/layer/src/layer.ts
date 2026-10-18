import { Directive, input } from '@angular/core';
import type { YetiAlign } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';
import { yetiLayerToken } from './layer-tokens';

/**
 * Yeti's `layer` on the consumer's element: the `layer` class, the typed
 * `data-align`, and the `layer` item file (layer spec, sections 2 to 4).
 * Every child sits in one box, later ones on top, and the box is as tall as
 * the tallest child. The layer adds no role, no tab stop, and no listener.
 *
 * Usage rules:
 *
 * 1. Put `yetiLayer` on the element that holds the stacked content, with at
 *    least two direct children, bottom first. A `figure` with a picture and a
 *    `figcaption` is Yeti's example; a `div` with a thumbnail and a badge is
 *    its docs' second.
 * 2. Put `yetiLayerChild` on direct children of the layer element; markers on
 *    a grandchild do nothing. A component's host element is the child: write
 *    `<app-badge yetiLayerChild alignSelf="start">`, not the directive inside
 *    the component's template. `@if`, `@for`, `@defer`, and `ng-container`
 *    add no element, so the top-level elements they render are the children.
 * 3. Text laid over a picture needs a contrast treatment, a scrim or a solid
 *    panel, and the author owns it. Yeti gives one only to a `figcaption`
 *    that is a direct child of a `figure` layer. Any other text over a
 *    picture gets your own treatment, for example `yetiPaint` on the child,
 *    and you check its contrast. If you change `--yeti-color-scrim`, check
 *    the caption's contrast again.
 * 4. Do not put a focusable control in a child that a later, opaque child
 *    covers: it can take focus while it cannot be seen or pressed. Put
 *    controls in the top child, or give the covering child a size that leaves
 *    them visible.
 * 5. Do not write `class="layer"`, `data-align`, `data-align-self`,
 *    `data-justify-self`, or `data-ngx-yeti-item-layer` statically; the
 *    directives bind them. A value newer than the pin goes through
 *    `[justifySelf]="$any('new')"`. `align` may be written in its static
 *    form (`align="end"`); the directive removes the HTML attribute it would
 *    otherwise leave.
 * 6. Bind `align`, `alignSelf`, and `justifySelf` from values that are the
 *    same on the server and the client, never from a browser-only read such
 *    as the window's width.
 * 7. Import every directive class the template writes. A forgotten import of
 *    `YetiLayerChild` with static `alignSelf` and `justifySelf` renders a
 *    child that stretches, with no error; only a bound input (`[alignSelf]`)
 *    makes the compiler report it.
 *
 * For a layer first rendered on the client, add `layer` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: '[yetiLayer]',
  providers: [{ provide: yetiLayerToken, useExisting: YetiLayer }],
  host: {
    class: 'layer',
    'data-ngx-yeti-item-layer': '',
    '[attr.data-align]': 'align() ?? null',
    // HTML's `align` is a text-alignment hint that Chromium and WebKit honour
    // on several of the layer's hosts, so a static `align="end"` would also
    // move the layer's text.
    '[attr.align]': 'null',
  },
  exportAs: 'yetiLayer',
})
export class YetiLayer {
  /**
   * Where every child sits vertically when it is shorter than the box.
   * `baseline` behaves as `start`. Unset, Yeti's `stretch` applies. The
   * static form (`align="end"`) never aligns the layer's text.
   */
  readonly align = input<YetiAlign>();

  constructor() {
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('layer');
  }
}
