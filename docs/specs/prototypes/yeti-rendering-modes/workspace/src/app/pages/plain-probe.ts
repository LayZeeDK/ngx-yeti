import { ChangeDetectionStrategy, Component, DOCUMENT, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { rec } from '../rec';

// PROTOTYPE (ticket 18): Eager change detection on purpose. A plain field
// written from a yeti:slide addEventListener: zone.js refreshes it, zoneless does not.
// The listener is added in the constructor, inside the Angular zone when zone.js
// is loaded (afterNextRender runs outside it, which would hide the difference).
@Component({
  selector: 'app-plain-probe',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '<output data-testid="default-cd-slides">{{ slides }}</output>',
})
export class PlainProbe {
  protected slides = 0;

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      inject(DOCUMENT).addEventListener('yeti:slide', () => {
        this.slides++;
        rec('defaultCdSlide');
        rec('zone:' + ((globalThis as unknown as { Zone?: { current: { name: string } } }).Zone?.current.name ?? 'none'));
      });
    }
  }
}
