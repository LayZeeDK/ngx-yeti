// PROTOTYPE (ticket 30): event and attribute trace for a click before hydration on /c and /a.
import { chromium, firefox, webkit } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = 'http://localhost:4893';
const out = {};
for (const [name, type] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
  const browser = await type.launch();
  out[name] = {};
  for (const path of ['/a', '/c', '/c-noinert', '/d']) {
    const page = await browser.newPage();
    await page.addInitScript(() => {
      const log = (globalThis.__log = []);
      const t0 = performance.now();
      document.addEventListener('toggle', (e) => log.push(`${Math.round(performance.now() - t0)} toggle ${e.target.querySelector('summary').textContent.slice(0, 8)} ${e.oldState}->${e.newState} open=${e.target.open}`), true);
      new MutationObserver((ms) => {
        for (const m of ms) {
          if (m.target.closest?.('#live') && ['open', 'inert', 'aria-expanded'].includes(m.attributeName)) {
            log.push(`${Math.round(performance.now() - t0)} attr ${m.target.tagName.toLowerCase()} ${m.attributeName}=${m.target.getAttribute(m.attributeName)}`);
          }
        }
      }).observe(document, { subtree: true, attributes: true });
    });
    let release;
    const gate = new Promise((res) => (release = res));
    await page.route(/\/main-[\w]+\.js$/, async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto(BASE + path, { waitUntil: 'commit' });
    await page.locator('#live .accordion summary').first().click();
    await page.waitForTimeout(400);
    await page.evaluate(() => globalThis.__log.push('--- release main.js'));
    release();
    await page.waitForFunction(() => globalThis.__stable === true);
    await page.waitForTimeout(600);
    const final = await page.evaluate(() => {
      const d = document.querySelector('#live details');
      const p = d.querySelector('p');

      return `open=${d.open} aria-expanded=${d.querySelector('summary').getAttribute('aria-expanded')} inert=${p.closest('[inert]') ? 'yes' : 'no'} out=${document.querySelector('#state')?.textContent}`;
    });
    out[name][path] = { log: await page.evaluate(() => globalThis.__log), final };
    await page.close();
  }

  await browser.close();
}

writeFileSync('results30/prehyd-trace.json', JSON.stringify(out, null, 2));
for (const [e, ps] of Object.entries(out)) {
  for (const [p, v] of Object.entries(ps)) {
    console.log(`=== ${e} ${p}: ${v.final}\n  ${v.log.join('\n  ')}`);
  }
}
