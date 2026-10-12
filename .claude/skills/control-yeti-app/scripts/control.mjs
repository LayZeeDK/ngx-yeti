#!/usr/bin/env node
// Launch, health-check, describe and stop one Fixture app (yeti-app)
// instance per checkout. Driving stays in playwright-cli.
// Usage: node control.mjs <up|doctor|info|down> [--mode serve|ssr]
//   [--configuration development|production] [--port N] [--url URL] [--json]
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const scratch = join(root, 'tmp', 'control-yeti-app');
const stateFile = join(scratch, 'state.json');
const requireFromRoot = createRequire(join(root, 'package.json'));

// The main checkout's documented ports: `nx serve` keeps the dev-server
// default, and server.ts listens on PORT or 4000.
const mainPorts = { serve: 4200, ssr: 4000 };
const worktreeRange = { first: 4600, size: 200 };
const marker = 'Welcome yeti-app';
const readyPath = 'card';
const hydrationSummary =
  /^Angular hydrated \d+ component\(s\) and \d+ node\(s\), \d+ component\(s\) were skipped\./;

const valueFlags = ['mode', 'configuration', 'port', 'url', 'timeout'];
const sessionName = /^[\w-]+$/;

const [command, ...rest] = process.argv.slice(2);
const json = rest.includes('--json');
const flags = parseFlags(rest);

// Only `--json` and `--<name>=<value>` for the names above: a mistyped name or
// a value after a space must not fall back to a default.
function parseFlags(args) {
  const result = {};

  for (const arg of args) {
    if (arg === '--json') {
      continue;
    }

    const match = /^--([^=]+)=(.+)$/.exec(arg);

    if (!match || !valueFlags.includes(match[1])) {
      finish(2, {
        error: `unknown argument ${arg}; flags are --json and ${valueFlags.map((name) => `--${name}=<value>`).join(', ')}`,
      });
    }

    result[match[1]] = match[2];
  }

  return result;
}

const positiveInteger = (value) => Number.isInteger(value) && value > 0;
const validPort = (value) => positiveInteger(value) && value <= 65535;

