// PROTOTYPE (ticket 34): after hydration removes `open` from a dialog the visitor opened
// with command="show-modal", is the rest of the page still blocked, and does Escape recover?
import { chromium, firefox, webkit } from 'playwright';
import { writeFileSync } from 'node:fs';

const lines = [];

for (const [name, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch();

  for (const form of ['prop', 'attr']) {
    const page = await browser.newPage();
    let release;
    const gate = new Promise((res) => (release = res));
    await page.route(/\/main-\w+\.js$/, async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto('http://localhost:4735/o34', { waitUntil: 'commit' });
    await page.waitForSelector('#set-mF-false', { state: 'attached' });
    await page.getByRole('button', { name: `Open ${form} mF` }).click();
    release();
    await page.waitForFunction(() => globalThis.__stable === true);
    await page.waitForTimeout(500);
    const d = `${form}-mF`;
    const probe = () =>
      page.evaluate((id) => {
        const el = document.getElementById(id);
        const s = document.querySelector('[data-testid="prop-dF"] summary').getBoundingClientRect();
        const hit = document.elementFromPoint(s.x + 5, s.y + 5);

        return `open=${el.open} modal=${el.matches(':modal')} shown=${el.checkVisibility()} prop-dF.open=${document.querySelector('[data-testid="prop-dF"]').open} hitAtSummary=${hit?.tagName.toLowerCase()}`;
      }, d);
    const afterHydration = await probe();
    const s = page.getByTestId('prop-dF').locator('summary');
    const box = await s.boundingBox();
    await page.mouse.click(box.x + 5, box.y + 5);
    await page.waitForTimeout(200);
    const afterClick = await probe();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const afterEscape = await probe();
    await page.mouse.click(box.x + 5, box.y + 5);
    await page.waitForTimeout(200);
    const afterClick2 = await probe();
    lines.push(`${name} ${form}: hydrated: ${afterHydration} | mouse click on prop-dF summary: ${afterClick} | Escape: ${afterEscape} | click again: ${afterClick2}`);
    await page.close();
  }

  await browser.close();
}

writeFileSync('results34/modal-blocked.txt', lines.join('\n') + '\n');
console.log(lines.join('\n'));
