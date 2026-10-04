import { devices } from '@playwright/test';

/**
 * The Playwright projects of both e2e projects. A floor job of floor.yml
 * sets one FLOOR_* variable and runs that engine only; with CI set, the
 * three current engines run; locally, Chromium runs.
 */
export function browserProjects() {
  const chromiumFloor = process.env['FLOOR_CHROMIUM_PATH'];
  const chromium = {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      ...(chromiumFloor && {
        launchOptions: { executablePath: chromiumFloor },
      }),
    },
  };
  const firefox = { name: 'firefox', use: { ...devices['Desktop Firefox'] } };
  const webkit = { name: 'webkit', use: { ...devices['Desktop Safari'] } };

  if (process.env['FLOOR_WEBKIT'] === 'true') {
    return [webkit];
  }

  // Stock Firefox 145 to 152, and Playwright's Firefox 146, reject atan2()
  // with a relative length as invalid at parse time; 153 accepts it
  // (measured 2026-10-04). Yeti's scale divides `100vw - 320px` through
  // `tan(atan2(...))`, so every Yeti size token is invalid on this engine and
  // a card has no padding. Tests tagged @yeti-scale read Yeti sizes.
  if (process.env['FLOOR_FIREFOX_E2E'] === 'true') {
    return [{ ...firefox, grepInvert: /@yeti-scale/ }];
  }

  return process.env['CI'] && !chromiumFloor
    ? [chromium, firefox, webkit]
    : [chromium];
}
