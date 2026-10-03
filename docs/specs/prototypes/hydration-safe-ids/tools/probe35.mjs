// PROTOTYPE (ticket 35): ids across server HTML and hydration, per mode and case, in three engines.
// Usage: node tools/probe35.mjs [engine ...]   (server on PORT 4935, development build)
import { chromium, firefox, webkit } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = 'http://localhost:4935';
const MODES = ['cdk', 'counter', 'adopt', 'noseed'];
const CASES = { full: 1500, on: 3500, never: 1500, client: 2500, for: 1500, neveradd: 1500 };
const ID_RE = /^(ng-tab-|ng-tabpanel-|ng-toolbar-widget-|ngx-yeti-)/;
const engines = { chromium, firefox, webkit };
const which = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(engines);

/** Ids and references in server HTML, in document order, per data-set. */
function serverIds(html) {
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  const out = [];
  let set = '?';

  for (const m of main.matchAll(/data-set="([^"]+)"|\b(id|aria-controls|aria-labelledby)="([^"]*)"/g)) {
    if (m[1]) {
      set = m[1];
    } else if (m[2] === 'id' ? ID_RE.test(m[3]) : true) {
      out.push(`${set}:${m[2]}=${m[3]}`);
    }
  }

  return out;
}

function observer() {
  const log = (globalThis.__h35 = []);
  new MutationObserver((ms) => {
    for (const m of ms) {
      const now = m.target.getAttribute(m.attributeName);

      if (m.oldValue !== null && m.oldValue !== now) {
        log.push(`${m.target.closest('[data-set]')?.dataset.set ?? '?'}:${m.attributeName} ${m.oldValue} -> ${now}`);
      }
    }
  }).observe(document, {
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ['id', 'aria-controls', 'aria-labelledby'],
  });
}

function domState(idRe) {
  const re = new RegExp(idRe);
  const main = document.querySelector('main');
  const ids = [];
  const refs = [];

  for (const el of main.querySelectorAll('*')) {
    const set = el.closest('[data-set]')?.dataset.set ?? '?';

    for (const a of ['id', 'aria-controls', 'aria-labelledby']) {
      const v = el.getAttribute(a);

      if (v === null || (a === 'id' && !re.test(v))) {
        continue;
      }

      ids.push(`${set}:${a}=${v}`);

      if (a !== 'id') {
        refs.push({ set, a, v, n: document.querySelectorAll(`[id="${v}"]`).length });
      }
    }
  }

  const all = [...main.querySelectorAll('[id]')].map((e) => e.id);
  const dup = [...new Set(all.filter((x, i) => all.indexOf(x) !== i))];
  const hydrated = [...document.querySelectorAll('h35-set')].map(
    (h) => `${h.firstElementChild?.dataset.set}:${globalThis.ng?.getComponent?.(h) ? 'live' : 'dehydrated'}`,
  );

  return { ids, dup, unresolved: refs.filter((r) => r.n !== 1), hydrated };
}

const out = { server: {}, concurrent: {} };

// Server HTML and concurrency (no browser).
for (const mode of MODES) {
  for (const c of [...Object.keys(CASES), 'late']) {
    out.server[`${mode}/${c}`] = serverIds(await (await fetch(`${BASE}/h35/${mode}/${c}`)).text());
  }

  for (const c of ['full', 'late']) {
    const url = `${BASE}/h35/${mode}/${c}`;
    const [a, b] = await Promise.all([fetch(url).then((r) => r.text()), fetch(url).then((r) => r.text())]);
    const third = await (await fetch(url)).text();
    const [ia, ib, ic] = [a, b, third].map(serverIds);
    out.concurrent[`${mode}/${c}`] = {
      equalAB: JSON.stringify(ia) === JSON.stringify(ib),
      equalAThird: JSON.stringify(ia) === JSON.stringify(ic),
      a: ia.filter((x) => x.includes(':id=')).map((x) => x.split('=')[1]),
      b: ib.filter((x) => x.includes(':id=')).map((x) => x.split('=')[1]),
      third: ic.filter((x) => x.includes(':id=')).map((x) => x.split('=')[1]),
    };
  }
}

for (const name of which) {
  const browser = await engines[name].launch();
  const r = (out[name] = {});

  for (const mode of MODES) {
    for (const [c, wait] of Object.entries(CASES)) {
      const page = await (await browser.newContext()).newPage();
      const consoleLog = [];
      page.on('console', (m) => {
        const t = m.text();

        if (m.type() === 'error' || m.type() === 'warning' || /NG0\d/.test(t) || /hydrated/.test(t)) {
          consoleLog.push(`${m.type()}: ${t.slice(0, 160)}`);
        }
      });
      page.on('pageerror', (e) => consoleLog.push(`pageerror: ${e.message.slice(0, 160)}`));
      await page.addInitScript(observer);
      const server = out.server[`${mode}/${c}`];
      await page.goto(`${BASE}/h35/${mode}/${c}`);
      const res = { console: consoleLog };

      if (c === 'on') {
        await page.waitForTimeout(700);
        res.beforeBlock = await page.evaluate(domState, ID_RE.source);
      }

      await page.waitForTimeout(wait);
      res.after = await page.evaluate(domState, ID_RE.source);

      if (c === 'for' || c === 'neveradd') {
        await page.getByTestId('add').click();
        await page.getByTestId('add').click();
        await page.waitForTimeout(400);
        res.afterAdd = await page.evaluate(domState, ID_RE.source);
      }

      res.writes = await page.evaluate(() => globalThis.__h35);
      res.missingFromServer = server.filter((x) => !res.after.ids.includes(x));
      r[`${mode}/${c}`] = res;
      await page.context().close();
    }
  }

  await browser.close();
}

writeFileSync(new URL('../results/probe35.json', import.meta.url), JSON.stringify(out, null, 1));
console.log('written results/probe35.json');
