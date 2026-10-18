// @ts-check
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, relative, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');

/** Folders that hold verbatim copies, whose scripts stay as they are. */
const verbatim = ['vendor/', 'docs/specs/'];

/**
 * @param {string} file
 * @param {readonly string[]} args
 */
function linesOf(file, args) {
  return execFileSync(file, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 1 << 26,
  })
    .split(/\r?\n/)
    .filter((line) => line !== '');
}

test('tsconfig.scripts.json checks every committed script', () => {
  const committed = linesOf('git', [
    'ls-files',
    '--',
    '*.mjs',
    '*.cjs',
    '*.js',
  ]).filter((path) => !verbatim.some((folder) => path.startsWith(folder)));
  const checked = new Set(
    linesOf(process.execPath, [
      tsc,
      '-p',
      'tsconfig.scripts.json',
      '--listFilesOnly',
    ]).map((path) => relative(root, path).replaceAll('\\', '/')),
  );

  assert.notEqual(committed.length, 0);
  assert.deepEqual(
    committed.filter((path) => !checked.has(path)),
    [],
    'add these scripts to the include list of tsconfig.scripts.json',
  );
});
