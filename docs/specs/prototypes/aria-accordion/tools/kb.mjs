// PROTOTYPE (ticket 29): APG accordion keyboard walk and accessibility tree, per engine.
import { chromium, firefox, webkit } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = 'http://localhost:4791';
const PAGES = { ref: '/', a: '/a', b: '/b', b2: '/b2' };

function state() {
  const acc = document.querySelector('#live .accordion');

  return [...acc.children]
    .map((item) => {
      const t = item.querySelector('summary, button');
      const p = item.querySelector('p');
      const vis = !!p && p.checkVisibility() && !p.closest('[inert]');

      return `${item.tagName === 'DETAILS' ? (item.open ? 'open' : 'shut') : '-'}/${t.getAttribute('aria-expanded') ?? '-'}/${vis ? 'shown' : 'hidden'}`;
    })
    .join(' ');
}

const focused = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    const acc = document.querySelector('#live .accordion');
    const ts = [...acc.querySelectorAll('summary, button')];
    const i = ts.indexOf(el);

    return i >= 0 ? `trigger${i + 1}` : el?.tagName.toLowerCase();
  });

const out = {};
for (const [name, type] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
  const browser = await type.launch();
  out[name] = {};
  for (const [k, path] of Object.entries(PAGES)) {
    const page = await browser.newPage();
    await page.goto(BASE + path);
    await page.waitForFunction(() => globalThis.__stable === true);
    const log = [];
    const step = async (label, key) => {
      if (key) {
        await page.keyboard.press(key);
        await page.waitForTimeout(350);
      }

      log.push(`${label}: focus=${await focused(page)} state=${await page.evaluate(state)}`);
    };

    await page.locator('#live .accordion').locator('summary, button').first().focus();
    await step('focus trigger1');
    await step('Enter', 'Enter');
    await step('Enter', 'Enter');
    await step('Space', 'Space');
    await step('Space', 'Space');
    await step('Enter (open 1)', 'Enter');
    await step('Tab', 'Tab');
    await step('Shift+Tab', 'Shift+Tab');
    await step('ArrowDown', 'ArrowDown');
    await step('ArrowUp', 'ArrowUp');
    await step('End', 'End');
    await step('Home', 'Home');
    await step('Escape', 'Escape');
    const tree = await page.locator('#live').ariaSnapshot();
    out[name][k] = { log, treeWithFirstOpen: tree };
    await page.close();
  }

  await browser.close();
}

writeFileSync('results/kb.json', JSON.stringify(out, null, 2));
for (const [e, ps] of Object.entries(out)) {
  for (const [k, v] of Object.entries(ps)) {
    console.log(`=== ${e} ${k}\n  ${v.log.join('\n  ')}\n${v.treeWithFirstOpen}`);
  }
}
