// PROTOTYPE (ticket 37): sketches of a styled item's directives (card, its title, a labelled part)
// with a probe-only fault hook, so a consumer @boundary can be tested against each place a package
// directive can throw. The fault hook is not package API; it stands in for a bug.
import {
  DestroyRef,
  HostAttributeToken,
  Directive,
  InjectionToken,
  afterNextRender,
  effect,
  inject,
  input,
} from '@angular/core';
import { injectYetiId } from './ids';
import { YetiStyles } from './yeti-styles';

export type FaultPhase = 'ctor' | 'host' | 'effect' | 'listener' | 'anr' | 'late';

export interface Fault {
  /** True when the directive should throw at this phase now. */
  hit(phase: FaultPhase, where: string): boolean;
  /** For phase `late`: true once the consumer armed it after hydration. */
  armed(): boolean;
}

export const yetiFaultToken = new InjectionToken<Fault>('yetiFaultToken');

@Directive({
  selector: '[yetiProbeCard]',
  host: {
    class: 'card',
    'data-ngx-yeti-part': 'card',
    '[attr.id]': 'id',
    '[attr.data-host]': 'hostValue()',
    '(click)': 'onClick()',
  },
})
export class YetiProbeCard {
  readonly id = injectYetiId('card');
  /** Which card on the page (its static data-t), so one route can fault one card. */
  readonly #name = inject(new HostAttributeToken('data-t'), { optional: true }) ?? '';
  readonly #fault = inject(yetiFaultToken, { optional: true });

  constructor() {
    const styles = inject(YetiStyles);
    styles.acquire('card');
    inject(DestroyRef).onDestroy(() => styles.release('card'));

    this.#throwIf('ctor');
    effect(() => {
      this.#throwIf('effect');
    });
    afterNextRender(() => this.#throwIf('anr'));
  }

  protected hostValue(): string {
    this.#throwIf('host');

    if (this.#fault?.armed()) {
      this.#throwIf('late');
    }

    return 'ok';
  }

  protected onClick(): void {
    this.#throwIf('listener');
  }

  #throwIf(phase: FaultPhase): void {
    if (this.#fault?.hit(phase, this.#name)) {
      throw new Error(`probe ${phase} ${this.#name}`);
    }
  }
}

@Directive({ selector: '[yetiProbeLabel]', exportAs: 'yetiProbeLabel', host: { '[attr.id]': 'id' } })
export class YetiProbeLabel {
  readonly id = injectYetiId('label');
}

@Directive({ selector: '[yetiProbeLabelled]', host: { '[attr.aria-labelledby]': 'by().id' } })
export class YetiProbeLabelled {
  readonly by = input.required<YetiProbeLabel>({ alias: 'yetiProbeLabelled' });
}
