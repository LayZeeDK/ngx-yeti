// PROTOTYPE (ticket 29, nav + dropdown): measures Yeti's reference page, variant A and
// variant B in Chromium, Firefox and WebKit. Usage: node tools/probe.mjs [engine...]
// Server: NG_ALLOWED_HOSTS=localhost PORT=4391 node dist/ws/server/server.mjs
import { chromium, firefox, webkit } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'http://localhost:4391';
const engines = { chromium, firefox, webkit };
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(engines);
const WIDE = { width: 1000, height: 800 };
const NARROW = { width: 400, height: 800 };

const EL = {
  nav: 'nav.nav',
  brand: '.nav > [data-brand]',
  toggle: '.nav > button[popovertarget="site-menu"]',
  list: '#site-menu',
  li: '#site-menu > li:first-child',
  link: '#site-menu > li:first-child > a',
  link2: '#site-menu > li:nth-child(2) > a',
  moreLi: '#site-menu > li.dropdown',
  moreTrigger: '#site-menu .dropdown > button',
  morePanel: '#more-menu',
  moreItem: '#more-menu > a:first-child',
  actions: '.nav > [data-actions]',
  ddRoot: '.dropdown:has(> #account-menu)',
  ddTrigger: '.dropdown:has(> #account-menu) > button',
  ddPanel: '#account-menu',
  ddLink: '#account-menu > a:first-child',
  ddButton: '#account-menu > button',
  hvTrigger: '.dropdown:has(> #products) > button',
  hvPanel: '#products',
};
const PROPS = [
  'display', 'position', 'flex-direction', 'top', 'left', 'right', 'bottom',
  'margin-top', 'margin-left', 'padding-top', 'padding-left', 'padding-right',
  'background-color', 'color', 'border-top-width', 'border-bottom-width', 'border-top-left-radius',
  'box-shadow', 'min-width', 'width', 'height', 'font-weight', 'font-size', 'list-style-type',
  'anchor-name', 'position-anchor', 'position-area', 'opacity', 'text-decoration-line', 'cursor',
];

const ready = async (page, path) => {
  await page.goto(BASE + path);

  if (path !== '/ref.html') {
    await page.waitForSelector('html[data-stable]', { timeout: 15000 });
  }

  await page.waitForTimeout(150);
};

const openIds = (page) =>
  page.evaluate(() => [...document.querySelectorAll(':popover-open')].map((e) => e.id));

const active = (page) =>
  page.evaluate(() => {
    const e = document.activeElement;

    if (!e || e === document.body) {
      return 'body';
    }

    const name = (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 20);
    const role = e.getAttribute('role');
    return `${e.tagName.toLowerCase()}${role ? `[role=${role}]` : ''}${e.id ? `#${e.id}` : ''} "${name}"`;
  });

const snapStyles = (page) =>
  page.evaluate(
    ({ EL, PROPS }) => {
      const out = {};

      for (const [k, sel] of Object.entries(EL)) {
        const e = document.querySelector(sel);

        if (!e) {
          out[k] = null;
          continue;
        }

        const cs = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        const o = {};

        for (const p of PROPS) {
          o[p] = cs.getPropertyValue(p);
        }

        o.rect = [r.x, r.y, r.width, r.height].map(Math.round).join(',');
        out[k] = o;
      }

      return out;
    },
    { EL, PROPS },
  );

// Every selector of Yeti's nav and dropdown rules, with :hover and pseudo-elements removed,
// and whether it matches anything in the current state.
const selectorMatches = (page) =>
  page.evaluate(() => {
    const res = {};
    const walk = (rules) => {
      for (const r of rules) {
        if (r.selectorText) {
          for (const s of r.selectorText.split(/,(?![^(]*\))/)) {
            const sel = s.trim();

            if (!/\.nav\b|\.dropdown\b/.test(sel)) {
              continue;
            }

            const probe = sel.replace(/::backdrop/g, '').replace(/:hover/g, '');
            let m = false;

            try {
              m = !!document.querySelector(probe);
            } catch {
              m = 'invalid';
            }

            res[sel] = res[sel] || m;
          }
        }

        if (r.cssRules) {
          walk(r.cssRules);
        }
      }
    };

    for (const sh of document.styleSheets) {
      try {
        walk(sh.cssRules);
      } catch {
        /* cross-origin */
      }
    }

    return res;
  });

