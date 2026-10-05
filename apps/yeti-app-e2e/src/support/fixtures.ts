import { test as base, expect } from '@playwright/test';
import { axeViolations, axeViolationsOfSnapshot } from './axe';

export { expect };

export const isProduction =
  process.env['FIXTURE_CONFIGURATION'] === 'production';

/**
 * The one link `recordStyleMutations` sees added after parsing ends on every
 * route: the client's style preload for `card`, which the loader writes at
 * bootstrap from the app's preload list. The server writes a prefetch for it
 * instead (setup rule 4, the user's ruling of 2026-10-05).
 */
export const clientCardPreload = expect.stringMatching(
  /^add link yeti-css\/components\/card\/card\.css\?v=\w+$/,
);

/** The two render modes every fixture is served in (`app.routes.ts`). */
export const routeKinds = [
  { kind: 'prerendered', prefix: '' },
  { kind: 'server-rendered', prefix: 'server/' },
] as const;

export const test = base.extend<{ axeViolations: () => Promise<string[]> }>({
  axeViolations: async (
    { browser, browserName, javaScriptEnabled, page },
    use,
  ) => {
    await use(() =>
      !javaScriptEnabled && browserName === 'firefox'
        ? axeViolationsOfSnapshot(browser, page)
        : axeViolations(page, javaScriptEnabled),
    );
  },
});
