// @ts-check
// Drives control.mjs through stand-in states and processes and two static
// launches: the refused flags and planted state, the slot and port rules, the
// recorded process tree and its orphaned grandchild, the freshness check over
// the shared story helpers, doctor's ports and map-fresh lines, down's session
// report, and an exception's exit 2. Windows only, like the proof runs. Builds
// the static Storybook, so nothing else may build in this checkout while it
// runs.
// Run: node --test .claude/skills/control-ngx-yeti-storybook/scripts/control.test.mjs
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
import { fileURLToPath, pathToFileURL } from 'node:url';
import { merge, processTable, snapshot, stop } from './proctree.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../..');
const script = join(here, 'control.mjs');
const scratch = join(root, 'tmp', 'control-ngx-yeti-storybook');
const stateFile = join(scratch, 'state-static.json');
const testingSource = join(root, 'packages/ngx-yeti-testing/src/index.ts');
const plantedFile = join(scratch, 'planted.txt');
const attachments = join(root, 'packages/ngx-yeti/.vitest-attachments');
const builtIndex = join(root, 'packages/ngx-yeti/storybook-static/index.json');
const target = 'ngx-yeti:static-storybook';
// The slots up tries in the checkout this suite runs in, by the rule of
// SKILL.md "Pick a flow": slot 0 in the main checkout, else 1 to 99 from a
// hash of the checkout path, then the next ones. The ten-busy-slots test
// compares this order with the one up prints, and the session test the
// checkout id with the one info prints, so neither can drift apart unseen.
const inWorktree = statSync(join(root, '.git')).isFile();
const rootHash = createHash('sha1').update(root.toLowerCase()).digest();
const firstSlot = inWorktree ? 1 + (rootHash.readUInt32BE(0) % 99) : 0;
const slotOrder = Array.from({ length: 10 }, (_, index) =>
  firstSlot === 0 ? index : 1 + ((firstSlot - 1 + index) % 99),
);
// The static row of the ports table: 4401 in slot 0, else 4421 + 2 * (slot - 1).
const staticPorts = slotOrder.map((slot) =>
  slot === 0 ? 4401 : 4421 + 2 * (slot - 1),
);
const [ownPort = 0] = staticPorts;
const checkoutId = inWorktree
  ? `wt-${rootHash.toString('hex').slice(0, 8)}`
  : 'main';

/** @typedef {import('./proctree.mjs').ProcRecord} ProcRecord */

/**
 * The fields of control.mjs's JSON output these tests read.
 *
 * @typedef {object} ControlResult
 * @property {string} [message]
 * @property {{ name: string, status: string, detail: string }[]} [checks]
 * @property {{ outcome: string, detail: string }} [sessionClose]
 * @property {number[]} [stoppedPids]
 * @property {number[]} [gonePids]
 * @property {unknown} [launchStopped]
 * @property {unknown} [session]
 * @property {{ pid: number, reason: string }[]} [refused]
 * @property {boolean} [portFree]
 * @property {unknown} [port]
 * @property {{ name: string, port: number, kind: string, reason?: string }[]} [ports]
 * @property {ProcRecord[]} [tree]
 */

/**
 * @typedef {object} Launch
 * @property {number} pid
 * @property {number} port
 * @property {string} session
 * @property {string} url
 * @property {ProcRecord[]} tree
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
  typeof result.url === 'string' &&
  'tree' in result &&
  Array.isArray(result.tree);

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

/**
 * control.mjs without blocking this process, so a test can act while `up`
 * waits.
 *
 * @param {string[]} args
 * @returns {Promise<{ code: number | null, result: ControlResult }>}
 */
