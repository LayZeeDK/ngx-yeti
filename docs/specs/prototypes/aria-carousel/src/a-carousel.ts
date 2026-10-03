// PROTOTYPE (ticket 29, variant A): ticket 25 row 29 sketched. The dots stay
// fragment links; the package adds the history-free scroll, the slide output,
// the slide roles, a current-dot marker, and previous and next buttons.
import {
  afterNextRender,
  Directive,
  DestroyRef,
  ElementRef,
  inject,
  input,
  InjectionToken,
  output,
  signal,
} from '@angular/core';

export const yetiCarouselToken = new InjectionToken<YetiCarousel>('yetiCarouselToken');

@Directive({
  selector: 'section[yetiCarousel]',
  exportAs: 'yetiCarousel',
  providers: [{ provide: yetiCarouselToken, useExisting: YetiCarousel }],
})
export class YetiCarousel {
  readonly #host: HTMLElement = inject(ElementRef).nativeElement;
  /** Yeti's `yeti:slide`, fired on the choice, not the arrival (carousel.js:38-41). */
  readonly slide = output<{ index: number; slide: HTMLElement }>();
  /** The slide in view, from an IntersectionObserver over the slides. */
  readonly current = signal(0);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const track = this.#track();
      const slides = this.#slides();

      if (!track) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              this.current.set(slides.indexOf(entry.target as HTMLElement));
            }
          }
        },
        { root: track, threshold: 0.6 },
      );
      slides.forEach((s) => observer.observe(s));
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /** carousel.js:34-47, like for like. */
  go(index: number): void {
    const track = this.#track();
    const slides = this.#slides();
    const slide = slides[index];

    if (!track || !slide) {
      return;
    }

    const rtl = getComputedStyle(track).direction === 'rtl';
    const own = track.getBoundingClientRect();
    const target = slide.getBoundingClientRect();
    track.scrollTo({ left: track.scrollLeft + (rtl ? target.right - own.right : target.left - own.left) });
    this.slide.emit({ index, slide });
  }

  count(): number {
    return this.#slides().length;
  }

  #track(): HTMLElement | null {
    return this.#host.querySelector(':scope > [data-track]');
  }

  #slides(): HTMLElement[] {
    return [...this.#host.querySelectorAll<HTMLElement>(':scope > [data-track] > [data-slide]')];
  }
}

@Directive({
  selector: '[yetiCarouselSlide]',
  host: { role: 'group', 'aria-roledescription': 'slide' },
})
export class YetiCarouselSlide {}

@Directive({
  selector: 'a[yetiCarouselDot]',
  host: {
    '[attr.aria-current]': 'isCurrent() ? "true" : null',
    '(click)': 'onClick($event)',
  },
})
export class YetiCarouselDot {
  readonly #carousel = inject(yetiCarouselToken);
  /** Zero-based index of the slide this dot links to. */
  readonly yetiCarouselDot = input.required<number>();

  protected isCurrent(): boolean {
    return this.#carousel.current() === this.yetiCarouselDot();
  }

  protected onClick(event: MouseEvent): void {
    // carousel.js:16: modified clicks belong to the browser.
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    this.#carousel.go(this.yetiCarouselDot());
    // State first, preventDefault last (building-blocks 1.11).
    event.preventDefault();
  }
}

@Directive({
  selector: 'button[yetiCarouselPrevious], button[yetiCarouselNext]',
  host: { type: 'button', '(click)': 'onClick()' },
})
export class YetiCarouselStep {
  readonly #carousel = inject(yetiCarouselToken);
  readonly #el: HTMLElement = inject(ElementRef).nativeElement;

  protected onClick(): void {
    const step = this.#el.hasAttribute('yetiCarouselNext') ? 1 : -1;
    const n = this.#carousel.count();
    this.#carousel.go((this.#carousel.current() + step + n) % n);
  }
}

export const YETI_CAROUSEL = [YetiCarousel, YetiCarouselSlide, YetiCarouselDot, YetiCarouselStep] as const;
