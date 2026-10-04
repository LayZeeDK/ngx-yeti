// Runs every probe variant N times in one browser, writes results-<browser>.json and
// prints a summary table.
//   node run.mjs --browser=webkit|chromium|firefox|safari [--runs=20] [--port=8080] [--preMs=300]
// Playwright engines import playwright-core from $PW_CORE (absolute path to its
// index.mjs) or the bare specifier; safari uses selenium-webdriver + safaridriver.
import { writeFileSync } from 'node:fs';
import { startServer } from './server.mjs';
import { summarize } from './summarize.mjs';

const arg = (name, fallback) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const browserName = arg('browser', 'webkit');
const runs = Number(arg('runs', 20));
const port = Number(arg('port', 8080));
const preMs = Number(arg('preMs', 300));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A, B, C, E: main.js held 3000 ms, read at 1500 ms (still pending) and 3500 ms (arrived).
// C: preload served without delay (in a fast local load it can still land just after
// the parser ends). E: preload without delay, <body> held 300 ms so it lands while
// the parser runs. D: no module script. P: product case, main.js just slow (3000 ms),
// read once after it ran.
const variants = {
  A: { pre: 'late', main: 'on', mainMs: 3000, bodyMs: 0, reportAt: [1500, 3500] },
  B: { pre: 'none', main: 'on', mainMs: 3000, bodyMs: 0, reportAt: [1500, 3500] },
  C: { pre: 'fast', main: 'on', mainMs: 3000, bodyMs: 0, reportAt: [1500, 3500] },
  E: { pre: 'fast', main: 'on', mainMs: 3000, bodyMs: 300, reportAt: [1500, 3500] },
  D: { pre: 'late', main: 'none', mainMs: 0, bodyMs: 0, reportAt: [1500] },
  P: { pre: 'late', main: 'on', mainMs: 3000, bodyMs: 0, reportAt: [3500] },
};

async function playwrightDriver(name) {
  const pw = await import(process.env.PW_CORE ? new URL(`file:///${process.env.PW_CORE}`).href : 'playwright-core');
  const browser = await pw[name].launch();
  let context;
  let page;

  return {
    version: `playwright-${name} ${browser.version()}`,
    async open(url) {
      context = await browser.newContext();
      page = await context.newPage();
      await page.goto(url, { waitUntil: 'commit' });
    },
    async screenshot(path) {
      await page.screenshot({ path, timeout: 1000 }).catch((e) => console.log(`screenshot failed: ${e.message.split('\n')[0]}`));
    },
    async close() {
      await context?.close();
    },
    async quit() {
      await browser.close();
    },
  };
}

async function safariDriver() {
  const { Builder, Capabilities } = await import('selenium-webdriver');
  const caps = Capabilities.safari();
  caps.setPageLoadStrategy('none');
  const driver = await new Builder().withCapabilities(caps).build();
  const c = await driver.getCapabilities();

  return {
    version: `safari ${c.get('browserVersion')} (platform ${c.get('platformName')}, pageLoadStrategy ${c.get('pageLoadStrategy')})`,
    async open(url) {
      const t = Date.now();
      await driver.get(url);
      this.getMs = Date.now() - t;
    },
    async screenshot(path) {
      const { writeFileSync: write } = await import('node:fs');
      write(path, Buffer.from(await driver.takeScreenshot(), 'base64'));
    },
    async close() {
      await driver.get(`http://127.0.0.1:${port}/blank.html`);
      await sleep(200);
    },
    async quit() {
      await driver.quit();
    },
  };
}

const { server, reports } = await startServer(port);
const driver = browserName === 'safari' ? await safariDriver() : await playwrightDriver(browserName);
console.log(`browser: ${driver.version}`);

async function once(key, i, during) {
  const v = variants[key];
  const r = `${key}${i}-${Date.now()}`;
  const qs = new URLSearchParams({ pre: v.pre, main: v.main, preMs, mainMs: v.mainMs, bodyMs: v.bodyMs, reportAt: v.reportAt.join(','), r });
  await driver.open(`http://127.0.0.1:${port}/?${qs}`);
  await during?.();
  const deadline = Date.now() + Math.max(...v.reportAt) + 4000;

  while ((reports.get(r)?.length ?? 0) < v.reportAt.length && Date.now() < deadline) {
    await sleep(100);
  }

  await driver.close();
  const got = (reports.get(r) ?? []).sort((a, b) => a.at - b.at);
  const f = (x) => (Number.isFinite(x) ? Math.round(x) : '-');
  const last = got.at(-1);
  console.log(
    `${key} ${i}: ticks@${v.reportAt[0]}=${got[0]?.ticks ?? '-'} firstTick=${f(last?.firstTick)} ` +
      `FCP=${f(last?.paints?.['first-contentful-paint'])} late.css=${f(last?.res?.['late.css']?.end)} ` +
      `main.js=${f(last?.res?.['main.js']?.end)} ticksBeforeMain=${last?.ticksBeforeMain ?? '-'} ` +
      `vis=${got[0]?.visNow}/${got[0]?.hasFocus} get=${driver.getMs ?? '-'}ms`,
  );

  return { variant: key, run: i, getMs: driver.getMs, reports: got };
}

const rows = [];

for (let i = 0; i < runs; i++) {
  for (const key of Object.keys(variants)) {
    rows.push(await once(key, i));
  }
}

// One extra A run with a screenshot at ~1700 ms (after the 1500 ms report, before
// main.js at 3000 ms): shows what is on screen, and the 3500 ms report shows whether
// taking the screenshot itself produced frames.
const shot = await once('A', 'shot', async () => {
  await sleep(1700);
  await driver.screenshot(`shot-${browserName}-A.png`);
});

await driver.quit();
server.close();
const data = { browser: browserName, version: driver.version, preMs, variants, rows, shot };
writeFileSync(`results-${browserName}.json`, JSON.stringify(data, null, 1));
console.log(summarize(data));
