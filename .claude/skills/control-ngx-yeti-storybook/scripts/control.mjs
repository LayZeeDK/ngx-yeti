#!/usr/bin/env node
// @ts-check
/// <reference path="./storybook-preview.d.ts" />
// Launch, health-check, describe and stop the ngx-yeti Storybook for agents.
// Usage: node .claude/skills/control-ngx-yeti-storybook/scripts/control.mjs
//   <up|doctor|info|down> [--dev] [--port=<n>] [--url=<origin>] [--json]
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
import { mapFresh, printable } from './fingerprint.mjs';
import {
  describe,
  matches,
  merge,
  processTable,
  snapshot,
  stop,
} from './proctree.mjs';

/** @typedef {import('./proctree.mjs').ProcRecord} ProcRecord */

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

// The ports table of SKILL.md, "Pick a flow": each flow opens one port. Slot 0
// is the main checkout's, documented in packages/ngx-yeti/project.json; slot 1
// to 99 give `base + 2 * (slot - 1)`, within 4420-4619 and below
// control-yeti-app's range, so two skills' worktrees never derive the same
// port.
const FLOWS = {
  dev: { target: 'storybook', mainPort: 4400, base: 4420 },
  static: { target: 'static-storybook', mainPort: 4401, base: 4421 },
};
const MAIN_PORTS = Object.values(FLOWS).map((f) => f.mainPort);
const SLOTS = 100;
const SLOT_TRIES = 10;

const args = process.argv.slice(2);
const [command, ...extra] = args.filter((arg) => !arg.startsWith('--'));
const json = args.includes('--json');
const flowName = args.includes('--dev') ? 'dev' : 'static';
const urlArg = args.find((arg) => arg.startsWith('--url='))?.slice(6);
const portArg = args.find((arg) => arg.startsWith('--port='))?.slice(7);
const flow = FLOWS[flowName];
// Only the flags the skill names, in their written form: a mistyped flag or a
// value after a space must not fall back to the recorded instance. Only
// doctor reads --url, so on another command it would act on the recorded
// instance while the caller named a different one; only up reads --port.
const unknown = [
  ...args.filter(
    (arg) =>
      arg.startsWith('--') &&
      !['--dev', '--json'].includes(arg) &&
      !(command === 'doctor' && /^--url=./.test(arg)) &&
      !(command === 'up' && /^--port=./.test(arg)),
  ),
  ...extra,
];
const SESSION_NAME = /^[\w-]+$/;

const isWorktree = existsSync(path.join(ROOT, '.git'))
  ? statSync(path.join(ROOT, '.git')).isFile()
  : false;

// The checkout's own slot: 0 in the main checkout, else 1 to 99 from a hash of
// its path, so a worktree's usual port stays the same from run to run.
function slotOf() {
  if (!isWorktree) {
    return 0;
  }

  const hash = createHash('sha1').update(ROOT.toLowerCase()).digest();

  return 1 + (hash.readUInt32BE(0) % (SLOTS - 1));
}

/**
 * The slots `up` tries, in order: `first` and the next ones, SLOT_TRIES in
 * all. From a worktree they wrap within 1 to 99 and never reach slot 0.
 *
 * @param {number} first
 */
function slotOrder(first) {
  return Array.from({ length: SLOT_TRIES }, (_, i) =>
    first === 0 ? i : 1 + ((first - 1 + i) % (SLOTS - 1)),
  );
}

/** @param {number} slot */
const portAt = (slot) =>
  slot === 0 ? flow.mainPort : flow.base + 2 * (slot - 1);

// playwright-cli's session registry is machine-wide, so the session is named
// per checkout and flow, never per port: another checkout can take this
// checkout's port, but never its session.
const checkoutId = isWorktree
  ? `wt-${createHash('sha1').update(ROOT.toLowerCase()).digest('hex').slice(0, 8)}`
  : 'main';
const session = `${NAME}-${checkoutId}-${flowName}`;

