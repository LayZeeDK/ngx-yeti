import {
  APP_ID,
  CSP_NONCE,
  DOCUMENT,
  DestroyRef,
  InjectionToken,
  Service,
  afterNextRender,
  inject,
} from '@angular/core';
import type { YetiComponentName } from 'ngx-yeti';
import { yetiPin, yetiRank } from './yeti-rank';

/**
 * The configuration of `provideYetiStyles()` (setup spec, section 4).
 */
export interface YetiStylesConfig {
  /**
   * The folder the application's `assets` entry copies Yeti's `dist/css/` to,
   * relative to `<base href>`, with a trailing slash. Default `'yeti-css/'`.
   * Keep it in agreement with the `assets` entry's `output` (setup usage rule 5).
   */
  readonly url?: string;
  /**
   * Items whose files are preloaded on the server and the client at
   * application start: every item that first renders on the client, when a
   * flash-free first frame matters (setup usage rule 8).
   */
  readonly preload?: readonly YetiComponentName[];
}

export const yetiStylesConfig = new InjectionToken<YetiStylesConfig>(
  'yetiStylesConfig',
);

const itemAttribute = 'data-ngx-yeti-styles';
const appAttribute = 'data-ngx-yeti-app';

interface ItemLink {
  readonly link: HTMLLinkElement;
  count: number;
}

function isItem(name: string | null): name is YetiComponentName {
  return name !== null && Object.hasOwn(yetiRank, name);
}

/**
 * Keeps one counted `<link rel="stylesheet">` per item file of the consumer's
 * Yeti build in `<head>` (ADR 0060 points 2 to 6; setup spec, "The loader's
 * behaviour" rules 1 to 7). Not exported from the package.
 */
@Service()
export class YetiStyles {
  readonly #document = inject(DOCUMENT);
  readonly #appId = inject(APP_ID);
  readonly #nonce = inject(CSP_NONCE, { optional: true });
  readonly #url =
    inject(yetiStylesConfig, { optional: true })?.url ?? 'yeti-css/';
  readonly #links = new Map<YetiComponentName, ItemLink>();
  /** True once a render callback has run, which happens on the client only. */
  #rendered = false;
  #checkScheduled = false;

  constructor() {
    // Rule 3: adopt this application's links from the server's HTML. The
    // server's own document holds none, so this finds nothing there.
    for (const link of this.#document.head.querySelectorAll<HTMLLinkElement>(
      `link[${itemAttribute}][${appAttribute}]`,
    )) {
      const item = link.getAttribute(itemAttribute);

      if (link.getAttribute(appAttribute) === this.#appId && isItem(item)) {
        this.#links.set(item, { link, count: 0 });
      }
    }

    // Render callbacks are the only platform split (building-blocks 1.11):
    // the observer, and with it every removal, exists on the client only.
    let observer: MutationObserver | undefined;

    afterNextRender(() => {
      this.#rendered = true;
      observer = new MutationObserver(() => {
        this.#scheduleCheck();
      });
      observer.observe(this.#document, { childList: true, subtree: true });
      this.#scheduleCheck();
    });
    inject(DestroyRef).onDestroy(() => observer?.disconnect());
  }

  /** Rule 1: counts the item and inserts its link on the first acquisition. */
  acquire(item: YetiComponentName): void {
    const entry = this.#links.get(item);

    if (entry) {
      entry.count++;

      return;
    }

    this.#links.set(item, { link: this.#insert(item), count: 1 });
  }

  /** Rule 2: lowers the count and checks for removal in the next frame. */
  release(item: YetiComponentName): void {
    const entry = this.#links.get(item);

    if (entry && entry.count > 0) {
      entry.count--;
    }

    this.#scheduleCheck();
  }

  /** Rule 4: one preload link per item, never beside one already in `<head>`. */
  preload(items: readonly YetiComponentName[]): void {
    for (const item of items) {
      const href = this.#href(item);

      if (
        this.#document.head.querySelector(`link[rel="preload"][href="${href}"]`)
      ) {
        continue;
      }

      const link = this.#document.createElement('link');
      link.setAttribute('rel', 'preload');
      link.setAttribute('as', 'style');
      link.setAttribute('href', href);
      this.#setNonce(link);
      this.#document.head.appendChild(link);
    }
  }

  #href(item: YetiComponentName): string {
    return `${this.#url}${yetiRank[item].path}?v=${yetiPin}`;
  }

  #setNonce(link: HTMLLinkElement): void {
    if (this.#nonce) {
      link.setAttribute('nonce', this.#nonce);
    }
  }

  /** Inserts before the first item link of a later rank: `yeti.css`'s order. */
  #insert(item: YetiComponentName): HTMLLinkElement {
    const link = this.#document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', this.#href(item));
    link.setAttribute(itemAttribute, item);
    link.setAttribute(appAttribute, this.#appId);
    // Keeps Angular's critical-CSS inlining away from the link (ticket 13 Q4).
    link.setAttribute('data-beasties-skip', '');
    this.#setNonce(link);

    const rank = yetiRank[item].rank;
    let next: { readonly rank: number; readonly link: HTMLLinkElement } | null =
      null;

    for (const [other, { link: otherLink }] of this.#links) {
      const otherRank = yetiRank[other].rank;

      if (otherRank > rank && (next === null || otherRank < next.rank)) {
        next = { rank: otherRank, link: otherLink };
      }
    }

    if (next?.link.parentNode === this.#document.head) {
      this.#document.head.insertBefore(link, next.link);
    } else {
      this.#document.head.appendChild(link);
    }

    return link;
  }

  #scheduleCheck(): void {
    // The server never removes a link; render callbacks never run there.
    if (!this.#rendered || this.#checkScheduled) {
      return;
    }

    this.#checkScheduled = true;
    requestAnimationFrame(() => {
      this.#checkScheduled = false;
      this.#check();
    });
  }

  /** Removes a link only at count zero with no connected host (ADR 0045). */
  #check(): void {
    for (const [item, { link, count }] of this.#links) {
      if (
        count === 0 &&
        !this.#document.querySelector(`[data-ngx-yeti-item-${item}]`)
      ) {
        link.remove();
        this.#links.delete(item);
      }
    }
  }
}
