// @ts-check
// Drives control.mjs through one static launch with the Nx daemon on: the
// refused flags and planted state, the freshness check over the shared story
// helpers, and down's session report and daemon stop. Windows only, like the
// proof runs. Builds the static Storybook, so nothing else may build in this
// checkout while it runs.
// Run: node --test .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:net';
import { delimiter, dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../..');
const script = join(here, 'control.mjs');
const scratch = join(root, 'tmp', 'control-ngx-yeti-storybook');
const stateFile = join(scratch, 'state-static.json');
const testingSource = join(root, 'packages/ngx-yeti-testing/src/index.ts');
const plantedFile = join(scratch, 'planted.txt');
const daemonEntry = join(
  root,
  'node_modules/nx/dist/src/daemon/server/start.js',
).toLowerCase();

/**
 * The fields of control.mjs's JSON output these tests read.
 *
 * @typedef {object} ControlResult
 * @property {string} [message]
 * @property {{ name: string, status: string, detail: string }[]} [checks]
 * @property {{ outcome: string, listedOpen?: boolean }} [sessionClose]
 * @property {{ stopped: boolean }} [daemon]
 */

/**
 * @typedef {object} Launch
 * @property {number} pid
 * @property {number} port
 * @property {string} session
 * @property {string} url
 * @property {unknown} [startTime]
 */

/** @type {Launch | null} */
let launch = null;

/**
 * @param {object} result
 * @returns {result is Launch}
 */
const isLaunch = (result) =>
  'pid' in result &&
  typeof result.pid === 'number' &&
  'port' in result &&
  typeof result.port === 'number' &&
  'session' in result &&
  typeof result.session === 'string' &&
  'url' in result &&
  typeof result.url === 'string';

function started() {
  assert.ok(launch, 'up did not run');

  return launch;
}

/** @param {string[]} args */
const control = (...args) => controlWith(process.env, ...args);

/**
 * @param {NodeJS.ProcessEnv} env
 * @param {string[]} args
 */
function controlWith(env, ...args) {
  const run = spawnSync(process.execPath, [script, ...args, '--json'], {
    cwd: root,
    env,
    encoding: 'utf8',
    timeout: 20 * 60 * 1000,
    windowsHide: true,
  });

  assert.ok(run.stdout, `control.mjs ${args.join(' ')}: ${run.stderr}`);

  /** @type {ControlResult} */
  const result = JSON.parse(run.stdout);

  return { code: run.status, result };
}

/** @returns {Record<string, unknown>} */
const readState = () => JSON.parse(readFileSync(stateFile, 'utf8'));
/** @param {Record<string, unknown>} state */
const writeState = (state) =>
  writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);

/** @param {string} command */
function pwsh(command) {
  const run = spawnSync(
    'pwsh',
    ['-NoProfile', '-NonInteractive', '-Command', command],
    { encoding: 'utf8', windowsHide: true },
  );
  assert.equal(run.status, 0, run.stderr);

  return run.stdout;
}

// control-yeti-app's listener query: a failed query fails the test instead of
// reading as no listener.
/** @param {number} port */
const listening = (port) =>
  pwsh(
    `try { Get-NetTCPConnection -State Listen -LocalPort ${String(port)} -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess } catch { if ($_.CategoryInfo.Category -eq 'ObjectNotFound' -and $_.CategoryInfo.Activity -eq 'Get-NetTCPConnection') { exit 0 }; [Console]::Error.WriteLine($_); exit 1 }`,
  ).trim() !== '';

/** @param {string} dir */
const hasCli = (dir) =>
  dir !== '' &&
  existsSync(
    join(dir, 'node_modules', '@playwright', 'cli', 'playwright-cli.js'),
  );

function playwrightCli() {
  const dir = (process.env['PATH'] ?? '').split(delimiter).find(hasCli);
  assert.ok(dir, 'no playwright-cli on PATH');

  return join(dir, 'node_modules', '@playwright', 'cli', 'playwright-cli.js');
}

/**
 * @param {string} session
 * @param {string[]} args
 */
function cli(session, ...args) {
  const run = spawnSync(
    process.execPath,
    [playwrightCli(), `-s=${session}`, ...args],
    { cwd: root, encoding: 'utf8', timeout: 120000, windowsHide: true },
  );
  assert.equal(run.status, 0, `${run.stdout}${run.stderr}`);
}

/** @param {Launch} run */
const openSession = (run) =>
  cli(
    run.session,
    'open',
    `${run.url}/iframe.html?id=card--stretched-link&viewMode=story&embed=true`,
  );

// PATH without the directories that hold playwright-cli.
function envWithoutCli() {
  /** @type {NodeJS.ProcessEnv} */
  const env = { ...process.env };

  for (const key of Object.keys(env)) {
    if (key.toUpperCase() === 'PATH') {
      env[key] = (env[key] ?? '')
        .split(delimiter)
        .filter((dir) => !hasCli(dir))
        .join(delimiter);
    }
  }

  return env;
}

/** @param {number} pid */
async function waitGone(pid) {
  for (let waited = 0; alive(pid) && waited < 15000; waited += 250) {
    await new Promise((done) => setTimeout(done, 250));
  }

  assert.equal(alive(pid), false, `pid ${pid} still runs`);
}

function daemonRunning() {
  /** @typedef {{ CommandLine: string | null }} NodeProcess */
  /** @type {NodeProcess | NodeProcess[]} */
  const processes = JSON.parse(
    pwsh(
      `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Select-Object CommandLine | ConvertTo-Json -Compress`,
    ) || '[]',
  );

  return [processes]
    .flat()
    .some(({ CommandLine }) =>
      (CommandLine ?? '').toLowerCase().includes(daemonEntry),
    );
}

