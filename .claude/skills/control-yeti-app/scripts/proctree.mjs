// @ts-check
// The process tree a control skill's run started: record it, keep it after a parent exits, and stop it by PID.
// Byte-copied into every control skill beside fingerprint.mjs; never edited there. Contract:
// lars-create-verification references/generated-skill.md, "Process trees".
// Windows reads one Win32_Process query through PowerShell; Linux and macOS read `ps`; other platforms throw.
// Nothing here prints: callers print `describe(record)`, which escapes the command line.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { printable } from './fingerprint.mjs';

/**
 * One process as recorded: `start` is when it started, in milliseconds since the epoch (whole seconds from `ps`).
 * PID plus start names one process; a PID alone can belong to another process once the first exits.
 * @typedef {object} ProcRecord
 * @property {number} pid
 * @property {number} ppid
 * @property {number} start
 * @property {string | null} commandLine  null when the system would not say
 */

/**
 * Why `stop` left a record alone: `reused` its PID now belongs to a process with another start time or command
 * line; `helper` it is a shared helper; `caller` it is the process running `stop`; `survived` it was still running
 * after the last round.
 * @typedef {'reused' | 'helper' | 'caller' | 'survived'} RefusedReason
 */

/**
 * @typedef {object} StopResult
 * @property {ProcRecord[]} stopped  matched and stopped by this call
 * @property {ProcRecord[]} gone  already exited, or exited without being stopped here
 * @property {(ProcRecord & { reason: RefusedReason })[]} refused  never stopped
 */

/**
 * @typedef {object} StopOptions
 * @property {() => ProcRecord[]} [table]  the live process table; defaults to `processTable`
 * @property {(records: ProcRecord[]) => void} [kill]  stops each record's PID alone; by default a forced stop
 *   that, on Windows, first checks the PID's start time again on the process itself
 * @property {(ms: number) => void} [pause]  waits between rounds
 * @property {number} [rounds]  at most this many rounds; default 10
 */

// Shared helpers a run may start but never owns: other sessions in the checkout use them. Matched on the
// command line only to leave them out; never to stop anything. Nx spawns its daemon as
// `node <nx>/src/daemon/server/start.js` up to Nx 22 and `node <nx>/dist/src/daemon/server/start.js` from Nx 23
// (src/daemon/client/client.js in each).
export const SHARED_HELPERS = [/[\\/]nx[\\/](?:dist[\\/])?src[\\/]daemon[\\/]server[\\/]start\.js(?![\w.])/i];

// A fixed query: no value from a caller or a state file is ever put into it.
const QUERY =
  "[Console]::OutputEncoding = [Text.Encoding]::UTF8; Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,@{n='Start';e={if ($_.CreationDate) { ([DateTimeOffset]$_.CreationDate).ToUnixTimeMilliseconds() } else { $null }}},CommandLine | ConvertTo-Json -Compress";

/**
 * @param {string | null} commandLine
 * @returns {boolean} whether the command line is a shared helper's
 */
export function isSharedHelper(commandLine) {
  return commandLine !== null && SHARED_HELPERS.some((pattern) => pattern.test(commandLine));
}

/**
 * @param {ProcRecord} record
 * @param {ProcRecord | undefined} row  the live process with the record's PID, if any
 * @returns {boolean} whether the live process is the recorded one: same PID, start time and command line
 */
export function matches(record, row) {
  return row !== undefined && row.pid === record.pid && row.start === record.start && row.commandLine === record.commandLine;
}

/**
 * A short line for a terminal: the PID and the first 120 characters of the command line, escaped.
 * @param {ProcRecord} record
 * @returns {string}
 */
export function describe(record) {
  return `PID ${record.pid} (${printable((record.commandLine ?? 'command line unknown').slice(0, 120))})`;
}

/**
 * @param {unknown} row
 * @returns {ProcRecord | null}
 */
