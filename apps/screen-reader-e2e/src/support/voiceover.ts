import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
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

const execFileAsync = promisify(execFile);

async function frontmostApplication(): Promise<string> {
  try {
    const { stdout } = await execFileAsync(
      'osascript',
      [
        '-e',
        'tell application "System Events" to get name of first application process whose frontmost is true',
      ],
      { timeout: 10_000 },
    );

    return stdout.trim();
  } catch (error) {
    throw new Error('The foreground application query failed.', {
      cause: error,
    });
  }
}

/** How many VoiceOver items `press` walks past looking for its button. */
const maxPressSteps = 10;

/**
 * VoiceOver announces a page change only while Safari is in front, so a lost
 * front window fails the test instead of passing for silence.
 */
async function requireSafariInFront(): Promise<void> {
  const front = await frontmostApplication();

  if (front !== 'Safari') {
    throw new Error(
      `Safari lost the foreground to ${front}: what VoiceOver spoke is not the page.`,
    );
  }
}

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
    // Guidepup's VoiceOver settings speak a usage hint ("You are currently
    // on ...") a second after each item; a hint that lands in a capture
    // replaces the phrase it follows, and it describes VoiceOver, not the
    // page.
    await voiceOver.start({
      capture: true,
      settings: { SCRShouldOutputVOInstructions: false },
    });

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
    next: async () => move(async () => voiceOver.next()),
    // Guidepup logs only what VoiceOver speaks during one of its own
    // actions, so the change runs inside `voiceOver.capture`. It polls
    // VoiceOver's last phrase only once the action returns, so the action
    // is the script alone: a wait inside it would leave a later phrase to
    // replace the announcement before the first poll (guidepup#183).
    change: async (script, argument, settle = 0) =>
      move(async () => {
        await voiceOver.capture(async () => browser.execute(script, argument));
        await browser.pause(settle);
        await requireSafariInFront();
      }),
    // The VoiceOver cursor walks from the web area's left edge to the button,
    // and VO-Space presses it; Guidepup polls right after the press. Focus
    // set from the page does not move VoiceOver's keyboard focus in a
    // safaridriver session, so the cursor cannot follow it there.
    press: async (name, settle = 0) =>
      move(async () => {
        await voiceOver.perform(voiceOver.keyboardCommands.jumpToLeftEdge);

        for (let step = 0; ; step++) {
          if (step === maxPressSteps) {
            throw new Error(
              `VoiceOver found no ${name} button in ${String(maxPressSteps)} steps.`,
            );
          }

          await voiceOver.next();

          if ((await voiceOver.lastSpokenPhrase()).includes(`${name} button`)) {
            break;
          }
        }

        await voiceOver.act();
        await browser.pause(settle);
        await requireSafariInFront();
      }),
    heard: () => log,
    stop: async () => Promise.resolve(),
  };
}
