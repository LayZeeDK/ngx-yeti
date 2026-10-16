#!/usr/bin/env node
// @ts-check
/// <reference path="./storybook-preview.d.ts" />
// Launch, health-check, describe and stop the ngx-yeti Storybook for agents.
// Usage: node .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs
//   <up|doctor|info|down> [--dev] [--url=<origin>] [--json]
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { connect } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mapFresh } from './fingerprint.mjs';

const NAME = 'control-ngx-yeti-storybook';
const SKILL_DIR = fileURLToPath(new URL('..', import.meta.url));
const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../..',
);
const SCRATCH = path.join(ROOT, 'tmp', NAME);
const KNOWN_STORY = 'card--stretched-link';
const READY_TIMEOUT_MS = 600_000;
const IS_WINDOWS = process.platform === 'win32';

// Ports documented in packages/ngx-yeti/project.json; a worktree derives its
// own pair from its path so it never drives the main checkout's servers.
const FLOWS = {
  dev: { target: 'storybook', mainPort: 4400, offset: 0 },
  static: { target: 'static-storybook', mainPort: 4401, offset: 1 },
};
const DERIVED_BASE = 4420;
const DERIVED_SLOTS = 100;

const args = process.argv.slice(2);
const [command, ...extra] = args.filter((arg) => !arg.startsWith('--'));
const json = args.includes('--json');
const flowName = args.includes('--dev') ? 'dev' : 'static';
const urlArg = args.find((arg) => arg.startsWith('--url='))?.slice(6);
const flow = FLOWS[flowName];
// Only the flags the skill names, in their written form: a mistyped flag or a
// value after a space must not fall back to the recorded instance. Only
// doctor reads --url, so on another command it would act on the recorded
// instance while the caller named a different one.
const unknown = [
  ...args.filter(
    (arg) =>
      arg.startsWith('--') &&
      !['--dev', '--json'].includes(arg) &&
      !(command === 'doctor' && /^--url=./.test(arg)),
  ),
  ...extra,
];
const SESSION_NAME = /^[\w-]+$/;

const isWorktree = existsSync(path.join(ROOT, '.git'))
  ? statSync(path.join(ROOT, '.git')).isFile()
  : false;

function derivedPort() {
  if (!isWorktree) {
    return flow.mainPort;
  }

  const hash = createHash('sha1').update(ROOT.toLowerCase()).digest();
  const slot = hash.readUInt32BE(0) % DERIVED_SLOTS;

  return DERIVED_BASE + slot * 2 + flow.offset;
}

const port = derivedPort();
const statePath = path.join(SCRATCH, `state-${flowName}.json`);
const session = `${NAME}-${flowName}-${String(port)}`;

/**
 * @typedef {object} Check
 * @property {string} name
 * @property {'pass' | 'fail' | 'skipped' | 'warn'} status
 * @property {string} detail
 */

/**
 * @typedef {{ message?: string, checks?: Check[] } & Record<string, unknown>} Result
 */

/**
 * The fields of the state file this script reads back; `up` writes more.
 *
 * @typedef {object} State
 * @property {string} session
 * @property {number} pid
 * @property {number} port
 * @property {string} url
 * @property {string} target
 * @property {string} log
 * @property {unknown} [startTime]
 * @property {unknown} [startedAt]
 * @property {unknown} [evidenceDir]
 */

/**
 * @param {number} code
 * @param {Result} result
 * @returns {never}
 */
function finish(code, result) {
  const payload = { command, flow: flowName, exitCode: code, ...result };

  if (json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else {
    const marker = code === 0 ? '[OK]' : '[ERROR]';
    process.stdout.write(`${marker} ${command}: ${result.message ?? ''}\n`);

    for (const check of result.checks ?? []) {
      const tag = {
        pass: '[OK]',
        fail: '[ERROR]',
        skipped: '[SKIP]',
        warn: '[WARN]',
      }[check.status];
      process.stdout.write(`  ${tag} ${check.name}: ${check.detail}\n`);
    }

    for (const [key, value] of Object.entries(result)) {
      if (!['message', 'checks'].includes(key)) {
        process.stdout.write(`  ${key}: ${JSON.stringify(value)}\n`);
      }
    }
  }

  process.exit(code);
}

// The recorded session, PID and port reach commands, so a state file that
// holds anything else is refused before any of them runs.
/**
 * @param {unknown} value
 * @returns {value is State}
 */
function isState(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'session' in value &&
    typeof value.session === 'string' &&
    SESSION_NAME.test(value.session) &&
    'pid' in value &&
    typeof value.pid === 'number' &&
    Number.isInteger(value.pid) &&
    value.pid > 0 &&
    'port' in value &&
    typeof value.port === 'number' &&
    Number.isInteger(value.port) &&
    value.port > 0 &&
    value.port <= 65535 &&
    'url' in value &&
    typeof value.url === 'string' &&
    'target' in value &&
    typeof value.target === 'string' &&
    'log' in value &&
    typeof value.log === 'string'
  );
}

