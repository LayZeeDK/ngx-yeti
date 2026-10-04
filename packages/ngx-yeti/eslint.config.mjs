import nx from '@nx/eslint-plugin';
import baseConfig, {
  angularConfig,
  vitestConfig,
} from '../../eslint.config.mjs';

export default [
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  ...baseConfig,
  ...angularConfig,
  ...vitestConfig,
  // A byte-faithful copy of Yeti's dist/yeti.d.ts, from tools/yeti/generate-sources.mjs.
  { ignores: ['src/yeti-types.ts'] },
  // The inline templates of this spec use `@boundary`, which the template
  // linter's bundled compiler does not parse yet.
  { ignores: ['styles/src/inject-yeti-item-styles.spec.ts/**/*.html'] },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/vite.lib.config.mts',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'yeti',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        [
          { type: 'element', prefix: 'yeti', style: 'kebab-case' },
          { type: 'attribute', prefix: 'yeti', style: 'camelCase' },
        ],
      ],
    },
  },
];
