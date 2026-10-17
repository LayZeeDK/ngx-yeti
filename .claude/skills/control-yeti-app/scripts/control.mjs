#!/usr/bin/env node
// @ts-check
// Launch, health-check, describe and stop one Fixture app (yeti-app)
// instance per checkout. Driving stays in playwright-cli.
// Usage: node control.mjs <up|doctor|info|down> [--mode=serve|ssr]
//   [--configuration=development|production] [--port=<n>] [--timeout=<s>]
//   [--url=<url>] [--json]
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { connect } from 'node:net';
import { homedir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';
import { mapFresh, printable } from './fingerprint.mjs';
import {
  describe,
  matches,
  merge,
  processTable,
  snapshot,
  stop,
} from './proctree.mjs';

const skillDir = fileURLToPath(new URL('..', import.meta.url));
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const scratch = join(root, 'tmp', 'control-yeti-app');
const stateFile = join(scratch, 'state.json');
const requireFromRoot = createRequire(join(root, 'package.json'));

// The ports table of SKILL.md, "Pick a flow": each mode opens one port. Slot 0
// is the main checkout's documented port (`nx serve` keeps the dev-server
// default, and server.ts listens on PORT or 4000); slot 1 to 99 give
// `base + slot - 1`, above control-ngx-yeti-storybook's 4420-4619, so two
// skills' worktrees never derive the same port.
const portRows = {
  serve: { name: 'serve', main: 4200, base: 4620 },
  ssr: { name: 'ssr', main: 4000, base: 4720 },
};
const mainPorts = Object.values(portRows).map((row) => row.main);
const slots = 100;
const slotTries = 10;
const marker = 'Welcome yeti-app';
const readyPath = 'card';
const hydrationSummary =
  /^Angular hydrated \d+ component\(s\) and \d+ node\(s\), \d+ component\(s\) were skipped\./;

const valueFlags = /** @type {const} */ ([
  'mode',
  'configuration',
  'port',
  'url',
  'timeout',
]);
/** @type {Record<string, readonly FlagName[]>} */
const commandFlags = {
  up: ['mode', 'configuration', 'port', 'timeout'],
  doctor: ['url'],
  info: [],
  down: [],
};
const usage =
  'usage: control.mjs <up|doctor|info|down> [--mode=serve|ssr] [--configuration=development|production] [--port=<n>] [--timeout=<s>] [--url=<url>] [--json]';
const sessionName = /^[\w-]+$/;

/**
 * @typedef {(typeof valueFlags)[number]} FlagName
 */

/**
 * @typedef {object} Check
 * @property {string} name
 * @property {'pass' | 'fail' | 'skip' | 'warn'} status
 * @property {string} detail
 */

/**
 * @typedef {{ error?: string, checks?: Check[], warnings?: string[] } & Record<string, unknown>} Result
 */

/** @typedef {import('./proctree.mjs').ProcRecord} ProcRecord */

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
 * The fields of the state file this script reads back; `up` writes more.
 *
 * @typedef {object} State
 * @property {string} session
 * @property {number} pid
 * @property {number} port
 * @property {PortEntry[]} ports
 * @property {string} url
 * @property {string} logFile
 * @property {string} evidenceDir
 * @property {[ProcRecord, ...ProcRecord[]]} tree  the recorded process tree, root first
 * @property {unknown} [mode]
 * @property {unknown} [configuration]
 * @property {unknown} [start]
 * @property {unknown} [commandLine]
 */

/**
 * @param {string} name
 * @returns {name is FlagName}
 */
const isValueFlag = (name) => valueFlags.some((flag) => flag === name);

const [command, ...rest] = process.argv.slice(2);
const json = rest.includes('--json');
const flags = parseFlags(rest);

// Only `--json` and `--<name>=<value>` for the names above: a mistyped name or
// a value after a space must not fall back to a default.
/** @param {string[]} args */
function parseFlags(args) {
  /** @type {Partial<Record<FlagName, string>>} */
  const result = {};

  for (const arg of args) {
    if (arg === '--json') {
      continue;
    }

    const [, name, value] = /^--([^=]+)=(.+)$/.exec(arg) ?? [];

    if (name === undefined || value === undefined || !isValueFlag(name)) {
      finish(2, {
        error: `unknown argument ${arg}; flags are --json and ${valueFlags.map((name) => `--${name}=<value>`).join(', ')}`,
      });
    }

    const allowed =
      command !== undefined && Object.hasOwn(commandFlags, command)
        ? commandFlags[command]
        : undefined;

    if (allowed !== undefined && !allowed.includes(name)) {
      finish(2, { error: `flag --${name} does not apply to ${command}` });
    }

    result[name] = value;
  }

  return result;
}

/** @param {unknown} value */
const positiveInteger = (value) =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;
/** @param {unknown} value */
const validPort = (value) =>
  typeof value === 'number' && positiveInteger(value) && value <= 65535;

/**
 * @param {number} code
 * @param {Result} result
 * @returns {never}
 */
function finish(code, result) {
  if (json) {
    process.stdout.write(
      `${JSON.stringify({ command, exit: code, ...result }, null, 2)}\n`,
    );
  } else {
    for (const check of result.checks ?? []) {
      const tag = {
        pass: '[OK]',
        fail: '[ERROR]',
        skip: '[SKIP]',
        warn: '[WARN]',
      }[check.status];
      process.stdout.write(
        `${tag} ${check.name}: ${printable(check.detail)}\n`,
      );
    }

    for (const warning of result.warnings ?? []) {
      process.stdout.write(`[WARN] ${printable(warning)}\n`);
    }

    // JSON.stringify escapes only C0 controls; a recorded command line can
    // hold other control and bidi characters, which never reach the terminal.
    const tag = code === 0 ? '[OK]' : code === 1 ? '[WARN]' : '[ERROR]';
    process.stdout.write(
      `${tag} ${command ?? ''} ${printable(JSON.stringify({ ...result, checks: undefined, warnings: undefined }))}\n`,
    );
  }

  process.exit(code);
}

function flow() {
  const worktree = statSync(join(root, '.git')).isFile();
  const id = worktree
    ? `wt-${createHash('sha1').update(root.toLowerCase()).digest('hex').slice(0, 8)}`
    : 'main';

  return { worktree, id, session: `control-yeti-app-${id}` };
}

/**
 * The checkout's own slot: 0 in the main checkout, else 1 to 99 from a hash
 * of its path, so a worktree's usual port stays the same from run to run.
 *
 * @param {ReturnType<typeof flow>} currentFlow
 */
function slotOf(currentFlow) {
  if (!currentFlow.worktree) {
    return 0;
  }

  const hash = createHash('sha1').update(root.toLowerCase()).digest();

  return 1 + (hash.readUInt32BE(0) % (slots - 1));
}

/**
 * The slots `up` tries, in order: `first` and the next ones, `slotTries` in
 * all. From a worktree they wrap within 1 to 99 and never reach slot 0.
 *
 * @param {number} first
 */
function slotOrder(first) {
  return Array.from({ length: slotTries }, (_, i) =>
    first === 0 ? i : 1 + ((first - 1 + i) % (slots - 1)),
  );
}

/**
 * @param {keyof typeof portRows} mode
 * @param {number} slot
 */
function portAt(mode, slot) {
  const row = portRows[mode];

  return slot === 0 ? row.main : row.base + slot - 1;
}

/**
 * @param {ReturnType<typeof flow>} currentFlow
 * @param {number} port
 */
function refusedPort(currentFlow, port) {
  return currentFlow.worktree && mainPorts.includes(port);
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

// Test seams; nothing else sets them. CONTROL_LISTENER_TIMEOUT_MS makes the
// listener query time out, from query CONTROL_LISTENER_QUERIES_OK on (0 by
// default). CONTROL_PID_LOOKUP_MISSES makes up's first lookups of the started
// PID miss. CONTROL_SPAWN_WINDOW_SHIFT_MS moves the spawn window those lookups
// pass to snapshot. CONTROL_STOP_ROUNDS limits stop's rounds; 0 reports every
// matched record as survived.
const listenerTimeout =
  Number(process.env['CONTROL_LISTENER_TIMEOUT_MS']) || 30000;
const listenerQueriesOk =
  Number(process.env['CONTROL_LISTENER_QUERIES_OK']) || 0;
const pidLookupMisses = Number(process.env['CONTROL_PID_LOOKUP_MISSES']) || 0;
const spawnWindowShift =
  Number(process.env['CONTROL_SPAWN_WINDOW_SHIFT_MS']) || 0;
const stopRounds =
  process.env['CONTROL_STOP_ROUNDS'] === undefined
    ? undefined
    : Number(process.env['CONTROL_STOP_ROUNDS']);
let listenerQueries = 0;
// Set once up has spawned a server, so an error after it names the cleanup.
/** @type {number | undefined} */
let launchedPid;

/** @param {string} error */
const withLaunchNote = (error) =>
  launchedPid === undefined
    ? error
    : `${error}; the launched server (pid ${launchedPid}) may still run: ${existsSync(stateFile) ? `state kept at ${stateFile}; run down` : 'stop it yourself'}`;

// The run's browser and its JavaScript-off browser (features/javascript-off.md).
/** @param {string} session */
const sessionsOf = (session) => [session, `${session}-jsoff`];

// Get-NetTCPConnection, not netstat: netstat translates its state column. Only
// the cmdlet's own no-match error means no listener; a misspelled command is
// ObjectNotFound too, so the activity is checked as well. Every other error
// exits 1.
/** @param {number} port */
function queryListeners(port) {
  const timeout =
    listenerQueries >= listenerQueriesOk ? listenerTimeout : 30000;
  listenerQueries += 1;
  const run = spawnSync(
    'pwsh',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `try { Get-NetTCPConnection -State Listen -LocalPort ${String(port)} -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess } catch { if ($_.CategoryInfo.Category -eq 'ObjectNotFound' -and $_.CategoryInfo.Activity -eq 'Get-NetTCPConnection') { exit 0 }; [Console]::Error.WriteLine($_); exit 1 }`,
    ],
    { encoding: 'utf8', timeout, windowsHide: true },
  );

  // A spawn that failed has no stderr; a timed-out one may have none, and its
  // status is null.
  if (run.status !== 0) {
    const timedOut =
      run.error !== undefined &&
      'code' in run.error &&
      run.error.code === 'ETIMEDOUT';

    return {
      pids: null,
      error: timedOut
        ? `listener query on ${port} gave no answer in ${timeout} ms`
        : `listener query on ${port} failed: ${(run.stderr ?? '').trim() || String(run.error)}`,
    };
  }

  return {
    pids: [...new Set(run.stdout.split(/\r?\n/).filter(Boolean).map(Number))],
    error: null,
  };
}

/** @param {number} port */
function listeners(port) {
  const { pids, error } = queryListeners(port);

  if (pids === null) {
    finish(2, { error: withLaunchNote(String(error)) });
  }

  return pids;
}

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
    positiveInteger(value.pid) &&
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
    sessionName.test(value.session) &&
    'pid' in value &&
    positiveInteger(value.pid) &&
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
    'logFile' in value &&
    typeof value.logFile === 'string' &&
    'evidenceDir' in value &&
    typeof value.evidenceDir === 'string'
  );
}

