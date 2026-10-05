// Throwaway prototype. Shared by the variant page (server.mjs) and the real-page
// proxy (real.mjs): the inline probe script and the browser drivers.

// Runs first in <head>. All times are performance.now() of the document. Each rAF
// tick also samples the client-only item once it exists: a tick whose computed
// value is not the styled one counts as an unstyled frame. The default item is
// the variant page's .item, styled when late.css sets its color.
//
// item.unstyled: the item counts as styled when the property differs from it
// (used by the real page: #deferred-card's padding-top is 0px without card.css).
// item.click: a selector clicked on every tick once hydration is done (no
// [jsaction] left after one was seen) until the item exists.
// item.links: a substring; the probe reports every <link> whose href holds it.
const defaultItem = { selector: '.item', prop: 'color', styled: 'rgb(0, 102, 51)' };

export const probeScript = (r, reportAt, reportPath = '/report', item = defaultItem) => `
window.__probe = { ticks: 0, firstTick: null, paints: {}, rs: {}, dcl: null, load: null,
  mainAt: null, ticksBeforeMain: null, polyAt: null, ticksBeforePoly: null, itemAt: null,
  itemFirstTick: null, styledAt: null, unstyled: 0, clickAt: null, clicks: 0, sawJsaction: false,
  ua: navigator.userAgent };
(function () {
  var p = window.__probe;
  var item = ${JSON.stringify(item)};
  function isStyled(el) {
    var v = getComputedStyle(el).getPropertyValue(item.prop);
    return item.unstyled !== undefined ? v !== item.unstyled : v === item.styled;
  }
  function tick() {
    var now = performance.now();
    p.ticks++;
    if (p.firstTick === null) { p.firstTick = now; }
    var it = p.styledAt === null ? document.querySelector(item.selector) : null;
    if (it) {
      if (p.itemFirstTick === null) { p.itemFirstTick = now; }
      if (isStyled(it)) { p.styledAt = now; } else { p.unstyled++; }
    } else if (item.click && p.styledAt === null && document.readyState !== 'loading') {
      if (document.querySelector('[jsaction]')) { p.sawJsaction = true; }
      else if (p.sawJsaction) {
        var b = document.querySelector(item.click);
        if (b) { b.click(); p.clicks++; if (p.clickAt === null) { p.clickAt = now; } }
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  try {
    new PerformanceObserver(function (list) {
      list.getEntries().forEach(function (e) { p.paints[e.name] = e.startTime; });
    }).observe({ type: 'paint', buffered: true });
  } catch (e) { p.paintError = String(e); }
  // At "interactive" the parser is done and no module script has run yet, so the
  // server HTML still holds its jsaction markers, even when no frame ticks
  // before hydration (a stalled load).
  document.addEventListener('readystatechange', function () {
    p.rs[document.readyState] = performance.now();
    if (document.readyState === 'interactive' && document.querySelector('[jsaction]')) { p.sawJsaction = true; }
  });
  document.addEventListener('DOMContentLoaded', function () { p.dcl = performance.now(); });
  addEventListener('load', function () { p.load = performance.now(); });
  ${JSON.stringify(reportAt)}.forEach(function (at) {
    setTimeout(function () {
      var res = [];
      performance.getEntriesByType('resource').forEach(function (e) {
        res.push({ path: new URL(e.name).pathname, start: e.startTime, end: e.responseEnd, status: e.responseStatus });
      });
      var links = item.links ? [].slice.call(document.querySelectorAll('link')).filter(function (l) {
        return (l.getAttribute('href') || '').indexOf(item.links) >= 0;
      }).map(function (l) {
        return { rel: l.rel, media: l.media, href: l.getAttribute('href'), inBody: !!l.closest('body') };
      }) : undefined;
      var nav = performance.getEntriesByType('navigation')[0];
      var body = JSON.stringify(Object.assign({}, p, {
        at: at, now: performance.now(), res: res, links: links, navEnd: nav ? nav.responseEnd : null,
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
