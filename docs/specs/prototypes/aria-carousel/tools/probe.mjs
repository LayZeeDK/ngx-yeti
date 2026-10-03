// PROTOTYPE (ticket 29, carousel): Yeti example.html vs (A) row 29 vs (B) Aria Tabs,
// in Chromium, Firefox and WebKit. Writes results/probe.json.
import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = 'http://localhost:4329';
const PAGES = { Y: '/yeti-example.html', A: '/a', B: '/b', G: '/b-glue', C: '/b-content' };
const PROPS = [
  'display', 'gap', 'overflow-x', 'overscroll-behavior-x', 'scroll-snap-type', 'scroll-behavior', 'scrollbar-width',
  'flex-grow', 'flex-shrink', 'flex-basis', 'margin-top', 'margin-bottom', 'scroll-snap-align', 'width', 'height',
  'justify-content', 'padding-left', 'list-style-type', 'align-items', 'text-decoration-line', 'border-radius',
  'background-color', 'opacity', 'pointer-events', 'user-select', 'visibility', 'cursor', 'outline-style', 'color',
];
const SELECTORS = [
  '.carousel:not([data-gap])', '.carousel:not([data-slides])', '.carousel > [data-track]', '.carousel > [data-track] > *',
  '.carousel > [data-dots]', '.carousel > [data-dots] > li', '.carousel > [data-dots] a',
];

const out = {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- in-page helpers (serialised) ---
const styleProbe = ({ PROPS, SELECTORS }) => {
  const s = document.querySelector('section.carousel');
  const els = {
    section: s,
    track: s.querySelector(':scope > [data-track]'),
    slide1: s.querySelectorAll('[data-slide]')[0],
    slide2: s.querySelectorAll('[data-slide]')[1],
    dots: s.querySelector(':scope > [data-dots]'),
    li: s.querySelector(':scope > [data-dots] > li'),
    dot1: s.querySelectorAll(':scope > [data-dots] a')[0],
    dot2: s.querySelectorAll(':scope > [data-dots] a')[1],
  };
  const res = {};
  for (const [k, el] of Object.entries(els)) {
    const cs = getComputedStyle(el);
    res[k] = Object.fromEntries(PROPS.map((p) => [p, cs.getPropertyValue(p)]));
  }
  for (const k of ['dot1', 'dot2']) {
    const cs = getComputedStyle(els[k], '::before');
    res[k + '::before'] = Object.fromEntries(PROPS.map((p) => [p, cs.getPropertyValue(p)]));
  }
  const matches = Object.fromEntries(SELECTORS.map((q) => [q, document.querySelectorAll(q).length]));
  return { res, matches };
};

const state = () => {
  const s = document.querySelector('section.carousel');
  const track = s.querySelector(':scope > [data-track]');
  const slides = [...track.querySelectorAll('[data-slide]')];
  const dots = [...s.querySelectorAll(':scope > [data-dots] a')];
  const tr = track.getBoundingClientRect();
  const inView = slides.findIndex((sl) => Math.abs(sl.getBoundingClientRect().left - tr.left) < 2);
  return {
    hash: location.hash,
    history: history.length,
    scrollLeft: Math.round(track.scrollLeft),
    inView,
    inert: slides.map((sl) => sl.hasAttribute('inert')),
    hidden: slides.map((sl) => sl.hidden),
    slideTabindex: slides.map((sl) => sl.getAttribute('tabindex')),
    dotTabindex: dots.map((d) => d.getAttribute('tabindex')),
    current: dots.map((d) => d.getAttribute('aria-current') ?? d.getAttribute('aria-selected')),
    events: window.__slides ?? null,
    angularLoaded: typeof window.ng !== 'undefined',
  };
};

const describe = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return 'body';
  const role = el.getAttribute('role') ?? el.tagName.toLowerCase();
  const name = el.getAttribute('aria-label') ?? el.textContent.trim().slice(0, 20);
  return `${role}:${name}${el.id ? '#' + el.id : ''}`;
};

async function tabWalk(page, n = 7) {
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  await page.locator('h1').click();
  const seq = [];
  for (let i = 0; i < n; i++) {
    await page.keyboard.press('Tab');
    seq.push(await page.evaluate(describe));
  }
  return seq;
}

async function clickDot(page, i) {
  const before = await page.evaluate(state);
  await page.locator('section.carousel [data-dots] a').nth(i).click();
  await sleep(1200);
  const after = await page.evaluate(state);
  return { historyDelta: after.history - before.history, ...after };
}

