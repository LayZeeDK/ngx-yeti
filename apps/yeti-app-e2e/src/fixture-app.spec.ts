import { type Page, type Response } from '@playwright/test';
import {
  clientItemPreload,
  expect,
  isProduction,
  routeKinds,
  test,
  withoutClientPreloads,
} from './support/fixtures';
import { waitForHydration, watchHydration } from './support/hydration';
import {
  clickWhileHeld,
  holdBackMainBundle,
  mainBundle,
} from './support/main-bundle';
import { itemLinks, recordStyleMutations } from './support/style-probe';

/** Items in the app's preload list (`app.config.ts`); it may hold more. */
const preloadedItems = [
  'card',
  'box',
  'breakout',
  'button',
  'center',
  'cluster',
  'columns',
  'container',
  'cover',
  'frame',
  'grid',
  'icon',
  'layer',
  'masonry',
  'overlay',
  'scroller',
  'sidebar',
  'spinner',
  'stack',
  'table',
  'timeline',
  'visually-hidden',
];

/** The M002 routes registered behind stub components (`fixtures.ts`). */
const stubRoutes = [
  'box',
  'box-markers',
  'breakout',
  'button',
  'center',
  'center-anti-pattern',
  'cluster',
  'columns',
  'container',
  'cover',
  'enter',
  'frame',
  'grid',
  'icon',
  'layer',
  'masonry',
  'overlay',
  'scroller',
  'setup-order',
  'sidebar',
  'spinner',
  'stack',
  'static-attributes',
  'table',
  'table-numeric',
  'table-without-tbody',
  'timeline',
  'visually-hidden',
];

// The card route's hydration and JavaScript-off tests live in card.spec.ts,
// the global stylesheet's in setup.spec.ts.
for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} route`, () => {
    test('replays a click made before hydration', async ({
      browserName,
      page,
    }) => {
      const release = await holdBackMainBundle(page);
      const button = page.getByRole('button');

      await page.goto(`${prefix}replay`, { waitUntil: 'commit' });
      await clickWhileHeld(button, browserName);

      await expect(
        button,
        'the click is not handled before hydration',
      ).toHaveText('Clicked 0 times');

      release();

      await expect(button, 'the click is replayed after hydration').toHaveText(
        'Clicked 1 times',
      );
    });
  });
}

// Firefox hydrates the routed component while the main bundle runs, before
// DOMContentLoaded, so the probe must see a link moved there.
test('the style mutation probe sees an item link moved while the main bundle runs', async ({
  page,
}) => {
  const styleMutations = await recordStyleMutations(page);

  await page.route(mainBundle, async (route) => {
    const response = await route.fetch();
    const moveItemLinks = `for (const link of document.head.querySelectorAll('link[data-ngx-yeti-styles]')) { document.head.append(link); }\n`;

    await route.fulfill({
      response,
      body: moveItemLinks + (await response.text()),
    });
  });
  await page.goto('card');
  await waitForHydration(page);

  const mutations = await styleMutations();
  const moved = await itemLinks(page);

  expect(moved).toContain('card');
  expect(withoutClientPreloads(mutations)).toEqual(
    moved.flatMap((item) => [
      `remove link[data-ngx-yeti-styles="${item}"]`,
      `add link[data-ngx-yeti-styles="${item}"]`,
    ]),
  );
  expect(mutations).toEqual(
    expect.arrayContaining(preloadedItems.map(clientItemPreload)),
  );
});

/** The item in a Yeti file's href, such as `box` in `yeti-css/layouts/box/box.css?v=…`. */
async function hintedItems(page: Page, selector: string): Promise<string[]> {
  return page
    .locator(selector)
    .evaluateAll((links) =>
      links.map(
        (link) =>
          /yeti-css\/\w+\/([\w-]+)\//.exec(
            link.getAttribute('href') ?? '',
          )?.[1] ?? '',
      ),
    );
}

// E9: the one preload list grows with the items, so every check is by
// containment and a later addition breaks none.
for (const { kind, prefix } of routeKinds) {
  test.describe(`the ${kind} route's preload hints`, () => {
    test.describe('with JavaScript off', () => {
      test.use({ javaScriptEnabled: false });

      test('hold a server prefetch for every listed item, and none for lift or enter', async ({
        page,
      }) => {
        await page.goto(`${prefix}replay`);

        const prefetched = await hintedItems(page, 'head link[rel="prefetch"]');

        expect(prefetched).toEqual(expect.arrayContaining(preloadedItems));
        expect(prefetched).not.toContain('lift');
        expect(prefetched).not.toContain('enter');
        await expect(
          page.locator('head link[rel="preload"]'),
          'a server style preload holds the first paint in WebKit (upstream bug O4)',
        ).toHaveCount(0);
      });
    });

    test('hold a client style preload for every listed item after bootstrap, and none for lift or enter', async ({
      page,
    }) => {
      await page.goto(`${prefix}replay`);
      await waitForHydration(page);

      const preloaded = await hintedItems(
        page,
        'head link[rel="preload"][as="style"]',
      );

      expect(preloaded).toEqual(expect.arrayContaining(preloadedItems));
      expect(preloaded).not.toContain('lift');
      expect(preloaded).not.toContain('enter');
    });
  });
}

const statusMessage = 'the route document has status 200';
const routedComponentMessage = 'the route renders its routed component';
const stubHeadingMessage = "the stub's h2 shows its key";

/**
 * Expects a Fixture route's document to have status 200 and to render its
 * routed component, the element after `router-outlet` in `app.html`, and
 * returns whether the route still renders a stub, whose `h2` must show its
 * key. A 404, a 500, an empty app root, or a key without a route fails here
 * instead of skipping.
 */
