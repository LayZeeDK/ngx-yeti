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
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    // A fixture keeps its cases, with their templates and styles, in one file.
    files: ['src/app/fixtures/**/*.ts'],
    rules: {
      '@angular-eslint/component-max-inline-declarations': 'off',
    },
  },
];
