// @ts-check
// Runs lars-verify-spec.mjs in a git checkout and a home folder of its own, so it reads no file outside its
// temporary folders: the written spec and recipe file, and each refusal that exits 2 and writes nothing.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const writer = fileURLToPath(
  new URL('./lars-verify-spec.mjs', import.meta.url),
);
const skill = '.claude/skills/control-demo';

const feature = [
  '# Demo',
  '',
  '- **Claim.** Save this:',
  '',
  '  ```js',
  '  async function demoClaim(page) {',
  '    const title = await page.title();',
  "    if (title !== 'Demo') {",
  '      throw new Error(`CLAIM: the title is ${title}`);',
  '    }',
  '  }',
  '  ```',
  '',
  '```js',
  'async function other(page) {}',
  '```',
  '',
  '```js',
  'async function twice(page) {}',
  '```',
  '',
  '```js',
  'async function twice(page) {}',
  '```',
  '',
].join('\n');

const recipe = [
  'async function demoClaim(page) {',
  '  const title = await page.title();',
  "  if (title !== 'Demo') {",
  '    throw new Error(`CLAIM: the title is ${title}`);',
  '  }',
  '}',
  '',
].join('\n');

/** @param {string} path */
const slashes = (path) => path.replaceAll('\\', '/');

/**
 * A git checkout holding the demo skill's feature file, and a home folder with or without check-teardown.mjs.
 * @param {import('node:test').TestContext} t
 * @param {{ teardownScript?: boolean, prefix?: string }} [options]
 */
function setup(
  t,
  { teardownScript = true, prefix = 'lars-verify-spec-' } = {},
) {
  const base = realpathSync.native(mkdtempSync(join(tmpdir(), prefix)));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const checkout = join(base, 'checkout');
  const home = join(base, 'home');
  mkdirSync(join(checkout, ...skill.split('/'), 'features'), {
    recursive: true,
  });
  mkdirSync(join(checkout, 'sub'));
  writeFileSync(
    join(checkout, ...skill.split('/'), 'features', 'demo.md'),
    feature,
  );
  const init = spawnSync('git', ['init', '-q'], {
    cwd: checkout,
    encoding: 'utf8',
  });
  assert.equal(init.status, 0, init.stderr);
  const scripts = join(
    home,
    '.claude',
    'skills',
    'lars-create-verification',
    'scripts',
  );
  mkdirSync(scripts, { recursive: true });

  if (teardownScript) {
    writeFileSync(join(scripts, 'check-teardown.mjs'), '');
  }

  const top = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: checkout,
    encoding: 'utf8',
  }).stdout.trim();

  /**
   * @param {string} cwd
   * @param {string[]} args
   */
  const run = (cwd, ...args) =>
    spawnSync(process.execPath, [writer, ...args], {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, USERPROFILE: home, HOME: home },
    });

  return { checkout, home, top, run };
}

/**
 * @param {Record<string, string>} [overrides]
 * @returns {string[]}
 */
function args(overrides = {}) {
  const values = {
    skill,
    feature: 'demo',
    recipe: 'demoClaim',
    open: 'card',
    claim: 'The demo title reads Demo',
    out: 'out/spec',
    ...overrides,
  };

  return Object.entries(values).flatMap(([name, value]) => [
    `--${name}`,
    value,
  ]);
}

test('writes the recipe file and a spec verdict.mjs run accepts', (t) => {
  const { checkout, home, top, run } = setup(t);
  const result = run(checkout, ...args());
  assert.equal(result.status, 0, result.stderr);
  const outDir = join(checkout, 'out', 'spec');
  assert.equal(result.stdout, `${join(outDir, 'spec.json')}\n`);
  assert.deepEqual(readdirSync(outDir).sort(), ['demoClaim.js', 'spec.json']);
  assert.equal(readFileSync(join(outDir, 'demoClaim.js'), 'utf8'), recipe);
  const control = `${skill}/scripts/control.mjs`;
  const snapshot = '{up.evidenceDir}/demoClaim.before.yml';
  assert.deepEqual(
    JSON.parse(readFileSync(join(outDir, 'spec.json'), 'utf8')),
    {
      claim: 'The demo title reads Demo',
      kind: 'regression',
      sides: { head: { dir: top } },
      runs: 2,
      steps: {
        setup: [
          { argv: ['node', control, 'up', '--json'], as: 'up' },
          ['node', control, 'doctor'],
          ['playwright-cli', '-s={up.session}', 'open', '{up.url}card'],
          [
            'playwright-cli',
            '-s={up.session}',
            'snapshot',
            `--filename=${snapshot}`,
          ],
        ],
        condition: [
          'playwright-cli',
          '-s={up.session}',
          'run-code',
          `--filename=${slashes(outDir)}/demoClaim.js`,
        ],
        teardown: [
          ['node', control, 'info', '--json'],
          ['node', control, 'down'],
          [
            'node',
            `${slashes(home)}/.claude/skills/lars-create-verification/scripts/check-teardown.mjs`,
            '{runDir}/steps/teardown-1.out',
            '--artifact',
            snapshot,
          ],
        ],
      },
      artifacts: [snapshot],
    },
  );
});

test('an empty --out directory is written to', (t) => {
  const { checkout, run } = setup(t);
  mkdirSync(join(checkout, 'out', 'spec'), { recursive: true });
  const result = run(checkout, ...args());
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readdirSync(join(checkout, 'out', 'spec')).sort(), [
    'demoClaim.js',
    'spec.json',
  ]);
});

