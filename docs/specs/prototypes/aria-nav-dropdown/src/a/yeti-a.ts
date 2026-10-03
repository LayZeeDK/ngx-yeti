// PROTOTYPE (ticket 29), variant A: ticket 25 rows 32 and 34 sketched.
// The platform owns open state, Escape, light dismiss and the expanded state
// (popover + popovertarget). The package adds three things: focus-out closing
// (ADR 0043), hover intent for data-trigger="hover" (row 32, replacing hover.js),
// and closing on navigation (ADR 0041).
import { DestroyRef, Directive, ElementRef, contentChild, inject, input } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';

// ADR 0041, sketched. ponytail: subscribes for the panel's life rather than only
// while open; the ADR's open-only subscription is the upgrade.
function injectCloseOnNavigation(isOpen: () => boolean, close: () => void): void {
  const router = inject(Router, { optional: true });

  if (!router) {
    return;
  }

  const sub = router.events.subscribe((e) => {
    if (e instanceof NavigationStart && isOpen()) {
      close();
    }
  });
  inject(DestroyRef).onDestroy(() => sub.unsubscribe());
}

const isOpen = (el: HTMLElement) => el.matches(':popover-open');
const hide = (el: HTMLElement) => {
  if (isOpen(el)) {
    el.hidePopover();
  }
};

// Parses a CSS time token with its unit (Y1: hover.js's parseFloat reads 0.1s as 0.1 ms).
function cssTime(el: Element, name: string): number {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const n = parseFloat(raw);

  if (Number.isNaN(n)) {
    return 0;
  }

  return raw.endsWith('ms') ? n : raw.endsWith('s') ? n * 1000 : n;
}

@Directive({
  selector: '[yetiDropdownPanel]',
  host: { '(toggle)': 'onToggle($event)' },
})
export class YetiDropdownPanel {
  readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  // Only a panel hover opened is a panel hover may close (hover.js:16-19).
  openedByHover = false;

  onToggle(e: Event): void {
    if ((e as ToggleEvent).newState === 'closed') {
      this.openedByHover = false;
    }
  }
}

@Directive({
  selector: '[yetiDropdown]',
  host: {
    '(focusout)': 'onFocusOut($event)',
    '(pointerdown)': 'onPointerDown()',
    '(pointerenter)': 'onPointerEnter()',
    '(pointerleave)': 'onPointerLeave()',
  },
})
export class YetiDropdown {
  readonly trigger = input<'click' | 'hover'>('click');
  readonly #root = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly panel = contentChild.required(YetiDropdownPanel);
  #pressedInside = false;
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    injectCloseOnNavigation(
      () => isOpen(this.panel().el),
      () => hide(this.panel().el),
    );
  }

  onPointerDown(): void {
    clearTimeout(this.#timer);
    this.#pressedInside = true;
    setTimeout(() => (this.#pressedInside = false));
  }

  onFocusOut(e: FocusEvent): void {
    const to = e.relatedTarget as Node | null;

    if (to === null && this.#pressedInside) {
      return;
    }

    if (!this.#root.contains(to)) {
      hide(this.panel().el);
    }
  }

  #hoverable(): boolean {
    return this.trigger() === 'hover' && matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  onPointerEnter(): void {
    if (!this.#hoverable()) {
      return;
    }

    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      const panel = this.panel().el;

      if (!isOpen(panel)) {
        panel.showPopover();
        this.panel().openedByHover = true;
      }
    }, cssTime(this.#root, '--yeti-dropdown-open-delay'));
  }

  onPointerLeave(): void {
    if (!this.#hoverable()) {
      return;
    }

    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      if (this.panel().openedByHover) {
        hide(this.panel().el);
      }
    }, cssTime(this.#root, '--yeti-dropdown-close-delay'));
  }
}

@Directive({ selector: 'ul[yetiNavList]' })
export class YetiNavList {
  readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
}

@Directive({
  selector: 'nav[yetiNav]',
  host: { '(focusout)': 'onFocusOut($event)', '(pointerdown)': 'onPointerDown()' },
})
export class YetiNav {
  readonly #root = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly list = contentChild.required(YetiNavList);
  #pressedInside = false;

  constructor() {
    injectCloseOnNavigation(
      () => isOpen(this.list().el),
      () => hide(this.list().el),
    );
  }

  onPointerDown(): void {
    this.#pressedInside = true;
    setTimeout(() => (this.#pressedInside = false));
  }

  onFocusOut(e: FocusEvent): void {
    const to = e.relatedTarget as Node | null;
    const list = this.list().el;

    // Only while the list is a panel (row 34); in the bar it is not a popover-open.
    if (!isOpen(list) || (to === null && this.#pressedInside)) {
      return;
    }

    // Focus moving into a nested dropdown panel stays inside the nav subtree.
    if (!this.#root.contains(to)) {
      list.hidePopover();
    }
  }
}
