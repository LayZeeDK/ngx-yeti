#!/usr/bin/env node
// @ts-check
/** See references/ci-local.md. */
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { load } from 'js-yaml';

const root = join(import.meta.dirname, '../..');
const usage =
  'usage: node tools/ci-local/run-job.mjs <workflow> <job> [--matrix key=value]... [--legs <n>] [--e2e-workers <n>] [--dry-run] [-- <command>...]';
/** Matrix legs at once, capped by their peak memory in the Docker VM. */
const defaultLegs = 2;
/** Playwright workers per e2e leg; 0 leaves the configs' CI count. */
const defaultE2eWorkers = 3;

/**
 * A matrix combination, or the `--matrix` filter.
 *
 * @typedef {Record<string, unknown>} Matrix
 */

/**
 * @typedef {object} Leg
 * @property {string[]} args
 * @property {string} name
 * @property {string} label
 * @property {string} out
 * @property {string} log
 */

/**
 * @param {string} message
 * @returns {never}
 */
function fail(message) {
  console.error(`run-job: ${message}`);
  process.exit(2);
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isObject(value) {
  return typeof value === 'object' && value !== null;
}

/**
 * @param {string} option
 * @param {string | undefined} text
 * @param {number} min
 */
function count(option, text, min) {
  if (text === undefined || !/^\d+$/.test(text) || Number(text) < min) {
    fail(`${option} takes a whole number from ${String(min)}`);
  }

  return Number(text);
}

/** @param {string[]} argv */
export function parseArgs(argv) {
  const dash = argv.indexOf('--');
  const own = dash === -1 ? argv : argv.slice(0, dash);
  const command = dash === -1 ? [] : argv.slice(dash + 1);
  const [workflow, job, ...rest] = own;
  /** @type {Record<string, string>} */
  const matrix = {};
  let dryRun = false;
  let legs = defaultLegs;
  let e2eWorkers = defaultE2eWorkers;

  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];

    if (argument === '--dry-run') {
      dryRun = true;
    } else if (argument === '--legs') {
      index += 1;
      legs = count(argument, rest[index], 1);
    } else if (argument === '--e2e-workers') {
      index += 1;
      e2eWorkers = count(argument, rest[index], 0);
    } else if (argument === '--matrix') {
      index += 1;
      const pair = rest[index] ?? '';
      const at = pair.indexOf('=');

      if (at < 1) {
        fail('--matrix takes key=value');
      }

      matrix[pair.slice(0, at)] = pair.slice(at + 1);
    } else {
      fail(`unknown argument ${argument}`);
    }
  }

  if (!workflow || !job) {
    fail(usage);
  }

  return {
    workflow: workflow.replace(/\.ya?ml$/, ''),
    job,
    matrix,
    dryRun,
    legs,
    e2eWorkers,
    command,
  };
}

const token = /'(?:[^']|'')*'|==|&&|\|\||matrix\.\w+/g;

/**
 * GitHub compares strings with `==` case-insensitively.
 *
 * @param {string} expression
 * @param {Matrix} matrix
 */
function evaluate(expression, matrix) {
  if (expression.replace(token, '').trim() !== '') {
    fail(`unsupported expression: ${expression}`);
  }

  const tokens = expression.match(token) ?? [];
  let position = 0;

  function primary() {
    const next = tokens[position];
    position += 1;

    if (next?.startsWith("'")) {
      return next.slice(1, -1).replaceAll("''", "'");
    }

    const key = next?.startsWith('matrix.')
      ? next.slice('matrix.'.length)
      : null;

    if (key === null || !(key in matrix)) {
      fail(`unknown matrix value in ${expression}`);
    }

    return matrix[key];
  }

  function equality() {
    let value = primary();

    while (tokens[position] === '==') {
      position += 1;
      value = String(value).toLowerCase() === String(primary()).toLowerCase();
    }

    return value;
  }

  function and() {
    let value = equality();

    while (tokens[position] === '&&') {
      position += 1;
      const other = equality();
      value = value && other;
    }

    return value;
  }

  function or() {
    let value = and();

    while (tokens[position] === '||') {
      position += 1;
      const other = and();
      value = value || other;
    }

    return value;
  }

  const value = or();

  if (position !== tokens.length) {
    fail(`unsupported expression: ${expression}`);
  }

  return value;
}

/**
 * @param {unknown} text
 * @param {Matrix} matrix
 */
