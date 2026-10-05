// Throwaway prototype: how should ngx-yeti write item preloads on the server?
// One page, variant chosen by ?v=. late.css (the item file) arrives preMs after
// the request, after the parser ends. main.js (the app bundle) arrives mainMs
// after the request; when it runs it simulates a client-only item: 200 ms later
// it inserts <link rel="stylesheet" href="late.css"> (as the loader's acquire()
// would) and then the item element.
//
//   node run.mjs --browser=webkit|chromium|firefox|safari [--runs=20] [--port=8080]
import { createServer } from 'node:http';
import { writeFileSync } from 'node:fs';
import { arg, driverFor, med, probeScript, sleep } from './probe.mjs';

const browserName = arg('browser', 'webkit');
const runs = Number(arg('runs', 20));
const port = Number(arg('port', 8080));
const preMs = 300;
const mainMs = 3000;
const itemMs = 200;
const reportAt = [1500, 4500];

// Server-written tag in <head> per variant, and what main.js adds.
const variantsA = {
  V0: { head: (h) => `<link rel="preload" as="style" href="${h}">`, clientPreload: false, clientLink: true, what: 'current: server preload' },
  V1: { head: () => '', clientPreload: true, clientLink: true, what: 'client-only preload (inserted when main.js runs)' },
  V2: { head: (h) => `<link rel="stylesheet" href="${h}">`, clientPreload: false, clientLink: false, what: 'server stylesheet' },
  V3: { head: (h) => `<link rel="preload" as="style" href="${h}" blocking="render">`, clientPreload: false, clientLink: true, what: 'server preload blocking=render (non-conforming)' },
  V4: { head: (h) => `<link rel="stylesheet" href="${h}" media="not all">`, clientPreload: false, clientLink: true, what: 'server stylesheet media="not all"' },
  V5: { head: (h) => `<link rel="prefetch" href="${h}">`, clientPreload: false, clientLink: true, what: 'server prefetch' },
  N: { head: () => '', clientPreload: false, clientLink: true, what: 'control: no preload anywhere' },
};

// Set b (--set=b): the real app's shape, two module scripts (poly.js, then
// main.js, both +mainMs), and pages where the item also renders on the server,
// so late.css is also a render-blocking stylesheet ("d", as on /sub/card).
const preload = (h) => `<link rel="preload" as="style" href="${h}">`;
const notAll = (h) => `<link rel="stylesheet" href="${h}" media="not all">`;
const sheet = (h) => `<link rel="stylesheet" href="${h}">`;
const variantsB = {
  N2: { head: () => '', scripts: 2, clientPreload: false, clientLink: true, what: '2 scripts: no preload anywhere' },
  V0_2: { head: preload, scripts: 2, clientPreload: false, clientLink: true, what: '2 scripts: server preload (current)' },
  V1_2: { head: () => '', scripts: 2, clientPreload: true, clientLink: true, what: '2 scripts: client-only preload' },
  V4_2: { head: notAll, scripts: 2, clientPreload: false, clientLink: true, what: '2 scripts: media="not all"' },
  V0d_2: { head: (h) => preload(h) + sheet(h), scripts: 2, clientPreload: false, clientLink: false, what: '2 scripts: preload, then item stylesheet (current /sub/card shape)' },
  V4d_2: { head: (h) => notAll(h) + sheet(h), scripts: 2, clientPreload: false, clientLink: false, what: '2 scripts: media="not all", then item stylesheet' },
  V4e_2: { head: (h) => sheet(h) + notAll(h), scripts: 2, clientPreload: false, clientLink: false, what: '2 scripts: item stylesheet, then media="not all"' },
  V4d_1: { head: (h) => notAll(h) + sheet(h), scripts: 1, clientPreload: false, clientLink: false, what: '1 script: media="not all", then item stylesheet' },
};
const set = arg('set', 'a');
const variants = set === 'b' ? variantsB : variantsA;

const lateHref = (r) => `late.css?r=${r}`;

function page(v, r) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<script>${probeScript(r, reportAt)}</script>
<title>preload prototype</title>
<link rel="stylesheet" href="fast.css?r=${r}">
${variants[v].head(lateHref(r))}
</head>
<body>
<h1>Visible text: preload prototype ${v}</h1>
<p>late.css +${preMs} ms, main.js +${mainMs} ms, client-only item ${itemMs} ms after main.js runs</p>
${variants[v].scripts === 2 ? `<script type="module" src="poly.js?r=${r}"></script>` : ''}
<script type="module" src="main.js?r=${r}&v=${v}"></script>
</body>
</html>
`;
}

function mainJs(v, r) {
  const { clientPreload, clientLink } = variants[v];
  const add = (attrs) =>
    `{ const l = document.createElement('link'); ${Object.entries(attrs)
      .map(([k, val]) => `l.setAttribute(${JSON.stringify(k)}, ${JSON.stringify(val)});`)
      .join(' ')} document.head.appendChild(l); }`;

  return `const p = window.__probe; p.mainAt = performance.now(); p.ticksBeforeMain = p.ticks;
