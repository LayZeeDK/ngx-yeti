// PROTOTYPE (ticket 29, buttons): measures (A) role="group" and (B) Aria Toolbar against
// Yeti's own example in Chromium, Firefox, and WebKit. Writes results/<engine>.json.
// Needs the built server on BASE (default http://localhost:4529).
import { chromium, firefox, webkit } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:4529';
const engines = { chromium, firefox, webkit };
const PROPS = [
  'display', 'flex-wrap', 'align-items', 'column-gap', 'row-gap', 'margin-inline-start', 'margin-top',
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
  'background-color', 'color', 'border-top-color', 'opacity', 'cursor', 'position', 'z-index',
  'padding-top', 'padding-left', 'min-height', 'font-weight', 'font-size', 'outline-style', 'width', 'height',
];
const GROUPS = { action: ['ref-action', 'a-action', 'b-action'], toggle: ['ref-toggle', 'a-toggle', 'b-toggle'] };

// In-page: computed styles and the Yeti selectors (containing ".button") each element matches.
function readGroup([testid, props]) {
  const g = document.querySelector(`[data-testid="${testid}"]`);

  if (!g) {
    return null;
  }

  const sels = new Set();
  const walk = (rules) => {
    for (const r of rules) {
      if (r.selectorText && r.selectorText.includes('.button')) {
        sels.add(r.selectorText);
      }

      if (r.cssRules) {
        walk(r.cssRules);
      }
    }
  };

  for (const s of document.styleSheets) {
    try {
      walk(s.cssRules);
    } catch {
      // cross-origin sheet
    }
  }

  const read = (el) => {
    const cs = getComputedStyle(el);
    const style = Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)]));
    const matched = [...sels].filter((s) => {
      try {
        return el.matches(s);
      } catch {
        return false;
      }
    });
    const attrs = Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]));

    return { text: el.textContent.trim(), attrs, style, matched };
  };

  return { group: read(g), items: [...g.children].map(read) };
}

const label = () => {
  const el = document.activeElement;

  if (!el || el === document.body) {
    return '(body)';
  }

  const g = el.closest('[data-testid]');

  return `${g ? g.dataset.testid : '?'}:${el.textContent.trim()}`;
};

async function tabWalk(page, n = 14) {
  const seq = [];

  for (let i = 0; i < n; i++) {
    await page.keyboard.press('Tab');
    seq.push(await page.evaluate(label));
  }

  return seq;
}

async function focusFirstIn(page, testid) {
  // Start sequential navigation just before the group: focus its heading's section start.
  await page.evaluate((t) => {
    document.activeElement?.blur?.();
    const g = document.querySelector(`[data-testid="${t}"]`);
    const s = document.createElement('span');
    s.tabIndex = 0;
    s.id = 'probe-start';
    s.textContent = '';
    g.before(s);
    s.focus();
  }, testid);
  await page.keyboard.press('Tab');
  await page.evaluate(() => document.getElementById('probe-start')?.remove());
}

async function keys(page, list) {
  const out = [];

  for (const k of list) {
    await page.keyboard.press(k);
    out.push(`${k} -> ${await page.evaluate(label)}`);
  }

  return out;
}

const pressedOf = async (page, testid) =>
  (await page.waitForTimeout(300), page.$$eval(`[data-testid="${testid}"] > *`, (els) => els.map((e) => `${e.textContent.trim()}=${e.getAttribute('aria-pressed')}`)));
const tabindexOf = async (page, testid) =>
  (await page.waitForTimeout(300), page.$$eval(`[data-testid="${testid}"], [data-testid="${testid}"] > *`, (els) =>
    els.map((e) => `${e.textContent.trim().split('\n')[0] || e.dataset.testid}:${e.getAttribute('tabindex')}`),
  ));
