// PROTOTYPE (ticket 29): Chromium's own accessibility tree (CDP) for #live, first item open.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = 'http://localhost:4893';
const browser = await chromium.launch();
const out = {};
for (const [k, path] of Object.entries({ ref: '/', a: '/a', c: '/c', d: '/d', dr: '/d-role' })) {
  const page = await browser.newPage();
  await page.goto(BASE + path);
  await page.waitForFunction(() => globalThis.__stable === true);
  if (path !== '/') { await page.locator('#live .accordion summary').first().click(); } else { await page.locator('#live .accordion summary').first().click(); }
  await page.waitForTimeout(400);
  const cdp = await page.context().newCDPSession(page);
  const { node } = await cdp.send('DOM.getDocument', { depth: -1 }).then(async (doc) => {
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#live .accordion' });

    return cdp.send('DOM.describeNode', { nodeId });
  });
  const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { backendNodeId: node.backendNodeId, fetchRelatives: false });
  const full = await cdp.send('Accessibility.getFullAXTree');
  const byId = new Map(full.nodes.map((n) => [n.nodeId, n]));
  const lines = [];
  const walk = (n, depth) => {
    if (!n) {
      return;
    }

    if (!n.ignored) {
      const exp = n.properties?.find((p) => p.name === 'expanded');
      const lvl = n.properties?.find((p) => p.name === 'level');
      lines.push(`${'  '.repeat(depth)}${n.role?.value} "${n.name?.value ?? ''}"${exp ? ` expanded=${exp.value.value}` : ''}${lvl ? ` level=${lvl.value.value}` : ''}`);
    }

    for (const c of n.childIds ?? []) {
      walk(byId.get(c), n.ignored ? depth : depth + 1);
    }
  };
  walk(byId.get(nodes[0].nodeId), 0);
  out[k] = lines;
  console.log(`=== ${k}\n${lines.join('\n')}`);
  await page.close();
}

await browser.close();
writeFileSync('results30/axtree-chromium.json', JSON.stringify(out, null, 2));
