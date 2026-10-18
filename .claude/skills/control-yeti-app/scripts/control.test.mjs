// @ts-check
// Drives control.mjs through stand-in states and processes, short serve
// launches that up gives up on, and ssr launches: the refused flags and
// planted state, the slot and port rules, the recorded process tree and its
// orphaned grandchild, doctor's build probe, ports, build-fresh scan and
// map-fresh line, and down. Windows only, like control.mjs. Builds the Fixture
// app, so no other build may run in this checkout while it runs.
// Run: node --test .claude/skills/control-yeti-app/scripts/control.test.mjs
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
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
import { connect, createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { unrecorded } from './control.mjs';
import { merge, processTable, snapshot, stop } from './proctree.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../..');
const script = join(here, 'control.mjs');
const stateFile = join(root, 'tmp', 'control-yeti-app', 'state.json');
const entrySource = join(root, 'packages/ngx-yeti/box/src/index.ts');
const yetiSource = join(root, 'vendor/yeti/package.json');
const plantedFile = join(root, 'tmp', 'control-yeti-app', 'planted.txt');
// The slots up tries in the checkout this suite runs in, by the rule of
// SKILL.md "Pick a flow": slot 0 in the main checkout, else 1 to 99 from a
// hash of the checkout path, then the next ones. The ten-busy-slots test
// compares this order with the one up prints, so the two cannot drift apart
// unseen.
const inWorktree = statSync(join(root, '.git')).isFile();
const firstSlot = inWorktree
  ? 1 +
    (createHash('sha1').update(root.toLowerCase()).digest().readUInt32BE(0) %
      99)
  : 0;
const slotOrder = Array.from({ length: 10 }, (_, index) =>
  firstSlot === 0 ? index : 1 + ((firstSlot - 1 + index) % 99),
);
// The serve row of the ports table: 4200 in slot 0, else 4620 + slot - 1.
const servePorts = slotOrder.map((slot) =>
  slot === 0 ? 4200 : 4620 + slot - 1,
);
const [ownPort = 0] = servePorts;

/** @typedef {import('./proctree.mjs').ProcRecord} ProcRecord */

/**
 * The fields of control.mjs's JSON output these tests read.
 *
 * @typedef {object} ControlResult
 * @property {string} [error]
 * @property {{ name: string, status: string, detail: string }[]} [checks]
 * @property {unknown} [build]
 * @property {string[]} [failed]
 * @property {unknown} [port]
 * @property {unknown} [slot]
 * @property {{ name: string, port: number, kind: string, reason?: string }[]} [ports]
 * @property {ProcRecord[]} [tree]
 * @property {unknown} [portFree]
 * @property {unknown} [listenerError]
 * @property {unknown} [stateFile]
 * @property {{ session: string, outcome: string, detail: string }[]} [sessions]
 * @property {unknown} [stopped]
 * @property {{ pid: number, reason: string }[]} [refused]
 * @property {unknown} [pid]
 * @property {unknown} [recordedPidRunning]
 * @property {unknown} [launchStopped]
 * @property {number[]} [survivors]
 * @property {number[]} [unrecorded]
 * @property {string[]} [notes]
 * @property {string[]} [warnings]
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
 * @property {ProcRecord[]} tree
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
  typeof result.evidenceDir === 'string' &&
  'tree' in result &&
  Array.isArray(result.tree);

function started() {
  assert.ok(launch, 'up did not run');

  return launch;
}

/** @param {string[]} args */
const control = (...args) => controlWith(process.env, ...args);

/**
 * control.mjs without blocking this process, so a test can act while `up`
 * waits.
 *
 * @param {NodeJS.ProcessEnv} env
 * @param {string[]} args
 * @returns {Promise<{ code: number | null, result: ControlResult }>}
 */
function controlAsync(env, ...args) {
  const child = spawn(process.execPath, [script, ...args, '--json'], {
    cwd: root,
    env,
    windowsHide: true,
  });
  let stdout = '';
  child.stdout.on('data', (chunk) => {
    stdout += String(chunk);
  });

  return new Promise((done) => {
    child.on('close', (code) => {
      assert.ok(stdout, `control.mjs ${args.join(' ')} wrote nothing`);
      /** @type {ControlResult} */
      const result = JSON.parse(stdout);
      done({ code, result });
    });
  });
}

/** @param {unknown} value */
const isRecord = (value) =>
  typeof value === 'object' &&
  value !== null &&
  'pid' in value &&
  typeof value.pid === 'number' &&
  'ppid' in value &&
  typeof value.ppid === 'number' &&
  'start' in value &&
  typeof value.start === 'number' &&
  'commandLine' in value &&
  (value.commandLine === null || typeof value.commandLine === 'string');

/**
 * @param {unknown} value
 * @returns {ProcRecord[]}
 */
function recordsIn(value) {
  /** @type {ProcRecord[]} */
  const records = [];

  if (Array.isArray(value)) {
    for (const item of value) {
      if (isRecord(item)) {
        records.push(item);
      }
    }
  }

  return records;
}

// Stops whatever an `up` under test left recorded, through the same
// proctree.mjs, so a run against a script that leaves its launch behind
// cleans up too.
function forceDown() {
  if (existsSync(stateFile)) {
    /** @type {unknown} */
    let recorded = [];

    try {
      recorded = readState()['tree'];
    } catch {
      // A planted state file that is not JSON records nothing to stop.
    }

    const tree = recordsIn(recorded);
    const [first] = tree;
    stop(first === undefined ? tree : merge(tree, snapshot(first)));
    rmSync(stateFile, { force: true });
  }
}

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

/**
 * Whether something accepts a TCP connection on one address and port.
 *
 * @param {string} host
 * @param {number} port
 * @returns {Promise<boolean>}
 */
function answersOn(host, port) {
  return new Promise((done) => {
    const socket = connect({ host, port });
    socket.once('connect', () => {
      socket.destroy();
      done(true);
    });
    socket.once('error', () => done(false));
  });
}

async function freePort() {
  const server = createServer();
  await new Promise((done) => server.listen(0, () => done(undefined)));
  const address = server.address();
  assert.ok(address !== null && typeof address === 'object');
  await new Promise((done) => server.close(done));

  return address.port;
}

/**
 * Listens on `port` from this process, or returns null when something else
 * already does.
 *
 * @param {number} port
 * @returns {Promise<import('node:net').Server | null>}
 */
async function occupy(port) {
  if (listening(port)) {
    return null;
  }

  const server = createServer();
  await new Promise((done) => server.listen(port, () => done(undefined)));

  return server;
}

/** @param {(import('node:net').Server | null)[]} servers */
async function release(servers) {
  for (const server of servers) {
    if (server !== null) {
      await new Promise((done) => server.close(done));
    }
  }
}