function controlAsync(...args) {
  const child = spawn(process.execPath, [script, ...args, '--json'], {
    cwd: root,
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

/** @param {unknown} value */
const isRecord = (value) =>
  typeof value === 'object' &&
  value !== null &&
  'pid' in value &&
  typeof value.pid === 'number' &&
  'start' in value &&
  typeof value.start === 'number';

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
// proctree.mjs.
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

/** @param {number} port */
const listenScript = (port) =>
  `require('node:net').createServer().listen(${String(port)})`;

/**
 * A state file for a stand-in run whose root record is `tree[0]`.
 *
 * @param {string} name
 * @param {ProcRecord[]} tree
 * @param {number} port
 */
function standInState(name, tree, port) {
  const [first] = tree;
  assert.ok(first);
  mkdirSync(scratch, { recursive: true });

  return {
    session: `control-ngx-yeti-storybook-${name}`,
    pid: first.pid,
    port,
    ports: [{ name: 'static', port, kind: 'derived' }],
    url: `http://localhost:${String(port)}`,
    target,
    log: join(scratch, `${name}.log`),
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
      tree: launch.tree,
    });
    control('down');
  }

  forceDown();
}

/**
 * A copy of the skill in a checkout of its own. The copy's playwright module
 * re-exports this checkout's, so no link is needed.
 *
 * @param {string} prefix
 * @param {boolean} worktree  `.git` is a file, as in a linked worktree
 */
function skillCopy(prefix, worktree) {
  mkdirSync(scratch, { recursive: true });
  const checkout = mkdtempSync(join(scratch, prefix));
  const skill = join(
    checkout,
    '.claude',
    'skills',
    'control-ngx-yeti-storybook',
  );

  if (worktree) {
    writeFileSync(join(checkout, '.git'), 'gitdir: elsewhere\n');
  } else {
    mkdirSync(join(checkout, '.git'));
  }

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
    'proctree.mjs',
    'storybook-preview.d.ts',
  ]) {
    copyFileSync(join(here, name), join(skill, 'scripts', name));
  }

  return { checkout, skill };
}

