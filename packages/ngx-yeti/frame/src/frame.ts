import { Directive, input } from '@angular/core';
import type { YetiRatio } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';

/**
 * Yeti's `frame` on the consumer's element: the `frame` class, the typed
 * `data-ratio`, and the `frame` item file (frame spec, sections 2 to 4). The
 * frame holds one child in a fixed ratio, cropping media to fill it and
 * centring anything else. It adds no role, no tab stop, and no listener.
 *
 * Usage rules:
 *
 * 1. Write `yetiFrame` where Yeti's docs write `class="frame"`, and bind
 *    `ratio` where they write `data-ratio`. Do not write `class="frame"`, a
 *    static `data-ratio`, or `data-ngx-yeti-item-frame` on a host: the
 *    directive binds them, and hydration writes a static attribute again
 *    before the binding wins. A value newer than the pin is bound as
 *    `[ratio]="$any('2/1')"`.
 * 2. Give a frame exactly one child. A second child is laid out by the
 *    frame's flex row and clipped.
 * 3. An image's `alt` describes what is visible after the crop, or `ratio`
 *    matches the image so nothing is cropped (WCAG 1.1.1). A decorative
 *    image takes `alt=""`.
 * 4. Every `iframe` carries a `title` saying what is in it (WCAG 4.1.2). An
 *    `object` carries a text alternative, and an `embed` sits in a frame only
 *    where the embedded content is accessible on its own (WCAG 1.1.1).
 * 5. A frame's non-media child is a placeholder or an icon. Text the reader
 *    needs does not go inside a frame: the frame keeps its ratio and clips,
 *    so enlarged text or overridden spacing is cut off rather than growing
 *    the box (WCAG 1.4.4, 1.4.12). A caption goes beside the frame, for
 *    example a `figcaption` in a `figure` that holds the frame.
 * 6. `NgOptimizedImage` in a frame: use `fill` and give the frame
 *    `position: relative` in your own stylesheet or inline style. In `fill`
 *    mode Angular positions the image absolutely, and Yeti's frame sets no
 *    `position`, so without it the image is placed against the nearest
 *    positioned ancestor instead of the frame. The `width` and `height` form
 *    also renders, because Yeti's CSS stretches and crops the image, but in
 *    development mode Angular's distortion check warns whenever the frame's
 *    ratio differs from the image's. The package adds no CSS for it.
 * 7. Embedded media under hydration: hydration writes every static template
 *    attribute again, and the browser reloads an `iframe` whose `src` or
 *    `srcdoc` is set, even to the same value, so a server-rendered `iframe`
 *    loads twice and loses any state a reader gave it before hydration. Give
 *    a `video` its sources as `<source>` children rather than a `src`
 *    attribute. Security-sensitive `iframe` attributes (`sandbox`, `allow`,
 *    `allowFullscreen`, `referrerPolicy`, `csp`, `fetchPriority`,
 *    `credentialless`) must be static, because Angular refuses to bind them.
 * 8. Import `YetiFrame` in every component whose template writes
 *    `yetiFrame`. A forgotten import with no bound input renders the bare
 *    element with no error and no shape; a bound `[ratio]` makes the
 *    compiler report it.
 *
 * For a frame first rendered on the client, add `frame` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`.
 */
@Directive({
  selector: '[yetiFrame]',
  host: {
    class: 'frame',
    'data-ngx-yeti-item-frame': '',
    '[attr.data-ratio]': 'ratio() ?? null',
  },
  exportAs: 'yetiFrame',
})
export class YetiFrame {
  /** Width to height. Unset, Yeti's default ratio applies. */
  readonly ratio = input<YetiRatio>();

  constructor() {
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('frame');
  }
}
