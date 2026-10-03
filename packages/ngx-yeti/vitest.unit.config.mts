import path from 'node:path';
import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [angular({ fastCompile: true, jit: false })],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/test-setup.ts'],
    coverage: {
      provider: 'istanbul',
      reportsDirectory: path.join(
        import.meta.dirname,
        '../../coverage/unit/packages/ngx-yeti',
      ),
    },
  },
});
