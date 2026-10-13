import { InjectionToken } from '@angular/core';
import type { YetiTable } from './table';

/** The enclosing `YetiTable`, for its cells and head (building-blocks 1.9). */
export const yetiTableToken = new InjectionToken<YetiTable>('yetiTableToken');
