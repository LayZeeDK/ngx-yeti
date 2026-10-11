import { InjectionToken } from '@angular/core';
import type { YetiBreakout } from './breakout';

/** The enclosing `YetiBreakout`, for its parts (building-blocks 1.9). */
export const yetiBreakoutToken = new InjectionToken<YetiBreakout>(
  'yetiBreakoutToken',
);
