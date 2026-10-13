// @ts-check
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { containerScript, legChecks, quote, resolve } from './run-job.mjs';

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

test('a replacement command after -- reaches the container as literal words', () => {
  const [step] = steps(scriptOf(legChecks(['true'], {}, ['echo', ...hostile])));

  assert.ok(step !== undefined);

  assert.deepEqual(words(step), ['echo', ...hostile]);
});
