// Ticket 13 probe: library-owned, counted <link> per Yeti part file, pointing at the consumer's own
// Yeti build served as an application asset under <base href="/sub/">, in an Angular 22.2 SSR app.
// Expects the SSR server on :4280 (NG_ALLOWED_HOSTS=localhost PORT=4280).
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium, firefox, webkit } from 'file:///D:/tmp/ngx-yeti-23/yeti/node_modules/playwright/index.mjs';

const app = 'http://localhost:4280/sub/';
const yetiRoot = 'D:/tmp/ngx-yeti-23/yeti'; // read-only: Yeti's full stylesheet for the reference page
const delayMs = Number(process.env.CSS_DELAY ?? 300);
let refHtml = '';
const refServer = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x').pathname;
  if (u === '/ref.html') { res.writeHead(200, { 'content-type': 'text/html' }); res.end(refHtml); return; }
  const p = path.join(yetiRoot, decodeURIComponent(u));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': 'text/css' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => refServer.listen(4281, r));

const out = { delayMs, server: {}, engines: {} };

// 1. Server HTML.
const html = await (await fetch(app)).text();
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
out.server.headOrder = [...head.matchAll(/<(style|link)\b([^>]*)>/g)]
  .filter((m) => m[1] === 'style' || /stylesheet|preload/.test(m[2]))
  .map((m) => `${m[1]}${m[2].replace(/\s+/g, ' ').replace(/ nonce="[^"]*"/, '').slice(0, 160)}`);