async function run(name, type) {
  const browser = await type.launch();
  const r = { version: browser.version(), styles: {}, behaviour: {}, modes: {}, a11y: {}, console: {} };
  const ctxOpts = { viewport: { width: 1024, height: 768 } };

  // ---------- hydrated pages ----------
  for (const [k, path] of Object.entries(PAGES)) {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage(); page.setDefaultTimeout(8000);
    const logs = [];
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`${m.type()}: ${m.text().slice(0, 200)}`); });
    page.on('pageerror', (e) => logs.push('pageerror: ' + e.message.slice(0, 200)));
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await sleep(800);
    r.console[k] = logs; console.log(name, 'hydrated', k);
    r.styles[k] = await page.evaluate(styleProbe, { PROPS, SELECTORS });
    const b = { initial: await page.evaluate(state) };
    b.clickDot2 = await clickDot(page, 1); console.log(name, 'clicked', k);
    // A swipe or trackpad scroll, not through a dot.
    await page.evaluate(() => { const t = document.querySelector('[data-track]'); t.style.scrollBehavior = 'auto'; t.scrollTo({ left: t.scrollWidth }); t.style.scrollBehavior = ''; });
    await sleep(1000);
    b.scrollToLast = await page.evaluate(state);
    r.behaviour[k] = b;

    // keyboard
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await sleep(500);
    const kb = { tabs: await tabWalk(page) }; console.log(name, 'tabbed', k);
    // focus the first dot (or the roving tab stop) by Tab from the track
    await page.locator('section.carousel [data-dots] a[tabindex="0"], section.carousel [data-dots] a:not([tabindex])').first().focus();
    kb.focusAfterTrack = await page.evaluate(describe);
    const h0 = await page.evaluate(() => history.length);
    await page.keyboard.press('ArrowRight');
    await sleep(1000);
    kb.arrowRight = { focus: await page.evaluate(describe), ...(await page.evaluate(state)) };
    await page.keyboard.press('End');
    await sleep(1000);
    kb.end = { focus: await page.evaluate(describe), ...(await page.evaluate(state)) };
    await page.keyboard.press('Home');
    await sleep(1000);
    kb.home = { focus: await page.evaluate(describe), ...(await page.evaluate(state)) };
    // Enter on the second dot: Tab to it in A/Y, arrow to it in B
    await page.locator('section.carousel [data-dots] a[tabindex="0"], section.carousel [data-dots] a:not([tabindex])').first().focus();
    if (k === 'Y' || k === 'A') await page.keyboard.press('Tab'); else await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await sleep(1000);
    kb.enterDot2 = { focus: await page.evaluate(describe), historyDelta: (await page.evaluate(() => history.length)) - h0, ...(await page.evaluate(state)) };
    r.a11y[k] = { keyboard: kb };
    console.log(name, 'keys', k); r.a11y[k].aria = await page.locator('section.carousel').ariaSnapshot();
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await sleep(500);
    const axe = await new AxeBuilder({ page }).include('section.carousel').analyze();
    r.a11y[k].axe = axe.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s)`);
    await ctx.close();
  }

  // ---------- reduced motion ----------
  {
    const ctx = await browser.newContext({ ...ctxOpts, reducedMotion: 'reduce' });
    const page = await ctx.newPage(); page.setDefaultTimeout(8000);
    r.behaviour.reducedMotion = {};
    for (const [k, path] of Object.entries(PAGES)) {
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      r.behaviour.reducedMotion[k] = await page.evaluate(() => getComputedStyle(document.querySelector('[data-track]')).scrollBehavior);
    }
    const ctx2 = await browser.newContext(ctxOpts);
    const p2 = await ctx2.newPage();
    r.behaviour.normalMotion = {};
    for (const [k, path] of Object.entries(PAGES)) {
      await p2.goto(BASE + path, { waitUntil: 'networkidle' });
      r.behaviour.normalMotion[k] = await p2.evaluate(() => getComputedStyle(document.querySelector('[data-track]')).scrollBehavior);
    }
    await ctx.close();
    await ctx2.close();
  }

  // ---------- JavaScript off ----------
  for (const k of ['A', 'B', 'C']) {
    const ctx = await browser.newContext({ ...ctxOpts, javaScriptEnabled: false });
    const page = await ctx.newPage(); page.setDefaultTimeout(8000);
    await page.goto(BASE + PAGES[k]);
    console.log(name,'jsoff',k); const m = { styles: await evaluateNoJs(page) };
    console.log(name,'jsoff styles',k); m.tabs = await tabWalkNoJs(page); console.log(name,'jsoff tabs',k);
    await page.locator('section.carousel [data-dots] a').nth(1).click();
    await sleep(1200);
    m.url = page.url();
    m.dot2Visible = await slide2Reached(page);
    r.modes['jsoff-' + k] = m;
    await ctx.close();
  }

  // ---------- before hydration (main.js held back 4 s) ----------
  for (const k of ['A', 'B']) {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage(); page.setDefaultTimeout(8000);
    const logs = [];
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`${m.type()}: ${m.text().slice(0, 160)}`); });
    page.on('pageerror', (e) => logs.push('pageerror: ' + e.message.slice(0, 160)));
    await page.route('**/main.js', async (route) => { await sleep(10000); await route.continue(); });
    await page.goto(BASE + PAGES[k], { waitUntil: 'commit' }); await page.waitForSelector('section.carousel [data-dots] a');
    await sleep(300);
    console.log(name,'pre',k); const m = { before: await page.evaluate(state) };
    m.tabsBefore = await tabWalk(page, 5);
    m.axeBefore = (await new AxeBuilder({ page }).include('section.carousel').analyze()).violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s)`);
    m.ariaBefore = await page.locator('section.carousel').ariaSnapshot();
    m.clickDot2Before = await clickDot(page, 1);
    await sleep(11000);
    m.afterHydration = await page.evaluate(state);
    m.console = logs;
    r.modes['prehydration-' + k] = m;
    await ctx.close();
  }

  // ---------- hydrate never ----------
  {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage(); page.setDefaultTimeout(8000);
    await page.goto(BASE + '/never', { waitUntil: 'networkidle' });
    await sleep(800);
    const n = {};
    for (const v of ['A', 'B']) {
      const sec = page.locator(`[data-variant="${v}"] section.carousel`);
      const st = () => sec.evaluate((s) => ({
        inert: [...s.querySelectorAll('[data-slide]')].map((x) => x.hasAttribute('inert')),
        dotTabindex: [...s.querySelectorAll('[data-dots] a')].map((d) => d.getAttribute('tabindex')),
        scrollLeft: Math.round(s.querySelector('[data-track]').scrollLeft),
        history: history.length,
        hash: location.hash,
      }));
      const s0 = await st();
      await sec.locator('[data-dots] a').nth(1).click();
      await sleep(1200);
      const s1 = await st();
      await sec.locator('[data-track]').focus();
      await page.keyboard.press('Tab');
      const afterTrack = await page.evaluate(describe);
      await page.keyboard.press('ArrowRight');
      await sleep(600);
      n[v] = { initial: s0, afterDot2: { ...s1, historyDelta: s1.history - s0.history }, tabAfterTrack: afterTrack, afterArrow: { focus: await page.evaluate(describe), ...(await st()) } };
      if (v === 'A') {
        await sec.getByRole('button', { name: 'Next slide' }).click();
        await sleep(800);
        n[v].afterNextButton = await st();
      }
    }
    r.modes.never = n;
    await ctx.close();
  }

  await browser.close();
  out[name] = r;
}