function readState() {
  if (!existsSync(stateFile)) {
    return null;
  }

  /** @type {unknown} */
  let state;

  try {
    state = JSON.parse(readFileSync(stateFile, 'utf8'));
  } catch (error) {
    finish(2, {
      error: `refused: ${stateFile} could not be read as JSON (${String(error)}); nothing was run`,
      stateFile,
    });
  }

  // A state file from a control.mjs before process trees names a PID but no
  // tree: its descendants are unknown, so nothing guesses one.
  if (
    typeof state === 'object' &&
    state !== null &&
    !('tree' in state) &&
    'pid' in state &&
    positiveInteger(state.pid) &&
    'port' in state &&
    validPort(state.port)
  ) {
    finish(2, {
      error: `refused: ${stateFile} was written by a control.mjs without a process tree (pid ${String(state.pid)}, port ${String(state.port)}); check that pid ${String(state.pid)} is this checkout's server, stop it by hand, then delete ${stateFile}; nothing was run`,
      stateFile,
    });
  }

  if (!isState(state)) {
    finish(2, {
      error: `refused: ${stateFile} records a session outside [\\w-], a PID that is not a positive integer, a tree that is not a list of process records rooted at that PID, an invalid port or ports list, or a url, logFile or evidenceDir that is not a string; nothing was run`,
      stateFile,
    });
  }

  return state;
}