function fromWindows(row) {
  if (row === null || typeof row !== 'object') {
    return null;
  }

  const { ProcessId: pid, ParentProcessId: ppid, Start: start, CommandLine: commandLine } = /** @type {Record<string, unknown>} */ (row);

  if (typeof pid !== 'number' || typeof ppid !== 'number' || typeof start !== 'number') {
    return null;
  }

  return { pid, ppid, start, commandLine: typeof commandLine === 'string' ? commandLine : null };
}

/**
 * The rows of `ps -A -o pid= -o ppid= -o lstart= -o args=` under LC_ALL=C.
 * @param {string} text
 * @returns {ProcRecord[]}
 */
export function parsePs(text) {
  /** @type {ProcRecord[]} */
  const rows = [];

  for (const line of text.split('\n')) {
    const found = /^\s*(\d+)\s+(\d+)\s+(\w{3}\s+\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\d{4})\s?(.*)$/.exec(line);
    const start = found === null ? NaN : Date.parse(found[3] ?? '');

    if (found !== null && Number.isFinite(start)) {
      rows.push({ pid: Number(found[1]), ppid: Number(found[2]), start, commandLine: found[4] ?? null });
    }
  }

  return rows;
}

/**
 * Runs a PowerShell command on Windows: PowerShell 7 or Windows PowerShell, by absolute path only, since a program
 * found through PATH or the working directory could be planted by a repository.
 * @param {string} command
 * @returns {string} its standard output
 */
function powershell(command) {
  const pwsh = join(process.env['ProgramFiles'] ?? 'C:\\Program Files', 'PowerShell', '7', 'pwsh.exe');
  const shell = existsSync(pwsh)
    ? pwsh
    : join(process.env['SystemRoot'] ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  const result = spawnSync(shell, ['-NoProfile', '-NonInteractive', '-Command', command], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: 60_000,
    windowsHide: true,
  });

  if (result.error || result.status !== 0) {
    throw new Error(`PowerShell failed: ${printable(result.error?.message ?? result.stderr.trim())}`);
  }

  return result.stdout;
}

/**
 * Every live process, from one query.
 * @returns {ProcRecord[]}
 */
export function processTable() {
  if (process.platform === 'win32') {
    const text = powershell(QUERY).trim();

    return text === '' ? [] : [JSON.parse(text)].flat().flatMap((row) => fromWindows(row) ?? []);
  }

  if (process.platform === 'linux' || process.platform === 'darwin') {
    const ps = ['/bin/ps', '/usr/bin/ps'].find((path) => existsSync(path));

    if (ps === undefined) {
      throw new Error('process query failed: no /bin/ps or /usr/bin/ps');
    }

    // -ww: never cut the command line to the terminal width, or a shared helper's path could be lost.
    const result = spawnSync(ps, ['-ww', '-A', '-o', 'pid=', '-o', 'ppid=', '-o', 'lstart=', '-o', 'args='], {
      encoding: 'utf8',
      env: { ...process.env, LC_ALL: 'C' },
      maxBuffer: 64 * 1024 * 1024,
      timeout: 60_000,
    });

    if (result.error || result.status !== 0) {
      throw new Error(`process query failed: ${printable(result.error?.message ?? result.stderr.trim())}`);
    }

    return parsePs(result.stdout);
  }

  throw new Error(`process trees are not supported on ${process.platform}; only win32, linux and darwin`);
}

/**
 * The live processes below `roots` in `rows` (the roots excluded). A child counts only when it started no earlier
 * than its parent, so a process whose parent PID was reused is never taken in; a shared helper and everything
 * below it are left out.
 * @param {ProcRecord[]} rows
 * @param {ProcRecord[]} roots  live rows
 * @returns {ProcRecord[]}
 */
