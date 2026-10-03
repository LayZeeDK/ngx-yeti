// PROTOTYPE (ticket 18), mode "zone": as "plain", with zone.js change detection instead of zoneless.
import { provideZoneChangeDetection } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
export const modeName = 'zone';
export const modeProviders = [provideZoneChangeDetection({ eventCoalescing: true }), provideClientHydration()];
