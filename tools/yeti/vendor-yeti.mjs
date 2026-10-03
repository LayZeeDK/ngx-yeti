// Replaces vendor/yeti with Yeti's source at one commit (ADR 0006 point 2):
// the files of `git archive <sha> src bin schema package.json
// package-lock.json LICENSE README.md`, plus a COMMIT file holding the sha.
//
// Usage: node tools/yeti/vendor-yeti.mjs <full sha> [<yeti clone or URL>]
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const [sha, source = 'https://github.com/foundation/yeti.git'] =
  process.argv.slice(2);

if (!/^[0-9a-f]{40}$/.test(sha ?? '')) {
  console.error('Usage: node tools/yeti/vendor-yeti.mjs <full sha> [<repo>]');
  process.exit(1);
}

const files = [
  'src',
  'bin',
  'schema',
  'package.json',
  'package-lock.json',
  'LICENSE',
  'README.md',
];
const destination = resolve(import.meta.dirname, '../../vendor/yeti');
const clone = mkdtempSync(join(tmpdir(), 'yeti-'));

try {
  execFileSync('git', ['init', '--quiet', clone]);
  execFileSync('git', ['fetch', '--quiet', '--depth=1', source, sha], {
    cwd: clone,
    stdio: 'inherit',
  });

  const tree = execFileSync('git', ['archive', '--format=tar', sha, ...files], {
    cwd: clone,
    maxBuffer: 256 * 1024 * 1024,
  });

  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  execFileSync('tar', ['-x', '-f', '-'], { cwd: destination, input: tree });
  writeFileSync(join(destination, 'COMMIT'), `${sha}\n`);
} finally {
  rmSync(clone, { recursive: true, force: true });
}

console.log(`Vendored Yeti ${sha} into ${destination}`);
