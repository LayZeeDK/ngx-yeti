// PROTOTYPE (ticket 29): computed-style differences against the ref page, per engine.
import { readFileSync } from 'node:fs';

const d = JSON.parse(readFileSync('results/probe.json', 'utf8'));
for (const [eng, pages] of Object.entries(d)) {
  console.log(`##### ${eng}`);
  const ref = pages.ref.hydrated;
  for (const k of ['a', 'b', 'b2', 'b3']) {
    const h = pages[k].hydrated;
    for (const phase of ['stylesClosed', 'stylesOpen']) {
      const diffs = [];
      for (const part of ['accordion', 'item', 'item2', 'trigger', 'triggerAfter', 'panel', 'content']) {
        const r = ref[phase][part];
        const v = h[phase][part];
        if (!r || !v) {
          diffs.push(`${part}: ${r ? 'missing' : 'n/a in ref'}`);
          continue;
        }

        for (const p of Object.keys(r)) {
          if (r[p] !== v[p]) {
            diffs.push(`${part}.${p}: ${r[p]} -> ${v[p]}`);
          }
        }
      }

      diffs.push(`triggerHeight ${ref[phase].triggerHeight} -> ${h[phase].triggerHeight}`);
      diffs.push(`accordionHeight ${ref[phase].accordionHeight} -> ${h[phase].accordionHeight}`);
      console.log(`--- ${k} ${phase}: ${diffs.length} lines`);
      console.log('   ' + diffs.join('\n   '));
    }

    if (eng === 'chromium') {
      console.log(`--- ${k} selectors (open):`, JSON.stringify(h.selectorsOpen));
    }
  }

  if (eng === 'chromium') {
    console.log('--- ref selectors (open):', JSON.stringify(ref.selectorsOpen));
    console.log('--- b heading', JSON.stringify(pages.b.hydrated.stylesClosed.heading));
  }
}