async function styles(browser) {
  const out = {};

  for (const [vpName, vp] of Object.entries({ wide: WIDE, narrow: NARROW })) {
    for (const path of ['/ref.html', '/a', '/b', '/b2']) {
      const page = await (await browser.newContext({ viewport: vp })).newPage();
      await ready(page, path);
      const states = {};
      const sels = {};
      const add = async (name) => {
        states[name] = await snapStyles(page);
        const m = await selectorMatches(page);

        for (const [k, v] of Object.entries(m)) {
          sels[k] = sels[k] === true || v;
        }
      };

      await page.mouse.move(0, 0);
      await add('closed');
      await page.click(EL.ddTrigger);
      await page.waitForTimeout(250);
      await page.mouse.move(0, 0);
      await add('ddOpen');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);

      if (vpName === 'narrow') {
        await page.click(EL.toggle);
        await page.waitForTimeout(300);
        await page.mouse.move(0, 0);
        await add('navOpen');
      }

      await page.click(EL.moreTrigger);
      await page.waitForTimeout(250);
      await page.mouse.move(0, 0);
      await add('moreOpen');
      states.openAfterMore = await openIds(page);
      out[`${vpName} ${path}`] = { states, sels };
      await page.close();
    }
  }

  // Diffs against the reference page.
  const diffs = {};

  for (const vpName of ['wide', 'narrow']) {
    const ref = out[`${vpName} /ref.html`];

    for (const path of ['/a', '/b', '/b2']) {
      const cur = out[`${vpName} ${path}`];
      const d = [];

      for (const [state, els] of Object.entries(ref.states)) {
        if (state === 'openAfterMore') {
          continue;
        }

        for (const [k, o] of Object.entries(els)) {
          const c = cur.states[state]?.[k];

          if (!o || !c) {
            if (o !== c) {
              d.push(`${state}.${k}: ${o ? 'present' : 'missing'} in ref, ${c ? 'present' : 'missing'} here`);
            }

            continue;
          }

          for (const p of Object.keys(o)) {
            if (o[p] !== c[p]) {
              d.push(`${state}.${k}.${p}: ref=${o[p]} here=${c[p]}`);
            }
          }
        }
      }

      const lost = Object.keys(ref.sels).filter((s) => ref.sels[s] === true && cur.sels[s] !== true);
      const gained = Object.keys(cur.sels).filter((s) => cur.sels[s] === true && ref.sels[s] !== true);
      diffs[`${vpName} ${path}`] = {
        styleDiffs: d,
        selectorsLost: lost,
        selectorsGained: gained,
        openAfterMore: { ref: ref.states.openAfterMore, here: cur.states.openAfterMore },
      };
    }

    diffs[`${vpName} selectorsMatchedInRef`] = Object.keys(ref.sels).filter((s) => ref.sels[s] === true).length;
    diffs[`${vpName} selectorsTotal`] = Object.keys(ref.sels).length;
  }

  return { diffs, raw: out };
}

