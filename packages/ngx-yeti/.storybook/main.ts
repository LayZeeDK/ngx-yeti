import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { StorybookConfig } from '@storybook/angular-vite';

const esbuildBrowsers: Readonly<Record<string, string>> = {
  chrome: 'chrome',
  edge: 'edge',
  firefox: 'firefox',
  safari: 'safari',
  ios_saf: 'ios',
};

/**
 * The workspace's .browserslistrc as esbuild targets, such as `chrome141`.
 * Vite's default `build.cssTarget` is older than this floor, so the CSS
 * minify would lower `light-dark()` into variables keyed on the page's
 * `prefers-color-scheme`, which an inline `color-scheme` cannot switch.
 * Setting `css.lightningcss.targets` instead has no effect: the minify
 * replaces it with `build.cssTarget`.
 */
function browserslistCssTarget(configDir: string): string[] {
  return readFileSync(join(configDir, '../../../.browserslistrc'), 'utf8')
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*/, '').trim())
    .filter((line) => line !== '')
    .map((line) => {
      const [, name = '', version] = /^(\S+) (\d+(?:\.\d+)*)$/.exec(line) ?? [];
      const browser = esbuildBrowsers[name];

      if (browser === undefined || version === undefined) {
        throw new Error(
          `packages/ngx-yeti/.storybook/main.ts cannot map the .browserslistrc entry "${line}" to a Vite build.cssTarget. Write it as "<browser> <version>" for one of ${Object.keys(esbuildBrowsers).join(', ')}, or add the browser to esbuildBrowsers.`,
        );
      }

      return `${browser}${version}`;
    });
}

const config: StorybookConfig = {
  stories: ['../**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-vitest'],
  staticDirs: [
    { from: '../../../node_modules/yeti-css/dist/css', to: '/yeti-css' },
  ],
  framework: {
    name: '@storybook/angular-vite',
    options: {},
  },
  async viteFinal(config, { configDir }) {
    const { mergeConfig } = await import('vite');
    const { default: angular } = await import('@analogjs/vite-plugin-angular');
    const { findNodeModulesRoots } =
      await import('@storybook/angular-vite/vitest');
    const isAnalogPlugin = (plugin: unknown): boolean =>
      typeof plugin === 'object' &&
      plugin !== null &&
      'name' in plugin &&
      typeof plugin.name === 'string' &&
      /^@?analogjs[-/]/.test(plugin.name);

    // The framework preset offers no fastCompile option, so the `fast`
    // configurations swap its Analog plugins for an equivalent set.
    if (process.env['ANGULAR_FAST_COMPILE'] === 'true') {
      const plugins = (config.plugins ?? []).flat();
      const analogIndex = plugins.findIndex(isAnalogPlugin);

      if (analogIndex === -1) {
        throw new Error(
          'ANGULAR_FAST_COMPILE=true, but the Vite config has no Analog plugin to swap for the fastCompile set. Update isAnalogPlugin in packages/ngx-yeti/.storybook/main.ts to match the plugin names @storybook/angular-vite adds.',
        );
      }

      const fastCompilePlugins = angular({
        fastCompile: true,
        jit: true,
        liveReload: false,
        tsconfig: `${configDir}/tsconfig.json`,
        inlineStylesExtension: 'css',
      }).map((plugin) =>
        plugin.name === '@analogjs/vite-plugin-angular-fast-compile'
          ? { ...plugin, enforce: 'pre' as const }
          : plugin,
      );

      config.plugins = [
        ...plugins.slice(0, analogIndex),
        ...fastCompilePlugins,
        ...plugins.slice(analogIndex).filter((p) => !isAnalogPlugin(p)),
      ];
    }

    // Vite stops its workspace root search at this library's package.json,
    // which leaves the workspace node_modules outside `server.fs.allow`.
    return mergeConfig(config, {
      build: { cssTarget: browserslistCssTarget(configDir) },
      server: {
        fs: { allow: findNodeModulesRoots(config.root ?? process.cwd()) },
      },
    });
  },
};

export default config;

// See https://storybook.js.org/docs/builders/vite#configuration
// and https://nx.dev/docs/kb/custom-builder-configs
