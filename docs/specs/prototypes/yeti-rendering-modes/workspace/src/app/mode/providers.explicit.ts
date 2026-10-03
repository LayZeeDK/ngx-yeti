// PROTOTYPE (ticket 18), mode "explicit": the pre-22 spelling, withEventReplay() and the deprecated withIncrementalHydration().
import { provideClientHydration, withEventReplay, withIncrementalHydration } from '@angular/platform-browser';
export const modeName = 'explicit';
export const modeProviders = [provideClientHydration(withEventReplay(), withIncrementalHydration())];
