import { InjectionToken } from '@angular/core';
import type { NgxYetiColumns } from './columns';

/** The enclosing `NgxYetiColumns`, for its columns (building-blocks 1.9). */
export const yetiColumnsToken = new InjectionToken<NgxYetiColumns>(
  'yetiColumnsToken',
);
