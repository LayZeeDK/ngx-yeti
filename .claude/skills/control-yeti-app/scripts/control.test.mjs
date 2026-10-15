// @ts-check
// Drives control.mjs through one ssr launch with the Nx daemon on: the refused
// flags and planted state, doctor's build-fresh scan, down's kept state file
// and its daemon stop. Windows only, like control.mjs. Builds the Fixture app,
// so nothing else may build in this checkout while it runs.
// Run: node --test .claude/skills/control-yeti-app/scripts/control.test.mjs
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
const stateFile = join(root, 'tmp', 'control-yeti-app', 'state.json');
const entrySource = join(root, 'packages/ngx-yeti/box/src/index.ts');
const yetiSource = join(root, 'vendor/yeti/package.json');
const plantedFile = join(root, 'tmp', 'control-yeti-app', 'planted.txt');
const daemonEntry = join(
  root,
  'node_modules/nx/dist/src/daemon/server/start.js',
).toLowerCase();

/**
 * The fields of control.mjs's JSON output these tests read.
 *
 * @typedef {object} ControlResult
 * @property {string} [error]
 * @property {{ name: string, status: string, detail: string }[]} [checks]
 * @property {unknown} [build]
 * @property {string[]} [failed]
 * @property {unknown} [portFree]
 * @property {unknown} [listenerError]
 * @property {unknown} [survivors]
 * @property {unknown} [stateFile]
 * @property {{ session: string, outcome: string, detail: string }[]} [sessions]
 * @property {{ stopped: boolean }} [daemon]
 * @property {unknown} [stopped]
 */

/**
 * @typedef {object} Launch
 * @property {number} pid
 * @property {number} port
 * @property {string} session
 * @property {string} url
 * @property {string} evidenceDir
 * @property {unknown} [start]
 * @property {unknown} [commandLine]
 */

/** @type {Launch | null} */
let launch = null;
/** @type {import('node:net').Server | null} */
let listener = null;

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
  typeof result.url === 'string' &&
  'evidenceDir' in result &&
  typeof result.evidenceDir === 'string';

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

// control.mjs's listener query: a failed query fails the test instead of
// reading as no listener.
/** @param {number} port */
const owners = (port) => [
  ...new Set(
    pwsh(
      `try { Get-NetTCPConnection -State Listen -LocalPort ${String(port)} -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess } catch { if ($_.CategoryInfo.Category -eq 'ObjectNotFound' -and $_.CategoryInfo.Activity -eq 'Get-NetTCPConnection') { exit 0 }; [Console]::Error.WriteLine($_); exit 1 }`,
    )
      .split(/\r?\n/)
      .filter(Boolean)
      .map(Number),
  ),
];

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

