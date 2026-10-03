// PROTOTYPE (ticket 34, point 2): `[open]` against `[attr.open]` on details, a non-modal
// dialog, and a modal dialog, across server HTML, JS off, before hydration, hydrated,
// and hydrate never. Development build; console is collected for NG05xx.
import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync } from 'node:fs';

const BASE = 'http://localhost:4735';
const engines = { chromium, firefox, webkit };

const state = () =>
  Object.fromEntries(
    [...document.querySelectorAll('details[data-testid], dialog[data-testid]')].map((el) => [
      el.dataset.testid,
      `${el.open ? 'open' : 'shut'}${el.hasAttribute('open') ? '' : '(no attr)'}${el.tagName === 'DIALOG' && el.matches(':modal') ? ' modal' : ''}${el.checkVisibility() ? ' shown' : ' hidden'}`,
    ]),
  );

function recorder() {
  const log = (globalThis.__log = []);
  const t0 = performance.now();
  const t = () => Math.round(performance.now() - t0);
  globalThis.__mark = (m) => log.push(`${t()} --- ${m}`);
  new MutationObserver((ms) => {
    for (const m of ms) {
      log.push(`${t()} attr ${m.target.dataset.testid} open: ${m.oldValue === null ? 'absent' : 'present'} -> ${m.target.hasAttribute('open') ? 'present' : 'absent'}`);
    }
  }).observe(document, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['open'] });

  for (const type of ['toggle', 'close', 'cancel']) {
    document.addEventListener(type, (e) => log.push(`${t()} event ${type} ${e.target.dataset?.testid}${e.newState ? ` ${e.oldState}->${e.newState}` : ''}`), true);
  }
}

async function axe(page) {
  const r = await new AxeBuilder({ page }).include('section').analyze();

  return r.violations.map((v) => `${v.id}(${v.impact})x${v.nodes.length}`);
}

/** Load with main.js held, run `act` before hydration, release, wait, and record. */
async function prehydration(browser, path, act) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const con = [];
  page.on('console', (m) => con.push(`${m.type()}: ${m.text().slice(0, 160)}`));
  page.on('pageerror', (e) => con.push(`pageerror: ${e.message}`));
  await page.addInitScript(recorder);
  let release;
  const gate = new Promise((res) => (release = res));
  await page.route(/\/main-\w+\.js$/, async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto(BASE + path, { waitUntil: 'commit' });
  await page.waitForSelector('#set-mF-false', { state: 'attached' });
  await page.waitForTimeout(300);
  const server = await page.evaluate(state);
  const axeBefore = await axe(page);
  await act(page);
  await page.waitForTimeout(300);
  const beforeRelease = await page.evaluate(state);
  await page.evaluate(() => globalThis.__mark('release main.js'));
  release();
  await page.waitForFunction(() => globalThis.__stable === true);
  await page.waitForTimeout(600);
  const hydrated = await page.evaluate(state);
  const axeAfter = await axe(page);
  const log = await page.evaluate(() => globalThis.__log);
  await ctx.close();

  return { server, beforeRelease, hydrated, log, console: con, axeBefore, axeAfter };
}

const detailsAndNonModal = async (page, force = false) => {
  for (const id of ['prop-dT', 'attr-dT', 'prop-dF', 'attr-dF']) {
    await page.getByTestId(id).locator('summary').click({ force });
  }

  await page.getByRole('button', { name: 'Close prop nT' }).click({ force });
  await page.getByRole('button', { name: 'Close attr nT' }).click({ force });
};

const out = {};
const lines = [];

