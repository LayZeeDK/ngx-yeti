// PROTOTYPE (ticket 18), mode "replay": full hydration plus withEventReplay(), incremental hydration off.
import { provideClientHydration, withEventReplay, withNoIncrementalHydration } from '@angular/platform-browser';
export const modeName = 'replay';
export const modeProviders = [provideClientHydration(withNoIncrementalHydration(), withEventReplay())];
