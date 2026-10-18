import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { workspaceRoot } from '@nx/devkit';
import {
  test as base,
  type BrowserType,
  type LaunchOptions,
  type TestInfo,
} from '@playwright/test';

export const storybookURL = 'http://localhost:4401';

export const laneNames = ['nvda', 'voiceover'] as const;

export type LaneName = (typeof laneNames)[number];

/**
 * One screen reader driving one browser. Every method returns the phrases
 * the reader spoke for that move, in order.
 */
export interface Lane {
  readonly name: LaneName;
  /**
   * Opens a story of the static Storybook build in the foreground, adds the
   * start marker (`addStartMarker`) and returns what the reader spoke on
   * arrival (a page-load read included).
   */
  open(storyId: string): Promise<string[]>;
  /**
   * Moves the reader from the start marker before the story into the
   * story's first item, so it reports whatever contains that item, such as
   * a list.
   */
  top(): Promise<string[]>;
  /**
   * Moves the reader on through the current list: NVDA to the next list
   * item, or reports there is none; VoiceOver, which has no list item key,
   * to the next item of the web content.
   */
  nextListItem(): Promise<string[]>;
  /** Moves the reader to the next line (NVDA) or item (VoiceOver). */
  next(): Promise<string[]>;
  /**
   * Runs `script` in the story document, waits `settle` milliseconds and
   * returns what the reader spoke meanwhile. It sends no key and moves no
   * focus, so the reader speaks only what the page change itself announces.
   */
  change(
    script: (argument: string) => void,
    argument: string,
    settle?: number,
  ): Promise<string[]>;
  /**
   * Presses the button whose text is `name` as the reader's user would,
   * waits `settle` milliseconds and returns what the reader spoke: NVDA
   * clicks it from the page, as `change` does; VoiceOver moves its cursor to
   * the button and presses VO-Space, the way VoiceOver announced a live
   * region in CI (Praxity/learning-patterns#11).
   */
  press(name: string, settle?: number): Promise<string[]>;
  /** Every phrase spoken since `open` began, the arrival included. */
  heard(): readonly string[];
  /** Ends the test; the worker keeps its reader and browser. */
  stop(): Promise<void>;
}

export function laneName(env: NodeJS.ProcessEnv = process.env): LaneName {
  const name = env['SCREEN_READER'];
  const lane = laneNames.find((known) => known === name);

  if (!lane) {
    throw new Error(
      `SCREEN_READER=${String(name)}: set it to one of ${laneNames.join(', ')}, or run nx run screen-reader-e2e:nvda or :voiceover.`,
    );
  }

  return lane;
}

/**
 * The story iframe of the static build. `embed=true` turns Storybook's
 * autoplay off, so no play function moves focus under the reader.
 */
export function storyUrl(storyId: string): string {
  return `${storybookURL}/iframe.html?id=${encodeURIComponent(storyId)}&viewMode=story&embed=true`;
}

/**
 * Runs in the page: true once Storybook has rendered the story, and throws
 * if Storybook shows an error.
 */
export function storyRendered(): boolean {
  const { classList } = document.body;

  if (classList.contains('sb-show-errordisplay')) {
    throw new Error(
      document.getElementById('error-message')?.textContent ??
        'Storybook shows an error',
    );
  }

  return (
    classList.contains('sb-show-main') &&
    (document.getElementById('storybook-root')?.childElementCount ?? 0) > 0
  );
}

export const startMarkerText = 'Story start';

/**
 * Runs in the page: puts a paragraph before the story root, so the reader
 * has a place outside the story to start from. A screen reader reports a
 * container, such as a list, when it moves into it from outside; a story
 * whose first element is that container gives the reader no outside.
 */
export function addStartMarker(text: string): void {
  const root = document.getElementById('storybook-root');

  if (!root) {
    throw new Error('The story iframe has no #storybook-root.');
  }

  const marker = document.createElement('p');

  marker.textContent = text;
  root.before(marker);
}

/**
 * Runs in the page: takes the list role off the list `selector` names and
 * keeps it without markers. Yeti removes the markers only from a list with
 * `role="list"`, and a list without markers is the one WebKit stops
 * exposing as a list, which is what the role restores.
 */
export function dropListRole(selector: string): void {
  const list = document.querySelector(selector);

  if (!(list instanceof HTMLElement) || !list.hasAttribute('role')) {
    throw new Error(`No list with a role matches ${selector}`);
  }

  list.removeAttribute('role');
  list.style.listStyle = 'none';
}

