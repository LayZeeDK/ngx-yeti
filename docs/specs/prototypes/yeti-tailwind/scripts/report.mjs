// Print the detail tables from results.json (one engine and scheme at a time).
import { readFileSync } from 'node:fs';

const r = JSON.parse(readFileSync('D:/tmp/ngx-yeti-24/measure/results.json', 'utf8'));
const [en = 'chromium', scheme = 'light', what = 'all'] = process.argv.slice(2);
const sc = r[en][scheme];
// properties preflight sets that Yeti never declares and that do not change rendering on their own
const quiet = new Set(['tab-size', '-moz-tab-size', '-webkit-tap-highlight-color']);
const isBorderStyle = (p) => /^border-.*style$/.test(p);
const visible = (x, samples) => {
  if (!x.p || quiet.has(x.p)) {
    return false;
  }
  if (isBorderStyle(x.p)) {
    // only counts when that side has a width
    const side = x.p.replace('-style', '-width');
    const w = samples.find((y) => y.k === x.k && y.p === side);
    return Boolean(w);
  }
  return true;
};
const show = (title, s) => {
  const v = s.samples.filter((x) => visible(x, s.samples));
  const els = [...new Set(v.map((x) => x.k))];
  console.log(`\n-- ${title}: ${v.length} visible-candidate declarations on ${els.length} elements (of ${s.declarations} on ${s.elements})`);
  const byEl = {};
  for (const x of v) {
    (byEl[x.k] ??= []).push(`${x.p}: ${x.a} -> ${x.b}`);
  }
  for (const [k, list] of Object.entries(byEl)) {
    console.log(`  ${k}: ${list.slice(0, 8).join(' | ')}${list.length > 8 ? ` (+${list.length - 8})` : ''}`);
  }
};
if (what === 'all' || what === 'diff') {
  for (const c of ['TY', 'YT', 'S1', 'S3']) {
    show(`${c} vs Yeti alone`, sc.vsYeti[c]);
  }
}
if (what === 'all' || what === 'tw') {
  for (const c of ['TY', 'YT', 'S1', 'S3']) {
    show(`${c} vs Tailwind alone`, sc.vsTailwind[c]);
  }
}
if (what === 'all' || what === 'probes') {
  for (const group of ['utilities', 'collisions', 'tokens', 'forcedLight']) {
    if (!sc[group]) {
      continue;
    }
    console.log(`\n== ${group}`);
    for (const [k, byConfig] of Object.entries(sc[group])) {
      console.log(` ${k}`);
      for (const [c, vals] of Object.entries(byConfig)) {
        console.log(`   ${c.padEnd(3)} ${Object.entries(vals).map(([p, v]) => `${p}=${v}`).join('; ')}`);
      }
    }
  }
  console.log('\n== layers');
  for (const [c, l] of Object.entries(sc.layers)) {
    console.log(` ${c}: ${l.order.join(', ')} | sheets ${l.sheets.join(' ')}`);
  }
}
