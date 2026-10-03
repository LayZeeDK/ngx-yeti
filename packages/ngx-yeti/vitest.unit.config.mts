import path from 'node:path';
import angular from '@analogjs/vite-plugin-angular';
import { playwright } from '@vitest/browser-playwright';
import { webdriverio } from '@vitest/browser-webdriverio';
import { defineConfig } from 'vitest/config';
import type { BrowserConfigOptions } from 'vitest/node';

// Playwright's browsers run as x64 under emulation on the Windows-on-Arm
// development machine, so the three engines run only in CI (ADR 0014,
// Consequences; docs/specs/issues/93-decide-testing-at-the-browser-floor.md).
const browsers = process.env['CI']
  ? (['chromium', 'firefox', 'webkit'] as const)
  : (['chromium'] as const);
/**
 * The floor job of docs/specs/issues/93-decide-testing-at-the-browser-floor.md
 * reruns this project at the browser floor: Chrome for Testing 141 by path
 * (FLOOR_CHROMIUM_PATH), or Firefox 145 through WebdriverIO (FLOOR_FIREFOX).
 */
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
    instances: browsers.map((browser) => ({ browser })),
  };
}

// Item code lives in secondary entry points at <item>/src beside src.
const specRoots = '{src,*/src}';
const nodeSpecs = [
  `${specRoots}/**/*.ssr.spec.ts`,
  `${specRoots}/**/*.node.spec.ts`,
];

export default defineConfig({
  plugins: [angular({ fastCompile: true, jit: false })],
  // Specs import `@ngx-yeti/testing` through tsconfig.base.json paths.
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
