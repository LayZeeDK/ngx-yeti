#!/usr/bin/env node
// @ts-check
// Writes a spec that lars-verify's `verdict.mjs run` accepts, for a claim proven by one recipe of a control
// skill's feature file: the control skill's `up --json` and `doctor`, the route opened and snapshotted, the
// recipe as the pass condition, and the skill's teardown with lars-create-verification's check-teardown.mjs.
// Run from the top of the checkout under test:
//   node tools/verification/lars-verify-spec.mjs --skill <skill dir> --feature <id> --recipe <name>
//     --open <path> --claim <text> --out <dir>
// It writes <dir>/<name>.js (the recipe block) and <dir>/spec.json, and prints the absolute path of spec.json.
// Exit 0 written, 2 refused (with the reason, nothing written). It spawns only git.
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FLAGS = /** @type {const} */ ([
  'skill',
  'feature',
  'recipe',
  'open',
  'claim',
  'out',
]);

/** @typedef {(typeof FLAGS)[number]} Flag */
/** @typedef {Record<Flag, string>} Options */
/** @typedef {string[] | { argv: string[], as: string }} Step */

/**
 * @typedef {object} Spec
 * @property {string} claim
 * @property {'regression'} kind
 * @property {{ head: { dir: string } }} sides
 * @property {number} runs
 * @property {{ setup: Step[], condition: string[], teardown: string[][] }} steps
 * @property {string[]} artifacts
 */

/**
 * @param {string} name
 * @returns {name is Flag}
 */
const isFlag = (name) => FLAGS.some((flag) => flag === name);

/**
 * Each flag exactly once, as `--<name> <value>`.
 * @param {string[]} argv
 * @returns {Options}
 */
export function parseArgs(argv) {
  /** @type {Partial<Options>} */
  const options = {};

  for (let i = 0; i < argv.length; i += 2) {
    const name = /^--(.+)$/.exec(argv[i] ?? '')?.[1];
    const value = argv[i + 1];

    if (name === undefined || !isFlag(name)) {
      throw new Error(`unknown argument ${argv[i] ?? ''}`);
    }

    if (Object.hasOwn(options, name)) {
      throw new Error(`--${name} given twice`);
    }

    // An empty --open is the app's root route.
    if (value === undefined || (value === '' && name !== 'open')) {
      throw new Error(`--${name} needs a value`);
    }

    options[name] = value;
  }

  const missing = FLAGS.filter((flag) => !Object.hasOwn(options, flag));

  if (missing.length > 0) {
    throw new Error(`missing ${missing.map((flag) => `--${flag}`).join(', ')}`);
  }

  return /** @type {Options} */ (options);
}

/**
 * The lines of every fenced `js` block whose first line starts `async function <name>(page)`, each without the
 * indentation of its opening fence.
 * @param {string} markdown
 * @param {string} name
 * @returns {string[][]}
 */
export function recipeBlocks(markdown, name) {
  const lines = markdown.split(/\r?\n/);
  /** @type {string[][]} */
  const blocks = [];

  for (let i = 0; i < lines.length; i += 1) {
    const indent = /^( *)```js\s*$/.exec(lines[i] ?? '')?.[1];

    if (indent === undefined) {
      continue;
    }

    const end = lines.findIndex(
      (line, index) => index > i && /^ *```\s*$/.test(line),
    );

    if (end < 0) {
      break;
    }

    const block = lines
      .slice(i + 1, end)
      .map((line) =>
        line.startsWith(indent) ? line.slice(indent.length) : line,
      );

    if ((block[0] ?? '').startsWith(`async function ${name}(page)`)) {
      blocks.push(block);
    }

    i = end;
  }

  return blocks;
}

/**
 * @param {string} skill  repository-relative, `/`-separated
 * @param {string} name
 * @param {string} open
 * @param {string} claim
 * @param {string} top  what `git rev-parse --show-toplevel` printed
 * @param {string} outDir  absolute, `/`-separated
 * @param {string} checkTeardown  absolute, `/`-separated
 * @returns {Spec}
 */
export function buildSpec(
  skill,
  name,
  open,
  claim,
  top,
  outDir,
  checkTeardown,
) {
  const control = `${skill}/scripts/control.mjs`;
  const snapshot = `{up.evidenceDir}/${name}.before.yml`;

  return {
    claim,
    kind: 'regression',
    sides: { head: { dir: top } },
    runs: 2,
    steps: {
      setup: [
        { argv: ['node', control, 'up', '--json'], as: 'up' },
        ['node', control, 'doctor'],
        ['playwright-cli', '-s={up.session}', 'open', `{up.url}${open}`],
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
        `--filename=${outDir}/${name}.js`,
      ],
      teardown: [
        ['node', control, 'info', '--json'],
        ['node', control, 'down'],
        [
          'node',
          checkTeardown,
          '{runDir}/steps/teardown-1.out',
          '--artifact',
          snapshot,
        ],
      ],
    },
    artifacts: [snapshot],
  };
}

