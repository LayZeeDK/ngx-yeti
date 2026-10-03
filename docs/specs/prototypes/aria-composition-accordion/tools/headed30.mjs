// PROTOTYPE (ticket 30): opens a page headed, first item open, and waits so a UIA client can read the engine's tree.
// Usage: node tools/headed30.mjs <chromium|firefox|webkit> <route without slash> <seconds>
import { chromium, firefox, webkit } from 'playwright';

const [eng, path, secs] = process.argv.slice(2);
const browser = await { chromium, firefox, webkit }[eng].launch({ headless: false });
const page = await browser.newPage();
await page.goto('http://localhost:4893/' + path);
await page.waitForFunction(() => globalThis.__stable === true);
await page.evaluate((p) => (document.title = 'UIAPROBE ' + p), path);
await page.locator('#live .accordion summary').first().click();
await page.locator('#live .accordion summary').first().focus();
console.log('ready');
await page.waitForTimeout(Number(secs) * 1000);
await browser.close();
