// @ts-check
// Drives control.mjs through one ssr launch with the Nx daemon on: the refused
// flags and planted state, doctor's build-fresh scan, down's kept state file
// and its daemon stop. Windows only, like control.mjs. Builds the Fixture app,
// so nothing else may build in this checkout while it runs.
// Run: node --test .claude/skills/control-yeti-app/scripts/control.test.mjs
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
import { dirname, join, resolve } from 'node:path';
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
 * @property {unknown} [survivors]
 * @property {unknown} [stateFile]
 * @property {{ outcome: string }[]} [sessions]
 * @property {{ stopped: boolean }} [daemon]
 */

/**
 * @typedef {object} Launch
 * @property {number} pid
 * @property {number} port
 * @property {string} session
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
  typeof result.session === 'string';

function started() {
  assert.ok(launch, 'up did not run');

  return launch;
}

/** @param {string[]} args */
function control(...args) {
  const run = spawnSync(process.execPath, [script, ...args, '--json'], {
    cwd: root,
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

/** @param {number} port */
const listening = (port) =>
  pwsh(
    `Get-NetTCPConnection -State Listen -LocalPort ${String(port)} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess; exit 0`,
  ).trim() !== '';

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
    'down exits 1 and keeps the file while the port is busy',
    async () => {
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
        (first.result.sessions ?? []).map(({ outcome }) =>
          ['closed', 'not-open', 'absent'].includes(outcome),
        ),
        [true, true],
        JSON.stringify(first.result.sessions),
      );

      const retry = control('down');
      assert.equal(retry.code, 1, JSON.stringify(retry.result));
      assert.ok(existsSync(stateFile), 'the retry removed the state file');

      await closeListener();
      const last = control('down');
      assert.equal(last.code, 0, JSON.stringify(last.result));
      assert.equal(last.result.daemon?.stopped, true);
      assert.equal(existsSync(stateFile), false);
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