// The live record of a process, as proctree.mjs reads it.
/** @param {number} pid */
function recordOf(pid) {
  const record = processTable().find((row) => row.pid === pid);
  assert.ok(record, `pid ${pid} is not in the process table`);

  return record;
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

// Puts the launch's own pid, tree and port back and stops it, whatever an
// earlier step left behind.
async function ensureDown() {
  await closeListener();

  if (launch && existsSync(stateFile)) {
    writeState({
      ...readState(),
      pid: launch.pid,
      start: launch.start,
      commandLine: launch.commandLine,
      tree: launch.tree,
      port: launch.port,
      session: launch.session,
    });
    control('down');
  }

  forceDown();
}

/**
 * A state file for a stand-in run whose root record is `tree[0]`.
 *
 * @param {string} name
 * @param {ProcRecord[]} tree
 * @param {number} port
 */
function standInState(name, tree, port) {
  const evidenceDir = join(root, 'tmp', 'control-yeti-app', name);
  mkdirSync(evidenceDir, { recursive: true });
  const [first] = tree;
  assert.ok(first);

  return {
    session: `control-yeti-app-${name}`,
    pid: first.pid,
    start: new Date(first.start).toISOString(),
    commandLine: first.commandLine,
    port,
    ports: [{ name: 'serve', port, kind: 'derived' }],
    url: `http://localhost:${String(port)}/sub/`,
    logFile: join(evidenceDir, 'server.log'),
    evidenceDir,
    tree,
  };
}

/** @param {string} name */
async function deadRun(name) {
  const gone = spawnSync(process.execPath, ['-e', '']).pid;

  return standInState(
    name,
    [{ pid: gone, ppid: 0, start: 1, commandLine: 'gone' }],
    await freePort(),
  );
}

/**
 * @param {number} pid
 * @param {number} ppid
 * @param {number} start
 * @param {string} [commandLine]
 * @returns {ProcRecord}
 */
const row = (pid, ppid, start, commandLine = `node ${String(pid)}.js`) => ({
  pid,
  ppid,
  start,
  commandLine,
});

// A recorded parent (PID 10, started at 1000) that was first seen gone at
// 5000, and nothing else alive.
const goneParent = row(10, 1, 1000);
/** @param {ProcRecord[]} rows */
const foundBelowGone = (rows) =>
  unrecorded([goneParent], rows, new Map([['10@1000', 5000]])).map(
    ({ pid }) => pid,
  );

test('unrecorded names a child of a gone recorded process that started while the parent ran', () => {
  assert.deepEqual(
    foundBelowGone([row(20, 10, 3000), row(21, 20, 3100)]),
    [20, 21],
  );
});

test('unrecorded leaves out a process that started before the gone parent', () => {
  assert.deepEqual(foundBelowGone([row(20, 10, 500)]), []);
});

test('unrecorded leaves out a process that started after the parent was first seen gone', () => {
  assert.deepEqual(foundBelowGone([row(20, 10, 6000)]), []);
});

test('unrecorded never follows a recorded PID that a live process holds again', () => {
  assert.deepEqual(foundBelowGone([row(10, 1, 4000), row(20, 10, 4500)]), []);
});

test('unrecorded never follows a gone record without the time it was first seen gone', () => {
  assert.deepEqual(
    unrecorded([goneParent], [row(20, 10, 3000)], new Map()),
    [],
  );
});

test('unrecorded leaves out the Nx daemon and everything below it', () => {
  assert.deepEqual(
    foundBelowGone([
      row(
        20,
        10,
        3000,
        'node D:\\repo\\node_modules\\nx\\src\\daemon\\server\\start.js',
      ),
      row(21, 20, 3100),
    ]),
    [],
  );
});

test('unrecorded keys a record by PID and start, so a new process on a gone record PID still counts', () => {
  const gone = row(30, 10, 1200);
  assert.deepEqual(
    unrecorded(
      [goneParent, gone],
      [row(30, 10, 3000)],
      new Map([
        ['10@1000', 5000],
        ['30@1200', 2000],
      ]),
    ).map(({ pid, start }) => `${String(pid)}@${String(start)}`),
    ['30@3000'],
  );
});

test('refuses unknown flags and values after a space', (t) => {
  t.after(forceDown);

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
  t.after(forceDown);

  for (const command of ['up', 'doctor', 'info', 'down']) {
    const { code, result } = control(command);
    assert.equal(code, 2, `${command}: ${JSON.stringify(result)}`);
    assert.match(result.error ?? '', /could not be read as JSON/, command);
  }
});

test('every command refuses a state file without a process tree rooted at its pid', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const state = await deadRun('test-no-tree');
  t.after(() => {
    forceDown();
    rmSync(state.evidenceDir, { recursive: true, force: true });
  });

  for (const planted of [
    { ...state, tree: [] },
    { ...state, tree: 'none' },
    { ...state, pid: state.pid + 1 },
  ]) {
    writeState(planted);

    for (const command of ['up', 'doctor', 'info', 'down']) {
      const { code, result } = control(command);
      assert.equal(code, 2, `${command}: ${JSON.stringify(result)}`);
      assert.match(result.error ?? '', /a tree that is not a list/, command);
    }
  }
});

test('every command refuses a state file from a control.mjs without process trees, naming its pid and the way out', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const state = await deadRun('test-old-state');
  t.after(() => {
    forceDown();
    rmSync(state.evidenceDir, { recursive: true, force: true });
  });
  const { tree: _tree, ports: _ports, ...old } = state;
  writeState(old);

  for (const command of ['up', 'doctor', 'info', 'down']) {
    const { code, result } = control(command);
    assert.equal(code, 2, `${command}: ${JSON.stringify(result)}`);
    assert.equal(
      result.error,
      `refused: ${stateFile} was written by a control.mjs without a process tree (pid ${String(state.pid)}, port ${String(state.port)}); check that pid ${String(state.pid)} is this checkout's server, stop it by hand, then delete ${stateFile}; nothing was run`,
      command,
    );
  }
});

test('the human output escapes control and bidi characters of a recorded command line', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const state = await deadRun('test-printable');
  t.after(() => {
    rmSync(stateFile, { force: true });
    rmSync(state.evidenceDir, { recursive: true, force: true });
  });
  const [first] = state.tree;
  assert.ok(first);
  const commandLine = 'node ‮evil\u009B';
  writeState({ ...state, commandLine, tree: [{ ...first, commandLine }] });

  const run = spawnSync(process.execPath, [script, 'info'], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });
  assert.equal(run.status, 0, run.stdout);
  assert.equal(/[‮\u009B]/.test(run.stdout), false, run.stdout);
  assert.match(run.stdout, /node \\u202eevil\\u009b/);
});

test('a flag that does not apply to the command exits 2 before anything runs', (t) => {
  t.after(forceDown);

  for (const [command, flag] of [
    ['info', '--port=4000'],
    ['doctor', '--mode=ssr'],
    ['down', '--url=http://localhost:4310/sub/'],
    ['up', '--url=http://localhost:4310/sub/'],
  ]) {
    assert.ok(command !== undefined && flag !== undefined);
    const { code, result } = control(command, flag);
    assert.equal(code, 2, `${command} ${flag}: ${JSON.stringify(result)}`);
    assert.equal(
      result.error,
      `flag ${flag.replace(/=.*$/, '')} does not apply to ${command}`,
    );
  }

  assert.equal(existsSync(stateFile), false, 'a refused up wrote state');
});

test('an error the script does not handle exits 2 with one JSON object', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const state = await deadRun('test-uncaught');
  t.after(() => {
    rmSync(stateFile, { force: true });
    rmSync(state.evidenceDir, { recursive: true, force: true });
  });
  // doctor reads the serve log, which this state names but nobody wrote.
  writeState({ ...state, mode: 'serve' });

  const { code, result } = control('doctor');
  assert.equal(code, 2, JSON.stringify(result));
  assert.match(result.error ?? '', /^could not run: Error: ENOENT/);
});

test('info names both sessions, the state file, the ports and the tree', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const state = await deadRun('test-info');
  t.after(() => {
    rmSync(stateFile, { force: true });
    rmSync(state.evidenceDir, { recursive: true, force: true });
  });
  writeState(state);

  const { code, result } = control('info');
  assert.equal(code, 0, JSON.stringify(result));
  assert.deepEqual(result.sessions, [state.session, `${state.session}-jsoff`]);
  assert.equal(result.stateFile, stateFile);
  assert.deepEqual(result.ports, state.ports);
  assert.deepEqual(result.tree, state.tree);
});

/**
 * A copy of the skill in a checkout of its own below the repository, so it
 * still resolves playwright and nx from it.
 *
 * @param {string} prefix
 * @param {boolean} worktree  `.git` is a file, as in a linked worktree
 */
function skillCopy(prefix, worktree) {
  mkdirSync(join(root, 'tmp', 'control-yeti-app'), { recursive: true });
  const checkout = mkdtempSync(join(root, 'tmp', 'control-yeti-app', prefix));
  const skill = join(checkout, '.claude', 'skills', 'control-yeti-app');

  if (worktree) {
    writeFileSync(join(checkout, '.git'), 'gitdir: elsewhere\n');
  } else {
    mkdirSync(join(checkout, '.git'));
  }

  mkdirSync(join(skill, 'scripts'), { recursive: true });
  mkdirSync(join(skill, 'features'));

  for (const name of ['control.mjs', 'fingerprint.mjs', 'proctree.mjs']) {
    copyFileSync(join(here, name), join(skill, 'scripts', name));
  }

  return { checkout, skill };
}

