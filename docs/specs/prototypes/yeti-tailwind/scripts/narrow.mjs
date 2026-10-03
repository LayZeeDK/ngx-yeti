// PROTOTYPE (ticket 24): the .container name collision at viewports between Tailwind's breakpoints.
import { createServer } from 'node:http';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { chromium, firefox, webkit } from '../yeti/node_modules/playwright/index.mjs';

const dist = 'D:/tmp/ngx-yeti-24/app/dist';
const configs = ['Y0', 'T', 'TY', 'YT', 'S1', 'S1n', 'S3', 'S3n'];
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
await new Promise((r) => server.listen(4625, r));
const out = {};
for (const [en, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch();
  for (const width of [1100, 600]) {
    for (const c of configs) {
      root = `${dist}/${c}/browser`;
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await page.goto('http://localhost:4625/');
      await page.waitForSelector('[data-m=container]');
      await page.waitForFunction(() => [...document.querySelectorAll('link[rel=stylesheet]')].every((l) => l.media !== 'print'));
      const v = await page.evaluate(() => {
        const el = document.querySelector('[data-m=container]');
        const cs = getComputedStyle(el);
        return { width: el.getBoundingClientRect().width, maxWidth: cs.maxWidth, containerType: cs.containerType, marginLeft: cs.marginLeft };
      });
      out[`${en}/${width}/${c}`] = v;
      console.log(en, width, c, JSON.stringify(v));
      await ctx.close();
    }
  }
  await browser.close();
}
writeFileSync('D:/tmp/ngx-yeti-24/measure/narrow.json', JSON.stringify(out, null, 2));
server.close();