test('doctor reports map-fresh as a warning or a pass that never changes its exit code, and skips ports with --url', async (t) => {
  const { checkout, skill } = skillCopy('map-fresh-', false);
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
      ports: result.checks?.find(({ name }) => name === 'ports'),
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
  assert.deepEqual(unproven.ports, {
    name: 'ports',
    status: 'skipped',
    detail: '--url given; ownership not checked',
  });
  assert.match(
    unproven.text,
    /^ {2}\[SKIP\] ports: --url given; ownership not checked$/m,
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

test('refuses unknown flags and values after a space', (t) => {
  t.after(forceDown);

  for (const args of [
    ['up', '--devv'],
    ['doctor', '--url', 'http://localhost:4401'],
    ['up', '--port', '4401'],
    ['doctor', '--port=4401'],
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
    assert.match(result.message ?? '', /--port=<n> \(up\)/);
  }

  const usage = control('nothing');
  assert.equal(usage.code, 2, JSON.stringify(usage.result));
  assert.equal(
    usage.result.message,
    'usage: control.mjs <up|doctor|info|down> [--dev] [--port=<n>] [--url=<origin>] [--json]',
  );
  assert.equal(existsSync(stateFile), false, 'a refused up wrote state');
});

test('every command refuses a state file that is not JSON', (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  mkdirSync(scratch, { recursive: true });
  writeFileSync(stateFile, '{"pid":');
  t.after(forceDown);

  for (const command of ['up', 'doctor', 'info', 'down']) {
    const { code, result } = control(command);
    assert.equal(code, 2, `${command}: ${JSON.stringify(result)}`);
    assert.match(result.message ?? '', /could not be read as JSON/, command);
  }
});

test('every command refuses a state file without a process tree rooted at its pid', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const state = await deadRun('test-no-tree');
  t.after(forceDown);

  for (const planted of [
    { ...state, tree: [] },
    { ...state, tree: 'none' },
    { ...state, pid: state.pid + 1 },
  ]) {
    writeState(planted);

    for (const command of ['up', 'doctor', 'info', 'down']) {
      const { code, result } = control(command);
      assert.equal(code, 2, `${command}: ${JSON.stringify(result)}`);
      assert.match(result.message ?? '', /a tree that is not a list/, command);
    }
  }
});

test('every command refuses a state file from a control.mjs without process trees, naming its pid and the way out', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const state = await deadRun('test-old-state');
  t.after(forceDown);
  const { tree: _tree, ports: _ports, ...old } = state;
  writeState(old);

  for (const command of ['up', 'doctor', 'info', 'down']) {
    const { code, result } = control(command);
    assert.equal(code, 2, `${command}: ${JSON.stringify(result)}`);
    assert.equal(
      result.message,
      `refused: ${stateFile} was written by a control.mjs without a process tree (pid ${String(state.pid)}, port ${String(state.port)}); check that pid ${String(state.pid)} is this checkout's server, stop it by hand, then delete ${stateFile}; nothing was run`,
      command,
    );
  }
});

test('the human output escapes control and bidi characters of a recorded command line', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const state = await deadRun('test-printable');
  t.after(() => rmSync(stateFile, { force: true }));
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

test('the session is named per checkout and flow, never per port', () => {
  const { checkout, skill } = skillCopy('session-', true);

  try {
    for (const [args, session] of [
      [[], `control-ngx-yeti-storybook-${checkoutId}-static`],
      [['--dev'], `control-ngx-yeti-storybook-${checkoutId}-dev`],
    ]) {
      assert.ok(args !== undefined && session !== undefined);
      const { code, result } = control('info', ...args);
      assert.equal(code, 2, JSON.stringify(result));
      assert.equal(result.session, session);
    }

    const run = spawnSync(
      process.execPath,
      [join(skill, 'scripts', 'control.mjs'), 'info', '--json'],
      { cwd: checkout, encoding: 'utf8', windowsHide: true },
    );
    /** @type {ControlResult} */
    const result = JSON.parse(run.stdout);
    assert.match(
      String(result.session),
      /^control-ngx-yeti-storybook-wt-[0-9a-f]{8}-static$/,
    );
  } finally {
    rmSync(checkout, { recursive: true, force: true });
  }
});

test('info prints the ports and the tree', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const state = await deadRun('test-info');
  t.after(() => rmSync(stateFile, { force: true }));
  writeState(state);

  const { code, result } = control('info');
  assert.equal(code, 0, JSON.stringify(result));
  assert.deepEqual(result.ports, state.ports);
  assert.deepEqual(result.tree, state.tree);
});

test("a worktree refuses the main checkout's ports with --port", (t) => {
  const { checkout, skill } = skillCopy('worktree-', true);
  t.after(() => {
    // Stops a launch the copy started if a refusal regressed.
    for (const flowArgs of [[], ['--dev']]) {
      spawnSync(
        process.execPath,
        [join(skill, 'scripts', 'control.mjs'), 'down', ...flowArgs, '--json'],
        { cwd: checkout, windowsHide: true },
      );
    }

    rmSync(checkout, { recursive: true, force: true });
  });

  for (const args of [['--port=4401'], ['--dev', '--port=4400']]) {
    const run = spawnSync(
      process.execPath,
      [join(skill, 'scripts', 'control.mjs'), 'up', ...args, '--json'],
      { cwd: checkout, encoding: 'utf8', windowsHide: true },
    );
    assert.equal(run.status, 2, run.stdout);
    /** @type {ControlResult} */
    const result = JSON.parse(run.stdout);
    assert.match(
      result.message ?? '',
      /is the main checkout's Storybook port; a worktree uses its derived port (\d+)/,
    );
    const derived = Number(
      /derived port (\d+)/.exec(result.message ?? '')?.[1] ?? 0,
    );
    assert.ok(derived >= 4420 && derived <= 4617, `derived port ${derived}`);
    assert.equal(derived % 2, args.includes('--dev') ? 0 : 1);
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

  for (const port of staticPorts) {
    servers.push(await occupy(port));
  }

  const { code, result } = control('up');
  assert.equal(code, 2, JSON.stringify(result));
  assert.match(
    result.message ?? '',
    new RegExp(
      `^refused: no free slot in 10 tries \\(slots ${slotOrder.join(', ')}\\): `,
    ),
  );

  for (const port of staticPorts) {
    assert.match(
      result.message ?? '',
      new RegExp(`static ${String(port)} held by PID \\d+`),
    );
  }

  assert.equal(existsSync(stateFile), false, 'a refused up wrote state');
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
    result.message,
    `refused: port ${String(port)} (--port) held by PID ${String(process.pid)}; --port has no fallback`,
  );
  assert.equal(existsSync(stateFile), false, 'a refused up wrote state');
});

test('down counts a session entry without a socketPath, or a registry it cannot list, as left open', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const state = await deadRun('test-shape');
  const registry = mkdtempSync(join(tmpdir(), 'control-storybook-registry-'));
  mkdirSync(join(registry, 'daemon-a'));
  const entry = join(registry, 'daemon-a', `${state.session}.session`);
  writeFileSync(entry, '{"version":2}');
  const notFolder = join(registry, 'not-a-folder');
  writeFileSync(notFolder, '');
  t.after(() => {
    rmSync(stateFile, { force: true });
    rmSync(registry, { recursive: true, force: true });
  });

  for (const { base, named } of [
    { base: registry, named: entry },
    { base: notFolder, named: notFolder },
  ]) {
    writeState(state);
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
  const state = await deadRun('test-absent');
  const { session } = state;
  writeState(state);
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
  const port = await freePort();
  const server = spawn(
    process.execPath,
    ['-e', listenScript(port), target, `--port=${String(port)}`],
    { detached: true, stdio: 'ignore', windowsHide: true },
  );
  server.unref();
  const { pid } = server;
  assert.ok(pid !== undefined);
  const state = standInState('test-unreadable', [recordOf(pid)], port);
  const { registry, entry } = registryWithEmptyEntry(state.session);
  t.after(() => {
    killAll([pid]);
    rmSync(stateFile, { force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  await waitListening(port);
  writeState(state);

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
    new RegExp(`session ${state.session} left-open`),
  );
  assert.deepEqual(result.stoppedPids, [pid]);
  assert.equal(result.portFree, true);
  assert.equal(alive(pid), false);
  assert.equal(listening(port), false);
  assert.equal(existsSync(stateFile), false);
});

test('down stops the child a wrapper left running from the recorded tree', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const port = await freePort();
  const wrapper = spawn(
    process.execPath,
    [
      '-e',
      `require('node:child_process').spawn(process.execPath, ['-e', ${JSON.stringify(listenScript(port))}], { detached: true, stdio: 'ignore' }); setInterval(() => {}, 1 << 30);`,
    ],
    { detached: true, stdio: 'ignore', windowsHide: true },
  );
  wrapper.unref();
  const { pid } = wrapper;
  assert.ok(pid !== undefined);
  const registry = mkdtempSync(join(tmpdir(), 'control-storybook-registry-'));
  /** @type {number[]} */
  const toKill = [pid];
  t.after(() => {
    killAll(toKill);
    rmSync(stateFile, { force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  await waitListening(port);
  const [child] = owners(port);
  assert.ok(child !== undefined && child !== pid);
  toKill.push(child);
  // The tree as up records it while the wrapper still runs.
  const tree = snapshot(recordOf(pid));
  assert.deepEqual(
    tree.map((record) => record.pid),
    [pid, child],
  );
  writeState(standInState('test-orphan', tree, port));
  process.kill(pid);
  await waitGone(pid);
  assert.ok(alive(child), 'the child did not outlive the wrapper');

  const { code, result } = controlWith(
    { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry },
    'down',
  );
  assert.equal(code, 0, JSON.stringify(result));
  assert.deepEqual(result.stoppedPids, [child]);
  assert.equal(result.portFree, true);
  assert.equal(alive(child), false, 'down left the orphaned child running');
  assert.equal(listening(port), false, `something listens on ${port}`);
  assert.equal(existsSync(stateFile), false, 'the state file was kept');
});

test('down leaves alone a recorded child whose PID now belongs to another process', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const other = spawn(
    process.execPath,
    ['-e', 'setInterval(() => {}, 1 << 30)'],
    { detached: true, stdio: 'ignore', windowsHide: true },
  );
  other.unref();
  const { pid } = other;
  assert.ok(pid !== undefined);
  const live = recordOf(pid);
  const state = await deadRun('test-reused');
  const [deadRoot] = state.tree;
  assert.ok(deadRoot);
  const registry = mkdtempSync(join(tmpdir(), 'control-storybook-registry-'));
  t.after(() => {
    killAll([pid]);
    rmSync(stateFile, { force: true });
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

test('down names a listener outside the tree without offering to stop it, and then shows a failed listener query', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const secret = 'FAKE-SECRET-123';
  const port = await freePort();
  const registry = mkdtempSync(join(tmpdir(), 'control-storybook-registry-'));
  const holder = spawn(
    process.execPath,
    ['-e', listenScript(port), '--', `--token=${secret}`],
    { argv0: 'node', detached: true, stdio: 'ignore', windowsHide: true },
  );
  const stand = spawn(
    process.execPath,
    ['-e', 'setInterval(() => {}, 1 << 30)', target, `--port=${String(port)}`],
    { detached: true, stdio: 'ignore', windowsHide: true },
  );
  t.after(() => {
    holder.kill();
    stand.kill();
    rmSync(stateFile, { force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  holder.unref();
  stand.unref();
  const { pid } = stand;
  assert.ok(pid !== undefined && holder.pid !== undefined);
  await waitListening(port);
  const held = recordOf(holder.pid);
  assert.ok(
    held.commandLine?.includes(secret),
    'the secret is not on the command line',
  );
  writeState(standInState('test-held', [recordOf(pid)], port));
  const env = { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry };

  const first = controlWith(env, 'down');
  assert.equal(first.code, 1, JSON.stringify(first.result));
  assert.ok(
    !JSON.stringify(first.result).includes(secret),
    `down printed the secret: ${JSON.stringify(first.result)}`,
  );
  assert.ok(
    (first.result.message ?? '').includes(
      `port ${String(port)} still held by PID ${String(holder.pid)} (node, started ${new Date(held.start).toISOString()}), not the recorded tree; it may be another session's instance or the user's own, so down left it running; removed `,
    ),
    first.result.message,
  );
  assert.doesNotMatch(first.result.message ?? '', /stop by hand/);
  assert.deepEqual(first.result.stoppedPids, [pid]);
  assert.equal(existsSync(stateFile), false, 'the state file was kept');

  const dead = await deadRun('test-held-query');
  writeState(standInState('test-held-query', dead.tree, port));
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

/**
 * A stand-in launch: a wrapper that keeps running and a child of it that
 * listens on `port`, recorded the way up records a tree.
 *
 * @param {number} port
 */
async function standInLaunch(port) {
  const wrapper = spawn(
    process.execPath,
    [
      '-e',
      `require('node:child_process').spawn(process.execPath, ['-e', ${JSON.stringify(listenScript(port))}], { detached: true, stdio: 'ignore' }); setInterval(() => {}, 1 << 30);`,
    ],
    { detached: true, stdio: 'ignore', windowsHide: true },
  );
  wrapper.unref();
  const { pid } = wrapper;
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
  const registry = mkdtempSync(join(tmpdir(), 'control-storybook-registry-'));
  const launch = await standInLaunch(port);
  t.after(() => {
    killAll([launch.pid, launch.child]);
    rmSync(stateFile, { force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  const [first, ...others] = launch.tree;
  assert.ok(first);
  writeState(
    standInState('test-mismatch', [{ ...first, start: 1 }, ...others], port),
  );

  const { code, result } = controlWith(
    { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry },
    'down',
  );
  assert.equal(code, 2, JSON.stringify(result));
  assert.match(
    result.message ?? '',
    /^refused: pid \d+ start-time or command-line mismatch: left it running and stopped the other recorded processes that still match; state kept at /,
  );
  assert.deepEqual(result.stoppedPids, [launch.child]);
  assert.ok(existsSync(stateFile), 'down removed the state file');
  assert.ok(alive(launch.pid), 'down stopped the mismatched root');
  await waitGone(launch.child);
});

test('down names only the image name and start time of a foreign process that holds the recorded PID', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const secret = 'FAKE-SECRET-123';
  const registry = mkdtempSync(join(tmpdir(), 'control-storybook-registry-'));
  const foreign = spawn(
    process.execPath,
    ['-e', 'setInterval(() => {}, 1 << 30)', '--', `--token=${secret}`],
    { argv0: 'node', detached: true, stdio: 'ignore', windowsHide: true },
  );
  t.after(() => {
    foreign.kill();
    rmSync(stateFile, { force: true });
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
  const port = await freePort();
  writeState(
    standInState(
      'test-foreign',
      [
        {
          pid,
          ppid: 0,
          start: live.start - 60_000,
          commandLine: 'node recorded.js',
        },
      ],
      port,
    ),
  );
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
      !output.includes('setInterval'),
      `${args.join(' ')} printed an argument: ${output}`,
    );
  }

  assert.ok(alive(pid), 'down stopped the foreign process');
});

test('down exits 2 and keeps the state file when a recorded process survives the last round', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const port = await freePort();
  const registry = mkdtempSync(join(tmpdir(), 'control-storybook-registry-'));
  const launch = await standInLaunch(port);
  t.after(() => {
    killAll([launch.pid, launch.child]);
    rmSync(stateFile, { force: true });
    rmSync(registry, { recursive: true, force: true });
  });
  writeState(standInState('test-survived', launch.tree, port));
  const env = { ...envWithoutCli(), CONTROL_SESSION_REGISTRY: registry };

  const first = controlWith({ ...env, CONTROL_STOP_ROUNDS: '0' }, 'down');
  assert.equal(first.code, 2, JSON.stringify(first.result));
  assert.match(
    first.result.message ?? '',
    /still runs after the last round; state kept at .*; run down again$/,
  );
  assert.deepEqual(
    (first.result.refused ?? []).map(({ reason }) => reason).sort(),
    ['survived', 'survived'],
  );
  assert.ok(existsSync(stateFile), 'down removed the state file');
  assert.equal(recordsIn(readState()['tree']).length, launch.tree.length);
  assert.ok(alive(launch.child), 'a zero-round stop stopped the child');

  const again = controlWith(env, 'down');
  assert.equal(again.code, 0, JSON.stringify(again.result));
  await waitGone(launch.child);
});

test('up stops what a stale state file still records before it discards the file', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const port = await freePort();
  const busy = await occupy(await freePort());
  const busyAddress = busy?.address();
  assert.ok(typeof busyAddress === 'object' && busyAddress !== null);
  const launch = await standInLaunch(port);
  t.after(async () => {
    killAll([launch.pid, launch.child]);
    forceDown();
    await release([busy]);
  });
  // The wrapper exits; its child keeps serving, as an orphaned grandchild does.
  writeState(standInState('test-stale', launch.tree, port));
  process.kill(launch.pid);
  await waitGone(launch.pid);

  const survived = controlWith(
    { ...process.env, CONTROL_STOP_ROUNDS: '0' },
    'up',
    `--port=${String(busyAddress.port)}`,
  );
  assert.equal(survived.code, 2, JSON.stringify(survived.result));
  assert.match(
    survived.result.message ?? '',
    /still runs after the last round; state kept at .*; run down again$/,
  );
  assert.ok(existsSync(stateFile), 'up removed the state file');
  assert.ok(alive(launch.child), 'a zero-round stop stopped the child');

  // A busy --port refuses the launch, after the stale record was handled.
  const { code, result } = control('up', `--port=${String(busyAddress.port)}`);
  assert.equal(code, 2, JSON.stringify(result));
  assert.match(result.message ?? '', /\(--port\) held by PID/);
  assert.equal(existsSync(stateFile), false, 'up kept the stale state file');
  await waitGone(launch.child);
});

test('up does not record a root found outside the spawn window, and stops its tree', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const port = await freePort();
  t.after(forceDown);

  const { code, result } = controlWith(
    { ...process.env, CONTROL_SPAWN_WINDOW_SHIFT_MS: '60000' },
    'up',
    `--port=${String(port)}`,
  );
  assert.equal(code, 1, JSON.stringify(result));
  assert.match(result.message ?? '', /did not appear in the process table/);
  assert.equal(result.launchStopped, true);
  assert.equal(existsSync(stateFile), false, 'up kept a state file');
  const ids = [...(result.stoppedPids ?? []), ...(result.gonePids ?? [])];
  assert.ok(ids.length > 0, 'up stopped no recorded process');
  await new Promise((done) => setTimeout(done, 2000));
  assert.deepEqual(ids.filter(alive), [], 'a process of the launch still runs');
  assert.equal(listening(port), false, `something listens on ${port}`);
});

test('up stops the recorded tree when the server exits before it is ready', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const port = await freePort();
  t.after(() => {
    if (existsSync(stateFile)) {
      control('down');
    }

    forceDown();
  });

  const pending = controlAsync('up', `--port=${String(port)}`);

  for (
    let waited = 0;
    !existsSync(stateFile) && waited < 30000;
    waited += 100
  ) {
    await new Promise((done) => setTimeout(done, 100));
  }

  assert.ok(existsSync(stateFile), 'up wrote no state file');
  // Long enough for up to record the root's first children.
  await new Promise((done) => setTimeout(done, 5000));
  const [rootRecord] = recordsIn(readState()['tree']);
  assert.ok(rootRecord);
  process.kill(rootRecord.pid);

  const { code, result } = await pending;
  assert.equal(code, 1, JSON.stringify(result));
  assert.match(
    result.message ?? '',
    /^server exited with code .* before ready/,
  );
  const tree = recordsIn(result.tree ?? readState()['tree']);
  assert.ok(tree.length > 1, JSON.stringify(tree));
  await new Promise((done) => setTimeout(done, 1000));

  for (const record of tree) {
    assert.equal(
      processTable().some(
        (row) => row.pid === record.pid && row.start === record.start,
      ),
      false,
      `pid ${String(record.pid)} of the recorded tree still runs`,
    );
  }

  assert.equal(existsSync(stateFile), false, 'up kept the state file');
});

test('up --port fails when another process listens beside the launch on its port', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const port = await freePort();
  // http-server takes the next free port when any address of its port is busy
  // as it starts, so this listener takes 127.0.0.1 only once the launch's own
  // server listens on ::1; fetch reaches 127.0.0.1 first, so up's ready check
  // meets both.
  const other = createHttpServer((request, response) => {
    if ((request.url ?? '').startsWith('/index.json')) {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ entries: { 'card--stretched-link': {} } }));

      return;
    }

    response.writeHead(404);
    response.end('not this app');
  });
  t.after(async () => {
    if (existsSync(stateFile)) {
      control('down');
    }

    forceDown();

    if (other.listening) {
      await new Promise((done) => other.close(done));
    }
  });

  const pending = controlAsync('up', `--port=${String(port)}`);

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
    !(await answersOn('::1', port)) && waited < 240000;
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
    result.message ?? '',
    new RegExp(
      `^port ${String(port)} answers but pid ${String(process.pid)} is not in the started tree; run down`,
    ),
  );
  const down = control('down');
  assert.equal(down.code, 1, JSON.stringify(down.result));
});

test('up names the server and down when a listener query fails after the launch', async (t) => {
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
    result.message ?? '',
    new RegExp(
      `^refused: listener query on ${String(port)} gave no answer in 1 ms; the server \\(pid \\d+\\) may still run: run down$`,
    ),
  );
  assert.ok(existsSync(stateFile), 'up removed the state file');
  const down = control('down');
  assert.equal(down.code, 0, JSON.stringify(down.result));
  assert.equal(listening(port), false, `something listens on ${port}`);
});

test('up keeps the state file and says run down when the launch it stops outlasts the last round', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  // Another process answers the slot's port after up checked it, while the
  // nx root still runs, so up stops the launch; a zero-round stop leaves it.
  const other = createHttpServer((request, response) => {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(
      (request.url ?? '').startsWith('/index.json')
        ? JSON.stringify({ entries: { 'card--stretched-link': {} } })
        : '{}',
    );
  });
  t.after(async () => {
    if (other.listening) {
      await new Promise((done) => other.close(done));
    }

    if (existsSync(stateFile)) {
      control('down');
    }

    forceDown();
  });

  if (listening(ownPort)) {
    t.skip(`something else listens on ${String(ownPort)}`);

    return;
  }

  const child = spawn(process.execPath, [script, 'up', '--json'], {
    cwd: root,
    env: { ...process.env, CONTROL_STOP_ROUNDS: '0' },
    windowsHide: true,
  });
  let stdout = '';
  child.stdout.on('data', (chunk) => {
    stdout += String(chunk);
  });
  const closed = new Promise((done) => child.on('close', done));

  for (
    let waited = 0;
    !existsSync(stateFile) && waited < 30000;
    waited += 100
  ) {
    await new Promise((done) => setTimeout(done, 100));
  }

  assert.ok(existsSync(stateFile), 'up wrote no state file');
  await new Promise((done) => other.listen(ownPort, () => done(undefined)));
  const code = await closed;
  /** @type {ControlResult} */
  const result = JSON.parse(stdout);
  assert.equal(code, 1, stdout);
  assert.match(
    result.message ?? '',
    new RegExp(
      `^another process took port ${String(ownPort)}; .* still runs after the last round; state kept at .*; run down$`,
    ),
  );
  assert.ok(existsSync(stateFile), 'up removed the state file');
  await new Promise((done) => other.close(done));
  const down = control('down');
  assert.equal(down.code, 0, JSON.stringify(down.result));
});

test('a static launch that falls back from a busy port', async (t) => {
  /** @type {import('node:net').Server | null} */
  let busy = null;

  t.before(async () => {
    assert.equal(
      existsSync(stateFile),
      false,
      `${stateFile} exists; run down before this test`,
    );
    busy = await occupy(ownPort);
    const { code, result } = control('up');
    await release([busy]);
    assert.equal(code, 0, JSON.stringify(result));
    assert.ok(isLaunch(result), JSON.stringify(result));
    launch = result;
  });

  t.after(ensureDown);

  await t.test('up records the slot it moved to and why', (st) => {
    if (busy === null) {
      st.skip(`something else listened on ${String(ownPort)}`);

      return;
    }

    const next = started().port;
    assert.notEqual(next, ownPort);
    assert.ok(staticPorts.includes(next), String(next));
    const { result } = control('info');
    assert.deepEqual(result.ports, [
      {
        name: 'static',
        port: next,
        kind: 'derived',
        reason: `fell back from ${String(ownPort)}: held by PID ${String(process.pid)}`,
      },
    ]);
    assert.equal(
      started().session,
      `control-ngx-yeti-storybook-${checkoutId}-static`,
    );
  });

  await t.test('up records the tree root first', () => {
    const run = started();
    assert.equal(run.tree[0]?.pid, run.pid);
    assert.ok(run.tree.length > 1, JSON.stringify(run.tree));
  });

  await t.test('doctor passes right after up', () => {
    const { code, result } = control('doctor');
    assert.equal(code, 0, JSON.stringify(result.checks));
    const ports = result.checks?.find(({ name }) => name === 'ports');
    assert.equal(ports?.status, 'pass', ports?.detail);
    assert.match(
      ports?.detail ?? '',
      new RegExp(`^static ${String(started().port)} \\(derived`),
    );
  });

  await t.test(
    'doctor fails ports when a recorded port is not listening',
    async () => {
      const state = readState();
      const port = await freePort();
      writeState({
        ...state,
        ports: [{ name: 'static', port, kind: 'derived' }],
      });

      try {
        const { code, result } = control('doctor');
        assert.equal(code, 1, JSON.stringify(result.checks));
        const ports = result.checks?.find(({ name }) => name === 'ports');
        assert.equal(ports?.status, 'fail');
        assert.equal(ports?.detail, `static ${String(port)} not listening`);
      } finally {
        writeState(state);
      }
    },
  );

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

      try {
        writeState({ ...state, startedAt: 'not a time' });
        const { result } = control('doctor');
        const noLaunch = result.checks?.find(
          ({ name }) => name === 'build matches checkout',
        );
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
    'doctor fails ports when a process outside the tree holds a recorded port',
    async () => {
      const state = readState();
      const server = createServer();
      await new Promise((done) => server.listen(0, () => done(undefined)));
      const address = server.address();
      assert.ok(address !== null && typeof address === 'object');
      writeState({
        ...state,
        ports: [{ name: 'static', port: address.port, kind: 'derived' }],
      });

      try {
        const { code, result } = control('doctor');
        assert.equal(code, 1, JSON.stringify(result.checks));
        const ports = result.checks?.find(({ name }) => name === 'ports');
        assert.equal(ports?.status, 'fail');
        assert.equal(
          ports?.detail,
          `static ${String(address.port)} held by PID ${String(process.pid)}, not the recorded tree`,
        );
      } finally {
        writeState(state);
        await new Promise((done) => server.close(done));
      }
    },
  );

  await t.test(
    'down reports the session, frees the port and stops the tree',
    () => {
      openSession(started());
      const { code, result } = control('down');
      assert.equal(code, 0, JSON.stringify(result));
      assert.equal(
        result.sessionClose?.outcome,
        'closed',
        JSON.stringify(result.sessionClose),
      );
      assert.equal(existsSync(stateFile), false);
      assert.equal(alive(started().pid), false);
      assert.equal(listening(started().port), false);

      for (const record of started().tree) {
        assert.equal(
          processTable().some(
            (row) => row.pid === record.pid && row.start === record.start,
          ),
          false,
          `pid ${String(record.pid)} of the recorded tree still runs`,
        );
      }
    },
  );
});

test('up moves to the next slot when another process takes its port after the check, and down closes the session after the server died on its own', async (t) => {
  assert.equal(existsSync(stateFile), false, `${stateFile} exists`);
  const other = createHttpServer((request, response) => {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(
      (request.url ?? '').startsWith('/index.json')
        ? JSON.stringify({ entries: { 'card--stretched-link': {} } })
        : '{}',
    );
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

  const pending = controlAsync('up');

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
  await new Promise((done) => other.close(done));
  assert.equal(code, 0, JSON.stringify(result));
  // Nothing of the launch up gave up on is left holding the port.
  assert.equal(
    listening(ownPort),
    false,
    `a process still listens on ${String(ownPort)}`,
  );
  assert.equal(
    result.ports?.[0]?.reason,
    `fell back from ${String(ownPort)}: held by PID ${String(process.pid)}`,
  );
  assert.ok(isLaunch(result), JSON.stringify(result));
  assert.notEqual(result.port, ownPort);
  const run = result;

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
  assert.equal(down.result.portFree, true);
  assert.equal(existsSync(stateFile), false);
  assert.equal(listening(run.port), false);
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
