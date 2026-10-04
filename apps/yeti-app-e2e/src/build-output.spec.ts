import { workspaceRoot } from '@nx/devkit';
import { expect, test } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const browserOutput = join(workspaceRoot, 'dist/apps/yeti-app/browser');

test.describe('the Fixture app build', () => {
  test('copies the 66 Yeti CSS files through the node_modules/yeti-css workspace link', () => {
    const cssFiles = readdirSync(join(browserOutput, 'yeti-css'), {
      recursive: true,
      encoding: 'utf8',
    }).filter((file) => file.endsWith('.css'));

    expect(cssFiles).toHaveLength(66);
  });

  test('prerenders /<item> and leaves /server/<item> to the server', () => {
    expect(existsSync(join(browserOutput, 'sub/card/index.html'))).toBe(true);
    expect(existsSync(join(browserOutput, 'sub/server/card'))).toBe(false);
  });
});
