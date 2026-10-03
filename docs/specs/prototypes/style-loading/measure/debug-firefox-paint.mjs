// Are Firefox's "unstyled frames" at hydration before or after first paint?
import { firefox, chromium } from 'file:///D:/tmp/ngx-yeti-23/yeti/node_modules/playwright/index.mjs';
for (const [name, engine] of [['firefox', firefox], ['chromium', chromium]]) {
  const browser = await engine.launch();
  const ctx = await browser.newContext();
  await ctx.addInitScript(`
    window.__frames = [];
    const tick = () => { const el = document.getElementById('eager'); if (el) window.__frames.push({ t: performance.now(), pad: getComputedStyle(el).paddingTop, sheets: document.styleSheets.length, loaded: [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => !!l.sheet).join('') }); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  `);
  const pg = await ctx.newPage();
  await pg.goto('http://localhost:4280/sub/', { waitUntil: 'networkidle' });
  const r = await pg.evaluate(() => ({ frames: window.__frames.slice(0, 6), paint: performance.getEntriesByType('paint').map((e) => `${e.name}@${e.startTime.toFixed(1)}`), nav: performance.getEntriesByType('navigation')[0]?.responseEnd }));
  console.log(name, JSON.stringify(r));
  await browser.close();
}