async function expectFixtureRoute(
  page: Page,
  response: Response | null,
  key: string,
): Promise<boolean> {
  expect(response?.status(), statusMessage).toBe(200);
  await expect(
    page.locator('main > router-outlet + *'),
    routedComponentMessage,
  ).toHaveCount(1);

  if ((await page.locator('[data-fixture-stub]').count()) === 0) {
    return false;
  }

  await expect(
    page.getByRole('heading', { level: 2 }),
    stubHeadingMessage,
  ).toHaveText(key);

  return true;
}

// Each item task replaces its stub and covers its route in its own spec, so a
// route counts here only while it still renders the stub's marker.
for (const { kind, prefix } of routeKinds) {
  for (const key of stubRoutes) {
    test.describe(`the ${kind} ${key} stub route`, () => {
      test('hydrates cleanly and passes axe', async ({
        axeViolations,
        page,
      }) => {
        const expectCleanHydration = watchHydration(page);
        const response = await page.goto(`${prefix}${key}`);
        const isStub = await expectFixtureRoute(page, response, key);

        await waitForHydration(page);
        test.skip(!isStub, 'the item task has replaced the stub');

        if (!isProduction) {
          await expectCleanHydration();
        }

        expect(await axeViolations()).toEqual([]);
      });

      test.describe('with JavaScript off', () => {
        test.use({ javaScriptEnabled: false });

        test('serves visible server HTML that axe passes', async ({
          axeViolations,
          page,
        }) => {
          const response = await page.goto(`${prefix}${key}`);

          test.skip(
            !(await expectFixtureRoute(page, response, key)),
            'the item task has replaced the stub',
          );
          await expect(page.locator('[data-fixture-stub]')).toBeVisible();
          expect(await axeViolations()).toEqual([]);
        });
      });
    });
  }
}

// The negative control of the stub route check: each state it must reject.
test.describe('the stub route check', { tag: '@stub-route-control' }, () => {
  for (const javaScriptEnabled of [true, false]) {
    test.describe(`with JavaScript ${javaScriptEnabled ? 'on' : 'off'}`, () => {
      test.use({ javaScriptEnabled });

      for (const { kind, prefix } of routeKinds) {
        test(`rejects a ${kind} key that is not in the registry`, async ({
          page,
        }) => {
          const response = await page.goto(`${prefix}no-such-fixture`);

          await expect(
            expectFixtureRoute(page, response, 'no-such-fixture'),
          ).rejects.toThrow(statusMessage);
        });
      }

      test('rejects a stub route answered with status 500', async ({
        page,
      }) => {
        await page.route('**/sub/breakout', async (route) => {
          await route.fulfill({ response: await route.fetch(), status: 500 });
        });

        const response = await page.goto('breakout');

        await expect(
          expectFixtureRoute(page, response, 'breakout'),
        ).rejects.toThrow(statusMessage);
      });

      test('rejects a status-200 document with no routed component', async ({
        page,
      }) => {
        await page.route('**/sub/breakout', async (route) => {
          await route.fulfill({
            contentType: 'text/html',
            body: '<!doctype html><html lang="en"><head><title>Empty</title></head><body><app-root><main><h1>Welcome</h1><router-outlet></router-outlet></main></app-root></body></html>',
          });
        });

        const response = await page.goto('breakout');

        await expect(
          expectFixtureRoute(page, response, 'breakout'),
        ).rejects.toThrow(routedComponentMessage);
      });

      test("rejects a stub route that shows another key's h2", async ({
        page,
      }) => {
        await page.route('**/sub/breakout', async (route) => {
          await route.fulfill({
            contentType: 'text/html',
            body: '<!doctype html><html lang="en"><head><title>Stub</title></head><body><app-root><main><h1>Welcome</h1><router-outlet></router-outlet><section data-fixture-stub><h2>button</h2></section></main></app-root></body></html>',
          });
        });

        const response = await page.goto('breakout');

        await expect(
          expectFixtureRoute(page, response, 'breakout'),
        ).rejects.toThrow(stubHeadingMessage);
      });
    });
  }
});

test.describe('the axe fixture', () => {
  async function violationsWithImageMissingAlt(
    page: Page,
    axeViolations: () => Promise<string[]>,
  ): Promise<string[]> {
    await page.goto('card');
    await page.locator('main').evaluate((main) => {
      main.append(document.createElement('img'));
    });

    return axeViolations();
  }

  test('reports a violation with JavaScript on', async ({
    axeViolations,
    page,
  }) => {
    expect(
      await violationsWithImageMissingAlt(page, axeViolations),
    ).toContainEqual(expect.stringMatching(/^image-alt: /));
  });

  test.describe('with JavaScript off', () => {
    test.use({ javaScriptEnabled: false });

    test('reports a violation without logging a warning', async ({
      axeViolations,
      page,
    }) => {
      const warnings: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'warning') {
          warnings.push(message.text());
        }
      });

      expect(
        await violationsWithImageMissingAlt(page, axeViolations),
      ).toContainEqual(expect.stringMatching(/^image-alt: /));
      expect(warnings).toEqual([]);
    });

    test('reports a contrast violation that only the global stylesheet causes', async ({
      axeViolations,
      page,
    }) => {
      await page.goto('card');
      await page.locator('main').evaluate((main) => {
        const text = document.createElement('p');
        text.id = 'global-token-contrast';
        text.textContent = 'Black text on a Yeti token background';
        // Without the global stylesheet's tokens the fallback is white, which passes.
        text.setAttribute(
          'style',
          'color: #000; background-color: var(--yeti-color-primary-text, #fff)',
        );
        main.append(text);
      });

      expect(await axeViolations()).toContainEqual(
        expect.stringMatching(/^color-contrast: .*#global-token-contrast/),
      );
    });
  });
});
