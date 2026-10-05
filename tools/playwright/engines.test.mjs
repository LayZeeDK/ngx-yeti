import assert from 'node:assert/strict';
import { test } from 'node:test';
import { engines } from './engines.mjs';

/** @param {NodeJS.ProcessEnv} env */
const names = (env) => engines(env).map(({ name }) => name);

test('runs Chromium without CI or BROWSERS', () => {
  assert.deepEqual(names({}), ['chromium']);
});

test('runs the three engines with CI set', () => {
  assert.deepEqual(names({ CI: 'true' }), ['chromium', 'firefox', 'webkit']);
});

test('lets BROWSERS win over CI', () => {
  assert.deepEqual(names({ CI: 'true', BROWSERS: 'webkit' }), ['webkit']);
});

test('keeps the list order and drops repeats', () => {
  assert.deepEqual(names({ BROWSERS: ' webkit , chromium,webkit' }), [
    'webkit',
    'chromium',
  ]);
});

test('falls back to the default for an empty BROWSERS', () => {
  assert.deepEqual(names({ BROWSERS: '' }), ['chromium']);
  assert.deepEqual(names({ BROWSERS: '', CI: 'true' }), [
    'chromium',
    'firefox',
    'webkit',
  ]);
});

test('names the entry it cannot run', () => {
  assert.throws(() => engines({ BROWSERS: ',' }), /"" is not one of/);
  assert.throws(() => engines({ BROWSERS: 'webkit,' }), /"" is not one of/);
  assert.throws(
    () => engines({ BROWSERS: 'safari' }),
    /"safari" is not one of/,
  );
});
