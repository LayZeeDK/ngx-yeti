import { InjectionToken } from '@angular/core';
import type { YetiGrid } from './grid';

/** The enclosing `YetiGrid`, for its children (building-blocks 1.9). */
export const yetiGridToken = new InjectionToken<YetiGrid>('yetiGridToken');
