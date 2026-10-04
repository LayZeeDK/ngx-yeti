// Throwaway prototype. Shared by the variant page (server.mjs) and the real-page
// proxy (real.mjs): the inline probe script and the browser drivers.

// Runs first in <head>. All times are performance.now() of the document. Each rAF
// tick also samples the client-only item (.item) once it exists: a tick whose
// computed color is not the one late.css sets counts as an unstyled frame.
export const probeScript = (r, reportAt, reportPath = '/report') => `
window.__probe = { ticks: 0, firstTick: null, paints: {}, rs: {}, dcl: null, load: null,
  mainAt: null, ticksBeforeMain: null, itemAt: null, itemFirstTick: null, styledAt: null,
  unstyled: 0, ua: navigator.userAgent };
(function () {
  var p = window.__probe;
  function tick() {
    var now = performance.now();
    p.ticks++;
    if (p.firstTick === null) { p.firstTick = now; }
    var it = p.styledAt === null ? document.querySelector('.item') : null;
    if (it) {
      if (p.itemFirstTick === null) { p.itemFirstTick = now; }
      if (getComputedStyle(it).color === 'rgb(0, 102, 51)') { p.styledAt = now; } else { p.unstyled++; }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  try {
    new PerformanceObserver(function (list) {
      list.getEntries().forEach(function (e) { p.paints[e.name] = e.startTime; });
    }).observe({ type: 'paint', buffered: true });
  } catch (e) { p.paintError = String(e); }
  document.addEventListener('readystatechange', function () { p.rs[document.readyState] = performance.now(); });
  document.addEventListener('DOMContentLoaded', function () { p.dcl = performance.now(); });
  addEventListener('load', function () { p.load = performance.now(); });
  ${JSON.stringify(reportAt)}.forEach(function (at) {
    setTimeout(function () {
      var res = [];
      performance.getEntriesByType('resource').forEach(function (e) {
        res.push({ path: new URL(e.name).pathname, start: e.startTime, end: e.responseEnd, status: e.responseStatus });
      });
      var nav = performance.getEntriesByType('navigation')[0];
      var body = JSON.stringify(Object.assign({}, p, {
        at: at, now: performance.now(), res: res, navEnd: nav ? nav.responseEnd : null,
        visNow: document.visibilityState, hasFocus: document.hasFocus(), readyState: document.readyState
      }));
      fetch('${reportPath}?r=${r}', { method: 'POST', body: body, keepalive: true });
    }, at);
  });
})();
`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function playwrightDriver(name) {
  const pw = await import(process.env.PW_CORE ? new URL(`file:///${process.env.PW_CORE}`).href : 'playwright-core');
  const browser = await pw[name].launch();
  let context;

  return {
    version: `playwright-${name} ${browser.version()}`,
    async open(url) {
      context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'commit' });
    },
    async close() {
      await context?.close();
    },
    async quit() {
      await browser.close();
    },
  };
}

// One Safari session; blank.html between runs, as in the earlier probe.
export async function safariDriver(blankUrl) {
  const { Builder, Capabilities } = await import('selenium-webdriver');
  const caps = Capabilities.safari();
  caps.setPageLoadStrategy('none');
  const driver = await new Builder().withCapabilities(caps).build();
  const c = await driver.getCapabilities();

  return {
    version: `safari ${c.get('browserVersion')} (platform ${c.get('platformName')})`,
    async open(url) {
      await driver.get(url);
    },
    async close() {
      await driver.get(blankUrl);
      await sleep(200);
    },
    async quit() {
      await driver.quit();
    },
  };
}

export const driverFor = (name, blankUrl) => (name === 'safari' ? safariDriver(blankUrl) : playwrightDriver(name));

export const med = (xs) => {
  const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);

  return s.length ? `${Math.round(s[Math.floor(s.length / 2)])} (${Math.round(s[0])}..${Math.round(s.at(-1))})` : 'n/a';
};

export const arg = (name, fallback) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;

export { sleep };