/** Runs in the page: clicks the button whose text is `name`. */
export function clickButton(name: string): void {
  const button = [...document.querySelectorAll('button')].find(
    (candidate) => candidate.textContent.trim() === name,
  );

  if (!button) {
    throw new Error(`No button named ${name}`);
  }

  button.click();
}

/**
 * Moves the reader from the start marker into the story and then `steps`
 * times on, and returns only what those moves made it say: the arrival may
 * read the whole page.
 */
export async function walk(
  lane: Lane,
  steps: number,
  on: 'next' | 'nextListItem',
): Promise<string[]> {
  const heard = await lane.top();

  for (let step = 0; step < steps; step++) {
    heard.push(...(await lane[on]()));
  }

  return heard;
}

/**
 * The longest prefix of `expected` found in `phrases`, each substring after
 * the one before it, so a failure shows which phrase is missing.
 */
export function inOrder(
  phrases: readonly string[],
  expected: readonly string[],
): string[] {
  const transcript = phrases.join('\n');
  const found: string[] = [];
  let from = 0;

  for (const substring of expected) {
    const at = transcript.indexOf(substring, from);

    if (at === -1) {
      break;
    }

    found.push(substring);
    from = at + substring.length;
  }

  return found;
}

/**
 * Writes the phrases a test heard and its annotations to
 * `dist/screen-reader-e2e/<lane>/<project>/<test>.json`, the report CI
 * uploads, and attaches them to the test.
 */
export async function recordPhrases(
  lane: Lane,
  testInfo: TestInfo,
): Promise<void> {
  const file = `${testInfo.titlePath
    .slice(1)
    .join(' ')
    .replace(
      /[^\w-]+/g,
      '-',
    )}-${String(testInfo.repeatEachIndex)}-${String(testInfo.retry)}.json`;
  const folder = join(
    workspaceRoot,
    'dist',
    'screen-reader-e2e',
    lane.name,
    testInfo.project.name,
  );
  const body = JSON.stringify(
    {
      lane: lane.name,
      project: testInfo.project.name,
      test: testInfo.titlePath.slice(1),
      retry: testInfo.retry,
      status: testInfo.status,
      annotations: testInfo.annotations,
      phrases: lane.heard(),
    },
    null,
    2,
  );

  await mkdir(folder, { recursive: true });
  await writeFile(join(folder, file), `${body}\n`);
  await testInfo.attach('phrases', {
    body,
    contentType: 'application/json',
  });
}

/** One lane's screen reader and browser, started once per worker. */
export interface Driver {
  /**
   * Starts the reader with full phrase capture, and its headed browser:
   * NVDA's from `browserType`, VoiceOver's real Safari.
   */
  startReader(
    browserType: BrowserType,
    launchOptions: LaunchOptions,
  ): Promise<void>;
  stopReader(): Promise<void>;
  /** The lane one test drives, in the worker's browser. */
  lane(): Lane;
}

async function driver(): Promise<Driver> {
  return laneName() === 'nvda'
    ? (await import('./nvda')).nvdaDriver
    : (await import('./voiceover')).voiceOverDriver;
}

/**
 * The test object of every `*.screen-reader.ts` file. `reader` starts the
 * screen reader SCREEN_READER names and its headed browser once per worker,
 * and `lane` records what the reader heard when each test ends. The NVDA
 * lane launches the project's Playwright browser; the VoiceOver lane opens
 * real Safari through WebdriverIO, so it never asks for Playwright's `page`.
 */
export const test = base.extend<{ lane: Lane }, { reader: Driver }>({
  reader: [
    async ({ playwright, browserName, launchOptions }, use) => {
      const reader = await driver();

      await reader.startReader(playwright[browserName], launchOptions);

      try {
        await use(reader);
      } finally {
        await reader.stopReader();
      }
    },
    { scope: 'worker' },
  ],
  lane: async ({ reader }, use, testInfo) => {
    const lane = reader.lane();

    try {
      await use(lane);
    } finally {
      await recordPhrases(lane, testInfo);
      await lane.stop();
    }
  },
});

export { expect } from '@playwright/test';

/**
 * Collects the phrases spoken during `move` from a reader's phrase log,
 * which the reader keeps from `start({ capture: true })`.
 */
export async function spoken(
  log: string[],
  reader: {
    clearSpokenPhraseLog(): Promise<void>;
    spokenPhraseLog(): Promise<string[]>;
  },
  move: () => Promise<void>,
): Promise<string[]> {
  await reader.clearSpokenPhraseLog();
  await move();
  const phrases = await reader.spokenPhraseLog();

  log.push(...phrases);

  return phrases;
}