/** @type {[string, (checkout: string) => { cwd: string, argv: string[] }, RegExp][]} */
const refusals = [
  [
    'a missing flag',
    (checkout) => ({
      cwd: checkout,
      argv: args().slice(0, -4).concat(['--out', 'out/spec']),
    }),
    /missing --claim/,
  ],
  [
    'a repeated flag',
    (checkout) => ({ cwd: checkout, argv: [...args(), '--open', 'card'] }),
    /--open given twice/,
  ],
  [
    'an unknown flag',
    (checkout) => ({ cwd: checkout, argv: [...args(), '--verbose', 'yes'] }),
    /unknown argument --verbose/,
  ],
  [
    'no matching block',
    (checkout) => ({ cwd: checkout, argv: args({ recipe: 'absent' }) }),
    /has 0 js blocks/,
  ],
  [
    'several matching blocks',
    (checkout) => ({ cwd: checkout, argv: args({ recipe: 'twice' }) }),
    /has 2 js blocks/,
  ],
  [
    'a working directory below the top of the checkout',
    (checkout) => ({ cwd: join(checkout, 'sub'), argv: args() }),
    /is not the top of a git checkout/,
  ],
  [
    'a --skill that climbs out of the checkout',
    (checkout) => ({ cwd: checkout, argv: args({ skill: '../x' }) }),
    /--skill \.\.\/x is not a repository-relative path/,
  ],
  [
    'an invalid --feature name',
    (checkout) => ({ cwd: checkout, argv: args({ feature: '../demo' }) }),
    /--feature \.\.\/demo is not a feature file name/,
  ],
  [
    'an invalid --recipe name',
    (checkout) => ({ cwd: checkout, argv: args({ recipe: 'demo-claim' }) }),
    /--recipe demo-claim is not a function name/,
  ],
  [
    'a missing feature file',
    (checkout) => ({ cwd: checkout, argv: args({ feature: 'absent' }) }),
    /no feature file \.claude\/skills\/control-demo\/features\/absent\.md/,
  ],
  [
    'an --open value with userinfo',
    (checkout) => ({
      cwd: checkout,
      argv: args({ open: '@evil.example/card' }),
    }),
    /--open @evil\.example\/card is not a path below the app's URL/,
  ],
  [
    'an --open value with a placeholder',
    (checkout) => ({ cwd: checkout, argv: args({ open: 'card/{runDir}' }) }),
    /--open card\/\{runDir\} is not a path below the app's URL/,
  ],
  [
    'an --out path with a placeholder',
    (checkout) => ({
      cwd: checkout,
      argv: args({ out: 'out/{up.session}' }),
    }),
    /holds a \{ or \}/,
  ],
];

for (const [name, make, reason] of refusals) {
  test(`refuses ${name}: exit 2, nothing written`, (t) => {
    const { checkout, run } = setup(t);
    const { cwd, argv } = make(checkout);
    const result = run(cwd, ...argv);
    assert.equal(result.status, 2, result.stdout);
    assert.match(result.stderr, reason);
    assert.equal(result.stdout, '');
    assert.equal(existsSync(join(cwd, 'out')), false);
  });
}

test('refuses a --out directory that is not empty: exit 2, nothing written', (t) => {
  const { checkout, run } = setup(t);
  mkdirSync(join(checkout, 'out', 'spec'), { recursive: true });
  writeFileSync(join(checkout, 'out', 'spec', 'kept.txt'), 'kept\n');
  const result = run(checkout, ...args());
  assert.equal(result.status, 2, result.stdout);
  assert.match(result.stderr, /is not an absent or empty directory/);
  assert.deepEqual(readdirSync(join(checkout, 'out', 'spec')), ['kept.txt']);
});

test('refuses a home folder without check-teardown.mjs: exit 2, nothing written', (t) => {
  const { checkout, run } = setup(t, { teardownScript: false });
  const result = run(checkout, ...args());
  assert.equal(result.status, 2, result.stdout);
  assert.match(
    result.stderr,
    /no check-teardown\.mjs at .*\/\.claude\/skills\/lars-create-verification\/scripts\/check-teardown\.mjs/,
  );
  assert.equal(existsSync(join(checkout, 'out')), false);
});

test('writes a spec in a checkout whose path holds a space', (t) => {
  const { checkout, top, run } = setup(t, { prefix: 'lars verify spec-' });
  assert.match(checkout, / /);
  const result = run(checkout, ...args());
  assert.equal(result.status, 0, result.stderr);
  const outDir = join(checkout, 'out', 'spec');
  assert.equal(
    result.stdout,
    `${join(outDir, 'spec.json')}
`,
  );
  /** @type {{ sides: { head: { dir: string } }, steps: { condition: string[] } }} */
  const spec = JSON.parse(readFileSync(join(outDir, 'spec.json'), 'utf8'));
  assert.equal(spec.sides.head.dir, top);
  assert.deepEqual(
    spec.steps.condition.at(-1),
    `--filename=${slashes(outDir)}/demoClaim.js`,
  );
  assert.equal(readFileSync(join(outDir, 'demoClaim.js'), 'utf8'), recipe);
});

test('an empty --open opens the root route', (t) => {
  const { checkout, run } = setup(t);
  const result = run(checkout, ...args({ open: '' }));
  assert.equal(result.status, 0, result.stderr);
  /** @type {{ steps: { setup: unknown[] } }} */
  const spec = JSON.parse(
    readFileSync(join(checkout, 'out', 'spec', 'spec.json'), 'utf8'),
  );
  assert.deepEqual(spec.steps.setup[2], [
    'playwright-cli',
    '-s={up.session}',
    'open',
    '{up.url}',
  ]);
});
