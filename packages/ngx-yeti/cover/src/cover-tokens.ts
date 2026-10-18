import { InjectionToken } from '@angular/core';
import type { YetiCover } from './cover';

/** The enclosing `YetiCover`, for its centred child (building-blocks 1.9). */
export const yetiCoverToken = new InjectionToken<YetiCover>('yetiCoverToken');