/**
 * @param {string} text
 * @returns {unknown}
 */
function parseJson(text) {
  return JSON.parse(text);
}

function readState() {
  if (!existsSync(statePath)) {
    return null;
  }

  /** @type {unknown} */
  let state;

  try {
    state = parseJson(readFileSync(statePath, 'utf8'));
  } catch (error) {
    finish(2, {
      message: `refused: ${statePath} could not be read as JSON (${String(error)}); nothing was run`,
      statePath,
    });
  }

  if (!isState(state)) {
    finish(2, {
      message: `refused: ${statePath} records a session outside [\\w-], a PID that is not a positive integer, an invalid port, or a url, target or log that is not a string; nothing was run`,
      statePath,
    });
  }

  return state;
}

// A reader sees the old file or the new one, never a partial write.
/** @param {Record<string, unknown>} state */
function writeState(state) {
  const temporary = `${statePath}.${String(process.pid)}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`);
  renameSync(temporary, statePath);
}

// The shim's own script under this Node: the session name never passes
// through a shell.
function playwrightCli() {
  // npm puts the package beside its Windows shim, and in ../lib elsewhere.
  const modules = IS_WINDOWS ? ['node_modules'] : ['..', 'lib', 'node_modules'];

  for (const dir of (process.env['PATH'] ?? '').split(path.delimiter)) {
    const entry = path.join(
      dir,
      ...modules,
      '@playwright',
      'cli',
      'playwright-cli.js',
    );

    if (dir && existsSync(entry)) {
      return entry;
    }
  }

  return null;
}

/**
 * `left-open`: no playwright-cli on PATH, and its registry lists the session
 * as open or holds an entry for it that could not be read.
 *
 * @typedef {'closed' | 'not-open' | 'absent' | 'left-open' | 'timeout' | 'failed'} SessionOutcome
 */

/**
 * @typedef {object} SessionClose
 * @property {string} session
 * @property {SessionOutcome} outcome
 * @property {string} detail
 */

/**
 * @param {SessionOutcome} outcome
 * @returns {boolean} whether the session may still be open after `down`
 */
function sessionLeftOpen(outcome) {
  return (
    outcome === 'left-open' || outcome === 'timeout' || outcome === 'failed'
  );
}

// playwright-cli's own registry, which its `list` reads: a session is open
// while the socket in its `<name>.session` file answers. The tests point
// CONTROL_SESSION_REGISTRY at a folder of their own.
function sessionRegistry() {
  const home = os.homedir();
  const cache = IS_WINDOWS
    ? (process.env['LOCALAPPDATA'] ?? path.join(home, 'AppData', 'Local'))
    : process.platform === 'darwin'
      ? path.join(home, 'Library', 'Caches')
      : (process.env['XDG_CACHE_HOME'] ?? path.join(home, '.cache'));

  return (
    process.env['CONTROL_SESSION_REGISTRY'] ??
    path.join(cache, 'ms-playwright', 'daemon')
  );
}

/**
 * @param {string} name
 * @returns {Promise<string | null>} why the session counts as open, or null
 */
async function registryOpenReason(name) {
  const base = sessionRegistry();

  if (!existsSync(base)) {
    return null;
  }

  /** @type {string[]} */
  let dirs;

  try {
    dirs = readdirSync(base);
  } catch (error) {
    return `${base} could not be read (${String(error)}), so the session may be open`;
  }

  for (const dir of dirs) {
    const file = path.join(base, dir, `${name}.session`);

    if (!existsSync(file)) {
      continue;
    }

    let config = null;

    try {
      config = parseJson(readFileSync(file, 'utf8'));
    } catch (error) {
      return `${file} could not be read (${String(error)}), so the session may be open`;
    }

    const socketPath =
      typeof config === 'object' && config !== null && 'socketPath' in config
        ? config.socketPath
        : undefined;

    if (typeof socketPath !== 'string') {
      return `${file} holds no socketPath string, so the session may be open`;
    }

    if (await answers({ path: socketPath })) {
      return `the session is listed as open in ${file}`;
    }
  }

  return null;
}

