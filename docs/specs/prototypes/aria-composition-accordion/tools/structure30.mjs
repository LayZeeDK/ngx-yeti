// PROTOTYPE (ticket 30): is #live's element tree the same in the server HTML (parsed, JS off)
// and after hydration? Attributes are compared too, except the ones Angular or Aria change at run time.
import { chromium, firefox, webkit } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = 'http://localhost:4893';
const PAGES = ['/a', '/c', '/c-noinert', '/c-open', '/d', '/d-role', '/b2'];
const RUNTIME = new Set(['jsaction', 'ngh', 'data-active', 'tabindex']);

function tree(sel) {
  const walk = (n) => {
    if (n.nodeType === 3) {
      return n.textContent.trim() ? '#text' : null;
    }

    if (n.nodeType === 8) {
      return '#comment';
    }

    const attrs = [...n.attributes].map((a) => a.name).filter((a) => !['jsaction', 'ngh'].includes(a)).sort().join(',');

    return { t: n.tagName.toLowerCase(), a: attrs, c: [...n.childNodes].map(walk).filter(Boolean) };
  };

  return JSON.stringify(walk(document.querySelector(sel)));
}

const out = {};
for (const [name, type] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
  const browser = await type.launch();
  out[name] = {};
  for (const path of PAGES) {
    const off = await browser.newContext({ javaScriptEnabled: false });
    const p1 = await off.newPage();
    await p1.goto(BASE + path);
    const server = await p1.evaluate(tree, '#live');
    await off.close();
    const p2 = await browser.newPage();
    const errors = [];
    p2.on('console', (m) => ['error', 'warning'].includes(m.type()) && errors.push(`${m.type()}: ${m.text()}`));
    p2.on('pageerror', (e) => errors.push(String(e)));
    await p2.goto(BASE + path);
    await p2.waitForFunction(() => globalThis.__stable === true);
    await p2.waitForTimeout(500);
    const client = await p2.evaluate(tree, '#live');
    await p2.close();
    out[name][path] = { same: server === client, errors, ...(server === client ? {} : { server, client }) };
    console.log(name, path, 'same tree:', server === client, 'console errors/warnings:', errors.length, errors.join(' | ').slice(0, 200));
  }

  await browser.close();
}

writeFileSync('results30/structure.json', JSON.stringify(out, null, 2));
