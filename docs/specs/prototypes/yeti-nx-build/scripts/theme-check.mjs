// Serves the built demo app (themed) and a control page (Yeti alone), then reads the
// .button's computed radius and background in Chromium, Firefox and WebKit.
// usage: node theme-check.mjs <ws>   (run from a folder where `playwright` resolves)
import { createServer } from 'node:http';
import { readFileSync, existsSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';

const ws = process.argv[2];
const require = createRequire(join(ws, 'package.json'));
const { chromium, firefox, webkit } = require('playwright');
const root = join(ws, 'dist/apps/demo/browser');
copyFileSync(join(ws, 'vendor/yeti/dist/yeti.css'), join(root, 'control-yeti.css'));
writeFileSync(join(root, 'control.html'), '<!doctype html><link rel="stylesheet" href="control-yeti.css"><main class="stack"><button class="button" type="button" data-variant="primary">Control</button></main>');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer((req, res) => {
  const path = join(root, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  res.writeHead(existsSync(path) ? 200 : 404, { 'content-type': types[extname(path)] ?? 'application/octet-stream' });
  res.end(existsSync(path) ? readFileSync(path) : '');
}).listen(4499);
const read = (page) => page.locator('.button').evaluate((el) => {
  const s = getComputedStyle(el);

  return { radius: s.borderTopLeftRadius, bg: s.backgroundColor, hue: getComputedStyle(document.documentElement).getPropertyValue('--yeti-hue-primary').trim() };
});
let failed = 0;

for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4499/');
  await page.locator('.button').waitFor();
  const themed = await read(page);
  await page.goto('http://localhost:4499/control.html');
  const control = await read(page);
  const ok = themed.hue === '30' && control.hue === '250' && themed.radius === '9999px' && control.radius !== themed.radius && control.bg !== themed.bg;
  failed += ok ? 0 : 1;
  console.log(`${ok ? '[OK]' : '[FAIL]'} ${name} ${browser.version()} themed=${JSON.stringify(themed)} control=${JSON.stringify(control)}`);
  await browser.close();
}

server.close();
process.exit(failed ? 1 : 0);