test('doctor reports map-fresh as a warning or a pass that never changes its exit code, and skips ports with --url', async (t) => {
  const { checkout, skill } = skillCopy('map-fresh-', false);
  const server = createHttpServer((_, response) => {
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end(
      '<!doctype html><title>stand-in</title><app-root><h1>Welcome yeti-app</h1></app-root>',
    );
  });
  t.after(async () => {
    await new Promise((done) => server.close(done));
    rmSync(checkout, { recursive: true, force: true });
  });
  writeFileSync(join(skill, 'features', 'page.md'), '# Page\n');
  writeFileSync(join(checkout, 'entry.txt'), 'proven\n');
  await new Promise((done) =>
    server.listen(0, '127.0.0.1', () => done(undefined)),
  );
  const address = server.address();
  assert.ok(address !== null && typeof address === 'object');
  const url = `http://127.0.0.1:${String(address.port)}/sub/`;

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
      ports: result.checks?.find(({ name }) => name === 'ports'),
      failed: result.failed ?? [],
      text: asText.stdout,
    };
  };

  const unproven = await doctor();
  assert.deepEqual(unproven.line, {
    name: 'map-fresh',
    status: 'warn',
    detail: 'unproven: page',
  });
  assert.match(unproven.text, /^\[WARN\] map-fresh: unproven: page$/m);
  assert.deepEqual(
    [unproven.code, unproven.textCode, unproven.failed],
    [0, 0, []],
  );
  assert.deepEqual(unproven.ports, {
    name: 'ports',
    status: 'skip',
    detail: '--url given; ownership not checked',
  });
  assert.match(
    unproven.text,
    /^\[SKIP\] ports: --url given; ownership not checked$/m,
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
  assert.match(fresh.text, /^\[OK\] map-fresh: 1 features fresh$/m);
  assert.deepEqual([fresh.code, fresh.textCode, fresh.failed], [0, 0, []]);

  writeFileSync(join(checkout, 'entry.txt'), 'changed\n');
  const stale = await doctor();
  assert.equal(stale.line?.status, 'warn', JSON.stringify(stale.line));
  assert.match(
    stale.line?.detail ?? '',
    /^stale: page \(since .+, 1 files changed\)$/,
  );
  assert.match(stale.text, /^\[WARN\] map-fresh: stale: page /m);
  assert.deepEqual([stale.code, stale.textCode, stale.failed], [0, 0, []]);
});

test("a worktree refuses the main checkout's ports, even with --port", (t) => {
  const { checkout, skill } = skillCopy('worktree-', true);
  t.after(() => {
    // Stops a launch the copy started if a refusal regressed.
    if (existsSync(join(checkout, 'tmp', 'control-yeti-app', 'state.json'))) {
      spawnSync(
        process.execPath,
        [join(skill, 'scripts', 'control.mjs'), 'down', '--json'],
        { cwd: checkout, windowsHide: true },
      );
    }

    rmSync(checkout, { recursive: true, force: true });
  });

  for (const args of [
    ['--port=4200'],
    ['--mode=ssr', '--port=4000'],
    ['--mode=ssr', '--port=4200'],
  ]) {
    const run = spawnSync(
      process.execPath,
      [join(skill, 'scripts', 'control.mjs'), 'up', ...args, '--json'],
      { cwd: checkout, encoding: 'utf8', windowsHide: true },
    );
    assert.equal(run.status, 2, run.stdout);
    /** @type {ControlResult} */
    const result = JSON.parse(run.stdout);
    assert.match(
      result.error ?? '',
      /belongs to the main checkout; a worktree uses its derived port (\d+)/,
    );
    const derived = Number(
      /derived port (\d+)/.exec(result.error ?? '')?.[1] ?? 0,
    );
    assert.ok(
      args.includes('--mode=ssr')
        ? derived >= 4720 && derived <= 4818
        : derived >= 4620 && derived <= 4718,
      `derived port ${derived}`,
    );
  }
});

test('up exits 2 naming each port and holder when ten slots are busy', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  /** @type {(import('node:net').Server | null)[]} */
  const servers = [];
  t.after(async () => {
    forceDown();
    await release(servers);
  });

  for (const port of servePorts) {
    servers.push(await occupy(port));
  }

  const { code, result } = control('up');
  assert.equal(code, 2, JSON.stringify(result));
  assert.match(
    result.error ?? '',
    new RegExp(
      `^no free slot in 10 tries \\(slots ${slotOrder.join(', ')}\\): `,
    ),
  );

  for (const port of servePorts) {
    assert.match(
      result.error ?? '',
      new RegExp(`serve ${String(port)} held by PID \\d+`),
    );
  }

  assert.equal(existsSync(stateFile), false, 'a refused up wrote state');
});

test('up moves to the next slot when its own port is busy, and records why', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const busy = await occupy(ownPort);
  t.after(async () => {
    forceDown();
    await release([busy]);
  });

  if (busy === null) {
    t.skip(`something else listens on ${String(ownPort)}`);

    return;
  }

  const next = servePorts.slice(1).find((port) => !listening(port));
  assert.ok(next !== undefined);
  const { code, result } = control('up', '--timeout=1');
  assert.equal(code, 1, JSON.stringify(result));
  assert.match(result.error ?? '', /^not ready after 1s; stopped the launch/);
  assert.equal(result.port, next);
  assert.equal(result.slot, slotOrder[servePorts.indexOf(next)]);
  assert.deepEqual(result.ports, [
    {
      name: 'serve',
      port: next,
      kind: 'derived',
      reason: `fell back from ${String(ownPort)}: held by PID ${String(process.pid)}`,
    },
  ]);
  assert.equal(existsSync(stateFile), false, 'up kept the state file');
});

test('up moves to the next slot when another process takes its port after the check', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const other = createHttpServer((_request, response) => {
    response.end('<app-root><h1>Welcome yeti-app</h1></app-root>');
  });
  t.after(async () => {
    forceDown();

    if (other.listening) {
      await new Promise((done) => other.close(done));
    }
  });

  if (listening(ownPort)) {
    t.skip(`something else listens on ${String(ownPort)}`);

    return;
  }

  const pending = controlAsync(process.env, 'up', '--timeout=4');

  for (
    let waited = 0;
    !existsSync(stateFile) && waited < 30000;
    waited += 100
  ) {
    await new Promise((done) => setTimeout(done, 100));
  }

  assert.ok(existsSync(stateFile), 'up wrote no state file');
  await new Promise((done) => other.listen(ownPort, () => done(undefined)));

  const { code, result } = await pending;
  assert.equal(code, 1, JSON.stringify(result));
  assert.match(result.error ?? '', /^not ready after 4s; stopped the launch/);
  assert.notEqual(result.port, ownPort);
  assert.equal(
    result.ports?.[0]?.reason,
    `fell back from ${String(ownPort)}: held by PID ${String(process.pid)}`,
  );
  assert.equal(existsSync(stateFile), false, 'up kept the state file');
  await new Promise((done) => other.close(done));
  // Nothing of the launch up gave up on is left holding the port.
  assert.equal(
    listening(ownPort),
    false,
    `a process still listens on ${String(ownPort)}`,
  );
});