/**
 * @param {string} name
 * @returns {Promise<SessionClose>}
 */
async function closeSession(name) {
  const entry = playwrightCli();

  if (entry === null) {
    const open = await registryOpenReason(name);

    return open === null
      ? {
          session: name,
          outcome: 'absent',
          detail: 'no playwright-cli on PATH',
        }
      : {
          session: name,
          outcome: 'left-open',
          detail: `no playwright-cli on PATH, and ${open}`,
        };
  }

  const run = spawnSync(process.execPath, [entry, `-s=${name}`, 'close'], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 30_000,
    windowsHide: true,
  });
  const output = `${run.stdout ?? ''}${run.stderr ?? ''}`.trim();

  if (
    run.error !== undefined &&
    'code' in run.error &&
    run.error.code === 'ETIMEDOUT'
  ) {
    return {
      session: name,
      outcome: 'timeout',
      detail: 'no answer within 30 s',
    };
  }

  if (run.error !== undefined || run.status !== 0) {
    return {
      session: name,
      outcome: 'failed',
      detail: `exit ${String(run.status)}: ${output || String(run.error)}`,
    };
  }

  // playwright-cli exits 0 whether or not the session was open.
  return {
    session: name,
    outcome: output.includes('is not open') ? 'not-open' : 'closed',
    detail: output,
  };
}

function stopDaemon() {
  const run = spawnSync(
    process.execPath,
    [
      path.join(ROOT, 'node_modules', 'nx', 'dist', 'bin', 'nx.js'),
      'daemon',
      '--stop',
    ],
    { cwd: ROOT, encoding: 'utf8', timeout: 60_000, windowsHide: true },
  );

  return run.status === 0
    ? { stopped: true }
    : {
        stopped: false,
        detail: `exit ${String(run.status)}: ${`${run.stdout ?? ''}${run.stderr ?? ''}`.trim() || String(run.error)}`,
      };
}

// One snapshot of every process: pid, parent pid, start time, command line.
function processTable() {
  if (IS_WINDOWS) {
    const script =
      "Get-CimInstance Win32_Process | ForEach-Object { '{0}|{1}|{2}|{3}' -f $_.ProcessId, $_.ParentProcessId, $(if ($_.CreationDate) { $_.CreationDate.ToUniversalTime().ToString('o') } else { '' }), $_.CommandLine }";
    const out = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true },
    );

    return out
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const [pid, ppid, start, ...rest] = line.split('|');

        return {
          pid: Number(pid),
          ppid: Number(ppid),
          start,
          cmd: rest.join('|'),
        };
      });
  }

  const out = execFileSync('ps', ['-A', '-o', 'pid=,ppid=,lstart=,args='], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });

  return out
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const parts = line.trim().split(/\s+/);

      return {
        pid: Number(parts[0]),
        ppid: Number(parts[1]),
        start: parts.slice(2, 7).join(' '),
        cmd: parts.slice(7).join(' '),
      };
    });
}

/**
 * @param {ReturnType<typeof processTable>} table
 * @param {number} pid
 */
function descendants(table, pid) {
  const tree = new Set([pid]);
  let grew = true;

  while (grew) {
    grew = false;

    for (const proc of table) {
      if (tree.has(proc.ppid) && !tree.has(proc.pid)) {
        tree.add(proc.pid);
        grew = true;
      }
    }
  }

  return tree;
}

// The tests set CONTROL_LISTENER_TIMEOUT_MS to make the query time out;
// nothing else sets it.
const LISTENER_TIMEOUT_MS =
  Number(process.env['CONTROL_LISTENER_TIMEOUT_MS']) || 30_000;

// Only Get-NetTCPConnection's own no-match error, or lsof's silent exit 1,
// means no listener; every other failure keeps its error.
/**
 * @param {number} listenPort
 * @returns {{ pids: number[], error: null } | { pids: null, error: string }}
 */
