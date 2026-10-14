// @ts-check
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  containerScript,
  legChecks,
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

// A dry run lists the checkout's files with Git; a container leg has no `.git`.
const inCheckout = existsSync(
  fileURLToPath(new URL('../../.git', import.meta.url)),
);

test(
  'a leg writes its reports under the checkout hash its volumes carry',
  {
    skip: !inCheckout,
  },
  () => {
    const { stdout } = dryRun(['--matrix', 'configuration=production']);
    const checkout =
      /'ngx-yeti-run-job-([0-9a-f]{8})-ci-e2e-node_modules:/.exec(stdout)?.[1];

    assert.ok(checkout !== undefined, stdout);
    assert.match(
      stdout,
      new RegExp(
        `ngx-yeti-run-job[\\\\/]${checkout}[\\\\/]ci-e2e-[^:']+:/out'`,
      ),
    );
  },
);

test('a replacement command after -- reaches the container as literal words', () => {
  const [step] = steps(scriptOf(legChecks(['true'], {}, ['echo', ...hostile])));

  assert.ok(step !== undefined);

  assert.deepEqual(words(step), ['echo', ...hostile]);
});
