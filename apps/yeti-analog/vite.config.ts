import path from 'node:path';
import analog from '@analogjs/platform';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: `../../node_modules/.vite`,
  build: {
    outDir: '../../dist/apps/yeti-analog/client',
    reportCompressedSize: true,
    target: ['es2020'],
  },
  server: {
    port: 4300,
    fs: {
      allow: ['.'],
    },
  },
  preview: {
    port: 4300,
  },
  plugins: [
    // Nx runs inferred targets from the project root, but Analog resolves
    // its dependencies and Nitro output from the workspace root.
    analog({
      workspaceRoot: path.join(import.meta.dirname, '../..'),
      fastCompile: true,
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['**/*.spec.ts'],
    reporters: ['default'],
  },
});
