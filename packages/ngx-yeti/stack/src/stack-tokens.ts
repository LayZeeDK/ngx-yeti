import { InjectionToken } from '@angular/core';
import type { YetiStack } from './stack';

/** The enclosing `YetiStack`, for its children (building-blocks 1.9). */
export const yetiStackToken = new InjectionToken<YetiStack>('yetiStackToken');
