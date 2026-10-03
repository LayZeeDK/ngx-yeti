// PROTOTYPE (ticket 30, point 1): the package's directives hosting Aria Toolbar and Tabs,
// measured in four states (JavaScript off, before hydration, hydrate never, hydrated) in
// Chromium, Firefox, WebKit. Writes results/r30-<engine>.json.
import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:4437';
const engines = { chromium, firefox, webkit };
const ROUTES = { buttons: '/r30-buttons', tabs: '/r30-tabs', carousel: '/r30-carousel' };
const WATCH = ['tabindex', 'inert', 'hidden', 'role', 'aria-disabled', 'aria-selected', 'aria-pressed'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// In page: every watched item's attributes.
const snap = () => {
  const sel = '[data-testid] , [data-testid] [role="tab"], [data-testid] [role="tabpanel"], [data-testid] .button, [data-testid] [role="tablist"]';
  const name = (e) => e.id || e.getAttribute('data-testid') || e.textContent.trim().slice(0, 12);
  return [...document.querySelectorAll(sel)].map((e) => {
    const a = {};
    for (const n of ['role', 'tabindex', 'inert', 'hidden', 'aria-disabled', 'aria-selected', 'aria-pressed', 'aria-busy']) {
      if (e.hasAttribute(n)) a[n] = e.getAttribute(n);
    }
    return `${e.tagName.toLowerCase()}:${name(e)} ${JSON.stringify(a)}`;
  });
};

const describe = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return 'body';
  const role = el.getAttribute('role') ?? el.tagName.toLowerCase();
  const name = el.id || el.getAttribute('aria-label') || el.textContent.trim().slice(0, 14);
  return `${role}:${name}`;
};

async function tabWalk(page, n) {
  await page.evaluate(() => {
    document.activeElement?.blur?.();
    window.scrollTo(0, 0);
    const h = document.querySelector('h1');
    h.tabIndex = -1;
    h.focus();
  });
  const seq = [];
  for (let i = 0; i < n; i++) {
    await page.keyboard.press('Tab');
    seq.push(await page.evaluate(describe));
  }
  return seq;
}

async function keys(page, list) {
  const out = [];
  for (const k of list) {
    await page.evaluate(() => (window.__mut = []));
    await page.keyboard.press(k);
    await sleep(120);
    // Within one key press, a value that comes back is two bindings fighting.
    const c = chains(await page.evaluate(() => window.__mut ?? []));
    const flips = Object.entries(c.changes).filter(([, v]) => v.includes('[FLIP]')).map(([a, v]) => `${a}: ${v}`);
    out.push(`${k}->${await page.evaluate(describe)}${flips.length ? '  FIGHT ' + flips.join('; ') : ''}`);
  }
  return out;
}

