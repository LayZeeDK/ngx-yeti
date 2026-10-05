// Round 2: the three finalists that passed local WebKit, Chromium and Firefox
// (V5+V1, V0+svg, V4+V1) against the V0 and V1 controls, on the page shape
// that delayed V4+V1 in the first real-Safari round: two module scripts, each
// +3000 ms. late.css +300 ms; the client-only item renders 200 ms after
// main.js runs.
//
//   node round2.mjs --browser=safari|webkit|chromium|firefox --text=176|301 [--runs=20] [--port=8080] [--out=<dir>]
import { createServer } from 'node:http';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { arg, driverFor, med, probeScript, sleep } from './probe.mjs';

const browserName = arg('browser', 'safari');
const runs = Number(arg('runs', 20));
const port = Number(arg('port', 8080));
const outDir = resolve(arg('out', fileURLToPath(new URL('.', import.meta.url))));
// Visible non-whitespace characters: the base page has about 101; 176 and 301 sit on either side of WebKit's 200.
const text = Number(arg('text', 176));
const only = arg('variants', '');
const words = (n) => Array.from({ length: n }, (_, i) => `word${i % 10}`).join(' ');
const extraText = text >= 301 ? words(40) : text >= 176 ? words(15) : '';
const preMs = 300;
const moduleMs = 3000;
const itemMs = 200;
const reportAt = [1500, 4500];

const preload = (h) => `<link rel="preload" as="style" href="${h}">`;
// Out of flow and off screen, so it takes no layout space and paints nothing visible.
const svgOff = '<svg width="40" height="40" aria-hidden="true" style="position:absolute;left:-9999px"></svg>';
// The form measured locally in the targeting lane: in flow.
const svgIn = '<svg width="40" height="40" aria-hidden="true"></svg>';
// The size in the style attribute too, the form that survives Yeti's reset (`svg { block-size: auto }`).
const svgOffSized = '<svg width="40" height="40" aria-hidden="true" style="position:absolute;left:-9999px;width:40px;height:40px"></svg>';

// head: the server's tag at the end of <head>; bodyStart: first in <body>.
// clientPreload: main.js adds <link rel=preload as=style> when it runs (V1).
const all = {
  V0: { head: preload, clientPreload: false, what: 'control: server preload as=style (today)' },
  V1: { head: () => '', clientPreload: true, what: 'control: client preload only' },
  V5V1: { head: (h) => `<link rel="prefetch" href="${h}">`, clientPreload: true, what: 'server rel=prefetch + client preload' },
  V0svg: { head: preload, bodyStart: svgOff, clientPreload: false, what: 'V0 + 40x40 svg, position:absolute;left:-9999px, first in body' },
  V0svgS: { head: preload, bodyStart: svgOffSized, clientPreload: false, what: 'V0 + 40x40 svg, style position:absolute;left:-9999px;width:40px;height:40px, first in body' },
  V0svgIn: { head: preload, bodyStart: svgIn, clientPreload: false, what: 'V0 + 40x40 svg in flow, first in body' },
  V4V1: { head: (h) => `<link rel="stylesheet" href="${h}" media="not all">`, clientPreload: true, what: 'server stylesheet media="not all" at end of head + client preload' },
};
const variants = Object.fromEntries(Object.entries(all).filter(([k]) => !only || only.split(',').includes(k)));

const lateHref = (r) => `late.css?r=${r}`;