// A reader sees the old file or the new one, never a partial write.
/** @param {Record<string, unknown>} state */
function writeState(state) {
  const temporary = `${stateFile}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`);
  renameSync(temporary, stateFile);
}

// The shim's own script under this Node: the session name never passes
// through a shell.
function playwrightCli() {
  for (const dir of (process.env['PATH'] ?? '').split(delimiter)) {
    const entry = join(
      dir,
      'node_modules',
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
/**
 * @param {string} session
 * @returns {Promise<string | null>} why the session counts as open, or null
 */
async function registryOpenReason(session) {
  const base =
    process.env['CONTROL_SESSION_REGISTRY'] ??
    join(
      process.env['LOCALAPPDATA'] ?? join(homedir(), 'AppData', 'Local'),
      'ms-playwright',
      'daemon',
    );

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
    const file = join(base, dir, `${session}.session`);

    if (!existsSync(file)) {
      continue;
    }

    /** @type {unknown} */
    let config;

    try {
      config = JSON.parse(readFileSync(file, 'utf8'));
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

    if (await answers(socketPath)) {
      return `the session is listed as open in ${file}`;
    }
  }

  return null;
}

/**
 * @param {string} socketPath
 * @returns {Promise<boolean>}
 */
function answers(socketPath) {
  return new Promise((done) => {
    const socket = connect({ path: socketPath });
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      done(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      done(false);
    });
    socket.once('error', () => done(false));
  });
}

/**
 * @param {string | null} entry
 * @param {string} session
 * @returns {Promise<SessionClose>}
 */
async function closeSession(entry, session) {
  if (!entry) {
    const open = await registryOpenReason(session);

    return open === null
      ? { session, outcome: 'absent', detail: 'no playwright-cli on PATH' }
      : {
          session,
          outcome: 'left-open',
          detail: `no playwright-cli on PATH, and ${open}`,
        };
  }

  const run = spawnSync(process.execPath, [entry, `-s=${session}`, 'close'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 30000,
    windowsHide: true,
  });
  const output = `${run.stdout ?? ''}${run.stderr ?? ''}`.trim();

  if (run.error && 'code' in run.error && run.error.code === 'ETIMEDOUT') {
    return { session, outcome: 'timeout', detail: 'no answer within 30 s' };
  }

  if (run.error || run.status !== 0) {
    return {
      session,
      outcome: 'failed',
      detail: `exit ${run.status}: ${output || run.error}`,
    };
  }

  // playwright-cli exits 0 whether or not the session was open.
  return {
    session,
    outcome: output.includes('is not open') ? 'not-open' : 'closed',
    detail: output,
  };
}

/** @param {string} url */
async function fetchPage(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

    return { status: response.status, body: await response.text() };
  } catch (error) {
    return { status: 0, body: String(error) };
  }
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/**
 * Stops a recorded tree through proctree.mjs: a last snapshot below the root
 * while the parents live, merged into the record, then `stop`.
 *
 * @param {ProcRecord[]} tree
 */
function stopTree(tree) {
  const records = refreshed(tree, processTable());
  const result = stop(
    records,
    stopRounds === undefined ? {} : { rounds: stopRounds },
  );

  return { records, result };
}

/**
 * @param {ReturnType<typeof stop>} result
 */
const stopSummary = (result) => ({
  stopped: result.stopped.map((record) => record.pid),
  gone: result.gone.map((record) => record.pid),
  refused: result.refused.map((record) => ({
    pid: record.pid,
    reason: record.reason,
    process: describe(record),
  })),
});

async function up() {
  const currentFlow = flow();
  const mode = flags.mode ?? 'serve';
  const configuration = flags.configuration ?? 'development';

  if (
    (mode !== 'serve' && mode !== 'ssr') ||
    !['development', 'production'].includes(configuration)
  ) {
    finish(2, {
      error:
        '--mode is serve or ssr; --configuration is development or production',
    });
  }

  const existing = readState();
  const timeoutSeconds = Number(flags.timeout ?? 900);

  if (!(timeoutSeconds > 0)) {
    finish(2, { error: '--timeout is a number of seconds above 0' });
  }

  if (flags.port && !validPort(Number(flags.port))) {
    finish(2, { error: '--port is an integer from 1 to 65535' });
  }

  if (existing) {
    finish(2, {
      error: `already up (pid ${existing.pid}, port ${existing.port}); run down first`,
      stateFile,
    });
  }

  const first = slotOf(currentFlow);
  const forced = flags.port ? Number(flags.port) : undefined;

  if (forced !== undefined && refusedPort(currentFlow, forced)) {
    finish(2, {
      error: `port ${forced} belongs to the main checkout; a worktree uses its derived port ${portAt(mode, first)}`,
    });
  }

  if (forced !== undefined) {
    const holders = listeners(forced);

    if (holders.length > 0) {
      finish(2, {
        error: `port ${forced} (--port) held by PID ${holders.join(', ')}; --port has no fallback`,
      });
    }
  }

  const name = portRows[mode].name;
  const order = forced === undefined ? slotOrder(first) : [first];
  /** @type {string[]} */
  const tried = [];
  /** @type {string | undefined} */
  let leftFirst;

  for (const slot of order) {
    const port = forced ?? portAt(mode, slot);

    if (forced === undefined) {
      const holders = listeners(port);

      if (holders.length > 0) {
        tried.push(`${name} ${port} held by PID ${holders.join(', ')}`);
        leftFirst ??= `held by PID ${holders.join(', ')}`;
        continue;
      }
    }

    /** @type {PortEntry} */
    const entry =
      slot === first || forced !== undefined
        ? { name, port, kind: 'derived' }
        : {
            name,
            port,
            kind: 'derived',
            reason: `fell back from ${portAt(mode, first)}: ${String(leftFirst)}`,
          };
    const holders = await launch({
      currentFlow,
      mode,
      configuration,
      slot,
      entry,
      fixedPort: forced !== undefined,
      timeout: timeoutSeconds * 1000,
    });
    tried.push(
      `${name} ${port} taken after the check by PID ${holders.join(', ')}`,
    );
    leftFirst ??= `held by PID ${holders.join(', ')}`;
  }

  finish(2, {
    error: `no free slot in ${order.length} tries (slots ${order.join(', ')}): ${tried.join('; ')}`,
  });
}

/**
 * One launch on one slot. Finishes the run when the instance is ready or the
 * launch failed; returns the listener PIDs when another process took the port
 * after the check, once this launch's tree is stopped and its state file gone.
 *
 * @param {object} options
 * @param {ReturnType<typeof flow>} options.currentFlow
 * @param {keyof typeof portRows} options.mode
 * @param {string} options.configuration
 * @param {number} options.slot
 * @param {PortEntry} options.entry
 * @param {boolean} options.fixedPort  `--port` given: no next slot
 * @param {number} options.timeout  in milliseconds
 * @returns {Promise<number[]>}
 */
async function launch({
  currentFlow,
  mode,
  configuration,
  slot,
  entry,
  fixedPort,
  timeout,
}) {
  const { port } = entry;
  const runId = new Date().toISOString().replaceAll(/[:.]/g, '-');
  const evidenceDir = join(scratch, runId);
  mkdirSync(evidenceDir, { recursive: true });
  // playwright-cli config for the `<session>-jsoff` browser
  // (features/javascript-off.md).
  writeFileSync(
    join(evidenceDir, 'js-off.json'),
    '{ "browser": { "contextOptions": { "javaScriptEnabled": false } } }\n',
  );
  const logFile = join(evidenceDir, 'server.log');
  const log = openSync(logFile, 'a');
  // The installed nx entry under this Node, as the e2e web servers start it
  // (tools/playwright/browser-projects.mjs): an npx layer can push a deep
  // worktree's PATH past cmd.exe's limit.
  const nxArgs = [
    requireFromRoot.resolve('nx'),
    'run',
    `yeti-app:${mode === 'ssr' ? 'serve-ssr' : 'serve'}:${configuration}`,
  ];

  if (mode === 'serve') {
    nxArgs.push(`--port=${port}`);
  }

  const notBefore = Date.now();
  const child = spawn(process.execPath, nxArgs, {
    cwd: root,
    detached: true,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', log, log],
    windowsHide: true,
  });
  const notAfter = Date.now();
  child.unref();
  const { pid } = child;

  if (pid === undefined) {
    finish(1, {
      error: `the launch exited before it was ready; see ${logFile}`,
      logFile,
    });
  }

  launchedPid = pid;

  // `down` matches the recorded start time and command line, so neither may
  // be recorded before the process table lists the fresh PID with both.
  /** @type {ProcRecord[]} */
  let tree = [];

  for (let attempt = 0; attempt < 20 && tree.length === 0; attempt += 1) {
    const found =
      attempt < pidLookupMisses
        ? []
        : snapshot(pid, {
            notBefore: notBefore + spawnWindowShift,
            notAfter: notAfter + spawnWindowShift,
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
      error: `pid ${pid} did not appear in the process table with a start time and command line; stopped its tree; see ${logFile}`,
      launchStopped: snapshot(pid, { notBefore, notAfter }).length === 0,
      ...stopSummary(result),
      logFile,
    });
  }

  const url = `http://localhost:${port}/sub/`;
  const state = {
    flow: currentFlow.id,
    worktree: currentFlow.worktree,
    mode,
    configuration,
    pid,
    start: new Date(rootRecord.start).toISOString(),
    commandLine: rootRecord.commandLine,
    port,
    slot,
    ports: [entry],
    url,
    session: currentFlow.session,
    sessions: sessionsOf(currentFlow.session),
    evidenceDir,
    logFile,
    tree,
  };
  writeState(state);

  /** @param {Record<string, unknown>} extra */
  const stopLaunch = (extra) => {
    const { records, result } = stopTree(tree);
    const survived = result.refused.filter(
      (record) => record.reason === 'survived',
    );
    const report = {
      ...state,
      tree: records,
      ...extra,
      launchStopped: survived.length === 0,
      ...stopSummary(result),
    };

    // A launch that keeps respawning children can outlast stop's rounds; its
    // state file stays, so down can stop what is left.
    if (survived.length > 0) {
      writeState({ ...state, tree: records });
      finish(1, {
        ...report,
        error: `${typeof extra['error'] === 'string' ? extra['error'] : 'another process took the port'}; ${survived.map((record) => describe(record)).join(', ')} still runs after the last round; state kept at ${stateFile}; run down`,
        stateFile,
      });
    }

    rmSync(stateFile, { force: true });
    launchedPid = undefined;

    return report;
  };
  // Every exit-1 path stops what this launch started and removes the state
  // file, so a failed up leaves nothing for down unless a process outlasted
  // the stop.
  /** @type {(error: string) => never} */
  const fail = (error) => finish(1, stopLaunch({ error }));

  while (Date.now() - notBefore < timeout) {
    const rows = processTable();
    const grown = refreshed(tree, rows);

    if (grown.length !== tree.length) {
      tree = grown;
      writeState({ ...state, tree });
    }

    if (
      child.exitCode !== null ||
      !matches(
        rootRecord,
        rows.find((row) => row.pid === pid),
      )
    ) {
      const owned = liveMembers(tree, rows);
      const others = listeners(port).filter((holder) => !owned.has(holder));

      if (!fixedPort && others.length > 0) {
        stopLaunch({});

        return others;
      }

      fail(`the launch exited before it was ready; see ${logFile}`);
    }

    const page = await fetchPage(`${url}${readyPath}`);

    if (page.status === 200 && page.body.includes(marker)) {
      const now = processTable();
      tree = refreshed(tree, now);
      const owned = liveMembers(tree, now);
      const listening = listeners(port);
      const foreign = listening.filter((holder) => !owned.has(holder));

      // Every listener must be the launch's own: a foreign one beside it may
      // have answered the page.
      if (foreign.length > 0 || listening.length === 0) {
        if (!fixedPort) {
          stopLaunch({});

          return foreign.length > 0 ? foreign : listening;
        }

        fail(
          `port ${port} answers but pid ${(foreign.length > 0 ? foreign : listening).join(', ')} is not in the started tree; stopped the launch`,
        );
      }

      writeState({ ...state, tree });
      finish(0, {
        ...state,
        tree,
        readySeconds: Math.round((Date.now() - notBefore) / 1000),
      });
    }

    await sleep(2000);
  }

  fail(
    `not ready after ${timeout / 1000}s; stopped the launch (raise --timeout for an uncached build); see ${logFile}`,
  );
}

// Nx colours its output even into a file.
/** @param {State} state */
function serverLog(state) {
  return stripVTControlCharacters(readFileSync(state.logFile, 'utf8'));
}

const sourceDirs = ['apps/yeti-app', 'packages/ngx-yeti', 'vendor/yeti'];

// Git's tracked and untracked files only: ignored output (node_modules, dist,
// storybook-static, the vendor/yeti/docs that yeti-build writes, Vitest's
// attachments and screenshots) changes without changing the sources.
/** @returns {{ file: string | null, mtimeMs: number } | string} */
function newestSource() {
  const run = spawnSync(
    'git',
    ['ls-files', '-co', '--exclude-standard', '-z', '--', ...sourceDirs],
    {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
      windowsHide: true,
    },
  );

  if (run.status !== 0) {
    return `git ls-files failed: ${String(run.error ?? run.stderr.trim())}`;
  }

  /** @type {{ file: string | null, mtimeMs: number }} */
  let newest = { file: null, mtimeMs: 0 };

  for (const file of run.stdout.split('\0')) {
    // A listed file that is gone (deleted, not yet staged) has no time.
    const stat =
      file === ''
        ? undefined
        : statSync(join(root, file), { throwIfNoEntry: false });

    if (stat !== undefined && stat.mtimeMs > newest.mtimeMs) {
      newest = { file, mtimeMs: stat.mtimeMs };
    }
  }

  return newest;
}

async function doctor() {
  const currentFlow = flow();
  const state = readState();
  /** @type {Check[]} */
  const checks = [];
  /**
   * @param {string} name
   * @param {Check['status']} status
   * @param {string} detail
   */
  const check = (name, status, detail) => checks.push({ name, status, detail });
  const fromState = !flags.url;
  let url = flags.url;

  if (!url) {
    if (!state) {
      finish(2, {
        error: `no state file at ${stateFile}; run up, or pass --url to check an instance on purpose`,
      });
    }

    url = state.url;

    if (refusedPort(currentFlow, state.port)) {
      finish(2, {
        error: `port ${state.port} belongs to the main checkout; pass --url to check it on purpose`,
      });
    }

    const rows = processTable();
    const [rootRecord] = state.tree;
    const live = rows.find((row) => row.pid === state.pid);
    const alive = matches(rootRecord, live);
    check(
      'process-alive',
      alive ? 'pass' : 'fail',
      alive
        ? `pid ${state.pid} started ${state.start}`
        : live
          ? `pid ${state.pid} runs, but not with the recorded start time and command line`
          : `pid ${state.pid} is not running`,
    );
    // The tree refresh is doctor's one write.
    const tree = refreshed(state.tree, rows);

    if (tree.length !== state.tree.length) {
      writeState({ ...state, tree });
    }

    const owned = liveMembers(tree, rows);
    const problems = state.ports.flatMap(({ name, port }) => {
      const holders = listeners(port);
      const foreign = holders.filter((holder) => !owned.has(holder));

      return holders.length === 0
        ? [`${name} ${port} not listening`]
        : foreign.length > 0
          ? [
              `${name} ${port} held by PID ${foreign.join(', ')}, not the recorded tree`,
            ]
          : [];
    });
    check(
      'ports',
      problems.length === 0 ? 'pass' : 'fail',
      problems.length > 0
        ? problems.join('; ')
        : state.ports
            .map(
              ({ name, port, kind, reason }) =>
                `${name} ${port} (${kind}${reason === undefined ? '' : `: ${reason}`})`,
            )
            .join(', '),
    );

    if (state.mode === 'serve') {
      const errors = serverLog(state)
        .split(/\r?\n/)
        .filter((line) => /\[ERROR\]|^Error:/.test(line));
      check(
        'build-log',
        errors.length === 0 ? 'pass' : 'fail',
        errors.length === 0
          ? `no [ERROR] in ${state.logFile}`
          : errors.slice(0, 3).join(' | '),
      );
    } else {
      // `up` runs the Nx build first, so the bundle matched the sources at
      // launch; a cache restore keeps the original build's mtimes, so compare
      // the sources with the launch time, not with the bundle.
      const built = serverLog(state).includes(
        `nx run yeti-app:build:${state.configuration}`,
      );
      const newest = newestSource();
      const fresh =
        built &&
        typeof newest !== 'string' &&
        newest.mtimeMs < Date.parse(String(state.start));
      const changed =
        typeof newest === 'string'
          ? newest
          : `newest: ${String(newest.file)} at ${new Date(newest.mtimeMs).toISOString()}`;
      check(
        'build-fresh',
        fresh ? 'pass' : 'fail',
        !built
          ? `no yeti-app:build:${state.configuration} run in ${state.logFile}`
          : fresh
            ? `yeti-app:build:${state.configuration} ran at launch and none of the files Git lists under ${sourceDirs.join(', ')} changed since (${changed})`
            : typeof newest === 'string'
              ? newest
              : `${changed}, after the launch; run down and up`,
      );
    }
  } else {
    check('process-alive', 'skip', '--url names the instance');
    check('ports', 'skip', '--url given; ownership not checked');
  }

  /** @type {typeof import('playwright')} */
  const { chromium } = requireFromRoot('playwright');
  let browser;

  try {
    browser = await chromium.launch();
  } catch (error) {
    finish(2, {
      error: `chromium did not launch (npx playwright install chromium): ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  const page = await browser.newPage();
  /** @type {{ type: string, text: string }[]} */
  const messages = [];
  page.on('console', (message) =>
    messages.push({ type: message.type(), text: message.text() }),
  );
  page.on('pageerror', (error) =>
    messages.push({ type: 'pageerror', text: error.message }),
  );
  const response = await page
    .goto(`${url}${readyPath}`)
    .catch((error) => error);
  const status = typeof response?.status === 'function' ? response.status() : 0;
  const shown =
    status === 200 &&
    (await page
      .locator('app-root h1')
      .textContent({ timeout: 5000 })
      .catch(() => null)) === marker;
  check(
    'page-marker',
    shown ? 'pass' : 'fail',
    shown
      ? `${url}${readyPath} answered 200 with "${marker}"`
      : `status ${status}, marker missing`,
  );
  // The page is probed on every run, and a probe that could not run leaves
  // the build unknown, never production. A recorded launch must agree with it.
  const ng = shown
    ? await page
        .evaluate(
          () =>
            typeof (/** @type {{ ng?: unknown }} */ (globalThis).ng) ===
            'object',
        )
        .catch(() => null)
    : null;
  const probed = ng === null ? null : ng ? 'development' : 'production';
  const recorded = fromState && state ? state.configuration : null;
  const build = probed ?? recorded;
  const found = `${String(probed)} build (window.ng ${probed === 'development' ? 'present' : 'absent'})`;

  check(
    'build',
    probed !== null && (!fromState || probed === recorded) ? 'pass' : 'fail',
    probed === null
      ? 'the page probe failed; build unknown'
      : fromState && probed !== recorded
        ? `the state file records ${String(recorded)}, the page is a ${found}`
        : found,
  );

  if (build === 'development') {
    const logged = () =>
      messages.find((message) => hydrationSummary.test(message.text))?.text;
    for (let waited = 0; !logged() && waited < 15000; waited += 250) {
      await sleep(250);
    }

    const summary = logged() ?? null;
    const ng05 = messages.filter((message) => /NG05\d\d/.test(message.text));
    const clean =
      summary?.includes(', 0 component(s) were skipped.') && ng05.length === 0;
    check(
      'hydration',
      clean ? 'pass' : 'fail',
      summary
        ? `${summary}${ng05.length ? ` plus ${ng05.length} NG05xx message(s)` : ''}`
        : 'no hydration summary logged',
    );
  } else if (build === 'production') {
    check('hydration', 'skip', 'production builds log no hydration summary');
  } else {
    check('hydration', 'fail', 'build unknown');
  }

  const errors = messages.filter(
    (message) => message.type === 'error' || message.type === 'pageerror',
  );
  check(
    'console-errors',
    errors.length === 0 ? 'pass' : 'fail',
    errors.length === 0
      ? 'none on first load'
      : errors
          .map((message) => message.text)
          .slice(0, 3)
          .join(' | '),
  );
  await browser.close();
  // A stale feature map does not make the instance unhealthy, so a warning
  // here never reaches `failed`.
  const fresh = mapFresh(skillDir);
  check('map-fresh', fresh.status, fresh.detail);
  const failed = checks
    .filter((entry) => entry.status === 'fail')
    .map((entry) => entry.name);
  finish(failed.length === 0 ? 0 : 1, { url, build, failed, checks });
}

function info() {
  const state = readState();

  if (!state) {
    finish(2, { error: `no state file at ${stateFile}` });
  }

  finish(0, { ...state, sessions: sessionsOf(state.session), stateFile });
}

async function down() {
  const state = readState();

  if (!state) {
    finish(2, {
      error: `no state file at ${stateFile}; nothing recorded to stop`,
    });
  }

  const [rootRecord] = state.tree;
  const live = processTable().find((row) => row.pid === rootRecord.pid);

  // Never close-all: it reaches every playwright-cli session on the machine.
  const entry = playwrightCli();
  const sessions = [];

  for (const session of sessionsOf(state.session)) {
    sessions.push(await closeSession(entry, session));
  }

  const { records, result } = stopTree(state.tree);
  const summary = stopSummary(result);
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

  if (rootRefused !== undefined || survived.length > 0) {
    writeState({ ...state, tree: records });
    finish(2, {
      error:
        rootRefused === undefined
          ? `${survived.map((record) => `${describe(record)} still runs after the last round`).join('; ')}; state kept at ${stateFile}; run down again`
          : `pid ${state.pid} does not match the recorded start time or command line; refusing to stop it, and stopped the other recorded processes that still match; state kept at ${stateFile}`,
      ...(rootRefused === undefined || live === undefined
        ? {}
        : { recorded: describe(rootRecord), live: describe(live) }),
      ...summary,
      notes,
      sessions,
      stateFile,
    });
  }

  let portFree = false;
  /** @type {string | null} */
  let listenerError = null;
  /** @type {number[] | null} */
  let listenerPids = null;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await sleep(500);
    const query = queryListeners(state.port);
    listenerError = query.error;
    listenerPids = query.pids;
    portFree = query.pids !== null && query.pids.length === 0;

    // A query that failed or timed out ends the wait: a hung pwsh would
    // otherwise hold every attempt for the full timeout.
    if (portFree || query.pids === null) {
      break;
    }
  }

  const report = {
    pid: state.pid,
    recordedPidRunning: live !== undefined,
    ...summary,
    notes,
    port: state.port,
    portFree,
    ...(listenerError === null ? {} : { listenerError }),
    session: state.session,
    sessions,
    evidenceDir: state.evidenceDir,
    evidenceKept: existsSync(state.evidenceDir),
  };
  // Every recorded process is stopped or gone by now, so another down could
  // do no more: the state file goes. A listener left on the port is outside
  // the recorded tree, so it may be another session's instance or the user's
  // own; it is named, never offered for stopping.
  rmSync(stateFile, { force: true });
  const rows = listenerPids === null || portFree ? [] : processTable();
  /** @param {number} holder */
  const holderLine = (holder) => {
    const row = rows.find((candidate) => candidate.pid === holder);

    return row === undefined ? `PID ${holder}` : describe(row);
  };
  const unclosed = sessions.filter(({ outcome }) => sessionLeftOpen(outcome));
  const problems = [
    ...(portFree
      ? []
      : [
          listenerPids === null
            ? `port ${state.port} not confirmed free (${listenerError})`
            : `port ${state.port} still held by ${listenerPids.map(holderLine).join(', ')}, not the recorded tree; it may be another session's instance or the user's own, so down left it running`,
        ]),
    ...unclosed.map(
      ({ session, outcome }) =>
        `playwright-cli session ${session} ${outcome}; close it with playwright-cli -s=${session} close`,
    ),
  ];

  if (problems.length > 0) {
    finish(1, {
      error: `teardown incomplete: ${problems.join('; ')}${portFree ? '' : `; removed ${stateFile}`}`,
      ...report,
    });
  }

  finish(0, {
    ...report,
    ...(live ? {} : { warnings: [`pid ${state.pid} was not running`] }),
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

if (!run) {
  finish(2, { error: usage });
}

try {
  await run();
} catch (error) {
  finish(2, { error: withLaunchNote(`could not run: ${String(error)}`) });
}