test('up --port fails when another process listens beside the launch on its port', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const port = await freePort();
  // The dev server listens on ::1; this one takes 127.0.0.1 on the same port
  // once the dev server listens, and answers the page marker too, so whichever
  // address fetch reaches, up's ready check meets both listeners.
  const other = createHttpServer((_request, response) => {
    response.end('<app-root><h1>Welcome yeti-app</h1></app-root>');
  });
  t.after(async () => {
    forceDown();

    if (other.listening) {
      await new Promise((done) => other.close(done));
    }
  });

  const pending = controlAsync(
    process.env,
    'up',
    `--port=${String(port)}`,
    '--timeout=120',
  );

  for (
    let waited = 0;
    !existsSync(stateFile) && waited < 30000;
    waited += 100
  ) {
    await new Promise((done) => setTimeout(done, 100));
  }

  assert.ok(existsSync(stateFile), 'up wrote no state file');

  for (
    let waited = 0;
    !(await answersOn('::1', port)) && waited < 120000;
    waited += 25
  ) {
    await new Promise((done) => setTimeout(done, 25));
  }

  await new Promise((done) =>
    other.listen(port, '127.0.0.1', () => done(undefined)),
  );

  const { code, result } = await pending;
  assert.equal(code, 1, JSON.stringify(result));
  assert.match(
    result.error ?? '',
    new RegExp(
      `^port ${String(port)} answers but pid ${String(process.pid)} is not in the started tree; stopped the launch`,
    ),
  );
  assert.equal(existsSync(stateFile), false, 'up kept the state file');
});

test('up names the launched server and down when a listener query fails after the launch', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const port = await freePort();
  t.after(() => {
    if (existsSync(stateFile)) {
      control('down');
    }

    forceDown();
  });

  const { code, result } = controlWith(
    {
      ...process.env,
      CONTROL_LISTENER_TIMEOUT_MS: '1',
      CONTROL_LISTENER_QUERIES_OK: '1',
    },
    'up',
    `--port=${String(port)}`,
  );
  assert.equal(code, 2, JSON.stringify(result));
  assert.match(
    result.error ?? '',
    new RegExp(
      `^listener query on ${String(port)} gave no answer in 1 ms; the launched server \\(pid \\d+\\) may still run: state kept at .*; run down$`,
    ),
  );
  assert.ok(existsSync(stateFile), 'up removed the state file');
  const down = control('down');
  assert.equal(down.code, 0, JSON.stringify(down.result));
  assert.equal(listening(port), false, `something listens on ${port}`);
});

test('up does not record a root found outside the spawn window, and stops it', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const port = await freePort();
  t.after(forceDown);

  const { code, result } = controlWith(
    { ...process.env, CONTROL_SPAWN_WINDOW_SHIFT_MS: '60000' },
    'up',
    `--port=${String(port)}`,
    '--timeout=60',
  );
  assert.equal(code, 1, JSON.stringify(result));
  assert.match(result.error ?? '', /did not appear in the process table/);
  assert.equal(result.launchStopped, true);
  assert.equal(existsSync(stateFile), false, 'up kept a state file');
  assert.equal(listening(port), false, `something listens on ${port}`);
});

test('up keeps the state file and says run down when a launch it stops outlasts the last round', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const port = await freePort();
  t.after(() => {
    if (existsSync(stateFile)) {
      control('down');
    }

    forceDown();
  });

  const { code, result } = controlWith(
    { ...process.env, CONTROL_STOP_ROUNDS: '0' },
    'up',
    `--port=${String(port)}`,
    '--timeout=1',
  );
  assert.equal(code, 1, JSON.stringify(result));
  assert.match(
    result.error ?? '',
    /^not ready after 1s; stopped the launch .*; .* still runs after the last round; state kept at .*; run down$/,
  );
  assert.equal(result.launchStopped, false);
  assert.ok(existsSync(stateFile), 'up removed the state file');
  const down = control('down');
  assert.equal(down.code, 0, JSON.stringify(down.result));
});

test('up --port exits 2 naming the holder of a busy port, with no fallback', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const port = await freePort();
  const busy = await occupy(port);
  t.after(async () => {
    forceDown();
    await release([busy]);
  });

  const { code, result } = control('up', `--port=${String(port)}`);
  assert.equal(code, 2, JSON.stringify(result));
  assert.equal(
    result.error,
    `port ${String(port)} (--port) held by PID ${String(process.pid)}; --port has no fallback`,
  );
  assert.equal(existsSync(stateFile), false, 'a refused up wrote state');
});

test('down reports a dead recorded pid with a free port as not running', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const state = await deadRun('test-dead-free');
  const registry = mkdtempSync(join(tmpdir(), 'control-yeti-app-registry-'));
  t.after(() => {
    rmSync(stateFile, { force: true });
    rmSync(state.evidenceDir, { recursive: true, force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  const env = { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry };
  writeState(state);

  const { code, result } = controlWith(env, 'down');
  assert.equal(code, 0, JSON.stringify(result));
  assert.equal(result.recordedPidRunning, false);
  assert.deepEqual(result.warnings, [
    `pid ${String(state.pid)} was not running`,
  ]);

  writeState(state);
  const text = spawnSync(process.execPath, [script, 'down'], {
    cwd: root,
    env,
    encoding: 'utf8',
    windowsHide: true,
  });
  assert.equal(text.status, 0, text.stdout);
  assert.match(
    text.stdout,
    new RegExp(`^\\[WARN\\] pid ${String(state.pid)} was not running$`, 'm'),
  );
});

test('up records no start time or command line it could not read: it stops the launch and exits 1', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const port = await freePort();
  t.after(forceDown);

  const { code, result } = controlWith(
    { ...process.env, CONTROL_PID_LOOKUP_MISSES: '1000' },
    'up',
    `--port=${String(port)}`,
    '--timeout=5',
  );
  assert.equal(code, 1, JSON.stringify(result));
  assert.match(result.error ?? '', /did not appear in the process table/);
  assert.equal(result.launchStopped, true);
  assert.equal(existsSync(stateFile), false, 'up kept a state file');
  assert.equal(listening(port), false, `something listens on ${port}`);
});

test('up stops the launch and removes the state file when it is not ready in time', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const port = await freePort();
  t.after(forceDown);

  const { code, result } = control(
    'up',
    `--port=${String(port)}`,
    '--timeout=1',
  );
  assert.equal(code, 1, JSON.stringify(result));
  assert.match(result.error ?? '', /^not ready after 1s; stopped the launch/);
  assert.equal(result.launchStopped, true);
  assert.equal(existsSync(stateFile), false, 'up kept the state file');
  assert.equal(typeof result.pid, 'number');
  await waitGone(Number(result.pid));
  assert.equal(listening(port), false, `something listens on ${port}`);
});

test('up stops the launch and removes the state file when another process answers its --port', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const port = await freePort();
  const other = createHttpServer((_request, response) => {
    response.end('<app-root><h1>Welcome yeti-app</h1></app-root>');
  });
  t.after(async () => {
    forceDown();
    await new Promise((done) => other.close(done));
  });

  const pending = controlAsync(process.env, 'up', `--port=${String(port)}`);

  // up checked the port and spawned its server once it wrote the state file.
  for (
    let waited = 0;
    !existsSync(stateFile) && waited < 30000;
    waited += 100
  ) {
    await new Promise((done) => setTimeout(done, 100));
  }

  assert.ok(existsSync(stateFile), 'up wrote no state file');
  await new Promise((done) => other.listen(port, () => done(undefined)));

  const { code, result } = await pending;
  assert.equal(code, 1, JSON.stringify(result));
  assert.match(
    result.error ?? '',
    new RegExp(
      `^port ${String(port)} answers but pid ${String(process.pid)} is not in the started tree; stopped the launch`,
    ),
  );
  assert.equal(result.launchStopped, true);
  assert.equal(existsSync(stateFile), false, 'up kept the state file');
  assert.equal(typeof result.pid, 'number');
  await waitGone(Number(result.pid));
});

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

