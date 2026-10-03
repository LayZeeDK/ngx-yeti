// PROTOTYPE (ticket 29): prints results/<engine>.json side by side. Usage: node tools/summary.mjs [section]
import { readFileSync } from 'node:fs';

const engines = ['chromium', 'firefox', 'webkit'];
const R = Object.fromEntries(engines.map((e) => [e, JSON.parse(readFileSync(`results/${e}.json`, 'utf8'))]));
const section = process.argv[2];
const line = (k, f) => console.log(`${k}\t${engines.map((e) => JSON.stringify(f(R[e]))).join('\t')}`);

console.log('engines', engines.map((e) => `${e} ${R[e].version}`).join(', '));

if (!section || section === 'styles') {
  for (const e of engines) {
    if (R[e].styles.error) {
      console.log(e, R[e].styles.error);
      continue;
    }

    for (const [k, v] of Object.entries(R[e].styles.diffs)) {
      if (typeof v !== 'object') {
        console.log(e, k, v);
        continue;
      }

      const d = v.styleDiffs.filter((x) => !/hvTrigger\.rect/.test(x));
      console.log(e, k, 'diffs', d.length, d.slice(0, 12), 'lost', v.selectorsLost, 'gained', v.selectorsGained, JSON.stringify(v.openAfterMore));
    }
  }
}

if (!section || section === 'behaviours') {
  for (const p of ['/ref.html', '/a', '/b']) {
    const keys = new Set(engines.flatMap((e) => Object.keys(R[e].behaviours[p] || {})));

    for (const k of keys) {
      line(`${p} ${k}`, (r) => r.behaviours[p]?.[k]);
    }
  }
}

if (!section || section === 'modes') {
  const keys = Object.keys(R.chromium.renderingModes);

  for (const k of keys) {
    for (const f of Object.keys(R.chromium.renderingModes[k])) {
      line(`${k} ${f}`, (r) => r.renderingModes[k]?.[f]);
    }
  }
}

if (!section || section === 'a11y') {
  for (const e of engines) {
    for (const [k, v] of Object.entries(R[e].a11y)) {
      console.log(`--- ${e} ${k}`);
      console.log(JSON.stringify(v, null, 1));
    }
  }
}
