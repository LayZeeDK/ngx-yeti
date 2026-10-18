import { Directive, inject, input } from '@angular/core';
import type { YetiAlign, YetiSelf } from 'ngx-yeti';
import { yetiLayerToken } from './layer-tokens';

/**
 * Yeti's `data-align-self` and `data-justify-self` markers on one child of a
 * layer (layer spec, sections 2 to 4). It sets no presence attribute and
 * loads no item file: the layer's own file holds the rules.
 *
 * Usage rules (numbered as on `YetiLayer`):
 *
 * 2. Put `yetiLayerChild` on direct children of the layer element; markers on
 *    a grandchild do nothing. A component's host element is the child: write
 *    `<app-badge yetiLayerChild alignSelf="start">`.
 * 3. Text laid over a picture needs a contrast treatment, a scrim or a solid
 *    panel, and the author owns it; only a `figure`'s `figcaption` gets
 *    Yeti's scrim.
 * 4. Do not put a focusable control in a child that a later, opaque child
 *    covers.
 * 5. Do not write `data-align-self` or `data-justify-self` by hand; the
 *    directive binds them.
 * 6. Bind `alignSelf` and `justifySelf` from values that are the same on the
 *    server and the client.
 * 7. Import `YetiLayerChild` in every component whose template writes it: a
 *    forgotten import with static `alignSelf` and `justifySelf` renders a
 *    child that stretches, with no error.
 *
 * Outside a layer it still renders its markers, which then match no rule.
 */
@Directive({
  selector: '[yetiLayerChild]',
  host: {
    '[attr.data-align-self]': 'alignSelf() ?? null',
    '[attr.data-justify-self]': 'justifySelf() ?? null',
  },
  exportAs: 'yetiLayerChild',
})
export class YetiLayerChild {
  /** Where this child sits vertically. Unset, the layer's `align` applies. */
  readonly alignSelf = input<YetiAlign>();
  /** Where this child sits horizontally. Unset, it follows the layer. */
  readonly justifySelf = input<YetiSelf>();

  constructor() {
    // The parent for the later in-item check; nothing reads it yet (layer
    // spec, section 3). `skipSelf`: an element that is also a layer finds its
    // parent layer, not itself.
    inject(yetiLayerToken, { optional: true, skipSelf: true });
  }
}
