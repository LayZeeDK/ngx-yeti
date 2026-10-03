// Ticket 37 probe: consumer @boundary/@error around the package's directive sketches, under SSR and
// prerendering, development and production builds, Chromium, Firefox, WebKit, JavaScript on and off.
// Usage: BUILD=dev|prod PORT=4377 node probe37.mjs   -> results/probe-<build>.json, server-<build>.log
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium, firefox, webkit } from 'file:///D:/tmp/ngx-yeti-23/yeti/node_modules/playwright/index.mjs';

const build = process.env.BUILD ?? 'dev';
const port = Number(process.env.PORT ?? 4377);
const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const engines = (process.env.ENGINES ?? 'chromium,firefox,webkit').split(',');
const base = `http://localhost:${port}/sub/`;
const here = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1');
const outDir = path.join(here, 'results');
fs.mkdirSync(path.join(outDir, `html-${build}`), { recursive: true });

// --- cases ---------------------------------------------------------------------------------------
const cases = [];
for (const mode of ['s', 'p']) {
  for (const where of ['none', 'server', 'client', 'both', 'reset']) cases.push(`${mode}/plain/${where}/ctor`);
  for (const layout of ['on', 'never']) for (const where of ['none', 'server', 'client', 'both']) cases.push(`${mode}/${layout}/${where}/ctor`);
}
for (const phase of ['host', 'effect', 'listener', 'anr', 'late']) cases.push(`s/plain/client/${phase}`);
for (const phase of ['host', 'effect']) cases.push(`s/plain/server/${phase}`);
for (const phase of ['ctor', 'host', 'late']) cases.push(`s/plain/once/${phase}`);
const todo = only ? cases.filter((c) => only.test(c)) : cases;

// --- server --------------------------------------------------------------------------------------
const serverLog = [];
const server = spawn(process.execPath, [`D:/tmp/ngx-yeti-37/app/dist/${build}/server/server.mjs`], {
  env: { ...process.env, NG_ALLOWED_HOSTS: 'localhost', PORT: String(port) },
});
for (const s of [server.stdout, server.stderr]) s.on('data', (d) => serverLog.push(...String(d).split(/\r?\n/).filter(Boolean)));
const stop = () => { try { server.kill(); } catch {} };
process.on('exit', stop);
for (let i = 0; i < 100 && !serverLog.some((l) => l.includes('listening')); i++) await new Promise((r) => setTimeout(r, 200));

// --- helpers -------------------------------------------------------------------------------------
function parseServer(html) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';
  const state = html.match(/<script id="ng-state" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  let seed = null;
  try { seed = state ? JSON.parse(state)['ngx-yeti-ids'] ?? null : null; } catch { seed = 'unparsed'; }
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]).filter((i) => i !== 'ng-state');
  const refs = [...html.matchAll(/aria-(?:labelledby|controls)="([^"]+)"/g)].map((m) => m[1]);
  return {
    links: [...head.matchAll(/<link[^>]*data-ngx-yeti-styles="([^"]+)"/g)].map((m) => m[1]),
    dataT: [...html.matchAll(/data-t="([^"]+)"/g)].map((m) => m[1]),
    ids,
    dupIds: ids.filter((x, i) => ids.indexOf(x) !== i),
    refs,
    unresolvedRefs: refs.filter((r) => ids.filter((i) => i === r).length !== 1),
    seed,
    ngh: /ngh="/.test(html),
    jsaction: /jsaction="/.test(html),
  };
}

const initScript = `
  window.__frames = []; window.__marks = []; window.__dom = []; window.__linkEv = [];
  window.__mark = (l) => window.__marks.push({ l, t: performance.now() });
  const tick = () => {
    const un = [];
    for (const el of document.querySelectorAll('[data-t^="card"]')) {
      if (getComputedStyle(el).paddingTop === '0px') un.push(el.getAttribute('data-t'));
    }
    window.__frames.push({ t: performance.now(), un });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  new MutationObserver((muts) => {
    const t = performance.now();
    for (const m of muts) {
      for (const [type, list] of [['add', m.addedNodes], ['remove', m.removedNodes]]) {
        for (const n of list) {
          if (n.nodeType !== 1) continue;
          if (n.nodeName === 'LINK' && n.hasAttribute('data-ngx-yeti-styles')) window.__linkEv.push({ t, type, item: n.getAttribute('data-ngx-yeti-styles') });
          for (const e of [n, ...n.querySelectorAll('[data-t]')]) if (e.hasAttribute && e.hasAttribute('data-t')) window.__dom.push({ t, type, dt: e.getAttribute('data-t') });
        }
      }
    }
  }).observe(document, { childList: true, subtree: true });
`;

