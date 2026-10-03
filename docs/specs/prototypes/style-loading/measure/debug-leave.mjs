import { chromium } from 'file:///D:/tmp/ngx-yeti-23/yeti/node_modules/playwright/index.mjs';
const browser = await chromium.launch();
const pg = await browser.newPage();
pg.on('console', (m) => console.log('[page]', m.text()));
await pg.goto('http://localhost:4280/sub/', { waitUntil: 'networkidle' });
await pg.evaluate(() => {
  new MutationObserver((ms) => { for (const m of ms) for (const n of m.removedNodes) console.log('removed', n.nodeName, n.id); }).observe(document.documentElement, { childList: true, subtree: true });
});
await pg.click('#toggle');
for (const t of [50, 200, 500, 800, 1200]) {
  await pg.waitForTimeout(t === 50 ? 50 : t - [50, 200, 500, 800, 1200][[50, 200, 500, 800, 1200].indexOf(t) - 1]);
  console.log(t, await pg.evaluate(() => ({ eager: !!document.getElementById('eager'), hosts: [...document.querySelectorAll('[data-ngx-yeti-part="card"]')].map((e) => e.id + ':' + e.isConnected + ':' + e.className), links: [...document.head.querySelectorAll('link[data-ngx-yeti-part]')].map((l) => l.dataset.ngxYetiPart) })));
}
await browser.close();
