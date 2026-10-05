// Throwaway prototype: the Fixture app's real page behind a delaying proxy.
// The proxy forwards to the app's Node server, makes every response no-store (a
// cold first visit on every load), injects the probe script at the top of <head>,
// and delays the module scripts (and card.css) per configuration. Optionally it
// strips the server's <link rel="preload" as="style"> to show the page without it.
//
//   node real.mjs --browser=safari|webkit|... [--runs=20] [--port=8080] [--app=http://localhost:4000]
import { createServer, request } from 'node:http';
import { writeFileSync } from 'node:fs';
import { arg, driverFor, med, probeScript, sleep } from './probe.mjs';

const browserName = arg('browser', 'safari');
const runs = Number(arg('runs', 20));
const port = Number(arg('port', 8080));
const app = new URL(arg('app', 'http://localhost:4000'));
const reportAt = [1500, 4500];

const setups = {
  M: { main: 3000, polyfills: 0, css: 0, strip: false, what: 'main +3000' },
  MP: { main: 3000, polyfills: 3000, css: 0, strip: false, what: 'main and polyfills +3000' },
  Mc: { main: 3000, polyfills: 0, css: 300, strip: false, what: 'main +3000, card.css +300' },
  'Mc-nopre': { main: 3000, polyfills: 0, css: 300, strip: true, what: 'main +3000, card.css +300, server preload removed' },
  'Mc-v4': { main: 3000, polyfills: 0, css: 300, strip: false, v4: true, what: 'main +3000, card.css +300, preload rewritten to stylesheet media="not all"' },
  'MP-nopre': { main: 3000, polyfills: 3000, css: 0, strip: true, what: 'main and polyfills +3000, server preload removed' },
  'MP-v4': { main: 3000, polyfills: 3000, css: 0, strip: false, v4: true, what: 'main and polyfills +3000, preload rewritten to stylesheet media="not all"' },
  MPc: { main: 3000, polyfills: 3000, css: 300, strip: false, what: 'main and polyfills +3000, card.css +300' },
  'MPc-nopre': { main: 3000, polyfills: 3000, css: 300, strip: true, what: 'main and polyfills +3000, card.css +300, server preload removed' },
  'MPc-v4': { main: 3000, polyfills: 3000, css: 300, strip: false, v4: true, what: 'main and polyfills +3000, card.css +300, preload rewritten to stylesheet media="not all"' },
  'MP-v4end': { main: 3000, polyfills: 3000, css: 0, strip: false, v4end: true, what: 'main and polyfills +3000, media="not all" link at the end of head' },
  'MPc-v4end': { main: 3000, polyfills: 3000, css: 300, strip: false, v4end: true, what: 'main and polyfills +3000, card.css +300, media="not all" link at the end of head' },
  'Mc-v4end': { main: 3000, polyfills: 0, css: 300, strip: false, v4end: true, what: 'main +3000, card.css +300, media="not all" link at the end of head' },
};
const routes = (arg('routes', 'server/card,card')).split(',');
const setupKeys = arg('setups', 'M,MP,Mc,Mc-nopre,Mc-v4').split(',');
const configs = routes.flatMap((route) => setupKeys.map((setup) => ({ route, setup })));

let current = null; // { r, setup, requests: [] }
const reports = new Map();

const delayFor = (path, s) => {
  const base = path.split('/').at(-1);

  if (/^main(-[A-Z0-9]+)?\.js$/i.test(base)) {
    return s.main;
  }

  if (/^polyfills(-[A-Z0-9]+)?\.js$/i.test(base)) {
    return s.polyfills;
  }

  return path.endsWith('/card/card.css') ? s.css : 0;
};

