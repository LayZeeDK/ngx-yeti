import { test as base, expect } from '@playwright/test';
import { axeViolations, axeViolationsOfSnapshot } from './axe';

export { expect };

export const isProduction =
  process.env['FIXTURE_CONFIGURATION'] === 'production';

const clientPreloadEntry =
  /^add link yeti-css\/\w+\/[\w-]+\/[\w-]+\.css\?v=\w+$/;

/**
 * The `recordStyleMutations` entry of the client's style preload for `item`,
 * which the loader writes at bootstrap from the app's preload list. The
 * server writes a prefetch for it instead (setup rule 4, the user's ruling of
 * 2026-10-05). The list grows with the items, so assert these by containment.
 */
export function clientItemPreload(
  item: string,
): ReturnType<typeof expect.stringMatching> {
  return expect.stringMatching(
    new RegExp(`^add link yeti-css/\\w+/${item}/${item}\\.css\\?v=\\w+$`),
  );
}

export const clientCardPreload = clientItemPreload('card');

/**
 * The entries of a `recordStyleMutations` list other than the client's style
 * preloads, which every route adds after parsing ends.
 */
export function withoutClientPreloads(
  mutations: readonly string[],
): readonly string[] {
  return mutations.filter((entry) => !clientPreloadEntry.test(entry));
}

/**
 * Expects a `recordStyleMutations` list to hold the client card preload and
 * nothing but client style preloads: no item link added or removed.
 */
export function expectOnlyClientPreloads(mutations: readonly string[]): void {
  expect(
    mutations,
    'the client card preload is added after parsing ends',
  ).toContainEqual(clientCardPreload);
  expect(
    withoutClientPreloads(mutations),
    'nothing but client style preloads is added after parsing ends',
  ).toEqual([]);
}

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
