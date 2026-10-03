// Prints a compact view of results/probe.json.
import { readFileSync } from 'node:fs';

const all = JSON.parse(readFileSync('results/probe.json', 'utf8'));
const j = (o) => JSON.stringify(o);
const pick = (s) => s && { h: s.historyDelta, hash: s.hash, inView: s.inView, inert: s.inert.map(Number).join(''), cur: s.current.join(','), dotTi: s.dotTabindex.join(','), slideTi: s.slideTabindex.join(','), ev: s.events?.length ?? 0, ng: s.angularLoaded };

for (const [eng, r] of Object.entries(all)) {
  console.log(`\n######## ${eng} ${r.version ?? r.error}`);
  if (r.error) continue;
  const y = r.styles.Y.res;
  for (const k of ['A', 'B', 'G', 'C']) {
    const d = [];
    for (const [el, props] of Object.entries(r.styles[k].res)) {
      for (const [p, v] of Object.entries(props)) {
        if (y[el][p] !== v) d.push(`${el}.${p}: Y=${y[el][p]} ${k}=${v}`);
      }
    }
    const unmatched = Object.entries(r.styles[k].matches).filter(([q, n]) => n !== r.styles.Y.matches[q]);
    console.log(`styles ${k}: ${d.length ? d.join('; ') : 'no diffs'} | selector count diffs: ${unmatched.length ? j(unmatched) : 'none'}`);
  }
  for (const [k, b] of Object.entries(r.behaviour)) {
    if (k.endsWith('Motion')) { console.log(k, j(b)); continue; }
    console.log(`beh ${k}: init ${j(pick(b.initial))}\n   dot2 ${j(pick(b.clickDot2))}\n   scrollLast ${j(pick(b.scrollToLast))}`);
  }
  for (const [k, a] of Object.entries(r.a11y)) {
    const kb = a.keyboard;
    console.log(`a11y ${k}: axe ${j(a.axe)}\n   tabs ${kb.tabs.join(' > ')}\n   firstDot ${kb.focusAfterTrack} | right ${kb.arrowRight.focus} ${j(pick(kb.arrowRight))}\n   end ${kb.end.focus} ${j(pick(kb.end))}\n   home ${kb.home.focus}\n   enterDot2 ${kb.enterDot2.focus} ${j(pick(kb.enterDot2))}`);
  }
  console.log('console', j(Object.fromEntries(Object.entries(r.console).map(([k, v]) => [k, [...new Set(v)]]))));
  for (const [k, m] of Object.entries(r.modes)) {
    if (k === 'never') {
      for (const [v, n] of Object.entries(m)) console.log(`never ${v}: ${j(n)}`);
      continue;
    }
    if (k.startsWith('jsoff')) { console.log(`${k}: ${j(m.styles)} tabs ${m.tabs.join(' > ')} | afterDot2 ${j(m.dot2Visible)} url ${m.url}`); continue; }
    console.log(`${k}: before ${j(pick(m.before))}\n   tabs ${m.tabsBefore.join(' > ')}\n   axeBefore ${j(m.axeBefore)}\n   dot2 ${j(pick(m.clickDot2Before))}\n   afterHydration ${j(pick(m.afterHydration))}\n   console ${j([...new Set(m.console)])}`);
  }
}