export function resolve(text, matrix) {
  return String(text).replace(
    /\$\{\{\s*(.*?)\s*\}\}/g,
    (_, /** @type {string} */ expression) =>
      String(evaluate(expression, matrix)),
  );
}

/**
 * @param {string} where
 * @param {unknown} object
 * @param {string[]} allowed
 */
function assertKeys(where, object, allowed) {
  const unknown = Object.keys(object ?? {}).filter(
    (key) => !allowed.includes(key),
  );

  if (unknown.length > 0) {
    fail(
      `${where} uses ${unknown.join(', ')}, which run-job.mjs does not run; extend it first`,
    );
  }
}

/**
 * @param {string} workflowName
 * @param {string} jobName
 */
function loadJob(workflowName, jobName) {
  const file = join(root, '.github/workflows', `${workflowName}.yml`);

  if (!existsSync(file)) {
    fail(`no workflow ${file}`);
  }

  const workflow = load(readFileSync(file, 'utf8'));

  if (!isObject(workflow)) {
    fail(`${workflowName}.yml is not a mapping`);
  }

  const jobs = workflow['jobs'];
  const job = isObject(jobs) ? jobs[jobName] : undefined;

  if (!isObject(job)) {
    fail(`${workflowName}.yml has no job ${jobName}`);
  }

  const container = job['container'];

  if (!container) {
    fail(
      `${workflowName}.yml ${jobName} has no container; run it natively (references/ci-local.md)`,
    );
  }

  const where = `${workflowName}.yml ${jobName}`;
  assertKeys(`${workflowName}.yml`, workflow, [
    'name',
    'on',
    'concurrency',
    'permissions',
    'env',
    'jobs',
  ]);
  assertKeys(where, job, [
    'runs-on',
    'timeout-minutes',
    'container',
    'strategy',
    'name',
    'env',
    'steps',
  ]);
  const strategy = job['strategy'];

  assertKeys(`${where} strategy`, strategy, ['fail-fast', 'matrix']);

  if (typeof container !== 'string') {
    assertKeys(`${where} container`, container, ['image']);
  }

  const image = isObject(container) ? container['image'] : container;

  if (typeof image !== 'string') {
    fail(`${where} container names no image`);
  }

  /** @type {Record<string, string[]>} */
  const actions = { checkout: [], 'setup-node': ['node-version', 'cache'] };
  /** @type {unknown[]} */
  const steps = listOf(job['steps'] ?? [], where);
  /** @type {unknown} */
  let nodeVersion = null;
  /** @type {string[]} */
  const runs = [];

  for (const step of steps) {
    if (!isObject(step)) {
      fail(`${where} has an empty step`);
    }

    const uses = String(step['uses'] ?? '');
    const action = /^actions\/([\w-]+)@/.exec(uses)?.[1];

    if ('run' in step) {
      assertKeys(`a step of ${where}`, step, ['name', 'run']);

      if (typeof step['run'] !== 'string') {
        fail(`a step of ${where} has a run that is not text`);
      }

      runs.push(step['run']);
    } else if (action !== undefined && action in actions) {
      const inputs = step['with'];

      assertKeys(`a step of ${where}`, step, ['name', 'uses', 'with']);
      assertKeys(`${uses} in ${where}`, inputs, actions[action] ?? []);
      nodeVersion =
        (isObject(inputs) ? inputs['node-version'] : undefined) ?? nodeVersion;
    } else {
      assertKeys(`a step of ${where}`, { [String(step['uses'])]: true }, []);
    }
  }

  const split = runs.findIndex((run) => !isSetup(run));
  const setup = split === -1 ? runs : runs.slice(0, split);
  const checks = split === -1 ? [] : runs.slice(split);

  if (checks.some(isSetup)) {
    fail(`${where} runs a setup step after a check step`);
  }

  return {
    env: {
      ...mapping(workflow['env'], 'the workflow env'),
      ...mapping(job['env'], `${where} env`),
    },
    image,
    matrix: mapping(
      isObject(strategy) ? strategy['matrix'] : undefined,
      `${where} strategy.matrix`,
    ),
    nodeVersion,
    setup,
    checks,
  };
}

/**
 * @param {unknown} value
 * @param {string} where
 * @returns {unknown[]}
 */
function listOf(value, where) {
  return Array.isArray(value) ? value : fail(`${where} steps is not a list`);
}

