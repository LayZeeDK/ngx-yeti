import path from 'node:path';
import nx from '@nx/eslint-plugin';
import storybook from 'eslint-plugin-storybook';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  ...storybook.configs['flat/recommended'],
  {
    files: ['**/.storybook/main.@(js|cjs|mjs|ts)'],
    rules: {
      // Dependencies live in the root package.json, but projects lint from
      // their own root.
      'storybook/no-uninstalled-addons': [
        'error',
        {
          packageJsonLocation: path.join(import.meta.dirname, 'package.json'),
        },
      ],
    },
  },
  {
    ignores: ['**/dist', '**/out-tsc', '**/storybook-static'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
