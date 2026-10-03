// PROTOTYPE (ticket 18): which zone runs a yeti:slide listener in the zone build.
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const child = spawn(process.execPath, ['dist/zone/server/server.mjs'], { env: { ...process.env, PORT: '4519', NG_ALLOWED_HOSTS: 'localhost' }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', (m) => console.log('console', m.type(), m.text()));
await page.goto('http://localhost:4519/');
await page.waitForFunction(() => window.__m?.stable !== undefined);
await page.click('[data-testid=dot-2]');
await page.waitForTimeout(600);
console.log(JSON.stringify(await page.evaluate(() => ({ t: window.__t, view: document.querySelector('[data-testid=default-cd-slides]')?.textContent, zone: typeof Zone }))));
await browser.close();
child.kill();