/**
 * @param {unknown} value an optional YAML mapping
 * @param {string} what
 * @returns {Record<string, unknown>}
 */
function mapping(value, what) {
  if (value === undefined || value === null) {
    return {};
  }

  return isObject(value) && !Array.isArray(value)
    ? value
    : fail(`${what} is not a mapping`);
}

/**
 * The matrix combinations the filter keeps, in GitHub's expansion order.
 *
 * @param {Matrix} matrix
 * @param {Record<string, string>} filter
 */
function combinations(matrix, filter) {
  if ('include' in matrix || 'exclude' in matrix) {
    fail('matrix include and exclude are not supported');
  }

  for (const key of Object.keys(filter)) {
    if (!(key in matrix)) {
      fail(`the job has no matrix key ${key}`);
    }
  }

  /** @type {Matrix[]} */
  let result = [{}];

  for (const [key, values] of Object.entries(matrix)) {
    if (!Array.isArray(values)) {
      fail(`matrix ${key} is not a list, which run-job.mjs does not run`);
    }

    result = result.flatMap((combo) =>
      values.map((/** @type {unknown} */ value) => ({
        ...combo,
        [key]: value,
      })),
    );
  }

  return result.filter((combo) =>
    Object.entries(filter).every(
      ([key, value]) => String(combo[key]) === value,
    ),
  );
}

/** @param {string} run */
const isSetup = (run) => /^npm (ci|install)\b/.test(run.trim());

/** @param {unknown} argument */
export function quote(argument) {
  return `'${String(argument).replaceAll("'", "'\\''")}'`;
}

/**
 * The leg's check steps: the job's, or the command after `--` as literal words.
 *
 * @param {string[]} checks
 * @param {Matrix} combo
 * @param {string[]} command
 */
export function legChecks(checks, combo, command) {
  return command.length > 0
    ? [command.map(quote).join(' ')]
    : checks.map((run) => resolve(run, combo));
}

/**
 * Each folder gets its own volume, so installs survive the `--rm` container.
 *
 * @param {unknown} lockfile
 */
function modulesFolders(lockfile) {
  const folders = new Set(['node_modules']);
  const packages = isObject(lockfile) ? lockfile['packages'] : undefined;

  for (const path of Object.keys(packages ?? {})) {
    const nested = path.indexOf('/node_modules/');

    if (nested > 0 && !path.startsWith('node_modules/')) {
      folders.add(path.slice(0, nested + '/node_modules'.length));
    }
  }

  return [...folders].sort();
}

/**
 * What a checkout's legs share by name: the 8-hex hash of its path, the
 * prefix of the job's volumes, and the host folder a leg's reports go to.
 *
 * @param {string} checkoutRoot
 * @param {string} workflow
 * @param {string} jobName
 * @param {string} label
 */
export function legPaths(checkoutRoot, workflow, jobName, label) {
  const checkout = createHash('sha256')
    .update(checkoutRoot)
    .digest('hex')
    .slice(0, 8);

  return {
    checkout,
    volume: `ngx-yeti-run-job-${checkout}-${workflow}-${jobName}`,
    out: join(tmpdir(), 'ngx-yeti-run-job', checkout, label),
  };
}

/** Tracked and untracked, not ignored, files; deleted tracked files would fail tar. */
function sourceFiles() {
  return execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  })
    .split('\0')
    .filter((path) => path && existsSync(join(root, path)));
}

/**
 * @param {{ image: string }} job
 * @param {string[]} setup
 * @param {string[]} files
 */
function setupKey(job, setup, files) {
  const hash = createHash('sha256').update(job.image).update(setup.join('\n'));

  for (const path of files.filter((file) =>
    /(^|\/)(package\.json|package-lock\.json|\.npmrc)$/.test(file),
  )) {
    hash.update(path).update(readFileSync(join(root, path)));
  }

  return hash.digest('hex');
}

/**
 * @param {object} options
 * @param {string[]} options.setup
 * @param {string[]} options.checks
 * @param {string} options.key
 * @param {string[]} options.folders
 * @param {unknown} options.nodeVersion
 */
