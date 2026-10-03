// PROTOTYPE measurements for ticket 20. Each test records observations rather than
// asserting, so one run yields a results/<browser>.json table of what each browser did.
import { test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const results = {};
let browserName = '';
const record = (key, value) => {
  results[key] = value;
};

test.afterAll(() => {
  mkdirSync('results', { recursive: true });
  writeFileSync(`results/${browserName}.json`, JSON.stringify(results, null, 2));
});

test.beforeEach(({ browserName: b }) => {
  browserName = b;
});

const heading = async (page, text) => {
  await page.getByRole('heading', { level: 1, name: text }).waitFor();
  await page.waitForTimeout(150);
};

// Navigate through the shell's dropdown, the way a user does.
const go = async (page, link, h1) => {
  await page.locator('#menu-btn').click();
  await page.locator(`#${link}`).click();
  await heading(page, h1);
};

const closeMenu = (page) => page.evaluate(() => document.querySelector('#site-menu').matches(':popover-open') && document.querySelector('#site-menu').hidePopover());

// The wait lets zoneless change detection flush host bindings before reading them.
const tabsState = async (page, root) => {
  await page.waitForTimeout(100);

  return page.evaluate((root) => {
    const el = document.getElementById(root);

    if (!el) {
      return 'absent';
    }

    const tabs = [...el.querySelectorAll('[role="tab"]')].map((t) => `${t.id}:${t.getAttribute('aria-selected')}`);
    const panels = [...el.querySelectorAll('[role="tabpanel"]')].map((p) => `${p.id}:${p.hidden ? 'hidden' : 'shown'}`);

    return `${tabs.join(',')} | ${panels.join(',')}${el.dataset.ownSelected ? ` | own=${el.dataset.ownSelected}` : ''}`;
  }, root);
};

const events = (page) => page.evaluate(() => window.__events.splice(0).map((e) => `${e.name}@${e.target}${e.tab ? `:${e.tab}` : ''}`));
const marker = (page) => page.evaluate(() => window.__marker);
const enterState = (page, id) => page.evaluate((id) => document.getElementById(id)?.hasAttribute('data-once') ?? 'absent', id);

const tocAfterScroll = async (page, toc, target) => {
  await page.evaluate((t) => document.getElementById(t).scrollIntoView({ behavior: 'instant' }), target);
  await page.waitForTimeout(300);

  return page.evaluate((toc) => [...document.querySelectorAll(`#${toc} a`)].map((a) => `${a.id}:${a.getAttribute('aria-current')}`).join(','), toc);
};

const errors = (page) => {
  const list = [];
  page.on('pageerror', (e) => list.push(String(e.message)));
  page.on('console', (m) => m.type() === 'error' && list.push(m.text()));

  return list;
};

test('F1 load-once modules: first route, route change, @if, @defer', async ({ page }) => {
  await page.goto('/sub/tabs');
  await heading(page, 'Tabs page');
  record('F1.direct-load /tabs: tabs1', await tabsState(page, 'tabs1'));
  record('F1.direct-load /tabs: enter1 data-once still set', await enterState(page, 'enter1'));
  record('F1.direct-load /tabs: toc1 after scrolling to h2', await tocAfterScroll(page, 'toc1', 'h2'));
  await page.evaluate(() => scrollTo(0, 0));

  await page.goto('/sub/other');
  await heading(page, 'Other page');
  await go(page, 'nav-tabs', 'Tabs page');
  await closeMenu(page);
  record('F1.routed /other -> /tabs: tabs1', await tabsState(page, 'tabs1'));
  record('F1.routed: enter1 data-once still set', await enterState(page, 'enter1'));
  record('F1.routed: toc1 after scrolling to h2', await tocAfterScroll(page, 'toc1', 'h2'));
  await page.evaluate(() => scrollTo(0, 0));
  await events(page);
  await page.locator('#tab-b').click();
  record('F1.routed: tabs1 after clicking tab B', await tabsState(page, 'tabs1'));
  record('F1.routed: events for that click', await events(page));
  await page.locator('#tab-b').press('ArrowLeft');
  record('F1.routed: tabs1 after ArrowLeft', await tabsState(page, 'tabs1'));

  await go(page, 'nav-late', 'Late page');
  await closeMenu(page);
  await page.locator('#toggle').click();
  await page.waitForTimeout(150);
  record('F1.@if: tabs-if after toggle', await tabsState(page, 'tabs-if'));
  record('F1.@if: enter-if data-once still set', await enterState(page, 'enter-if'));
  await page.waitForTimeout(400);
  record('F1.@defer: tabs-defer after timer', await tabsState(page, 'tabs-defer'));
});

test('F2 fragment links under <base href="/sub/">', async ({ page }) => {
  for (const [id, label] of [
    ['frag-plain', 'href="#t-target"'],
    ['frag-path', 'href="tabs#t-target"'],
    ['frag-router', 'routerLink [] fragment'],
    ['toc1-h1', 'toc href="#h1"'],
  ]) {
    await page.goto('/sub/tabs');
    await heading(page, 'Tabs page');
    const before = await marker(page);
    await page.locator(`#${id}`).click();
    await page.waitForTimeout(600);
    await page.getByRole('heading', { level: 1 }).first().waitFor();
    const h1 = await page.getByRole('heading', { level: 1 }).first().textContent();
    record(`F2.${label}: url / reloaded / route shown`, `${new URL(page.url()).pathname}${new URL(page.url()).hash} / ${before !== (await marker(page))} / ${h1}`);

    if (h1 === 'Tabs page') {
      record(`F2.${label}: tabs1`, await tabsState(page, 'tabs1'));
    }
  }

  await page.goto('/sub/tabs');
  await heading(page, 'Tabs page');
  record('F2.toc2 (path hrefs "tabs#h1"): after scrolling to h2', await tocAfterScroll(page, 'toc2', 'h2'));
});

test('F3 popovers and dialog across navigation', async ({ page }) => {
  await page.goto('/sub/tabs');
  await heading(page, 'Tabs page');
  await go(page, 'nav-other', 'Other page');
  record('F3.shell menu: open after routerLink inside it', await page.evaluate(() => document.querySelector('#site-menu').matches(':popover-open')));

  await closeMenu(page);
  await go(page, 'nav-tabs', 'Tabs page');
  await closeMenu(page);
  await page.locator('#route-pop-btn').click();
  await page.locator('#route-pop-link').click();
  await heading(page, 'Other page');
  record('F3.route popover: open popovers left after its route is destroyed', await page.evaluate(() => document.querySelectorAll(':popover-open').length));

  await page.locator('#dlg-btn').click();
  await page.waitForTimeout(100);
  await page.locator('#dlg-link').click();
  await heading(page, 'Tabs page');
  record('F3.shell dialog: open after routerLink inside it / route shown', `${await page.evaluate(() => document.querySelector('#shell-dialog').open)} / ${await page.getByRole('heading', { level: 1 }).first().textContent()}`);
  record('F3.shell dialog: main is inert to clicks (elementFromPoint at h1 is inside dialog or backdrop)', await page.evaluate(() => {
    const h = document.querySelector('h1').getBoundingClientRect();

    return document.elementFromPoint(h.x + 2, h.y + 2)?.closest('dialog') ? 'dialog' : document.elementFromPoint(h.x + 2, h.y + 2)?.tagName;
  }));
});

test('F4 alert.js removes a node Angular owns', async ({ page }) => {
  const errs = errors(page);
  await page.goto('/sub/late');
  await heading(page, 'Late page');
  await page.locator('#toggle').click();
  await page.locator('#alert-close').click();
  await page.waitForTimeout(500);
  record('F4.alert removed by alert.js', await page.evaluate(() => !document.getElementById('alert-if')));
  await page.locator('#toggle').click();
  await page.waitForTimeout(100);
  await page.locator('#toggle').click();
  await page.waitForTimeout(100);
  record('F4.after @if off/on: alert back / tabs-if', `${await page.evaluate(() => !!document.getElementById('alert-if'))} / ${await tabsState(page, 'tabs-if')}`);
  record('F4.errors', errs.slice());
});

test('F5 listeners on document and window across navigation (Chromium CDP only)', async ({ page, browserName: b }) => {
  test.skip(b !== 'chromium', 'CDP');
  const cdp = await page.context().newCDPSession(page);
  const count = async () => {
    const out = {};

    for (const expr of ['document', 'window']) {
      const { result } = await cdp.send('Runtime.evaluate', { expression: expr });
      const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId });

      for (const l of listeners) {
        if (['click', 'keydown', 'hashchange', 'command', 'pointerdown'].includes(l.type)) {
          out[`${expr}.${l.type}`] = (out[`${expr}.${l.type}`] ?? 0) + 1;
        }
      }
    }

    return JSON.stringify(out);
  };

  for (const fix of ['', 'rerun']) {
    await page.goto(`/sub/other${fix ? `?fix=${fix}` : ''}`);
    await heading(page, 'Other page');
    const start = await count();

    for (let i = 0; i < 3; i++) {
      await go(page, 'nav-tabs', 'Tabs page');
      await closeMenu(page);
      await go(page, 'nav-other', 'Other page');
      await closeMenu(page);
    }

    await page.waitForTimeout(300);
    record(`F5.fix=${fix || 'none'}: listeners at load -> after 6 navigations`, `${start} -> ${await count()}`);
  }
});