out.server.criticalHasCardRule = /<style>[^]*?\.card\s*\{[^]*?<\/style>/.test(head.split('<link')[0]) || /@layer yeti\.components\{[^<]*\.card/.test(head);
out.server.criticalStartsWithStatement = /<style>\s*@layer yeti\.reset/.test(head);
out.server.partLinks = [...head.matchAll(/<link[^>]*data-ngx-yeti-styles="([^"]+)"[^>]*>/g)].map((m) => m[0].replace(/ nonce="[^"]*"/, ''));
out.server.hostAttrs = [...html.matchAll(/data-ngx-yeti-part="([^"]+)"/g)].map((m) => m[1]);
const preloadHtml = await (await fetch(app + '?preload=1')).text();
out.server.preloadLinks = [...preloadHtml.matchAll(/<link rel="preload"[^>]*>/g)].map((m) => m[0]);
const cardRes = await fetch(app + 'yeti-css/components/card/card.css?v=f52d1e8b9');
out.server.cardAsset = { status: cardRes.status, cacheControl: cardRes.headers.get('cache-control'), type: cardRes.headers.get('content-type') };

// Browser helpers (serialised into the page).
const initScript = `
  window.__frames = []; window.__styleMutations = []; window.__dcl = null;
  const ids = ['eager', 'never-badge', 'hoi-badge', 'deferred-alert', 'cis', 'eager-badge'];
  const tick = () => {
    const t = performance.now();
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) window.__frames.push({ t, id, pad: getComputedStyle(el).paddingTop, op: getComputedStyle(el).opacity, ml: getComputedStyle(el).marginLeft });
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  document.addEventListener('DOMContentLoaded', () => { window.__dcl = performance.now(); });
  const mo = new MutationObserver((muts) => {
    for (const m of muts) for (const n of [...m.addedNodes, ...m.removedNodes]) {
      if (n.nodeName === 'STYLE' || (n.nodeName === 'LINK' && /stylesheet|preload/.test(n.rel))) {
        window.__styleMutations.push({ t: performance.now(), type: m.addedNodes.length ? 'add' : 'remove', node: n.nodeName.toLowerCase() + (n.getAttribute('data-ngx-yeti-styles') ? '[' + n.getAttribute('data-ngx-yeti-styles') + ']' : n.href ? ' ' + n.getAttribute('href') : ''), afterDcl: window.__dcl !== null });
      }
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
`;
const pageFns = {
  links: () => [...document.head.querySelectorAll('link[data-ngx-yeti-styles]')].map((l) => `${l.getAttribute('data-ngx-yeti-styles')}${l.media && l.media !== 'all' ? ' media=' + l.media : ''}`),
  sheets: () => [...document.styleSheets].map((s) => { const n = s.ownerNode; let first = ''; try { first = s.cssRules[0]?.cssText.slice(0, 40) ?? ''; } catch { first = '(cors)'; } return `${n.nodeName.toLowerCase()}${n.getAttribute?.('data-ngx-yeti-styles') ? '[' + n.getAttribute('data-ngx-yeti-styles') + ']' : ''}${n.href ? ' ' + n.getAttribute('href').split('/').pop() : ''}: ${first}`; }),
  pad: (id) => { const el = document.getElementById(id); return el ? getComputedStyle(el).paddingTop : null; },
  ml: (id) => { const el = document.getElementById(id); return el ? getComputedStyle(el).marginLeft : null; },
  present: (id) => !!document.getElementById(id),
  snap: (sel) => {
    for (const a of document.getAnimations()) a.cancel();
    const root = document.querySelector(sel);
    if (!root) return null;
    const read = (cs) => { const o = {}; for (let i = 0; i < cs.length; i++) { const p = cs[i]; if (!p.startsWith('--')) o[p] = cs.getPropertyValue(p); } return o; };
    return [root, ...root.querySelectorAll('*')].map((e) => ({ s: read(getComputedStyle(e)), b: read(getComputedStyle(e, '::before')), a: read(getComputedStyle(e, '::after')) }));
  },
};
const diff = (ref, s) => { if (!ref || !s) return 'missing'; let c = 0; for (let i = 0; i < ref.length; i++) for (const k of ['s', 'b', 'a']) if (Object.keys(ref[i][k]).some((p) => ref[i][k][p] !== s[i]?.[k]?.[p])) { c++; break; } return c; };
const unstyled = (frames, id, from = 0) => frames.filter((f) => f.id === id && f.t >= from && f.pad === '0px').length;
const styled = (frames, id, from = 0) => frames.filter((f) => f.id === id && f.t >= from && f.pad !== '0px').length;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

for (const [ename, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch();
  const r = {};
  const newCtx = async (opts = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
    await ctx.addInitScript(initScript);
    return ctx;
  };

  // 2. JavaScript off.
  {
    const ctx = await newCtx({ javaScriptEnabled: false });
    const pg = await ctx.newPage();
    await pg.goto(app, { waitUntil: 'load' });
    await wait(300);
    r.jsOff = { eagerPad: await pg.evaluate(pageFns.pad, 'eager'), neverBadgePad: await pg.evaluate(pageFns.pad, 'never-badge'), hoiBadgePad: await pg.evaluate(pageFns.pad, 'hoi-badge'), plainCardPad: await pg.evaluate(pageFns.pad, 'plain-card'), links: await pg.evaluate(pageFns.links) };
    await ctx.close();
  }

  // 3. Hydration, lifecycle, hold, leave, tie, client-only defer.
  const ctx = await newCtx({ reducedMotion: 'no-preference' });
  const pg = await ctx.newPage();
  await pg.route('**/yeti-css/**', async (route) => { await wait(delayMs); await route.continue(); });
  await pg.goto(app, { waitUntil: 'networkidle' });
  await wait(500);
  const frames0 = await pg.evaluate(() => window.__frames);
  r.hydration = {
    styleMutationsAfterDcl: (await pg.evaluate(() => window.__styleMutations)).filter((m) => m.afterDcl),
    eagerUnstyledFrames: unstyled(frames0, 'eager'),
    eagerStyledFrames: styled(frames0, 'eager'),
    neverBadgeUnstyledFrames: unstyled(frames0, 'never-badge'),
    links: await pg.evaluate(pageFns.links),
    sheets: await pg.evaluate(pageFns.sheets),
  };

  // Reference page: the same markup under Yeti's full stylesheet.
  const main = await pg.evaluate(() => document.querySelector('main').outerHTML);
  refHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>ref</title><link rel="stylesheet" href="/dist/yeti.css"></head><body><app-root>${main}</app-root></body></html>`;
  const rp = await ctx.newPage();
  await rp.goto('http://localhost:4281/ref.html', { waitUntil: 'load' });
  const refCard = await rp.evaluate(pageFns.snap, '#eager');
  const refBadge = await rp.evaluate(pageFns.snap, '#eager-badge');
  r.hydration.cardVsFullYeti = diff(refCard, await pg.evaluate(pageFns.snap, '#eager'));
  r.hydration.badgeVsFullYeti = diff(refBadge, await pg.evaluate(pageFns.snap, '#eager-badge'));

  // Leave: hide the card (animate.leave="leaving", 400 ms) while the L3 listener is on the page.
  const tLeave = await pg.evaluate(() => performance.now());
  await pg.click('#toggle');
  await wait(150);
  r.leave = { duringLeave: { eagerPresent: await pg.evaluate(pageFns.present, 'eager'), eagerPad: await pg.evaluate(pageFns.pad, 'eager'), eagerOpacity: await pg.evaluate(() => { const e = document.getElementById('eager'); return e ? getComputedStyle(e).opacity : null; }), links: await pg.evaluate(pageFns.links) } };
  await wait(700);
  const framesLeave = await pg.evaluate(() => window.__frames);
  r.leave.afterLeave = { eagerPresent: await pg.evaluate(pageFns.present, 'eager'), links: await pg.evaluate(pageFns.links), plainCardPad: await pg.evaluate(pageFns.pad, 'plain-card'), unstyledFramesWhileLeaving: unstyled(framesLeave, 'eager', tLeave) };
  // Reload the card.
  await pg.click('#toggle');
  await wait(100 + delayMs + 200);
  const framesReload = await pg.evaluate(() => window.__frames);
  r.reload = { links: await pg.evaluate(pageFns.links), cardVsFullYeti: diff(refCard, await pg.evaluate(pageFns.snap, '#eager')), unstyledFramesOnReload: unstyled(framesReload, 'eager', tLeave + 850), sheets: await pg.evaluate(pageFns.sheets) };

  // Hold: hide the eager badge; the hydrate-never and not-yet-hydrated badges must keep their styles.
  await pg.click('#toggle-badge');
  await wait(300);
  r.hold = { afterEagerBadgeHidden: { links: await pg.evaluate(pageFns.links), neverBadgePad: await pg.evaluate(pageFns.pad, 'never-badge'), hoiBadgePad: await pg.evaluate(pageFns.pad, 'hoi-badge') } };
  // Hydrate the hoi block by clicking it, then show the eager badge again.
  await pg.click('#hoi-badge');
  await wait(300);
  r.hold.afterHoiHydrated = { links: await pg.evaluate(pageFns.links), hoiBadgePad: await pg.evaluate(pageFns.pad, 'hoi-badge') };
  await pg.click('#toggle-badge');
  await wait(300);
  r.hold.afterEagerBadgeShown = { links: await pg.evaluate(pageFns.links), eagerBadgePad: await pg.evaluate(pageFns.pad, 'eager-badge') };

  // Tie order: stack inserted after center; the center inside the stack must keep its auto margins.
  await pg.click('#toggle-stack');
  await wait(100 + delayMs + 300);
  r.tie = { links: await pg.evaluate(pageFns.links), centerInStackMarginLeft: await pg.evaluate(pageFns.ml, 'cis'), sheetsOrder: (await pg.evaluate(pageFns.sheets)).filter((s) => s.includes('[')) };
  const refCis = await rp.evaluate(async (mainHtml) => { document.querySelector('main').outerHTML = mainHtml; await new Promise((r) => requestAnimationFrame(r)); const e = document.getElementById('cis'); return e ? getComputedStyle(e).marginLeft : null; }, await pg.evaluate(() => document.querySelector('main').outerHTML));
  r.tie.referenceMarginLeft = refCis;

  // Client-only @defer: the alert is not in the server HTML; its link is fetched on construct (delayed).
  const tDefer = await pg.evaluate(() => performance.now());
  await pg.click('#trigger');
  await pg.waitForSelector('#deferred-alert');
  await wait(delayMs + 500);
  const framesDefer = await pg.evaluate(() => window.__frames);
  r.clientDefer = { unstyledFrames: unstyled(framesDefer, 'deferred-alert', tDefer), styledFrames: styled(framesDefer, 'deferred-alert', tDefer), links: await pg.evaluate(pageFns.links) };
  await rp.close();
  await ctx.close();

  // 4. The same client-only @defer with the consumer's preload list on.
  {
    const ctx2 = await newCtx();
    const pg2 = await ctx2.newPage();
    await pg2.route('**/yeti-css/**', async (route) => { await wait(delayMs); await route.continue(); });
    await pg2.goto(app + '?preload=1', { waitUntil: 'networkidle' });
    await wait(500);
    const t = await pg2.evaluate(() => performance.now());
    await pg2.click('#trigger');
    await pg2.waitForSelector('#deferred-alert');
    await wait(delayMs + 500);
    const f = await pg2.evaluate(() => window.__frames);
    r.clientDeferWithPreload = { preloadLinks: await pg2.evaluate(() => [...document.head.querySelectorAll('link[rel=preload]')].map((l) => l.getAttribute('href').split('/').slice(-2).join('/'))), unstyledFrames: unstyled(f, 'deferred-alert', t), styledFrames: styled(f, 'deferred-alert', t) };
    await ctx2.close();
  }

  out.engines[ename] = r;
  console.log(ename, JSON.stringify(r, null, 1));
  await browser.close();
}
refServer.close();
fs.writeFileSync(`D:/tmp/ngx-yeti-13/measure/probe-${delayMs}.json`, JSON.stringify(out, null, 2));
console.log('server:', JSON.stringify(out.server, null, 1));
