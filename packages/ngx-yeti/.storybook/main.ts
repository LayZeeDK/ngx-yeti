import type { StorybookConfig } from '@storybook/angular-vite';

const config: StorybookConfig = {
  stories: ['../**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],
  addons: [],
  framework: {
    name: '@storybook/angular-vite',
    options: {},
  },
  async viteFinal(config) {
    const { mergeConfig } = await import('vite');
    const { findNodeModulesRoots } = await import(
      '@storybook/angular-vite/vitest'
    );

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