function below(rows, roots) {
  /** @type {Map<number, ProcRecord>} */
  const tree = new Map(roots.map((row) => [row.pid, row]));
  /** @type {ProcRecord[]} */
  const found = [];
  let grew = true;

  while (grew) {
    grew = false;

    for (const row of rows) {
      const parent = tree.get(row.ppid);

      if (parent !== undefined && !tree.has(row.pid) && row.start >= parent.start && !isSharedHelper(row.commandLine)) {
        tree.set(row.pid, row);
        found.push(row);
        grew = true;
      }
    }
  }

  return found;
}

/**
 * The live tree under a process: the root and every descendant, shared helpers left out.
 * @param {number | ProcRecord} root  a PID only right after the caller spawned it; otherwise the recorded root,
 *   and a live process that does not match it (another start time or command line) gives an empty tree
 * @param {{ table?: () => ProcRecord[], notBefore?: number, notAfter?: number }} [options]  both required with a
 *   PID root: `Date.now()` taken just before the spawn and just after it returned. A process holding the PID that
 *   started outside that window (a second of slack before it for whole-second `ps` times, 50 ms after it) is not
 *   the spawned one, whose PID was reused, and gives an empty tree
 * @returns {ProcRecord[]}
 */
export function snapshot(root, { table = processTable, notBefore, notAfter } = {}) {
  if (typeof root === 'number' && (notBefore === undefined || notAfter === undefined)) {
    throw new TypeError('snapshot(<PID>) needs notBefore and notAfter, the times just before and after the spawn');
  }

  const rows = table();
  const pid = typeof root === 'number' ? root : root.pid;
  const live = rows.find((row) => row.pid === pid);

  if (
    live === undefined ||
    (typeof root === 'number'
      ? live.start < (notBefore ?? 0) - 1000 || live.start > (notAfter ?? 0) + 50
      : !matches(root, live)) ||
    isSharedHelper(live.commandLine)
  ) {
    return [];
  }

  return [live, ...below(rows, [live])];
}

/**
 * The union of two lists of records, keyed by PID and start time, so a process seen once stays recorded after it
 * or its parent exits. Shared helpers are dropped.
 * @param {ProcRecord[]} recorded
 * @param {ProcRecord[]} live
 * @returns {ProcRecord[]}
 */
export function merge(recorded, live) {
  /** @type {Map<string, ProcRecord>} */
  const all = new Map();

  for (const record of [...recorded, ...live]) {
    if (!isSharedHelper(record.commandLine)) {
      all.set(`${record.pid}@${record.start}`, record);
    }
  }

  return [...all.values()];
}

/**
 * A forced stop of each record's PID alone, never its tree. On Windows one PowerShell call opens each process by
 * PID, compares its start time with the record once more, and stops it only when they are equal, so a PID reused
 * since the last table read is left alone. Only numbers enter that command.
 * @param {ProcRecord[]} records
 * @returns {void}
 */
function forceKill(records) {
  const targets = records.filter((record) => Number.isSafeInteger(record.pid) && Number.isSafeInteger(record.start));

  if (targets.length === 0) {
    return;
  }

  if (process.platform === 'win32') {
    const pairs = targets.flatMap((record) => [record.pid, record.start]).join(',');

    try {
      // `$p.Handle` opens one handle that the start-time check and Kill() then share; while it is open, Windows
      // cannot hand the PID to another process.
      powershell(
        `$t = @(${pairs}); for ($i = 0; $i -lt $t.Count; $i += 2) { try { $p = [Diagnostics.Process]::GetProcessById($t[$i]); $null = $p.Handle; if (([DateTimeOffset]$p.StartTime).ToUnixTimeMilliseconds() -eq $t[$i + 1]) { $p.Kill() } } catch {} }`,
      );
    } catch {
      // A failed call stops nothing; the next table read reports each record as stopped, gone or survived.
    }

    return;
  }

  // ponytail: on Linux and macOS the PID is not checked again between the table read and the signal; PIDs there
  // are handed out in order, so a reuse inside that window needs the PID space to wrap.
  for (const record of targets) {
    try {
      process.kill(record.pid, 'SIGKILL');
    } catch {
      // Exited already; the next round sees it gone.
    }
  }
}