test('R1 rerun: re-import the modules after each NavigationEnd', async ({ page }) => {
  await page.goto('/sub/other?fix=rerun');
  await heading(page, 'Other page');
  await go(page, 'nav-tabs', 'Tabs page');
  await closeMenu(page);
  await page.waitForTimeout(300);
  record('R1.routed: tabs1', await tabsState(page, 'tabs1'));
  record('R1.routed: enter1 data-once still set', await enterState(page, 'enter1'));
  record('R1.routed: toc1 after scroll', await tocAfterScroll(page, 'toc1', 'h2'));
  record('R1.routed: toc2 (path hrefs) after scroll', await tocAfterScroll(page, 'toc2', 'h2'));
  await page.evaluate(() => scrollTo(0, 0));
  await events(page);
  await page.locator('#tab-b').click();
  record(`R1.click tab B after ${await page.evaluate(() => window.__runs)} runs: events`, await events(page));

  for (let i = 0; i < 2; i++) {
    await go(page, 'nav-other', 'Other page');
    await closeMenu(page);
    await go(page, 'nav-tabs', 'Tabs page');
    await closeMenu(page);
  }

  await page.waitForTimeout(300);
  await events(page);
  await page.locator('#tab-b').click();
  record(`R1.click tab B after ${await page.evaluate(() => window.__runs)} runs: events`, await events(page));
  await page.evaluate(() => (location.hash = 't-target'));
  await page.waitForTimeout(300);
  record('R1.hashchange: events', await events(page));

  await go(page, 'nav-late', 'Late page');
  await closeMenu(page);
  await page.locator('#toggle').click();
  await page.waitForTimeout(100);
  record('R1.@if before manual rerun: tabs-if', await tabsState(page, 'tabs-if'));
  await page.evaluate(() => window.__rerun());
  await page.waitForTimeout(200);
  record('R1.@if after manual rerun: tabs-if / tabs-defer', `${await tabsState(page, 'tabs-if')} || ${await tabsState(page, 'tabs-defer')}`);
});