async function evaluateNoJs(page) {
  // page.evaluate works with javaScriptEnabled:false (it runs in the utility world).
  return page.evaluate(() => {
    const s = document.querySelector('section.carousel');
    const slides = [...s.querySelectorAll('[data-slide]')];
    const dot = s.querySelector('[data-dots] a');
    return {
      inert: slides.map((x) => x.hasAttribute('inert')),
      dotTabindex: [...s.querySelectorAll('[data-dots] a')].map((d) => d.getAttribute('tabindex')),
      dotWidth: getComputedStyle(dot).width,
      dotBefore: getComputedStyle(dot, '::before').backgroundColor,
      trackSnap: getComputedStyle(s.querySelector('[data-track]')).scrollSnapType,
      slide1Children: slides[0].children.length,
    };
  });
}

async function tabWalkNoJs(page) {
  await page.locator('h1').click();
  const seq = [];
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    seq.push(await page.evaluate(describe));
  }
  return seq;
}

async function slide2Reached(page) {
  return page.evaluate(() => {
    const t = document.querySelector('[data-track]');
    const s2 = t.querySelectorAll('[data-slide]')[1];
    return { scrollLeft: Math.round(t.scrollLeft), slide2Offset: Math.round(s2.getBoundingClientRect().left - t.getBoundingClientRect().left), hash: location.hash, history: history.length };
  });
}

const only = process.argv[2];
for (const [n, t] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]].filter(([n]) => !only || n === only)) {
  try {
    await run(n, t);
    console.log('done', n);
  } catch (e) {
    out[n] = { error: String(e.stack ?? e) };
    console.log('fail', n, e.message);
  }
}
mkdirSync('results', { recursive: true });
writeFileSync(`results/probe${only ? '-' + only : ''}.json`, JSON.stringify(out, null, 1));
