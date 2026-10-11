import { execFile } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';
import { nvda } from '@guidepup/guidepup';
import type { Browser, Page } from '@playwright/test';
import {
  addStartMarker,
  spoken,
  startMarkerText,
  storyRendered,
  storyUrl,
  type Driver,
  type Lane,
} from './screen-reader';

/**
 * NVDA, in English whatever the Windows display language, and one headed
 * browser window of the given type per worker, which every test of the
 * worker reuses: a window a test raises from the background can keep the
 * keyboard focus elsewhere, while the window a fresh launch opens takes it.
 * NVDA reads the window that has the foreground, and NVDA's keys go to it,
 * so every key the lane sends goes through `sendKey`, which refuses to send
 * unless the story window still has the foreground.
 */
let session: { browser: Browser; page: Page } | undefined;

export const nvdaDriver: Driver = {
  async startReader(browserType, launchOptions) {
    await nvda.start({
      capture: true,
      settings: { general: { language: 'en' } },
    });

    try {
      const browser = await browserType.launch({
        ...launchOptions,
        headless: false,
      });

      session = { browser, page: await browser.newPage() };
    } catch (error) {
      await nvda.stop();

      throw error;
    }
  },
  async stopReader() {
    try {
      await session?.browser.close();
    } finally {
      session = undefined;
      await nvda.stop();
    }
  },
  lane: nvdaLane,
};

function nvdaLane(): Lane {
  if (!session) {
    throw new Error('NVDA lane: startReader has not run.');
  }

  const { page } = session;
  const log: string[] = [];
  // The title token of the story window, from the last `open`.
  let token: string | undefined;

  const move = async (command: () => Promise<void>): Promise<string[]> =>
    spoken(log, nvda, command);
  const key = async (send: () => Promise<void>): Promise<void> =>
    sendKey(token, send);

  return {
    name: 'nvda',
    async open(storyId) {
      log.length = 0;
      token = undefined;

      const arrival = await move(async () => {
        await page.goto(storyUrl(storyId));
        await page.waitForFunction(storyRendered);
        await page.evaluate(addStartMarker, startMarkerText);
        token = await activate(page);
        await quiet();
      });
      const focus = await move(async () =>
        key(async () => nvda.perform(nvda.keyboardCommands.reportCurrentFocus)),
      );

      if (!acceptsFocusReport(focus, token)) {
        throw new Error(
          `The story document does not have the keyboard focus; NVDA reports ${JSON.stringify(focus)}.`,
        );
      }

      return [...arrival, ...focus];
    },
    // Browse mode: Control+Home to the start marker, then down a line into
    // the story.
    async top() {
      await key(async () => nvda.press('Control+Home'));

      return move(async () => key(async () => nvda.next()));
    },
    nextListItem: async () =>
      move(async () =>
        key(async () => nvda.perform(nvda.keyboardCommands.moveToNextListItem)),
      ),
    heard: () => log,
    stop: async () => Promise.resolve(),
  };
}

/**
 * The only way a key leaves the lane. Reads the title of the foreground
 * window, changing no window, and sends the key only when the title holds
 * the story window's token; otherwise it throws, naming the title, and
 * sends nothing. A window that took the foreground fails the test instead
 * of receiving the key, and the retry starts clean.
 */
async function sendKey(
  token: string | undefined,
  send: () => Promise<void>,
): Promise<void> {
  const title = await foregroundTitle();

  if (token === undefined || !title.includes(token)) {
    throw new Error(
      `NVDA lane: no key sent; the foreground window is "${title}", not the story window ${String(token)}.`,
    );
  }

  await send();
}

/**
 * Whether NVDA's focus report is about this story's document: it holds the
 * window title token or the start marker. NVDA puts spaces inside the token
 * (`screen-reader-e 2e-518862816, document, focused, read only`), so spaces
 * are ignored on both sides. Another application's document, which NVDA
 * also reports as "document", is refused.
 */
export function acceptsFocusReport(
  phrases: readonly string[],
  token: string | undefined,
): boolean {
  const compact = (text: string): string => text.replace(/\s+/g, '');
  const needles = [
    startMarkerText,
    ...(token === undefined ? [] : [token]),
  ].map(compact);

  return phrases.some((phrase) =>
    needles.some((needle) => compact(phrase).includes(needle)),
  );
}

