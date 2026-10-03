import path from 'node:path';
import angular from '@analogjs/vite-plugin-angular';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// Playwright's browsers run as x64 under emulation on the Windows-on-Arm
// development machine, so the three engines run only in CI (ADR 0014,
// Consequences; docs/specs/issues/93-decide-testing-at-the-browser-floor.md).
const browsers = process.env['CI']
  ? (['chromium', 'firefox', 'webkit'] as const)
  : (['chromium'] as const);
// Item code lives in secondary entry points at <item>/src beside src.
const specRoots = '{src,*/src}';
const nodeSpecs = [
  `${specRoots}/**/*.ssr.spec.ts`,
  `${specRoots}/**/*.node.spec.ts`,
];

export default defineConfig({
  plugins: [angular({ fastCompile: true, jit: false })],
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
            provider: playwright(),
            instances: browsers.map((browser) => ({ browser })),
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: nodeSpecs,
        },
      },
    ],
  },
});
