// PROTOTYPE (ticket 24): compare the snapshots. Writes results.json and prints a summary.
import { readFileSync, writeFileSync } from 'node:fs';

const engines = ['chromium', 'firefox', 'webkit'];
const mixed = ['TY', 'YT', 'S1', 'S1n', 'S3'];
const sectionOf = (k) => (k === ':root' || k === 'body' ? k : k.split('/')[0].replace(/::.*/, ''));
const yetiSections = ['base', 'yeti', 'utils-on-yeti', 'tokens', 'lazy', 'card-plain', 'card-utils', ':root', 'body', 'center-in-stack', 'grid', 'table', 'container', 'hidden-attr', 'button-utils', 'alert-utils', 'stack-hidden', 'p-utils', 'tok-yeti', 'tok-yeti-in-tw', 'tok-tw'];
const twSections = ['tw', 'tw-box', 'tw-button', 'tw-list', 'tw-h2', 'tw-flex', 'tw-link', 'tw-dark'];
// keys that carry a utility, and the properties the utility sets
const utilityProbes = {
  'button-utils': ['padding-top', 'margin-top', 'background-color', 'color', 'display'],
  'alert-utils': ['padding-left', 'background-color', 'color', 'display'],
  'stack-hidden': ['display', 'row-gap'],
  'p-utils': ['font-size', 'font-weight', 'text-decoration-line'],
  'card-utils': ['padding-top', 'background-color', 'color', 'display'],
};
const collisionProbes = {
  grid: ['display', 'grid-template-columns', 'width'],
  table: ['display', 'width', 'border-collapse'],
  container: ['container-type', 'width', 'max-width'],
  'hidden-attr': ['display'],
  'center-in-stack': ['margin-left', 'margin-right', 'max-width'],
};
const tokenProbes = {
  ':root': ['color-scheme', '--yeti-color-primary', '--yeti-color-surface', '--yeti-space-md', '--color-red-500', '--spacing', '--font-sans', 'font-family', 'line-height', 'background-color', 'color'],
  body: ['background-color', 'color', 'font-family', 'line-height', 'margin-top'],
  'tok-yeti': ['color', 'background-color'],
  'tok-tw': ['color', 'padding-top'],
  'tok-yeti-in-tw': ['background-color', 'color', 'padding-top'],
  'tw-dark': ['background-color', 'color'],
  'card-plain': ['background-color', 'color'],
};

const diff = (a, b, filter) => {
  const out = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (filter && !filter(k)) {
      continue;
    }
    const x = a[k];
    const y = b[k];
    if (!x || !y) {
      out.push({ k, missing: !x ? 'a' : 'b' });
      continue;
    }
    for (const p of Object.keys(x)) {
      if (p.startsWith('--')) {
        continue;
      }
      if (x[p] !== y[p]) {
        out.push({ k, p, a: x[p], b: y[p] });
      }
    }
  }
  return out;
};
const summarize = (d) => {
  const els = new Set(d.map((x) => x.k));
  const props = {};
  for (const x of d) {
    if (x.p) {
      props[x.p] = (props[x.p] ?? 0) + 1;
    }
  }
  return {
    elements: els.size,
    declarations: d.length,
    topProps: Object.entries(props).sort((a, b) => b[1] - a[1]).slice(0, 12),
    bySection: [...els].reduce((m, k) => ((m[sectionOf(k)] = (m[sectionOf(k)] ?? 0) + 1), m), {}),
    samples: d,
  };
};
const isYeti = (k) => !twSections.includes(sectionOf(k));
const isTw = (k) => twSections.includes(sectionOf(k));
const pick = (snap, key, props) => Object.fromEntries(props.map((p) => [p, snap[key]?.[p]]));

