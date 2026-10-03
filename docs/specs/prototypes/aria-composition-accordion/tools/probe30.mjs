// PROTOTYPE (ticket 30, accordion; from ticket 29's probe): measures ref, (A), (C), (C-noinert), (D), (D-role) in three engines.
// Expects the built SSR server on BASE (PORT=4791 NG_ALLOWED_HOSTS=localhost).
import { chromium, firefox, webkit } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = 'http://localhost:4893';
const PAGES = { ref: '/', a: '/a', c: '/c', cn: '/c-noinert', d: '/d', dr: '/d-role' };

// Every selector of Yeti's accordion.css, plus the base layer's details rules
// (base/media.css) that draw the summary. Pseudo-classes are stripped to test
// the structure only.
const SELECTORS = [
  '.accordion',
  '.accordion > details + details',
  '.accordion > details > summary',
  '.accordion > details > summary:hover',
  '.accordion > details > summary:focus-visible',
  '.accordion > details[open] > summary',
  '.accordion > details > :not(summary)',
  '.accordion > details > :not(summary):last-child',
  'details > summary',
  'details > summary::after',
  'details[open] > summary::after',
  'details',
  'details[open]',
  'details::details-content',
];

const PROPS = [
  'display', 'padding-top', 'padding-left', 'margin-top', 'margin-left', 'margin-bottom',
  'border-top-width', 'border-top-style', 'border-bottom-width', 'border-bottom-style',
  'border-top-left-radius', 'background-color', 'font-weight', 'font-size', 'cursor',
  'list-style-type', 'outline-offset', 'grid-template-rows', 'overflow-x', 'width',
];

/** Runs in the page: state of each item in a root (#live or #never). */
function itemsState(rootSel) {
  const acc = document.querySelector(rootSel + ' .accordion');
  if (!acc) {
    return null;
  }

  return [...acc.children].map((item) => {
    const trigger = item.querySelector('summary, button');
    const p = item.querySelector('p');

    return {
      tag: item.tagName.toLowerCase(),
      open: item.tagName === 'DETAILS' ? item.open : null,
      ariaExpanded: trigger?.getAttribute('aria-expanded') ?? null,
      contentInDom: !!p,
      inert: !!p?.closest('[inert]'),
      contentVisible:
        !!p && p.checkVisibility() && p.getBoundingClientRect().height > 0 && !p.closest('[inert]'),
    };
  });
}

/** Runs in the page: structural matches per selector inside #live. */
function selectorMatches(sels) {
  const out = {};
  for (const s of sels) {
    const structural = s.replace(/::[\w-]+(\(.*?\))?/g, '').replace(/:(hover|focus-visible)/g, '');
    const parts = structural.split(',').map((x) => '#live ' + x.trim());
    out[s] = document.querySelectorAll(parts.join(',')).length;
  }

  return out;
}

/** Runs in the page: computed styles of the parts. */
function styles(props) {
  const acc = document.querySelector('#live .accordion');
  const item = acc.children[0];
  const item2 = acc.children[1];
  const trigger = item.querySelector('summary, button');
  const heading = item.querySelector('h3, [role=heading]');
  const panel = item.querySelector('[ngaccordionpanel]') ?? item.querySelector('p');
  const p = item.querySelector('p');
  const pick = (el, pseudo) => {
    if (!el) {
      return null;
    }

    const cs = getComputedStyle(el, pseudo);
    const o = {};
    for (const k of props) {
      o[k] = cs.getPropertyValue(k);
    }

    if (pseudo) {
      o.content = cs.content;
      o.rotate = cs.rotate;
    }

    return o;
  };

  return {
    accordion: pick(acc),
    item: pick(item),
    item2: pick(item2),
    heading: pick(heading),
    trigger: pick(trigger),
    triggerAfter: pick(trigger, '::after'),
    panel: pick(panel),
    content: pick(p),
    triggerHeight: trigger?.getBoundingClientRect().height ?? null,
    accordionHeight: acc.getBoundingClientRect().height,
  };
}

const live = (page) => page.evaluate(itemsState, '#live');
const never = (page) => page.evaluate(itemsState, '#never');
const trig = (page, root, i) => page.locator(`${root} .accordion > *`).nth(i).locator('summary, button').first();
const stable = (page) => page.waitForFunction(() => globalThis.__stable === true, null, { timeout: 15000 });
const focusedText = (page) => page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 30) ?? null);