function listeningPids(listenPort) {
  const run = IS_WINDOWS
    ? spawnSync(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          `try { Get-NetTCPConnection -State Listen -LocalPort ${String(listenPort)} -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess } catch { if ($_.CategoryInfo.Category -eq 'ObjectNotFound' -and $_.CategoryInfo.Activity -eq 'Get-NetTCPConnection') { exit 0 }; [Console]::Error.WriteLine($_); exit 1 }`,
        ],
        { encoding: 'utf8', timeout: LISTENER_TIMEOUT_MS, windowsHide: true },
      )
    : spawnSync(
        'lsof',
        ['-nP', `-iTCP:${String(listenPort)}`, '-sTCP:LISTEN', '-t'],
        { encoding: 'utf8', timeout: LISTENER_TIMEOUT_MS },
      );
  const stdout = run.stdout ?? '';
  const stderr = (run.stderr ?? '').trim();
  const noMatch =
    !IS_WINDOWS && run.status === 1 && stdout === '' && stderr === '';

  if (run.status !== 0 && !noMatch) {
    const timedOut =
      run.error !== undefined &&
      'code' in run.error &&
      run.error.code === 'ETIMEDOUT';

    return {
      pids: null,
      error: timedOut
        ? `listener query on ${String(listenPort)} gave no answer in ${String(LISTENER_TIMEOUT_MS)} ms`
        : `listener query on ${String(listenPort)} failed: ${stderr || String(run.error)}`,
    };
  }

  return {
    pids: [...new Set(stdout.split(/\r?\n/).filter(Boolean).map(Number))],
    error: null,
  };
}

/** @param {ReturnType<typeof listeningPids>} query */
const listenersText = (query) =>
  query.pids === null ? query.error : `listeners ${JSON.stringify(query.pids)}`;

/**
 * @param {number} listenPort
 * @returns {Promise<boolean>}
 */
function portAnswers(listenPort) {
  return answers({ host: 'localhost', port: listenPort });
}

/**
 * @param {import('node:net').NetConnectOpts} target
 * @returns {Promise<boolean>}
 */
function answers(target) {
  return new Promise((resolve) => {
    const socket = connect(target);
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(false));
  });
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** @param {string} origin */
async function indexHasStory(origin) {
  try {
    const response = await fetch(`${origin}/index.json`);

    if (!response.ok) {
      return false;
    }

    const index = parseJson(await response.text());
    const entries =
      typeof index === 'object' && index !== null && 'entries' in index
        ? index.entries
        : undefined;

    return (
      typeof entries === 'object' && entries !== null && KNOWN_STORY in entries
    );
  } catch {
    return false;
  }
}

// Opens the known story with embed=true (no play function) in the repo's own
// Playwright Chromium and reports whether it rendered without console errors.
/** @param {string} origin */
async function renderCheck(origin) {
  /** @type {typeof import('playwright')} */
  const { chromium } = await import(
    pathToFileURL(path.join(ROOT, 'node_modules', 'playwright', 'index.mjs'))
      .href
  );
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    /** @type {string[]} */
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().includes('favicon')) {
        errors.push(message.text());
      }
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${origin}/iframe.html?id=${KNOWN_STORY}&viewMode=story&embed=true`,
    );
    await page.waitForFunction(
      () =>
        ['finished', 'errored', 'aborted'].includes(
          globalThis.__STORYBOOK_PREVIEW__?.currentRender?.phase ?? '',
        ),
      undefined,
      { timeout: 60_000 },
    );
    const phase = await page.evaluate(
      () => globalThis.__STORYBOOK_PREVIEW__?.currentRender?.phase,
    );
    const errorDisplay =
      (await page.locator('body.sb-show-errordisplay').count()) > 0;
    const rootChildren = await page.locator('#storybook-root > *').count();

    return { phase, errorDisplay, rootChildren, consoleErrors: errors };
  } finally {
    await browser.close();
  }
}

// What the static build reads: the stories, the shared story helpers and Yeti.
const SOURCE_DIRS = [
  'packages/ngx-yeti',
  'packages/ngx-yeti-testing',
  'vendor/yeti',
];

// Git's tracked and untracked files under SOURCE_DIRS, not the ignored ones:
// test output such as .vitest-attachments is not a source of the build.
/** @returns {{ file: string | null, mtimeMs: number }} */
function newestSource() {
  const listed = execFileSync(
    'git',
    ['ls-files', '-co', '--exclude-standard', '-z', '--', ...SOURCE_DIRS],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
  );
  /** @type {{ file: string | null, mtimeMs: number }} */
  let newest = { file: null, mtimeMs: 0 };

  for (const file of listed.split('\0')) {
    const stat =
      file === ''
        ? undefined
        : statSync(path.join(ROOT, file), { throwIfNoEntry: false });

    if (stat !== undefined && stat.mtimeMs > newest.mtimeMs) {
      newest = { file, mtimeMs: stat.mtimeMs };
    }
  }

  return newest;
}

/** @param {string} file */
function tail(file, lines = 20) {
  if (!existsSync(file)) {
    return [];
  }

  return readFileSync(file, 'utf8')
    .replace(/\x1b\[[0-9;]*m/g, '')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .slice(-lines);
}

// A backstop: the derived range never holds a main checkout port.
function refuseMainPort() {
  const mainPorts = Object.values(FLOWS).map((f) => f.mainPort);

  if (isWorktree && mainPorts.includes(port)) {
    finish(2, {
      message: `refused: ${String(port)} is the main checkout's Storybook port`,
    });
  }
}