const port = portAt(slotOf());
const statePath = path.join(SCRATCH, `state-${flowName}.json`);
// What `up` stopped of a stale state file's tree; every `up` result reports it.
/** @type {{ stoppedPids: number[], gonePids: number[], refused: { pid: number, reason: string, process: string }[] } | undefined} */
let staleStopped;

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
 * @property {PortEntry[]} ports
 * @property {[ProcRecord, ...ProcRecord[]]} tree  the recorded process tree, root first
 * @property {unknown} [startedAt]
 * @property {unknown} [evidenceDir]
 */

/**
 * One row of the ports table as this run uses it.
 *
 * @typedef {object} PortEntry
 * @property {string} name
 * @property {number} port
 * @property {'derived'} kind
 * @property {string} [reason]
 */

/**
 * @param {number} code
 * @param {Result} result
 * @returns {never}
 */
function finish(code, result) {
  const payload = {
    command,
    flow: flowName,
    exitCode: code,
    ...result,
    ...(staleStopped === undefined ? {} : { staleStopped }),
  };

  if (json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else {
    const marker = code === 0 ? '[OK]' : '[ERROR]';
    process.stdout.write(
      `${marker} ${command}: ${printable(result.message ?? '')}\n`,
    );

    for (const check of result.checks ?? []) {
      const tag = {
        pass: '[OK]',
        fail: '[ERROR]',
        skipped: '[SKIP]',
        warn: '[WARN]',
      }[check.status];
      process.stdout.write(
        `  ${tag} ${check.name}: ${printable(check.detail)}\n`,
      );
    }

    // JSON.stringify escapes only C0 controls; a recorded command line can
    // hold other control and bidi characters, which never reach the terminal.
    for (const [key, value] of Object.entries({
      ...result,
      ...(staleStopped === undefined ? {} : { staleStopped }),
    })) {
      if (!['message', 'checks'].includes(key)) {
        process.stdout.write(`  ${key}: ${printable(JSON.stringify(value))}\n`);
      }
    }
  }

  process.exit(code);
}

/** @param {unknown} value */
const validPort = (value) =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value > 0 &&
  value <= 65535;

// The recorded session, PIDs and ports reach commands, so a state file that
// holds anything else is refused before any of them runs.
/**
 * @param {unknown} value
 * @returns {value is ProcRecord}
 */
function isRecord(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'pid' in value &&
    typeof value.pid === 'number' &&
    Number.isInteger(value.pid) &&
    value.pid > 0 &&
    'ppid' in value &&
    typeof value.ppid === 'number' &&
    Number.isInteger(value.ppid) &&
    'start' in value &&
    typeof value.start === 'number' &&
    Number.isFinite(value.start) &&
    'commandLine' in value &&
    (value.commandLine === null || typeof value.commandLine === 'string')
  );
}

/**
 * @param {unknown} value
 * @returns {value is PortEntry}
 */
