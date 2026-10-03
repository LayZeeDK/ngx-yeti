// PROTOTYPE (ticket 37): ADR 0044's id helper, copied from ticket 35's `adopt` mode
// (prototypes/hydration-safe-ids/src/ids.ts), reduced to injectYetiId().
import { ElementRef, HostAttributeToken, Injectable, TransferState, inject, makeStateKey } from '@angular/core';

const COUNTS = makeStateKey<Record<string, number>>('ngx-yeti-ids');

@Injectable({ providedIn: 'root' })
export class YetiIds {
  readonly #state = inject(TransferState);
  readonly #counts: Record<string, number> = { ...this.#state.get(COUNTS, {}) };

  constructor() {
    this.#state.onSerialize(COUNTS, () => this.#counts);
  }

  next(prefix: string, host: Element): string {
    const served = host.getAttribute('id');

    if (served !== null && served.startsWith(prefix) && /^\d+$/.test(served.slice(prefix.length))) {
      return served;
    }

    const n = this.#counts[prefix] ?? 0;
    this.#counts[prefix] = n + 1;

    return `${prefix}${n}`;
  }
}

export function injectYetiId(item: string): string {
  return (
    inject(new HostAttributeToken('id'), { optional: true }) ??
    inject(YetiIds).next(`ngx-yeti-${item}-`, inject(ElementRef).nativeElement)
  );
}
