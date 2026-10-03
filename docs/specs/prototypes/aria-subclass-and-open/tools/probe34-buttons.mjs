// PROTOTYPE (ticket 34, point 1): composition (C) against subclassing (S) for Aria Toolbar.
// States: JS off, before hydration (main.js held), hydrated, hydrate never. Records
// attribute mutations from first paint, console output, and axe.
import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync } from 'node:fs';

const BASE = 'http://localhost:4734';
const ATTRS = ['role', 'tabindex', 'aria-disabled', 'aria-busy', 'aria-pressed', 'id'];
const engines = { chromium, firefox, webkit };
const which = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(engines);

const snapshot = () =>
  [...document.querySelectorAll('[data-testid]')].map((g) => ({
    group: g.dataset.testid,
    role: g.getAttribute('role'),
    tabindex: [...g.querySelectorAll('button')].map((b) => b.getAttribute('tabindex')).join(','),
    ariaDisabled: [...g.querySelectorAll('button')].map((b) => b.getAttribute('aria-disabled')).join(','),
    pressed: [...g.querySelectorAll('button')].map((b) => b.getAttribute('aria-pressed')).join(','),
  }));

async function axe(page) {
  const r = await new AxeBuilder({ page }).include('[data-testid]').analyze();

  return r.violations.map((v) => `${v.id}(${v.impact})x${v.nodes.length}`);
}

function observer() {
  const log = (globalThis.__log = []);
  const els = (globalThis.__els = new Map());
  const t0 = performance.now();
  const tick = () => {
    if (!log.at(-1)?.frame) {
      log.push({ frame: Math.round(performance.now() - t0) });
    }

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  new MutationObserver((ms) => {
    for (const m of ms) {
      const g = m.target.closest?.('[data-testid]');

      if (!g) {
        continue;
      }

      const who = m.target === g ? g.dataset.testid : `${g.dataset.testid}/${m.target.textContent.trim()}`;
      els.set(who, m.target);
      log.push({ t: Math.round(performance.now() - t0), who, attr: m.attributeName, old: m.oldValue });
    }
  }).observe(document, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['role', 'tabindex', 'aria-disabled', 'aria-busy', 'aria-pressed', 'id'] });
}

const out = {};

for (const name of which) {
  const browser = await engines[name].launch();
  console.error('engine', name);
  const r = (out[name] = {});

  // JS off
  {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(BASE + '/s34');
    console.error("jsoff loaded");
    r.jsOff = { snap: await page.evaluate(snapshot), axe: ['not run (axe needs page JS)'] };
    await ctx.close();
  }

  // before hydration -> hydrated
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const consoleLog = [];
    page.on('console', (m) => consoleLog.push(`${m.type()}: ${m.text().slice(0, 200)}`));
    page.on('pageerror', (e) => consoleLog.push(`pageerror: ${e.message}`));
    await page.addInitScript(observer);
    let release;
    const gate = new Promise((res) => (release = res));
    await page.route(/\/main-\w+\.js$/, async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto(BASE + '/s34', { waitUntil: 'commit' });
    await page.waitForSelector('[data-testid="s-toggle"] button:nth-child(3)', { state: 'attached' });
    await page.waitForTimeout(300);
    console.error("before");
    const before = { snap: await page.evaluate(snapshot), axe: await axe(page) };
    await page.evaluate(() => globalThis.__log.push({ mark: 'release main.js' }));
    release();
    console.error("released");
    await page.waitForFunction(() => document.querySelectorAll('[data-active="true"]').length >= 4, null, { timeout: 15000 });
    await page.waitForTimeout(500);
    console.error("hydrated");
    const hydrated = { snap: await page.evaluate(snapshot), axe: await axe(page) };
    const hydrationLog = await page.evaluate(() => {
      // value written by each record = the next record's old value for the same key, else the final value
      const log = globalThis.__log;
      for (let i = 0; i < log.length; i++) {
        const x = log[i];
        if (!x.who) { continue; }
        const next = log.slice(i + 1).find((y) => y.who === x.who && y.attr === x.attr);
        x.now = next ? next.old : globalThis.__els.get(x.who).getAttribute(x.attr);
      }
      return log;
    });

    // keys after hydration, per variant
    const keys = {};

    for (const v of ['c', 's']) {
      await page.getByTestId(`${v}-action`).getByRole('button', { name: 'Save' }).focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(150);
      const afterRight = await page.evaluate((id) => document.activeElement.textContent.trim() + ' ' + [...document.querySelector(`[data-testid="${id}"]`).querySelectorAll('button')].map((b) => b.getAttribute('tabindex')).join(','), `${v}-action`);
      await page.getByTestId(`${v}-toggle`).getByRole('button', { name: 'Italic' }).focus();
      await page.keyboard.press('Space');
      await page.waitForTimeout(150);
      const pressed = await page.evaluate((id) => [...document.querySelector(`[data-testid="${id}"]`).querySelectorAll('button')].map((b) => b.getAttribute('aria-pressed')).join(','), `${v}-toggle`);
      keys[v] = { afterRight, pressedAfterSpace: pressed };
    }

    r.prehydration = before;
    r.hydrated = hydrated;
    r.hydrationLog = hydrationLog;
    r.keys = keys;
    r.console = consoleLog;
    await ctx.close();
  }

  // hydrate never
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const consoleLog = [];
    page.on('console', (m) => consoleLog.push(`${m.type()}: ${m.text().slice(0, 200)}`));
    await page.goto(BASE + '/s34-never', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.getByTestId('s-action').getByRole('button', { name: 'Save' }).focus();
    await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(150);
    const focusAfterRight = await page.evaluate(() => document.activeElement.textContent.trim());
    r.never = { snap: await page.evaluate(snapshot), axe: await axe(page), focusAfterRight, console: consoleLog };
    await ctx.close();
  }

  await browser.close();
}

