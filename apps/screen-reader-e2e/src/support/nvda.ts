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

      const load = async (): Promise<void> => {
        await page.waitForFunction(storyRendered);
        await page.evaluate(addStartMarker, startMarkerText);
      };
      const arrival = await move(async () => {
        await page.goto(storyUrl(storyId));
        await load();
      });
      const deadline = Date.now() + 60_000;
      let reloads = 0;

      token = await activate(page);

      // Asks NVDA for its focus until it reports the story document.
      for (;;) {
        const focus = await move(async () =>
          key(async () =>
            nvda.perform(nvda.keyboardCommands.reportCurrentFocus),
          ),
        );

        if (acceptsFocusReport(focus, token)) {
          return [...arrival, ...focus];
        }

        if (Date.now() > deadline) {
          throw new Error(
            `The story document does not have the keyboard focus; NVDA reports ${JSON.stringify(focus)}.`,
          );
        }

        if (reloads < 2 && namesWindow(focus, token)) {
          // NVDA is on the story window but not in its document, such as
          // its frame in Playwright's Firefox, which keeps every loaded
          // document focused, so raising the window fires no document focus
          // event. F6 moves the browser's focus to the address bar, and Enter
          // reloads the story from it into the document.
          reloads++;
          await move(async () => key(async () => nvda.press('F6')));
          const loaded = page.waitForEvent('load');

          await move(async () => key(async () => nvda.press('Enter')));
          await loaded;
          await move(load);
          token = await activate(page);
        } else {
          // NVDA missed the foreground change to the story window: hop the
          // foreground away and back.
          token = await activate(page, 'screen-reader-e2e', true);
        }
      }
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
    next: async () => move(async () => key(async () => nvda.next())),
    // Guidepup logs only what NVDA speaks during one of its own actions, so
    // the change runs inside `nvda.capture`, which first sends NVDA's stop
    // speech key and therefore goes through the guard. NVDA announces a page
    // change only in the foreground window, so a window that took the
    // foreground during the wait fails the test instead of passing for
    // silence.
    change: async (script, argument, settle = 0) =>
      move(async () =>
        key(async () => {
          await nvda.capture(async () => {
            await page.evaluate(script, argument);
            await delay(settle);
            await requireForeground(token, 'what NVDA spoke is not the page');
          });
        }),
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
  await requireForeground(token, 'no key sent');
  await send();
}

/** Throws, naming the foreground window, unless it is the story window. */
async function requireForeground(
  token: string | undefined,
  refused: string,
): Promise<void> {
  const title = await foregroundTitle();

  if (token === undefined || !title.includes(token)) {
    throw new Error(
      `NVDA lane: ${refused}; the foreground window is "${title}", not the story window ${String(token)}.`,
    );
  }
}

/**
 * Whether NVDA's focus report is about this story's document: it holds the
 * start marker, or it is a document and holds the window title token. NVDA
 * puts spaces inside the token
 * (`screen-reader-e 2e-518862816, document, focused, read only`), so spaces
 * are ignored on both sides. Another application's document, which NVDA
 * also reports as "document", is refused, and so is the story window's frame
 * (`screen-reader-e 2e-947894595 — Nightly, frame, read only`), where
 * browse-mode keys say nothing.
 */
export function acceptsFocusReport(
  phrases: readonly string[],
  token: string | undefined,
): boolean {
  return phrases
    .flatMap((phrase) => phrase.split('. '))
    .some(
      (phrase) =>
        compact(phrase).includes(compact(startMarkerText)) ||
        (token !== undefined &&
          compact(phrase).includes(compact(token)) &&
          phrase.split(', ').includes('document')),
    );
}

/** Whether NVDA's focus report names the story window by its title token. */
function namesWindow(
  phrases: readonly string[],
  token: string | undefined,
): boolean {
  return (
    token !== undefined &&
    phrases.some((phrase) => compact(phrase).includes(compact(token)))
  );
}

function compact(text: string): string {
  return text.replace(/\s+/g, '');
}

/**
 * Brings the page's browser window to the foreground and returns the fresh
 * title token it gave the window. `page.bringToFront()` only raises the
 * tab: Windows keeps the foreground on the window that has it, such as a
 * terminal, and NVDA's keys would go there. The token makes sure no other
 * window matches, and the script repeats until Windows reports that window
 * as the foreground one. With `hop`, the script first moves the foreground
 * to a window of its own and back, a fresh foreground change for NVDA, which
 * can miss the one that brought the window up.
 */
export async function activate(
  page: Page,
  name = 'screen-reader-e2e',
  hop = false,
): Promise<string> {
  const token = `${name}-${String(randomInt(1e9))}`;
  const deadline = Date.now() + 20_000;

  await page.evaluate((title) => {
    document.title = title;
  }, token);
  await page.bringToFront();

  for (let first = true; ; first = false) {
    const title = await foreground(token, hop && first);

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
Add-Type -AssemblyName System.Windows.Forms
function Set-Foreground($hWnd, [switch]$Restore) {
  $from = [ScreenReaderE2e.Window]::GetCurrentThreadId()
  $to = [ScreenReaderE2e.Window]::GetWindowThreadProcessId([ScreenReaderE2e.Window]::GetForegroundWindow(), [IntPtr]::Zero)
  [void][ScreenReaderE2e.Window]::AttachThreadInput($from, $to, $true)
  if ($Restore) {
    [void][ScreenReaderE2e.Window]::ShowWindow($hWnd, 6)
    [void][ScreenReaderE2e.Window]::ShowWindow($hWnd, 9)
    [void][ScreenReaderE2e.Window]::BringWindowToTop($hWnd)
  }
  [void][ScreenReaderE2e.Window]::SetForegroundWindow($hWnd)
  [void][ScreenReaderE2e.Window]::AttachThreadInput($from, $to, $false)
  for ($i = 0; $i -lt 20 -and [ScreenReaderE2e.Window]::GetForegroundWindow() -ne $hWnd; $i++) {
    [System.Windows.Forms.Application]::DoEvents()
    Start-Sleep -Milliseconds 100
  }
}
if ($window) {
  $hWnd = $window.MainWindowHandle
  if (-not ((Get-ForegroundTitle) -like $pattern)) {
    Set-Foreground $hWnd -Restore
  }
  if ($env:SCREEN_READER_E2E_HOP -eq '1' -and ((Get-ForegroundTitle) -like $pattern)) {
    $form = New-Object System.Windows.Forms.Form -Property @{ Text = 'screen-reader-e2e raise'; ShowInTaskbar = $false; Width = 240; Height = 80 }
    $form.Show()
    Set-Foreground $form.Handle
    Set-Foreground $hWnd
    $form.Close()
  }
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
async function foreground(token: string, hop: boolean): Promise<string> {
  return powershell(foregroundScript, {
    ...process.env,
    SCREEN_READER_E2E_WINDOW: token,
    SCREEN_READER_E2E_HOP: hop ? '1' : '0',
  });
}

/** The title of the window that has the foreground; raises nothing. */
export async function foregroundTitle(): Promise<string> {
  return powershell(`${user32}
Get-ForegroundTitle`);
}
