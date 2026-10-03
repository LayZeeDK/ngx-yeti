// Compare the :root blocks the critical text contains with the ones the browser parsed.
import { chromium, firefox } from 'file:///D:/tmp/ngx-yeti-23/yeti/node_modules/playwright/index.mjs';
for (const [name, engine] of [['chromium', chromium], ['firefox', firefox]]) {
  const browser = await engine.launch();
  const pg = await browser.newPage({ javaScriptEnabled: false });
  await pg.route('**/styles-*.css', (r) => r.abort());
  await pg.goto('http://localhost:4280/sub/', { waitUntil: 'load' }).catch(() => {});
  await pg.waitForTimeout(300);
  console.log(name, JSON.stringify(await pg.evaluate(() => {
    const sheet = document.styleSheets[0];
    const text = sheet.ownerNode.textContent;
    const textRoots = [...text.matchAll(/:root\{(--[\w-]+)/g)].map((m) => m[1]);
    const parsedRoots = [];
    const walk = (rules) => { for (const r of rules) { if (r.selectorText === ':root' && r.style.length) parsedRoots.push(r.style[0]); if (r.cssRules) walk(r.cssRules); } };
    walk(sheet.cssRules);
    const missing = textRoots.filter((t) => !parsedRoots.includes(t));
    const ctx = missing.map((m) => { const i = text.indexOf(':root{' + m); return text.slice(i - 160, i).replace(/\s+/g, ' '); });
    return { textRoots: textRoots.length, parsedRoots: parsedRoots.length, missing, before: ctx };
  }), null, 1));
  await browser.close();
}