// Set once `up` has spawned the server, so an exception after it names the
// cleanup.
/** @type {number | undefined} */
let launchedPid;

async function up() {
  refuseMainPort();
  const existing = readState();

  if (existing !== null) {
    const alive = processTable().some((proc) => proc.pid === existing.pid);

    if (alive) {
      finish(2, {
        message: `refused: already up (pid ${String(existing.pid)}, ${existing.url}); run down first`,
      });
    }

    rmSync(statePath);
  }

  if (await portAnswers(port)) {
    const query = listeningPids(port);
    finish(2, {
      message: `refused: port ${String(port)} is in use (${listenersText(query)})`,
      owner: query.pids,
    });
  }

  const runId = `${flowName}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const evidenceDir = path.join(SCRATCH, runId);
  mkdirSync(evidenceDir, { recursive: true });
  const logPath = path.join(evidenceDir, 'server.log');
  const log = openSync(logPath, 'w');
  const nxBin = path.join(ROOT, 'node_modules', 'nx', 'dist', 'bin', 'nx.js');
  const argv = [
    nxBin,
    'run',
    `ngx-yeti:${flow.target}`,
    `--port=${String(port)}`,
  ];
  const started = Date.now();
  const child = spawn(process.execPath, argv, {
    cwd: ROOT,
    detached: true,
    windowsHide: true,
    stdio: ['ignore', log, log],
    env: {
      ...process.env,
      NX_TUI: 'false',
      NX_NO_CLOUD: 'true',
    },
  });
  child.unref();
  launchedPid = child.pid;
  closeSync(log);
  /** @type {number | null} */
  let exited = null;
  child.once('exit', (code) => {
    exited = code;
  });

  const live = processTable().find((proc) => proc.pid === child.pid);
  const url = `http://localhost:${String(port)}`;
  const state = {
    pid: child.pid,
    port,
    url,
    flow: flowName,
    target: `ngx-yeti:${flow.target}`,
    session,
    startTime: live?.start ?? null,
    launchCommand: live?.cmd ?? [process.execPath, ...argv].join(' '),
    startedAt: new Date(started).toISOString(),
    evidenceDir,
    log: logPath,
  };
  writeState(state);

  while (Date.now() - started < READY_TIMEOUT_MS) {
    if (exited !== null) {
      finish(1, {
        message: `server exited with code ${String(exited)} before ready`,
        log: logPath,
        logTail: tail(logPath),
      });
    }

    if (await indexHasStory(url)) {
      const render = await renderCheck(url);

      if (render.phase === 'finished' && !render.errorDisplay) {
        finish(0, {
          message: `ready at ${url}`,
          ...state,
          readyMs: Date.now() - started,
        });
      }

      finish(1, {
        message: `${KNOWN_STORY} did not render`,
        render,
        ...state,
      });
    }

    await sleep(2000);
  }

  finish(1, {
    message: `not ready after ${String(READY_TIMEOUT_MS)} ms; run down`,
    ...state,
    logTail: tail(logPath),
  });
}