test('down stops the child a wrapper left running from the recorded tree', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const port = await freePort();
  const wrapper = spawn(
    process.execPath,
    [
      '-e',
      `require('node:child_process').spawn(process.execPath, ['-e', ${JSON.stringify(`require('node:net').createServer().listen(${String(port)})`)}], { detached: true, stdio: 'ignore' }); setInterval(() => {}, 1 << 30);`,
    ],
    { detached: true, stdio: 'ignore', windowsHide: true },
  );
  wrapper.unref();
  const { pid } = wrapper;
  assert.ok(pid !== undefined);
  const registry = mkdtempSync(join(tmpdir(), 'control-yeti-app-registry-'));
  /** @type {number[]} */
  const toKill = [pid];
  const state = standInState('test-orphan', [recordOf(pid)], port);
  t.after(() => {
    killAll(toKill);
    rmSync(stateFile, { force: true });
    rmSync(state.evidenceDir, { recursive: true, force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  await waitListening(port);
  const [child] = owners(port);
  assert.ok(child !== undefined && child !== pid);
  toKill.push(child);
  // The tree as up records it while the wrapper still runs.
  const tree = snapshot(state.tree[0] ?? recordOf(pid));
  assert.deepEqual(
    tree.map((record) => record.pid),
    [pid, child],
  );
  writeState({ ...state, tree });
  process.kill(pid);
  await waitGone(pid);
  assert.ok(alive(child), 'the child did not outlive the wrapper');
  const env = { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry };

  const { code, result } = controlWith(env, 'down');
  assert.equal(code, 0, JSON.stringify(result));
  assert.equal(result.recordedPidRunning, false);
  assert.deepEqual(result.stopped, [child]);
  assert.equal(result.portFree, true);
  assert.equal(alive(child), false, 'down left the orphaned child running');
  assert.equal(listening(port), false, `something listens on ${port}`);
  assert.equal(existsSync(stateFile), false, 'down kept the state file');
});

test('down leaves alone a recorded child whose PID now belongs to another process', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const other = spawn(
    process.execPath,
    ['-e', 'setInterval(() => {}, 1 << 30)'],
    {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    },
  );
  other.unref();
  const { pid } = other;
  assert.ok(pid !== undefined);
  const live = recordOf(pid);
  const state = await deadRun('test-reused');
  const [deadRoot] = state.tree;
  assert.ok(deadRoot);
  const registry = mkdtempSync(join(tmpdir(), 'control-yeti-app-registry-'));
  t.after(() => {
    killAll([pid]);
    rmSync(stateFile, { force: true });
    rmSync(state.evidenceDir, { recursive: true, force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  // The record started earlier than the live holder of its PID.
  writeState({
    ...state,
    tree: [deadRoot, { ...live, ppid: deadRoot.pid, start: live.start - 1 }],
  });

  const { code, result } = controlWith(
    { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry },
    'down',
  );
  assert.equal(code, 0, JSON.stringify(result));
  assert.deepEqual(
    (result.refused ?? []).map(({ pid: refused, reason }) => [refused, reason]),
    [[pid, 'reused']],
  );
  assert.ok(alive(pid), 'down stopped a process outside the run');
});

/**
 * A stand-in launch: a wrapper that keeps running and a child of it that
 * listens on `port`, recorded the way up records a tree. With `t`, both are
 * stopped after the test, whatever it left.
 *
 * @param {number} port
 * @param {import('node:test').TestContext} [t]
 */
async function standInLaunch(port, t) {
  const began = Date.now() - 1000;
  const wrapper = spawn(
    process.execPath,
    [
      '-e',
      `require('node:child_process').spawn(process.execPath, ['-e', ${JSON.stringify(`require('node:net').createServer().listen(${String(port)})`)}], { detached: true, stdio: 'ignore' }); setInterval(() => {}, 1 << 30);`,
    ],
    { detached: true, stdio: 'ignore', windowsHide: true },
  );
  wrapper.unref();
  const { pid } = wrapper;
  t?.after(() => {
    wrapper.kill();
    killStarted(
      processTable().filter((row) => row.ppid === pid && row.start >= began),
    );
  });
  assert.ok(pid !== undefined);
  await waitListening(port);
  const [child] = owners(port);
  assert.ok(child !== undefined && child !== pid);
  const tree = snapshot(recordOf(pid));
  assert.deepEqual(
    tree.map((record) => record.pid),
    [pid, child],
  );

  return { pid, child, tree };
}

test('down refuses a root whose start time does not match, and still stops the recorded processes that match', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const port = await freePort();
  const registry = mkdtempSync(join(tmpdir(), 'control-yeti-app-registry-'));
  const launch = await standInLaunch(port);
  const state = standInState('test-mismatch', launch.tree, port);
  t.after(() => {
    killAll([launch.pid, launch.child]);
    rmSync(stateFile, { force: true });
    rmSync(state.evidenceDir, { recursive: true, force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  const [first, ...others] = launch.tree;
  assert.ok(first);
  writeState({ ...state, tree: [{ ...first, start: 1 }, ...others] });

  const { code, result } = controlWith(
    { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry },
    'down',
  );
  assert.equal(code, 2, JSON.stringify(result));
  assert.match(
    result.error ?? '',
    /^pid \d+ does not match the recorded start time or command line; refusing to stop it, and stopped the other recorded processes that still match; state kept at /,
  );
  assert.deepEqual(result.stopped, [launch.child]);
  assert.ok(existsSync(stateFile), 'down removed the state file');
  assert.ok(alive(launch.pid), 'down stopped the mismatched root');
  await waitGone(launch.child);
});

test('down names only the image name and start time of a foreign process that holds the recorded PID', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const secret = 'FAKE-SECRET-123';
  const registry = mkdtempSync(join(tmpdir(), 'control-yeti-app-registry-'));
  const evidenceDir = join(root, 'tmp', 'control-yeti-app', 'test-foreign');
  const foreign = spawn(
    process.execPath,
    ['-e', 'setInterval(() => {}, 1 << 30)', '--', `--token=${secret}`],
    { argv0: 'node', detached: true, stdio: 'ignore', windowsHide: true },
  );
  t.after(() => {
    foreign.kill();
    rmSync(stateFile, { force: true });
    rmSync(evidenceDir, { recursive: true, force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  foreign.unref();
  const { pid } = foreign;
  assert.ok(pid !== undefined);
  const live = recordOf(pid);
  assert.ok(
    live.commandLine?.includes(secret),
    'the secret is not on the command line',
  );
  // A failed up's unrecorded list names the same live process, so down names
  // it a second time, in its notes.
  writeState({
    ...standInState(
      'test-foreign',
      [
        {
          pid,
          ppid: 0,
          start: live.start - 60_000,
          commandLine: 'node recorded.js',
        },
      ],
      await freePort(),
    ),
    unrecorded: [live],
  });
  const env = { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry };
  const startedAt = new Date(live.start).toISOString();

  for (const args of [['down', '--json'], ['down']]) {
    const run = spawnSync(process.execPath, [script, ...args], {
      cwd: root,
      env,
      encoding: 'utf8',
      timeout: 60_000,
      windowsHide: true,
    });
    const output = `${run.stdout}${run.stderr}`;
    assert.equal(run.status, 2, output);
    assert.ok(
      existsSync(stateFile),
      `${args.join(' ')} removed the state file`,
    );
    assert.ok(
      !output.includes(secret),
      `${args.join(' ')} printed the secret: ${output}`,
    );
    assert.ok(
      output.includes(`PID ${String(pid)} (node, started ${startedAt})`),
      output,
    );
    assert.ok(
      output.includes(
        `left PID ${String(pid)} (node, started ${startedAt}) alone: a failed up found it running`,
      ),
      output,
    );
    assert.ok(
      !output.includes('setInterval'),
      `${args.join(' ')} printed an argument: ${output}`,
    );
  }

  assert.ok(alive(pid), 'down stopped the foreign process');
});

test('down names a listener outside the tree only by its image name and start time', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const secret = 'FAKE-SECRET-123';
  const port = await freePort();
  const registry = mkdtempSync(join(tmpdir(), 'control-yeti-app-registry-'));
  const evidenceDir = join(root, 'tmp', 'control-yeti-app', 'test-holder');
  const holder = spawn(
    process.execPath,
    [
      '-e',
      `require('node:net').createServer().listen(${String(port)})`,
      '--',
      `--token=${secret}`,
    ],
    { argv0: 'node', detached: true, stdio: 'ignore', windowsHide: true },
  );
  const stand = spawn(
    process.execPath,
    ['-e', 'setInterval(() => {}, 1 << 30)'],
    {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    },
  );
  t.after(() => {
    holder.kill();
    stand.kill();
    rmSync(stateFile, { force: true });
    rmSync(evidenceDir, { recursive: true, force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  holder.unref();
  stand.unref();
  assert.ok(holder.pid !== undefined && stand.pid !== undefined);
  await waitListening(port);
  const held = recordOf(holder.pid);
  assert.ok(
    held.commandLine?.includes(secret),
    'the secret is not on the command line',
  );
  writeState(standInState('test-holder', [recordOf(stand.pid)], port));

  const { code, result } = controlWith(
    { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry },
    'down',
  );
  assert.equal(code, 1, JSON.stringify(result));
  assert.ok(
    !JSON.stringify(result).includes(secret),
    `down printed the secret: ${JSON.stringify(result)}`,
  );
  assert.ok(
    (result.error ?? '').includes(
      `port ${String(port)} still held by PID ${String(holder.pid)} (node, started ${new Date(held.start).toISOString()}), not the recorded tree`,
    ),
    result.error,
  );
  assert.deepEqual(result.stopped, [stand.pid]);
  assert.equal(existsSync(stateFile), false, 'down kept the state file');
});

test('down exits 2 and keeps the state file when a recorded process survives the last round', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const port = await freePort();
  const registry = mkdtempSync(join(tmpdir(), 'control-yeti-app-registry-'));
  const launch = await standInLaunch(port);
  const state = standInState('test-survived', launch.tree, port);
  t.after(() => {
    killAll([launch.pid, launch.child]);
    rmSync(stateFile, { force: true });
    rmSync(state.evidenceDir, { recursive: true, force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  writeState(state);
  const env = { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry };

  const first = controlWith({ ...env, CONTROL_STOP_ROUNDS: '0' }, 'down');
  assert.equal(first.code, 2, JSON.stringify(first.result));
  assert.match(
    first.result.error ?? '',
    /still runs after the last round; state kept at .*; run down again$/,
  );
  assert.deepEqual(
    (first.result.refused ?? []).map(({ reason }) => reason).sort(),
    ['survived', 'survived'],
  );
  assert.ok(existsSync(stateFile), 'down removed the state file');
  assert.equal(
    recordsIn(readState()['tree']).length,
    launch.tree.length,
    'down did not keep the refreshed tree',
  );
  assert.ok(alive(launch.child), 'a zero-round stop stopped the child');

  const again = controlWith(env, 'down');
  assert.equal(again.code, 0, JSON.stringify(again.result));
  await waitGone(launch.child);
});

/**
 * Stops each process that still has the start time it had when the test
 * recorded it, so a PID Windows has handed out again is left alone.
 *
 * @param {ProcRecord[]} records
 */
function killStarted(records) {
  if (records.length === 0) {
    return;
  }

  const live = new Map(processTable().map((row) => [row.pid, row]));
  killAll(
    records
      .filter(({ pid, start }) => live.get(pid)?.start === start)
      .map(({ pid }) => pid),
  );
}

/**
 * The PIDs a control.mjs result lists as stopped, refused or surviving.
 *
 * @param {ControlResult} result
 */
const listedPids = (result) => [
  ...(Array.isArray(result.stopped) ? result.stopped : []),
  ...(result.refused ?? []).map(({ pid }) => pid),
  ...(result.survivors ?? []),
];

test('down on a live recorded root leaves out a process that started before it', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const began = Date.now() - 1000;
  /** @type {Set<number>} */
  const parents = new Set();
  /** @type {import('node:child_process').ChildProcess | undefined} */
  let root;
  /** @param {ProcRecord} row */
  const isOrphan = (row) =>
    parents.has(row.ppid) &&
    row.start >= began &&
    /\bping\b/i.test(row.commandLine ?? '');
  t.after(() => {
    root?.kill();
    killStarted(processTable().filter(isOrphan));
    rmSync(stateFile, { force: true });
  });
  const registry = mkdtempSync(join(tmpdir(), 'control-yeti-app-registry-'));
  t.after(() => rmSync(registry, { recursive: true, force: true }));

  // Each parent starts an orphan and exits, so its PID is free to be handed
  // out again while the orphan still names it as its parent. ping ends on its
  // own after about 600 s, should the cleanup miss it. A cmd.exe `start`
  // parent does not do: its PID was not handed out again while the orphan
  // ran.
  const exits = [];

  for (let index = 0; index < 20; index += 1) {
    const parent = spawn(
      process.execPath,
      [
        '-e',
        `require('node:child_process').spawn('ping', ['-n', '600', '127.0.0.1'], { detached: true, stdio: 'ignore' }).unref();`,
      ],
      { stdio: 'ignore', windowsHide: true },
    );
    assert.ok(parent.pid !== undefined);
    parents.add(parent.pid);
    exits.push(new Promise((done) => parent.on('close', done)));
  }

  await Promise.all(exits);
  const orphans = processTable().filter(isOrphan);
  const orphaned = new Set(orphans.map(({ ppid }) => ppid));
  assert.ok(orphans.length > 0, 'no parent left an orphan behind');

  // Windows hands a freed PID out again only after many others, so a few
  // lanes start and stop stand-ins until one holds a parent's PID.
  let attempts = 0;
  const lane = async () => {
    while (root === undefined && attempts < 20000) {
      attempts += 1;
      const standIn = spawn('cmd.exe', ['/d', '/k'], {
        stdio: ['pipe', 'ignore', 'ignore'],
        windowsHide: true,
      });
      standIn.on('error', () => undefined);

      if (
        root === undefined &&
        standIn.pid !== undefined &&
        orphaned.has(standIn.pid)
      ) {
        root = standIn;
      } else {
        standIn.kill();
        await new Promise((done) => standIn.on('close', done));
      }
    }
  };
  await Promise.all([lane(), lane(), lane(), lane(), lane(), lane()]);

  assert.ok(
    root?.pid !== undefined,
    `no stand-in got one of ${String(orphaned.size)} exited parent PIDs in ${String(attempts)} starts`,
  );
  const rootRecord = recordOf(root.pid);
  const orphan = orphans.find(({ ppid }) => ppid === rootRecord.pid);
  assert.ok(orphan, `no orphan names ${String(rootRecord.pid)} as its parent`);
  killStarted(orphans.filter(({ pid }) => pid !== orphan.pid));
  assert.ok(
    orphan.start < rootRecord.start,
    'the orphan did not start before the stand-in root',
  );
  const state = standInState('test-pre-root', [rootRecord], await freePort());
  t.after(() => rmSync(state.evidenceDir, { recursive: true, force: true }));
  writeState(state);
  const env = { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry };
  const listed = new RegExp(`\\b${String(orphan.pid)}\\b`);
  const recordedTree = () =>
    existsSync(stateFile) ? recordsIn(readState()['tree']) : [];

  // The first down finds the root alive; the second runs on the state as
  // recorded, the root now gone.
  for (const run of ['live root', 'dead root']) {
    if (!existsSync(stateFile)) {
      writeState(state);
    }

    const { code, result } = controlWith(env, 'down');
    assert.equal(
      listedPids(result).includes(orphan.pid),
      false,
      `${run}: ${JSON.stringify(result)}`,
    );
    assert.doesNotMatch(JSON.stringify(result), listed, run);
    assert.equal(
      recordedTree().some(({ pid }) => pid === orphan.pid),
      false,
      `${run}: the state file records the orphan`,
    );
    assert.equal(code, 0, `${run}: ${JSON.stringify(result)}`);
    assert.ok(alive(orphan.pid), `${run}: down stopped the orphan`);
  }

  assert.equal(alive(rootRecord.pid), false, 'down left the root running');
});

test('down leaves alone a recorded process that started before the root', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const older = spawn(
    process.execPath,
    ['-e', 'setInterval(() => {}, 1 << 30)'],
    { detached: true, stdio: 'ignore', windowsHide: true },
  );
  t.after(() => older.kill());
  older.unref();
  t.after(() => rmSync(stateFile, { force: true }));
  assert.ok(older.pid !== undefined);
  const olderRecord = recordOf(older.pid);
  const port = await freePort();
  const registry = mkdtempSync(join(tmpdir(), 'control-yeti-app-registry-'));
  t.after(() => rmSync(registry, { recursive: true, force: true }));
  const launch = await standInLaunch(port, t);
  const state = standInState('test-older-record', launch.tree, port);
  t.after(() => rmSync(state.evidenceDir, { recursive: true, force: true }));
  assert.ok(olderRecord.start < (launch.tree[0]?.start ?? 0));
  writeState({
    ...state,
    tree: [...launch.tree, { ...olderRecord, ppid: launch.pid }],
  });

  const { code, result } = controlWith(
    { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry },
    'down',
  );
  assert.equal(code, 0, JSON.stringify(result));
  assert.equal(
    listedPids(result).includes(olderRecord.pid),
    false,
    JSON.stringify(result),
  );
  assert.ok(
    alive(olderRecord.pid),
    'down stopped a process older than the root',
  );
  await waitGone(launch.child);
});

/**
 * A copy of the skill in a checkout of its own, whose stand-in nx runs
 * `nxSource` (CommonJS; `out(name, pid)` writes a PID to `<name>.txt` in the
 * checkout). Every process whose PID the stand-in wrote, started since this
 * call, is stopped after the test.
 *
 * @param {import('node:test').TestContext} t
 * @param {string} nxSource
 */
function standInCheckout(t, nxSource) {
  const began = Date.now() - 1000;
  mkdirSync(join(root, 'tmp', 'control-yeti-app'), { recursive: true });
  const checkout = mkdtempSync(
    join(root, 'tmp', 'control-yeti-app', 'launch-exit-'),
  );
  /** @param {string} name */
  const written = (name) => {
    const file = join(checkout, `${name}.txt`);

    return existsSync(file) ? Number(readFileSync(file, 'utf8')) : undefined;
  };
  /**
   * The live process the stand-in wrote as `name`, if it still runs.
   *
   * @param {string} name
   */
  const liveOf = (name) => {
    const pid = written(name);

    return pid === undefined
      ? undefined
      : processTable().find((row) => row.pid === pid && row.start >= began);
  };
  /** @type {string[]} */
  const names = [];
  t.after(() => {
    killStarted(
      names.flatMap((name) => {
        const record = liveOf(name);

        return record === undefined ? [] : [record];
      }),
    );
    rmSync(checkout, { recursive: true, force: true });
  });
  const skill = join(checkout, '.claude', 'skills', 'control-yeti-app');
  const nx = join(checkout, 'node_modules', 'nx');
  mkdirSync(join(checkout, '.git'));
  mkdirSync(join(skill, 'scripts'), { recursive: true });
  mkdirSync(nx, { recursive: true });

  for (const name of ['control.mjs', 'fingerprint.mjs', 'proctree.mjs']) {
    copyFileSync(join(here, name), join(skill, 'scripts', name));
  }

  writeFileSync(
    join(nx, 'package.json'),
    '{ "name": "nx", "main": "index.js" }\n',
  );
  writeFileSync(
    join(nx, 'index.js'),
    `const out = (name, pid) => require('node:fs').writeFileSync(require('node:path').join(${JSON.stringify(checkout)}, name + '.txt'), String(pid));
const idle = () => require('node:child_process').spawn(process.execPath, ['-e', 'setTimeout(() => {}, 300000)'], { cwd: require('node:os').tmpdir(), detached: true, stdio: 'ignore' });
${nxSource}
`,
  );

  /**
   * @param {NodeJS.ProcessEnv} env
   * @param {string[]} args
   */
  const control = (env, ...args) => {
    const run = spawnSync(
      process.execPath,
      [join(skill, 'scripts', 'control.mjs'), ...args, '--json'],
      {
        cwd: checkout,
        env,
        encoding: 'utf8',
        timeout: 120000,
        windowsHide: true,
      },
    );
    assert.ok(run.stdout, run.stderr);
    /** @type {ControlResult} */
    const result = JSON.parse(run.stdout);

    return { code: run.status, result };
  };

  return {
    stateFile: join(checkout, 'tmp', 'control-yeti-app', 'state.json'),
    control,
    written,
    liveOf,
    /** @param {string[]} more */
    track: (...more) => names.push(...more),
  };
}

test('up never reports a launch that exited as stopped while a child it started still runs', async (t) => {
  // The stand-in nx starts a child that outlives it and exits right after,
  // between two of up's polls.
  const standIn = standInCheckout(
    t,
    `setTimeout(() => { out('child', idle().pid); process.exit(0); }, 3000);`,
  );
  standIn.track('child');
  const port = await freePort();

  const { code, result } = standIn.control(
    process.env,
    'up',
    `--port=${String(port)}`,
  );
  const child = standIn.written('child');
  const running = standIn.liveOf('child');
  assert.ok(child !== undefined, 'the stand-in nx started no child');
  assert.equal(code, 1, JSON.stringify(result));
  assert.match(result.error ?? '', /^the launch exited before it was ready/);
  assert.equal(existsSync(standIn.stateFile), false, 'up kept the state file');
  assert.equal(
    Array.isArray(result.stopped) && result.stopped.includes(result.pid),
    false,
    `up stopped the exited launch's PID: ${JSON.stringify(result)}`,
  );

  if (running === undefined) {
    assert.ok(
      Array.isArray(result.stopped) && result.stopped.includes(child),
      `the child ${String(child)} is gone but up did not stop it through the tree: ${JSON.stringify(result)}`,
    );
  } else {
    assert.equal(result.launchStopped, false, JSON.stringify(result));
    assert.ok(
      (result.survivors ?? []).includes(child),
      `up did not name the running child ${String(child)}: ${JSON.stringify(result)}`,
    );
    assert.match(result.error ?? '', new RegExp(`PID ${String(child)} `));
  }
});

test('up names the children of a launch it never saw in the process table', async (t) => {
  // up's lookups miss on purpose, while the launch starts a child and exits.
  const standIn = standInCheckout(
    t,
    `out('child', idle().pid); setTimeout(() => process.exit(0), 300);`,
  );
  standIn.track('child');
  const port = await freePort();

  const { code, result } = standIn.control(
    { ...process.env, CONTROL_PID_LOOKUP_MISSES: '1000' },
    'up',
    `--port=${String(port)}`,
  );
  const child = standIn.written('child');
  assert.ok(child !== undefined, 'the stand-in nx started no child');
  assert.ok(standIn.liveOf('child'), 'the child did not outlive the launch');
  assert.equal(code, 1, JSON.stringify(result));
  assert.match(result.error ?? '', /did not appear in the process table/);
  assert.equal(result.launchStopped, false, JSON.stringify(result));
  assert.deepEqual(result.survivors, [child], JSON.stringify(result));
  assert.match(result.error ?? '', new RegExp(`PID ${String(child)} `));
  assert.equal(existsSync(standIn.stateFile), false, 'up kept a state file');
});

test('up keeps the processes it never recorded in the kept state file, and down names them again', async (t) => {
  // A recorded child that a zero-round stop leaves running, and a child the
  // launch starts right before it exits, which no poll records.
  const standIn = standInCheckout(
    t,
    `out('recorded', idle().pid);
setTimeout(() => { out('late', idle().pid); process.exit(0); }, 3000);`,
  );
  standIn.track('recorded', 'late');
  const registry = mkdtempSync(join(tmpdir(), 'control-yeti-app-registry-'));
  t.after(() => rmSync(registry, { recursive: true, force: true }));
  const env = { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry };
  const port = await freePort();

  const up = standIn.control(
    { ...env, CONTROL_STOP_ROUNDS: '0' },
    'up',
    `--port=${String(port)}`,
  );
  const recorded = standIn.written('recorded');
  const late = standIn.written('late');
  assert.ok(recorded !== undefined && late !== undefined, 'no child written');
  assert.ok(standIn.liveOf('late'), 'the late child is gone');
  assert.equal(up.code, 1, JSON.stringify(up.result));
  assert.match(
    up.result.error ?? '',
    new RegExp(
      `still runs after the last round; PID ${String(late)} .*; state kept at .*; run down$`,
    ),
  );
  assert.deepEqual(up.result.survivors, [late]);
  assert.ok(existsSync(standIn.stateFile), 'up removed the state file');
  const kept = JSON.parse(readFileSync(standIn.stateFile, 'utf8'));
  assert.deepEqual(
    recordsIn(kept.unrecorded).map(({ pid }) => pid),
    [late],
    'the kept state file does not record the late child',
  );

  const down = standIn.control(env, 'down');
  assert.equal(down.code, 0, JSON.stringify(down.result));
  assert.ok(
    Array.isArray(down.result.stopped) &&
      down.result.stopped.includes(recorded),
    JSON.stringify(down.result),
  );
  assert.deepEqual(down.result.unrecorded, [late]);
  assert.ok(
    (down.result.notes ?? []).some((note) =>
      note.startsWith(`left PID ${String(late)} `),
    ),
    JSON.stringify(down.result.notes),
  );
  assert.ok(standIn.liveOf('late'), 'down stopped the unrecorded child');
});

test('down without playwright-cli exits 1 while the session is listed as open', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const state = await deadRun('test-absent');
  const { session } = state;
  writeState(state);
  t.after(() => {
    cli(session, 'close');
    rmSync(stateFile, { force: true });
    rmSync(state.evidenceDir, { recursive: true, force: true });
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
  const port = await freePort();
  const fake = spawn(
    process.execPath,
    ['-e', `require('node:net').createServer().listen(${String(port)})`],
    { detached: true, stdio: 'ignore', windowsHide: true },
  );
  fake.unref();
  const { pid } = fake;
  assert.ok(pid !== undefined);
  const state = standInState('test-unreadable', [recordOf(pid)], port);
  const { session } = state;
  const registry = mkdtempSync(join(tmpdir(), 'control-yeti-app-registry-'));
  mkdirSync(join(registry, 'daemon-a'));
  const entry = join(registry, 'daemon-a', `${session}.session`);
  writeFileSync(entry, '');
  t.after(() => {
    killAll([pid]);
    rmSync(stateFile, { force: true });
    rmSync(state.evidenceDir, { recursive: true, force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  await waitListening(port);
  writeState(state);

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

test('an ssr launch', async (t) => {
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
    assert.equal(typeof launch.start, 'string', 'up recorded no start time');
    assert.equal(
      typeof launch.commandLine,
      'string',
      'up recorded no command line',
    );
  });

  t.after(ensureDown);

  await t.test('up records the tree root first and the ports it used', () => {
    const run = started();
    assert.equal(run.tree[0]?.pid, run.pid);
    assert.equal(run.tree[0]?.commandLine, run.commandLine);
    assert.ok(run.tree.length > 1, JSON.stringify(run.tree));
    const { code, result } = control('info');
    assert.equal(code, 0, JSON.stringify(result));
    assert.deepEqual(result.ports, [
      { name: 'ssr', port: run.port, kind: 'derived' },
    ]);
    assert.equal(result.tree?.[0]?.pid, run.pid);
  });

  await t.test(
    'doctor probes the build, and it agrees with the state file',
    () => {
      const { code, result } = control('doctor');
      assert.equal(code, 0, JSON.stringify(result.checks));
      assert.equal(result.build, 'production');
      assert.match(
        result.checks?.find(({ name }) => name === 'build')?.detail ?? '',
        /window\.ng absent/,
      );
      assert.equal(
        result.checks?.find(({ name }) => name === 'ports')?.detail,
        `ssr ${String(started().port)} (derived)`,
      );
    },
  );

  await t.test(
    'doctor fails ports when a recorded port is not listening',
    async () => {
      const state = readState();
      const port = await freePort();
      writeState({
        ...state,
        ports: [{ name: 'ssr', port, kind: 'derived' }],
      });

      try {
        const { code, result } = control('doctor');
        assert.equal(code, 1, JSON.stringify(result.checks));
        assert.deepEqual(result.failed, ['ports']);
        assert.equal(
          result.checks?.find(({ name }) => name === 'ports')?.detail,
          `ssr ${String(port)} not listening`,
        );
      } finally {
        writeState(state);
      }
    },
  );

  await t.test(
    'doctor fails build when the state file records another build',
    () => {
      const state = readState();
      writeState({ ...state, configuration: 'development' });

      try {
        const { code, result } = control('doctor');
        assert.equal(code, 1, JSON.stringify(result.checks));
        assert.ok(
          (result.failed ?? []).includes('build'),
          JSON.stringify(result.checks),
        );
        assert.match(
          result.checks?.find(({ name }) => name === 'build')?.detail ?? '',
          /records development, the page is a production build/,
        );
      } finally {
        writeState(state);
      }
    },
  );

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

  await t.test('doctor ignores files Git ignores', () => {
    const created = [
      'packages/ngx-yeti/node_modules',
      'packages/ngx-yeti/storybook-static',
      'packages/ngx-yeti/box/dist',
      'vendor/yeti/docs',
      'packages/ngx-yeti/.vitest-attachments',
      'packages/ngx-yeti/box/src/__screenshots__',
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

  await t.test(
    'doctor fails ports when a process outside the tree holds a recorded port',
    async () => {
      const state = readState();
      const server = createServer();
      await new Promise((done) => server.listen(0, () => done(undefined)));
      const address = server.address();
      assert.ok(address !== null && typeof address === 'object');
      writeState({
        ...state,
        ports: [{ name: 'ssr', port: address.port, kind: 'derived' }],
      });

      try {
        const { code, result } = control('doctor');
        assert.equal(code, 1, JSON.stringify(result.checks));
        assert.deepEqual(result.failed, ['ports']);
        assert.equal(
          result.checks?.find(({ name }) => name === 'ports')?.detail,
          `ssr ${String(address.port)} held by PID ${String(process.pid)}, not the recorded tree`,
        );
      } finally {
        writeState(state);
        await new Promise((done) => server.close(done));
      }
    },
  );

  await t.test(
    'down stops the tree, then exits 1 and removes the file while another process holds the port',
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
      assert.equal(existsSync(stateFile), false, 'down kept the state file');
      assert.equal(first.result.portFree, false);
      assert.deepEqual(
        (first.result.sessions ?? []).map(({ outcome }) => outcome),
        ['closed', 'closed'],
        JSON.stringify(first.result.sessions),
      );
      assert.match(
        first.result.error ?? '',
        new RegExp(
          `port ${String(busyPort)} still held by PID ${String(process.pid)} \\(.*\\), not the recorded tree; it may be another session's instance or the user's own, so down left it running; removed `,
        ),
      );
      assert.doesNotMatch(first.result.error ?? '', /stop by hand/);
      assert.equal(alive(started().pid), false, 'the launch still runs');

      for (const record of started().tree) {
        assert.equal(
          processTable().some(
            (row) => row.pid === record.pid && row.start === record.start,
          ),
          false,
          `pid ${String(record.pid)} of the recorded tree still runs`,
        );
      }

      await closeListener();
      const last = control('down');
      assert.equal(last.code, 2, JSON.stringify(last.result));
    },
  );

  await t.test('ends with the port free and the launch gone', async () => {
    await ensureDown();
    assert.equal(existsSync(stateFile), false);
    assert.equal(alive(started().pid), false);
    assert.equal(listening(started().port), false);
  });
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
  assert.equal(existsSync(stateFile), false);
  assert.equal(listening(run.port), false);
});
