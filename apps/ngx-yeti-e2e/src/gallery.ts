import { test as base } from '@playwright/test';

// Playwright's `mount(storyId)` opens `baseURL` and calls `window.mount()`.

interface StorybookChannel {
  on: (event: string, listener: () => void) => void;
  off: (event: string, listener: () => void) => void;
  emit: (event: string, data: unknown) => void;
}

interface StorybookPreview {
  channel: StorybookChannel;
  storeInitializationPromise: Promise<void>;
  storyStoreValue?: { storyIndex: { entries: Record<string, unknown> } };
  currentRender?: { renderOptions?: { autoplay?: boolean } };
}

declare global {
  interface Window {
    __STORYBOOK_PREVIEW__?: StorybookPreview;
    mount?: (params: { story: string; props?: unknown }) => Promise<void>;
  }
}

function installGallery(): void {
  window.mount = async ({ story, props }) => {
    if (props !== undefined) {
      throw new Error(
        `mount('${story}'): the gallery takes no props; give the story args instead.`,
      );
    }

    while (!window.__STORYBOOK_PREVIEW__) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    const preview = window.__STORYBOOK_PREVIEW__;
    await preview.storeInitializationPromise;

    if (!preview.storyStoreValue?.storyIndex.entries[story]) {
      throw new Error(
        `mount('${story}'): the Storybook build has no story with this id.`,
      );
    }

    const storyRoot = document.getElementById('storybook-root');

    // mount() returns `#root`; Storybook renders into `#storybook-root`.
    if (storyRoot && !document.getElementById('root')) {
      const root = document.createElement('div');
      root.id = 'root';
      storyRoot.before(root);
      root.append(storyRoot);
    }

    await new Promise<void>((resolve) => {
      const settle = (): void => {
        preview.channel.off('storyFinished', settle);
        preview.channel.off('storyMissing', settle);
        resolve();
      };
      preview.channel.on('storyFinished', settle);
      preview.channel.on('storyMissing', settle);
      preview.channel.emit('setCurrentStory', {
        storyId: story,
        viewMode: 'story',
      });
    });

    if (document.body.classList.contains('sb-show-errordisplay')) {
      throw new Error(
        `mount('${story}'): ${document.getElementById('error-message')?.textContent ?? 'Storybook shows an error.'}`,
      );
    }

    if (preview.currentRender?.renderOptions?.autoplay !== false) {
      throw new Error(
        `mount('${story}'): Storybook ran the play function; embed=true no longer turns autoplay off.`,
      );
    }
  };
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(installGallery);
    await use(page);
  },
});
