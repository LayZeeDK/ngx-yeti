// PROTOTYPE (ticket 30): condense results/r30-<engine>.json into results/r30-summary.txt.
import { readFileSync, writeFileSync } from 'node:fs';

const out = [];
const stops = (attrs) => attrs.filter((a) => a.includes('"tabindex":"0"')).length;
const strip = (s) => s.replace(/ng-(toolbar-widget|tab)-a[0-9a-f]+-/g, '$1-');

for (const e of ['chromium', 'firefox', 'webkit']) {
  const R = JSON.parse(readFileSync(`results/r30-${e}.json`, 'utf8'));
  out.push(`######## ${e} ${R.version}`);
  for (const k of ['buttons', 'tabs', 'carousel']) {
    out.push(`== ${k}`);
    const inert = (a) => a.filter((x) => x.includes('"inert"')).length;
    out.push(`  jsOff: tabindex=0 count ${stops(R.jsOff[k].attrs)}, inert ${inert(R.jsOff[k].attrs)}; Tab: ${strip(R.jsOff[k].tab.join(' > '))}`);
    const B = R.before[k];
    out.push(`  before: tabindex=0 count ${stops(B.attrs)}, inert ${inert(B.attrs)}; Tab: ${strip(B.tab.join(' > '))}`);
    out.push(`  before axe: ${B.axe.join(' | ') || 'none'}`);
    out.push(`  hand-over (release main.js to settled): ${B.handover.records} records, ${B.handover.noop} same-value; ${JSON.stringify(B.handover.changes)}`);
    const L = R.live[k];
    out.push(`  live load (first paint to settled): ${L.load.records} records, ${L.load.noop} same-value; ${JSON.stringify(L.load.changes)}`);
    out.push(`  live: tabindex=0 count ${stops(L.attrs)}, inert ${inert(L.attrs)}; Tab: ${strip(L.tab.join(' > '))}`);
    out.push(`  live axe: ${L.axe.join(' | ') || 'none'}`);
    out.push(`  live keys: ${strip(L.keys.join(', '))}`);
    if (L.keysBusy) out.push(`  busy: ${strip(L.keysBusy.join(', '))}; aria-disabled on focus ${L.busyFocusable}; race (expect widget-4): ${strip(L.race.join(', '))}`);
    if (L.keysReduced) out.push(`  keys, reduced motion: ${strip(L.keysReduced.join(', '))}`);
    if (L.panels) out.push(`  panels: ${L.panels.join('; ')}`);
    if (L.afterArrow) out.push(`  carousel: afterArrow ${JSON.stringify(L.afterArrow)} afterClick ${JSON.stringify(L.afterClick)} afterSwipe ${JSON.stringify(L.afterSwipe)} historyStart ${L.historyStart}`);
    const cons = [...new Set([...B.console, ...L.console])].filter((m) => !/development mode|hydrated \d/.test(m));
    out.push(`  console (other than dev-mode and hydration-count logs): ${cons.join(' | ') || 'none'}`);
    const hyd = L.console.find((m) => /hydrated \d/.test(m));
    out.push(`  hydration: ${hyd ?? 'no hydration log'}`);
  }
  out.push(`== never: activeTrue ${R.never.activeTrue}, tabindex=0 count ${stops(R.never.attrs)}; Tab: ${strip(R.never.tab.join(' > '))}`);
  out.push(`  never keys: toolbar ${R.never.toolbarKeys} tabs ${R.never.tabKeys}; axe ${R.never.axe.join(' | ')}`);
  out.push(`  never console: ${R.never.console.filter((m) => !/development mode/.test(m)).join(' | ')}`);
  // Styles: same rows in the same order as the reference.
  const cmp = (a, b) => a.map((r, i) => (r === b[i] ? null : `#${i}: ${r}  VS  ${b[i]}`)).filter(Boolean);
  out.push(`== styles`);
  out.push(`  tabs live vs Yeti example + tabs.js: ${JSON.stringify(cmp(R.live.tabs.style, R.ref.tabsScript.style))}`);
  out.push(`  tabs jsOff vs Yeti example without tabs.js: ${JSON.stringify(cmp(R.jsOff.tabsStyle, R.jsOff.yetiTabsNoscript.style))}`);
  out.push(`  Yeti no-script Tab: ${R.jsOff.yetiTabsNoscript.tab.join(' > ')}; Yeti with tabs.js Tab: ${R.ref.tabsScript.tab.join(' > ')}; attrs ${R.ref.tabsScript.attrs.join('; ')}`);
  out.push(`  buttons action vs ref (role column ignored): ${JSON.stringify(cmp(R.live.buttons.style.map((r) => r.replace(/\[toolbar\]/, '')), R.ref.buttons.map((r) => r.replace(/\[group\]/, ''))))}`);
  out.push(`  buttons toggle vs ref: ${JSON.stringify(cmp(R.live.buttons.styleToggle.map((r) => r.replace(/\[toolbar\]/, '')), R.ref.buttonsToggle.map((r) => r.replace(/\[group\]/, ''))))}`);
}
writeFileSync('results/r30-summary.txt', out.join('\n') + '\n');
console.log(out.join('\n'));
