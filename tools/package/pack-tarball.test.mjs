// @ts-check
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { packedTarballNames } from './pack-tarball.mjs';

const result = { id: 'ngx-yeti@1.0.0', filename: 'ngx-yeti-1.0.0.tgz' };
const other = { id: 'other@2.0.0', filename: 'other-2.0.0.tgz' };

test('reads the npm 12 shape, an object keyed by package name', () => {
  assert.deepEqual(packedTarballNames(JSON.stringify({ 'ngx-yeti': result })), [
    'ngx-yeti-1.0.0.tgz',
  ]);
});

test('reads the npm 11 shape, an array of results', () => {
  assert.deepEqual(packedTarballNames(JSON.stringify([result])), [
    'ngx-yeti-1.0.0.tgz',
  ]);
});

test('returns no names when npm reports no tarball', () => {
  assert.deepEqual(packedTarballNames('[]'), []);
  assert.deepEqual(packedTarballNames('{}'), []);
});

test('returns every name when npm reports several tarballs', () => {
  assert.deepEqual(
    packedTarballNames(JSON.stringify({ 'ngx-yeti': result, other })),
    ['ngx-yeti-1.0.0.tgz', 'other-2.0.0.tgz'],
  );
});

const withoutFilename = `[${JSON.stringify(result)},{"id":"other@2.0.0"}]`;

for (const { shape, stdout, message } of [
  {
    shape: 'output that is not JSON',
    stdout: 'npm warn something\n[]',
    message: 'npm pack --json printed no JSON: npm warn something\n[]',
  },
  {
    shape: 'null',
    stdout: 'null',
    message: 'npm pack --json printed neither an array nor an object: null',
  },
  {
    shape: 'a result without a filename',
    stdout: withoutFilename,
    message: `npm pack --json printed a result without a filename: ${withoutFilename}`,
  },
]) {
  test(`fails on ${shape} and names what npm printed`, () => {
    assert.throws(() => packedTarballNames(stdout), { message });
  });
}
