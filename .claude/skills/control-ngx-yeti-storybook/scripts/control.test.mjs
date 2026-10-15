// @ts-check
// Drives control.mjs through one static launch with the Nx daemon on: the
// refused flags and planted state, the freshness check over the shared story
// helpers, and down's session report and daemon stop. Windows only, like the
// proof runs. Builds the static Storybook, so nothing else may build in this
// checkout while it runs.
// Run: node --test .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
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
const builtIndex = join(root, 'packages/ngx-yeti/storybook-static/index.json');
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
 * @property {{ outcome: string, detail: string }} [sessionClose]
 * @property {{ stopped: boolean }} [daemon]
 * @property {number[]} [stoppedPids]
 * @property {number[]} [survivors]
 * @property {boolean} [portFree]
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
const owners = (port) =>
  pwsh(
    `try { Get-NetTCPConnection -State Listen -LocalPort ${String(port)} -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess } catch { if ($_.CategoryInfo.Category -eq 'ObjectNotFound' -and $_.CategoryInfo.Activity -eq 'Get-NetTCPConnection') { exit 0 }; [Console]::Error.WriteLine($_); exit 1 }`,
  )
    .split(/\r?\n/)
    .filter(Boolean)
    .map(Number);

/** @param {number} port */
const listening = (port) => owners(port).length > 0;

/** @param {number} port */
async function waitListening(port) {
  for (let waited = 0; !listening(port) && waited < 15000; waited += 250) {
    await new Promise((done) => setTimeout(done, 250));
  }

  assert.ok(listening(port), `nothing listens on ${port}`);
}

async function freePort() {
  const server = createServer();
  await new Promise((done) => server.listen(0, () => done(undefined)));
  const address = server.address();
  assert.ok(address !== null && typeof address === 'object');
  await new Promise((done) => server.close(done));

  return address.port;
}

// The start time as control.mjs's process table records it.
/** @param {number} pid */
const startOf = (pid) =>
  pwsh(
    `(Get-CimInstance Win32_Process -Filter "ProcessId=${String(pid)}").CreationDate.ToUniversalTime().ToString('o')`,
  ).trim();

/** @param {number} port */
const listenScript = (port) =>
  `require('node:net').createServer().listen(${String(port)})`;

// A playwright-cli registry holding an empty `<session>.session` entry.
/** @param {string} session */
function registryWithEmptyEntry(session) {
  const registry = mkdtempSync(join(tmpdir(), 'control-storybook-registry-'));
  mkdirSync(join(registry, 'daemon-a'));
  const entry = join(registry, 'daemon-a', `${session}.session`);
  writeFileSync(entry, '');

  return { registry, entry };
}

/** @param {number[]} pids */
function killAll(pids) {
  for (const pid of pids) {
    try {
      process.kill(pid);
    } catch {
      // Already gone.
    }
  }
}

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
  assert.equal(result.sessionClose?.outcome, 'left-open');
  assert.match(
    result.message ?? '',
    new RegExp(`session ${session} left-open`),
  );
});

