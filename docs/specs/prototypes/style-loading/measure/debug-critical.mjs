// What the server's inlined critical CSS alone gives the server-rendered card, with the global
// always-group stylesheet blocked: which token in the card padding chain is missing from the plan?
import { chromium } from 'file:///D:/tmp/ngx-yeti-23/yeti/node_modules/playwright/index.mjs';
const browser = await chromium.launch();
const pg = await browser.newPage({ javaScriptEnabled: false });
await pg.route('**/styles-*.css', (r) => r.abort());
await pg.goto('http://localhost:4280/sub/', { waitUntil: 'load' }).catch(() => {});
await pg.waitForTimeout(500);
console.log(await pg.evaluate(() => {
  const el = document.getElementById('eager');
  const cs = getComputedStyle(el);
  const root = getComputedStyle(document.documentElement);
  const chain = ['--yeti-card-padding', '--yeti-space-md', '--yeti-space', '--yeti-base', '--yeti-ratio', '--yeti-scale', '--yeti-space-unit', '--yeti-space-sm', '--yeti-space-xs'];
  return { padding: cs.paddingTop, display: cs.display, background: cs.backgroundColor, tokensOnRoot: Object.fromEntries(chain.map((t) => [t, root.getPropertyValue(t) || '(unset)'])), sheets: [...document.styleSheets].map((s) => (s.ownerNode.nodeName + ' ' + (s.ownerNode.getAttribute('href') ?? '').split('/').pop()).trim()) };
}));
await browser.close();
