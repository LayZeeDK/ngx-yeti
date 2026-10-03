// PROTOTYPE (ticket 29, variant B+glue): what Aria Tabs leaves to the package
// when the dots are tabs and the slides are tab panels. Aria owns selection,
// roving tabindex and the arrow keys; everything below is carousel.js's job or
// the APG carousel's, and Aria does none of it.
import {
  afterNextRender,
  afterRenderEffect,
  contentChild,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  output,
} from '@angular/core';
import { TabList } from '@angular/aria/tabs';

@Directive({
  selector: '[ngTabs][bGlue]',
  host: { '(click)': 'onClick($event)' },
})
export class BGlue {
  readonly #host: HTMLElement = inject(ElementRef).nativeElement;
  protected readonly tabList = contentChild.required(TabList);
  readonly slide = output<{ index: number; slide: HTMLElement }>();
  #fromScroll = false;

  constructor() {
    const destroyRef = inject(DestroyRef);

    // 1. Selection scrolls the track (carousel.js:34-36) and emits slide.
    let first = true;
    afterRenderEffect(() => {
      const value = this.tabList().selectedTab();

      if (first) {
        first = false;

        return;
      }

      if (this.#fromScroll) {
        this.#fromScroll = false;

        return;
      }

      const slides = this.#slides();
      const slide = slides.find((s) => s.id === value);
      const track = this.#host.querySelector<HTMLElement>(':scope > [data-track]');

      if (!slide || !track) {
        return;
      }

      const rtl = getComputedStyle(track).direction === 'rtl';
      const own = track.getBoundingClientRect();
      const target = slide.getBoundingClientRect();
      track.scrollTo({ left: track.scrollLeft + (rtl ? target.right - own.right : target.left - own.left) });
      this.slide.emit({ index: slides.indexOf(slide), slide });
    });

    // 2. A swipe or trackpad scroll moves the selection, so the slide in view
    //    is never the inert one.
    afterNextRender(() => {
      const track = this.#host.querySelector<HTMLElement>(':scope > [data-track]');
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && entry.target.id !== this.tabList().selectedTab()) {
              this.#fromScroll = true;
              this.tabList().selectedTab.set(entry.target.id);
            }
          }
        },
        { root: track, threshold: 0.6 },
      );
      this.#slides().forEach((s) => observer.observe(s));
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  // 3. A dot click is a fragment navigation that Aria does not cancel
  //    (ClickEventManager preventDefault: false), so it costs a history entry.
  protected onClick(event: MouseEvent): void {
    const dot = (event.target as Element | null)?.closest?.('a[role="tab"]');

    if (!dot || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
  }

  #slides(): HTMLElement[] {
    return [...this.#host.querySelectorAll<HTMLElement>(':scope > [data-track] > [data-slide]')];
  }
}
