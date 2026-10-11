import { InjectionToken } from '@angular/core';
import type { YetiLayer } from './layer';

/** The enclosing `YetiLayer`, for its children (building-blocks 1.9). */
export const yetiLayerToken = new InjectionToken<YetiLayer>('yetiLayerToken');
