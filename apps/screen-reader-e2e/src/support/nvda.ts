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
 * so `open` makes sure the story document has the focus before any key.
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

  const move = async (command: () => Promise<void>): Promise<string[]> =>
    spoken(log, nvda, command);

  return {
    name: 'nvda',
    async open(storyId) {
      log.length = 0;

      const arrival = await move(async () => {
        await page.goto(storyUrl(storyId));
        await page.waitForFunction(storyRendered);
        await page.evaluate(addStartMarker, startMarkerText);
        await activate(page);
        await quiet();
      });
      // Never send a key before NVDA reports the story document as the
      // focus: a raised window can leave the keyboard focus in the window
      // that had it, such as a terminal, which would receive the keys.
      const focus = await move(async () =>
        nvda.perform(nvda.keyboardCommands.reportCurrentFocus),
      );

      if (!focus.some((phrase) => phrase.includes('document'))) {
        throw new Error(
          `The story document does not have the keyboard focus; NVDA reports ${JSON.stringify(focus)}.`,
        );
      }

      return [...arrival, ...focus];
    },
    // Browse mode: Control+Home to the start marker, then down a line into
    // the story.
    async top() {
      await nvda.press('Control+Home');

      return move(async () => nvda.next());
    },
    nextListItem: async () =>
      move(async () => nvda.perform(nvda.keyboardCommands.moveToNextListItem)),
    heard: () => log,
    stop: async () => Promise.resolve(),
  };
}

/**
 * Brings the test's browser window to the foreground. `page.bringToFront()`
 * only raises the tab: Windows keeps the foreground on the window that has
 * it, such as a terminal, and NVDA's keys would go there. The window title
 * gets a fresh token so no other window matches, and the script repeats
 * until Windows reports that window as the foreground one.
 */
async function activate(page: Page): Promise<void> {
  const token = `screen-reader-e2e-${String(randomInt(1e9))}`;
  const deadline = Date.now() + 20_000;

  await page.evaluate((title) => {
    document.title = title;
  }, token);
  await page.bringToFront();

  for (;;) {
    const title = await foreground(token);

    if (title.includes(token)) {
      return;
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

// Windows refuses SetForegroundWindow to a process that does not own the
// foreground, so the script attaches its input to the foreground window's
// thread while it minimizes, restores and raises the window whose title
// holds the token (a restored Edge window gives its page the keyboard
// focus; a plain raise left it in the address bar). No key event reaches
// any window. It prints the title of the window that has the foreground.
const foregroundScript = `
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
}
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

/**
 * Raises the window whose title holds `token` and returns the title of the
 * window that then has the foreground.
 */
async function foreground(token: string): Promise<string> {
  const { stdout } = await promisify(execFile)(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', foregroundScript],
    {
      windowsHide: true,
      env: { ...process.env, SCREEN_READER_E2E_WINDOW: token },
    },
  );

  return stdout.trim();
}
