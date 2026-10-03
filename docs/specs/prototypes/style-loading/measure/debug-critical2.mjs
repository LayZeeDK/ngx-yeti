// Which parsed rules of the inlined critical <style> declare --yeti-card-padding or --yeti-space-md?
import { chromium } from 'file:///D:/tmp/ngx-yeti-23/yeti/node_modules/playwright/index.mjs';
const browser = await chromium.launch();
const pg = await browser.newPage({ javaScriptEnabled: false });
await pg.route('**/styles-*.css', (r) => r.abort());
await pg.goto('http://localhost:4280/sub/', { waitUntil: 'load' }).catch(() => {});
await pg.waitForTimeout(300);
console.log(JSON.stringify(await pg.evaluate(() => {
  const sheet = document.styleSheets[0];
  const hits = [];
  const walk = (rules, path) => {
    for (const r of rules) {
      const p = path + ' > ' + r.cssText.split('{')[0].trim().slice(0, 50);
      if (r.style) {
        const cp = r.style.getPropertyValue('--yeti-card-padding');
        const sm = r.style.getPropertyValue('--yeti-space-md');
        if (cp || sm) hits.push({ p, cardPadding: cp || '(none)', spaceMd: sm || '(none)', decls: r.style.length });
      }
      if (r.cssRules && r.cssRules.length) walk(r.cssRules, p);
    }
  };
  walk(sheet.cssRules, '');
  const text = sheet.ownerNode.textContent;
  const idx = text.indexOf('--yeti-card-padding');
  const blockStart = text.lastIndexOf('}', idx) + 1;
  return { topRules: [...sheet.cssRules].map((r) => r.cssText.split('{')[0].trim().slice(0, 40)), hits, textBlockHead: text.slice(blockStart, blockStart + 120) };
}), null, 1));
await browser.close();
