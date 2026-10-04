// Summary table for one results-<browser>.json. Also runnable: node summarize.mjs results-x.json
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const med = (xs) => {
  const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);

  return s.length ? `${Math.round(s[Math.floor(s.length / 2)])} (${Math.round(s[0])}..${Math.round(s.at(-1))})` : 'n/a';
};
const fcp = (p) => p.paints?.['first-contentful-paint'];
const lateEnd = (p) => p.res?.['late.css']?.end;
const mainEnd = (p) => p.res?.['main.js']?.end;
// "Waited for main.js": first frame no earlier than 50 ms before main.js finished
// loading. main.js finishes at ~3000 ms; everything else at <= ~320 ms.
const waited = (t, p) => Number.isFinite(t) && Number.isFinite(mainEnd(p)) && t >= mainEnd(p) - 50;

export function summarize({ version, preMs, variants, rows, shot }) {
  const out = [];
  const runs = Math.max(...rows.map((x) => x.run)) + 1;
  out.push(`\n## ${version}: ${runs} runs per variant, late.css delay ${preMs} ms\n`);
  out.push('ms of document time, median (min..max). stall = 0 rAF ticks at the first report (1500 ms) with main.js not yet run.');
  out.push('waited = first rAF tick (or FCP) no earlier than 50 ms before main.js finished loading.\n');
  out.push('| variant | setup | reports | stalls | ticks @1500 | first tick | FCP | late.css end | interactive | main.js end | first tick - main.js end | tick waited | FCP waited | visibility |');
  out.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');

  for (const [key, v] of Object.entries(variants)) {
    const vr = rows.filter((x) => x.variant === key);
    const first = vr.map((x) => x.reports[0]).filter(Boolean);
    const last = vr.map((x) => x.reports.at(-1)).filter(Boolean);
    const early = v.reportAt.length > 1 || v.main === 'none';
    const setup = `pre=${v.pre}${v.bodyMs ? ` body+${v.bodyMs}` : ''} main=${v.main === 'none' ? 'none' : `+${v.mainMs}`}`;
    const stalls = early ? `${first.filter((p) => p.ticks === 0 && p.mainAt === null).length}/${first.length}` : '-';
    const vis = [...new Set(first.map((p) => `${p.visNow}/${p.hasFocus ? 'focus' : 'nofocus'}`))].join(',');
    const hasMain = v.main !== 'none';
    out.push(
      `| ${key} | ${setup} | ${first.length}/${vr.length} | ${stalls} | ${early ? med(first.map((p) => p.ticks)) : '-'} | ` +
        `${med(last.map((p) => p.firstTick))} | ${med(last.map(fcp))} | ${med(last.map(lateEnd))} | ${med(last.map((p) => p.rs.interactive))} | ` +
        `${hasMain ? med(last.map(mainEnd)) : '-'} | ${hasMain ? med(last.map((p) => p.firstTick - mainEnd(p))) : '-'} | ` +
        `${hasMain ? `${last.filter((p) => waited(p.firstTick, p)).length}/${last.length}` : '-'} | ` +
        `${hasMain ? `${last.filter((p) => waited(fcp(p), p)).length}/${last.filter((p) => Number.isFinite(fcp(p))).length}` : '-'} | ${vis} |`,
    );
  }

  const pr = rows.filter((x) => x.variant === 'P').map((x) => x.reports[0]).filter(Boolean);
  out.push(`\n### Product case P (late.css +${preMs} ms, main.js +3000 ms, nothing held)\n`);
  out.push(`- first rAF tick waited for main.js: ${pr.filter((p) => waited(p.firstTick, p)).length}/${pr.length}`);
  out.push(`- FCP waited for main.js: ${pr.filter((p) => waited(fcp(p), p)).length}/${pr.filter((p) => Number.isFinite(fcp(p))).length} (runs with an FCP entry; paint timing supported: ${pr[0]?.paintSupported})`);
  out.push(`- first tick: ${med(pr.map((p) => p.firstTick))}; minus late.css end: ${med(pr.map((p) => p.firstTick - lateEnd(p)))}; minus main.js end: ${med(pr.map((p) => p.firstTick - mainEnd(p)))}`);
  out.push(`- FCP: ${med(pr.map(fcp))}; minus late.css end: ${med(pr.map((p) => fcp(p) - lateEnd(p)))}; minus main.js end: ${med(pr.map((p) => fcp(p) - mainEnd(p)))}`);
  out.push(`- interactive: ${med(pr.map((p) => p.rs.interactive))}; load: ${med(pr.map((p) => p.load))}`);

  if (shot) {
    const [a, b] = shot.reports;
    out.push(`\n### Screenshot run (variant A, screenshot at ~1700 ms)\n`);
    out.push(`- ticks @1500: ${a?.ticks}; ticks before main.js ran: ${b?.ticksBeforeMain}; first tick: ${b?.firstTick?.toFixed(0)}; main.js end: ${b && mainEnd(b)?.toFixed(0)}`);
  }

  out.push(`\nuser agent: ${rows[0]?.reports[0]?.ua}`);

  return out.join('\n');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(summarize(JSON.parse(readFileSync(process.argv[2], 'utf8'))));
}
