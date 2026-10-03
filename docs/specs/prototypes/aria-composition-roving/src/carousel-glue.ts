// PROTOTYPE (ticket 30): ticket 29's b-glue.ts moved onto the package's yetiCarousel,
// which hosts yetiTabs (and so ngTabs). Only the parts the composition does not cover.
import { afterNextRender, afterRenderEffect, contentChild, contentChildren, DestroyRef, Directive, ElementRef, inject, output } from '@angular/core';
import { TabList } from '@angular/aria/tabs';
import { YetiCarouselSlide, YetiTabs } from './roving';

@Directive({
  selector: '[yetiCarousel]',
  hostDirectives: [YetiTabs],
  host: { '(click)': 'onClick($event)' },
})
export class YetiCarousel {
  protected readonly tabList = contentChild.required(TabList);
  // Angular queries, not querySelector (hydration guide, hydration.md:105-107).
  protected readonly slideRefs = contentChildren(YetiCarouselSlide, { descendants: true, read: ElementRef });
  readonly slide = output<{ index: number; slide: HTMLElement }>();
  #fromScroll = false;

  constructor() {
    const destroyRef = inject(DestroyRef);
    let first = true;

    // 1. Selection scrolls the track (carousel.js:26-36) and emits slide (carousel.js:38-47).
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
      const track = slide?.parentElement;

      if (!slide || !track) {
        return;
      }

      const rtl = getComputedStyle(track).direction === 'rtl';
      const own = track.getBoundingClientRect();
      const target = slide.getBoundingClientRect();
      track.scrollTo({ left: track.scrollLeft + (rtl ? target.right - own.right : target.left - own.left) });
      this.slide.emit({ index: slides.indexOf(slide), slide });
    });

    // 2. A swipe moves the selection, so the slide in view is not the inert one.
    afterNextRender(() => {
      const track = this.#slides()[0]?.parentElement;
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

  // 3. No history entry for a dot click (carousel.js:14-25); Aria never prevents it.
  protected onClick(event: MouseEvent): void {
    const dot = (event.target as Element | null)?.closest?.('a[role="tab"]');

    if (!dot || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
  }

  #slides(): HTMLElement[] {
    return this.slideRefs().map((r) => r.nativeElement);
  }
}