// The start time and command line as control.mjs's process table records
// them.
/** @param {number} pid */
function processOf(pid) {
  /** @type {{ CommandLine: string | null, Start: string | null }} */
  const entry = JSON.parse(
    pwsh(
      `Get-CimInstance Win32_Process -Filter "ProcessId=${String(pid)}" | Select-Object CommandLine,@{n='Start';e={$_.CreationDate.ToUniversalTime().ToString('o')}} | ConvertTo-Json -Compress`,
    ),
  );

  return entry;
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

// The run's browser and its JavaScript-off browser, as the skill opens them.
/** @param {Launch} run */
function openSessions(run) {
  cli(run.session, 'open', `${run.url}card`);
  cli(
    `${run.session}-jsoff`,
    'open',
    `${run.url}card`,
    `--config=${join(run.evidenceDir, 'js-off.json')}`,
  );
}

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

async function closeListener() {
  const open = listener;

  if (open) {
    await new Promise((done) => open.close(done));
    listener = null;
  }
}

// Puts the launch's own pid, start and port back and stops it, whatever an
// earlier step left behind.
async function ensureDown() {
  await closeListener();

  if (launch && existsSync(stateFile)) {
    writeState({
      ...readState(),
      pid: launch.pid,
      start: launch.start,
      commandLine: launch.commandLine,
      port: launch.port,
      session: launch.session,
    });
    control('down');
  }
}

test('refuses unknown flags and values after a space', () => {
  for (const args of [
    ['up', '--mode', 'ssr'],
    ['up', '--config=production'],
    ['doctor', '--url', 'http://localhost:4310/sub/'],
  ]) {
    const { code, result } = control(...args);
    assert.equal(code, 2, `${args.join(' ')}: ${JSON.stringify(result)}`);
    assert.match(result.error ?? '', new RegExp(`unknown argument ${args[1]}`));
  }

  assert.equal(existsSync(stateFile), false, 'a refused up wrote state');
});

test('every command refuses a state file that is not JSON', (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  mkdirSync(dirname(stateFile), { recursive: true });
  writeFileSync(stateFile, '{"pid":');
  t.after(() => rmSync(stateFile, { force: true }));

  for (const command of ['up', 'doctor', 'info', 'down']) {
    const { code, result } = control(command);
    assert.equal(code, 2, `${command}: ${JSON.stringify(result)}`);
    assert.match(result.error ?? '', /could not be read as JSON/, command);
  }
});

/** @param {string} name */
async function deadRun(name) {
  const gone = spawnSync(process.execPath, ['-e', '']).pid;
  const server = createServer();
  await new Promise((done) => server.listen(0, () => done(undefined)));
  const address = server.address();
  assert.ok(address !== null && typeof address === 'object');
  await new Promise((done) => server.close(done));
  const evidenceDir = join(root, 'tmp', 'control-yeti-app', name);
  mkdirSync(evidenceDir, { recursive: true });

  return {
    session: `control-yeti-app-${name}`,
    pid: gone,
    port: address.port,
    url: `http://localhost:${String(address.port)}/sub/`,
    logFile: join(evidenceDir, 'server.log'),
    evidenceDir,
  };
}

test('down counts a session entry without a socketPath, or a registry it cannot list, as left open', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const state = await deadRun('test-shape');
  const registry = mkdtempSync(join(tmpdir(), 'control-yeti-app-registry-'));
  mkdirSync(join(registry, 'daemon-a'));
  const entry = join(registry, 'daemon-a', `${state.session}.session`);
  writeFileSync(entry, '{"version":2}');
  const notFolder = join(registry, 'not-a-folder');
  writeFileSync(notFolder, '');
  t.after(() => {
    rmSync(stateFile, { force: true });
    rmSync(state.evidenceDir, { recursive: true, force: true });
    rmSync(registry, { recursive: true, force: true });
  });

  for (const { base, named, outcomes } of [
    { base: registry, named: entry, outcomes: ['left-open', 'absent'] },
    { base: notFolder, named: notFolder, outcomes: ['left-open', 'left-open'] },
  ]) {
    writeState(state);
    const { code, result } = controlWith(
      { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: base },
      'down',
    );
    assert.equal(code, 1, JSON.stringify(result));
    assert.deepEqual(
      (result.sessions ?? []).map(({ outcome }) => outcome),
      outcomes,
      JSON.stringify(result.sessions),
    );
    assert.ok(
      result.sessions?.[0]?.detail.includes(named),
      result.sessions?.[0]?.detail,
    );
  }
});

