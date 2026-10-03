// PROTOTYPE (ticket 24): snapshot computed styles of every build in three engines.
// Usage: node measure.mjs [engine ...]   -> writes snap-<engine>.json
import { createServer } from 'node:http';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { chromium, firefox, webkit } from '../yeti/node_modules/playwright/index.mjs';

const dist = 'D:/tmp/ngx-yeti-24/app/dist';
const configs = ['Y0', 'Y', 'T', 'TY', 'YT', 'S1', 'S1n', 'S3'];
const engines = { chromium, firefox, webkit };
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.ico': 'image/x-icon' };

let root = '';
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let p = join(root, url);
  if (url === '/' || !existsSync(p)) {
    p = join(root, 'index.html');
  }
  res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(4624, r));

// runs in the page
function snapshot() {
  const out = {};
  const mainEl = document.querySelector('main');
  const keyOf = (el) => {
    const parts = [];
    for (let e = el; e && e !== mainEl; e = e.parentElement) {
      const m = e.getAttribute('data-m');
      if (m) {
        parts.unshift(m);
        break;
      }
      parts.unshift(`${e.localName}:${[...e.parentElement.children].indexOf(e)}`);
    }
    return parts.join('/');
  };
  const read = (cs) => {
    const o = {};
    for (let i = 0; i < cs.length; i++) {
      const n = cs[i];
      if (!n.startsWith('--')) {
        o[n] = cs.getPropertyValue(n);
      }
    }
    return o;
  };
  for (const el of mainEl.querySelectorAll('*')) {
    const k = keyOf(el);
    out[k] = read(getComputedStyle(el));
    const b = getComputedStyle(el, '::before');
    if (b.content !== 'none' && b.content !== 'normal') {
      out[`${k}::before`] = read(b);
    }
    const a = getComputedStyle(el, '::after');
    if (a.content !== 'none' && a.content !== 'normal') {
      out[`${k}::after`] = read(a);
    }
  }
  const rs = getComputedStyle(document.documentElement);
  const vars = {};
  for (const v of ['--yeti-color-primary', '--yeti-color-surface', '--yeti-space-md', '--color-red-500', '--spacing', '--font-sans', '--default-font-family']) {
    vars[v] = rs.getPropertyValue(v).trim();
  }
  out[':root'] = { ...read(rs), ...vars };
  out['body'] = read(getComputedStyle(document.body));
  return out;
}

// first-declaration order of top-level and nested layers, following CSSOM order
function layerOrder() {
  const order = [];
  const add = (n) => {
    const segs = n.split('.');
    for (let i = 1; i <= segs.length; i++) {
      const p = segs.slice(0, i).join('.');
      if (!order.includes(p)) {
        order.push(p);
      }
    }
  };
  const walk = (rules, prefix) => {
    for (const r of rules) {
      if (r instanceof CSSLayerStatementRule) {
        r.nameList.forEach((n) => add(prefix + n));
      } else if (r instanceof CSSLayerBlockRule) {
        const n = prefix + (r.name || '(anon)');
        add(n);
        walk(r.cssRules, `${n}.`);
      } else if (r instanceof CSSImportRule) {
        if (r.layerName != null) {
          add(prefix + r.layerName);
        }
        if (r.styleSheet) {
          walk(r.styleSheet.cssRules, r.layerName != null ? `${prefix}${r.layerName}.` : prefix);
        }
      } else if (r.cssRules) {
        walk(r.cssRules, prefix);
      }
    }
  };
  const sheets = [];
  for (const s of document.styleSheets) {
    if (s.media.mediaText === 'print') {
      continue;
    }
    sheets.push(`${s.ownerNode.localName}${s.href ? ':' + s.href.split('/').pop() : ''}`);
    walk(s.cssRules, '');
  }
  return { order, sheets };
}

async function settle(page) {
  await page.evaluate(async () => {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    document.getAnimations().forEach((a) => a.finish());
  });
  await page.waitForTimeout(50);
}

const only = process.argv.slice(2);
for (const [en, type] of Object.entries(engines)) {
  if (only.length && !only.includes(en)) {
    continue;
  }
  const browser = await type.launch();
  const result = { engine: en, version: browser.version(), runs: {} };
  for (const scheme of ['light', 'dark']) {
    for (const c of configs) {
      root = `${dist}/${c}/browser`;
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto('http://localhost:4624/');
      await page.waitForSelector('app-eager section');
      await page.waitForFunction(() => [...document.querySelectorAll('link[rel=stylesheet]')].every((l) => l.media !== 'print'));
      await settle(page);
      const run = { errors };
      run.layers = await page.evaluate(layerOrder);
      run.before = await page.evaluate(snapshot);
      if (scheme === 'dark') {
        // a page that forces light with color-scheme, as Yeti documents, while the OS is dark
        await page.evaluate(() => {
          document.documentElement.style.colorScheme = 'light';
        });
        await settle(page);
        run.forcedLight = await page.evaluate(snapshot);
        await page.evaluate(() => {
          document.documentElement.style.colorScheme = '';
        });
        await settle(page);
      }
      const cardStyles = () => page.evaluate(() => [...document.querySelectorAll('head style')].filter((s) => s.textContent.includes('.card{')).length);
      await page.click('#toggle');
      await page.waitForSelector('[data-m=card-plain]');
      await settle(page);
      run.insertedCardStyles = await cardStyles();
      run.inserted = await page.evaluate(snapshot);
      run.insertedLayers = await page.evaluate(layerOrder);
      await page.click('#toggle');
      await page.waitForSelector('[data-m=card-plain]', { state: 'detached' });
      await settle(page);
      run.removedCardStyles = await cardStyles();
      run.removed = await page.evaluate(snapshot);
      await page.click('#toggle');
      await page.waitForSelector('[data-m=card-plain]');
      await settle(page);
      run.reinsertedCardStyles = await cardStyles();
      run.reinserted = await page.evaluate(snapshot);
      // fresh render with the card present, to tell stale invalidation from cascade
      await page.evaluate(() => {
        const m = document.querySelector('main');
        m.replaceWith(m.cloneNode(true));
      });
      await settle(page);
      run.reinsertedFresh = await page.evaluate(snapshot);
      result.runs[`${c}/${scheme}`] = run;
      console.log(en, c, scheme, 'errors', errors.length, 'card styles', run.insertedCardStyles, run.removedCardStyles, run.reinsertedCardStyles, 'layers', run.layers.order.filter((l) => !l.includes('.')).join(','));
      await ctx.close();
    }
  }
  await browser.close();
  writeFileSync(`D:/tmp/ngx-yeti-24/measure/snap-${en}.json`, JSON.stringify(result));
}
server.close();
