// @ts-check
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  containerScript,
  legChecks,
  legPaths,
  parseArgs,
  quote,
  resolve,
} from './run-job.mjs';

const hostile = ["it's", '$(echo injected)', '`echo injected`'];

/**
 * The words bash makes of `line`, read from stdin so no host quoting applies.
 *
 * @param {string} line
 */
function words(line) {
  return execFileSync('bash', ['-s'], {
    input: `printf '%s\\0' ${line}`,
    encoding: 'utf8',
  })
    .split('\0')
    .slice(0, -1);
}

/**
 * The script each `bash -e -c` step of a container script receives.
 *
 * @param {string} container
 */
function steps(container) {
  const line = container
    .split('\n')
    .find((text) => text.endsWith(' || status=$?'));

  assert.ok(line !== undefined);

  return execFileSync('bash', ['-s'], {
    input: `bash() { printf '%s\\0' "$3"; }\n${line.replace(/ \|\| status=\$\?$/, '')}`,
    encoding: 'utf8',
  })
    .split('\0')
    .slice(0, -1);
}

/** @param {string[]} checks */
const scriptOf = (checks) =>
  containerScript({
    setup: [],
    checks,
    key: 'key',
    folders: ['node_modules'],
    nodeVersion: null,
  });

test('quote makes one literal bash word', () => {
  for (const text of hostile) {
    assert.deepEqual(words(quote(text)), [text]);
  }
});

test('a run text with a quote and a matrix value reaches bash -e -c as written', () => {
  const run = resolve(`echo 'it''s' \${{ matrix.engine }} $(echo run)`, {
    engine: hostile.join(' '),
  });

  assert.equal(run, `echo 'it''s' ${hostile.join(' ')} $(echo run)`);
  assert.deepEqual(steps(scriptOf([run, run])), [run, run]);
});

/** @param {string[]} args */
const dryRun = (args) =>
  spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL('run-job.mjs', import.meta.url)),
      'ci',
      'e2e',
      ...args,
      '--dry-run',
    ],
    { encoding: 'utf8' },
  );

test('--legs and --e2e-workers refuse all but decimal digits', () => {
  for (const option of ['--legs', '--e2e-workers']) {
    for (const text of ['', '0x3', '1e1', '-1', ' 3', '3 ', '2.0']) {
      const { status, stderr } = dryRun([option, text]);

      assert.equal(status, 2, `${option} ${JSON.stringify(text)}`);
      assert.match(stderr, /takes a whole number from/);
    }
  }

  assert.equal(dryRun(['--legs', '0']).status, 2);
});

test('--legs and --e2e-workers accept decimal digits', () => {
  assert.deepEqual(
    [
      parseArgs(['ci', 'e2e', '--legs', '1']).legs,
      parseArgs(['ci', 'e2e', '--legs', '03']).legs,
      parseArgs(['ci', 'e2e', '--e2e-workers', '0']).e2eWorkers,
      parseArgs(['ci', 'e2e', '--e2e-workers', '2']).e2eWorkers,
    ],
    [1, 3, 0, 2],
  );
});

test('a leg writes its reports under the checkout hash its volumes carry', () => {
  const { checkout, volume, out } = legPaths(
    join(tmpdir(), 'a-checkout'),
    'ci',
    'e2e',
    'ci-e2e-production',
  );

  assert.match(checkout, /^[0-9a-f]{8}$/);
  assert.equal(volume, `ngx-yeti-run-job-${checkout}-ci-e2e`);
  assert.equal(
    out,
    join(tmpdir(), 'ngx-yeti-run-job', checkout, 'ci-e2e-production'),
  );
  assert.notEqual(
    legPaths(join(tmpdir(), 'another'), 'ci', 'e2e', '').checkout,
    checkout,
  );
});

const checkout = join(import.meta.dirname, '../..');

/** The reason Git cannot list the checkout, or undefined when it can. */
const gitRefusal = (() => {
  try {
    execFileSync('git', ['ls-files', '-z'], {
      cwd: checkout,
      stdio: 'pipe',
      maxBuffer: 256 * 1024 * 1024,
    });

    return undefined;
  } catch (error) {
    return `git ls-files refused the checkout: ${String(error)}`;
  }
})();

test(
  'every dry-run leg mounts the report folder legPaths names for it',
  { skip: gitRefusal },
  () => {
    const { status, stdout } = dryRun([]);

    assert.equal(status, 0);

    const legs = stdout.split('=== ').slice(1);

    assert.ok(legs.length > 1);

    for (const section of legs) {
      const label = section.slice(0, section.indexOf(' '));
      const mounts = [...section.matchAll(/'-v' '([^']*):\/out'/g)].map(
        (match) => match[1],
      );

      assert.deepEqual(mounts, [legPaths(checkout, 'ci', 'e2e', label).out]);
    }
  },
);

test('a replacement command after -- reaches the container as literal words', () => {
  const [step] = steps(scriptOf(legChecks(['true'], {}, ['echo', ...hostile])));

  assert.ok(step !== undefined);

  assert.deepEqual(words(step), ['echo', ...hostile]);
});
