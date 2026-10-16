// @ts-check
// Drives control.mjs through static launches with the Nx daemon on: the
// refused flags and planted state, the freshness check over the shared story
// helpers, doctor's map-fresh line, down's session report and daemon stop,
// and an exception's exit 2. Windows only, like the proof runs. Builds the
// static Storybook, so nothing else may build in this checkout while it runs.
// Run: node --test .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../..');
const script = join(here, 'control.mjs');
const scratch = join(root, 'tmp', 'control-ngx-yeti-storybook');
const stateFile = join(scratch, 'state-static.json');
const testingSource = join(root, 'packages/ngx-yeti-testing/src/index.ts');
const plantedFile = join(scratch, 'planted.txt');
const attachments = join(root, 'packages/ngx-yeti/.vitest-attachments');
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

test('doctor reports map-fresh as a warning or a pass that never changes its exit code', async (t) => {
  // A copy of the skill in a checkout of its own, so its manifest can be
  // unproven, fresh and stale without touching this skill's. The copy's
  // playwright module re-exports this checkout's, so no link is needed.
  mkdirSync(scratch, { recursive: true });
  const checkout = mkdtempSync(join(scratch, 'map-fresh-'));
  const skill = join(
    checkout,
    '.claude',
    'skills',
    'control-ngx-yeti-storybook',
  );
  const page =
    '<!doctype html><title>stand-in</title><body><div id="storybook-root"><p>stand-in</p></div>' +
    '<script>window.__STORYBOOK_PREVIEW__ = { currentRender: { phase: "finished" } };</script></body>';
  const server = createHttpServer((request, response) => {
    if ((request.url ?? '').startsWith('/index.json')) {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ entries: { 'card--stretched-link': {} } }));

      return;
    }

    response.writeHead(200, { 'content-type': 'text/html' });
    response.end(page);
  });
  t.after(async () => {
    await new Promise((done) => server.close(done));
    rmSync(checkout, { recursive: true, force: true });
  });
  mkdirSync(join(checkout, '.git'));
  mkdirSync(join(checkout, 'node_modules', 'playwright'), { recursive: true });
  writeFileSync(
    join(checkout, 'node_modules', 'playwright', 'index.mjs'),
    `export * from '${pathToFileURL(join(root, 'node_modules', 'playwright', 'index.mjs')).href}';\n`,
  );
  mkdirSync(join(skill, 'scripts'), { recursive: true });
  mkdirSync(join(skill, 'features'));

  for (const name of [
    'control.mjs',
    'fingerprint.mjs',
    'storybook-preview.d.ts',
  ]) {
    copyFileSync(join(here, name), join(skill, 'scripts', name));
  }

  writeFileSync(join(skill, 'features', 'page.md'), '# Page\n');
  writeFileSync(join(checkout, 'entry.txt'), 'proven\n');
  await new Promise((done) =>
    server.listen(0, '127.0.0.1', () => done(undefined)),
  );
  const address = server.address();
  assert.ok(address !== null && typeof address === 'object');
  const url = `http://127.0.0.1:${String(address.port)}`;

  // Spawned without blocking this process: it serves the stand-in page.
  /**
   * @param {string[]} args
   * @returns {Promise<{ status: number | null, stdout: string }>}
   */
  const run = (...args) =>
    new Promise((done) => {
      const child = spawn(process.execPath, args, {
        cwd: checkout,
        windowsHide: true,
      });
      let stdout = '';
      child.stdout.on('data', (chunk) => {
        stdout += String(chunk);
      });
      child.on('close', (status) => done({ status, stdout }));
    });
  const doctor = async () => {
    const asJson = await run(
      join(skill, 'scripts', 'control.mjs'),
      'doctor',
      `--url=${url}`,
      '--json',
    );
    /** @type {ControlResult} */
    const result = JSON.parse(asJson.stdout);
    const asText = await run(
      join(skill, 'scripts', 'control.mjs'),
      'doctor',
      `--url=${url}`,
    );

    return {
      code: asJson.status,
      textCode: asText.status,
      line: result.checks?.find(({ name }) => name === 'map-fresh'),
      failing: (result.checks ?? [])
        .filter(({ status }) => status === 'fail')
        .map(({ name }) => name),
      text: asText.stdout,
    };
  };

  const unproven = await doctor();
  assert.deepEqual(unproven.line, {
    name: 'map-fresh',
    status: 'warn',
    detail: 'unproven: page',
  });
  assert.match(unproven.text, /^ {2}\[WARN\] map-fresh: unproven: page$/m);
  assert.deepEqual(
    [unproven.code, unproven.textCode, unproven.failing],
    [0, 0, []],
  );

  const recorded = await run(
    join(skill, 'scripts', 'fingerprint.mjs'),
    'record',
    '--feature',
    'page',
    '--entries',
    'entry.txt',
  );
  assert.equal(recorded.status, 0, recorded.stdout);
  const fresh = await doctor();
  assert.deepEqual(fresh.line, {
    name: 'map-fresh',
    status: 'pass',
    detail: '1 features fresh',
  });
  assert.match(fresh.text, /^ {2}\[OK\] map-fresh: 1 features fresh$/m);
  assert.deepEqual([fresh.code, fresh.textCode, fresh.failing], [0, 0, []]);

  writeFileSync(join(checkout, 'entry.txt'), 'changed\n');
  const stale = await doctor();
  assert.equal(stale.line?.status, 'warn', JSON.stringify(stale.line));
  assert.match(
    stale.line?.detail ?? '',
    /^stale: page \(since .+, 1 files changed\)$/,
  );
  assert.match(stale.text, /^ {2}\[WARN\] map-fresh: stale: page /m);
  assert.deepEqual([stale.code, stale.textCode, stale.failing], [0, 0, []]);
});

