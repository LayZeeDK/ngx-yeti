// PROTOTYPE (ticket 24): Yeti's dialog keeps the UA's margin:auto centring; preflight's * { margin: 0 } does not exempt dialog.
// Appends dialog.css as a <style> (as Angular's styleUrl would) and opens a modal.
import { createServer } from 'node:http';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { chromium, firefox, webkit } from '../yeti/node_modules/playwright/index.mjs';

const dist = 'D:/tmp/ngx-yeti-24/app/dist';
const dialogCss = readFileSync('D:/tmp/ngx-yeti-24/yeti/dist/css/components/dialog/dialog.css', 'utf8');
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
await new Promise((r) => server.listen(4627, r));
const out = {};
for (const [en, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch();
  for (const c of ['Y0', 'TY', 'YT', 'S1', 'S3']) {
    root = `${dist}/${c}/browser`;
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('http://localhost:4627/');
    await page.waitForFunction(() => [...document.querySelectorAll('link[rel=stylesheet]')].every((l) => l.media !== 'print'));
    const v = await page.evaluate((css) => {
      const s = document.createElement('style');
      s.textContent = css;
      document.head.append(s);
      const d = document.createElement('dialog');
      d.className = 'dialog';
      d.innerHTML = '<h2>Title</h2><p>Body</p>';
      document.body.append(d);
      d.showModal();
      document.getAnimations().forEach((a) => a.finish());
      const r = d.getBoundingClientRect();
      const cs = getComputedStyle(d);
      return { marginTop: cs.marginTop, marginLeft: cs.marginLeft, left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width) };
    }, dialogCss);
    out[`${en}/${c}`] = v;
    console.log(en, c, JSON.stringify(v));
    await ctx.close();
  }
  await browser.close();
}
writeFileSync('D:/tmp/ngx-yeti-24/measure/dialog.json', JSON.stringify(out, null, 2));
server.close();