/**
 * @param {number} ms
 * @returns {void}
 */
function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * The PIDs of the calling process and its live ancestors, each parent no younger than its child.
 * @param {Map<number, ProcRecord>} rows
 * @returns {Set<number>}
 */
function callerChain(rows) {
  const chain = new Set([process.pid]);

  for (let row = rows.get(process.pid); row !== undefined; ) {
    const parent = rows.get(row.ppid);

    if (parent === undefined || parent.start > row.start || chain.has(parent.pid)) {
      break;
    }

    chain.add(parent.pid);
    row = parent;
  }

  return chain;
}

/**
 * Stops every record whose live process still matches it (PID, start time and command line), children before
 * parents, by PID and never by name. Each round reads the table again, takes in live children of matched records
 * that started since, and stops only records with no live child left. The calling process and its ancestors are
 * never stopped, nor anything reached only through them.
 * @param {ProcRecord[]} records
 * @param {StopOptions} [options]
 * @returns {StopResult}
 */
export function stop(records, { table = processTable, kill = forceKill, pause = sleep, rounds = 10 } = {}) {
  /** @type {StopResult} */
  const result = { stopped: [], gone: [], refused: [] };
  /** @type {Map<string, ProcRecord>} */
  const active = new Map();
  /** @type {Set<string>} */
  const killed = new Set();
  /** @type {(record: ProcRecord) => string} */
  const key = (record) => `${record.pid}@${record.start}`;
  const first = new Map(table().map((row) => [row.pid, row]));
  const caller = callerChain(first);

  for (const record of merge([], records)) {
    const row = first.get(record.pid);

    if (row === undefined) {
      result.gone.push(record);
    } else if (!matches(record, row)) {
      result.refused.push({ ...record, reason: 'reused' });
    } else if (caller.has(record.pid)) {
      result.refused.push({ ...record, reason: 'caller' });
    } else {
      active.set(key(record), record);
    }
  }

  // merge() drops shared helpers; a running one is reported here so the caller sees why it stays running.
  const helpers = new Map(records.filter((record) => isSharedHelper(record.commandLine)).map((record) => [key(record), record]));

  for (const helper of helpers.values()) {
    if (matches(helper, first.get(helper.pid))) {
      result.refused.push({ ...helper, reason: 'helper' });
    } else {
      result.gone.push(helper);
    }
  }

  for (let round = 0; round < rounds && active.size > 0; round += 1) {
    const rows = round === 0 ? [...first.values()] : table();
    const byPid = new Map(rows.map((row) => [row.pid, row]));

    for (const [id, record] of active) {
      if (!matches(record, byPid.get(record.pid))) {
        active.delete(id);
        (killed.has(id) ? result.stopped : result.gone).push(record);
      }
    }

    for (const child of below(rows.filter((row) => !caller.has(row.pid)), [...active.values()])) {
      if (!active.has(key(child))) {
        active.set(key(child), child);
      }
    }

    // A record is a parent only of a record that started no earlier than it, as in below(): a stale PPID that now
    // names a younger record must not keep both waiting.
    const all = [...active.values()];
    const leaves = all.filter((record) => !all.some((child) => child.ppid === record.pid && child.start >= record.start && child !== record));

    kill(leaves);

    for (const leaf of leaves) {
      killed.add(key(leaf));
    }

    if (leaves.length > 0) {
      pause(200);
    }
  }

  const rows = new Map(active.size === 0 ? [] : table().map((row) => [row.pid, row]));

  for (const [id, record] of active) {
    if (matches(record, rows.get(record.pid))) {
      result.refused.push({ ...record, reason: 'survived' });
    } else {
      (killed.has(id) ? result.stopped : result.gone).push(record);
    }
  }

  return result;
}
