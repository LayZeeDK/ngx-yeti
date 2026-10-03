import { type Locator, type Page } from '@playwright/test';

declare global {
  interface Window {
    __STORYBOOK_PREVIEW__?: {
      currentRender?: {
        phase?: string;
        renderOptions?: { autoplay?: boolean };
      };
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

  await throwIfStoryErrored(page, storyId);

  const { autoplay, phase } = await page.evaluate(() => {
    const render = window.__STORYBOOK_PREVIEW__?.currentRender;

    return { autoplay: render?.renderOptions?.autoplay, phase: render?.phase };
  });

  if (autoplay === undefined || phase === undefined) {
    throw new Error(
      `openStory('${storyId}'): cannot read Storybook's render state; window.__STORYBOOK_PREVIEW__ changed shape.`,
    );
  }

  if (autoplay) {
    throw new Error(
      `openStory('${storyId}'): Storybook ran the play function; embed=true no longer turns autoplay off.`,
    );
  }

  // sb-show-main appears before the story renders; afterEach, where the
  // console.error gate runs, ends later.
  await page.waitForFunction(
    (donePhases) =>
      donePhases.includes(
        window.__STORYBOOK_PREVIEW__?.currentRender?.phase ?? '',
      ),
    ['finished', 'errored', 'aborted'],
  );
  await throwIfStoryErrored(page, storyId);

  return page.locator('#storybook-root');
}

async function throwIfStoryErrored(page: Page, storyId: string): Promise<void> {
  const error = await page.evaluate(() =>
    document.body.classList.contains('sb-show-errordisplay')
      ? (document.getElementById('error-message')?.textContent ?? 'unknown')
      : null,
  );

  if (error !== null) {
    throw new Error(`openStory('${storyId}'): Storybook shows "${error}".`);
  }
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
