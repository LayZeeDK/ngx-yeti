// @ts-check
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

// Every cached target that reads .browserslistrc, directly or through the
// build it serves or tests, must hash it, or Nx replays a result built for
// another browser floor. Targets that never read it must not hash it, or a
// floor edit reruns them for nothing.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const nx = createRequire(import.meta.url).resolve('nx/bin/nx');
const floor = '.browserslistrc';

const readers = [
  'ngx-yeti:build',
  'ngx-yeti:build-storybook',
  'ngx-yeti:test-storybook',
  // Its node specs read the CSS that ngx-yeti:build emits.
  'ngx-yeti:test',
  'yeti-app:build',
  'yeti-app:test',
  'ngx-yeti-e2e:e2e',
  'yeti-app-e2e:e2e',
];

// Vite, Vitest and Analog never call browserslist, and the Yeti build pins
// its own targets.
const nonReaders = [
  'ngx-yeti:lint',
  'ngx-yeti:typecheck',
  'ngx-yeti:build-fast',
  'ngx-yeti-testing:test',
  'yeti-analog:build',
  'yeti-analog:test',
  'yeti-css:yeti-build',
];

/** @param {readonly string[]} args */
function nxJson(args) {
  return JSON.parse(
    execFileSync(process.execPath, [nx, ...args, '--json'], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 1 << 26,
      timeout: 120_000,
    }),
  );
}

/** @param {string} target */
function inputFiles(target) {
  /** @type {{ files: string[] }} */
  const inputs = nxJson(['show', 'target', 'inputs', target]);

  return inputs.files;
}

/**
 * One per-file shard of the project's e2e-ci target.
 *
 * @param {string} project
 */
function e2eShard(project) {
  /** @type {{ targets: Record<string, unknown> }} */
  const config = nxJson(['show', 'project', project]);
  const shard = Object.keys(config.targets).find(
    (name) => name.startsWith('e2e-ci--') && name !== 'e2e-ci--merge-reports',
  );

  assert.ok(shard, `${project} has no e2e-ci--<file> target`);

  return `${project}:${shard}`;
}

for (const target of readers) {
  test(`${target} hashes ${floor}`, () => {
    assert.ok(inputFiles(target).includes(floor), `${target} misses ${floor}`);
  });
}

for (const project of ['ngx-yeti-e2e', 'yeti-app-e2e']) {
  test(`an e2e-ci shard of ${project} hashes ${floor}`, () => {
    const target = e2eShard(project);

    assert.ok(inputFiles(target).includes(floor), `${target} misses ${floor}`);
  });
}

// The merge task reads the shards' reports but does not depend on the shards,
// and an @nx/* executor hashes its own package in place of the target's
// externalDependencies, so no inputs can make it rerun with every shard.
for (const project of ['ngx-yeti-e2e', 'yeti-app-e2e', 'yeti-analog-e2e']) {
  test(`${project}:e2e-ci--merge-reports is not cached`, () => {
    /** @type {{ targets: Record<string, { cache?: boolean }> }} */
    const config = nxJson(['show', 'project', project]);

    assert.equal(
      config.targets['e2e-ci--merge-reports']?.cache,
      false,
      `${project}:e2e-ci--merge-reports replays a report from the cache`,
    );
  });
}

for (const target of nonReaders) {
  test(`${target} does not hash ${floor}`, () => {
    assert.ok(!inputFiles(target).includes(floor), `${target} hashes ${floor}`);
  });
}