const proxy = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  res.on('error', () => {});
  req.on('error', () => {});

  if (url.pathname === '/blank.html') {
    res.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store' });
    res.end('<!doctype html><title>blank</title><p>blank</p>');

    return;
  }

  if (url.pathname === '/report' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const r = url.searchParams.get('r');
      try {
        reports.set(r, [...(reports.get(r) ?? []), JSON.parse(body)]);
      } catch {
        // ignore a malformed report
      }
      res.writeHead(200, { 'cache-control': 'no-store' });
      res.end('ok');
    });

    return;
  }

  const run = current;
  const s = setups[run?.setup ?? 'M'];
  run?.requests.push(url.pathname);

  // When the proxy received the first card.css request, ms after the driver's navigate call.
  if (run && url.pathname.endsWith('/card/card.css') && run.cardAsked === undefined) {
    run.cardAsked = Date.now() - run.t0;
  }
  const delay = delayFor(url.pathname, s);

  if (delay) {
    await sleep(delay);
  }

  const headers = { ...req.headers, host: app.host, 'accept-encoding': 'identity' };
  delete headers['if-none-match'];
  delete headers['if-modified-since'];

  const up = request({ host: app.hostname, port: app.port, path: req.url, method: req.method, headers }, (upRes) => {
    if (run && url.pathname.endsWith('/card/card.css')) {
      run.cardUpstream = [...(run.cardUpstream ?? []), upRes.statusCode];
    }

    const out = { ...upRes.headers, 'cache-control': 'no-store' };
    delete out.etag;
    delete out['last-modified'];
    delete out.expires;

    if (!String(upRes.headers['content-type'] ?? '').startsWith('text/html') || !run) {
      res.writeHead(upRes.statusCode, out);
      upRes.pipe(res);

      return;
    }

    const chunks = [];
    upRes.on('data', (c) => chunks.push(c));
    upRes.on('end', () => {
      let html = Buffer.concat(chunks).toString('utf8');
      run.preloadsInHtml = (html.match(/<link rel="preload" as="style"[^>]*>/g) ?? []).length;
      // One Safari session keeps stylesheets in its memory cache despite no-store
      // (measured: no card.css request after the first load), so every stylesheet
      // URL in the server's HTML gets the run id. Links the client inserts keep
      // their own URLs; they come after first paint.
      html = html.replace(/href="([^"?]+\.css)(?:\?([^"]*))?"/g, (_, path, q) => `href="${path}?${q ? `${q}&` : ''}r=${run.r}"`);

      if (s.strip) {
        html = html.replace(/<link rel="preload" as="style"[^>]*>/g, '');
      }

      if (s.v4) {
        html = html.replace(/<link rel="preload" as="style" href="([^"]*)"[^>]*>/g, '<link rel="stylesheet" href="$1" media="not all">');
      }

      // V4 hint moved to the end of <head>, after the item stylesheet links.
      if (s.v4end) {
        const hints = [];
        html = html.replace(/<link rel="preload" as="style" href="([^"]*)"[^>]*>/g, (_, href) => {
          hints.push(`<link rel="stylesheet" href="${href}" media="not all">`);

          return '';
        });
        html = html.replace('</head>', `${hints.join('')}</head>`);
      }

      html = html.replace(/<head>/i, `<head><script>${probeScript(run.r, reportAt)}</script>`);
      delete out['content-length'];
      res.writeHead(upRes.statusCode, out);
      res.end(html);
    });
  });
  up.on('error', (e) => {
    res.writeHead(502);
    res.end(String(e));
  });
  req.pipe(up);
});

// All interfaces: the browser opens localhost, which may resolve to ::1.
await new Promise((resolve) => proxy.listen(port, resolve));
const origin = `http://localhost:${port}`;
const driver = await driverFor(browserName, `${origin}/blank.html`);
console.log(`browser: ${driver.version}; app ${app.href}`);

const resEnd = (p, test) => {
  const ends = (p?.res ?? []).filter((e) => test(e.path)).map((e) => e.end);

  return ends.length ? Math.min(...ends) : undefined;
};
const isMain = (path) => /\/main(-[A-Z0-9]+)?\.js$/i.test(path);
const isPolyfills = (path) => /\/polyfills(-[A-Z0-9]+)?\.js$/i.test(path);
const isCard = (path) => path.endsWith('/card/card.css');

