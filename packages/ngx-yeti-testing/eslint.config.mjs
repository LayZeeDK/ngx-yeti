import baseConfig, { vitestConfig } from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  ...vitestConfig,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