function finish(code, result) {
  if (json) {
    process.stdout.write(
      `${JSON.stringify({ command, exit: code, ...result }, null, 2)}\n`,
    );
  } else {
    for (const check of result.checks ?? []) {
      const tag = { pass: '[OK]', fail: '[ERROR]', skip: '[SKIP]' }[
        check.status
      ];
      process.stdout.write(`${tag} ${check.name}: ${check.detail}\n`);
    }

    const tag = code === 0 ? '[OK]' : code === 1 ? '[WARN]' : '[ERROR]';
    process.stdout.write(
      `${tag} ${command ?? ''} ${JSON.stringify({ ...result, checks: undefined })}\n`,
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

function derivedPort(currentFlow, mode) {
  if (!currentFlow.worktree) {
    return mainPorts[mode];
  }

  const hash = createHash('sha1').update(root.toLowerCase()).digest();

  return worktreeRange.first + (hash.readUInt32BE(0) % worktreeRange.size);
}

function refusedPort(currentFlow, port) {
  return currentFlow.worktree && Object.values(mainPorts).includes(port);
}

// ponytail: Windows only (Lars's platform); add a `ps -eo` reader when
// another OS needs the script.
function processTable() {
  if (process.platform !== 'win32') {
    finish(2, { error: `unsupported platform ${process.platform}` });
  }

  const script =
    "Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CommandLine,@{n='Start';e={$_.CreationDate.ToUniversalTime().ToString('o')}} | ConvertTo-Json -Compress";
  const run = spawnSync(
    'pwsh',
    ['-NoProfile', '-NonInteractive', '-Command', script],
    {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      windowsHide: true,
    },
  );

  if (run.status !== 0) {
    finish(2, { error: `process table: ${run.stderr || run.error}` });
  }

  return new Map(
    JSON.parse(run.stdout).map((entry) => [entry.ProcessId, entry]),
  );
}

function tree(table, pid) {
  const pids = new Set([pid]);
  let grew = true;

  while (grew) {
    grew = false;

    for (const entry of table.values()) {
      if (pids.has(entry.ParentProcessId) && !pids.has(entry.ProcessId)) {
        pids.add(entry.ProcessId);
        grew = true;
      }
    }
  }

  return [...pids].filter((member) => table.has(member));
}

// Get-NetTCPConnection, not netstat: netstat translates its state column.
function listeners(port) {
  const run = spawnSync(
    'pwsh',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `Get-NetTCPConnection -State Listen -LocalPort ${String(port)} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess; exit 0`,
    ],
    { encoding: 'utf8', windowsHide: true },
  );

  if (run.status !== 0) {
    finish(2, { error: `listeners on ${port}: ${run.stderr || run.error}` });
  }

  return [...new Set(run.stdout.split(/\r?\n/).filter(Boolean).map(Number))];
}

// The recorded session, PIDs and port reach commands, so a state file that
// holds anything else is refused before any of them runs.
function readState() {
  if (!existsSync(stateFile)) {
    return null;
  }

  const state = JSON.parse(readFileSync(stateFile, 'utf8'));
  const pids = [state.pid, ...(state.survivors ?? []).map(({ pid }) => pid)];

  if (
    typeof state.session !== 'string' ||
    !sessionName.test(state.session) ||
    !pids.every(positiveInteger) ||
    !validPort(state.port)
  ) {
    finish(2, {
      error: `refused: ${stateFile} records a session outside [\\w-], a PID that is not a positive integer or an invalid port; nothing was run`,
      stateFile,
    });
  }

  return state;
}

// The shim's own script under this Node: the session name never passes
// through a shell.
function playwrightCli() {
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
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

function closeSession(entry, session) {
  if (!entry) {
    return { session, outcome: 'absent', detail: 'no playwright-cli on PATH' };
  }

  const run = spawnSync(process.execPath, [entry, `-s=${session}`, 'close'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 30000,
    windowsHide: true,
  });
  const output = `${run.stdout ?? ''}${run.stderr ?? ''}`.trim();

  if (run.error?.code === 'ETIMEDOUT') {
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

function stopDaemon() {
  const run = spawnSync(
    process.execPath,
    [requireFromRoot.resolve('nx'), 'daemon', '--stop'],
    { cwd: root, encoding: 'utf8', timeout: 60000, windowsHide: true },
  );

  return run.status === 0
    ? { stopped: true }
    : {
        stopped: false,
        detail: `exit ${run.status}: ${`${run.stdout ?? ''}${run.stderr ?? ''}`.trim() || run.error}`,
      };
}

async function fetchPage(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

    return { status: response.status, body: await response.text() };
  } catch (error) {
    return { status: 0, body: String(error) };
  }
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function up() {
  const currentFlow = flow();
  const mode = flags.mode ?? 'serve';
  const configuration = flags.configuration ?? 'development';

  if (
    !['serve', 'ssr'].includes(mode) ||
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

  const port = flags.port ? Number(flags.port) : derivedPort(currentFlow, mode);

  if (refusedPort(currentFlow, port)) {
    finish(2, {
      error: `port ${port} belongs to the main checkout; a worktree uses its derived port ${derivedPort(currentFlow, mode)}`,
    });
  }

  const owners = listeners(port);

  if (owners.length > 0) {
    finish(2, {
      error: `port ${port} is in use by pid ${owners.join(', ')}; not starting`,
    });
  }

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

  const started = Date.now();
  const child = spawn(process.execPath, nxArgs, {
    cwd: root,
    detached: true,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', log, log],
    windowsHide: true,
  });
  child.unref();
  const live = processTable().get(child.pid);
  const url = `http://localhost:${port}/sub/`;
  const state = {
    flow: currentFlow.id,
    worktree: currentFlow.worktree,
    mode,
    configuration,
    pid: child.pid,
    start: live?.Start ?? null,
    commandLine: live?.CommandLine ?? null,
    port,
    url,
    session: currentFlow.session,
    evidenceDir,
    logFile,
  };
  writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);
  const timeout = timeoutSeconds * 1000;

  while (Date.now() - started < timeout) {
    if (child.exitCode !== null || !processTable().has(child.pid)) {
      rmSync(stateFile, { force: true });
      finish(1, {
        error: `the launch exited before it was ready; see ${logFile}`,
        logFile,
      });
    }

    const page = await fetchPage(`${url}${readyPath}`);

    if (page.status === 200 && page.body.includes(marker)) {
      const owned = tree(processTable(), child.pid);
      const listening = listeners(port);

      if (!listening.some((pid) => owned.includes(pid))) {
        finish(1, {
          error: `port ${port} answers but pid ${listening.join(', ')} is not in the started tree`,
          ...state,
        });
      }

      finish(0, {
        ...state,
        readySeconds: Math.round((Date.now() - started) / 1000),
      });
    }

    await sleep(2000);
  }

  finish(1, {
    error: `not ready after ${timeout / 1000}s; run down; see ${logFile}`,
    ...state,
  });
}

// Nx colours its output even into a file.
function serverLog(state) {
  return stripVTControlCharacters(readFileSync(state.logFile, 'utf8'));
}

// Directories whose files change without changing the build.
const notSource = ['node_modules', 'storybook-static', 'dist'];
const sourceDirs = ['apps/yeti-app', 'packages/ngx-yeti', 'vendor/yeti'];

function newestSource(dir) {
  let newest = 0;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (notSource.includes(entry.name)) {
      continue;
    }

    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      newest = Math.max(newest, newestSource(full));
    } else if (entry.isFile()) {
      newest = Math.max(newest, statSync(full).mtimeMs);
    }
  }

  return newest;
}

async function doctor() {
  const currentFlow = flow();
  const state = readState();
  const checks = [];
  const check = (name, status, detail) => checks.push({ name, status, detail });
  const fromState = !flags.url;
  let url = flags.url;

  if (!url && !state) {
    finish(2, {
      error: `no state file at ${stateFile}; run up, or pass --url to check an instance on purpose`,
    });
  }

  if (!url) {
    url = state.url;

    if (refusedPort(currentFlow, state.port)) {
      finish(2, {
        error: `port ${state.port} belongs to the main checkout; pass --url to check it on purpose`,
      });
    }

    const table = processTable();
    const live = table.get(state.pid);
    check(
      'process-alive',
      live ? 'pass' : 'fail',
      live
        ? `pid ${state.pid} started ${live.Start}`
        : `pid ${state.pid} is not running`,
    );
    const owned = live ? tree(table, state.pid) : [];
    const listening = listeners(state.port);
    const owner = listening.find((pid) => owned.includes(pid));
    check(
      'port-owned',
      owner ? 'pass' : 'fail',
      owner
        ? `port ${state.port} listened on by pid ${owner} in the recorded tree`
        : `port ${state.port} listeners: ${listening.join(', ') || 'none'}`,
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
      const sources = Math.max(
        ...sourceDirs.map((dir) => newestSource(join(root, dir))),
      );
      const fresh = built && sources < Date.parse(state.start);
      const scanned = `${sourceDirs.join(', ')} (${notSource.join(', ')} skipped)`;
      check(
        'build-fresh',
        fresh ? 'pass' : 'fail',
        fresh
          ? `yeti-app:build:${state.configuration} ran at launch and no file in ${scanned} changed since`
          : built
            ? `a file in ${scanned} changed after launch; run down and up`
            : `no yeti-app:build:${state.configuration} run in ${state.logFile}`,
      );
    }
  } else {
    check('process-alive', 'skip', '--url names the instance');
    check('port-owned', 'skip', '--url names the instance');
  }

  const { chromium } = requireFromRoot('playwright');
  let browser;

  try {
    browser = await chromium.launch();
  } catch (error) {
    finish(2, {
      error: `chromium did not launch (npx playwright install chromium): ${error.message}`,
    });
  }

  const page = await browser.newPage();
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
  // A recorded launch knows its build. An instance named by --url is probed,
  // and a probe that could not run leaves the build unknown, never production.
  let build = fromState ? state.configuration : null;

  if (!fromState && shown) {
    const ng = await page
      .evaluate(() => typeof globalThis.ng === 'object')
      .catch(() => null);
    build = ng === null ? null : ng ? 'development' : 'production';
  }

  check(
    'build',
    build ? 'pass' : 'fail',
    build
      ? fromState
        ? `${build} build (state file)`
        : `${build} build (window.ng ${build === 'development' ? 'present' : 'absent'})`
      : 'the page probe failed; build unknown',
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

  finish(0, state);
}

async function down() {
  const state = readState();

  if (!state) {
    finish(2, {
      error: `no state file at ${stateFile}; nothing recorded to stop`,
    });
  }

  const table = processTable();
  const live = table.get(state.pid);
  const same = (entry, recorded) =>
    entry?.Start === recorded.start &&
    entry?.CommandLine === recorded.commandLine;
  let members;
  let sessions = [];

  if (live) {
    if (!same(live, state)) {
      finish(2, {
        error: `pid ${state.pid} does not match the recorded start time or command; refusing to stop it`,
        recorded: { start: state.start, commandLine: state.commandLine },
        live: { start: live.Start, commandLine: live.CommandLine },
      });
    }

    // Never close-all: it reaches every playwright-cli session on the machine.
    const entry = playwrightCli();
    sessions = [state.session, `${state.session}-jsoff`].map((session) =>
      closeSession(entry, session),
    );

    members = tree(table, state.pid).map((pid) => table.get(pid));
    spawnSync('taskkill', ['/PID', String(state.pid), '/T', '/F'], {
      encoding: 'utf8',
      windowsHide: true,
    });
  } else {
    // A retry after an incomplete teardown: stop only the survivors an
    // earlier down recorded that are still the same processes.
    members = (state.survivors ?? [])
      .filter((recorded) => same(table.get(recorded.pid), recorded))
      .map((recorded) => table.get(recorded.pid));

    for (const member of members) {
      spawnSync('taskkill', ['/PID', String(member.ProcessId), '/T', '/F'], {
        encoding: 'utf8',
        windowsHide: true,
      });
    }
  }

  let portFree = false;
  let survivors = members;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await sleep(500);
    const after = processTable();
    survivors = members.filter(
      (member) => after.get(member.ProcessId)?.Start === member.Start,
    );
    portFree = listeners(state.port).length === 0;

    if (portFree && survivors.length === 0) {
      break;
    }
  }

  const daemon = stopDaemon();
  const result = {
    pid: state.pid,
    stopped: members.map((member) => member.ProcessId),
    survivors: survivors.map((member) => member.ProcessId),
    port: state.port,
    portFree,
    session: state.session,
    sessions,
    daemon,
    evidenceDir: state.evidenceDir,
    evidenceKept: existsSync(state.evidenceDir),
  };

  if (!portFree || survivors.length > 0) {
    writeFileSync(
      stateFile,
      `${JSON.stringify(
        {
          ...state,
          survivors: survivors.map((member) => ({
            pid: member.ProcessId,
            start: member.Start,
            commandLine: member.CommandLine,
          })),
        },
        null,
        2,
      )}\n`,
    );
    finish(1, {
      error: `teardown incomplete; state kept at ${stateFile}; run down again`,
      ...result,
      stateFile,
    });
  }

  rmSync(stateFile, { force: true });
  const unclosed = sessions.filter(({ outcome }) =>
    ['timeout', 'failed'].includes(outcome),
  );

  if (unclosed.length > 0 || !daemon.stopped) {
    finish(1, {
      error: `teardown incomplete: ${[
        ...unclosed.map(
          ({ session, outcome }) =>
            `playwright-cli session ${session} ${outcome}; close it with playwright-cli -s=${session} close`,
        ),
        ...(daemon.stopped ? [] : ['nx daemon --stop failed']),
      ].join('; ')}`,
      ...result,
    });
  }

  finish(0, result);
}

const commands = { up, doctor, info, down };

if (!commands[command]) {
  finish(2, {
    error:
      'usage: control.mjs <up|doctor|info|down> [--mode serve|ssr] [--configuration development|production] [--port N] [--url URL] [--timeout S] [--json]',
  });
}

await commands[command]();
