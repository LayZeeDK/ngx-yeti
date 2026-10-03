import { type Locator, type Page } from '@playwright/test';

declare global {
  interface Window {
    __STORYBOOK_PREVIEW__?: {
      currentRender?: { renderOptions?: { autoplay?: boolean } };
    };
  }
}

/**
 * Opens one story of the static Storybook build and returns its root. The
 * `embed=true` parameter turns Storybook's autoplay off, so the play function
 * does not run again (docs/specs/adr/0014-testing-stack-for-yeti.md, point 4).
 * Only `page.goto` and DOM reads are used, so every Playwright release the
 * floor jobs install can run it.
 */
export async function openStory(page: Page, storyId: string): Promise<Locator> {
  const index: unknown = await (await page.request.get('index.json')).json();

  if (!hasStory(index, storyId)) {
    throw new Error(
      `openStory('${storyId}'): the Storybook build has no story with this id.`,
    );
  }

  await page.goto(
    `iframe.html?id=${encodeURIComponent(storyId)}&viewMode=story&embed=true`,
  );
  await page.waitForFunction(
    () =>
      document.body.classList.contains('sb-show-main') ||
      document.body.classList.contains('sb-show-errordisplay'),
  );

  const { error, autoplay } = await page.evaluate(() => ({
    error: document.body.classList.contains('sb-show-errordisplay')
      ? (document.getElementById('error-message')?.textContent ?? 'unknown')
      : null,
    autoplay:
      window.__STORYBOOK_PREVIEW__?.currentRender?.renderOptions?.autoplay,
  }));

  if (error !== null) {
    throw new Error(`openStory('${storyId}'): Storybook shows "${error}".`);
  }

  if (autoplay !== false) {
    throw new Error(
      `openStory('${storyId}'): Storybook ran the play function; embed=true no longer turns autoplay off.`,
    );
  }

  return page.locator('#storybook-root');
}

function hasStory(index: unknown, storyId: string): boolean {
  return (
    typeof index === 'object' &&
    index !== null &&
    'entries' in index &&
    typeof index.entries === 'object' &&
    index.entries !== null &&
    storyId in index.entries
  );
}