test('refuses unknown flags and values after a space', () => {
  for (const args of [
    ['up', '--devv'],
    ['doctor', '--url', 'http://localhost:4401'],
    ['up', '--port=4401'],
    ['info', '--url=http://localhost:4401'],
    ['down', '--url=http://localhost:4401'],
    ['up', '--url=http://localhost:4401'],
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

test('every command refuses a state file that is not JSON', (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  mkdirSync(scratch, { recursive: true });
  writeFileSync(stateFile, '{"pid":');
  t.after(() => rmSync(stateFile, { force: true }));

  for (const command of ['up', 'doctor', 'info', 'down']) {
    const { code, result } = control(command);
    assert.equal(code, 2, `${command}: ${JSON.stringify(result)}`);
    assert.match(result.message ?? '', /could not be read as JSON/, command);
  }
});

test('down counts a session entry without a socketPath, or a registry it cannot list, as left open', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const session = 'control-ngx-yeti-storybook-test-shape';
  const gone = spawnSync(process.execPath, ['-e', '']).pid;
  const port = await freePort();
  const registry = mkdtempSync(join(tmpdir(), 'control-storybook-registry-'));
  mkdirSync(join(registry, 'daemon-a'));
  const entry = join(registry, 'daemon-a', `${session}.session`);
  writeFileSync(entry, '{"version":2}');
  const notFolder = join(registry, 'not-a-folder');
  writeFileSync(notFolder, '');
  mkdirSync(scratch, { recursive: true });
  t.after(() => {
    rmSync(stateFile, { force: true });
    rmSync(registry, { recursive: true, force: true });
  });

  for (const { base, named } of [
    { base: registry, named: entry },
    { base: notFolder, named: notFolder },
  ]) {
    writeState({
      session,
      pid: gone,
      port,
      url: `http://localhost:${String(port)}`,
      target: 'ngx-yeti:static-storybook',
      log: join(scratch, 'test-shape.log'),
    });
    const { code, result } = controlWith(
      { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: base },
      'down',
    );
    assert.equal(code, 1, JSON.stringify(result));
    assert.equal(result.sessionClose?.outcome, 'left-open', base);
    assert.ok(
      result.sessionClose?.detail.includes(named),
      result.sessionClose?.detail,
    );
  }
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

test('down on a dead recorded pid leaves out a process that started before the recorded root', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const session = 'control-ngx-yeti-storybook-test-stale';
  const port = await freePort();
  mkdirSync(scratch, { recursive: true });
  const childFile = join(scratch, 'test-stale-child.txt');
  rmSync(childFile, { force: true });
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
  const registry = mkdtempSync(join(tmpdir(), 'control-storybook-registry-'));
  /** @type {number[]} */
  const toKill = [];
  t.after(() => {
    killAll(toKill);
    rmSync(stateFile, { force: true });
    rmSync(childFile, { force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  await waitGone(pid);
  const child = Number(readFileSync(childFile, 'utf8'));
  toKill.push(child);
  assert.ok(alive(child), 'the child did not outlive its parent');
  // The recorded root started after the child, as a later holder of the
  // dead root's PID would have.
  writeState({
    session,
    pid,
    port,
    url: `http://localhost:${String(port)}`,
    target: 'ngx-yeti:static-storybook',
    log: join(scratch, 'test-stale.log'),
    startTime: new Date(Date.parse(startOf(child)) + 1).toISOString(),
  });

  const { code, result } = controlWith(
    { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry },
    'down',
  );
  assert.equal(code, 0, JSON.stringify(result));
  assert.deepEqual(result.survivors, []);
  assert.doesNotMatch(
    result.message ?? '',
    new RegExp(`\\b${String(child)}\\b`),
  );
  assert.ok(alive(child), 'down stopped a process outside the run');
});

test('down names the listener to stop once the root is gone, and then shows a failed listener query', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const session = 'control-ngx-yeti-storybook-test-held';
  const server = createServer();
  await new Promise((done) => server.listen(0, () => done(undefined)));
  const address = server.address();
  assert.ok(address !== null && typeof address === 'object');
  const { port } = address;
  const target = 'ngx-yeti:static-storybook';
  const root = spawn(
    process.execPath,
    ['-e', 'setInterval(() => {}, 1 << 30)', target, `--port=${String(port)}`],
    { detached: true, stdio: 'ignore', windowsHide: true },
  );
  root.unref();
  const { pid } = root;
  assert.ok(pid !== undefined);
  const registry = mkdtempSync(join(tmpdir(), 'control-storybook-registry-'));
  t.after(async () => {
    killAll([pid]);
    await new Promise((done) => server.close(done));
    rmSync(stateFile, { force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  mkdirSync(scratch, { recursive: true });
  writeState({
    session,
    pid,
    port,
    url: `http://localhost:${String(port)}`,
    target,
    log: join(scratch, 'test-held.log'),
    startTime: startOf(pid),
  });
  const env = { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry };

  const first = controlWith(env, 'down');
  assert.equal(first.code, 1, JSON.stringify(first.result));
  assert.match(
    first.result.message ?? '',
    new RegExp(
      `pid ${String(pid)} is gone, so another down stops nothing; stop pid ${String(process.pid)} yourself$`,
    ),
  );
  assert.equal(existsSync(stateFile), true, 'the state file was removed');
  assert.equal(
    first.result.daemon?.stopped,
    true,
    JSON.stringify(first.result.daemon),
  );

  const second = controlWith(
    { ...env, CONTROL_LISTENER_TIMEOUT_MS: '1' },
    'down',
  );
  assert.equal(second.code, 1, JSON.stringify(second.result));
  assert.match(
    second.result.message ?? '',
    new RegExp(
      `port ${String(port)} still answers \\(listener query on ${String(port)} gave no answer in 1 ms\\)`,
    ),
  );
  assert.equal(existsSync(stateFile), false, 'the state file was kept');
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
      assert.match(
        fresh?.detail ?? '',
        /^packages\/ngx-yeti-testing\/src\/index\.ts changed at /,
      );
    } finally {
      utimesSync(testingSource, atime, mtime);
    }
  });

  await t.test('doctor passes after test output Git ignores is written', () => {
    const made = !existsSync(attachments);
    mkdirSync(attachments, { recursive: true });
    const file = join(attachments, 'control-storybook-test.txt');
    writeFileSync(file, 'newer than the launch\n');

    try {
      const { code, result } = control('doctor');
      assert.equal(code, 0, JSON.stringify(result.checks));
    } finally {
      rmSync(made ? attachments : file, { recursive: true, force: true });
    }
  });

  await t.test(
    'doctor takes the launch time from startedAt and names a missing one',
    () => {
      const state = readState();
      /** @param {Record<string, unknown>} planted */
      const freshness = (planted) => {
        writeState(planted);
        const { result } = control('doctor');

        return result.checks?.find(
          ({ name }) => name === 'build matches checkout',
        );
      };

      try {
        const lookupMissed = freshness({ ...state, startTime: null });
        assert.equal(lookupMissed?.status, 'pass', lookupMissed?.detail);
        const noLaunch = freshness({ ...state, startedAt: 'not a time' });
        assert.equal(noLaunch?.status, 'fail', noLaunch?.detail);
        assert.match(noLaunch?.detail ?? '', /records no usable launch time/);
      } finally {
        writeState(state);
      }
    },
  );

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

test('an exception inside up or doctor exits 2 with one JSON object', (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  // An empty browsers folder, so the render check cannot launch Chromium.
  const browsers = mkdtempSync(join(tmpdir(), 'control-storybook-browsers-'));
  const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browsers };
  t.after(() => {
    if (existsSync(stateFile)) {
      control('down');
    }

    rmSync(browsers, { recursive: true, force: true });
  });

  const up = controlWith(env, 'up');
  assert.equal(up.code, 2, JSON.stringify(up.result));
  assert.match(
    up.result.message ?? '',
    /^could not run: .*; the server \(pid \d+\) may still run: run down$/s,
  );

  const doctor = controlWith(env, 'doctor');
  assert.equal(doctor.code, 2, JSON.stringify(doctor.result));
  assert.match(doctor.result.message ?? '', /^could not run: /);

  const down = control('down');
  assert.equal(down.code, 0, JSON.stringify(down.result));
});
