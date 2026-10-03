// PROTOTYPE (ticket 24): one table per question, all engines and schemes. Writes summary.json.
import { readFileSync, writeFileSync } from 'node:fs';

const r = JSON.parse(readFileSync('D:/tmp/ngx-yeti-24/measure/results.json', 'utf8'));
const engines = ['chromium', 'firefox', 'webkit'];
const mixed = ['TY', 'YT', 'S1', 'S1n', 'S3'];
const quiet = new Set(['tab-size', '-moz-tab-size', '-webkit-tap-highlight-color']);
// sizes and origins follow from other changes; keep the declarations that are set on the element
const derived = /^(block-size|height|inline-size|width|perspective-origin|transform-origin|max-inline-size|max-width|min-block-size|min-height|min-inline-size|min-width)$/;
const visible = (x, all) => {
  if (!x.p || quiet.has(x.p) || derived.test(x.p)) {
    return false;
  }
  if (/^border-.*style$/.test(x.p)) {
    return all.some((y) => y.k === x.k && y.p === x.p.replace('-style', '-width'));
  }
  return true;
};
// Yeti-authored markup without utilities; utility probes and Tailwind-token rows are expected to differ
const yetiOnly = (k) => /^(base\/|yeti\/|card-plain|center-in-stack|grid|table|container|hidden-attr)/.test(k);
const out = {};
for (const en of engines) {
  for (const scheme of ['light', 'dark']) {
    const sc = r[en][scheme];
    for (const c of mixed) {
      const all = sc.vsYeti[c].samples;
      const v = all.filter((x) => yetiOnly(x.k) && visible(x, all));
      const props = {};
      for (const x of v) {
        props[x.p] = (props[x.p] ?? 0) + 1;
      }
      const key = `${c}`;
      out[key] ??= {};
      out[key][`${en}/${scheme}`] = {
        yetiElementsChanged: new Set(v.map((x) => x.k)).size,
        declarations: v.length,
        props: Object.keys(props).sort().join(' '),
        utilitiesWin: Object.entries(sc.utilities).filter(([, byC]) => JSON.stringify(byC[c]) === JSON.stringify(byC.T)).map(([k]) => k).join(' '),
        lazy: sc.lazy[c],
      };
    }
  }
}
const compact = {};
for (const [c, byRun] of Object.entries(out)) {
  const runs = Object.values(byRun);
  compact[c] = {
    yetiElementsChanged: runs.map((x) => x.yetiElementsChanged).join('/'),
    sameAcrossRuns: new Set(runs.map((x) => x.props)).size === 1,
    props: runs[0].props,
    utilitiesWin: [...new Set(runs.map((x) => x.utilitiesWin))],
    lazy: runs.map((x) => `ins:${x.lazy.styleCounts} cardVsY0:${x.lazy.cardVsYetiAlone} unload:${x.lazy.removedVsBefore.declarations} reins:${x.lazy.reinsertedVsInserted.declarations} fresh:${x.lazy.freshVsReinserted.declarations} layersMoved:${x.lazy.layersChangedOnInsert}`),
  };
}
for (const en of engines) {
  compact[`pluginOnly ${en}`] = ['light', 'dark'].map((s) => r[en][s].pluginOnly.declarations).join('/');
}
writeFileSync('D:/tmp/ngx-yeti-24/measure/summary.json', JSON.stringify({ compact, detail: out }, null, 2));
console.log(JSON.stringify(compact, null, 1));
