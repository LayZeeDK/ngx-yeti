// Tabulates results/probe-<build>.json into results/summary-<build>.txt. Engines that agree are merged.
import fs from 'node:fs';

const build = process.env.BUILD ?? 'dev';
const files = fs.readdirSync('results').filter((f) => f.startsWith(`probe-${build}-`) && f.endsWith('.json'));
const j = { server: {}, engines: {} };
for (const f of files) {
  const x = JSON.parse(fs.readFileSync(`results/${f}`, 'utf8'));
  Object.assign(j.server, x.server);
  for (const [e, cs] of Object.entries(x.engines)) j.engines[e] = { ...j.engines[e], ...cs };
}
const lines = [];
const p = (s) => lines.push(s);
const ct = (dataT) => (dataT ?? []).filter((t) => /^(card|fallback|count)/.test(t)).join(',') || '-';
const lk = (links) => {
  const c = {};
  for (const l of links ?? []) c[l] = (c[l] ?? 0) + 1;
  return Object.entries(c).map(([k, v]) => (v > 1 ? `${k}x${v}` : k)).join(',') || '-';
};
const snap = (s) =>
  s
    ? `[${ct(s.dataT)}] links=${lk(s.links)} cards=${s.cards.map((c) => `${c.t}#${c.id}:${c.pad}`).join(';') || '-'} dupIds=${s.dupIds.join(',') || 0} unresolved=${s.unresolvedRefs.join(',') || 0}${s.eh.length ? ` eh=${s.eh.join(' | ')}` : ''}`
    : 'n/a';
const ng = (msgs) => (msgs ?? []).filter((m) => /NG0\d{3}|hydrat|EH |pageerror|error:/i.test(m)).map((m) => m.replace(/Learn more at \S+/, '').replace(/ 0 defer block\(s\) were configured to use incremental hydration\./, '')).join(' || ');

p(`# Ticket 37 probe summary, ${build} build`);
for (const [c, s] of Object.entries(j.server)) {
  p('');
  p(`## ${c}`);
  p(`server: status=${s.status} [${ct(s.dataT)}] links=${lk(s.links)} ids=${s.ids.filter((i) => i.startsWith('ngx')).join(',')} dupIds=${s.dupIds.length} unresolved=${s.unresolvedRefs.length} seed=${JSON.stringify(s.seed)} ngh=${s.ngh}`);
  if (s.log.length) p(`server log: ${s.log.join(' || ')}`);
  const per = {};
  for (const [eng, cases] of Object.entries(j.engines)) {
    const r = cases[c];
    if (!r) continue;
    const out = [];
    out.push(`  js off: ${snap(r.jsOff)}`);
    for (const k of ['jsOn300', 'jsOn0']) {
      const x = r[k];
      if (!x) continue;
      out.push(`  ${k} load: ${snap(x.load)}`);
      for (const key of ['afterInteract', 'afterClick', 'afterArm', 'after_resetA', 'after_resetB']) if (x[key]) out.push(`  ${k} ${key}: ${snap(x[key])}`);
      out.push(`  ${k} unstyled frames: ${Object.entries(x.unstyled).map(([l, u]) => `${l}=${u.unstyled}/${u.frames}${u.cards.length ? `(${u.cards})` : ''}`).join(' ')}`);
      out.push(`  ${k} link events: ${x.linkEv.join('; ')}`);
      out.push(`  ${k} card/fallback DOM: ${[...new Set(x.dom)].join('; ')} | marks: ${x.marks.join('; ')}`);
      out.push(`  ${k} console: ${ng(x.console) || '-'}`);
    }
    if (r.replay) out.push(`  replay: clicked=${r.replay.clicked} scriptLoadedBefore=${r.replay.mainLoadedBefore}/${r.replay.mainLoadedAfterClicks} -> countA=${r.replay.after.countA} countB=${r.replay.after.countB} ${snap(r.replay.after)}`);
    // Times and frame totals differ by engine; compare without them.
    const key = out.map((l) => l.replace(/\d+(\.\d+)? (add|remove)/g, '$2').replace(/\/\d+/g, '').replace(/\d+ (interact|click|arm|reset[AB])/g, '$1')).join('\n');
    (per[key] ??= { engines: [], out }).engines.push(eng);
  }
  for (const { engines, out } of Object.values(per)) {
    p(`${engines.join('+')}:`);
    for (const l of out) p(l);
  }
}
fs.writeFileSync(`results/summary-${build}.txt`, lines.join('\n'));
console.log(`results/summary-${build}.txt`, lines.length, 'lines');