test('down stops the tree and reports an unreadable session entry as left open', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const session = 'control-ngx-yeti-storybook-test-unreadable';
  const port = await freePort();
  const target = 'ngx-yeti:static-storybook';
  const server = spawn(
    process.execPath,
    ['-e', listenScript(port), target, `--port=${String(port)}`],
    { detached: true, stdio: 'ignore', windowsHide: true },
  );
  server.unref();
  const { pid } = server;
  assert.ok(pid !== undefined);
  const { registry, entry } = registryWithEmptyEntry(session);
  t.after(() => {
    killAll([pid]);
    rmSync(stateFile, { force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  await waitListening(port);
  mkdirSync(scratch, { recursive: true });
  writeState({
    session,
    pid,
    port,
    url: `http://localhost:${String(port)}`,
    target,
    log: join(scratch, 'test-unreadable.log'),
    startTime: startOf(pid),
  });

  const { code, result } = controlWith(
    { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry },
    'down',
  );
  assert.equal(code, 1, JSON.stringify(result));
  assert.equal(result.sessionClose?.outcome, 'left-open');
  assert.ok(
    result.sessionClose?.detail.includes(entry),
    result.sessionClose?.detail,
  );
  assert.match(
    result.message ?? '',
    new RegExp(`session ${session} left-open`),
  );
  assert.deepEqual(result.stoppedPids, [pid]);
  assert.deepEqual(result.survivors, []);
  assert.equal(result.portFree, true);
  assert.equal(alive(pid), false);
  assert.equal(listening(port), false);
  assert.equal(existsSync(stateFile), false);
});

test('down on a dead recorded pid exits 1 while a child of it keeps the port', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const session = 'control-ngx-yeti-storybook-test-orphan';
  const port = await freePort();
  const root = spawn(
    process.execPath,
    [
      '-e',
      `require('node:child_process').spawn(process.execPath, ['-e', ${JSON.stringify(listenScript(port))}], { detached: true, stdio: 'ignore' }); setInterval(() => {}, 1 << 30);`,
    ],
    { detached: true, stdio: 'ignore', windowsHide: true },
  );
  root.unref();
  const { pid } = root;
  assert.ok(pid !== undefined);
  const registry = mkdtempSync(join(tmpdir(), 'control-storybook-registry-'));
  t.after(() => {
    killAll(listening(port) ? owners(port) : []);
    rmSync(stateFile, { force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  await waitListening(port);
  const [child] = owners(port);
  assert.ok(child !== undefined && child !== pid);
  mkdirSync(scratch, { recursive: true });
  writeState({
    session,
    pid,
    port,
    url: `http://localhost:${String(port)}`,
    target: 'ngx-yeti:static-storybook',
    log: join(scratch, 'test-orphan.log'),
    startTime: startOf(pid),
  });
  process.kill(pid);
  await waitGone(pid);

  const { code, result } = controlWith(
    { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry },
    'down',
  );
  assert.equal(code, 1, JSON.stringify(result));
  assert.match(result.message ?? '', /^teardown incomplete: /);
  assert.match(result.message ?? '', new RegExp(`pid ${String(child)} still`));
  assert.match(result.message ?? '', new RegExp(`port ${String(port)} still`));
  assert.deepEqual(result.stoppedPids, []);
  assert.deepEqual(result.survivors, [child]);
  assert.equal(result.portFree, false);
  assert.equal(result.sessionClose?.outcome, 'absent');
  assert.equal(existsSync(stateFile), false, 'the state file was kept');
  assert.ok(alive(child), 'down stopped a process of a dead root');
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

  await t.test(
    'doctor passes on a build the Nx cache restored with older file times',
    () => {
      const { atime, mtime } = statSync(builtIndex);

      try {
        utimesSync(builtIndex, atime, new Date('2000-01-01T00:00:00Z'));
        const { code, result } = control('doctor');
        assert.equal(code, 0, JSON.stringify(result.checks));
      } finally {
        utimesSync(builtIndex, atime, mtime);
      }
    },
  );

  await t.test('doctor fails when the server log shows no build', () => {
    const state = readState();
    const emptyLog = join(scratch, 'test-no-build.log');
    writeFileSync(emptyLog, '');

    try {
      writeState({ ...state, log: emptyLog });
      const { code, result } = control('doctor');
      assert.equal(code, 1, JSON.stringify(result.checks));
      const fresh = result.checks?.find(
        ({ name }) => name === 'build matches checkout',
      );
      assert.equal(fresh?.status, 'fail', fresh?.detail);
      assert.match(fresh?.detail ?? '', /no ngx-yeti:build-storybook run/);
    } finally {
      writeState(state);
      rmSync(emptyLog, { force: true });
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
  assert.deepEqual(down.result.survivors, []);
  assert.equal(down.result.portFree, true);
  assert.equal(existsSync(stateFile), false);
  assert.equal(listening(run.port), false);
  assert.equal(daemonRunning(), false, 'the Nx daemon is still running');
});