/**
 * Brings the page's browser window to the foreground and returns the fresh
 * title token it gave the window. `page.bringToFront()` only raises the
 * tab: Windows keeps the foreground on the window that has it, such as a
 * terminal, and NVDA's keys would go there. The token makes sure no other
 * window matches, and the script repeats until Windows reports that window
 * as the foreground one.
 */
export async function activate(
  page: Page,
  name = 'screen-reader-e2e',
): Promise<string> {
  const token = `${name}-${String(randomInt(1e9))}`;
  const deadline = Date.now() + 20_000;

  await page.evaluate((title) => {
    document.title = title;
  }, token);
  await page.bringToFront();

  for (;;) {
    const title = await foreground(token);

    if (title.includes(token)) {
      return token;
    }

    if (Date.now() > deadline) {
      throw new Error(
        `Cannot bring the browser window to the foreground: "${title}" keeps it.`,
      );
    }

    await delay(500);
  }
}

/**
 * Waits until NVDA has said nothing new for a second, so the next key acts
 * on a settled document.
 */
async function quiet(): Promise<void> {
  const deadline = Date.now() + 15_000;
  let last = -1;

  for (;;) {
    const count = (await nvda.spokenPhraseLog()).length;

    if (count === last) {
      return;
    }

    if (Date.now() > deadline) {
      throw new Error('NVDA kept speaking for 15 s.');
    }

    last = count;
    await delay(1_000);
  }
}

const user32 = `
Add-Type -Name Window -Namespace ScreenReaderE2e -MemberDefinition '
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
[DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, IntPtr processId);
[DllImport("user32.dll")] public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);
[DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
[DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);'
function Get-ForegroundTitle {
  $text = New-Object System.Text.StringBuilder 1024
  [void][ScreenReaderE2e.Window]::GetWindowText([ScreenReaderE2e.Window]::GetForegroundWindow(), $text, 1024)
  $text.ToString()
}`;

// Windows refuses SetForegroundWindow to a process that does not own the
// foreground, so the script attaches its input to the foreground window's
// thread while it minimizes, restores and raises the window whose title
// holds the token (a restored Edge window gives its page the keyboard
// focus; a plain raise left it in the address bar). No key event reaches
// any window. It prints the title of the window that has the foreground.
const foregroundScript = `${user32}
$pattern = '*' + $env:SCREEN_READER_E2E_WINDOW + '*'
$window = Get-Process | Where-Object { $_.MainWindowTitle -like $pattern } | Select-Object -First 1
if ($window -and -not ((Get-ForegroundTitle) -like $pattern)) {
  $hWnd = $window.MainWindowHandle
  $from = [ScreenReaderE2e.Window]::GetCurrentThreadId()
  $to = [ScreenReaderE2e.Window]::GetWindowThreadProcessId([ScreenReaderE2e.Window]::GetForegroundWindow(), [IntPtr]::Zero)
  [void][ScreenReaderE2e.Window]::AttachThreadInput($from, $to, $true)
  [void][ScreenReaderE2e.Window]::ShowWindow($hWnd, 6)
  [void][ScreenReaderE2e.Window]::ShowWindow($hWnd, 9)
  [void][ScreenReaderE2e.Window]::BringWindowToTop($hWnd)
  [void][ScreenReaderE2e.Window]::SetForegroundWindow($hWnd)
  [void][ScreenReaderE2e.Window]::AttachThreadInput($from, $to, $false)
  Start-Sleep -Milliseconds 200
}
Get-ForegroundTitle`;

const powershell = async (
  script: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<string> => {
  const { stdout } = await promisify(execFile)(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', script],
    { windowsHide: true, env },
  );

  return stdout.trim();
};

/**
 * Raises the window whose title holds `token` and returns the title of the
 * window that then has the foreground.
 */
async function foreground(token: string): Promise<string> {
  return powershell(foregroundScript, {
    ...process.env,
    SCREEN_READER_E2E_WINDOW: token,
  });
}

/** The title of the window that has the foreground; raises nothing. */
export async function foregroundTitle(): Promise<string> {
  return powershell(`${user32}
Get-ForegroundTitle`);
}
