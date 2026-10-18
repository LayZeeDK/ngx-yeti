import { InjectionToken } from '@angular/core';
import type { YetiOverlay } from './overlay';

/** The enclosing `YetiOverlay`, for its held child (building-blocks 1.9). */
export const yetiOverlayToken = new InjectionToken<YetiOverlay>(
  'yetiOverlayToken',
);
