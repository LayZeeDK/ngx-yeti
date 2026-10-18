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
  '@ngx-yeti/source:test',
];

/** @type {Map<string, unknown>} */
const nxResults = new Map();

/**
 * Each `nx show` spawn takes seconds, so one argument list spawns once.
 *
 * @param {readonly string[]} args
 * @returns {any}
 */
function nxJson(args) {
  const key = args.join('\0');

  if (!nxResults.has(key)) {
    nxResults.set(
      key,
      JSON.parse(
        execFileSync(process.execPath, [nx, ...args, '--json'], {
          cwd: root,
          encoding: 'utf8',
          maxBuffer: 1 << 26,
          timeout: 120_000,
        }),
      ),
    );
  }

  return nxResults.get(key);
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

// This file's result depends on every file any Nx plugin reads, present or
// absent, which no input list can bound. So it runs in its own uncached
// target, and the cached root test target depends on it.
test('@ngx-yeti/source:cache-inputs is not cached, and @ngx-yeti/source:test stays cached, depends on it and does not run this file', () => {
  /** @type {{ targets: Record<string, { cache?: boolean, dependsOn?: unknown[], options?: { command?: string } }> }} */
  const config = nxJson(['show', 'project', '@ngx-yeti/source']);
  const rootTest = config.targets['test'];

  assert.equal(config.targets['cache-inputs']?.cache, false);
  assert.equal(rootTest?.cache, true);
  assert.ok(
    rootTest.dependsOn?.includes('cache-inputs'),
    '@ngx-yeti/source:test does not depend on cache-inputs',
  );
  assert.ok(rootTest.options?.command, '@ngx-yeti/source:test has no command');
  assert.ok(
    !rootTest.options.command.includes(
      'tools/nx/browser-floor-inputs.test.mjs',
    ),
    '@ngx-yeti/source:test runs tools/nx/browser-floor-inputs.test.mjs',
  );
});

// The root test target's cached run must hash every repository file its tests
// read: the modules under test, the workflows run-job.test.mjs parses, the
// manifest and lockfile run-job.mjs reads, and nx.json, which @nx/devkit
// reads when the Playwright configs load.
for (const file of [
  'nx.json',
  'package.json',
  'package-lock.json',
  '.github/workflows/ci.yml',
  '.github/workflows/floor.yml',
  'tools/playwright-server/container.mjs',
  'tools/playwright-server/container.test.mjs',
  'tools/ci-local/run-job.mjs',
  'tools/ci-local/run-job.test.mjs',
  'tools/verification/lars-verify-spec.mjs',
  'tools/verification/lars-verify-spec.test.mjs',
  'tools/package/pack-tarball.mjs',
  'tools/package/pack-tarball.test.mjs',
]) {
  test(`@ngx-yeti/source:test hashes ${file}`, () => {
    assert.ok(
      inputFiles('@ngx-yeti/source:test').includes(file),
      `@ngx-yeti/source:test misses ${file}`,
    );
  });
}