// Each behaviour of hover.js and of the platform the rows rely on.
async function behaviours(browser) {
  const out = {};

  for (const path of ['/ref.html', '/a', '/b']) {
    const r = {};
    const fresh = async (vp = WIDE) => {
      const page = await (await browser.newContext({ viewport: vp })).newPage();
      await ready(page, path);
      return page;
    };
    let page = await fresh();
    const toggles = await page.evaluate(() => {
      const p = document.querySelector('#account-menu');
      window.__toggles = [];
      p.addEventListener('toggle', (e) => window.__toggles.push(e.newState));
      p.addEventListener('beforetoggle', (e) => window.__toggles.push('before:' + e.newState));
    });
    void toggles;
    await page.click(EL.ddTrigger);
    await page.waitForTimeout(200);
    r.clickOpens = (await openIds(page)).includes('account-menu');
    r.focusAfterClickOpen = await active(page);
    r.ariaExpandedAttrOpen = await page.getAttribute(EL.ddTrigger, 'aria-expanded');
    await page.click(EL.ddTrigger);
    await page.waitForTimeout(200);
    r.clickAgainCloses = !(await openIds(page)).includes('account-menu');
    r.toggleEvents = await page.evaluate(() => window.__toggles);
    await page.click(EL.ddTrigger);
    await page.waitForTimeout(200);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    r.escapeCloses = !(await openIds(page)).includes('account-menu');
    r.focusAfterEscape = await active(page);
    await page.click(EL.ddTrigger);
    await page.waitForTimeout(200);
    await page.mouse.click(900, 700);
    await page.waitForTimeout(200);
    r.outsideClickCloses = !(await openIds(page)).includes('account-menu');
    // Anchor: panel under its trigger.
    await page.click(EL.ddTrigger);
    await page.waitForTimeout(250);
    r.anchor = await page.evaluate(() => {
      const t = document.querySelector('.dropdown:has(> #account-menu) > button').getBoundingClientRect();
      const p = document.querySelector('#account-menu').getBoundingClientRect();
      return { dy: Math.round(p.top - t.bottom), dx: Math.round(p.left - t.left) };
    });
    // A press on non-focusable panel content (the panel's own padding).
    const box = await page.locator(EL.ddPanel).boundingBox();
    // Left padding at mid-height: the corners are rounded, and Firefox hit-tests them as outside.
    await page.mouse.click(box.x + 3, box.y + box.height / 2);
    await page.waitForTimeout(200);
    r.pressOnPanelPaddingKeepsOpen = (await openIds(page)).includes('account-menu');
    r.focusAfterPanelPress = await active(page);
    await page.close();

    // Focus-out: open by keyboard, Tab until focus leaves the dropdown.
    page = await fresh();
    await page.focus(EL.ddTrigger);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    r.enterOpens = (await openIds(page)).includes('account-menu');
    r.focusAfterEnter = await active(page);
    const tabs = [];

    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(80);
      tabs.push(`${await active(page)} open=${(await openIds(page)).includes('account-menu')}`);
    }

    r.tabWalkFromOpen = tabs;
    await page.close();

    // Hover intent on data-trigger="hover".
    page = await fresh();
    const hb = await page.locator(EL.hvTrigger).boundingBox();
    await page.mouse.move(0, 0);
    await page.mouse.move(hb.x + 5, hb.y + 5);
    await page.waitForTimeout(40);
    r.hoverOpenBefore100ms = (await openIds(page)).includes('products');
    await page.waitForTimeout(300);
    r.hoverOpensAfterDelay = (await openIds(page)).includes('products');
    const pb = await page.locator(EL.hvPanel).boundingBox().catch(() => null);

    if (pb && r.hoverOpensAfterDelay) {
      await page.mouse.move(pb.x + 10, pb.y + pb.height / 2, { steps: 4 });
      await page.waitForTimeout(400);
      r.hoverOnPanelKeepsOpen = (await openIds(page)).includes('products');
    }

    await page.mouse.move(900, 700);
    await page.waitForTimeout(80);
    r.hoverLeaveStillOpenBefore200ms = (await openIds(page)).includes('products');
    await page.waitForTimeout(400);
    r.hoverLeaveClosesAfterDelay = !(await openIds(page)).includes('products');
    // A click-opened panel stays open when the pointer leaves.
    await page.click(EL.hvTrigger);
    await page.waitForTimeout(400);
    const clickOpened = (await openIds(page)).includes('products');
    await page.mouse.move(900, 700);
    await page.waitForTimeout(500);
    r.clickOpenedSurvivesPointerLeave = clickOpened && (await openIds(page)).includes('products');
    await page.close();

    // Router-only checks (the reference page has no router).
    if (path !== '/ref.html') {
      page = await fresh();
      await page.click(EL.ddTrigger);
      await page.waitForTimeout(200);
      await page.click(EL.ddLink);
      await page.waitForTimeout(400);
      r.clickRouterLinkUrl = new URL(page.url()).search;
      r.clickRouterLinkClosesPanel = !(await openIds(page)).includes('account-menu');
      await page.close();

      page = await fresh();
      await page.focus(EL.ddTrigger);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);

      if (path === '/a') {
        await page.keyboard.press('Tab');
      }

      r.focusBeforeEnterOnLink = await active(page);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);
      r.enterOnRouterLinkUrl = new URL(page.url()).search;
      r.enterOnRouterLinkClosesPanel = !(await openIds(page)).includes('account-menu');
      await page.close();

      // Programmatic navigation (e.g. Back, or code) while open.
      page = await fresh();
      await page.click(EL.link2);
      await page.waitForTimeout(400);
      await page.click(EL.ddTrigger);
      await page.waitForTimeout(200);
      await page.evaluate(() => history.back());
      await page.waitForTimeout(500);
      r.historyBackUrl = new URL(page.url()).search;
      r.historyBackClosesPanel = !(await openIds(page)).includes('account-menu');
      await page.close();

      // Nav sheet (narrow): navigation and focus-out.
      page = await fresh(NARROW);
      await page.click(EL.toggle);
      await page.waitForTimeout(300);
      await page.click(EL.link2);
      await page.waitForTimeout(400);
      r.navSheetClosesOnRouterLink = !(await openIds(page)).includes('site-menu');
      await page.close();
    }

    page = await fresh(NARROW);
    await page.focus(EL.toggle);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    r.navSheetEnterOpens = (await openIds(page)).includes('site-menu');
    const nt = [];

    for (let i = 0; i < 9; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(80);
      nt.push(`${await active(page)} open=${(await openIds(page)).join('+')}`);
    }

    r.navSheetTabWalk = nt;
    await page.close();
    out[path] = r;
  }

  return out;
}

