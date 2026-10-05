#!/usr/bin/env node
/** See references/ci-local.md. */
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { load } from 'js-yaml';

const root = join(import.meta.dirname, '../..');
const usage =
  'usage: node tools/ci-local/run-job.mjs <workflow> <job> [--matrix key=value]... [--dry-run] [-- <command>...]';

function fail(message) {
  console.error(`run-job: ${message}`);
  process.exit(2);
}

function parseArgs(argv) {
  const dash = argv.indexOf('--');
  const own = dash === -1 ? argv : argv.slice(0, dash);
  const command = dash === -1 ? [] : argv.slice(dash + 1);
  const [workflow, job, ...rest] = own;
  const matrix = {};
  let dryRun = false;

  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];

    if (argument === '--dry-run') {
      dryRun = true;
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
    command,
  };
}

const token = /'(?:[^']|'')*'|==|&&|\|\||matrix\.\w+/g;

/** GitHub compares strings with `==` case-insensitively. */
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

function resolve(text, matrix) {
  return String(text).replace(/\$\{\{\s*(.*?)\s*\}\}/g, (_, expression) =>
    String(evaluate(expression, matrix)),
  );
}

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

function loadJob(workflowName, jobName) {
  const file = join(root, '.github/workflows', `${workflowName}.yml`);

  if (!existsSync(file)) {
    fail(`no workflow ${file}`);
  }

  const workflow = load(readFileSync(file, 'utf8'));
  const job = workflow.jobs?.[jobName];

  if (!job) {
    fail(`${workflowName}.yml has no job ${jobName}`);
  }

  if (!job.container) {
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
  assertKeys(`${where} strategy`, job.strategy, ['fail-fast', 'matrix']);

  if (typeof job.container !== 'string') {
    assertKeys(`${where} container`, job.container, ['image']);
  }

  const actions = { checkout: [], 'setup-node': ['node-version', 'cache'] };
  let nodeVersion = null;

  for (const step of job.steps ?? []) {
    if (step === null || typeof step !== 'object') {
      fail(`${where} has an empty step`);
    }

    const action = /^actions\/([\w-]+)@/.exec(step.uses ?? '')?.[1];

    if ('run' in step) {
      assertKeys(`a step of ${where}`, step, ['name', 'run']);
    } else if (action !== undefined && action in actions) {
      assertKeys(`a step of ${where}`, step, ['name', 'uses', 'with']);
      assertKeys(`${step.uses} in ${where}`, step.with, actions[action]);
      nodeVersion = step.with?.['node-version'] ?? nodeVersion;
    } else {
      assertKeys(`a step of ${where}`, { [step.uses]: true }, []);
    }
  }

  const runs = (job.steps ?? [])
    .filter((step) => 'run' in step)
    .map((step) => step.run);
  const split = runs.findIndex((run) => !isSetup(run));
  const setup = split === -1 ? runs : runs.slice(0, split);
  const checks = split === -1 ? [] : runs.slice(split);

  if (checks.some(isSetup)) {
    fail(`${where} runs a setup step after a check step`);
  }

  return {
    env: { ...workflow.env, ...job.env },
    image:
      typeof job.container === 'string' ? job.container : job.container.image,
    matrix: job.strategy?.matrix ?? {},
    nodeVersion,
    setup,
    checks,
  };
}

/** The matrix combinations the filter keeps, in GitHub's expansion order. */
function combinations(matrix, filter) {
  if ('include' in matrix || 'exclude' in matrix) {
    fail('matrix include and exclude are not supported');
  }

  for (const key of Object.keys(filter)) {
    if (!(key in matrix)) {
      fail(`the job has no matrix key ${key}`);
    }
  }

  let result = [{}];

  for (const [key, values] of Object.entries(matrix)) {
    if (!Array.isArray(values)) {
      fail(`matrix ${key} is not a list, which run-job.mjs does not run`);
    }

    result = result.flatMap((combo) =>
      values.map((value) => ({ ...combo, [key]: value })),
    );
  }

  return result.filter((combo) =>
    Object.entries(filter).every(
      ([key, value]) => String(combo[key]) === value,
    ),
  );
}

const isSetup = (run) => /^npm (ci|install)\b/.test(run.trim());

function quote(argument) {
  return `'${String(argument).replaceAll("'", "'\\''")}'`;
}

/** Each folder gets its own volume, so installs survive the `--rm` container. */
function modulesFolders(lockfile) {
  const folders = new Set(['node_modules']);

  for (const path of Object.keys(lockfile.packages ?? {})) {
    const nested = path.indexOf('/node_modules/');

    if (nested > 0 && !path.startsWith('node_modules/')) {
      folders.add(path.slice(0, nested + '/node_modules'.length));
    }
  }

  return [...folders].sort();
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

function setupKey(job, setup, files) {
  const hash = createHash('sha256').update(job.image).update(setup.join('\n'));

  for (const path of files.filter((file) =>
    /(^|\/)(package\.json|package-lock\.json|\.npmrc)$/.test(file),
  )) {
    hash.update(path).update(readFileSync(join(root, path)));
  }

  return hash.digest('hex');
}

function containerScript({ setup, checks, key, folders, nodeVersion }) {
  const step = (run) => `bash -e -c ${quote(run)}`;
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

function runContainer(args, files) {
  return new Promise((done) => {
    const tar = spawn('tar', ['-cf', '-', '--null', '-T', '-'], {
      cwd: root,
      stdio: ['pipe', 'pipe', 'inherit'],
    });
    const docker = spawn('docker', args, {
      stdio: ['pipe', 'inherit', 'inherit'],
    });
    let tarStatus = null;

    for (const stream of [tar, docker, tar.stdin, docker.stdin]) {
      stream.on('error', (error) => {
        if (error.code !== 'EPIPE') {
          console.error(`run-job: ${error.message}`);
        }
      });
    }

    tar.on('close', (code) => {
      tarStatus = code;
    });
    docker.on('close', (code) => {
      if (tarStatus !== null && tarStatus !== 0) {
        console.error(`run-job: tar exited with ${tarStatus}`);
        done(1);

        return;
      }

      done(code ?? 1);
    });
    tar.stdout.pipe(docker.stdin);
    tar.stdin.end(files.join('\0'));
  });
}

async function run({
  workflow,
  job: jobName,
  matrix: filter,
  dryRun,
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
  const checkout = createHash('sha256').update(root).digest('hex').slice(0, 8);
  const volume = `ngx-yeti-run-job-${checkout}-${workflow}-${jobName}`;
  const results = [];

  for (const combo of combos) {
    const setup = job.setup.map((run) => resolve(run, combo));
    const checks =
      command.length > 0
        ? [command.map(quote).join(' ')]
        : job.checks.map((run) => resolve(run, combo));
    const key = setupKey(job, setup, files);
    const label = [workflow, jobName, ...Object.values(combo)].join('-');
    const out = join(tmpdir(), 'ngx-yeti-run-job', label);
    const env = {
      CI: 'true',
      HOME: '/github/home',
      HOST_UID: String(process.getuid?.() ?? ''),
      npm_config_cache: '/npm-cache',
      ...job.env,
    };
    const args = [
      'run',
      '--rm',
      '-i',
      '--init',
      ...folders.flatMap((folder) => [
        '-v',
        `${volume}-${folder.replaceAll('/', '-')}:/src/${folder}`,
      ]),
      '-v',
      'ngx-yeti-run-job-npm-cache:/npm-cache',
      '-v',
      `${out}:/out`,
      ...Object.entries(env).flatMap(([name, value]) => [
        '-e',
        `${name}=${resolve(value, combo)}`,
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

    console.log(`\n=== ${label} (${job.image})`);

    if (dryRun) {
      console.log(['docker', ...args].map(quote).join(' '));
      continue;
    }

    rmSync(out, { recursive: true, force: true });
    mkdirSync(out, { recursive: true });
    results.push({ label, out, status: await runContainer(args, files) });
  }

  for (const { label, out, status } of results) {
    console.log(
      `${status === 0 ? 'pass' : `FAIL (${status})`}  ${label}  reports: ${out}`,
    );
  }

  process.exitCode = results.some(({ status }) => status !== 0) ? 1 : 0;
}

await run(parseArgs(process.argv.slice(2)));
