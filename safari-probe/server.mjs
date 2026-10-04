// Probe server for the WebKit "late style preload" rendering stall. No dependencies.
//
// GET /?pre=late|fast|none&main=on|none&preMs=300&mainMs=3000&reportAt=2000,4500&r=<run id>
//   pre=late  -> <link rel="preload" as="style" href="late.css">, late.css delayed preMs
//   pre=fast  -> same link, late.css served at once
//   pre=none  -> no preload link
//   main=on   -> <script type="module" src="main.js">, main.js delayed mainMs
//   main=none -> no module script
//   bodyMs=N  -> send <head> at once and <body> N ms later (parser still running
//                when an undelayed preload arrives)
// The page itself POSTs window.__probe to /report at each reportAt time (setTimeout,
// which runs whether or not WebKit renders), so the result never depends on what a
// WebDriver or Playwright command does to a stalled page. Every response is no-store
// and every sub-resource URL carries the run id.
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Runs first in <head>. All times are performance.now() of the document.
const probeScript = (r, reportAt) => `
window.__probe = { ticks: 0, firstTick: null, tickTimes: [], paints: {}, paintSupported: false,
  rs: {}, dcl: null, load: null, mainAt: null, ticksBeforeMain: null,
  visibility: document.visibilityState, ua: navigator.userAgent };
(function () {
  var p = window.__probe;
  function tick() {
    var now = performance.now();
    p.ticks++;
    if (p.firstTick === null) { p.firstTick = now; }
    if (p.tickTimes.length < 5) { p.tickTimes.push(now); }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  try {
    new PerformanceObserver(function (list) {
      list.getEntries().forEach(function (e) { p.paints[e.name] = e.startTime; });
    }).observe({ type: 'paint', buffered: true });
    p.paintSupported = true;
  } catch (e) { p.paintError = String(e); }
  document.addEventListener('readystatechange', function () { p.rs[document.readyState] = performance.now(); });
  document.addEventListener('DOMContentLoaded', function () { p.dcl = performance.now(); });
  addEventListener('load', function () { p.load = performance.now(); });
  document.addEventListener('visibilitychange', function () { p.visibility += '>' + document.visibilityState; });
  ${JSON.stringify(reportAt)}.forEach(function (at) {
    setTimeout(function () {
      var res = {};
      performance.getEntriesByType('resource').forEach(function (e) {
        res[new URL(e.name).pathname.slice(1)] = { start: e.startTime, end: e.responseEnd };
      });
      var nav = performance.getEntriesByType('navigation')[0];
      var body = JSON.stringify(Object.assign({}, p, {
        at: at, now: performance.now(), res: res, navEnd: nav ? nav.responseEnd : null,
        visNow: document.visibilityState, hasFocus: document.hasFocus(), readyState: document.readyState
      }));
      fetch('/report?r=${r}', { method: 'POST', body: body, keepalive: true });
    }, at);
  });
})();
`;

function page(q) {
  const r = (q.get('r') ?? '0').replace(/[^\w-]/g, '');
  const pre = q.get('pre') ?? 'late';
  const main = q.get('main') ?? 'on';
  const preMs = pre === 'fast' ? 0 : Number(q.get('preMs') ?? 300);
  const mainMs = Number(q.get('mainMs') ?? 3000);
  const reportAt = (q.get('reportAt') ?? '2000').split(',').map(Number);
  const preload = pre === 'none' ? '' : `<link rel="preload" as="style" href="late.css?r=${r}&ms=${preMs}">`;
  const script = main === 'none' ? '' : `<script type="module" src="main.js?r=${r}&ms=${mainMs}"></script>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<script>${probeScript(r, reportAt)}</script>
<title>preload stall probe</title>
<link rel="stylesheet" href="fast.css?r=${r}">
${preload}
</head>
<body>
<h1 class="headline">Visible text: preload stall probe</h1>
<p>pre=${pre} main=${main} preMs=${preMs} mainMs=${mainMs}</p>
${script}
</body>
</html>
`;
}

export function startServer(port = 8080) {
  const reports = new Map(); // run id -> array of reports

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const ms = Number(url.searchParams.get('ms') ?? 0);
    const send = (type, body) => {
      res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
      res.end(body);
    };
    res.on('error', () => {});
    req.on('error', () => {});

    if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = page(url.searchParams);
      const bodyMs = Number(url.searchParams.get('bodyMs') ?? 0);

      if (!bodyMs) {
        return send('text/html; charset=utf-8', html);
      }

      // Flush the head at once and the body bodyMs later, so the parser is still
      // running when an undelayed preload arrives. 2 KB padding so engines that
      // buffer a small first chunk start parsing the head.
      const cut = html.indexOf('<body>');
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.write(`${html.slice(0, cut)}<!--${' '.repeat(2048)}-->\n`);
      await sleep(bodyMs);
      res.end(html.slice(cut));

      return;
    }

    if (url.pathname === '/blank.html') {
      return send('text/html; charset=utf-8', '<!doctype html><title>blank</title><p>blank</p>');
    }

    if (url.pathname === '/report' && req.method === 'POST') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        const r = url.searchParams.get('r');
        try {
          const list = reports.get(r) ?? [];
          list.push(JSON.parse(body));
          reports.set(r, list);
        } catch {
          // ignore malformed report
        }
        send('text/plain', 'ok');
      });

      return;
    }

    if (url.pathname === '/fast.css') {
      return send('text/css', 'body { font: 24px/1.4 sans-serif; background: #fff; color: #111; }');
    }

    if (url.pathname === '/late.css') {
      await sleep(ms);

      return send('text/css', '.headline { color: #036; }');
    }

    if (url.pathname === '/main.js') {
      await sleep(ms);

      // Does not touch the DOM: records when it ran and how many ticks came before.
      return send(
        'text/javascript',
        'const p = window.__probe; p.mainAt = performance.now(); p.ticksBeforeMain = p.ticks;\n',
      );
    }

    res.writeHead(404, { 'cache-control': 'no-store' });
    res.end();
  });

  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, reports })));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 8080);
  await startServer(port);
  console.log(`probe server on http://127.0.0.1:${port}`);
}
