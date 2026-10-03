import type { StorybookConfig } from '@storybook/angular-vite';

const config: StorybookConfig = {
  stories: ['../**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-vitest'],
  // The application `assets` entry of docs/specs/specs/setup.md, section 4 B.
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
    const plugins = (config.plugins ?? []).flat();
    const analogIndex = plugins.findIndex(isAnalogPlugin);

    // The framework preset offers no fastCompile option, so the `fast`
    // configurations swap its Analog plugins for an equivalent set.
    if (process.env['ANGULAR_FAST_COMPILE'] === 'true' && analogIndex !== -1) {
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
        ...plugins.slice(0, analogIndex).filter((p) => !isAnalogPlugin(p)),
        ...fastCompilePlugins,
        ...plugins.slice(analogIndex).filter((p) => !isAnalogPlugin(p)),
      ];
    }

    // Vite stops its workspace root search at this library's package.json,
    // which leaves the workspace node_modules outside `server.fs.allow`.
    return mergeConfig(config, {
      server: {
        fs: { allow: findNodeModulesRoots(config.root ?? process.cwd()) },
      },
    });
  },
};

export default config;

// See https://storybook.js.org/docs/builders/vite#configuration
// and https://nx.dev/docs/kb/custom-builder-configs
