// PROTOTYPE (ticket 29): compact view of results/probe.json.
import { readFileSync } from 'node:fs';

const d = JSON.parse(readFileSync('results/probe.json', 'utf8'));
const st = (items) =>
  items
    ? items.map((i) => `${i.tag}:${i.open === null ? '' : i.open ? 'O' : 'c'}/${i.ariaExpanded ?? '-'}/${i.contentInDom ? 'dom' : 'nodom'}/${i.contentVisible ? 'VIS' : 'hid'}`).join(' | ')
    : 'null';
const only = process.argv[2];
for (const [eng, pages] of Object.entries(d)) {
  console.log(`##### ${eng} ${pages.version}`);
  for (const [k, e] of Object.entries(pages)) {
    if (k === 'version' || (only && only !== k)) {
      continue;
    }

    const h = e.hydrated;
    console.log(`--- ${k}`);
    if (h.error) {
      console.log('  hydrated ERROR', h.error);
    } else {
      console.log('  errors', h.errors.length, h.errors.slice(0, 2).join(' || ').slice(0, 300));
      console.log('  initial      ', st(h.initial));
      console.log('  click1       ', st(h.click1), 'out=', h.stateOutputAfterClick1);
      console.log('  click2       ', st(h.click2));
      console.log('  click2again  ', st(h.click2again));
      console.log('  kb tab', h.keyboard.tab1, '->', h.keyboard.tab2);
      console.log('  kb enter     ', st(h.keyboard.enter));
      console.log('  kb space     ', st(h.keyboard.space));
      console.log('  kb arrows', h.keyboard.arrowDown, '|', h.keyboard.arrowUp, '| end', h.keyboard.end, '| home', h.keyboard.home);
      console.log('  never click  ', st(h.neverClick), ' enter', st(h.neverEnter));
      console.log('  find', JSON.stringify(h.windowFind), st(h.afterFind));
      console.log('  fragment     ', st(h.fragment));
      console.log('  axe closed', h.axeClosed.join(', ') || 'none', '| open', h.axeOpen.join(', ') || 'none');
    }

    const n = e.noScript;
    if (n.error) {
      console.log('  noScript ERROR', n.error);
    } else {
      console.log('  noJS initial ', st(n.initial));
      console.log('  noJS click1  ', st(n.click1));
      console.log('  noJS click2  ', st(n.click2));
      console.log('  noJS enter2  ', st(n.enterOnSecond));
      console.log('  noJS never   ', st(n.neverClick));
    }

    const b = e.beforeHydration;
    if (b) {
      console.log('  preHyd click ', b.error ?? st(b.beforeClick));
      console.log('  preHyd after ', st(b.afterHydration), 'out=', b.stateOutput);
    }
  }
}
