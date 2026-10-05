import {
  APP_ID,
  CSP_NONCE,
  DOCUMENT,
  DestroyRef,
  InjectionToken,
  PLATFORM_ID,
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
   * relative to `<base href>`, with a trailing slash, or `''` for
   * `<base href>` itself. Default `'yeti-css/'`. It is the path of the folder
   * the `assets` entry's `output` names (setup usage rule 5). The type
   * rejects a URL without the slash, which would make every item file a 404.
   *
   * Item files follow `<base href>`, never `APP_BASE_HREF`, which sets where
   * routes live. For files under a prefix that `<base href>` does not name,
   * give the prefixed path relative to `<base href>`, such as
   * `'basehref/yeti-css/'`. An absolute or root-relative URL and `deployUrl`
   * are not supported (usage rule 6).
   */
  readonly url?: '' | `${string}/`;
  /**
   * Items whose files are fetched ahead at application start: every item that
   * first renders on the client, when a flash-free first frame matters (setup
   * usage rule 8). The server writes `<link rel="prefetch">` and the client
   * `<link rel="preload" as="style">`, because a server style preload holds
   * WebKit's first paint on a sparse page (upstream bug O4). WebKit ignores
   * the prefetch, so Safari's fetch starts at bootstrap, from the client's
   * preload, without the head start the prefetch gives Chromium and Firefox.
   */
  readonly preload?: readonly YetiComponentName[];
}

export const yetiStylesConfigToken = new InjectionToken<YetiStylesConfig>(
  'yetiStylesConfigToken',
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
 *
 * It reads its configuration from the root injector, so a
 * `provideYetiStyles()` call in a route's providers has no effect.
 */
@Service()
export class YetiStyles {
  readonly #document = inject(DOCUMENT);
  readonly #appId = inject(APP_ID);
  readonly #nonce = inject(CSP_NONCE, { optional: true });
  readonly #config = inject(yetiStylesConfigToken, { optional: true });
  readonly #url = this.#config?.url ?? 'yeti-css/';
  readonly #links = new Map<YetiComponentName, ItemLink>();
  /** Created by the first render callback, which runs on the client only. */
  #observer: MutationObserver | undefined;
  #checkScheduled = false;
  #destroyed = false;

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

    // Rule 4: one hint per item, never beside one already in `<head>`. The
    // server writes a prefetch and the client a style preload (the user's
    // ruling of 2026-10-05): a server style preload holds WebKit's first paint
    // on a sparse page (upstream bug O4), and WebKit ignores a prefetch. The
    // client keeps the server's prefetch, the measured shape. `PLATFORM_ID` is
    // compared as `isPlatformServer` does, since the package's only peer is
    // `@angular/core`. The `href` is compared as a string, never put into a
    // selector.
    const onServer = inject(PLATFORM_ID) === 'server';
    const rel = onServer ? 'prefetch' : 'preload';
    const hinted = new Set(
      [...this.#document.head.querySelectorAll(`link[rel="${rel}"]`)].map(
        (link) => link.getAttribute('href'),
      ),
    );

    for (const item of this.#config?.preload ?? []) {
      const href = this.#href(item);

      if (!hinted.has(href)) {
        hinted.add(href);
        this.#document.head.appendChild(
          this.#createLink(
            onServer ? { rel, href } : { rel, as: 'style', href },
          ),
        );
      }
    }

    // Render callbacks split the rest of the platform work (building-blocks
    // 1.11): the observer, and with it every removal, exists on the client
    // only.
    afterNextRender(() => {
      this.#observer = new MutationObserver(() => {
        this.#scheduleCheck();
      });
      this.#observer.observe(this.#document, {
        childList: true,
        subtree: true,
      });
      this.#scheduleCheck();
    });
    // A destroyed loader removes its unused links at once, then acts no more:
    // a check it scheduled before, or a release after, never reaches a link
    // that a later loader of the same `APP_ID` adopted.
    inject(DestroyRef).onDestroy(() => {
      if (this.#observer !== undefined) {
        this.#observer.disconnect();
        this.#check(true);
      }

      this.#destroyed = true;
    });
  }

  /**
   * Rule 1: counts the item and inserts its link on the first acquisition,
   * or again when something else took the tracked link out of `<head>`.
   */
  acquire(item: YetiComponentName): void {
    const entry = this.#links.get(item);

    if (entry?.link.isConnected) {
      entry.count++;

      return;
    }

    this.#links.set(item, {
      link: this.#insert(item),
      count: (entry?.count ?? 0) + 1,
    });
  }

  /** Rule 2: lowers the count and checks for removal in the next frame. */
  release(item: YetiComponentName): void {
    const entry = this.#links.get(item);

    if (entry && entry.count > 0) {
      entry.count--;
    }

    this.#scheduleCheck();
  }

  #href(item: YetiComponentName): string {
    return `${this.#url}${yetiRank[item].path}?v=${yetiPin}`;
  }

  #createLink(attributes: Readonly<Record<string, string>>): HTMLLinkElement {
    const link = this.#document.createElement('link');

    for (const [name, value] of Object.entries(attributes)) {
      link.setAttribute(name, value);
    }

    if (this.#nonce) {
      link.setAttribute('nonce', this.#nonce);
    }

    return link;
  }

  /** Inserts before the first item link of a later rank: `yeti.css`'s order. */
  #insert(item: YetiComponentName): HTMLLinkElement {
    const link = this.#createLink({
      rel: 'stylesheet',
      href: this.#href(item),
      [itemAttribute]: item,
      [appAttribute]: this.#appId,
      // Keeps Angular's critical-CSS inlining away from the link (ticket 13 Q4).
      'data-beasties-skip': '',
    });

    const rank = yetiRank[item].rank;
    let next: HTMLLinkElement | null = null;
    let nextRank = Infinity;

    for (const [other, { link: otherLink }] of this.#links) {
      const otherRank = yetiRank[other].rank;

      if (otherRank > rank && otherRank < nextRank) {
        next = otherLink;
        nextRank = otherRank;
      }
    }

    // A tracked link that something else took out of `<head>` cannot be the
    // reference node; the new link then goes last.
    this.#document.head.insertBefore(
      link,
      next?.parentNode === this.#document.head ? next : null,
    );

    return link;
  }

  #scheduleCheck(): void {
    // The server never removes a link; render callbacks never run there.
    if (this.#observer === undefined || this.#checkScheduled) {
      return;
    }

    this.#checkScheduled = true;
    requestAnimationFrame(() => {
      this.#checkScheduled = false;
      this.#check();
    });
  }

  /**
   * Removes a link only with no connected host (ADR 0045) and at count zero,
   * or at any count while the loader is destroyed: every acquisition it
   * counted ends with its application, and the releases may still follow.
   */
  #check(destroying = false): void {
    if (this.#destroyed) {
      return;
    }

    for (const [item, { link, count }] of this.#links) {
      if (
        (count === 0 || destroying) &&
        !this.#document.querySelector(`[data-ngx-yeti-item-${item}]`)
      ) {
        link.remove();
        this.#links.delete(item);
      }
    }
  }
}
