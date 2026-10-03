// PROTOTYPE (ticket 24): do preflight's leaks show? Screenshot elements in Y0 and each mix, compare bytes.
import { createServer } from 'node:http';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { chromium, firefox, webkit } from '../yeti/node_modules/playwright/index.mjs';

const dist = 'D:/tmp/ngx-yeti-24/app/dist';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
let root = '';
const server = createServer((req, res) => {
  let p = join(root, decodeURIComponent(req.url.split('?')[0]));
  if (req.url === '/' || !existsSync(p)) {
    p = join(root, 'index.html');
  }
  res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(4626, r));
const targets = {
  'plain button': '[data-m=base] > button',
  'yeti button': '[data-m=yeti] > button.button',
  list: '[data-m=base] > ul',
  hr: '[data-m=base] > hr',
  select: '[data-m=base] > select',
  card: '[data-m=card-plain]',
};
mkdirSync('D:/tmp/ngx-yeti-24/measure/shots', { recursive: true });
const out = {};
for (const [en, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch();
  const shots = {};
  for (const c of ['Y0', 'TY', 'S1', 'S3']) {
    root = `${dist}/${c}/browser`;
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('http://localhost:4626/');
    await page.waitForFunction(() => [...document.querySelectorAll('link[rel=stylesheet]')].every((l) => l.media !== 'print'));
    await page.click('#toggle');
    await page.waitForSelector('[data-m=card-plain]');
    await page.evaluate(() => document.activeElement.blur());
    await page.waitForTimeout(100);
    for (const [name, sel] of Object.entries(targets)) {
      const buf = await page.locator(sel).first().screenshot();
      (shots[name] ??= {})[c] = buf;
      writeFileSync(`D:/tmp/ngx-yeti-24/measure/shots/${en}-${c}-${name.replace(' ', '-')}.png`, buf);
    }
    await ctx.close();
  }
  for (const [name, byC] of Object.entries(shots)) {
    out[`${en}/${name}`] = Object.fromEntries(['TY', 'S1', 'S3'].map((c) => [c, byC[c].equals(byC.Y0) ? 'same as Y0' : 'differs']));
    console.log(en, name, JSON.stringify(out[`${en}/${name}`]));
  }
  await browser.close();
}
writeFileSync('D:/tmp/ngx-yeti-24/measure/pixels.json', JSON.stringify(out, null, 2));
server.close();
