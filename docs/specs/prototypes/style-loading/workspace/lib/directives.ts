import { DestroyRef, Directive, inject, input } from '@angular/core';
import type { YetiGap } from 'yeti-css';
import { YetiPartName } from './parts';
import { YetiStyles } from './yeti-styles';

function usePart(part: YetiPartName): void {
  const styles = inject(YetiStyles);
  styles.acquire(part);
  inject(DestroyRef).onDestroy(() => styles.release(part));
}

@Directive({ selector: '[yetiCard]', host: { class: 'card', 'data-ngx-yeti-part': 'card' } })
export class YetiCard {
  constructor() {
    usePart('card');
  }
}

@Directive({ selector: '[yetiBadge]', host: { class: 'badge', 'data-ngx-yeti-part': 'badge' } })
export class YetiBadge {
  constructor() {
    usePart('badge');
  }
}

@Directive({ selector: '[yetiAlert]', host: { class: 'alert', 'data-ngx-yeti-part': 'alert' } })
export class YetiAlert {
  constructor() {
    usePart('alert');
  }
}

@Directive({ selector: '[yetiStack]', host: { class: 'stack', 'data-ngx-yeti-part': 'stack', '[attr.data-gap]': 'gap()' } })
export class YetiStack {
  /** Typed with Yeti's own exported vocabulary type, as the prefix ruling requires. */
  readonly gap = input<YetiGap>();

  constructor() {
    usePart('stack');
  }
}

@Directive({ selector: '[yetiCenter]', host: { class: 'center', 'data-ngx-yeti-part': 'center' } })
export class YetiCenter {
  constructor() {
    usePart('center');
  }
}
