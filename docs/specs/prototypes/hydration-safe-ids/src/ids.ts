// PROTOTYPE (ticket 35): three id sources, picked per route through H35_MODE.
//   cdk     - ADR 0042 as written: CDK's _IdGenerator, counters in module state; Aria keeps its random infix.
//   counter - one counter per prefix in a root service (one per application, so one per SSR request);
//             Aria's directives get the same counter through an element-level _IdGenerator provider.
//   adopt   - counter, plus: an element claimed at hydration keeps the id the server gave it (read once,
//             at creation), and the client's counters start where the server's ended (TransferState).
import { _IdGenerator } from '@angular/cdk/a11y';
import {
  ElementRef,
  HostAttributeToken,
  inject,
  InjectionToken,
  makeStateKey,
  Provider,
  Service,
  TransferState,
} from '@angular/core';

export type H35Mode = 'cdk' | 'counter' | 'adopt' | 'noseed';
export const H35_MODE = new InjectionToken<H35Mode>('H35_MODE');

/** Per-application counters: a root service is created once per application, so once per SSR request. */
@Service()
export class YetiCounter {
  readonly #counts = new Map<string, number>();

  next(prefix: string): string {
    const n = this.#counts.get(prefix) ?? 0;
    this.#counts.set(prefix, n + 1);

    return `${prefix}${n}`;
  }
}

const COUNTS = makeStateKey<Record<string, number>>('ngx-yeti-ids');

/** Per-application counters that adopt a hydrated host's id and continue from the server's counts. */
@Service()
export class YetiIds {
  readonly #state = inject(TransferState);
  // ponytail: on the server the key is absent, so this starts at {}; on the client it holds the server's final counts.
  readonly #counts: Record<string, number> = this.seed(this.#state);

  constructor() {
    // Runs only when the server serializes the state; the client never calls it.
    this.#state.onSerialize(COUNTS, () => this.#counts);
  }

  protected seed(state: TransferState): Record<string, number> {
    return { ...state.get(COUNTS, {}) };
  }

  next(prefix: string, host: Element): string {
    // Read once, at creation: a host claimed at hydration still carries the server's id here, because
    // directives are created after the element is located (element.ts:140-144) and host bindings run later.
    const served = host.getAttribute('id');

    if (served !== null && served.startsWith(prefix) && /^\d+$/.test(served.slice(prefix.length))) {
      return served;
    }

    const n = this.#counts[prefix] ?? 0;
    this.#counts[prefix] = n + 1;

    return `${prefix}${n}`;
  }
}

/** Control for the adopt mode: adopts, but the client counts from 0 (no TransferState seed). */
@Service()
export class YetiIdsNoSeed extends YetiIds {
  protected override seed(): Record<string, number> {
    return {};
  }
}

function ids(mode: H35Mode): YetiIds {
  return mode === 'noseed' ? inject(YetiIdsNoSeed) : inject(YetiIds);
}

function nextId(prefix: string): string {
  const mode = inject(H35_MODE);

  if (mode === 'cdk') {
    return inject(_IdGenerator, { skipSelf: true }).getId(prefix);
  }

  if (mode === 'counter') {
    return inject(YetiCounter).next(prefix);
  }

  return ids(mode).next(prefix, inject(ElementRef).nativeElement);
}

/** The helper ADR 0042 names: the consumer's static id wins, else a generated one. */
export function injectYetiId(item: string): string {
  return inject(new HostAttributeToken('id'), { optional: true }) ?? nextId(`ngx-yeti-${item}-`);
}

/**
 * Given in the providers of each package directive that hosts an Aria directive, so Aria's
 * `inject(_IdGenerator)` on that element gets the package's counter. Aria's prefix is kept and its
 * `randomize` flag is ignored. In cdk mode Aria gets CDK's own service, as today.
 */
export const yetiAriaIds: Provider = {
  provide: _IdGenerator,
  useFactory: () => {
    const mode = inject(H35_MODE);

    if (mode === 'cdk') {
      return inject(_IdGenerator, { skipSelf: true });
    }

    const host = inject(ElementRef).nativeElement as Element;
    const counter = mode === 'counter' ? inject(YetiCounter) : null;
    const adopting = counter ? null : ids(mode);

    return { getId: (prefix: string) => (counter ? counter.next(prefix) : adopting!.next(prefix, host)) };
  },
};