test('R2 popover: router-aware cleanup on NavigationStart', async ({ page }) => {
  await page.goto('/sub/tabs?fix=popover');
  await heading(page, 'Tabs page');
  await go(page, 'nav-other', 'Other page');
  record('R2.shell menu: open after routerLink inside it', await page.evaluate(() => document.querySelector('#site-menu').matches(':popover-open')));
  await page.locator('#dlg-btn').click();
  await page.waitForTimeout(100);
  await page.locator('#dlg-link').click();
  await heading(page, 'Tabs page');
  record('R2.shell dialog: open after routerLink / focus', `${await page.evaluate(() => document.querySelector('#shell-dialog').open)} / ${await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)}`);
});

for (const fix of ['fragment-hash', 'fragment-router']) {
  test(`R3 ${fix}: intercept href="#id" clicks`, async ({ page }) => {
    for (const id of ['frag-plain', 'toc1-h1']) {
      await page.goto(`/sub/tabs?fix=${fix}`);
      await heading(page, 'Tabs page');
      const before = await marker(page);
      await events(page);
      await page.locator(`#${id}`).click();
      await page.waitForTimeout(600);
      const h1 = await page.getByRole('heading', { level: 1 }).first().textContent();
      record(`R3.${fix} ${id}: url / reloaded / route shown / scrollY>0`, `${new URL(page.url()).pathname}${new URL(page.url()).search}${new URL(page.url()).hash} / ${before !== (await marker(page))} / ${h1} / ${(await page.evaluate(() => scrollY)) > 0}`);

      if (id === 'frag-plain') {
        record(`R3.${fix}: tabs1 / events`, `${await tabsState(page, 'tabs1')} / ${(await events(page)).join(',')}`);
      }
    }

  });
}

test('R4 owner directives in place of the modules', async ({ page }) => {
  await page.goto('/sub/other');
  await heading(page, 'Other page');
  await go(page, 'nav-owned', 'Owned page (directives own the behaviour)');
  await closeMenu(page);
  record('R4.routed: tabs-own', await tabsState(page, 'tabs-own'));
  record('R4.routed: own-enter data-once still set', await enterState(page, 'own-enter'));
  record('R4.routed: toc-own after scroll', await tocAfterScroll(page, 'toc-own', 'oh2'));
  await page.evaluate(() => scrollTo(0, 0));
  await events(page);
  await page.locator('#own-b').click();
  record('R4.click own-b: tabs-own / yeti events', `${await tabsState(page, 'tabs-own')} / ${(await events(page)).join(',')}`);
  await page.locator('#own-b').press('ArrowLeft');
  record('R4.ArrowLeft: tabs-own', await tabsState(page, 'tabs-own'));
  await page.evaluate(() => (location.hash = 'own-target'));
  await page.waitForTimeout(300);
  record('R4.hashchange to a target in panel B while directive holds A (tabs.js reveal still global)', `${await tabsState(page, 'tabs-own')} / ${(await events(page)).join(',')}`);
});