const snapshotFn = () => {
  const q = (s) => [...document.querySelectorAll(s)];
  const ids = q('[id]').map((e) => e.id).filter((i) => i !== 'ng-state');
  const refs = q('[aria-labelledby],[aria-controls]').flatMap((e) =>
    ['aria-labelledby', 'aria-controls'].filter((a) => e.hasAttribute(a)).map((a) => {
      const v = e.getAttribute(a);
      return { v, n: ids.filter((i) => i === v).length };
    }),
  );
  const text = (t) => document.querySelector(`[data-t="${t}"]`)?.textContent?.trim() ?? null;
  return {
    t: performance.now(),
    dataT: q('[data-t]').map((e) => e.getAttribute('data-t')),
    links: q('head link[data-ngx-yeti-styles]').map((l) => l.getAttribute('data-ngx-yeti-styles')),
    cards: q('[data-t^="card"]').map((e) => ({ t: e.getAttribute('data-t'), id: e.id, pad: getComputedStyle(e).paddingTop, host: e.getAttribute('data-host'), labelledBy: e.querySelector('[aria-labelledby]')?.getAttribute('aria-labelledby') ?? null })),
    ids,
    dupIds: ids.filter((x, i) => ids.indexOf(x) !== i),
    unresolvedRefs: refs.filter((r) => r.n !== 1).map((r) => r.v),
    countA: text('countA'), countB: text('countB'), fallbackA: text('fallbackA'), fallbackB: text('fallbackB'),
    eh: (window.__eh ?? []).map((e) => `${e.kind}: ${e.message}`),
    zone: typeof window.Zone,
    i18nOut: text('i18nOut'),
  };
};

const collect = (page) => page.evaluate(() => ({ frames: window.__frames, marks: window.__marks, dom: window.__dom, linkEv: window.__linkEv }));

function unstyledAfter(rec, label) {
  const m = rec.marks.find((x) => x.l === label);
  const from = m ? m.t : 0;
  const next = rec.marks.filter((x) => x.t > from).map((x) => x.t).sort((a, b) => a - b)[0] ?? Infinity;
  const fr = rec.frames.filter((f) => f.t >= from && f.t < next);
  return { frames: fr.length, unstyled: fr.filter((f) => f.un.length).length, cards: [...new Set(fr.flatMap((f) => f.un))] };
}

async function newContext(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: opts.js !== false });
  if (opts.cssDelay) await ctx.route('**/yeti-css/**', async (r) => { await new Promise((s) => setTimeout(s, opts.cssDelay)); await r.continue(); });
  if (opts.jsDelay) await ctx.route(/\/(main|chunk)-?[^/]*\.js(\?|$)/, async (r) => { await new Promise((s) => setTimeout(s, opts.jsDelay)); await r.continue(); });
  if (opts.js !== false) await ctx.addInitScript(initScript);
  return ctx;
}

const settle = (page, ms = 1500) => page.waitForTimeout(ms);
const hasT = (page, t) => page.locator(`[data-t="${t}"]`).count().then((n) => n > 0);

// --- run -----------------------------------------------------------------------------------------
const out = { build, server: {}, engines: {} };
for (const c of todo) {
  const before = serverLog.length;
  const res = await fetch(base + c);
  const html = await res.text();
  await new Promise((r) => setTimeout(r, 100));
  fs.writeFileSync(path.join(outDir, `html-${build}`, c.replaceAll('/', '_') + '.html'), html);
  out.server[c] = { status: res.status, ...parseServer(html), log: serverLog.slice(before).filter((l) => !l.includes('listening')) };
}

