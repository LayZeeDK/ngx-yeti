// @ts-check
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { mock, test } from 'node:test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';
import {
  assertSafeName,
  combinations,
  containerScript,
  legChecks,
  legPaths,
  parseArgs,
  quote,
  resolve,
  run,
  sourceFiles,
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
    legPaths(join(tmpdir(), 'another'), 'ci', 'e2e', 'ci-e2e').checkout,
    checkout,
  );
});

const checkout = join(import.meta.dirname, '../..');

/**
 * What a dry run of `args` prints, given the checkout files it would ship.
 *
 * @param {string[]} args
 */
async function dryRunOutput(args) {
  /** @type {string[]} */
  const lines = [];
  const log = mock.method(
    console,
    'log',
    (/** @type {unknown[]} */ ...values) => {
      lines.push(values.map(String).join(' '));
    },
  );

  try {
    await run(parseArgs([...args, '--dry-run']), [
      'package.json',
      'package-lock.json',
    ]);
  } finally {
    log.mock.restore();
  }

  return lines.join('\n');
}

test('every dry-run leg mounts the report folder legPaths names for it', async () => {
  const legs = (await dryRunOutput(['ci', 'e2e'])).split('=== ').slice(1);

  assert.ok(legs.length > 1);

  for (const section of legs) {
    const label = section.slice(0, section.indexOf(' '));
    const mounts = [...section.matchAll(/'-v' '([^']*):\/out'/g)].map(
      (match) => match[1],
    );

    assert.deepEqual(mounts, [legPaths(checkout, 'ci', 'e2e', label).out]);
  }
});

test('a matrix value that is not a safe name is refused with the value named', () => {
  for (const value of [
    '..',
    '.',
    '/../../../victim',
    'a/b',
    'a\\b',
    'C:',
    'a b',
    '',
    ['a'],
  ]) {
    assert.throws(
      () => combinations({ configuration: [value] }, {}),
      (error) =>
        error instanceof Error &&
        error.message.includes('matrix configuration value') &&
        error.message.includes(JSON.stringify(value)),
      JSON.stringify(value),
    );
  }

  assert.equal(
    combinations({ shard: [1, 2], engine: ['web-kit_1.2'] }, {}).length,
    2,
  );
});

test('a job id with a path separator is refused with the id named, not as a missing job', () => {
  for (const id of ['e2e/..', 'e2e\\x', '..']) {
    const { status, stderr } = spawnSync(
      process.execPath,
      [
        fileURLToPath(new URL('run-job.mjs', import.meta.url)),
        'ci',
        id,
        '--dry-run',
      ],
      { encoding: 'utf8' },
    );

    assert.equal(status, 2, id);
    assert.ok(stderr.includes(`job id ${JSON.stringify(id)}`), stderr);
    assert.ok(!stderr.includes('has no job'), stderr);
  }
});

test('a workflow name with a path separator is refused with the name named', () => {
  assert.throws(
    () => parseArgs(['../ci', 'e2e']),
    (error) =>
      error instanceof Error && error.message.includes('workflow name "../ci"'),
  );
});

test('a label that would put the reports folder outside the checkout folder is refused', () => {
  for (const label of ['', '.', '..', '../x', 'a/../..', '/../../victim']) {
    assert.throws(
      () => legPaths(checkout, 'ci', 'e2e', label),
      (error) =>
        error instanceof Error &&
        error.message.includes('is not inside') &&
        error.message.includes(
          join(
            tmpdir(),
            'ngx-yeti-run-job',
            legPaths(checkout, 'ci', 'e2e', 'ok').checkout,
          ),
        ),
      JSON.stringify(label),
    );
  }
});

/**
 * @param {unknown} value
 * @returns {Record<string, unknown>}
 */
function record(value) {
  assert.ok(typeof value === 'object' && value !== null);

  return /** @type {Record<string, unknown>} */ (value);
}

const jobs = ['ci', 'floor'].flatMap((workflow) => {
  const parsed = record(
    load(
      readFileSync(join(checkout, `.github/workflows/${workflow}.yml`), 'utf8'),
    ),
  );

  return Object.entries(record(parsed['jobs'])).map(([job, body]) => {
    const { container, strategy } = record(body);

    return {
      workflow,
      job,
      container: Boolean(container),
      matrix: strategy === undefined ? {} : record(record(strategy)['matrix']),
    };
  });
});

test('every job id and matrix value of the real workflows is a safe name', () => {
  assert.ok(jobs.length >= 11);

  for (const { workflow, job, matrix } of jobs) {
    assert.doesNotThrow(() => {
      assertSafeName(workflow, 'workflow name');
      assertSafeName(job, 'job id');
      combinations(matrix, {});
    }, `${workflow} ${job}`);
  }
});

test('every container job of the real workflows dry-runs', async () => {
  const containerJobs = jobs.filter(({ container }) => container);

  assert.deepEqual(
    containerJobs.map(({ workflow, job }) => `${workflow} ${job}`),
    ['ci unit', 'ci e2e', 'floor webkit-26-4', 'floor firefox-146-e2e'],
  );

  for (const { workflow, job } of containerJobs) {
    assert.match(
      await dryRunOutput([workflow, job]),
      /^\n=== /,
      `${workflow} ${job}`,
    );
  }
});

test('a replacement command after -- reaches the container as literal words', () => {
  const [step] = steps(scriptOf(legChecks(['true'], {}, ['echo', ...hostile])));

  assert.ok(step !== undefined);

  assert.deepEqual(words(step), ['echo', ...hostile]);
});

test('a real run ships the tracked and untracked files that exist, not the ignored ones', () => {
  const repository = mkdtempSync(join(tmpdir(), 'run-job-files-'));

  try {
    execFileSync('git', ['init', '-q'], { cwd: repository });

    for (const name of [
      '.gitignore',
      'tracked.txt',
      'deleted.txt',
      'untracked.txt',
      'ignored.txt',
    ]) {
      writeFileSync(
        join(repository, name),
        name === '.gitignore' ? 'ignored.txt\n' : '',
      );
    }

    execFileSync('git', ['add', '.gitignore', 'tracked.txt', 'deleted.txt'], {
      cwd: repository,
    });
    unlinkSync(join(repository, 'deleted.txt'));

    assert.deepEqual(sourceFiles(repository).toSorted(), [
      '.gitignore',
      'tracked.txt',
      'untracked.txt',
    ]);
  } finally {
    rmSync(repository, { recursive: true, force: true });
  }
});