const results = {};
for (const en of engines) {
  const s = JSON.parse(readFileSync(`D:/tmp/ngx-yeti-24/measure/snap-${en}.json`, 'utf8'));
  const r = (results[en] = { version: s.version });
  for (const scheme of ['light', 'dark']) {
    const R = (c) => s.runs[`${c}/${scheme}`];
    const sc = (r[scheme] = {});
    sc.layers = Object.fromEntries(Object.keys(s.runs).filter((k) => k.endsWith(scheme)).map((k) => [k.split('/')[0], { order: s.runs[k].layers.order, sheets: s.runs[k].layers.sheets, afterInsert: s.runs[k].insertedLayers.order }]));
    // Y vs Y0: what the Tailwind PostCSS plugin alone does to Yeti
    sc.pluginOnly = summarize(diff(R('Y0').inserted, R('Y').inserted, isYeti));
    sc.vsYeti = {};
    sc.vsTailwind = {};
    for (const c of mixed) {
      // utility probe elements are expected to differ: exclude their utility props later, report all here
      sc.vsYeti[c] = summarize(diff(R('Y0').inserted, R(c).inserted, isYeti));
      sc.vsTailwind[c] = summarize(diff(R('T').before, R(c).before, isTw));
    }
    // utility probes: value in Yeti alone, Tailwind alone, and each mix
    sc.utilities = {};
    for (const [k, props] of Object.entries(utilityProbes)) {
      sc.utilities[k] = Object.fromEntries(['Y0', 'T', ...mixed].map((c) => [c, pick(R(c).inserted, k, props)]));
    }
    sc.collisions = {};
    for (const [k, props] of Object.entries(collisionProbes)) {
      sc.collisions[k] = Object.fromEntries(['Y0', 'T', ...mixed].map((c) => [c, pick(R(c).inserted, k, props)]));
    }
    sc.tokens = {};
    for (const [k, props] of Object.entries(tokenProbes)) {
      sc.tokens[k] = Object.fromEntries(['Y0', 'T', ...mixed].map((c) => [c, pick(R(c).inserted, k, props)]));
    }
    if (scheme === 'dark') {
      sc.forcedLight = {};
      for (const k of ['tw-dark', 'tok-yeti', 'body']) {
        sc.forcedLight[k] = Object.fromEntries(['Y0', 'T', ...mixed].map((c) => [c, pick(R(c).forcedLight, k, ['background-color', 'color'])]));
      }
    }
    // lazy part: insert vs Yeti alone (card subtree), unload vs before, reinsert vs insert, fresh vs reinsert
    sc.lazy = {};
    for (const c of ['Y0', 'Y', ...mixed]) {
      const lazyKey = (k) => k.startsWith('card-') || k.startsWith('lazy');
      sc.lazy[c] = {
        styleCounts: [R(c).insertedCardStyles, R(c).removedCardStyles, R(c).reinsertedCardStyles],
        layersChangedOnInsert: JSON.stringify(R(c).layers.order) !== JSON.stringify(R(c).insertedLayers.order),
        cardVsYetiAlone: summarize(diff(R('Y0').inserted, R(c).inserted, (k) => k.startsWith('card-plain'))).declarations,
        removedVsBefore: summarize(diff(R(c).before, R(c).removed)),
        reinsertedVsInserted: summarize(diff(R(c).inserted, R(c).reinserted)),
        freshVsReinserted: summarize(diff(R(c).reinserted, R(c).reinsertedFresh, (k) => !lazyKey(k) || true)),
        cardBeforeInsert: Object.keys(R(c).before).filter(lazyKey).length,
      };
    }
  }
}
writeFileSync('D:/tmp/ngx-yeti-24/measure/results.json', JSON.stringify(results, null, 2));

const brief = (x) => `${x.elements} el / ${x.declarations} decl ${JSON.stringify(x.bySection)} top ${x.topProps.map((p) => p.join(':')).join(' ')}`;
for (const en of engines) {
  for (const scheme of ['light', 'dark']) {
    const sc = results[en][scheme];
    console.log(`\n##### ${en} ${scheme}`);
    console.log('plugin only (Y vs Y0):', brief(sc.pluginOnly));
    for (const c of mixed) {
      console.log(`${c} vs Yeti alone:`, brief(sc.vsYeti[c]));
      console.log(`${c} vs Tailwind alone:`, brief(sc.vsTailwind[c]));
    }
    for (const c of ['Y0', 'Y', ...mixed]) {
      const l = sc.lazy[c];
      console.log(`lazy ${c}: styles ${l.styleCounts} layersChanged ${l.layersChangedOnInsert} cardVsY0 ${l.cardVsYetiAlone} removedVsBefore ${l.removedVsBefore.declarations} reinsVsIns ${l.reinsertedVsInserted.declarations} freshVsReins ${l.freshVsReinserted.declarations} cardBefore ${l.cardBeforeInsert}`);
    }
  }
}
