import { defineConfig } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import {
  browserProjects,
  localWorkers,
  nx,
} from '../../tools/playwright/browser-projects.mjs';

/** Each Fixture app build configuration and the port its server takes. */
const ports = {
  development: 4310,
  production: 4311,
  'tailwind-c1': 4313,
  'tailwind-c2': 4314,
};

function isConfiguration(value: string): value is keyof typeof ports {
  return Object.hasOwn(ports, value);
}

const requested = process.env['FIXTURE_CONFIGURATION'] ?? 'development';

if (!isConfiguration(requested)) {
  throw new Error(
    `FIXTURE_CONFIGURATION is one of ${Object.keys(ports).join(', ')}, not ${requested}`,
  );
}

const configuration = requested;
const port = ports[configuration];
const tailwindSpec = 'tailwind.spec.ts';
const baseURL = `http://localhost:${String(port)}/sub/`;

// Never reuse a server: a server left on these ports by another checkout or
// an interrupted run serves another build, and Nx would cache its pass.
const webServer = [
  {
    command: `${nx} run yeti-app:serve-ssr:${configuration}`,
    url: `${baseURL}card`,
    // `env` also keeps @nx/playwright from inferring a dependency on
    // serve-ssr, which would drop the configuration.
    env: { PORT: String(port) },
    reuseExistingServer: false,
    timeout: 300_000,
    cwd: workspaceRoot,
  },
  // The development server (`nx serve`) for setup-serving.spec.ts, which
  // opens it by this absolute URL. The production run skips that test.
  ...(configuration === 'development'
    ? [
        {
          command: `${nx} run yeti-app:serve:development --port=4312`,
          url: 'http://localhost:4312/sub/setup',
          reuseExistingServer: false,
          timeout: 300_000,
          cwd: workspaceRoot,
        },
      ]
    : []),
];

/**
 * Generated as a .mts file so Node forces ESM regardless of workspace
 * `type`. Playwright routes `.mts` through its ESM loader (dynamic import,
 * bypassing the pirates CJS-compile path), and Nx's native TS strip loads
 * `.mts` directly.
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  ...localWorkers(),
  // In CI a test that passes only on a retry fails the run: the retry keeps
  // its trace, and a timing regression no longer passes as flaky.
  failOnFlakyTests: Boolean(process.env['CI']),
  // The Tailwind builds change the global stylesheet only, so they run the
  // one spec about it, which the other builds cannot pass.
  ...(configuration.startsWith('tailwind-')
    ? { testMatch: tailwindSpec }
    : { testIgnore: tailwindSpec }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer,
  projects: browserProjects(webServer.map((server) => server.url)),
});