async function doctor() {
  const state = readState();
  const origin = urlArg ?? state?.url;
  /** @type {Check[]} */
  const checks = [];
  /**
   * @param {string} name
   * @param {boolean} ok
   * @param {string} detail
   */
  const add = (name, ok, detail) =>
    checks.push({ name, status: ok ? 'pass' : 'fail', detail });
  /**
   * @param {string} name
   * @param {string} detail
   */
  const skip = (name, detail) =>
    checks.push({ name, status: 'skipped', detail });

  if (origin === undefined) {
    finish(2, { message: `no state file at ${statePath} and no --url` });
  }

  // Without --url the origin came from the state file, so the file exists.
  const recorded = urlArg === undefined ? state : null;

  if (recorded !== null) {
    refuseMainPort();
    const table = processTable();
    const live = table.find((proc) => proc.pid === recorded.pid);
    add(
      'process alive',
      live !== undefined && live.start === recorded.startTime,
      live === undefined
        ? `pid ${String(recorded.pid)} is not running`
        : `pid ${String(recorded.pid)} started ${live.start}`,
    );
    const query = listeningPids(recorded.port);
    const tree = descendants(table, recorded.pid);
    add(
      'port owned by run',
      query.pids !== null &&
        query.pids.length > 0 &&
        query.pids.every((pid) => tree.has(pid)),
      `port ${String(recorded.port)} ${listenersText(query)}`,
    );
  } else {
    skip('process alive', '--url names an instance this run did not start');
    skip('port owned by run', '--url names an instance this run did not start');
  }

  const hasStory = await indexHasStory(origin);
  add('index lists known story', hasStory, `${origin}/index.json`);

  if (hasStory) {
    const render = await renderCheck(origin);
    add(
      'known story renders',
      render.phase === 'finished' &&
        !render.errorDisplay &&
        render.rootChildren > 0,
      `${KNOWN_STORY} phase=${render.phase} rootChildren=${String(render.rootChildren)}`,
    );
    add(
      'no console errors',
      render.consoleErrors.length === 0,
      render.consoleErrors.length === 0
        ? 'none on first load'
        : render.consoleErrors.join(' | '),
    );
  } else {
    skip('known story renders', 'index check failed');
    skip('no console errors', 'index check failed');
  }

  if (recorded === null) {
    skip('build matches checkout', '--url instance');
  } else if (flowName === 'static') {
    // `up` runs build-storybook first, so the build matched the sources at
    // launch. A cache restore keeps the original build's file times, so the
    // sources are compared with the launch time, not with storybook-static.
    const built = tail(recorded.log, Infinity).some((line) =>
      line.includes('nx run ngx-yeti:build-storybook'),
    );
    const launchedAt =
      typeof recorded.startedAt === 'string'
        ? Date.parse(recorded.startedAt)
        : Number.NaN;
    /** @type {ReturnType<typeof newestSource> | string} */
    let newest;

    try {
      newest = newestSource();
    } catch (error) {
      newest = `git ls-files failed (${String(error)})`;
    }

    if (!built) {
      add(
        'build matches checkout',
        false,
        `no ngx-yeti:build-storybook run in ${recorded.log}`,
      );
    } else if (Number.isNaN(launchedAt)) {
      add(
        'build matches checkout',
        false,
        `the state file records no usable launch time (startedAt ${JSON.stringify(recorded.startedAt)}); run down and up`,
      );
    } else if (typeof newest === 'string') {
      add('build matches checkout', false, newest);
    } else {
      const fresh = newest.mtimeMs < launchedAt;
      const changed = `${String(newest.file)} changed at ${new Date(newest.mtimeMs).toISOString()}`;
      add(
        'build matches checkout',
        fresh,
        fresh
          ? `ngx-yeti:build-storybook ran at launch and no file Git lists under ${SOURCE_DIRS.join(', ')} changed since (newest: ${changed})`
          : `${changed}, after the launch at ${new Date(launchedAt).toISOString()}; run down and up`,
      );
    }
  } else {
    const errors = tail(recorded.log, 500).filter((line) =>
      /\b(ERROR|Error:)/.test(line),
    );
    add(
      'build matches checkout',
      errors.length === 0,
      errors.length === 0 ? 'server log has no errors' : errors.join(' | '),
    );
  }

  // A stale feature map does not make the instance unhealthy, so this line
  // is a warning at most and never changes the exit code.
  const fresh = mapFresh(SKILL_DIR);
  checks.push({
    name: 'map-fresh',
    status: fresh.status,
    detail: fresh.detail,
  });

  const healthy = checks.every((check) => check.status !== 'fail');
  finish(healthy ? 0 : 1, {
    message: healthy ? `healthy: ${origin}` : `not healthy: ${origin}`,
    url: origin,
    checks,
  });
}