writeFileSync(`results/s34-${which.join('-')}.json`, JSON.stringify(out, null, 2));

// summary
const lines = [];

for (const [e, r] of Object.entries(out)) {
  lines.push(`##### ${e}`);

  for (const st of ['jsOff', 'prehydration', 'hydrated', 'never']) {
    lines.push(`-- ${st}  axe: ${r[st].axe.join(' ') || '0'}`);

    for (const s of r[st].snap) {
      lines.push(`   ${s.group.padEnd(9)} role=${s.role} tabindex=[${s.tabindex}] aria-disabled=[${s.ariaDisabled}] pressed=[${s.pressed}]`);
    }
  }

  lines.push(`-- never: ArrowRight from Save -> focus ${r.never.focusAfterRight}`);
  lines.push(`-- keys hydrated: ${JSON.stringify(r.keys)}`);
  // mutations during hydration: changed values and flips
  const after = r.hydrationLog.slice(r.hydrationLog.findIndex((x) => x.mark) + 1).filter((x) => x.who);
  const pre = r.hydrationLog.slice(0, r.hydrationLog.findIndex((x) => x.mark)).filter((x) => x.who);
  const flipKeys = ["role", "tabindex"];
  const trace = r.hydrationLog.slice(r.hydrationLog.findIndex((x) => x.mark) + 1).filter((x) => x.frame !== undefined || (/Save$|toggle$/.test(x.who) && flipKeys.includes(x.attr) && x.old !== x.now));
  lines.push(`-- frames vs flips: ${trace.map((x) => (x.frame !== undefined ? `[frame ${x.frame}]` : `${x.t} ${x.who} ${x.attr} ${x.old}->${x.now}`)).join(" ; ")}`);
  lines.push(`-- before release: ${pre.length} attribute records`);
  const seq = new Map();

  for (const x of after) {
    const k = `${x.who} ${x.attr}`;

    if (!seq.has(k)) {
      seq.set(k, [x.old]);
    }

    seq.get(k).push(x.now);
  }

  const moved = [...seq].filter(([, v]) => v.some((y) => y !== v[0]));
  lines.push(`-- hydration: ${after.length} records on ${seq.size} attributes; ${moved.length} took another value (sequence server -> each write):`);

  for (const [k, v] of moved) {
    if (k.endsWith(" id")) {
      continue;
    }

    lines.push(`   ${k}: ${v.join(" -> ")}`);
  }

  lines.push(`   ids rewritten: ${moved.filter(([k]) => k.endsWith(" id")).length}`);
  lines.push(`-- console (${r.console.length}): ${r.console.join(' | ') || 'none'}`);
  lines.push(`-- console never (${r.never.console.length}): ${r.never.console.join(' | ') || 'none'}`);
}

writeFileSync(`results/s34-summary-${which.join('-')}.txt`, lines.join('\n') + '\n');
console.log(lines.join('\n'));
