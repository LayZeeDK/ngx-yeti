// PROTOTYPE (ticket 18), mode "plain": provideClientHydration() with no features.
// In 22.2 that already includes incremental hydration and, through it, event replay.
import { provideClientHydration } from '@angular/platform-browser';
export const modeName = 'plain';
export const modeProviders = [provideClientHydration()];