test('down stops waiting at the first listener query that times out', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const state = await deadRun('test-hung-query');
  const registry = mkdtempSync(join(tmpdir(), 'control-yeti-app-registry-'));
  t.after(() => {
    rmSync(stateFile, { force: true });
    rmSync(state.evidenceDir, { recursive: true, force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  writeState(state);

  const before = Date.now();
  const { code, result } = controlWith(
    {
      ...envWithoutCli(),
      CONTROL_SESSION_REGISTRY: registry,
      CONTROL_LISTENER_TIMEOUT_MS: '1',
    },
    'down',
  );
  const took = Date.now() - before;
  assert.equal(code, 1, JSON.stringify(result));
  assert.match(
    String(result.listenerError),
    new RegExp(
      `listener query on ${String(state.port)} gave no answer in 1 ms`,
    ),
  );
  assert.equal(result.portFree, false);
  assert.match(
    result.error ?? '',
    new RegExp(`port ${String(state.port)} not confirmed free`),
  );
  assert.equal(existsSync(stateFile), false, 'down kept the state file');
  // Twenty attempts would sleep 10 s between them alone.
  assert.ok(took < 12000, `down took ${String(took)} ms`);
});

test('down on a dead recorded pid exits 1 while a child of it keeps the port', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const session = 'control-yeti-app-test-orphan';
  const port = await freePort();
  const deadRoot = spawn(
    process.execPath,
    [
      '-e',
      `require('node:child_process').spawn(process.execPath, ['-e', ${JSON.stringify(`require('node:net').createServer().listen(${String(port)})`)}], { detached: true, stdio: 'ignore' }); setInterval(() => {}, 1 << 30);`,
    ],
    { detached: true, stdio: 'ignore', windowsHide: true },
  );
  deadRoot.unref();
  const { pid } = deadRoot;
  assert.ok(pid !== undefined);
  const registry = mkdtempSync(join(tmpdir(), 'control-yeti-app-registry-'));
  const evidenceDir = join(root, 'tmp', 'control-yeti-app', 'test-orphan');
  mkdirSync(evidenceDir, { recursive: true });
  t.after(() => {
    killAll([pid, ...owners(port)]);
    rmSync(stateFile, { force: true });
    rmSync(evidenceDir, { recursive: true, force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  await waitListening(port);
  const [child] = owners(port);
  assert.ok(child !== undefined && child !== pid);
  const recorded = processOf(pid);
  writeState({
    session,
    pid,
    start: recorded.Start,
    commandLine: recorded.CommandLine,
    port,
    url: `http://localhost:${String(port)}/sub/`,
    logFile: join(evidenceDir, 'server.log'),
    evidenceDir,
  });
  process.kill(pid);
  await waitGone(pid);
  const env = { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry };

  const { code, result } = controlWith(env, 'down');
  assert.equal(code, 1, JSON.stringify(result));
  const error = result.error ?? '';
  assert.match(error, /^teardown incomplete/);
  assert.match(error, new RegExp(`pid ${String(child)} still running`));
  assert.match(
    error,
    new RegExp(
      `port ${String(port)} still listens \\(listeners \\[${String(child)}\\]\\)`,
    ),
  );
  assert.match(error, new RegExp(`to stop by hand: pid ${String(child)}$`));
  assert.deepEqual(result.stopped, []);
  assert.deepEqual(result.survivors, [child]);
  assert.equal(result.portFree, false);
  assert.deepEqual(
    (result.sessions ?? []).map(({ outcome }) => outcome),
    ['absent', 'absent'],
    JSON.stringify(result.sessions),
  );
  assert.equal(result.daemon?.stopped, true);
  assert.equal(existsSync(stateFile), false, 'down kept the state file');
  assert.ok(alive(child), 'down stopped a process of a dead root');

  const again = controlWith(env, 'down');
  assert.equal(again.code, 2, JSON.stringify(again.result));
  assert.match(again.result.error ?? '', /^no state file at /);

  const relaunch = control('up', `--port=${String(port)}`);
  assert.equal(relaunch.code, 2, JSON.stringify(relaunch.result));
  assert.match(
    relaunch.result.error ?? '',
    new RegExp(`port ${String(port)} is in use by pid ${String(child)}`),
  );
  assert.doesNotMatch(relaunch.result.error ?? '', /already up/);
  assert.equal(existsSync(stateFile), false, 'a refused up wrote state');
});

test('down on a dead recorded pid leaves out a process that started before the recorded root', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const state = await deadRun('test-stale');
  const childFile = join(state.evidenceDir, 'child.txt');
  const parent = spawn(
    process.execPath,
    [
      '-e',
      `const child = require('node:child_process').spawn(process.execPath, ['-e', 'setInterval(() => {}, 1 << 30)'], { detached: true, stdio: 'ignore' }); require('node:fs').writeFileSync(${JSON.stringify(childFile)}, String(child.pid)); child.unref();`,
    ],
    { detached: true, stdio: 'ignore', windowsHide: true },
  );
  parent.unref();
  const { pid } = parent;
  assert.ok(pid !== undefined);
  const registry = mkdtempSync(join(tmpdir(), 'control-yeti-app-registry-'));
  /** @type {number[]} */
  const toKill = [];
  t.after(() => {
    killAll(toKill);
    rmSync(stateFile, { force: true });
    rmSync(state.evidenceDir, { recursive: true, force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  await waitGone(pid);
  const child = Number(readFileSync(childFile, 'utf8'));
  toKill.push(child);
  assert.ok(alive(child), 'the child did not outlive its parent');
  const childStart = processOf(child).Start;
  assert.ok(childStart !== null);
  // The recorded root started after the child, as a later holder of the
  // dead root's PID would have.
  writeState({
    ...state,
    pid,
    start: new Date(Date.parse(childStart) + 1).toISOString(),
  });

  const { code, result } = controlWith(
    { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry },
    'down',
  );
  assert.equal(code, 0, JSON.stringify(result));
  assert.deepEqual(result.survivors, []);
  assert.doesNotMatch(
    JSON.stringify(result),
    new RegExp(`\\b${String(child)}\\b`),
  );
  assert.ok(alive(child), 'down stopped a process outside the run');
});

test('down without playwright-cli exits 1 while the session is listed as open', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const session = 'control-yeti-app-test-absent';
  const gone = spawnSync(process.execPath, ['-e', '']).pid;
  const server = createServer();
  await new Promise((done) => server.listen(0, () => done(undefined)));
  const address = server.address();
  assert.ok(address !== null && typeof address === 'object');
  await new Promise((done) => server.close(done));
  const evidenceDir = join(root, 'tmp', 'control-yeti-app', 'test-absent');
  mkdirSync(evidenceDir, { recursive: true });
  writeState({
    session,
    pid: gone,
    port: address.port,
    url: `http://localhost:${String(address.port)}/sub/`,
    logFile: join(evidenceDir, 'server.log'),
    evidenceDir,
  });
  t.after(() => {
    cli(session, 'close');
    rmSync(stateFile, { force: true });
    rmSync(evidenceDir, { recursive: true, force: true });
  });
  cli(session, 'open');

  const { code, result } = controlWith(envWithoutCli(), 'down');
  assert.equal(code, 1, JSON.stringify(result));
  assert.deepEqual(
    (result.sessions ?? []).map(({ outcome }) => outcome),
    ['left-open', 'absent'],
    JSON.stringify(result.sessions),
  );
  assert.match(result.error ?? '', new RegExp(`session ${session} left-open`));
});

test('down stops the tree and reports an unreadable session entry as left open', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const session = 'control-yeti-app-test-unreadable';
  const server = createServer();
  await new Promise((done) => server.listen(0, () => done(undefined)));
  const address = server.address();
  assert.ok(address !== null && typeof address === 'object');
  await new Promise((done) => server.close(done));
  const { port } = address;
  const fake = spawn(
    process.execPath,
    ['-e', `require('node:net').createServer().listen(${String(port)})`],
    { detached: true, stdio: 'ignore', windowsHide: true },
  );
  fake.unref();
  const { pid } = fake;
  assert.ok(pid !== undefined);
  const registry = mkdtempSync(join(tmpdir(), 'control-yeti-app-registry-'));
  mkdirSync(join(registry, 'daemon-a'));
  const entry = join(registry, 'daemon-a', `${session}.session`);
  writeFileSync(entry, '');
  const evidenceDir = join(root, 'tmp', 'control-yeti-app', 'test-unreadable');
  mkdirSync(evidenceDir, { recursive: true });
  t.after(() => {
    try {
      process.kill(pid);
    } catch {
      // down stopped it.
    }

    rmSync(stateFile, { force: true });
    rmSync(evidenceDir, { recursive: true, force: true });
    rmSync(registry, { recursive: true, force: true });
  });

  for (let waited = 0; !listening(port) && waited < 15000; waited += 250) {
    await new Promise((done) => setTimeout(done, 250));
  }

  assert.ok(listening(port), `nothing listens on ${port}`);
  /** @type {{ CommandLine: string | null, Start: string | null }} */
  const live = JSON.parse(
    pwsh(
      `Get-CimInstance Win32_Process -Filter "ProcessId=${String(pid)}" | Select-Object CommandLine,@{n='Start';e={$_.CreationDate.ToUniversalTime().ToString('o')}} | ConvertTo-Json -Compress`,
    ),
  );
  writeState({
    session,
    pid,
    start: live.Start,
    commandLine: live.CommandLine,
    port,
    url: `http://localhost:${String(port)}/sub/`,
    logFile: join(evidenceDir, 'server.log'),
    evidenceDir,
  });

  const { code, result } = controlWith(
    { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry },
    'down',
  );
  assert.equal(code, 1, JSON.stringify(result));
  assert.deepEqual(
    (result.sessions ?? []).map(({ outcome }) => outcome),
    ['left-open', 'absent'],
    JSON.stringify(result.sessions),
  );
  assert.ok(
    result.sessions?.[0]?.detail.includes(entry),
    result.sessions?.[0]?.detail,
  );
  assert.match(result.error ?? '', new RegExp(`session ${session} left-open`));
  assert.deepEqual(result.stopped, [pid]);
  assert.equal(result.portFree, true);
  assert.equal(alive(pid), false);
  assert.equal(listening(port), false);
  assert.equal(existsSync(stateFile), false);
});

test('a launch with the Nx daemon on', async (t) => {
  t.before(() => {
    assert.equal(
      existsSync(stateFile),
      false,
      `${stateFile} exists; run down before this test`,
    );
    const { code, result } = control(
      'up',
      '--mode=ssr',
      '--configuration=production',
    );
    assert.equal(code, 0, JSON.stringify(result));
    assert.ok(isLaunch(result), JSON.stringify(result));
    launch = result;
  });

  t.after(ensureDown);

  await t.test('doctor takes the build from the state file', () => {
    const { code, result } = control('doctor');
    assert.equal(code, 0, JSON.stringify(result.checks));
    assert.equal(result.build, 'production');
  });

  await t.test('doctor build-fresh fails after a source changes', () => {
    for (const source of [entrySource, yetiSource]) {
      const { atime, mtime } = statSync(source);

      try {
        utimesSync(source, atime, new Date());
        const { code, result } = control('doctor');
        assert.equal(code, 1, source);
        const failed = result.failed ?? [];
        assert.ok(failed.includes('build-fresh'), failed.join());
      } finally {
        utimesSync(source, atime, mtime);
      }
    }
  });

  await t.test('doctor ignores node_modules, storybook-static and dist', () => {
    const created = [
      'packages/ngx-yeti/node_modules',
      'packages/ngx-yeti/storybook-static',
      'packages/ngx-yeti/box/dist',
    ].map((dir) => {
      const made = !existsSync(join(root, dir));
      mkdirSync(join(root, dir), { recursive: true });
      const file = join(root, dir, 'control-yeti-app-test.txt');
      writeFileSync(file, 'newer than the launch\n');

      return { dir: join(root, dir), file, made };
    });

    try {
      const { code, result } = control('doctor');
      assert.equal(code, 0, JSON.stringify(result.checks));
    } finally {
      for (const { dir, file, made } of created) {
        rmSync(made ? dir : file, { recursive: true, force: true });
      }
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

  await t.test('down refuses a pid whose start time does not match', () => {
    const state = readState();
    writeState({ ...state, start: '2000-01-01T00:00:00.0000000Z' });

    try {
      const { code } = control('down');
      assert.equal(code, 2);
      assert.ok(existsSync(stateFile));
    } finally {
      writeState(state);
    }
  });

  await t.test(
    'down exits 1 and keeps the file while the port is busy, and the retry on the dead root removes it',
    async () => {
      openSessions(started());
      const server = createServer();
      listener = server;
      await new Promise((done) => server.listen(0, () => done(undefined)));
      const address = server.address();
      assert.ok(address !== null && typeof address === 'object');
      const busyPort = address.port;
      writeState({ ...readState(), port: busyPort });

      const first = control('down');
      assert.equal(first.code, 1, JSON.stringify(first.result));
      assert.ok(existsSync(stateFile), 'first down removed the state file');
      assert.equal(first.result.portFree, false);
      assert.ok(Array.isArray(first.result.survivors));
      assert.equal(first.result.stateFile, stateFile);
      assert.deepEqual(
        (first.result.sessions ?? []).map(({ outcome }) => outcome),
        ['closed', 'closed'],
        JSON.stringify(first.result.sessions),
      );
      assert.match(first.result.error ?? '', /; run down again$/);
      assert.equal(alive(started().pid), false, 'the launch still runs');

      const retry = control('down');
      assert.equal(retry.code, 1, JSON.stringify(retry.result));
      assert.equal(existsSync(stateFile), false, 'the retry kept the file');
      assert.match(
        retry.result.error ?? '',
        new RegExp(
          `port ${String(busyPort)} still listens .*to stop by hand: pid ${String(process.pid)}$`,
        ),
      );
      assert.equal(retry.result.daemon?.stopped, true);

      await closeListener();
      const last = control('down');
      assert.equal(last.code, 2, JSON.stringify(last.result));
    },
  );

  await t.test(
    'ends with the port free, the launch and the daemon gone',
    async () => {
      await ensureDown();
      assert.equal(existsSync(stateFile), false);
      assert.equal(alive(started().pid), false);
      assert.equal(listening(started().port), false);
      assert.equal(daemonRunning(), false, 'the Nx daemon is still running');
    },
  );
});

test('down closes the sessions after the server died on its own', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const { code, result } = control(
    'up',
    '--mode=ssr',
    '--configuration=production',
  );
  assert.equal(code, 0, JSON.stringify(result));
  assert.ok(isLaunch(result), JSON.stringify(result));
  const run = result;
  t.after(() => {
    if (existsSync(stateFile)) {
      control('down');
    }
  });

  openSessions(run);
  spawnSync('taskkill', ['/PID', String(run.pid), '/T', '/F'], {
    windowsHide: true,
  });
  await waitGone(run.pid);

  const down = control('down');
  assert.equal(down.code, 0, JSON.stringify(down.result));
  assert.deepEqual(
    (down.result.sessions ?? []).map(({ outcome }) => outcome),
    ['closed', 'closed'],
    JSON.stringify(down.result.sessions),
  );
  assert.equal(down.result.daemon?.stopped, true);
  assert.equal(existsSync(stateFile), false);
  assert.equal(listening(run.port), false);
  assert.equal(daemonRunning(), false, 'the Nx daemon is still running');
});