async function hydrated(browser, path) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errors.push(m.type() + ': ' + m.text()));
  await page.goto(BASE + path);
  await stable(page);
  const r = { errors };
  r.initial = await live(page);
  r.stylesClosed = await page.evaluate(styles, PROPS);
  r.aria = await page.locator('#live').ariaSnapshot();
  r.axeClosed = (await new AxeBuilder({ page }).include('#live').analyze()).violations.map((v) => `${v.id} (${v.nodes.length})`);

  // Pointer: open the first, then the second (exclusivity), then close the second.
  await trig(page, '#live', 0).click();
  await page.waitForTimeout(400);
  r.click1 = await live(page);
  r.stylesOpen = await page.evaluate(styles, PROPS);
  r.selectorsOpen = await page.evaluate(selectorMatches, SELECTORS);
  r.ariaOpen = await page.locator('#live').ariaSnapshot();
  r.axeOpen = (await new AxeBuilder({ page }).include('#live').analyze()).violations.map((v) => `${v.id} (${v.nodes.length})`);
  r.stateOutputAfterClick1 = await page.locator('#state').textContent().catch(() => null);
  await trig(page, '#live', 1).click();
  await page.waitForTimeout(400);
  r.click2 = await live(page);
  await trig(page, '#live', 1).click();
  await page.waitForTimeout(400);
  r.click2again = await live(page);

  // Keyboard, APG accordion table.
  const kb = {};
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Tab');
  kb.tab1 = await focusedText(page);
  await page.keyboard.press('Tab');
  kb.tab2 = await focusedText(page);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  kb.enter = await live(page);
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
  kb.space = await live(page);
  await page.keyboard.press('ArrowDown');
  kb.arrowDown = await focusedText(page);
  await page.keyboard.press('ArrowUp');
  kb.arrowUp = await focusedText(page);
  await page.keyboard.press('End');
  kb.end = await focusedText(page);
  await page.keyboard.press('Home');
  kb.home = await focusedText(page);
  r.keyboard = kb;

  // hydrate never copy, on the hydrated page.
  if (path !== '/') {
  r.neverInitial = await never(page);
  await trig(page, '#never', 0).click();
  await page.waitForTimeout(400);
  r.neverClick = await never(page);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  r.neverEnter = await never(page);
  }

  // Find-in-page: window.find() for text in the second, closed panel.
  await page.goto(BASE + path);
  await stable(page);
  r.windowFind = await page.evaluate(() => {
    const found = typeof window.find === 'function' ? window.find('Anything Yeti does not declare') : 'no window.find';

    return { found };
  });
  await page.waitForTimeout(300);
  r.afterFind = await live(page);

  // Fragment navigation to an id inside the second, closed panel.
  await page.goto(BASE + path + '#ans2');
  await stable(page);
  await page.waitForTimeout(300);
  r.fragment = await live(page);
  await ctx.close();

  return r;
}

async function noScript(browser, path) {
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1000, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + path);
  const r = { initial: await live(page) };
  r.styles = await page.evaluate(styles, PROPS).catch((e) => String(e));
  r.aria = await page.locator('#live').ariaSnapshot();
  await trig(page, '#live', 0).click();
  await page.waitForTimeout(400);
  r.click1 = await live(page);
  await trig(page, '#live', 1).click();
  await page.waitForTimeout(400);
  r.click2 = await live(page);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  r.enterOnSecond = await live(page);
  if (path !== '/') {
    await trig(page, '#never', 0).click();
    await page.waitForTimeout(400);
    r.neverClick = await never(page);
  }

  await page.goto(BASE + path);
  r.windowFind = await page.evaluate(() => window.find('Anything Yeti does not declare')).catch((e) => 'ERR ' + String(e).slice(0, 80));
  await page.waitForTimeout(300);
  r.afterFind = await live(page);
  await page.goto(BASE + path + '#ans2');
  await page.waitForTimeout(300);
  r.fragment = await live(page);
  await ctx.close();

  return r;
}

async function beforeHydration(browser, path) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errors.push(m.type() + ': ' + m.text()));
  let release;
  const gate = new Promise((res) => (release = res));
  await page.route(/\/main-[\w]+\.js$/, async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto(BASE + path, { waitUntil: 'commit' });
  await page.locator('#live .accordion').waitFor();
  const r = {};
  await trig(page, '#live', 0).click();
  await page.waitForTimeout(400);
  r.beforeClick = await live(page);
  release();
  await stable(page);
  await page.waitForTimeout(500);
  r.afterHydration = await live(page);
  r.stateOutput = await page.locator('#state').textContent().catch(() => null);
  r.errors = errors;
  // Fragment link while main.js is held back, then after hydration.
  const page2 = await ctx.newPage();
  let release2;
  const gate2 = new Promise((res) => (release2 = res));
  await page2.route(/\/main-[\w]+\.js$/, async (route) => {
    await gate2;
    await route.continue();
  });
  await page2.goto(BASE + path + '#ans2', { waitUntil: 'commit' });
  await page2.locator('#live .accordion').waitFor();
  await page2.waitForTimeout(400);
  r.fragmentBefore = await live(page2);
  release2();
  await stable(page2);
  await page2.waitForTimeout(500);
  r.fragmentAfterHydration = await live(page2);
  r.fragmentStateOutput = await page2.locator('#state').textContent().catch(() => null);
  await ctx.close();

  return r;
}

const out = {};
for (const [name, type] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
  const browser = await type.launch();
  out[name] = { version: browser.version() };
  for (const [key, path] of Object.entries(PAGES)) {
    const entry = {};
    entry.hydrated = await hydrated(browser, path).catch((e) => ({ error: String(e) }));
    entry.noScript = await noScript(browser, path).catch((e) => ({ error: String(e) }));
    if (key !== 'ref') {
      entry.beforeHydration = await beforeHydration(browser, path).catch((e) => ({ error: String(e) }));
    }

    out[name][key] = entry;
    console.log(name, key, 'done');
  }

  await browser.close();
}

mkdirSync('results30', { recursive: true });
writeFileSync('results30/probe.json', JSON.stringify(out, null, 2));
console.log('wrote results/probe.json');
