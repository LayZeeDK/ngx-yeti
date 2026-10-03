// PROTOTYPE (ticket 18): why alert.js removes the alert in about 30 ms. Reads the
// token alert.js reads, and times its fade, on the plain build's /anim page.
import { spawn } from 'node:child_process';
import { chromium, firefox, webkit } from 'playwright';

const PORT = 4519;
const child = spawn(process.execPath, ['dist/plain/server/server.mjs'], {
  env: { ...process.env, PORT: String(PORT), NG_ALLOWED_HOSTS: 'localhost' },
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 2500));
for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch();
  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/anim`);
  await page.waitForFunction(() => window.__m?.stable !== undefined);
  const r = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const alert = document.querySelector('[data-testid=an-alert]');
        const token = getComputedStyle(alert).getPropertyValue('--yeti-duration-fast');
        const t0 = performance.now();
        const orig = Element.prototype.animate;
        let opts = null;
        Element.prototype.animate = function (k, o) {
          opts = o;

          return orig.call(this, k, o);
        };
        document.addEventListener('yeti:close', () => resolve({ token, parsed: parseFloat(token), animateOptions: opts, closedAtMs: Math.round(performance.now() - t0) }), { once: true });
        alert.querySelector('[data-close]').click();
      }),
  );
  console.log(name, JSON.stringify(r));
  await browser.close();
}
child.kill();
