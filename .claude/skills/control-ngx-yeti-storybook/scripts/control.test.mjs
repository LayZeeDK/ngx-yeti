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
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
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

let launch = null;

function control(...args) {
  const run = spawnSync(process.execPath, [script, ...args, '--json'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 20 * 60 * 1000,
    windowsHide: true,
  });

  assert.ok(run.stdout, `control.mjs ${args.join(' ')}: ${run.stderr}`);

  return { code: run.status, result: JSON.parse(run.stdout) };
}

const readState = () => JSON.parse(readFileSync(stateFile, 'utf8'));
const writeState = (state) =>
  writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);

function pwsh(command) {
  const run = spawnSync(
    'pwsh',
    ['-NoProfile', '-NonInteractive', '-Command', command],
    { encoding: 'utf8', windowsHide: true },
  );
  assert.equal(run.status, 0, run.stderr);

  return run.stdout;
}

const listening = (port) =>
  pwsh(
    `Get-NetTCPConnection -State Listen -LocalPort ${String(port)} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess; exit 0`,
  ).trim() !== '';

function daemonRunning() {
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
    assert.match(result.message, new RegExp(`unknown argument ${args[1]}`));
  }

  assert.equal(existsSync(stateFile), false, 'a refused up wrote state');
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
      const fresh = result.checks.find(
        ({ name }) => name === 'build matches checkout',
      );
      assert.equal(fresh.status, 'fail', fresh.detail);
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
      assert.ok(alive(launch.pid), 'down stopped the launch');
    } finally {
      writeState(state);
    }
  });

  await t.test(
    'down reports the session, frees the port and stops the daemon',
    () => {
      const { code, result } = control('down');
      assert.equal(code, 0, JSON.stringify(result));
      assert.ok(
        ['closed', 'not-open', 'absent'].includes(result.sessionClose.outcome),
        JSON.stringify(result.sessionClose),
      );
      assert.equal(result.daemon.stopped, true);
      assert.equal(existsSync(stateFile), false);
      assert.equal(alive(launch.pid), false);
      assert.equal(listening(launch.port), false);
      assert.equal(daemonRunning(), false, 'the Nx daemon is still running');
    },
  );
});
