import { DOCUMENT, isPlatformServer } from '@angular/common';
import {
  APP_ID,
  CSP_NONCE,
  DestroyRef,
  EnvironmentProviders,
  Injectable,
  InjectionToken,
  PLATFORM_ID,
  REQUEST,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { YETI_COMMIT, YETI_PARTS, YetiPartName } from './parts';

/** Consumer configuration. `url` is the folder the consumer's build copies `yeti-css/dist/css/` to, relative to `<base href>`. */
export interface YetiStylesConfig {
  readonly url?: string;
  readonly preload?: readonly YetiPartName[];
}

export const yetiStylesConfigToken = new InjectionToken<YetiStylesConfig>('yetiStylesConfigToken');

export function provideYetiStyles(config: YetiStylesConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: yetiStylesConfigToken, useValue: config },
    provideEnvironmentInitializer(() => {
      // Probe only: `?preload=1` on the request turns the preload list on, so one build measures both.
      const req = inject(REQUEST, { optional: true });
      const search = req ? new URL(req.url).search : typeof location !== 'undefined' ? location.search : '';
      if (config.preload?.length && search.includes('preload=1')) {
        inject(YetiStyles).preload(config.preload);
      }
    }),
  ]);
}

interface PartRecord {
  readonly link: HTMLLinkElement;
  live: number;
}

const PART_ATTR = 'data-ngx-yeti-part';
const APP_ATTR = 'data-ngx-yeti-app';
const LINK_ATTR = 'data-ngx-yeti-styles';

/**
 * Owns one reference-counted `<link rel="stylesheet">` per Yeti part file, pointing at the
 * consumer's own build of Yeti. Inserted in Yeti's `yeti.css` order among the part links; written
 * on the server too; adopted at client bootstrap by attribute; removed in the frame after the last
 * live instance has released it AND no element carrying `data-ngx-yeti-part="<name>"` is connected
 * (a dehydrated host, a host still leaving under `animate.leave`). Angular's renderer never owns
 * these links, so angular/angular#66244's leave guard and the dehydrated-count gap do not apply.
 */
@Injectable({ providedIn: 'root' })
export class YetiStyles {
  readonly #doc = inject(DOCUMENT);
  readonly #appId = inject(APP_ID);
  readonly #nonce = inject(CSP_NONCE, { optional: true });
  readonly #server = isPlatformServer(inject(PLATFORM_ID));
  readonly #base = inject(yetiStylesConfigToken, { optional: true })?.url ?? 'yeti-css/';
  readonly #records = new Map<YetiPartName, PartRecord>();
  #sweepScheduled = false;

  constructor() {
    for (const link of Array.from(
      this.#doc.head.querySelectorAll<HTMLLinkElement>(`link[${LINK_ATTR}][${APP_ATTR}="${this.#appId}"]`),
    )) {
      this.#records.set(link.getAttribute(LINK_ATTR) as YetiPartName, { link, live: 0 });
    }

    if (!this.#server) {
      // Removals only reach us through the DOM: Angular detaches a leaving host after its
      // animation, and a dehydrated block's host when its `@if` turns off.
      const observer = new MutationObserver(() => this.#scheduleSweep());
      observer.observe(this.#doc.documentElement, { childList: true, subtree: true });
      inject(DestroyRef).onDestroy(() => observer.disconnect());
    }
  }

  url(part: YetiPartName): string {
    return `${this.#base}${YETI_PARTS[part].path}?v=${YETI_COMMIT}`;
  }

  acquire(part: YetiPartName): void {
    let record = this.#records.get(part);

    if (!record) {
      record = { link: this.#insert(part), live: 0 };
      this.#records.set(part, record);
    }

    record.live++;
  }

  release(part: YetiPartName): void {
    const record = this.#records.get(part);

    if (record) {
      record.live--;
      this.#scheduleSweep();
    }
  }

  preload(parts: readonly YetiPartName[]): void {
    for (const part of parts) {
      const href = this.url(part);

      if (this.#doc.head.querySelector(`link[rel="preload"][href="${href}"]`)) {
        continue;
      }

      const link = this.#doc.createElement('link');
      link.setAttribute('rel', 'preload');
      link.setAttribute('as', 'style');
      link.setAttribute('href', href);
      this.#doc.head.appendChild(link);
    }
  }

  #insert(part: YetiPartName): HTMLLinkElement {
    const link = this.#doc.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', this.url(part));
    link.setAttribute(LINK_ATTR, part);
    link.setAttribute('data-beasties-skip', '');
    link.setAttribute(APP_ATTR, this.#appId);

    if (this.#nonce) {
      link.setAttribute('nonce', this.#nonce);
    }

    // Yeti's order: before the first part link that comes later in yeti.css (ticket 23, P2).
    const rank = YETI_PARTS[part].rank;
    let before: HTMLLinkElement | null = null;

    for (const [name, record] of this.#records) {
      if (YETI_PARTS[name].rank > rank && (!before || YETI_PARTS[before.getAttribute(LINK_ATTR) as YetiPartName].rank > YETI_PARTS[name].rank)) {
        before = record.link;
      }
    }

    this.#doc.head.insertBefore(link, before);

    return link;
  }

  #scheduleSweep(): void {
    if (this.#server || this.#sweepScheduled) {
      return;
    }

    this.#sweepScheduled = true;
    requestAnimationFrame(() => {
      this.#sweepScheduled = false;
      this.#sweep();
    });
  }

  #sweep(): void {
    for (const [part, record] of this.#records) {
      if (record.live <= 0 && !this.#doc.querySelector(`[${PART_ATTR}="${part}"]`)) {
        record.link.remove();
        this.#records.delete(part);
      }
    }
  }
}