export function containerScript({ setup, checks, key, folders, nodeVersion }) {
  const step = (/** @type {string} */ run) => `bash -e -c ${quote(run)}`;
  const keyFiles = folders.map((folder) => `${folder}/.run-job-key`);
  const current = keyFiles
    .map((file) => `[ "$(cat ${file} 2>/dev/null)" = ${quote(key)} ]`)
    .join(' && ');

  return [
    'set -e',
    // GitHub's container HOME belongs to its runner user, not root; the jobs
    // that need a root-owned HOME set `HOME: /root` themselves.
    'mkdir -p /github/home && chown 1001:1001 /github/home',
    'tar -xf - -C /src',
    // run-job.mjs keeps stdin open while it runs, so the leg stops when it
    // dies, even when no Ctrl+C handler runs.
    'exec 3<&0 < /dev/null',
    '{ cat <&3 > /dev/null; kill -KILL $$; } &',
    'cd /src',
    'echo "run-job: node $(node --version)"',
    ...(nodeVersion === null
      ? []
      : [
          `[ "$(node -p 'process.versions.node.split(".")[0]')" = ${quote(String(nodeVersion).split('.')[0])} ] || { echo "run-job: the image's node $(node --version) does not match setup-node ${nodeVersion}"; exit 1; }`,
        ]),
    `if ! { ${current}; }; then`,
    // One step per line: set -e stops at a failing step only outside an && list.
    ...setup.map((run) => `  ${step(run)}`),
    ...keyFiles.map((file) => `  printf %s ${quote(key)} > ${file}`),
    'fi',
    'status=0',
    `${checks.map(step).join(' && ') || 'true'} || status=$?`,
    'if [ -d dist/.playwright ]; then cp -r dist/.playwright /out/; fi',
    // On a Linux host, files root writes into /out would be root's there.
    'if [ -n "$HOST_UID" ]; then chown -R "$HOST_UID" /out; fi',
    'exit $status',
  ].join('\n');
}

/**
 * Containers this run started, removed on an interrupt.
 *
 * @type {Set<string>}
 */
const running = new Set();

/** @param {number} code */
function stop(code) {
  if (running.size > 0) {
    try {
      execFileSync('docker', ['rm', '-f', ...running], { stdio: 'ignore' });
    } catch {
      // Already gone.
    }
  }

  process.exit(code);
}

/**
 * Prints each line with its leg's label and keeps the leg's own copy in `log`.
 *
 * @param {NodeJS.ReadableStream} stream
 * @param {string} label
 * @param {NodeJS.WritableStream} log
 * @param {NodeJS.WritableStream} sink
 */
function relay(stream, label, log, sink) {
  createInterface({ input: stream, crlfDelay: Infinity }).on('line', (line) => {
    log.write(`${line}\n`);
    sink.write(`[${label}] ${line}\n`);
  });
}

/**
 * @param {Leg} leg
 * @param {string[]} files
 * @returns {Promise<number>} The leg's exit status.
 */
