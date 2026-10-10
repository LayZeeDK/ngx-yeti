import { macOSActivate, voiceOver } from '@guidepup/guidepup';
import { remote } from 'webdriverio';
import {
  addStartMarker,
  spoken,
  startMarkerText,
  storyRendered,
  storyUrl,
  type Driver,
  type Lane,
} from './screen-reader';

type Safari = Awaited<ReturnType<typeof remote>>;

/**
 * VoiceOver and one real Safari window per worker. Playwright's `webkit` is
 * not Safari, so Safari runs through WebdriverIO and `safaridriver` (enable
 * it once with `sudo safaridriver --enable`), headed because `safaridriver`
 * has no headless mode. `open` brings Safari to the front and moves the
 * VoiceOver cursor into the web content.
 */
let safari: Safari | undefined;

export const voiceOverDriver: Driver = {
  async startReader() {
    await voiceOver.start({ capture: true });

    try {
      safari = await remote({
        capabilities: { browserName: 'safari' },
        logLevel: 'warn',
      });
    } catch (error) {
      await voiceOver.stop();

      throw error;
    }
  },
  async stopReader() {
    try {
      await safari?.deleteSession();
    } finally {
      safari = undefined;
      await voiceOver.stop();
    }
  },
  lane: voiceOverLane,
};

function voiceOverLane(): Lane {
  const browser = safari;

  if (!browser) {
    throw new Error('VoiceOver lane: startReader has not run.');
  }

  const log: string[] = [];

  const move = async (command: () => Promise<void>): Promise<string[]> =>
    spoken(log, voiceOver, command);

  return {
    name: 'voiceover',
    async open(storyId) {
      log.length = 0;

      return move(async () => {
        await browser.url(storyUrl(storyId));
        await browser.waitUntil(async () => browser.execute(storyRendered), {
          timeout: 30_000,
          timeoutMsg: `Storybook did not render ${storyId}`,
        });
        await browser.execute(addStartMarker, startMarkerText);
        await macOSActivate('Safari');
        // Into the web area.
        await voiceOver.interact();
      });
    },
    // The web area's first item is the start marker; the next item is the
    // story's first.
    async top() {
      await voiceOver.perform(voiceOver.keyboardCommands.jumpToLeftEdge);

      return move(async () => voiceOver.next());
    },
    nextListItem: async () => move(async () => voiceOver.next()),
    heard: () => log,
    stop: async () => Promise.resolve(),
  };
}