${clientPreload ? add({ rel: 'preload', as: 'style', href: lateHref(r) }) : ''}
setTimeout(() => {
  ${clientLink ? add({ rel: 'stylesheet', href: lateHref(r) }) : ''}
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
    lateHits.set(r, (lateHits.get(r) ?? 0) + 1);
    await sleep(preMs);

    // Cacheable, like the app's express.static (maxAge 1y); the run id keeps runs apart.
    return send('text/css', '.item { color: rgb(0, 102, 51); }', 'public, max-age=31536000');
  }

  if (url.pathname === '/poly.js') {
    await sleep(mainMs);

    return send('text/javascript', 'window.__probe.polyAt = performance.now();\n');
  }

  if (url.pathname === '/main.js') {
    await sleep(mainMs);

    return send('text/javascript', mainJs(q.get('v'), r));
  }

  res.writeHead(404, { 'cache-control': 'no-store' });
  res.end();
});

await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
const driver = await driverFor(browserName, `http://127.0.0.1:${port}/blank.html`);
console.log(`browser: ${driver.version}`);

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
  const row = {
    variant: v,
    run: i,
    reports: got.length,
    stall: early ? early.ticks === 0 && early.mainAt === null : null,
    ticks1500: early?.ticks,
    firstTick: last?.firstTick,
    fp: last?.paints?.['first-paint'],
    fcp: last?.paints?.['first-contentful-paint'],
    interactive: last?.rs?.interactive,
    lateEnd: resEnd(last, '/late.css'),
    mainEnd: resEnd(last, '/main.js'),
    mainAt: last?.mainAt,
    itemAt: last?.itemAt,
    styledAt: last?.styledAt,
    unstyled: last?.unstyled,
    lateRequests: lateHits.get(r) ?? 0,
    lateStatus: (last?.res ?? []).filter((e) => e.path === '/late.css').map((e) => e.status),
    ua: last?.ua ?? early?.ua,
  };
  const f = (x) => (Number.isFinite(x) ? Math.round(x) : '-');
  console.log(
    `${v} ${i}: stall=${row.stall} ticks@1500=${row.ticks1500 ?? '-'} FCP=${f(row.fcp)} late.css=${f(row.lateEnd)} ` +
      `main.js=${f(row.mainEnd)} item=${f(row.itemAt)} styled=${f(row.styledAt)} unstyled=${row.unstyled ?? '-'} req=${row.lateRequests}`,
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

const out = [`\n## ${driver.version}: ${runs} runs per variant\n`];
out.push('ms of document time, median (min..max). late.css +300 ms, main.js +3000 ms, item inserted 200 ms after main.js runs.\n');
out.push('| variant | setup | reports | stall | FP | FCP | late.css first end | interactive | item inserted | item styled | styled - inserted | unstyled frames | late.css requests |');
out.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|');

for (const [v, { what }] of Object.entries(variants)) {
  const vr = rows.filter((x) => x.variant === v && x.reports > 0);
  const counts = Object.entries(Object.groupBy(vr, (x) => x.lateRequests)).map(([k, xs]) => `${k}x${xs.length}`).join(' ');
  out.push(
    `| ${v} | ${what} | ${vr.length}/${runs} | ${vr.filter((x) => x.stall).length}/${vr.length} | ${med(vr.map((x) => x.fp))} | ${med(vr.map((x) => x.fcp))} | ` +
      `${med(vr.map((x) => x.lateEnd))} | ${med(vr.map((x) => x.interactive))} | ${med(vr.map((x) => x.itemAt))} | ${med(vr.map((x) => x.styledAt))} | ` +
      `${med(vr.map((x) => x.styledAt - x.itemAt))} | ${med(vr.map((x) => x.unstyled))} | ${counts} |`,
  );
}

out.push(`\nuser agent: ${rows.find((x) => x.ua)?.ua}`);
const summary = out.join('\n');
console.log(summary);
const name = `proto-${browserName}${set === 'b' ? '-b' : ''}`;
writeFileSync(`${name}.json`, JSON.stringify({ version: driver.version, variants: Object.fromEntries(Object.entries(variants).map(([k, x]) => [k, x.what])), rows }, null, 1));
writeFileSync(`${name}.md`, summary);