const hydrated = (page) => page.waitForSelector('[data-testid="b-action"] > [tabindex="0"]', { timeout: 15000 });
// Let the stylesheet swap and Yeti's color transitions finish before reading styles.
const settled = async (page) => {
  await page.waitForTimeout(600);
  await page.evaluate(() => Promise.race([Promise.all(document.getAnimations().map((a) => a.finished)), new Promise((r) => setTimeout(r, 2000))]));
};

async function run(name) {
  const browser = await engines[name].launch();
  const version = browser.version();
  const R = { engine: name, version };
  let ref;
  let diff;

  // 1. Styles: Yeti's example page versus the app's (A) and (B), hydrated.
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/ref.html`);
    await settled(page);
    ref = {};

    for (const id of ['ref-action', 'ref-toggle']) {
      ref[id] = await page.evaluate(readGroup, [id, PROPS]);
    }

    await page.hover('[data-testid="ref-action"] > :nth-child(3)');
    await settled(page);
    ref.hoverExport = await page.$eval('[data-testid="ref-action"] > :nth-child(3)', (e) => getComputedStyle(e).backgroundColor);
    await page.goto(`${BASE}/`);
    await hydrated(page);
    await settled(page);
    const app = {};

    for (const id of ['a-action', 'a-toggle', 'b-action', 'b-toggle', 'b-probe']) {
      app[id] = await page.evaluate(readGroup, [id, PROPS]);
    }

    app.hoverExport = {};

    for (const id of ['a-action', 'b-action']) {
      await page.hover(`[data-testid="${id}"] > :nth-child(3)`);
      await settled(page);
      app.hoverExport[id] = await page.$eval(`[data-testid="${id}"] > :nth-child(3)`, (e) => getComputedStyle(e).backgroundColor);
    }

    await page.mouse.move(0, 0);
    // Keyboard focus on the second toggle: (A) by Tab, (B) by ArrowRight. The affix lift rule.
    const lift = {};
    await focusFirstIn(page, 'a-toggle');
    await page.keyboard.press('Tab');
    lift.a = await page.evaluate(() => {
      const e = document.activeElement;
      const cs = getComputedStyle(e);

      return { el: e.textContent.trim(), fv: e.matches(':focus-visible'), position: cs.position, z: cs.zIndex, outline: cs.outlineStyle };
    });
    await focusFirstIn(page, 'b-toggle');
    await page.keyboard.press('ArrowRight');
    lift.b = await page.evaluate(() => {
      const e = document.activeElement;
      const cs = getComputedStyle(e);

      return { el: e.textContent.trim(), fv: e.matches(':focus-visible'), position: cs.position, z: cs.zIndex, outline: cs.outlineStyle };
    });

    // Style diffs against the reference, by element position.
    diff = (a, b) => {
      const d = [];

      if (!a || !b) {
        return ['missing'];
      }

      const cmp = (x, y, where) => {
        for (const p of PROPS) {
          if (p === 'width' || p === 'height') {
            continue;
          }

          if (x.style[p] !== y.style[p]) {
            d.push(`${where} ${p}: ref ${x.style[p]} vs ${y.style[p]}`);
          }
        }

        const lost = x.matched.filter((s) => !y.matched.includes(s));
        const gained = y.matched.filter((s) => !x.matched.includes(s));

        if (lost.length) {
          d.push(`${where} no longer matches: ${lost.join(' | ')}`);
        }

        if (gained.length) {
          d.push(`${where} newly matches: ${gained.join(' | ')}`);
        }
      };
      cmp(a.group, b.group, 'group');
      a.items.forEach((it, i) => cmp(it, b.items[i], `item ${i + 1} (${it.text})`));

      return d;
    };
    R.styles = {
      actionA: diff(ref['ref-action'], app['a-action']),
      actionB: diff(ref['ref-action'], app['b-action']),
      toggleA: diff(ref['ref-toggle'], app['a-toggle']),
      toggleB: diff(ref['ref-toggle'], app['b-toggle']),
      hoverExport: { ref: ref.hoverExport, ...app.hoverExport },
      lift,
      attrs: {
        b: Object.fromEntries(['b-action', 'b-toggle', 'b-probe'].map((id) => [id, { group: app[id].group.attrs, items: app[id].items.map((i) => i.attrs) }])),
      },
      sizes: Object.fromEntries(
        [['ref-action', ref['ref-action']], ['ref-toggle', ref['ref-toggle']], ...['a-action', 'b-action', 'a-toggle', 'b-toggle'].map((k) => [k, app[k]])].map(
          ([k, v]) => [k, v.items.map((i) => `${i.style.width}x${i.style.height}`)],
        ),
      ),
    };
    await ctx.close();
  }

  // 4. Accessibility, hydrated: axe, aria snapshot, keyboard walk.
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`);
    await hydrated(page);
    await settled(page);
    const axe = {};

    for (const v of ['A', 'B']) {
      const res = await new AxeBuilder({ page }).include(`[data-variant-id="${v}"]`).analyze();
      axe[v] = { violations: res.violations.map((x) => `${x.id} (${x.impact}): ${x.nodes.map((n) => n.html.slice(0, 120) + ' :: ' + (n.failureSummary || '').split(String.fromCharCode(10)).join(' ')).join(' ;; ')}`), passes: res.passes.length };
    }

    const resRef = await (async () => {
      const p2 = await ctx.newPage();
      await p2.goto(`${BASE}/ref.html`);
      const r = await new AxeBuilder({ page: p2 }).include('main').analyze();
      await p2.close();

      return r.violations.map((x) => `${x.id} (${x.impact}): ${x.nodes.length} nodes`);
    })();
    axe.ref = resRef;
    const tree = {};

    for (const id of ['a-action', 'a-toggle', 'b-action', 'b-toggle', 'b-probe']) {
      tree[id] = await page.locator(`[data-testid="${id}"]`).ariaSnapshot();
    }

    await page.evaluate(() => document.activeElement?.blur?.());
    const tabOrder = await tabWalk(page, 12);
    await focusFirstIn(page, 'b-action');
    const kbB = [`enter -> ${await page.evaluate(label)}`, ...(await keys(page, ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowLeft', 'Home', 'End', 'ArrowDown', 'ArrowUp', 'Tab']))];
    // Leave and come back: roving memory.
    const kbBreturn = await keys(page, ['ArrowRight', 'Shift+Tab', 'Tab']);
    await focusFirstIn(page, 'b-toggle');
    await page.keyboard.press('ArrowRight');
    const before = await pressedOf(page, 'b-toggle');
    await page.keyboard.press('Space');
    const afterSpace = await pressedOf(page, 'b-toggle');
    await page.keyboard.press('Enter');
    const afterEnter = await pressedOf(page, 'b-toggle');
    await focusFirstIn(page, 'a-toggle');
    const kbA = [`enter -> ${await page.evaluate(label)}`, ...(await keys(page, ['ArrowRight', 'Tab']))];
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Space');
    const aSpace = await pressedOf(page, 'a-toggle');
    // Mouse click on a non-active toolbar item moves the roving tabindex.
    await page.click('[data-testid="b-action"] > :nth-child(2)');
    const afterClick = await tabindexOf(page, 'b-action');
    R.a11y = { axe, tree, tabOrder, kbB, kbBreturn, toggleB: { before, afterSpace, afterEnter }, kbA, aSpace, afterClick };
    await ctx.close();
  }

  // 3. Rendering modes.
  {
    // JavaScript off.
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(800);
    const off = { tabindex: {} };

    for (const id of ['a-action', 'b-action', 'b-toggle']) {
      off.tabindex[id] = await tabindexOf(page, id);
    }

    // With JS off, page.evaluate still runs (Playwright's own world), so label() works.
    off.styles = {
      action: { A: diff(ref['ref-action'], await page.evaluate(readGroup, ['a-action', PROPS])), B: diff(ref['ref-action'], await page.evaluate(readGroup, ['b-action', PROPS])) },
      toggle: { A: diff(ref['ref-toggle'], await page.evaluate(readGroup, ['a-toggle', PROPS])), B: diff(ref['ref-toggle'], await page.evaluate(readGroup, ['b-toggle', PROPS])) },
    };
    off.tabOrder = await tabWalk(page, 10);
    await page.click('[data-testid="b-toggle"] > :nth-child(2)');
    await page.click('[data-testid="a-toggle"] > :nth-child(2)');
    off.pressedAfterClick = { a: await pressedOf(page, 'a-toggle'), b: await pressedOf(page, 'b-toggle') };

    R.jsOff = off;
    await ctx.close();
  }
  {
    // Before hydration: hold main-*.js back, act, then release.
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    let release;
    const gate = new Promise((r) => (release = r));
    await page.route(/main-.*\.js$/, async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto(`${BASE}/`, { waitUntil: 'commit' });
    await page.waitForSelector('[data-testid="b-probe"] > :nth-child(3)');
    const pre = {};
    await settled(page);
    pre.styles = {
      action: { A: diff(ref['ref-action'], await page.evaluate(readGroup, ['a-action', PROPS])), B: diff(ref['ref-action'], await page.evaluate(readGroup, ['b-action', PROPS])) },
      toggle: { A: diff(ref['ref-toggle'], await page.evaluate(readGroup, ['a-toggle', PROPS])), B: diff(ref['ref-toggle'], await page.evaluate(readGroup, ['b-toggle', PROPS])) },
    };
    pre.tabOrder = await tabWalk(page, 8);
    await page.click('[data-testid="a-toggle"] > :nth-child(2)');
    await page.click('[data-testid="b-toggle"] > :nth-child(3)');
    pre.pressedBefore = { a: await pressedOf(page, 'a-toggle'), b: await pressedOf(page, 'b-toggle') };
    release();
    await hydrated(page);
    await page.waitForTimeout(500);
    pre.pressedAfterHydration = { a: await pressedOf(page, 'a-toggle'), b: await pressedOf(page, 'b-toggle') };
    pre.tabindexAfter = await tabindexOf(page, 'b-toggle');
    R.beforeHydration = pre;
    await ctx.close();
  }
  {
    // @defer (hydrate never).
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/never`);
    await page.waitForFunction(() => document.querySelector('app-root')?.hasAttribute('ng-version'));
    await page.waitForTimeout(1500);
    const nev = {};
    await settled(page);
    nev.styles = {
      action: { A: diff(ref['ref-action'], await page.evaluate(readGroup, ['a-action', PROPS])), B: diff(ref['ref-action'], await page.evaluate(readGroup, ['b-action', PROPS])) },
      toggle: { A: diff(ref['ref-toggle'], await page.evaluate(readGroup, ['a-toggle', PROPS])), B: diff(ref['ref-toggle'], await page.evaluate(readGroup, ['b-toggle', PROPS])) },
    };
    nev.tabindex = { b: await tabindexOf(page, 'b-action') };
    nev.tabOrder = await tabWalk(page, 8);
    await focusFirstIn(page, 'b-action');
    nev.kbB = await keys(page, ['ArrowRight']);
    await page.click('[data-testid="a-toggle"] > :nth-child(2)');
    await page.click('[data-testid="b-toggle"] > :nth-child(2)');
    nev.pressedAfterClick = { a: await pressedOf(page, 'a-toggle'), b: await pressedOf(page, 'b-toggle') };
    R.hydrateNever = nev;
    await ctx.close();
  }
  await browser.close();

  return R;
}

mkdirSync('results', { recursive: true });

for (const name of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(engines)) {
  const r = await run(name);
  writeFileSync(`results/${name}.json`, JSON.stringify(r, null, 2));
  console.log(name, r.version, 'done');
}