function page(v, r) {
  const x = variants[v];

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<script>${probeScript(r, reportAt)}</script>
<title>preload prototype</title>
<link rel="stylesheet" href="fast.css?r=${r}">
${x.head(lateHref(r))}
</head>
<body>
${x.bodyStart ?? ''}
<h1>Visible text: preload round 2</h1>
<p>late.css +${preMs} ms, both module scripts +${moduleMs} ms, client-only item ${itemMs} ms after main.js</p>
${extraText ? `<p>${extraText}</p>` : ''}
<script type="module" src="poly.js?r=${r}"></script>
<script type="module" src="main.js?r=${r}&v=${v}"></script>
</body>
</html>
`;
}

const polyJs = 'const p = window.__probe; p.polyAt = performance.now(); p.ticksBeforePoly = p.ticks;\n';

function mainJs(v, r) {
  const add = (attrs) =>
    `{ const l = document.createElement('link'); ${Object.entries(attrs)
      .map(([k, val]) => `l.setAttribute(${JSON.stringify(k)}, ${JSON.stringify(val)});`)
      .join(' ')} document.head.appendChild(l); }`;

  return `const p = window.__probe; p.mainAt = performance.now(); p.ticksBeforeMain = p.ticks;
${variants[v].clientPreload ? add({ rel: 'preload', as: 'style', href: lateHref(r) }) : ''}
setTimeout(() => {
  ${add({ rel: 'stylesheet', href: lateHref(r) })}
  const el = document.createElement('div'); el.className = 'item'; el.textContent = 'client-only item';
  document.body.appendChild(el); p.itemAt = performance.now();
}, ${itemMs});
`;
}

const reports = new Map();
const lateHits = new Map();

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const q = url.searchParams;
  const r = (q.get('r') ?? '0').replace(/[^\w-]/g, '');
  const send = (type, body, cache = 'no-store') => {
    res.writeHead(200, { 'content-type': type, 'cache-control': cache });
    res.end(body);
  };
  res.on('error', () => {});
  req.on('error', () => {});

  if (url.pathname === '/') {
    return send('text/html; charset=utf-8', page(q.get('v'), r));
  }

  if (url.pathname === '/blank.html') {
    return send('text/html; charset=utf-8', '<!doctype html><title>blank</title><p>blank</p>');
  }

  if (url.pathname === '/report' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        reports.set(r, [...(reports.get(r) ?? []), JSON.parse(body)]);
      } catch {
        // ignore a malformed report
      }
      send('text/plain', 'ok');
    });

    return;
  }

  if (url.pathname === '/fast.css') {
    return send('text/css', 'body { font: 24px/1.4 sans-serif; background: #fff; color: #111; }');
  }

  if (url.pathname === '/late.css') {
    lateHits.set(r, [...(lateHits.get(r) ?? []), { dest: req.headers['sec-fetch-dest'] ?? null, purpose: req.headers['sec-purpose'] ?? req.headers.purpose ?? null }]);
    await sleep(preMs);

    // Cacheable, like the app's express.static (maxAge 1y); the run id keeps loads apart.
    return send('text/css', '.item { color: rgb(0, 102, 51); }', 'public, max-age=31536000');
  }

  if (url.pathname === '/poly.js') {
    await sleep(moduleMs);

    return send('text/javascript', polyJs);
  }

  if (url.pathname === '/main.js') {
    await sleep(moduleMs);

    return send('text/javascript', mainJs(q.get('v'), r));
  }

  res.writeHead(404, { 'cache-control': 'no-store' });
  res.end();
});

await new Promise((done) => server.listen(port, '127.0.0.1', done));
const driver = await driverFor(browserName, `http://127.0.0.1:${port}/blank.html`);
console.log(`browser: ${driver.version}; ${text} visible chars`);

const resEnd = (p, path) => {
  const ends = (p?.res ?? []).filter((e) => e.path === path).map((e) => e.end);

  return ends.length ? Math.min(...ends) : undefined;
};

async function once(v, i) {
  const r = `${v}${i}-${Date.now()}`;
  await driver.open(`http://127.0.0.1:${port}/?v=${v}&r=${r}`);
  const deadline = Date.now() + Math.max(...reportAt) + 4000;

  while ((reports.get(r)?.length ?? 0) < reportAt.length && Date.now() < deadline) {
    await sleep(100);
  }

  await driver.close();
  const got = (reports.get(r) ?? []).sort((a, b) => a.at - b.at);
  const [early, last] = got;
  const ticksBeforeModule = Math.min(last?.ticksBeforePoly ?? Infinity, last?.ticksBeforeMain ?? Infinity);
  const row = {
    variant: v,
    run: i,
    reports: got.length,
    // 0 frames at 1500 ms, with both module scripts still pending (each +3000 ms).
    stall: early ? early.ticks === 0 && early.polyAt === null && early.mainAt === null : null,
    ticks1500: early?.ticks,
    ticksBeforeModule: Number.isFinite(ticksBeforeModule) ? ticksBeforeModule : undefined,
    firstTick: last?.firstTick,
    fcp: last?.paints?.['first-contentful-paint'],
    dcl: last?.dcl,
    lateEnd: resEnd(last, '/late.css'),
    lateStart: (last?.res ?? []).filter((e) => e.path === '/late.css').map((e) => e.start).sort((a, b) => a - b)[0],
    polyEnd: resEnd(last, '/poly.js'),
    mainEnd: resEnd(last, '/main.js'),
    itemAt: last?.itemAt,
    styledAt: last?.styledAt,
    unstyled: last?.unstyled,
    lateRequests: lateHits.get(r)?.length ?? 0,
    lateHeaders: lateHits.get(r) ?? [],
    ua: last?.ua ?? early?.ua,
  };
  const f = (x) => (Number.isFinite(x) ? Math.round(x) : '-');
  console.log(
    `${v} ${i}: stall=${row.stall} ticks@1500=${row.ticks1500 ?? '-'} ticksBeforeModule=${row.ticksBeforeModule ?? '-'} FCP=${f(row.fcp)} DCL=${f(row.dcl)} ` +
      `late.css=${f(row.lateStart)}..${f(row.lateEnd)} poly=${f(row.polyEnd)} main=${f(row.mainEnd)} item=${f(row.itemAt)} styled=${f(row.styledAt)} unstyled=${row.unstyled ?? '-'} req=${row.lateRequests}`,
  );

  return row;
}

const rows = [];

for (let i = 0; i < runs; i++) {
  for (const v of Object.keys(variants)) {
    rows.push(await once(v, i));
  }
}

await driver.quit();
server.close();

const out = [`\n## Round 2 probe page, ${driver.version}, ${text} visible chars: ${runs} loads per variant\n`];
out.push(`ms of document time, median (min..max). late.css +${preMs} ms, poly.js and main.js +${moduleMs} ms each, item inserted ${itemMs} ms after main.js runs. stall = 0 rAF ticks at 1500 ms with both module scripts pending.\n`);
out.push('| variant | setup | reports | stall | rAF ticks before a module script ran | FCP | DCL | late.css start | late.css end (responseEnd) | item inserted | item styled | unstyled frames | late.css requests at server |');
out.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|');

for (const [v, { what }] of Object.entries(variants)) {
  const vr = rows.filter((x) => x.variant === v && x.reports > 0);
  const counts = Object.entries(Object.groupBy(vr, (x) => x.lateRequests)).map(([k, xs]) => `${k}x${xs.length}`).join(' ');
  out.push(
    `| ${v} | ${what} | ${vr.length}/${runs} | ${vr.filter((x) => x.stall).length}/${vr.length} | ${med(vr.map((x) => x.ticksBeforeModule))} | ${med(vr.map((x) => x.fcp))} | ${med(vr.map((x) => x.dcl))} | ` +
      `${med(vr.map((x) => x.lateStart))} | ${med(vr.map((x) => x.lateEnd))} | ${med(vr.map((x) => x.itemAt))} | ${med(vr.map((x) => x.styledAt))} | ` +
      `${med(vr.map((x) => x.unstyled))} | ${counts} |`,
  );
}

out.push(`\nuser agent: ${rows.find((x) => x.ua)?.ua}`);
const summary = out.join('\n');
console.log(summary);
const name = resolve(outDir, `round2-${browserName}-t${text}`);
writeFileSync(`${name}.json`, JSON.stringify({ version: driver.version, text, variants: Object.fromEntries(Object.entries(variants).map(([k, x]) => [k, x.what])), rows }, null, 1));
writeFileSync(`${name}.md`, summary);
