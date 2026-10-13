import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import type { YetiEnter, YetiSide } from 'ngx-yeti';
import { injectYetiItemStyles } from 'ngx-yeti/styles';

/**
 * Yeti's `enter` on the consumer's element: the `enter` class, the typed
 * `data-*` attributes, and the `enter` item file (enter spec, sections 2 to
 * 4). It replaces Yeti's `enter.js`: with `once`, the element keeps
 * `data-once`, and so stays still and visible, until it first nears the
 * viewport. The arrival itself is Yeti's CSS. The directive adds no role, no
 * tab stop, no listener, and no `animate.enter`.
 *
 * Usage rules:
 *
 * 1. Write `once` for content that starts below the fold. A `once` element
 *    already in view when the application hydrates arrives only after
 *    hydration.
 * 2. Put `stagger` on the layout that holds the row (`yetiGrid`,
 *    `yetiCluster`), not on the items.
 * 3. Use one arrival per page section.
 * 4. Do not write `class="enter"`, any of the `data-*` attributes the
 *    directive binds, or `data-ngx-yeti-item-enter` by hand.
 * 5. Do not write `animate.enter="enter"` beside `yetiEnter` on one element.
 *    An element Angular inserts already plays its arrival from Yeti's CSS.
 * 6. Load no `enter.js` beside the package; it would race hydration for
 *    `data-once`.
 *
 * For an `enter` first rendered on the client, add `enter` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`, so the arrival
 * does not start late.
 */
@Directive({
  selector: '[yetiEnter]',
  host: {
    // Bound, not static, so `enter` and `data-once` reach the element in
    // one update: a static class is written at creation, and a style
    // resolved before the first update would start the withheld arrival.
    '[class.enter]': 'true',
    'data-ngx-yeti-item-enter': '',
    '[attr.data-enter]': 'yetiEnter() || null',
    '[attr.data-side]': 'side() ?? null',
    '[attr.data-stagger]': "stagger() ? '' : null",
    '[attr.data-view]': "view() ? '' : null",
    '[attr.data-once]': "withheld() ? '' : null",
  },
  exportAs: 'yetiEnter',
})
export class NgxYetiEnter {
  /**
   * The arrival. `''` (the bare attribute) renders no `data-enter`, so Yeti's
   * fade applies.
   */
  readonly yetiEnter = input<YetiEnter | ''>('');
  /**
   * The edge a slide comes from; logical, so `start` is the right edge in a
   * right-to-left page. Unset, Yeti's `start` applies.
   */
  readonly side = input<YetiSide>();
  /** Plays the arrival on each child in turn instead of on the element. */
  readonly stagger = input(false, { transform: booleanAttribute });
  /**
   * Paces the arrival by the element's scroll into view, where the browser
   * supports scroll-driven animations; elsewhere it plays on load.
   */
  readonly view = input(false, { transform: booleanAttribute });
  /**
   * Withholds the arrival until the element first nears the viewport, then
   * plays it once. The arrival is one-way: once it has played, or when `once`
   * is false at the first render in the browser, a later `true` renders
   * nothing. Before the arrival, `once` set to `false` and then `true` again
   * renders `data-once` again, and the arrival still plays when the element
   * nears the viewport.
   * A named arrival is withheld through the package's global stylesheet
   * ("ngx-yeti/ngx-yeti-globals.css", ledger row A11Y-33).
   */
  readonly once = input(false, { transform: booleanAttribute });

  readonly #arrived = signal(false);

  protected readonly withheld = computed(() => this.once() && !this.#arrived());

  constructor() {
    const host = inject<ElementRef<Element>>(ElementRef).nativeElement;
    let observer: IntersectionObserver | undefined;

    inject(DestroyRef).onDestroy(() => {
      observer?.disconnect();
    });
    afterNextRender(() => {
      if (!this.once()) {
        this.#arrived.set(true);

        return;
      }

      // Yeti's enter.js margin: arrive a little before the element is in view.
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.#arrived.set(true);
            observer?.disconnect();
          }
        },
        { rootMargin: '0px 0px 10% 0px' },
      );
      observer.observe(host);
    });
    // Last, after anything that can throw (setup spec, section 3).
    injectYetiItemStyles('enter');
  }
}
