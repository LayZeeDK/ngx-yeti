// PROTOTYPE (ticket 18): measures Yeti items under each rendering mode in
// Chromium, Firefox, and WebKit against the production SSR build of that mode.
// Usage: node tools/measure.mjs [mode ...]   (default: every mode)
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { chromium, firefox, webkit } from 'playwright';

const ALL = ['plain', 'none', 'noreplay', 'replay', 'explicit', 'zone', 'i18n-off', 'i18n-on'];
const modes = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
const PORT = 4518;
const ORIGIN = `http://localhost:${PORT}`;
const engines = { chromium, firefox, webkit };
mkdirSync('results', { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function startServer(mode) {
  const child = spawn(process.execPath, [`dist/${mode}/server/server.mjs`], {
    env: { ...process.env, PORT: String(PORT), NG_ALLOWED_HOSTS: 'localhost' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', (d) => (log += d));
  child.stderr.on('data', (d) => (log += d));

  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('server timeout: ' + log)), 15000);
    child.stdout.on('data', () => {
      if (log.includes('listening')) {
        clearTimeout(t);
        resolve({ child, log: () => log });
      }
    });
  });
}

// Runs before any page script: records DOM removals, later insertions,
// attribute writes, and animation starts.
const INIT = () => {
  const now = () => Math.round(performance.now());
  const m = (window.__mut = { rem: [], add: [], attr: {}, changed: [], anim: [], dcl: null });
  const desc = (n) => ({ tag: n.localName, testid: n.getAttribute?.('data-testid') ?? null, cls: n.getAttribute?.('class') ?? null });
  new MutationObserver((recs) => {
    for (const r of recs) {
      if (r.type === 'childList') {
        for (const n of r.removedNodes) {
          if (n.nodeType === 1) {
            m.rem.push({ ...desc(n), t: now() });
          }
        }

        if (m.dcl !== null) {
          for (const n of r.addedNodes) {
            if (n.nodeType === 1) {
              m.add.push({ ...desc(n), t: now() });
            }
          }
        }
      } else if (r.type === 'attributes') {
        const k = (r.target.getAttribute('data-testid') ?? r.target.localName) + '@' + r.attributeName;
        m.attr[k] = (m.attr[k] ?? 0) + 1;
        const v = r.target.getAttribute(r.attributeName);
        if (v !== r.oldValue) {
          m.changed.push({ k, old: r.oldValue, now: v, t: now() });
        }
      }
    }
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeOldValue: true });
  document.addEventListener('DOMContentLoaded', () => (m.dcl = now()));
  document.addEventListener(
    'animationstart',
    (e) => m.anim.push({ name: e.animationName, testid: e.target.getAttribute?.('data-testid') ?? null, t: now() }),
    true,
  );
};

async function newPage(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e.message).slice(0, 300)));
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      errors.push(msg.type() + ': ' + msg.text().slice(0, 300));
    }
  });

  if (opts.javaScriptEnabled !== false) {
    await page.addInitScript(INIT);
  }

  return { ctx, page, errors };
}

async function stable(page) {
  await page.waitForFunction(() => window.__m?.stable !== undefined, null, { timeout: 15000 });
}

function gate(page) {
  let open;
  const opened = new Promise((r) => (open = r));
  page.route(/\/main-[A-Z0-9]+\.js$/, async (route) => {
    await opened;
    await route.continue();
  });

  return open;
}

const readMut = (page) =>
  page.evaluate(() => {
    const m = window.__mut;
    const inApp = (x) => x.tag !== 'script' && x.tag !== 'link' && x.tag !== 'style';

    return {
      removed: m.rem.filter(inApp).length,
      removedSample: m.rem.filter(inApp).slice(0, 6),
      addedAfterDcl: m.add.filter(inApp).length,
      attrWrites: Object.values(m.attr).reduce((a, b) => a + b, 0),
      changed: m.changed.filter((c) => !c.k.startsWith('link@') && !c.k.startsWith('app-')).slice(0, 40),
      anim: m.anim,
      t: window.__t ?? {},
      marks: window.__m ?? {},
    };
  });

// --- tests -------------------------------------------------------------

