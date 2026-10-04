import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

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
// A sibling of vendor/yeti, so the new tree moves in by rename on one volume.
let staging = '';

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

  // Extract and write COMMIT before touching vendor/yeti, so a failed
  // extraction leaves the old pin in place.
  mkdirSync(destination, { recursive: true });
  staging = mkdtempSync(join(dirname(destination), '.yeti-'));
  execFileSync('tar', ['-x', '-f', '-'], { cwd: staging, input: tree });
  writeFileSync(join(staging, 'COMMIT'), `${sha}\n`);

  // Keep node_modules: it holds the versions npm could not hoist, such as
  // Yeti's pinned esbuild, and `npm install` refreshes it after the move.
  for (const entry of readdirSync(destination)) {
    if (entry !== 'node_modules') {
      rmSync(join(destination, entry), { recursive: true, force: true });
    }
  }

  // COMMIT moves last: without it the yeti-css project is not inferred.
  for (const entry of readdirSync(staging)) {
    if (entry !== 'COMMIT') {
      renameSync(join(staging, entry), join(destination, entry));
    }
  }

  renameSync(join(staging, 'COMMIT'), join(destination, 'COMMIT'));
} catch (error) {
  console.error(
    'Vendoring failed. If vendor/yeti is incomplete, restore the old pin with `git checkout -- vendor/yeti`.',
  );
  throw error;
} finally {
  rmSync(clone, { recursive: true, force: true });

  if (staging) {
    rmSync(staging, { recursive: true, force: true });
  }
}

console.log(`Vendored Yeti ${sha} into ${destination}`);