function info() {
  const state = readState();

  if (state === null) {
    finish(2, {
      message: `no state file at ${statePath}`,
      port,
      session,
      worktree: isWorktree,
    });
  }

  finish(0, {
    message: state.url,
    worktree: isWorktree,
    statePath,
    ...state,
  });
}

async function down() {
  const state = readState();

  if (state === null) {
    finish(2, { message: `no state file at ${statePath}; nothing to stop` });
  }

  const table = processTable();
  const live = table.find((proc) => proc.pid === state.pid);

  if (live === undefined) {
    // A child of the dead root can outlive it and keep the port.
    const sessionClose = await closeSession(state.session);
    const { members, uncheckedPids } = treeMembers(
      table,
      state.pid,
      state.startTime,
    );
    const { survivors, portFree } = await awaitTeardown(members, state.port);
    endTeardown(
      state,
      sessionClose,
      `pid ${String(state.pid)} is not running; removed the state file`,
      { stoppedPids: [], survivors, portFree, uncheckedPids },
    );
  }

  if (live.start !== state.startTime) {
    finish(2, {
      message: `refused: pid ${String(state.pid)} start-time mismatch (recorded ${state.startTime}, live ${live.start})`,
    });
  }

  if (
    !live.cmd.includes(state.target) ||
    !live.cmd.includes(`--port=${String(state.port)}`)
  ) {
    finish(2, {
      message: `refused: pid ${String(state.pid)} command mismatch (live: ${live.cmd})`,
    });
  }

  const sessionClose = await closeSession(state.session);
  const { members, uncheckedPids } = treeMembers(
    table,
    state.pid,
    state.startTime,
  );

  if (IS_WINDOWS) {
    try {
      execFileSync('taskkill', ['/PID', String(state.pid), '/T', '/F'], {
        stdio: 'pipe',
        windowsHide: true,
      });
    } catch {
      // Members may already be gone; the check below decides.
    }
  } else {
    try {
      process.kill(-state.pid, 'SIGTERM');
    } catch {
      // The group may already be gone; the check below decides.
    }
  }

  const { survivors, portFree } = await awaitTeardown(members, state.port);
  /** @type {Teardown} */
  const teardown = {
    stoppedPids: members.map((member) => member.pid),
    survivors,
    portFree,
    uncheckedPids,
  };
  const { problems, toStop } = teardownProblems(state, teardown);

  if (problems.length > 0) {
    const daemon = stopDaemon();

    if (!daemon.stopped) {
      problems.push('nx daemon --stop failed');
    }

    // With the root gone, another down takes the dead-PID path, which stops
    // nothing.
    const next = survivors.includes(state.pid)
      ? 'run down again'
      : `pid ${String(state.pid)} is gone, so another down stops nothing; stop ${toStop.length > 0 ? `pid ${toStop.join(', ')}` : "the port's listener"} yourself`;
    finish(1, {
      message: `teardown incomplete: ${problems.join('; ')}; state kept at ${statePath}; ${next}`,
      ...teardown,
      port: state.port,
      sessionClose,
      daemon,
      statePath,
    });
  }

  endTeardown(
    state,
    sessionClose,
    `stopped pid ${String(state.pid)} and ${String(members.length - 1)} descendants`,
    teardown,
  );
}

/**
 * @typedef {object} Teardown
 * @property {number[]} stoppedPids
 * @property {number[]} survivors
 * @property {boolean} portFree
 * @property {number[]} uncheckedPids
 */

