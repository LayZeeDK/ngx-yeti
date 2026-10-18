import { InjectionToken } from '@angular/core';
import type { YetiSidebar } from './sidebar';

/** The enclosing `YetiSidebar`, for its children (building-blocks 1.9). */
export const yetiSidebarToken = new InjectionToken<YetiSidebar>(
  'yetiSidebarToken',
);