function isPortEntry(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof value.name === 'string' &&
    'port' in value &&
    validPort(value.port) &&
    'kind' in value &&
    value.kind === 'derived' &&
    (!('reason' in value) || typeof value.reason === 'string')
  );
}

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
    'tree' in value &&
    Array.isArray(value.tree) &&
    value.tree.every(isRecord) &&
    value.tree[0]?.pid === value.pid &&
    'port' in value &&
    validPort(value.port) &&
    'ports' in value &&
    Array.isArray(value.ports) &&
    value.ports.every(isPortEntry) &&
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

  // A state file from a control.mjs before process trees names a PID but no
  // tree: its descendants are unknown, so nothing guesses one.
  if (
    typeof state === 'object' &&
    state !== null &&
    !('tree' in state) &&
    'pid' in state &&
    typeof state.pid === 'number' &&
    Number.isInteger(state.pid) &&
    state.pid > 0 &&
    'port' in state &&
    validPort(state.port)
  ) {
    finish(2, {
      message: `refused: ${statePath} was written by a control.mjs without a process tree (pid ${String(state.pid)}, port ${String(state.port)}); check that pid ${String(state.pid)} is this checkout's server, stop it by hand, then delete ${statePath}; nothing was run`,
      statePath,
    });
  }

  if (!isState(state)) {
    finish(2, {
      message: `refused: ${statePath} records a session outside [\\w-], a PID that is not a positive integer, a tree that is not a list of process records rooted at that PID, an invalid port or ports list, or a url, target or log that is not a string; nothing was run`,
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

/**
 * The live processes of a recorded tree: each record whose PID still has its
 * recorded start time and command line.
 *
 * @param {ProcRecord[]} tree
 * @param {ProcRecord[]} rows
 */
function liveMembers(tree, rows) {
  const byPid = new Map(rows.map((row) => [row.pid, row]));

  return new Set(
    tree
      .filter((record) => matches(record, byPid.get(record.pid)))
      .map((record) => record.pid),
  );
}

/**
 * The recorded tree merged with the live tree below its root, from one
 * process table read.
 *
 * @param {ProcRecord[]} tree
 * @param {ProcRecord[]} rows
 */
function refreshed(tree, rows) {
  const [rootRecord] = tree;

  return rootRecord === undefined
    ? tree
    : merge(tree, snapshot(rootRecord, { table: () => rows }));
}

/**
 * Stops a recorded tree through proctree.mjs: a last snapshot below the root
 * while the parents live, merged into the record, then `stop`.
 *
 * @param {ProcRecord[]} tree
 */
function stopTree(tree) {
  const records = refreshed(tree, processTable());

  return {
    records,
    result: stop(
      records,
      STOP_ROUNDS === undefined ? {} : { rounds: STOP_ROUNDS },
    ),
  };
}

/** @param {ReturnType<typeof stop>} result */
const stopSummary = (result) => ({
  stoppedPids: result.stopped.map((record) => record.pid),
  gonePids: result.gone.map((record) => record.pid),
  refused: result.refused.map((record) => ({
    pid: record.pid,
    reason: record.reason,
    process: describe(record),
  })),
});

// Test seams; nothing else sets them. CONTROL_LISTENER_TIMEOUT_MS makes the
// listener query time out, from query CONTROL_LISTENER_QUERIES_OK on (0 by
// default). CONTROL_PID_LOOKUP_MISSES makes up's first lookups of the started
// PID miss. CONTROL_SPAWN_WINDOW_SHIFT_MS moves the spawn window those lookups
// pass to snapshot. CONTROL_STOP_ROUNDS limits stop's rounds; 0 reports every
// matched record as survived.
const LISTENER_TIMEOUT_MS =
  Number(process.env['CONTROL_LISTENER_TIMEOUT_MS']) || 30_000;
const LISTENER_QUERIES_OK =
  Number(process.env['CONTROL_LISTENER_QUERIES_OK']) || 0;
const PID_LOOKUP_MISSES = Number(process.env['CONTROL_PID_LOOKUP_MISSES']) || 0;
const SPAWN_WINDOW_SHIFT_MS =
  Number(process.env['CONTROL_SPAWN_WINDOW_SHIFT_MS']) || 0;
const STOP_ROUNDS =
  process.env['CONTROL_STOP_ROUNDS'] === undefined
    ? undefined
    : Number(process.env['CONTROL_STOP_ROUNDS']);
let listenerQueries = 0;

// Only Get-NetTCPConnection's own no-match error, or lsof's silent exit 1,
// means no listener; every other failure keeps its error.
/**
 * @param {number} listenPort
 * @returns {{ pids: number[], error: null } | { pids: null, error: string }}
 */
function listeningPids(listenPort) {
  const timeout =
    listenerQueries >= LISTENER_QUERIES_OK ? LISTENER_TIMEOUT_MS : 30_000;
  listenerQueries += 1;
  const run = IS_WINDOWS
    ? spawnSync(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          `try { Get-NetTCPConnection -State Listen -LocalPort ${String(listenPort)} -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess } catch { if ($_.CategoryInfo.Category -eq 'ObjectNotFound' -and $_.CategoryInfo.Activity -eq 'Get-NetTCPConnection') { exit 0 }; [Console]::Error.WriteLine($_); exit 1 }`,
        ],
        { encoding: 'utf8', timeout, windowsHide: true },
      )
    : spawnSync(
        'lsof',
        ['-nP', `-iTCP:${String(listenPort)}`, '-sTCP:LISTEN', '-t'],
        { encoding: 'utf8', timeout },
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
        ? `listener query on ${String(listenPort)} gave no answer in ${String(timeout)} ms`
        : `listener query on ${String(listenPort)} failed: ${stderr || String(run.error)}`,
    };
  }

  return {
    pids: [...new Set(stdout.split(/\r?\n/).filter(Boolean).map(Number))],
    error: null,
  };
}

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

/** @param {number} listenPort */
const refusedPort = (listenPort) =>
  isWorktree && MAIN_PORTS.includes(listenPort);

/**
 * The listener PIDs on a port; a failed query exits 2.
 *
 * @param {number} listenPort
 */
function holdersOf(listenPort) {
  const query = listeningPids(listenPort);

  if (query.pids === null) {
    finish(2, { message: withLaunchNote(`refused: ${query.error}`) });
  }

  return query.pids;
}

// Set once `up` has spawned the server, so an error after it names the
// cleanup.
/** @type {number | undefined} */
let launchedPid;

/** @param {string} message */
function withLaunchNote(message) {
  return launchedPid === undefined
    ? message
    : `${message}; the server (pid ${String(launchedPid)}) may still run: ${existsSync(statePath) ? 'run down' : 'stop it yourself'}`;
}

/**
 * Stops every record of a state file's tree that still matches its live
 * process, as "Process trees" says: a root whose PID now belongs to another
 * process is refused as `reused` and left alone while the other records are
 * still stopped.
 *
 * @param {State} state
 */
function stopRecorded(state) {
  const [rootRecord] = state.tree;
  const { records, result } = stopTree(state.tree);
  const rootRefused = result.refused.find(
    (record) =>
      record.reason === 'reused' &&
      record.pid === rootRecord.pid &&
      record.start === rootRecord.start,
  );
  const survived = result.refused.filter(
    (record) => record.reason === 'survived',
  );
  const notes = result.refused
    .filter((record) => record !== rootRefused && record.reason !== 'survived')
    .map(
      (record) =>
        `left ${describe(record)} alone: ${record.reason === 'helper' ? 'a shared helper, never stopped' : record.reason === 'caller' ? 'it runs this script' : 'its PID now belongs to another process'}`,
    );

  return {
    records,
    summary: stopSummary(result),
    rootRefused,
    survived,
    notes,
  };
}

/**
 * The exit-2 refusal of a stop that left a recorded process running: a root
 * refused as `reused`, or a record that survived the last round. The state
 * file stays, with the refreshed tree.
 *
 * @param {State} state
 * @param {ReturnType<typeof stopRecorded>} stopped
 * @param {Record<string, unknown>} extra
 */
function refuseUnstopped(state, stopped, extra) {
  if (stopped.rootRefused === undefined && stopped.survived.length === 0) {
    return;
  }

  writeState({ ...state, tree: stopped.records });
  finish(2, {
    message:
      stopped.rootRefused === undefined
        ? `${stopped.survived.map((record) => `${describe(record)} still runs after the last round`).join('; ')}; state kept at ${statePath}; run down again`
        : `refused: pid ${String(state.pid)} start-time or command-line mismatch: left it running and stopped the other recorded processes that still match; state kept at ${statePath}`,
    ...stopped.summary,
    notes: stopped.notes,
    ...extra,
    statePath,
  });
}

async function up() {
  const forced = portArg === undefined ? undefined : Number(portArg);

  if (forced !== undefined && !validPort(forced)) {
    finish(2, { message: '--port is an integer from 1 to 65535' });
  }

  const first = slotOf();

  if (forced !== undefined && refusedPort(forced)) {
    finish(2, {
      message: `refused: ${String(forced)} is the main checkout's Storybook port; a worktree uses its derived port ${String(portAt(first))}`,
    });
  }

  const existing = readState();

  if (existing !== null) {
    const live = processTable().find((proc) => proc.pid === existing.pid);

    if (matches(existing.tree[0], live)) {
      finish(2, {
        message: `refused: already up (pid ${String(existing.pid)}, ${existing.url}); run down first`,
      });
    }

    // The root is gone or its PID belongs to another process, but a recorded
    // descendant can still run (a wrapper that exited while its child
    // serves): stop what still matches before the record goes.
    const stopped = stopRecorded(existing);
    refuseUnstopped(existing, stopped, {});
    rmSync(statePath);
    staleStopped = stopped.summary;
  }

  if (forced !== undefined) {
    const holders = holdersOf(forced);

    if (holders.length > 0) {
      finish(2, {
        message: `refused: port ${String(forced)} (--port) held by PID ${holders.join(', ')}; --port has no fallback`,
        owner: holders,
      });
    }
  }

  const order = forced === undefined ? slotOrder(first) : [first];
  /** @type {string[]} */
  const tried = [];
  /** @type {string | undefined} */
  let leftFirst;

  for (const slot of order) {
    const listenPort = forced ?? portAt(slot);

    if (forced === undefined) {
      const holders = holdersOf(listenPort);

      if (holders.length > 0) {
        tried.push(
          `${flowName} ${String(listenPort)} held by PID ${holders.join(', ')}`,
        );
        leftFirst ??= `held by PID ${holders.join(', ')}`;
        continue;
      }
    }

    /** @type {PortEntry} */
    const entry =
      slot === first || forced !== undefined
        ? { name: flowName, port: listenPort, kind: 'derived' }
        : {
            name: flowName,
            port: listenPort,
            kind: 'derived',
            reason: `fell back from ${String(portAt(first))}: ${String(leftFirst)}`,
          };
    const holders = await launch(slot, entry, forced !== undefined);
    tried.push(
      `${flowName} ${String(listenPort)} taken after the check by PID ${holders.join(', ')}`,
    );
    leftFirst ??= `held by PID ${holders.join(', ')}`;
  }

  finish(2, {
    message: `refused: no free slot in ${String(order.length)} tries (slots ${order.join(', ')}): ${tried.join('; ')}`,
  });
}

/**
 * One launch on one slot. Finishes the run when the Storybook is ready or the
 * launch failed; returns the listener PIDs when another process took the port
 * after the check, once this launch's tree is stopped and its state file gone.
 *
 * @param {number} slot
 * @param {PortEntry} entry
 * @param {boolean} fixedPort  `--port` given: no next slot
 * @returns {Promise<number[]>}
 */
async function launch(slot, entry, fixedPort) {
  const listenPort = entry.port;
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
    `--port=${String(listenPort)}`,
  ];
  const notBefore = Date.now();
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
  const notAfter = Date.now();
  child.unref();
  launchedPid = child.pid;
  closeSync(log);
  /** @type {number | null} */
  let exited = null;
  child.once('exit', (code) => {
    exited = code;
  });
  const { pid } = child;

  if (pid === undefined) {
    finish(1, { message: 'the server did not start', log: logPath });
  }

  // `down` matches the recorded start time and command line, so neither may
  // be recorded before the process table lists the fresh PID with both.
  /** @type {ProcRecord[]} */
  let tree = [];

  for (let attempt = 0; attempt < 20 && tree.length === 0; attempt += 1) {
    const found =
      attempt < PID_LOOKUP_MISSES
        ? []
        : snapshot(pid, {
            notBefore: notBefore + SPAWN_WINDOW_SHIFT_MS,
            notAfter: notAfter + SPAWN_WINDOW_SHIFT_MS,
          });

    if (typeof found[0]?.commandLine === 'string') {
      tree = found;
    } else {
      await sleep(250);
    }
  }

  const [rootRecord] = tree;

  if (rootRecord === undefined) {
    const found = snapshot(pid, { notBefore, notAfter });
    const result = stop(found);

    if (found.length === 0) {
      child.kill();
    }

    finish(1, {
      message: `pid ${String(pid)} did not appear in the process table with a start time and command line; stopped its tree`,
      launchStopped: snapshot(pid, { notBefore, notAfter }).length === 0,
      ...stopSummary(result),
      log: logPath,
    });
  }

  const url = `http://localhost:${String(listenPort)}`;
  const state = {
    pid,
    port: listenPort,
    slot,
    ports: [entry],
    url,
    flow: flowName,
    target: `ngx-yeti:${flow.target}`,
    session,
    commandLine: rootRecord.commandLine,
    startedAt: new Date(notBefore).toISOString(),
    evidenceDir,
    log: logPath,
    tree,
  };
  writeState(state);

  /**
   * Stops what this launch started and removes its state file; a record
   * still running after the last round keeps the file and exits 1.
   *
   * @param {string} why
   */
  const stopLaunch = (why) => {
    const { records, result } = stopTree(tree);
    const survived = result.refused.filter(
      (record) => record.reason === 'survived',
    );

    // A launch that keeps respawning children can outlast stop's rounds; its
    // state file stays, so down can stop what is left.
    if (survived.length > 0) {
      writeState({ ...state, tree: records });
      finish(1, {
        message: `${why}; ${survived.map((record) => describe(record)).join(', ')} still runs after the last round; state kept at ${statePath}; run down`,
        ...stopSummary(result),
        tree: records,
        statePath,
      });
    }

    rmSync(statePath, { force: true });
    launchedPid = undefined;

    return { records, summary: stopSummary(result) };
  };

  /** @param {number[]} holders */
  const taken = (holders) => {
    stopLaunch(`another process took port ${String(listenPort)}`);

    return holders;
  };

  while (Date.now() - notBefore < READY_TIMEOUT_MS) {
    const rows = processTable();
    const grown = refreshed(tree, rows);

    if (grown.length !== tree.length) {
      tree = grown;
      writeState({ ...state, tree });
    }

    if (exited !== null) {
      const owned = liveMembers(tree, rows);
      const others = holdersOf(listenPort).filter(
        (holder) => !owned.has(holder),
      );

      if (!fixedPort && others.length > 0) {
        return taken(others);
      }

      const why = `server exited with code ${String(exited)} before ready`;
      const { records, summary } = stopLaunch(why);
      finish(1, {
        message: `${why}; stopped its recorded tree`,
        ...summary,
        tree: records,
        log: logPath,
        logTail: tail(logPath),
      });
    }

    if (await indexHasStory(url)) {
      const now = processTable();
      tree = refreshed(tree, now);
      writeState({ ...state, tree });
      const owned = liveMembers(tree, now);
      const holders = holdersOf(listenPort);
      const foreign = holders.filter((holder) => !owned.has(holder));

      // Every listener must be the launch's own: a foreign one beside it may
      // have answered the index.
      if (foreign.length > 0 || holders.length === 0) {
        if (!fixedPort) {
          return taken(foreign.length > 0 ? foreign : holders);
        }

        finish(1, {
          message: `port ${String(listenPort)} answers but pid ${(foreign.length > 0 ? foreign : holders).join(', ')} is not in the started tree; run down`,
          ...state,
          tree,
        });
      }

      const render = await renderCheck(url);

      if (render.phase === 'finished' && !render.errorDisplay) {
        finish(0, {
          message: `ready at ${url}`,
          ...state,
          tree,
          readyMs: Date.now() - notBefore,
        });
      }

      finish(1, {
        message: `${KNOWN_STORY} did not render`,
        render,
        ...state,
        tree,
      });
    }

    await sleep(2000);
  }

  finish(1, {
    message: `not ready after ${String(READY_TIMEOUT_MS)} ms; run down`,
    ...state,
    tree,
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
    if (refusedPort(recorded.port)) {
      finish(2, {
        message: `refused: ${String(recorded.port)} is the main checkout's Storybook port; pass --url to check it on purpose`,
      });
    }

    const rows = processTable();
    const [rootRecord] = recorded.tree;
    const live = rows.find((proc) => proc.pid === recorded.pid);
    add(
      'process alive',
      matches(rootRecord, live),
      live === undefined
        ? `pid ${String(recorded.pid)} is not running`
        : matches(rootRecord, live)
          ? `pid ${String(recorded.pid)} started ${new Date(rootRecord.start).toISOString()}`
          : `pid ${String(recorded.pid)} runs, but not with the recorded start time and command line`,
    );
    // The tree refresh is doctor's one write.
    const tree = refreshed(recorded.tree, rows);

    if (tree.length !== recorded.tree.length) {
      writeState({ ...recorded, tree });
    }

    const owned = liveMembers(tree, rows);
    const problems = recorded.ports.flatMap(({ name, port: listenPort }) => {
      const query = listeningPids(listenPort);

      if (query.pids === null) {
        return [`${name} ${String(listenPort)}: ${query.error}`];
      }

      const foreign = query.pids.filter((pid) => !owned.has(pid));

      return query.pids.length === 0
        ? [`${name} ${String(listenPort)} not listening`]
        : foreign.length > 0
          ? [
              `${name} ${String(listenPort)} held by PID ${foreign.join(', ')}, not the recorded tree`,
            ]
          : [];
    });
    add(
      'ports',
      problems.length === 0,
      problems.length > 0
        ? problems.join('; ')
        : recorded.ports
            .map(
              ({ name, port: listenPort, kind, reason }) =>
                `${name} ${String(listenPort)} (${kind}${reason === undefined ? '' : `: ${reason}`})`,
            )
            .join(', '),
    );
  } else {
    skip('process alive', '--url names an instance this run did not start');
    skip('ports', '--url given; ownership not checked');
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

  const [rootRecord] = state.tree;
  const live = processTable().find((proc) => proc.pid === rootRecord.pid);
  const sessionClose = await closeSession(state.session);
  const stopped = stopRecorded(state);
  refuseUnstopped(
    state,
    stopped,
    live === undefined || matches(rootRecord, live)
      ? { sessionClose }
      : { sessionClose, recorded: describe(rootRecord), live: describe(live) },
  );
  const { summary, notes } = stopped;

  // Up to 15 s for the port to stop answering once its holders are gone.
  let portFree = !(await portAnswers(state.port));

  for (
    const deadline = Date.now() + 15_000;
    !portFree && Date.now() < deadline;
  ) {
    await sleep(500);
    portFree = !(await portAnswers(state.port));
  }

  // Every recorded process is stopped or gone by now, so another down could
  // do no more: the state file goes. A listener left on the port is outside
  // the recorded tree, so it may be another session's instance or the user's
  // own; it is named, never offered for stopping.
  rmSync(statePath);
  const query = portFree ? null : listeningPids(state.port);
  const rows = query?.pids?.length ? processTable() : [];
  /** @param {number} holder */
  const holderLine = (holder) => {
    const row = rows.find((candidate) => candidate.pid === holder);

    return row === undefined ? `PID ${String(holder)}` : describe(row);
  };
  const report = {
    ...summary,
    notes,
    recordedPidRunning: live !== undefined,
    portFree,
    port: state.port,
    session: state.session,
    sessionClose,
    evidenceDir: state.evidenceDir,
  };
  const problems = [
    ...(query === null
      ? []
      : [
          query.pids === null
            ? `port ${String(state.port)} still answers (${query.error}); removed ${statePath}`
            : `port ${String(state.port)} still held by ${query.pids.length > 0 ? query.pids.map(holderLine).join(', ') : 'an unknown process'}, not the recorded tree; it may be another session's instance or the user's own, so down left it running; removed ${statePath}`,
        ]),
    ...(sessionLeftOpen(sessionClose.outcome)
      ? [
          `playwright-cli session ${state.session} ${sessionClose.outcome}; close it with playwright-cli -s=${state.session} close`,
        ]
      : []),
  ];

  if (problems.length > 0) {
    finish(1, {
      message: `teardown incomplete: ${problems.join('; ')}`,
      ...report,
    });
  }

  finish(0, {
    message:
      live === undefined
        ? `pid ${String(state.pid)} was not running; removed the state file`
        : `stopped the tree of pid ${String(state.pid)}: ${String(summary.stoppedPids.length)} stopped, ${String(summary.gonePids.length)} already exited`,
    ...report,
  });
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
    message: `unknown argument ${unknown[0]}; flags are --dev, --json, --port=<n> (up) and --url=<origin> (doctor)`,
  });
}

if (run === undefined) {
  finish(2, {
    message:
      'usage: control.mjs <up|doctor|info|down> [--dev] [--port=<n>] [--url=<origin>] [--json]',
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
