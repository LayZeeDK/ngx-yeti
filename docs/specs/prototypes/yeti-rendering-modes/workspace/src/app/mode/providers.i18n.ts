// PROTOTYPE (ticket 18), mode "i18n": as "plain", plus withI18nSupport().
import { provideClientHydration, withI18nSupport } from '@angular/platform-browser';
export const modeName = 'i18n';
export const modeProviders = [provideClientHydration(withI18nSupport())];
