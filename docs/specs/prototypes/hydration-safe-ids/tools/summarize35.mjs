// PROTOTYPE (ticket 35): one line per engine, mode, and case from results/probe35.json.
import { readFileSync } from 'node:fs';

const r = JSON.parse(readFileSync(new URL('../results/probe35.json', import.meta.url), 'utf8'));
const lines = [];

lines.push('# Concurrency (server HTML only): two concurrent requests A and B, then a third sequential one');

for (const [k, v] of Object.entries(r.concurrent)) {
  lines.push(`${k}: A==B ${v.equalAB}, A==third ${v.equalAThird}`);
  lines.push(`  A     ${v.a.join(' ')}`);
  lines.push(`  B     ${v.b.join(' ')}`);
  lines.push(`  third ${v.third.join(' ')}`);
}

for (const eng of ['chromium', 'firefox', 'webkit']) {
  if (!r[eng]) {
    continue;
  }

  lines.push('', `# ${eng}`);

  for (const [k, v] of Object.entries(r[eng])) {
    const s = (x) =>
      `dup ${x.dup.length ? x.dup.join(',') : 0}; unresolved ${x.unresolved.length ? x.unresolved.map((u) => `${u.set}:${u.a}=${u.v}(${u.n})`).join(',') : 0}; ${x.hydrated.join(' ')}`;
    const ng = v.console.filter((c) => /NG0\d/.test(c) && !/hydrated/.test(c));
    const hyd = v.console.find((c) => /hydrated/.test(c));
    lines.push(`${k}: rewrites ${v.writes.length}; changed-from-server ${v.missingFromServer.length}; NG0 ${ng.length ? ng.join(' | ') : 0}`);

    if (v.beforeBlock) {
      lines.push(`  before block hydration: ${s(v.beforeBlock)}`);
    }

    lines.push(`  after: ${s(v.after)}`);

    if (v.afterAdd) {
      lines.push(`  after 2 adds: ${s(v.afterAdd)}`);
    }

    if (v.writes.length) {
      lines.push(`  writes: ${v.writes.slice(0, 6).join('; ')}${v.writes.length > 6 ? ' ...' : ''}`);
    }

    const other = v.console.filter((c) => !/hydrated/.test(c) && !ng.includes(c));

    if (other.length) {
      lines.push(`  console: ${other.slice(0, 3).join(' | ')}`);
    }

    if (hyd) {
      lines.push(`  ${hyd}`);
    }
  }
}

console.log(lines.join('\n'));
