import path from 'node:path';
import angular from '@analogjs/vite-plugin-angular';
import { playwright } from '@vitest/browser-playwright';
import { webdriverio } from '@vitest/browser-webdriverio';
import { defineConfig } from 'vitest/config';
import type { BrowserConfigOptions } from 'vitest/node';
import {
  vitestBrowserApi,
  vitestInstances,
} from '../../tools/playwright/engines.mjs';

function browserEngines(): Pick<
  BrowserConfigOptions,
  'provider' | 'instances'
> {
  const chromiumFloor = process.env['FLOOR_CHROMIUM_PATH'];

  if (process.env['FLOOR_FIREFOX'] === 'true') {
    // Measured in ticket 27: the plain '145.0' tag finds no Firefox build.
    return {
      provider: webdriverio({
        capabilities: { browserVersion: 'stable_145.0' },
      }),
      instances: [{ browser: 'firefox' }],
    };
  }

  // The real Safari of a macOS runner. safaridriver has no headless mode.
  if (process.env['SAFARI'] === 'true') {
    return {
      provider: webdriverio(),
      instances: [{ browser: 'safari', headless: false }],
    };
  }

  // Playwright 1.59.1, whose WebKit is the earliest labelled at or above
  // Safari 26.2; the floor job installs it in place of the current release.
  if (process.env['FLOOR_WEBKIT'] === 'true') {
    return { provider: playwright(), instances: [{ browser: 'webkit' }] };
  }

  if (chromiumFloor) {
    return {
      provider: playwright({
        launchOptions: { executablePath: chromiumFloor },
      }),
      instances: [{ browser: 'chromium' }],
    };
  }

  return {
    provider: playwright(),
    instances: vitestInstances(playwright),
  };
}

const specRoots = '{src,*/src}';
const nodeSpecs = [
  `${specRoots}/**/*.ssr.spec.ts`,
  `${specRoots}/**/*.node.spec.ts`,
];

export default defineConfig({
  plugins: [angular({ fastCompile: true, jit: false })],
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    coverage: {
      provider: 'istanbul',
      reportsDirectory: path.join(
        import.meta.dirname,
        '../../coverage/unit/packages/ngx-yeti',
      ),
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'browser',
          include: [`${specRoots}/**/*.spec.ts`],
          exclude: nodeSpecs,
          setupFiles: ['src/test-setup.ts'],
          browser: {
            enabled: true,
            api: await vitestBrowserApi(),
            headless: true,
            ...browserEngines(),
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: nodeSpecs,
          // Inlined, Angular's partially compiled packages go through the
          // Analog linker; external, they would need the JIT compiler.
          server: { deps: { inline: [/@angular\//] } },
        },
      },
    ],
  },
});
