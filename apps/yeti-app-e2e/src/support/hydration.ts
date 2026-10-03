import { expect, type Page } from '@playwright/test';

/**
 * Angular 22.2 logs this once hydration finishes, in development mode only
 * (`printHydrationStats` in `@angular/core`).
 */
const hydrationSummary =
  /^Angular hydrated \d+ component\(s\) and \d+ node\(s\), \d+ component\(s\) were skipped\./;

export interface HydrationWatch {
  /**
   * Waits for Angular's hydration summary, then asserts that it reports 0
   * skipped components and that no `NG05xx` hydration message was logged.
   */
  expectClean(): Promise<void>;
}

/** Records the page's console from now on. Call it before `page.goto`. */
export function watchHydration(page: Page): HydrationWatch {
  const messages: string[] = [];

  page.on('console', (message) => {
    messages.push(message.text());
  });
  page.on('pageerror', (error) => {
    messages.push(error.message);
  });

  return {
    async expectClean(): Promise<void> {
      await expect
        .poll(() => messages.find((text) => hydrationSummary.test(text)), {
          message: 'Angular logs its development-mode hydration summary',
        })
        .toContain(', 0 component(s) were skipped.');
      expect(
        messages.filter((text) => /NG05\d\d/.test(text)),
        'no NG05xx hydration message',
      ).toEqual([]);
    },
  };
}