const axe = async (page) =>
  (await new AxeBuilder({ page }).include('[data-testid]').analyze()).violations.map(
    (v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  );

const observer = () => {
  window.__mut = [];
  const t0 = performance.now();
  const mo = new MutationObserver((recs) => {
    for (const r of recs) {
      const e = r.target;
      window.__mut.push({
        t: Math.round(performance.now() - t0),
        el: e.id || e.getAttribute?.('data-testid') || e.textContent?.trim().slice(0, 12),
        attr: r.attributeName,
        old: r.oldValue,
        now: e.getAttribute(r.attributeName),
      });
    }
  });
  const start = () =>
    mo.observe(document.documentElement, {
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['tabindex', 'inert', 'hidden', 'role', 'aria-disabled', 'aria-selected', 'aria-pressed'],
    });
  if (document.documentElement) start();
  else document.addEventListener('readystatechange', start, { once: true });
};

// Summarise mutation records per element+attribute: the value chain, and whether a value came back (a flip).
function chains(muts) {
  const m = new Map();
  for (const r of muts) {
    const k = `${r.el}.${r.attr}`;
    if (!m.has(k)) m.set(k, [r.old]);
    const c = m.get(k);
    if (c[c.length - 1] !== r.now) c.push(r.now);
  }
  const out = {};
  for (const [k, c] of m) {
    if (c.length > 1) {
      const flip = c.some((v, i) => c.indexOf(v) !== i);
      out[k] = `${c.map((v) => (v === null ? '∅' : v)).join(' -> ')}${flip ? '  [FLIP]' : ''}`;
    }
  }
  return { records: muts.length, noop: muts.filter((r) => r.old === r.now).length, changes: out };
}

const STYLE = ['display', 'flex-direction', 'gap', 'color', 'background-color', 'border-bottom-color', 'border-bottom-width', 'padding-top', 'padding-left', 'font-weight', 'cursor', 'opacity', 'height', 'visibility'];
const styleOf = ([root, STYLE]) => {
  const r = document.querySelector(root);
  const els = [r, ...r.querySelectorAll(':scope > *, :scope > * > *')].filter((e) => !['P', 'SPAN', 'H3', 'LI'].includes(e.tagName) || e.tagName === 'LI');
  return els.map((e) => {
    const cs = getComputedStyle(e);
    return `${e.tagName.toLowerCase()}${e.getAttribute('role') ? '[' + e.getAttribute('role') + ']' : ''}: ${STYLE.map((p) => cs.getPropertyValue(p)).join(' | ')}`;
  });
};

async function run(name) {
  const browser = await engines[name].launch();
  const R = { engine: name, version: browser.version() };
  const steps = { buttons: 8, tabs: 6, carousel: 6 };

  // 1. JavaScript off.
  {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    R.jsOff = {};
    for (const [k, path] of Object.entries(ROUTES)) {
      await page.goto(BASE + path);
      R.jsOff[k] = { attrs: await page.evaluate(snap), tab: await tabWalk(page, steps[k]) };
    }
    await page.goto(BASE + '/ref-tabs-noscript.html');
    R.jsOff.yetiTabsNoscript = { tab: await tabWalk(page, 5), style: await page.evaluate(styleOf, ['.tabs', STYLE]) };
    await page.goto(BASE + '/r30-tabs');
    R.jsOff.tabsStyle = await page.evaluate(styleOf, ['.tabs', STYLE]);
    await ctx.close();
  }

  // 2. Before hydration: main.js held back; then released, and the hand-over recorded.
  R.before = {};
  for (const [k, path] of Object.entries(ROUTES)) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.addInitScript(observer);
    const msgs = [];
    page.on('console', (m) => msgs.push(`${m.type()}: ${m.text().slice(0, 200)}`));
    page.on('pageerror', (e) => msgs.push(`pageerror: ${e.message}`));
    let release;
    const gate = new Promise((r) => (release = r));
    await page.route(/\/main(-[A-Z0-9]+)?\.js$/, async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto(BASE + path, { waitUntil: 'commit' });
    await page.waitForSelector('[data-testid]');
    await sleep(500);
    const b = { attrs: await page.evaluate(snap), tab: await tabWalk(page, steps[k]), axe: await axe(page) };
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.evaluate(() => (window.__mut = []));
    release();
    await page.waitForSelector('[data-active="true"]', { timeout: 20000 });
    await sleep(1500);
    b.handover = chains(await page.evaluate(() => window.__mut));
    b.after = await page.evaluate(snap);
    b.console = msgs.filter((m) => !m.startsWith('debug'));
    R.before[k] = b;
    await ctx.close();
  }

  // 3. hydrate never.
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const msgs = [];
    page.on('console', (m) => msgs.push(`${m.type()}: ${m.text().slice(0, 200)}`));
    page.on('pageerror', (e) => msgs.push(`pageerror: ${e.message}`));
    await page.goto(BASE + '/r30-never');
    await sleep(3000);
    R.never = {
      attrs: await page.evaluate(snap),
      activeTrue: await page.locator('[data-active="true"]').count(),
      tab: await tabWalk(page, 16),
      console: msgs,
    };
    // Arrow keys on the first toolbar's stop, and on the selected tab.
    await page.getByRole('button', { name: 'Save' }).focus();
    R.never.toolbarKeys = await keys(page, ['ArrowRight']);
    await page.getByRole('tab', { name: 'Profile' }).focus();
    R.never.tabKeys = await keys(page, ['ArrowRight']);
    R.never.axe = await axe(page);
    await ctx.close();
  }

  // 4. Hydrated, from first paint: mutation chains, console, keyboard, axe, styles.
  R.live = {};
  for (const [k, path] of Object.entries(ROUTES)) {
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page = await ctx.newPage();
    await page.addInitScript(observer);
    const msgs = [];
    page.on('console', (m) => msgs.push(`${m.type()}: ${m.text().slice(0, 200)}`));
    page.on('pageerror', (e) => msgs.push(`pageerror: ${e.message}`));
    await page.goto(BASE + path);
    await page.waitForSelector('[data-active="true"]', { timeout: 20000 });
    await sleep(1500);
    const L = { load: chains(await page.evaluate(() => window.__mut)), attrs: await page.evaluate(snap) };
    if (k === 'buttons') {
      L.style = await page.evaluate(styleOf, ['[data-testid="action"]', STYLE]);
      L.styleToggle = await page.evaluate(styleOf, ['[data-testid="toggle"]', STYLE]);
    }
    if (k === 'tabs') {
      L.style = await page.evaluate(styleOf, ['.tabs', STYLE]);
    }
    L.tab = await tabWalk(page, steps[k]);
    L.axe = await axe(page);
    await page.evaluate(() => (window.__mut = []));
    if (k === 'buttons') {
      await page.getByRole('button', { name: 'Bold' }).focus();
      L.keys = await keys(page, ['ArrowRight', 'ArrowRight', 'ArrowRight', 'End', 'Home', 'ArrowLeft', 'Space', 'Tab', 'Shift+Tab']);
      await page.getByRole('button', { name: 'Save' }).focus();
      L.keysBusy = await keys(page, ['ArrowRight', 'ArrowRight']);
      L.busyFocusable = await page.evaluate(() => document.activeElement.getAttribute('aria-disabled'));
      // Shift+Tab right after an arrow key, the race ticket 29 saw.
      L.race = [];
      for (let i = 0; i < 4; i++) {
        await page.getByRole('button', { name: 'Bold' }).focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Shift+Tab');
        L.race.push(await page.evaluate(describe));
        await page.keyboard.press('Home');
      }
    } else if (k === 'tabs') {
      await page.getByRole('tab', { name: 'Profile' }).focus();
      L.keys = await keys(page, ['ArrowRight', 'Tab', 'Shift+Tab', 'Home', 'End', 'ArrowRight']);
      L.panels = await page.$$eval('[role="tabpanel"]', (ps) => ps.map((p) => `${p.id} hidden=${p.hidden} inert=${p.inert} visible=${p.checkVisibility()}`));
    } else {
      L.historyStart = await page.evaluate(() => history.length);
      const tabs = page.getByRole('tab');
      await tabs.nth(0).focus();
      L.keys = await keys(page, ['ArrowRight', 'End', 'Home']);
      await page.keyboard.press('ArrowRight');
      await sleep(800);
      L.afterArrow = await page.evaluate(() => {
        const t = document.querySelector('[data-track]');
        const sl = [...t.children];
        const tr = t.getBoundingClientRect();
        return { inView: sl.findIndex((s) => Math.abs(s.getBoundingClientRect().left - tr.left) < 2), inert: sl.map((s) => s.inert), history: history.length };
      });
      await tabs.nth(2).click();
      await sleep(800);
      L.afterClick = await page.evaluate(() => ({ history: history.length, hash: location.hash, dotTabindex: [...document.querySelectorAll('[role="tab"]')].map((d) => d.getAttribute('tabindex')) }));
      // Swipe: scroll the track to slide 1, then read selection and the tab stop.
      await page.evaluate(() => document.querySelector('[data-track]').scrollTo({ left: 0, behavior: 'instant' }));
      await sleep(1000);
      L.afterSwipe = await page.evaluate(() => ({
        selected: [...document.querySelectorAll('[role="tab"]')].map((d) => d.getAttribute('aria-selected')),
        dotTabindex: [...document.querySelectorAll('[role="tab"]')].map((d) => d.getAttribute('tabindex')),
        inert: [...document.querySelectorAll('[data-slide]')].map((s) => s.inert),
      }));
    }
    L.interaction = chains(await page.evaluate(() => window.__mut));
    L.console = msgs.filter((m) => !m.startsWith('debug'));
    if (k === 'carousel') {
      // Same keys with reduced motion (instant scroll): is the in-key flip the smooth scroll meeting the glue's observer?
      const c2 = await browser.newContext({ viewport: { width: 1024, height: 768 }, reducedMotion: 'reduce' });
      const p2 = await c2.newPage();
      await p2.addInitScript(observer);
      await p2.goto(BASE + path);
      await p2.waitForSelector('[data-active="true"]', { timeout: 20000 });
      await sleep(1000);
      await p2.getByRole('tab').nth(0).focus();
      L.keysReduced = await keys(p2, ['ArrowRight', 'End', 'Home', 'ArrowRight']);
      await c2.close();
    }
    R.live[k] = L;
    await ctx.close();
  }

  // References: Yeti's tabs example with tabs.js, and the buttons example.
  {
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/ref-tabs-script.html');
    await sleep(800);
    R.ref = { tabsScript: { attrs: await page.evaluate(() => [...document.querySelectorAll('[role]')].map((e) => `${e.id || e.getAttribute('role')} tabindex=${e.getAttribute('tabindex')} hidden=${e.hidden}`)), style: await page.evaluate(styleOf, ['.tabs', STYLE]), tab: await tabWalk(page, 4) } };
    await page.goto(BASE + '/ref-buttons.html');
    await sleep(800);
    R.ref.buttons = await page.evaluate(styleOf, ['[data-testid="ref-action"]', STYLE]);
    R.ref.buttonsToggle = await page.evaluate(styleOf, ['[data-testid="ref-toggle"]', STYLE]);
    await ctx.close();
  }

  await browser.close();
  writeFileSync(`results/r30-${name}.json`, JSON.stringify(R, null, 1));
  console.log('done', name, R.version);
}

for (const e of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(engines)) {
  await run(e);
}