for (const [name, type] of Object.entries(engines)) {
  const browser = await type.launch();
  const r = (out[name] = {});

  // JS off
  {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(BASE + '/o34');
    r.jsOff = await page.evaluate(state);
    await detailsAndNonModal(page, true);
    await page.getByRole('button', { name: 'Open prop mF' }).click({ force: true });
    r.jsOffAfterActions = await page.evaluate(state);
    await ctx.close();
  }

  // invoker command support
  {
    const page = await browser.newPage();
    r.commandSupport = await page.evaluate(() => 'command' in HTMLButtonElement.prototype && 'commandForElement' in HTMLButtonElement.prototype);
    await page.close();
  }

  r.control = await prehydration(browser, '/o34', async () => {});
  r.toggles = await prehydration(browser, '/o34', detailsAndNonModal);
  r.modalProp = await prehydration(browser, '/o34', (page) => page.getByRole('button', { name: 'Open prop mF' }).click());
  r.modalAttr = await prehydration(browser, '/o34', (page) => page.getByRole('button', { name: 'Open attr mF' }).click());

  // after hydration: showModal(), then the bound value true, then false
  r.liveModal = {};

  for (const form of ['prop', 'attr']) {
    const page = await browser.newPage();
    await page.addInitScript(recorder);
    await page.goto(BASE + '/o34');
    await page.waitForFunction(() => globalThis.__stable === true);
    const steps = {};
    await page.evaluate((id) => document.getElementById(id).showModal(), `${form}-mF`);
    steps.showModal = (await page.evaluate(state))[`${form}-mF`];
    await page.evaluate(() => globalThis.ng.getComponent(document.querySelector('app-o34-items')).mF.set(true));
    await page.waitForTimeout(200);
    steps.boundTrue = (await page.evaluate(state))[`${form}-mF`];
    await page.evaluate(() => globalThis.ng.getComponent(document.querySelector('app-o34-items')).mF.set(false));
    await page.waitForTimeout(200);
    steps.boundFalse = (await page.evaluate(state))[`${form}-mF`];
    steps.anyModal = await page.evaluate(() => !!document.querySelector(':modal'));
    steps.log = await page.evaluate(() => globalThis.__log.filter((l) => l.includes('mF')));
    r.liveModal[form] = steps;
    await page.close();
  }

  // hydrate never: the same toggles after load, then a modal
  {
    const page = await browser.newPage();
    const con = [];
    page.on('console', (m) => con.push(`${m.type()}: ${m.text().slice(0, 160)}`));
    await page.goto(BASE + '/o34-never');
    await page.waitForFunction(() => globalThis.__stable === true);
    await page.waitForTimeout(300);
    const server = await page.evaluate(state);
    await detailsAndNonModal(page);
    await page.getByRole('button', { name: 'Open attr mF' }).click();
    await page.waitForTimeout(800);
    r.never = { server, afterActions: await page.evaluate(state), console: con };
    await page.close();
  }

  await browser.close();

  const fmt = (s) => Object.entries(s).map(([k, v]) => `${k}=${v}`).join(', ');
  lines.push(`##### ${name}  (invoker commands supported: ${r.commandSupport})`);
  lines.push(`JS off, as served:        ${fmt(r.jsOff)}`);
  lines.push(`JS off, after toggles:    ${fmt(r.jsOffAfterActions)}`);

  for (const k of ['control', 'toggles', 'modalProp', 'modalAttr']) {
    const v = r[k];
    lines.push(`-- ${k}`);
    lines.push(`   served:          ${fmt(v.server)}`);
    lines.push(`   before release:  ${fmt(v.beforeRelease)}`);
    lines.push(`   hydrated:        ${fmt(v.hydrated)}`);
    lines.push(`   axe before / after: ${v.axeBefore.join(' ') || 0} / ${v.axeAfter.join(' ') || 0}`);
    const after = v.log.slice(v.log.findIndex((l) => l.includes('release main.js')));
    lines.push(`   log from release: ${after.join(' ; ')}`);
    lines.push(`   console: ${v.console.filter((c) => !c.includes('development mode')).join(' | ')}`);
  }

  for (const form of ['prop', 'attr']) {
    const s = r.liveModal[form];
    lines.push(`-- hydrated, ${form}-mF: showModal() -> ${s.showModal}; bound true -> ${s.boundTrue}; bound false -> ${s.boundFalse}; any :modal left: ${s.anyModal}`);
    lines.push(`   log: ${s.log.join(' ; ')}`);
  }

  lines.push(`-- hydrate never, served:        ${fmt(r.never.server)}`);
  lines.push(`-- hydrate never, after toggles: ${fmt(r.never.afterActions)}`);
  lines.push(`   console: ${r.never.console.filter((c) => !c.includes('development mode')).join(' | ')}`);
}

writeFileSync('results34/o34.json', JSON.stringify(out, null, 2));
writeFileSync('results34/o34-summary.txt', lines.join('\n') + '\n');
console.log(lines.join('\n'));
