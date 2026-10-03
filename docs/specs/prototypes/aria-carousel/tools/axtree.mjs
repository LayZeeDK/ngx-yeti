// Chromium's own accessibility tree (CDP) for the carousel, and axe node detail.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const browser = await chromium.launch();
for (const [k, path] of [['Y', '/yeti-example.html'], ['A', '/a'], ['B', '/b']]) {
  for (const js of [true, false]) {
    if (k === 'Y' && !js) continue;
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, javaScriptEnabled: js });
    const page = await ctx.newPage();
    await page.goto('http://localhost:4329' + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const cdp = await ctx.newCDPSession(page);
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const keep = nodes.filter((n) => !n.ignored && ['region', 'group', 'tabpanel', 'tablist', 'tab', 'list', 'listitem', 'link', 'button', 'heading'].includes(n.role?.value));
    const lines = keep.map((n) => {
      const props = (n.properties ?? []).filter((p) => ['selected', 'focusable', 'roledescription'].includes(p.name)).map((p) => `${p.name}=${p.value.value}`);
      return `${n.role.value} "${n.name?.value ?? ''}" ${props.join(' ')}`;
    });
    console.log(`=== ${k} js=${js}\n` + lines.join('\n'));
    if (js) {
      const axe = await new AxeBuilder({ page }).include('section.carousel').analyze();
      for (const v of axe.violations) console.log(`axe ${v.id}: ${v.nodes.map((n) => n.html.slice(0, 90)).join(' | ')}`);
    }
    await ctx.close();
  }
}
await browser.close();
