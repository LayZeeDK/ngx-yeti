// Lists every case/engine/step where the dev and prod builds differ in DOM state, links, ids,
// error-handler path, or replay outcome (frame counts and times excluded).
import fs from 'node:fs';

const load = (build) => {
  const j = { server: {}, engines: {} };
  for (const f of fs.readdirSync('results').filter((f) => f.startsWith(`probe-${build}-`) && f.endsWith('.json'))) {
    const x = JSON.parse(fs.readFileSync(`results/${f}`, 'utf8'));
    Object.assign(j.server, x.server);
    for (const [e, cs] of Object.entries(x.engines)) j.engines[e] = { ...j.engines[e], ...cs };
  }
  return j;
};
const key = (s) => s && JSON.stringify([s.dataT, s.links, s.cards?.map((c) => [c.t, c.id]), s.dupIds, s.unresolvedRefs, s.eh, s.countA, s.countB]);
const dev = load('dev');
const prod = load('prod');
let diffs = 0;
for (const [c, s] of Object.entries(dev.server)) {
  const p = prod.server[c];
  if (!p) { console.log(`missing in prod: ${c}`); continue; }
  for (const k of ['dataT', 'links', 'ids', 'seed']) if (JSON.stringify(s[k]) !== JSON.stringify(p[k])) { diffs++; console.log(`server ${c} ${k}: dev=${JSON.stringify(s[k])} prod=${JSON.stringify(p[k])}`); }
}
for (const [e, cases] of Object.entries(dev.engines)) {
  for (const [c, r] of Object.entries(cases)) {
    const q = prod.engines[e]?.[c];
    if (!q) continue;
    const steps = [['jsOff', r.jsOff, q.jsOff], ['replay', r.replay?.after, q.replay?.after]];
    for (const run of ['jsOn300', 'jsOn0']) for (const st of ['load', 'afterInteract', 'afterClick', 'afterArm', 'after_resetA', 'after_resetB']) steps.push([`${run}.${st}`, r[run]?.[st], q[run]?.[st]]);
    for (const [n, a, b] of steps) if (key(a) !== key(b)) { diffs++; console.log(`${e} ${c} ${n}:\n  dev =${key(a)}\n  prod=${key(b)}`); }
  }
}
console.log(`${diffs} differences`);