for (const name of engines) {
  const browser = await { chromium, firefox, webkit }[name].launch();
  out.engines[name] = {};
  for (const c of todo) {
    const r = (out.engines[name][c] = {});
    const [, layout, where, phase] = c.split('/');

    // a. JavaScript off.
    {
      const ctx = await newContext(browser, { js: false });
      const page = await ctx.newPage();
      await page.goto(base + c, { waitUntil: 'load' });
      r.jsOff = await page.evaluate(snapshotFn);
      await ctx.close();
    }

    // b. JavaScript on, item CSS delayed 300 ms (routing disables the HTTP cache), then without routing.
    for (const delay of [300, 0]) {
      if (delay === 0 && !(layout === 'plain' && (phase === 'ctor' || where === 'once'))) continue;
      const ctx = await newContext(browser, { cssDelay: delay });
      const page = await ctx.newPage();
      const consoleMsgs = [];
      page.on('console', (m) => consoleMsgs.push(`${m.type()}: ${m.text()}`.slice(0, 300)));
      page.on('pageerror', (e) => consoleMsgs.push(`pageerror: ${e.message}`.slice(0, 300)));
      await page.goto(base + c, { waitUntil: 'load' });
      await settle(page, 2000);
      const s = { load: await page.evaluate(snapshotFn) };
      if (layout === 'on') {
        await page.evaluate(() => window.__mark('interact'));
        for (const t of ['countA', 'countB', 'resetA', 'resetB']) if (await hasT(page, t)) await page.locator(`[data-t="${t}"]`).click();
        await settle(page);
        s.afterInteract = await page.evaluate(snapshotFn);
      }
      if (phase === 'listener' && (await hasT(page, 'countA'))) {
        await page.evaluate(() => window.__mark('click'));
        await page.locator('[data-t="countA"]').click();
        await settle(page, 800);
        s.afterClick = await page.evaluate(snapshotFn);
      }
      if (phase === 'late') {
        await page.evaluate(() => window.__mark('arm'));
        await page.locator('[data-t="arm"]').click();
        await settle(page, 800);
        s.afterArm = await page.evaluate(snapshotFn);
      }
      for (const t of ['resetA', 'resetB']) {
        if (await hasT(page, t)) {
          await page.evaluate((l) => window.__mark(l), t);
          await page.locator(`[data-t="${t}"]`).click();
          await settle(page);
          s[`after_${t}`] = await page.evaluate(snapshotFn);
        }
      }
      const rec = await collect(page);
      s.unstyled = Object.fromEntries(['load', 'interact', 'click', 'arm', 'resetA', 'resetB'].filter((l) => l === 'load' || rec.marks.some((m) => m.l === l)).map((l) => [l, unstyledAfter(rec, l === 'load' ? '__none' : l)]));
      s.linkEv = rec.linkEv.map((e) => `${Math.round(e.t)} ${e.type} ${e.item}`);
      s.dom = rec.dom.filter((e) => /^(card|fallback)/.test(e.dt)).map((e) => `${Math.round(e.t)} ${e.type} ${e.dt}`);
      s.marks = rec.marks.map((m) => `${Math.round(m.t)} ${m.l}`);
      s.console = consoleMsgs.filter((m) => !/^(debug|verbose):/.test(m));
      r[delay ? 'jsOn300' : 'jsOn0'] = s;
      await ctx.close();
    }

    // c. Event replay: scripts delayed 2.5 s, click every count/reset button the server rendered, then hydrate.
    if (phase === 'ctor') {
      const ctx = await newContext(browser, { jsDelay: 2500 });
      const page = await ctx.newPage();
      const consoleMsgs = [];
      page.on('console', (m) => consoleMsgs.push(`${m.type()}: ${m.text()}`.slice(0, 300)));
      await page.goto(base + c, { waitUntil: 'commit' });
      await page.locator('[data-t="arm"]').waitFor({ state: 'attached' });
      const mainLoadedBefore = await page.evaluate(() => performance.getEntriesByType('resource').some((e) => /main/.test(e.name)));
      const clicked = [];
      for (const t of ['countA', 'countB', 'resetA', 'resetB']) {
        if (await hasT(page, t)) { await page.locator(`[data-t="${t}"]`).click(); clicked.push(t); }
      }
      const mainLoadedAfterClicks = await page.evaluate(() => performance.getEntriesByType('resource').some((e) => /main/.test(e.name)));
      await settle(page, 4500);
      r.replay = { clicked, mainLoadedBefore, mainLoadedAfterClicks, after: await page.evaluate(snapshotFn), console: consoleMsgs.filter((m) => /NG0|EH|hydrat/i.test(m)) };
      await ctx.close();
    }
    process.stdout.write(`${name} ${c}\n`);
  }
  await browser.close();
}

stop();
fs.writeFileSync(path.join(outDir, `probe-${build}-${engines.join("+")}${process.env.TAG ?? ""}.json`), JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(outDir, `server-${build}-${engines.join("+")}${process.env.TAG ?? ""}.log`), serverLog.join('\n'));
console.log('done');
process.exit(0);