async function once({ route, setup }, i) {
  const r = `${route.replace(/\W/g, '_')}-${setup}-${i}-${Date.now()}`;
  current = { r, setup, requests: [], t0: Date.now() };
  await driver.open(`${origin}/sub/${route}`);
  const deadline = Date.now() + Math.max(...reportAt) + 5000;

  while ((reports.get(r)?.length ?? 0) < reportAt.length && Date.now() < deadline) {
    await sleep(100);
  }

  const run = current;
  current = null;
  await driver.close();
  const got = (reports.get(r) ?? []).sort((a, b) => a.at - b.at);
  const [early, last] = got;
  const mainEnd = resEnd(last, isMain);
  const polyEnd = resEnd(last, isPolyfills);
  const fcp = last?.paints?.['first-contentful-paint'];
  const row = {
    route,
    setup,
    run: i,
    reports: got.length,
    stall: early ? early.ticks === 0 : null,
    ticks1500: early?.ticks,
    firstTick: last?.firstTick,
    fcp,
    interactive: last?.rs?.interactive,
    cardEnd: resEnd(last, isCard),
    mainEnd,
    polyEnd,
    // Against the first delayed module script only; an undelayed polyfills is not waited on.
    fcpWaited:
      Number.isFinite(fcp) && Number.isFinite(mainEnd)
        ? fcp >= Math.min(mainEnd, setups[setup].polyfills ? (polyEnd ?? Infinity) : Infinity) - 50
        : null,
    cardRequests: run.requests.filter(isCard).length,
    cardAsked: run.cardAsked,
    cardStatus: (last?.res ?? []).filter((e) => isCard(e.path)).map((e) => e.status),
    cardUpstream: run.cardUpstream ?? [],
    preloadsInHtml: run.preloadsInHtml,
    ua: last?.ua ?? early?.ua,
  };
  const f = (x) => (Number.isFinite(x) ? Math.round(x) : '-');
  console.log(
    `${route} ${setup} ${i}: stall=${row.stall} ticks@1500=${row.ticks1500 ?? '-'} firstTick=${f(row.firstTick)} FCP=${f(fcp)} ` +
      `card.css=${f(row.cardEnd)} polyfills=${f(polyEnd)} main=${f(mainEnd)} interactive=${f(row.interactive)} ` +
      `waited=${row.fcpWaited} cardReq=${row.cardRequests} cardAsked=${f(row.cardAsked)} cardHttp=${row.cardUpstream.join('/')} preloads=${row.preloadsInHtml}`,
  );

  return row;
}

// One unrecorded load first: a new Safari session's first navigation is slow as a
// whole (measured: interactive at ~3400 ms), which is not what is measured here.
await driver.open(`${origin}/sub/${routes[0]}`);
await sleep(4000);
await driver.close();

const rows = [];

for (let i = 0; i < runs; i++) {
  for (const c of configs) {
    rows.push(await once(c, i));
  }
}

await driver.quit();
proxy.close();

const out = [`\n## Real page, ${driver.version}: ${runs} runs per configuration\n`];
out.push('ms of document time, median (min..max). stall = 0 rAF ticks at 1500 ms (the delayed scripts still pending). waited = FCP no earlier than 50 ms before the first delayed module script finished loading.\n');
out.push('| route | setup | reports | stall | first tick | FCP | FCP waited | card.css end | polyfills end | main end | interactive | card.css requests | card.css asked (proxy, ms after navigate) | style preloads in HTML |');
out.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');

for (const { route, setup } of configs) {
  const vr = rows.filter((x) => x.route === route && x.setup === setup && x.reports > 0);
  out.push(
    `| /sub/${route} | ${setups[setup].what} | ${vr.length}/${runs} | ${vr.filter((x) => x.stall).length}/${vr.length} | ${med(vr.map((x) => x.firstTick))} | ` +
      `${med(vr.map((x) => x.fcp))} | ${vr.filter((x) => x.fcpWaited).length}/${vr.filter((x) => x.fcpWaited !== null).length} | ` +
      `${med(vr.map((x) => x.cardEnd))} | ${med(vr.map((x) => x.polyEnd))} | ${med(vr.map((x) => x.mainEnd))} | ${med(vr.map((x) => x.interactive))} | ` +
      `${med(vr.map((x) => x.cardRequests))} | ${med(vr.map((x) => x.cardAsked))} | ${med(vr.map((x) => x.preloadsInHtml))} |`,
  );
}

out.push(`\nuser agent: ${rows.find((x) => x.ua)?.ua}`);
const summary = out.join('\n');
console.log(summary);
const tag = `${browserName}-${routes.join('+').replace(/\W/g, '_')}`;
writeFileSync(`real-${tag}.json`, JSON.stringify({ version: driver.version, setups, rows }, null, 1));
writeFileSync(`real-${tag}.md`, summary);