/**
 * The recorded PID's tree in one process table, without the processes that
 * started before the recorded root: Windows leaves a dead parent's PID on its
 * children and hands that PID out again, so the children of an earlier holder
 * match by parent PID alone. Each member keeps its start time, so a PID that
 * Windows hands out again after the snapshot is not taken for a survivor. A
 * process whose start time, or a root whose recorded start time, cannot be
 * read stays a member and is listed in `uncheckedPids`.
 *
 * @param {ReturnType<typeof processTable>} table
 * @param {number} pid
 * @param {unknown} rootStart
 */
function treeMembers(table, pid, rootStart) {
  const tree = descendants(table, pid);
  const since =
    typeof rootStart === 'string' ? Date.parse(rootStart) : Number.NaN;
  const inTree = table.filter((proc) => tree.has(proc.pid));

  return {
    members: inTree
      .filter((proc) => !(Date.parse(proc.start ?? '') < since))
      .map((proc) => ({ pid: proc.pid, start: proc.start })),
    uncheckedPids: inTree
      .filter(
        (proc) =>
          Number.isNaN(since) || Number.isNaN(Date.parse(proc.start ?? '')),
      )
      .map((proc) => proc.pid),
  };
}

/**
 * Waits up to 15 s until no member runs and the port stops answering.
 *
 * @param {ReturnType<typeof treeMembers>['members']} members
 * @param {number} listenPort
 */
async function awaitTeardown(members, listenPort) {
  const deadline = Date.now() + 15_000;

  for (;;) {
    const after = new Map(processTable().map((proc) => [proc.pid, proc]));
    const survivors = members
      .filter((member) => after.get(member.pid)?.start === member.start)
      .map((member) => member.pid);
    const portFree = !(await portAnswers(listenPort));

    if ((survivors.length === 0 && portFree) || Date.now() >= deadline) {
      return { survivors, portFree };
    }

    await sleep(500);
  }
}

/**
 * @param {State} state
 * @param {Teardown} teardown
 */
function teardownProblems(state, teardown) {
  const query = teardown.portFree ? null : listeningPids(state.port);

  return {
    problems: [
      ...(teardown.survivors.length > 0
        ? [`pid ${teardown.survivors.join(', ')} still running`]
        : []),
      ...(query === null
        ? []
        : [
            `port ${String(state.port)} still answers (${listenersText(query)})`,
          ]),
    ],
    toStop: [...new Set([...teardown.survivors, ...(query?.pids ?? [])])],
  };
}

/**
 * Removes the state file, stops the daemon and reports, on both the live and
 * the dead recorded PID path.
 *
 * @param {State} state
 * @param {SessionClose} sessionClose
 * @param {string} message
 * @param {Teardown} teardown
 * @returns {never}
 */
function endTeardown(state, sessionClose, message, teardown) {
  rmSync(statePath);
  const daemon = stopDaemon();
  const result = {
    ...teardown,
    port: state.port,
    session: state.session,
    sessionClose,
    daemon,
    evidenceDir: state.evidenceDir,
  };
  const problems = [
    ...teardownProblems(state, teardown).problems,
    ...(sessionLeftOpen(sessionClose.outcome)
      ? [
          `playwright-cli session ${state.session} ${sessionClose.outcome}; close it with playwright-cli -s=${state.session} close`,
        ]
      : []),
    ...(daemon.stopped ? [] : ['nx daemon --stop failed']),
  ];

  if (problems.length > 0) {
    finish(1, {
      message: `teardown incomplete: ${problems.join('; ')}`,
      ...result,
    });
  }

  finish(0, { message, ...result });
}

/** @type {Map<string, () => unknown>} */
const commands = new Map([
  ['up', up],
  ['doctor', doctor],
  ['info', info],
  ['down', down],
]);
const run = command === undefined ? undefined : commands.get(command);

if (unknown.length > 0) {
  finish(2, {
    message: `unknown argument ${unknown[0]}; flags are --dev, --json and --url=<origin>`,
  });
}

if (run === undefined) {
  finish(2, {
    message:
      'usage: control.mjs <up|doctor|info|down> [--dev] [--url=<origin>] [--json]',
  });
}

try {
  await run();
} catch (error) {
  const reason = error instanceof Error ? error.message : String(error);
  const cleanup =
    launchedPid === undefined
      ? ''
      : `; the server (pid ${String(launchedPid)}) may still run: ${existsSync(statePath) ? 'run down' : 'stop it yourself'}`;
  finish(2, { message: `could not run: ${reason}${cleanup}`, statePath });
}