/** @param {number} pid */
function alive(pid) {
  try {
    process.kill(pid, 0);

    return true;
  } catch {
    return false;
  }
}

// Puts the launch's own state back and stops it, whatever an earlier step
// left behind.
function ensureDown() {
  if (launch && existsSync(stateFile)) {
    writeState({
      ...readState(),
      pid: launch.pid,
      port: launch.port,
      session: launch.session,
      startTime: launch.startTime,
    });
    control('down');
  }
}

test('refuses unknown flags and values after a space', () => {
  for (const args of [
    ['up', '--devv'],
    ['doctor', '--url', 'http://localhost:4401'],
    ['up', '--port=4401'],
  ]) {
    const { code, result } = control(...args);
    assert.equal(code, 2, `${args.join(' ')}: ${JSON.stringify(result)}`);
    assert.match(
      result.message ?? '',
      new RegExp(`unknown argument ${args[1]}`),
    );
  }

  assert.equal(existsSync(stateFile), false, 'a refused up wrote state');
});

test('down without playwright-cli exits 1 while the session is listed as open', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const session = 'control-ngx-yeti-storybook-test-absent';
  const gone = spawnSync(process.execPath, ['-e', '']).pid;
  const server = createServer();
  await new Promise((done) => server.listen(0, () => done(undefined)));
  const address = server.address();
  assert.ok(address !== null && typeof address === 'object');
  await new Promise((done) => server.close(done));
  mkdirSync(scratch, { recursive: true });
  writeState({
    session,
    pid: gone,
    port: address.port,
    url: `http://localhost:${String(address.port)}`,
    target: 'ngx-yeti:static-storybook',
    log: join(scratch, 'test-absent.log'),
  });
  t.after(() => {
    cli(session, 'close');
    rmSync(stateFile, { force: true });
  });
  cli(session, 'open');

  const { code, result } = controlWith(envWithoutCli(), 'down');
  assert.equal(code, 1, JSON.stringify(result));
  assert.equal(result.sessionClose?.outcome, 'absent');
  assert.equal(result.sessionClose?.listedOpen, true);
  assert.match(result.message ?? '', new RegExp(`session ${session} absent`));
});

test('a static launch with the Nx daemon on', async (t) => {
  t.before(() => {
    assert.equal(
      existsSync(stateFile),
      false,
      `${stateFile} exists; run down before this test`,
    );
    const { code, result } = control('up');
    assert.equal(code, 0, JSON.stringify(result));
    assert.ok(isLaunch(result), JSON.stringify(result));
    launch = result;
  });

  t.after(ensureDown);

  await t.test('doctor passes right after up', () => {
    const { code, result } = control('doctor');
    assert.equal(code, 0, JSON.stringify(result.checks));
  });

  await t.test('doctor fails after a shared story helper changes', () => {
    const { atime, mtime } = statSync(testingSource);

    try {
      utimesSync(testingSource, atime, new Date());
      const { code, result } = control('doctor');
      assert.equal(code, 1, JSON.stringify(result.checks));
      const fresh = result.checks?.find(
        ({ name }) => name === 'build matches checkout',
      );
      assert.equal(fresh?.status, 'fail', fresh?.detail);
    } finally {
      utimesSync(testingSource, atime, mtime);
    }
  });

  await t.test('down refuses a planted session and runs nothing', () => {
    const state = readState();
    rmSync(plantedFile, { force: true });
    writeState({ ...state, session: `x & echo planted > ${plantedFile}` });

    try {
      const { code, result } = control('down');
      assert.equal(code, 2, JSON.stringify(result));
      assert.equal(existsSync(plantedFile), false, 'the planted command ran');
      assert.ok(alive(started().pid), 'down stopped the launch');
    } finally {
      writeState(state);
    }
  });

  await t.test(
    'down reports the session, frees the port and stops the daemon',
    () => {
      openSession(started());
      const { code, result } = control('down');
      assert.equal(code, 0, JSON.stringify(result));
      assert.equal(
        result.sessionClose?.outcome,
        'closed',
        JSON.stringify(result.sessionClose),
      );
      assert.equal(result.daemon?.stopped, true);
      assert.equal(existsSync(stateFile), false);
      assert.equal(alive(started().pid), false);
      assert.equal(listening(started().port), false);
      assert.equal(daemonRunning(), false, 'the Nx daemon is still running');
    },
  );
});

test('down closes the session and stops the daemon after the server died on its own', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const { code, result } = control('up');
  assert.equal(code, 0, JSON.stringify(result));
  assert.ok(isLaunch(result), JSON.stringify(result));
  const run = result;
  t.after(() => {
    if (existsSync(stateFile)) {
      control('down');
    }
  });

  openSession(run);
  spawnSync('taskkill', ['/PID', String(run.pid), '/T', '/F'], {
    windowsHide: true,
  });
  await waitGone(run.pid);

  const down = control('down');
  assert.equal(down.code, 0, JSON.stringify(down.result));
  assert.equal(
    down.result.sessionClose?.outcome,
    'closed',
    JSON.stringify(down.result.sessionClose),
  );
  assert.equal(down.result.daemon?.stopped, true);
  assert.equal(existsSync(stateFile), false);
  assert.equal(daemonRunning(), false, 'the Nx daemon is still running');
});
