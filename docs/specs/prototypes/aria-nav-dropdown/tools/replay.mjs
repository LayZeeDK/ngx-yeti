// PROTOTYPE (ticket 29): a click on the dropdown trigger while the bundle is delayed,
// then hydration with event replay. Does the open state survive, and do Aria's state
// and the platform's agree afterwards?
import { chromium, firefox, webkit } from 'playwright';

const out = {};

for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch();

  for (const path of ['/a', '/b']) {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
    const page = await ctx.newPage();
    let release;
    const gate = new Promise((r) => (release = r));
    await page.route(/main-.*\.js$/, async (route) => {
      await gate;
      await route.continue();
    });
    // Module scripts block DOMContentLoaded, so wait for the trigger instead.
    await page.goto('http://localhost:4391' + path, { waitUntil: 'commit' });
    await page.waitForSelector('#account-menu', { state: 'attached' });
    await page.click('.dropdown:has(> #account-menu) > button');
    await page.waitForTimeout(150);
    const openBefore = await page.evaluate(() => document.querySelector('#account-menu').matches(':popover-open'));
    release();
    await page.waitForSelector('html[data-stable]', { timeout: 15000 });
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => ({
      open: document.querySelector('#account-menu').matches(':popover-open'),
      ariaExpanded: document.querySelector('.dropdown:has(> #account-menu) > button').getAttribute('aria-expanded'),
    }));
    // One more click after hydration: does it close?
    await page.click('.dropdown:has(> #account-menu) > button');
    await page.waitForTimeout(250);
    const afterClick = await page.evaluate(() => ({
      open: document.querySelector('#account-menu').matches(':popover-open'),
      ariaExpanded: document.querySelector('.dropdown:has(> #account-menu) > button').getAttribute('aria-expanded'),
    }));
    out[`${name} ${path}`] = { openBefore, after, afterClick };
    await ctx.close();
  }

  await browser.close();
}

console.log(JSON.stringify(out, null, 1));