function runContainer({ args, name, label, log }, files) {
  return new Promise((done) => {
    const tar = spawn('tar', ['-cf', '-', '--null', '-T', '-'], {
      cwd: root,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const docker = spawn('docker', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const output = createWriteStream(log);
    /** @type {string | null} */
    let tarFailure = null;
    // The container's stdin stays open on success (its watchdog reads it), so
    // a failed tar has to end it, or `tar -xf -` in the container waits on it
    // for ever.
    const endInput = (/** @type {string} */ reason) => {
      tarFailure ??= reason;
      tar.stdout.unpipe(docker.stdin);
      docker.stdin.end();
    };

    running.add(name);

    for (const stream of [tar, docker, tar.stdin, docker.stdin]) {
      stream.on('error', (/** @type {NodeJS.ErrnoException} */ error) => {
        if (error.code !== 'EPIPE') {
          console.error(`run-job: ${error.message}`);
        }
      });
    }

    relay(tar.stderr, label, output, process.stderr);
    relay(docker.stdout, label, output, process.stdout);
    relay(docker.stderr, label, output, process.stderr);
    tar.on('error', (error) => {
      endInput(`tar failed: ${error.message}`);
    });
    tar.on('close', (code, signal) => {
      if (code !== 0) {
        endInput(`tar exited with ${String(code ?? signal)}`);
      }
    });
    docker.on('close', (code) => {
      running.delete(name);
      output.end();

      if (tarFailure !== null) {
        console.error(`run-job: [${label}] ${tarFailure}`);
        done(1);

        return;
      }

      done(code ?? 1);
    });
    tar.stdout.pipe(docker.stdin, { end: false });
    tar.stdin.end(files.join('\0'));
  });
}

/** @param {number} ms */
function seconds(ms) {
  const total = Math.round(ms / 1000);

  return `${String(Math.floor(total / 60))} m ${String(total % 60)} s`;
}

/** @param {ReturnType<typeof parseArgs>} options */
async function run({
  workflow,
  job: jobName,
  matrix: filter,
  dryRun,
  legs: cap,
  e2eWorkers,
  command,
}) {
  const job = loadJob(workflow, jobName);
  const combos = combinations(job.matrix, filter);

  if (combos.length === 0) {
    fail('the --matrix filter matches no combination');
  }

  const files = sourceFiles();
  const folders = modulesFolders(
    JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')),
  );
  const { checkout, volume } = legPaths(root, workflow, jobName, '');
  const legs = Math.min(cap, combos.length);

  /**
   * Slot 0 keeps the job's volumes; each other concurrent slot has its own, so legs never share a writable node_modules.
   *
   * @param {Matrix} combo
   * @param {number} slot
   */
  function leg(combo, slot) {
    const setup = job.setup.map((run) => resolve(run, combo));
    const checks = legChecks(job.checks, combo, command);
    const key = setupKey(job, setup, files);
    const label = [workflow, jobName, ...Object.values(combo)].join('-');
    const { out } = legPaths(root, workflow, jobName, label);
    const name =
      `ngx-yeti-run-job-${checkout}-${label}-${String(process.pid)}`.replace(
        /[^\w.-]/g,
        '-',
      );
    const slotVolume = slot === 0 ? volume : `${volume}-leg${String(slot + 1)}`;
    const env = {
      CI: 'true',
      HOME: '/github/home',
      HOST_UID: String(process.getuid?.() ?? ''),
      npm_config_cache: '/npm-cache',
      ...(e2eWorkers > 0 ? { E2E_LOCAL_WORKERS: String(e2eWorkers) } : {}),
      ...job.env,
    };
    const args = [
      'run',
      '--rm',
      '-i',
      '--init',
      '--name',
      name,
      ...folders.flatMap((folder) => [
        '-v',
        `${slotVolume}-${folder.replaceAll('/', '-')}:/src/${folder}`,
      ]),
      '-v',
      'ngx-yeti-run-job-npm-cache:/npm-cache',
      '-v',
      `${out}:/out`,
      ...Object.entries(env).flatMap(([variable, value]) => [
        '-e',
        `${variable}=${resolve(value, combo)}`,
      ]),
      job.image,
      'bash',
      '-c',
      containerScript({
        setup,
        checks,
        key,
        folders,
        nodeVersion: job.nodeVersion,
      }),
    ];

    return { args, name, label, out, log: join(out, 'run-job.log') };
  }

  if (dryRun) {
    combos.forEach((combo, index) => {
      const { args, label } = leg(combo, index % legs);

      console.log(`\n=== ${label} (${job.image})`);
      console.log(['docker', ...args].map(quote).join(' '));
    });

    return;
  }

  process.on('SIGINT', () => stop(130));
  process.on('SIGTERM', () => stop(143));

  const queue = combos.map((combo, index) => ({ combo, index }));
  /** @type {(Leg & { status: number, ms: number })[]} */
  const results = [];

  console.log(
    `run-job: ${String(combos.length)} legs of ${workflow} ${jobName}, ${String(legs)} at a time (${job.image})`,
  );
  await Promise.all(
    Array.from({ length: legs }, async (_, slot) => {
      for (let next = queue.shift(); next; next = queue.shift()) {
        const current = leg(next.combo, slot);
        const start = Date.now();

        rmSync(current.out, { recursive: true, force: true });
        mkdirSync(current.out, { recursive: true });
        console.log(`=== start ${current.label}`);

        const status = await runContainer(current, files);

        results[next.index] = { ...current, status, ms: Date.now() - start };
        console.log(
          `=== ${status === 0 ? 'pass' : 'FAIL'} ${current.label} in ${seconds(Date.now() - start)}`,
        );
      }
    }),
  );

  console.log('');

  for (const { label, out, log, status, ms } of results) {
    console.log(
      `${status === 0 ? 'pass' : `FAIL (${String(status)})`}  ${label}  ${seconds(ms)}  reports: ${out}  log: ${log}`,
    );
  }

  process.exitCode = results.some(({ status }) => status !== 0) ? 1 : 0;
}

if (import.meta.main) {
  await run(parseArgs(process.argv.slice(2)));
}
