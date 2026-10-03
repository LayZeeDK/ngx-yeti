// PROTOTYPE (ticket 18), mode "noreplay": full hydration only; no incremental hydration, so no event replay.
import { provideClientHydration, withNoIncrementalHydration } from '@angular/platform-browser';
export const modeName = 'noreplay';
export const modeProviders = [provideClientHydration(withNoIncrementalHydration())];