async function serverHtml(base) {
  const out = {};
  for (const path of ['', 'pre', 'defer', 'i18n', 'guard']) {
    const html = await (await fetch(ORIGIN + base + path)).text();
    out[path || 'home'] = {
      bytes: html.length,
      ngh: (html.match(/ ngh="/g) ?? []).length,
      skipHydration: (html.match(/ngskiphydration/gi) ?? []).length,
      jsaction: [...new Set(html.match(/jsaction="[^"]*"/g) ?? [])],
      bootstrap: html.match(/__jsaction_bootstrap\([^)]*\)/)?.[0] ?? null,
      serverContext: html.match(/ng-server-context="([^"]*)"/)?.[1] ?? null,
      badgeStyle: (html.match(/<style[^>]*>[^<]*\.badge/g) ?? []).length,
      blocksWithContent: [...html.matchAll(/data-testid="probe-([a-z-]+)"/g)].map((x) => x[1]),
      placeholders: [...html.matchAll(/ph ([dh]-[a-z]+)/g)].map((x) => x[1]),
      cardTitle: html.match(/<h3[^>]*>([^<]*)<\/h3>/)?.[1] ?? null,
    };
  }

  return out;
}

async function jsOff(browser, base) {
  const { ctx, page } = await newPage(browser, { javaScriptEnabled: false });
  await page.goto(ORIGIN + base);
  const vis = async (sel) => page.locator(sel).isVisible();
  const r = {
    cardVisible: await vis('[data-testid=card]'),
    cardBox: await page.locator('[data-testid=card]').boundingBox(),
    layoutBoxes: await Promise.all([0, 1, 2].map((i) => page.locator('[data-testid=layout] > .box').nth(i).boundingBox())),
    dialogVisibleBefore: await vis('[data-testid=dialog]'),
    dropdownVisibleBefore: await vis('[data-testid=dropdown]'),
    tabPanelsVisible: await page.locator('[data-testid=tabs] [role=tabpanel]:visible').count(),
    accOpenBefore: await page.locator('[data-testid=acc-plain]').getAttribute('open'),
  };
  await page.click('[data-testid=dialog-open]');
  await sleep(300);
  r.dialogVisibleAfterClick = await vis('[data-testid=dialog]');
  await page.keyboard.press('Escape');
  await sleep(300);
  r.dialogVisibleAfterEscape = await vis('[data-testid=dialog]');
  await page.click('[data-testid=dropdown-open]');
  await sleep(200);
  r.dropdownVisibleAfterClick = await vis('[data-testid=dropdown]');
  await page.keyboard.press('Escape');
  await page.click('[data-testid=acc-plain-summary]');
  await sleep(300);
  r.accOpenAfterClick = (await page.locator('[data-testid=acc-plain]').getAttribute('open')) !== null;
  await page.click('[data-testid=tab-b]');
  r.tabBSelected = await page.locator('[data-testid=tab-b]').getAttribute('aria-selected');
  await page.click('[data-testid=dot-2]');
  await sleep(300);
  r.urlAfterDot = page.url().replace(ORIGIN, '');
  await ctx.close();

  return r;
}

async function hydrate(browser, base, path = '') {
  const { ctx, page, errors } = await newPage(browser);
  await page.goto(ORIGIN + base + path);
  await stable(page);
  await sleep(800);
  const r = await readMut(page);
  r.tabState = await page.evaluate(() => ({
    selected: [...document.querySelectorAll('[data-testid=tabs] [role=tab]')].map((t) => t.getAttribute('aria-selected')),
    hiddenPanels: document.querySelectorAll('[data-testid=tabs] [role=tabpanel][hidden]').length,
    tabs2Selected: [...document.querySelectorAll('[data-testid=tabs2] [role=tab]')].map((t) => t.getAttribute('aria-selected')),
    accStaticOpen: document.querySelector('[data-testid=acc-static]')?.open ?? null,
    enterOnceDataOnce: document.querySelector('[data-testid=enter-once-ssr]')?.hasAttribute('data-once') ?? null,
    enterOnceAnims: window.__mut.anim.filter((a) => a.testid === 'enter-once-ssr').length,
  }));

  if (path === '') {
    r.enterSsrAnimations = r.anim.filter((a) => a.testid === 'enter-ssr').length;
    // yeti:select reaching Angular: host listener on document vs a plain addEventListener.
    await page.click('[data-testid=tab-b]');
    await sleep(300);
    r.afterTabClick = {
      hostListenerRuns: (await page.evaluate(() => window.__t?.yetiSelectHost)) ?? 0,
      hostListenerView: await page.textContent('[data-testid=yeti-select]'),
      plainListenerRuns: (await page.evaluate(() => window.__t?.plainListener)) ?? 0,
      plainFieldView: await page.textContent('[data-testid=plain-field]'),
    };
    await page.click('[data-testid=counter]');
    await sleep(100);
    r.counterAfterClick = await page.textContent('[data-testid=counter]');
    // yeti:slide with only a plain-field listener: zoneless does not refresh the view.
    await page.click('[data-testid=dot-2]');
    await sleep(600);
    r.afterDotClick = {
      plainSlideRuns: (await page.evaluate(() => window.__t?.plainSlide)) ?? 0,
      plainSlidesView: await page.textContent('[data-testid=plain-slides]'),
      defaultCdRuns: (await page.evaluate(() => window.__t?.defaultCdSlide)) ?? 0,
      defaultCdView: await page.textContent('[data-testid=default-cd-slides]'),
      zoneLoaded: await page.evaluate(() => typeof window.Zone !== 'undefined'),
    };
  }

  if (path === 'i18n') {
    r.cardTitle = await page.textContent('[data-testid=card] h3');
    r.cardBody = await page.textContent('[data-testid=card] p');
  }

  r.errors = errors;
  await ctx.close();

  return r;
}

// Acts while main.js is held back, then releases it and reads what survived.
async function beforeHydration(browser, base, flow) {
  const { ctx, page, errors } = await newPage(browser);
  const release = gate(page);
  await page.goto(ORIGIN + base, { waitUntil: 'commit' });
  await page.waitForSelector('[data-testid=counter]');
  // yeti.js (a module script ahead of main) has run once tabs.js selected a tab.
  await page.waitForSelector('[data-testid=tab-a][aria-selected=true]', { timeout: 10000 }).catch(() => {});
  const pre = {};
  const isOpen = (sel) => page.evaluate((s) => document.querySelector(s).open, sel);
  const isPopOpen = () => page.evaluate(() => document.querySelector('[data-testid=dropdown]').matches(':popover-open'));

  if (flow === 'all') {
    await page.click('[data-testid=dialog-open]');
    await sleep(250);
    pre.dialogOpened = await isOpen('[data-testid=dialog]');
    await page.keyboard.press('Escape');
    await sleep(250);
    pre.dialogClosedByEscape = !(await isOpen('[data-testid=dialog]'));
    await page.click('[data-testid=dropdown-open]');
    await sleep(150);
    pre.popoverOpened = await isPopOpen();
    await page.keyboard.press('Escape');
    await sleep(150);
    await page.click('[data-testid=acc-plain-summary]');
    await page.click('[data-testid=acc-bound-summary]');
    await sleep(350);
    pre.accPlainOpen = await isOpen('[data-testid=acc-plain]');
    pre.accBoundOpen = await isOpen('[data-testid=acc-bound]');
    await page.click('[data-testid=tab-b]');
    pre.tabBSelected = await page.getAttribute('[data-testid=tab-b]', 'aria-selected');
    await page.click('[data-testid=acc-static-summary]');
    await sleep(350);
    pre.accStaticOpen = await isOpen('[data-testid=acc-static]');
    await page.click('[data-testid=tab2-b]');
    pre.tabs2Selected = await page.evaluate(() => [...document.querySelectorAll('[data-testid=tabs2] [role=tab]')].map((t) => t.getAttribute('aria-selected')));
    pre.enterOnceDataOnce = await page.evaluate(() => document.querySelector('[data-testid=enter-once-ssr]').hasAttribute('data-once'));
    const hist0 = await page.evaluate(() => history.length);
    await page.click('[data-testid=dot-2]');
    await sleep(300);
    pre.dotHash = await page.evaluate(() => location.hash);
    pre.dotHistoryDelta = (await page.evaluate(() => history.length)) - hist0;
    await page.click('[data-testid=counter]');
    await page.click('[data-testid=counter]');
    await page.fill('[data-testid=input]', 'abc');
    await page.click('[data-testid=dropdown-open]');
    await sleep(150);
    pre.popoverLeftOpen = await isPopOpen();
  } else {
    await page.click('[data-testid=dialog-open]');
    await sleep(250);
    pre.dialogLeftOpen = await isOpen('[data-testid=dialog]');
  }

  pre.counterText = await page.textContent('[data-testid=counter]');
  release();
  await stable(page);
  await sleep(800);
  const post = await readMut(page);
  delete post.attr;
  post.counterText = await page.textContent('[data-testid=counter]');
  post.inputValue = await page.inputValue('[data-testid=input]');
  post.mirror = await page.textContent('[data-testid=mirror]');

  if (flow === 'all') {
    post.accPlainOpen = await isOpen('[data-testid=acc-plain]');
    post.accBoundOpen = await isOpen('[data-testid=acc-bound]');
    post.tabBSelected = await page.getAttribute('[data-testid=tab-b]', 'aria-selected');
    post.hiddenPanels = await page.locator('[data-testid=tabs] [role=tabpanel][hidden]').count();
    post.popoverOpen = await isPopOpen();
    post.accStaticOpen = await isOpen('[data-testid=acc-static]');
    post.tabs2Selected = await page.evaluate(() => [...document.querySelectorAll('[data-testid=tabs2] [role=tab]')].map((t) => t.getAttribute('aria-selected')));
    post.tabs2HiddenPanels = await page.locator('[data-testid=tabs2] [role=tabpanel][hidden]').count();
    post.enterOnceDataOnce = await page.evaluate(() => document.querySelector('[data-testid=enter-once-ssr]').hasAttribute('data-once'));
  } else {
    post.dialogOpen = await isOpen('[data-testid=dialog]');
    await page.keyboard.press('Escape');
    await sleep(300);
    post.dialogOpenAfterEscape = await isOpen('[data-testid=dialog]');
    post.closeHandlerRuns = (await page.evaluate(() => window.__t?.dialogClose)) ?? 0;
  }

  post.errors = errors;
  await ctx.close();

  return { pre, post };
}

async function i18nBeforeHydration(browser, base) {
  const { ctx, page, errors } = await newPage(browser);
  const release = gate(page);
  await page.goto(ORIGIN + base + 'i18n', { waitUntil: 'commit' });
  await page.waitForSelector('[data-testid=counter]');
  await page.click('[data-testid=counter]');
  release();
  await stable(page);
  await sleep(800);
  const r = {
    counterText: await page.textContent('[data-testid=counter]'),
    counterRuns: (await page.evaluate(() => window.__t?.counterClick)) ?? 0,
    errors,
  };
  await ctx.close();

  return r;
}

async function deferTest(browser, base) {
  const { ctx, page, errors } = await newPage(browser);
  await page.goto(ORIGIN + base + 'defer');
  await stable(page);
  await sleep(1500);
  const names = ['d-immediate', 'd-idle', 'd-timer', 'd-when', 'd-interaction', 'd-hover', 'd-viewport', 'h-immediate', 'h-idle', 'h-timer', 'h-when', 'h-interaction', 'h-hover', 'h-never', 'h-viewport'];
  const snap = () =>
    page.evaluate((ns) => {
      const o = {};
      for (const n of ns) {
        const tabs = document.querySelector(`[data-testid=tabs-${n}]`);
        o[n] = {
          content: !!document.querySelector(`[data-testid=probe-${n}]`),
          created: window.__m?.['probe:' + n] !== undefined,
          tabsInit: tabs ? tabs.querySelectorAll('[aria-selected=true]').length > 0 : null,
          hiddenPanels: tabs ? tabs.querySelectorAll('[role=tabpanel][hidden]').length : null,
          clicks: window.__t?.['click:' + n] ?? 0,
        };
      }

      return o;
    }, names);
  const before = await snap();
  // Triggers; each one may fail on its own.
  const actionErrors = [];
  const act = async (label, fn) => {
    try {
      await fn();
    } catch (e) {
      actionErrors.push(label + ': ' + String(e.message).split(/\r?\n/)[0]);
    }
  };
  await act('when', () => page.click('[data-testid=when-on]'));
  await act('d-interaction', () => page.click('[data-testid=ph-d-interaction]'));
  await act('d-hover', () => page.hover('[data-testid=ph-d-hover]', { timeout: 5000 }));
  await act('h-interaction', () => page.click('[data-testid=click-h-interaction]'));
  await act('h-hover', () => page.hover('[data-testid=probe-h-hover]', { timeout: 5000 }));
  await act('h-never click', () => page.click('[data-testid=click-h-never]'));
  let neverDialogOpened = null;
  await act('h-never dialog', async () => {
    await page.click('[data-testid=dlgopen-h-never]');
    await sleep(250);
    neverDialogOpened = await page.evaluate(() => document.querySelector('[data-testid=dlg-h-never]').open);
    await page.keyboard.press('Escape');
  });
  await sleep(300);
  await act('viewport', async () => {
    await page.evaluate(() => document.querySelector('[data-block=d-viewport]').scrollIntoView({ block: 'center' }));
    await sleep(800);
    await page.mouse.move(5, 5);
  });
  await sleep(1200);
  const after = await snap();
  // A client-rendered block: does the native dialog invoker still work, and do Yeti's tabs?
  await page.evaluate(() => window.scrollTo(0, 0));
  let clientDialogOpened = null;
  await act('d-idle dialog', async () => {
    await page.click('[data-testid=dlgopen-d-idle]');
    await sleep(250);
    clientDialogOpened = await page.evaluate(() => document.querySelector('[data-testid=dlg-d-idle]').open);
    await page.keyboard.press('Escape');
  });
  const r = { before, after, neverDialogOpened, clientDialogOpened, actionErrors, errors };
  await ctx.close();

  return r;
}

async function animTest(browser, base) {
  const { ctx, page, errors } = await newPage(browser);
  await page.goto(ORIGIN + base + 'anim');
  await stable(page);
  await sleep(1200);
  const r = {};
  r.onceSsr = await page.evaluate(() => {
    const el = document.querySelector('[data-testid=an-once-ssr]');

    return { dataOnce: el.hasAttribute('data-once'), anims: window.__mut.anim.filter((a) => a.testid === 'an-once-ssr').length };
  });
  // Clicks a toggle in the page and samples the target on the next frames.
  const probeIn = (btn, sel, waitMs) =>
    page.evaluate(
      ({ btn, sel, waitMs }) =>
        new Promise((resolve) => {
          const t0 = performance.now();
          document.querySelector(`[data-testid=${btn}]`).click();
          const samples = [];
          const tick = () => {
            const el = document.querySelector(`[data-testid=${sel}]`);
            const t = Math.round(performance.now() - t0);
            samples.push({
              t,
              present: !!el,
              cls: el?.getAttribute('class') ?? null,
              opacity: el ? getComputedStyle(el).opacity : null,
              anims: el ? el.getAnimations().map((a) => a.animationName ?? a.transitionProperty ?? a.constructor.name) : [],
              dataOnce: el ? el.hasAttribute('data-once') : null,
            });

            if (t < waitMs) {
              requestAnimationFrame(tick);
            } else {
              const firstAbsent = samples.find((s) => !s.present);
              resolve({
                first: samples.find((s) => s.present) ?? samples[0],
                anims: [...new Set(samples.flatMap((s) => s.anims))],
                classes: [...new Set(samples.map((s) => s.cls))],
                minOpacity: Math.min(...samples.filter((s) => s.opacity !== null).map((s) => Number(s.opacity))),
                removedAtMs: firstAbsent ? firstAbsent.t : null,
                last: samples.at(-1),
              });
            }
          };
          requestAnimationFrame(tick);
        }),
      { btn, sel, waitMs },
    );
  r.dialogEnter = await probeIn('t-dialog', 'an-dialog', 400);
  r.dialogLeave = await probeIn('t-dialog', 'an-dialog', 600);
  r.enterClassEnter = await probeIn('t-enterclass', 'an-enterclass', 900);
  r.enterStaticEnter = await probeIn('t-enterstatic', 'an-enterstatic', 900);
  r.enterOnceEnter = await probeIn('t-enteronce', 'an-enteronce', 900);
  r.alert2Leave = await probeIn('t-alert2', 'an-alert2', 700);
  // alert.js removes a node that Angular's @if owns; then Angular toggles it.
  const e0 = errors.length;
  r.alertJsClose = await probeIn('an-alert-close', 'an-alert', 500);
  await page.click('[data-testid=t-alert]');
  await sleep(200);
  r.alertAfterAngularHide = await page.locator('[data-testid=an-alert]').count();
  await page.click('[data-testid=t-alert]');
  await sleep(200);
  r.alertAfterAngularShow = await page.locator('[data-testid=an-alert]').count();
  r.alertErrors = errors.slice(e0);
  r.errors = errors;
  await ctx.close();

  return r;
}

async function guardTest(browser, base) {
  const out = {};
  const badgeStyles = (page) =>
    page.evaluate(() => [...document.querySelectorAll('style')].filter((s) => s.textContent.includes('.badge')).length);
  const neverStyle = (page) =>
    page.evaluate(() => {
      const el = document.querySelector('[data-testid=g-never]');

      if (!el) {
        return null;
      }

      const cs = getComputedStyle(el);

      return { paddingInline: cs.paddingInlineStart, radius: cs.borderTopLeftRadius, bg: cs.backgroundColor };
    });
  const scenarios = {
    G0_noLeaveAnywhere: [],
    G1_permanentClassLeave: ['g-permclass'],
    G2_permanentFnLeave: ['g-permfn'],
  };
  for (const [name, pre] of Object.entries(scenarios)) {
    const { ctx, page, errors } = await newPage(browser);
    await page.goto(ORIGIN + base + 'guard');
    await stable(page);
    await sleep(500);
    const r = { stylesAtLoad: await badgeStyles(page), neverAtLoad: await neverStyle(page) };
    for (const b of pre) {
      await page.click(`[data-testid=${b}]`);
      await sleep(100);
    }
    await page.click('[data-testid=g-badge]');
    await sleep(500);
    r.stylesAfterHide = await badgeStyles(page);
    r.neverAfterHide = await neverStyle(page);
    await page.click('[data-testid=g-badge]');
    await sleep(200);
    r.stylesAfterShow = await badgeStyles(page);
    r.errors = errors;
    out[name] = r;
    await ctx.close();
  }
  {
    const { ctx, page, errors } = await newPage(browser);
    await page.goto(ORIGIN + base + 'guard');
    await stable(page);
    await sleep(500);
    await page.click('[data-testid=g-both]');
    await sleep(100);
    const during = await badgeStyles(page);
    await sleep(700);
    out.G3_badgeWithLeavingSibling = { stylesDuringLeave: during, stylesAfterLeave: await badgeStyles(page), errors };
    await ctx.close();
  }

  return out;
}

// --- run -----------------------------------------------------------------

for (const mode of modes) {
  if (!existsSync(`dist/${mode}/server/server.mjs`)) {
    console.log('skip (not built):', mode);
    continue;
  }

  const base = mode.startsWith('i18n') ? '/da/' : '/';
  const server = await startServer(mode);
  const result = { mode, base, server: await serverHtml(base), browsers: {} };
  result.prerenderFile = existsSync(`dist/${mode}/browser/${mode.startsWith('i18n') ? 'da/' : ''}pre/index.html`);
  for (const [name, engine] of Object.entries(engines)) {
    const browser = await engine.launch();
    const r = { version: browser.version() };
    const step = async (key, fn) => {
      try {
        r[key] = await fn();
      } catch (e) {
        r[key] = { failed: String(e.message).split('\n')[0] };
      }
    };
    await step('jsOff', () => jsOff(browser, base));
    await step('hydrateHome', () => hydrate(browser, base, ''));
    await step('hydratePre', () => hydrate(browser, base, 'pre'));
    await step('hydrateI18n', () => hydrate(browser, base, 'i18n'));
    await step('beforeHydrationAll', () => beforeHydration(browser, base, 'all'));
    await step('beforeHydrationDialog', () => beforeHydration(browser, base, 'dialog'));
    await step('i18nBeforeHydration', () => i18nBeforeHydration(browser, base));
    await step('defer', () => deferTest(browser, base));
    await step('anim', () => animTest(browser, base));
    await step('guard', () => guardTest(browser, base));
    await browser.close();
    result.browsers[name] = r;
    console.log(mode, name, r.version);
  }
  server.child.kill();
  await sleep(500);
  writeFileSync(`results/${mode}.json`, JSON.stringify(result, null, 2));
}