async function tabStops(page, n = 14) {
  const seq = [];
  await page.evaluate(() => document.activeElement?.blur());

  for (let i = 0; i < n; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(40);
    seq.push(await active(page));
  }

  return seq;
}

async function modeChecks(page) {
  const r = {};
  r.tabStops = await tabStops(page);
  r.openBefore = await openIds(page);
  await page.click(EL.ddTrigger);
  await page.waitForTimeout(250);
  r.clickOpens = (await openIds(page)).includes('account-menu');
  r.panelBg = await page.evaluate(() => getComputedStyle(document.querySelector('#account-menu')).backgroundColor);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  r.escapeCloses = !(await openIds(page)).includes('account-menu');
  await page.focus(EL.ddTrigger);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  r.enterOpens = (await openIds(page)).includes('account-menu');
  r.focusAfterEnter = await active(page);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(100);
  r.focusAfterArrowDown = await active(page);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(100);
  r.focusAfterTab = await active(page);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  await page.click(EL.moreTrigger);
  await page.waitForTimeout(250);
  r.moreClickOpens = (await openIds(page)).includes('more-menu');
  r.moreAriaExpandedAttrWhileOpen = await page.getAttribute(EL.moreTrigger, 'aria-expanded');
  r.moreAria = await page.locator(EL.moreLi).ariaSnapshot();
  r.ariaExpanded = await page.getAttribute(EL.ddTrigger, 'aria-expanded');
  r.navLinkTabindex = await page.getAttribute(EL.link, 'tabindex');
  r.listRole = await page.getAttribute(EL.list, 'role');
  return r;
}

async function renderingModes(browser) {
  const out = {};

  for (const path of ['/a', '/b', '/a-never', '/b-never']) {
    // JavaScript off: the server HTML alone.
    let ctx = await browser.newContext({ javaScriptEnabled: false, viewport: WIDE });
    let page = await ctx.newPage();
    await page.goto(BASE + path);
    out[`${path} js-off`] = await modeChecks(page);
    await ctx.close();

    // Before hydration: JavaScript on, the application bundle never arrives
    // (the inline event-replay contract still runs).
    ctx = await browser.newContext({ viewport: WIDE });
    page = await ctx.newPage();
    await page.route(/main-.*\.js$/, (route) => route.abort());
    await page.goto(BASE + path);
    await page.waitForTimeout(300);
    out[`${path} pre-hydration`] = await modeChecks(page);
    await ctx.close();

    // Hydrated (for *-never: the app is up, the deferred block never hydrates).
    ctx = await browser.newContext({ viewport: WIDE });
    page = await ctx.newPage();
    await ready(page, path);
    out[`${path} hydrated`] = await modeChecks(page);
    await ctx.close();
  }

  return out;
}

