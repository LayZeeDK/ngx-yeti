// PROTOTYPE (ticket 20) candidate: a directive owns the behaviour in place of the module.
// Ports of tabs.js (load pass, click, arrows), toc.js, and enter.js, scoped to the host
// element and torn down with it. ponytail: no hash reveal, no nested tabs; enough to measure.
import { afterNextRender, DestroyRef, Directive, ElementRef, inject, signal } from '@angular/core';

@Directive({
  selector: '[nfsOwnTabs]',
  host: { '(click)': 'onClick($event)', '(keydown)': 'onKey($event)', '[attr.data-own-selected]': 'selected()' },
})
export class OwnTabs {
  readonly #el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  readonly selected = signal<string | null>(null);

  constructor() {
    afterNextRender(() => {
      const tabs = this.#tabs();
      this.#select(tabs.find((t) => t.getAttribute('aria-selected') === 'true') ?? tabs[0]);
    });
  }

  #tabs(): HTMLElement[] {
    return [...this.#el.querySelectorAll<HTMLElement>(':scope > [role="tablist"] [role="tab"]')];
  }

  #select(tab: HTMLElement): void {
    for (const other of this.#tabs()) {
      const on = other === tab;
      other.setAttribute('aria-selected', String(on));
      other.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(other.getAttribute('aria-controls') ?? '');

      if (panel) {
        panel.hidden = !on;
        panel.tabIndex = panel.querySelector('a, button, input, select, textarea, [tabindex]') ? -1 : 0;
      }
    }

    this.selected.set(tab.id);
  }

  onClick(event: MouseEvent): void {
    const tab = (event.target as Element).closest<HTMLElement>('[role="tab"]');

    if (!tab || !this.#tabs().includes(tab)) {
      return;
    }

    // Stops tabs.js's delegated document listener, which skips defaultPrevented clicks.
    event.preventDefault();
    this.#select(tab);
    tab.focus();
  }

  onKey(event: KeyboardEvent): void {
    const tabs = this.#tabs();
    const tab = (event.target as Element).closest<HTMLElement>('[role="tab"]');

    if (!tab || !tabs.includes(tab)) {
      return;
    }

    const step = ({ ArrowRight: 1, ArrowLeft: -1 } as Record<string, number>)[event.key];
    const target = step
      ? tabs[(tabs.indexOf(tab) + step + tabs.length) % tabs.length]
      : event.key === 'Home'
        ? tabs[0]
        : event.key === 'End'
          ? tabs[tabs.length - 1]
          : undefined;

    if (!target) {
      return;
    }

    event.preventDefault();
    this.#select(target);
    target.focus();
  }
}

@Directive({ selector: '[nfsOwnToc]' })
export class OwnToc {
  constructor() {
    const toc = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    let observer: IntersectionObserver | undefined;
    inject(DestroyRef).onDestroy(() => observer?.disconnect());
    afterNextRender(() => {
      const links = [...toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
      const byHeading = new Map<Element, HTMLAnchorElement>();

      for (const link of links) {
        const heading = document.getElementById(decodeURIComponent(link.getAttribute('href')!.slice(1)));

        if (heading) {
          byHeading.set(heading, link);
        }
      }

      const headings = [...byHeading.keys()];
      const visible = new Set<Element>();
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target);
          } else {
            visible.delete(entry.target);
          }
        }

        const heading = headings.find((h) => visible.has(h));

        if (!heading) {
          return;
        }

        const link = byHeading.get(heading)!;
        for (const other of links) {
          other.removeAttribute('aria-current');
        }

        link.setAttribute('aria-current', 'true');
        toc.dispatchEvent(new CustomEvent('yeti:current', { bubbles: true, composed: true, detail: { link, heading } }));
      });
      for (const heading of headings) {
        observer.observe(heading);
      }
    });
  }
}

@Directive({ selector: '[nfsOwnEnter]' })
export class OwnEnter {
  constructor() {
    const el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    let observer: IntersectionObserver | undefined;
    inject(DestroyRef).onDestroy(() => observer?.disconnect());
    afterNextRender(() => {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            el.removeAttribute('data-once');
            observer?.disconnect();
          }
        },
        { rootMargin: '0px 0px 10% 0px' },
      );
      observer.observe(el);
    });
  }
}
