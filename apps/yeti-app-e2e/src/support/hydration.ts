import { expect, type Page } from '@playwright/test';

/**
 * Angular 22.2 logs this once hydration finishes, in development mode only
 * (`printHydrationStats` in `@angular/core`).
 */
const hydrationSummary =
  /^Angular hydrated \d+ component\(s\) and \d+ node\(s\), \d+ component\(s\) were skipped\./;

/** Returns a function that expects a clean hydration. */
export function watchHydration(page: Page): () => Promise<void> {
  const messages: string[] = [];

  page.on('console', (message) => {
    messages.push(message.text());
  });
  page.on('pageerror', (error) => {
    messages.push(error.message);
  });

  return async () => {
    await expect
      .poll(() => messages.find((text) => hydrationSummary.test(text)), {
        message: 'Angular logs its development-mode hydration summary',
      })
      .toContain(', 0 component(s) were skipped.');
    expect(
      messages.filter((text) => /NG05\d\d/.test(text)),
      'no NG05xx hydration message',
    ).toEqual([]);
  };
}
