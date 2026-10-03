// PROTOTYPE (ticket 34, point 1): Aria's trigger on `summary` by composition (comp,
// ticket 32) and by subclassing (snull: [attr.role] null; sempty: static role="").
import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync } from 'node:fs';

const BASE = 'http://localhost:4735';
const engines = { chromium, firefox, webkit };
const GROUPS = ['comp', 'snull', 'sempty'];

const snapshot = () =>
  [...document.querySelectorAll('[data-testid]')].map((g) => ({
    group: g.dataset.testid,
    roles: [...g.querySelectorAll('summary')].map((s) => JSON.stringify(s.getAttribute('role'))).join(','),
    open: [...g.querySelectorAll('details')].map((d) => d.open).join(','),
    inert: [...g.querySelectorAll('p')].map((p) => p.hasAttribute('inert')).join(','),
  }));

function observer() {
  const log = (globalThis.__log = []);
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

      if (g && m.target.tagName === 'SUMMARY') {
        const i = [...g.querySelectorAll('summary')].indexOf(m.target);
        log.push({ t: Math.round(performance.now() - t0), who: `${g.dataset.testid}#${i}`, attr: m.attributeName, old: m.oldValue, el: m.target });
      }
    }
  }).observe(document, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['role'] });
}

async function axe(page) {
  const r = await new AxeBuilder({ page }).include('[data-testid]').analyze();

  return r.violations.map((v) => `${v.id}(${v.impact})x${v.nodes.length}`);
}

const out = {};
const lines = [];

for (const [name, type] of Object.entries(engines)) {
  const browser = await type.launch();
  const r = (out[name] = {});

  {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(BASE + '/s34-acc');
    r.jsOff = await page.evaluate(snapshot);
    await ctx.close();
  }

  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const con = [];
    page.on('console', (m) => con.push(`${m.type()}: ${m.text().slice(0, 160)}`));
    page.on('pageerror', (e) => con.push(`pageerror: ${e.message}`));
    await page.addInitScript(observer);
    let release;
    const gate = new Promise((res) => (release = res));
    await page.route(/\/main-\w+\.js$/, async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto(BASE + '/s34-acc', { waitUntil: 'commit' });
    await page.waitForSelector('#state', { state: 'attached' });
    await page.waitForTimeout(300);
    r.before = { snap: await page.evaluate(snapshot), axe: await axe(page) };
    await page.evaluate(() => globalThis.__log.push({ mark: 'release' }));
    release();
    await page.waitForFunction(() => globalThis.__stable === true);
    await page.waitForTimeout(500);
    r.trace = await page.evaluate(() =>
      globalThis.__log.map((x) => {
        if (!x.who) {
          return x;
        }

        const next = globalThis.__log.slice(globalThis.__log.indexOf(x) + 1).find((y) => y.el === x.el);

        return { t: x.t, who: x.who, old: x.old, now: next ? next.old : x.el.getAttribute('role') };
      }),
    );
    r.hydrated = { snap: await page.evaluate(snapshot), axe: await axe(page) };

    // keys: Enter on the first summary of each group, then ArrowDown
    r.keys = {};

    for (const g of GROUPS) {
      const first = page.getByTestId(g).locator('summary').first();
      await first.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(150);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(150);
      r.keys[g] = await page.evaluate(
        (id) => `open=${[...document.querySelectorAll(`[data-testid="${id}"] details`)].map((d) => d.open)} focus#=${[...document.querySelectorAll(`[data-testid="${id}"] summary`)].indexOf(document.activeElement)} state=${document.querySelector('#state').textContent}`,
        g,
      );
    }

    r.afterKeys = { snap: await page.evaluate(snapshot), axe: await axe(page) };

    if (name === 'chromium') {
      const cdp = await page.context().newCDPSession(page);
      const { nodes } = await cdp.send('Accessibility.getFullAXTree');
      r.axTree = nodes
        .filter((n) => !n.ignored && /Does Yeti|Can I use/.test(n.name?.value ?? ''))
        .map((n) => `${n.role?.value} "${n.name?.value}"`);
    }

    r.console = con;
    await ctx.close();
  }

  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(BASE + '/s34-acc');
    await page.waitForFunction(() => globalThis.__stable === true);
    await page.waitForTimeout(300);
    r.never = { snap: await page.evaluate(snapshot), axe: await axe(page) };
    await ctx.close();
  }

  await browser.close();

  lines.push(`##### ${name}`);
  const fmt = (s) => s.map((x) => `${x.group}: role=[${x.roles}] open=[${x.open}] inert=[${x.inert}]`).join(' | ');
  lines.push(`JS off:      ${fmt(r.jsOff)}`);
  lines.push(`before:      ${fmt(r.before.snap)}  axe ${r.before.axe.join(' ') || 0}`);
  lines.push(`hydrated:    ${fmt(r.hydrated.snap)}  axe ${r.hydrated.axe.join(' ') || 0}`);
  lines.push(`after keys:  ${fmt(r.afterKeys.snap)}  axe ${r.afterKeys.axe.join(' ') || 0}`);
  lines.push(`keys (Enter, ArrowDown): ${JSON.stringify(r.keys)}`);
  lines.push(`never:       ${fmt(r.never.snap.filter((x) => x.group.startsWith('never')))}  axe ${r.never.axe.join(' ') || 0}`);
  const after = r.trace.slice(r.trace.findIndex((x) => x.mark) + 1);
  lines.push(`role writes at hydration (frames shown): ${after.map((x) => (x.frame !== undefined ? `[frame ${x.frame}]` : `${x.t} ${x.who} ${x.old}->${x.now}`)).join(' ; ')}`);

  if (r.axTree) {
    lines.push(`Chromium AX tree: ${r.axTree.join(' | ')}`);
  }

  lines.push(`console: ${r.console.join(' | ')}`);
}

writeFileSync('results34/s34-acc.json', JSON.stringify(out, null, 2));
writeFileSync('results34/s34-acc-summary.txt', lines.join('\n') + '\n');
console.log(lines.join('\n'));