async function a11y(browser) {
  const out = {};

  for (const path of ['/ref.html', '/a', '/b', '/b2']) {
    for (const [vpName, vp] of Object.entries({ wide: WIDE, narrow: NARROW })) {
      const page = await (await browser.newContext({ viewport: vp })).newPage();
      await ready(page, path);
      const axe = async () => {
        const res = await new AxeBuilder({ page }).include('main').analyze();
        return res.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
      };
      const r = { closed: await axe() };
      await page.click(EL.ddTrigger);
      await page.waitForTimeout(250);
      r.ddOpen = await axe();
      r.ddAria = await page.locator(EL.ddRoot).ariaSnapshot();

      // Playwright's ariaSnapshot reads ARIA attributes; the engine's own tree (CDP,
      // Chromium only) shows the expanded state popovertarget gives the trigger.
      if (browser.browserType().name() === 'chromium') {
        const cdp = await page.context().newCDPSession(page);
        const { nodes } = await cdp.send('Accessibility.getFullAXTree');
        const n = nodes.find((x) => x.role?.value === 'button' && x.name?.value === 'Account');
        r.ddTriggerEngineAx = n && { role: n.role.value, name: n.name.value, props: (n.properties || []).map((p) => `${p.name}=${p.value.value}`) };
        const panel = nodes.filter((x) => ['menu', 'menuitem', 'link'].includes(x.role?.value) && ['Profile', 'Settings', 'Sign out', ''].includes(x.name?.value ?? '')).map((x) => `${x.role.value} "${x.name?.value}"`);
        r.ddPanelEngineAx = panel;
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);

      if (vpName === 'narrow') {
        await page.click(EL.toggle);
        await page.waitForTimeout(300);
      }

      await page.click(EL.moreTrigger);
      await page.waitForTimeout(250);
      r.moreOpen = await axe();
      r.navAria = await page.locator(EL.nav).ariaSnapshot();
      out[`${vpName} ${path}`] = r;
      await page.close();
    }

    // APG keyboard walk, wide. Dropdown: focus the trigger, then the keys.
    const page = await (await browser.newContext({ viewport: WIDE })).newPage();
    await ready(page, path);
    const walk = async (start, keys) => {
      await page.keyboard.press('Escape');
      await page.focus(start);
      const log = [`start ${await active(page)}`];

      for (const k of keys) {
        await page.keyboard.press(k);
        await page.waitForTimeout(120);
        log.push(`${k} -> ${await active(page)} open=${(await openIds(page)).join('+') || '-'}`);
      }

      return log;
    };
    const sheet = await (await browser.newContext({ viewport: NARROW })).newPage();
    await ready(sheet, path);
    await sheet.focus(EL.toggle);
    const sheetLog = [];

    for (const k of ['Enter', 'Tab', 'ArrowDown', 'ArrowRight', 'ArrowRight', 'ArrowDown', 'Escape', 'Escape']) {
      await sheet.keyboard.press(k);
      await sheet.waitForTimeout(150);
      sheetLog.push(`${k} -> ${await active(sheet)} open=${(await openIds(sheet)).join('+') || '-'}`);
    }

    await sheet.close();
    out[`keys ${path}`] = {
      navSheet: sheetLog,
      dropdown: await walk(EL.ddTrigger, ['Enter', 'ArrowDown', 'ArrowDown', 'Home', 'End', 'ArrowUp', 's', 'Escape', ' ', 'Tab', 'Tab', 'Tab', 'Tab']),
      navBar: await walk(EL.brand, ['Tab', 'ArrowRight', 'ArrowRight', 'ArrowDown', 'ArrowDown', 'Escape', 'Enter', 'ArrowRight', 'ArrowLeft', 'Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Tab']),
    };
    await page.close();
  }

  return out;
}

mkdirSync('results', { recursive: true });

for (const name of wanted) {
  const browser = await engines[name].launch();
  const result = { engine: name, version: browser.version() };
  console.log(name, result.version);

  for (const [k, fn] of Object.entries({ styles, behaviours, renderingModes, a11y })) {
    try {
      result[k] = await fn(browser);
    } catch (e) {
      result[k] = { error: String(e.stack || e) };
      console.log(name, k, 'ERROR', e.message);
    }
  }

  writeFileSync(`results/${name}.json`, JSON.stringify(result, null, 2));
  await browser.close();
}
