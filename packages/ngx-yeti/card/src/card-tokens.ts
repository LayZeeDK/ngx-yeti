import { InjectionToken } from '@angular/core';
import type { YetiCard } from './card';

/** The enclosing `YetiCard`, for its parts (building-blocks 1.9). */
export const yetiCardToken = new InjectionToken<YetiCard>('yetiCardToken');