/**
 * @param {string} path
 * @returns {string}
 */
const slashes = (path) => path.replaceAll('\\', '/');

/**
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function samePath(a, b) {
  const [left, right] = [a, b].map((path) => realpathSync.native(path));

  return process.platform === 'win32'
    ? left?.toLowerCase() === right?.toLowerCase()
    : left === right;
}

/**
 * Validates everything, then writes the recipe file and spec.json.
 * @param {string[]} argv
 * @param {string} cwd
 * @returns {string} the absolute path of spec.json
 */
export function writeSpec(argv, cwd) {
  const options = parseArgs(argv);
  const { skill, feature, recipe, open, claim, out } = options;

  if (
    !/^[\w.-]+(?:\/[\w.-]+)*$/.test(skill) ||
    skill.split('/').some((part) => part === '.' || part === '..')
  ) {
    throw new Error(
      `--skill ${skill} is not a repository-relative path with /`,
    );
  }

  if (!/^[A-Za-z0-9][\w.-]*$/.test(feature)) {
    throw new Error(`--feature ${feature} is not a feature file name`);
  }

  if (!/^[A-Za-z_$][\w$]*$/.test(recipe)) {
    throw new Error(`--recipe ${recipe} is not a function name`);
  }

  // A path below the app's URL: no userinfo, host or scheme that would leave it, no
  // leading digit that would extend a URL ending in a port, no . or .. segment that
  // would climb above it, and no placeholder verdict.mjs would fill.
  if (
    !/^[A-Za-z0-9/_.~%?=&#-]*$/.test(open) ||
    open.includes('//') ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/.test(open) ||
    /^[0-9]/.test(open) ||
    open
      .replace(/[?#].*/s, '')
      .replaceAll(/%2e/gi, '.')
      .split('/')
      .some((segment) => segment === '.' || segment === '..')
  ) {
    throw new Error(`--open ${open} is not a path below the app's URL`);
  }

  const git = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  });
  const top = git.status === 0 ? git.stdout.trim() : '';

  if (top === '' || !samePath(top, cwd)) {
    throw new Error(`${cwd} is not the top of a git checkout`);
  }

  const featureFile = join(
    cwd,
    ...skill.split('/'),
    'features',
    `${feature}.md`,
  );

  if (!lstatSync(featureFile, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`no feature file ${skill}/features/${feature}.md`);
  }

  const blocks = recipeBlocks(readFileSync(featureFile, 'utf8'), recipe);

  if (blocks.length !== 1) {
    throw new Error(
      `${skill}/features/${feature}.md has ${blocks.length} js blocks that start async function ${recipe}(page); it needs one`,
    );
  }

  const outDir = resolve(cwd, out);

  // verdict.mjs fills placeholders in every argv string, the recipe path included.
  if (/[{}]/.test(outDir)) {
    throw new Error(`--out ${out} holds a { or }`);
  }

  const outStat = lstatSync(outDir, { throwIfNoEntry: false });

  if (
    outStat !== undefined &&
    (!outStat.isDirectory() || readdirSync(outDir).length > 0)
  ) {
    throw new Error(`--out ${out} is not an absent or empty directory`);
  }

  const checkTeardown = `${slashes(homedir())}/.claude/skills/lars-create-verification/scripts/check-teardown.mjs`;

  if (!existsSync(checkTeardown) || !lstatSync(checkTeardown).isFile()) {
    throw new Error(`no check-teardown.mjs at ${checkTeardown}`);
  }

  const spec = buildSpec(
    skill,
    recipe,
    open,
    claim,
    top,
    slashes(outDir),
    checkTeardown,
  );
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, `${recipe}.js`),
    `${(blocks[0] ?? []).join('\n')}\n`,
    { flag: 'wx' },
  );
  const specFile = join(outDir, 'spec.json');
  writeFileSync(specFile, `${JSON.stringify(spec, null, 2)}\n`, {
    flag: 'wx',
  });

  return specFile;
}

if (
  process.argv[1] !== undefined &&
  samePath(resolve(process.argv[1]), fileURLToPath(import.meta.url))
) {
  try {
    console.log(writeSpec(process.argv.slice(2), process.cwd()));
  } catch (error) {
    console.error(
      `[ERROR] ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 2;
  }
}
