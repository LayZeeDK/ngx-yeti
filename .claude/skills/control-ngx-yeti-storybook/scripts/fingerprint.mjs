#!/usr/bin/env node
// @ts-check
// Tells a feature map entry proven against the current source from one whose source changed since: it records the
// git blob hash of every file a feature depends on in the control skill's features/.proven.json, and compares.
// The manifest shape and the doctor's map-fresh line: lars-create-verification references/generated-skill.md.
// A control skill carries a byte copy at scripts/fingerprint.mjs; edit only
// ~/.claude/skills/lars-create-verification/scripts/fingerprint.mjs (check-skill.mjs fails a copy that differs).
// Usage, from anywhere; the skill is this file's parent folder, the repository the checkout that holds it:
//   node fingerprint.mjs record --feature <id> [--entries <path>... | --external <reason>] [--json]
//     Entries are relative to the repository root; without --entries the recorded ones are reused.
//     --external records a feature whose source lives outside the checkout, with no files.
//     Exit 0 written or unchanged, 2 refused.
//   node fingerprint.mjs check [--feature <id>] [--json]
//     Exit 0 every feature fresh or external, 1 one is stale or unproven, 2 could not run.
// Per record or check it spawns `git config` once and `git hash-object --stdin-paths` once (git must be on PATH),
// with line-ending conversion on and every filter driver off, and writes only the manifest.
import { randomBytes } from 'node:crypto';
import { lstatSync, readdirSync, readFileSync, readlinkSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** @typedef {typeof import('typescript')} TypeScript */
/** @typedef {'typescript' | 'entries'} Method */

/**
 * @typedef {object} ProvenEntry
 * @property {string} provenAt  ISO time the feature was proven against these files
 * @property {string | null} commit  HEAD when it was proven, or null when unreadable
 * @property {Method} method  how the file list was found: the TypeScript import closure, or the entries alone
 * @property {string[]} entries  repository-relative, `/`-separated
 * @property {Record<string, string>} files  repository-relative path to git blob hash
 */

/**
 * @typedef {object} ExternalEntry
 * @property {string} recordedAt  ISO time it was recorded
 * @property {string | null} commit  HEAD when it was recorded, or null when unreadable
 * @property {string} external  why its source cannot be fingerprinted, such as where it lives
 */

/** @typedef {ProvenEntry | ExternalEntry} Entry */
/** @typedef {{ version: 1, features: Map<string, Entry> }} Manifest */
/** @typedef {{ path: string, why: string }} Change */

/**
 * @typedef {object} Freshness
 * @property {string} id
 * @property {'fresh' | 'stale' | 'unproven' | 'external'} status
 * @property {Entry | null} proven
 * @property {Change[]} changed
 */

export const MANIFEST = 'features/.proven.json';
export const MAP_FRESH = 'map-fresh';
export const METHODS = /** @type {const} */ (['typescript', 'entries']);
const FEATURE_ID = /^[A-Za-z0-9][\w.-]*$/;
const BLOB = /^[0-9a-f]{40}$/;
const SHA = /^[0-9a-f]{40}(?:[0-9a-f]{24})?$/;
const NETWORK = /^(?:[\\/]{2}|\\\?\?\\)/;
const CODE = /\.(?:[cm]?[jt]s|[jt]sx)$/i;
const TS_SOURCE = /\.(?:[cm]?ts|tsx)$/i;
const MAX_REASON = 500;
// Control, format (bidirectional marks included), surrogate and separator characters, which would let printed
// manifest text rewrite or split the terminal line it is on.
const UNPRINTABLE = /[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/u;
const MAX_MANIFEST = 16 * 1024 * 1024;
const MAX_FILES = 50_000;

/**
 * Throws when `path` is, or reaches through a link, a network or device path. Reads each link's target as text, so
 * a share is never contacted. The same rule as lars-verify's verdict.mjs; this file cannot import it, since a
 * control skill's copy must run without the global skills.
 * @param {string} path
 * @param {number} [depth]
 * @returns {void}
 */
export function assertLocal(path, depth = 0) {
  if (NETWORK.test(path) || /^UNC[\\/]/i.test(path)) {
    throw new Error(`a network or device path: ${path}`);
  }

  if (depth > 20) {
    throw new Error(`more than 20 links: ${path}`);
  }

  const parts = resolve(path).split(sep).filter((part) => part !== '');
  let current = `${parts[0] ?? ''}${sep}`;

  for (const [index, part] of parts.slice(1).entries()) {
    current = join(current, part);
    const stat = lstatSync(current, { throwIfNoEntry: false });

    if (stat === undefined) {
      return;
    }

    if (stat.isSymbolicLink()) {
      assertLocal(join(resolve(dirname(current), readlinkSync(current)), ...parts.slice(index + 2)), depth + 1);

      return;
    }
  }
}

/**
 * @param {string} root
 * @param {string} path  absolute
 * @returns {string[] | null} the path's segments below `root`, or null when it is not below it
 */
function below(root, path) {
  const fromRoot = relative(root, path);

  if (fromRoot === '' || fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
    return null;
  }

  return fromRoot.split(sep);
}

/**
 * Why `path` may not be read, or null when it is a regular file (or, with `kind` 'dir', a directory) inside `root`
 * reached through no link. Only lstat is used, so no link is followed.
 * @param {string} root
 * @param {string} path  absolute
 * @param {'file' | 'dir'} [kind]
 * @returns {string | null}
 */
export function unreadable(root, path, kind = 'file') {
  const segments = below(root, path);

  if (segments === null) {
    return 'outside the repository';
  }

  let current = root;

  for (const segment of segments) {
    current = join(current, segment);
    const stat = lstatSync(current, { throwIfNoEntry: false });

    if (stat === undefined) {
      return 'missing';
    }

    if (stat.isSymbolicLink()) {
      return `goes through the link ${posix(root, current)}`;
    }
  }

  const stat = lstatSync(path);

  if (kind === 'dir' ? !stat.isDirectory() : !stat.isFile()) {
    return kind === 'dir' ? 'not a directory' : 'not a regular file';
  }

  return null;
}

/**
 * @param {string} root
 * @param {string} path  absolute, below root
 * @returns {string}
 */
function posix(root, path) {
  return relative(root, path).split(sep).join('/');
}

/**
 * The one rule for what may be read or recorded: `unreadable` passes, and the on-disk path (the long name of an
 * 8.3 alias, the letter case Windows keeps) is a plain repository path outside node_modules.
 * @param {string} root
 * @param {string} path  absolute
 * @param {'file' | 'dir'} [kind]
 * @returns {{ real: string, problem: null } | { real: null, problem: string }}
 */
export function admit(root, path, kind = 'file') {
  const problem = unreadable(root, path, kind);

  if (problem !== null) {
    return { real: null, problem };
  }

  // No link lies below the root, so this only expands short names and settles letter case.
  const real = realpathSync.native(path);
  const segments = below(root, real);

  if (segments === null || segments.some((segment) => segment.toLowerCase() === 'node_modules')) {
    return { real: null, problem: 'inside node_modules or outside the repository' };
  }

  return safeRelative(segments.join('/')) ? { real, problem: null } : { real: null, problem: 'not a plain repository path' };
}

/**
 * Whether `path` is a repository-relative, `/`-separated path with no `.`, `..`, drive, stream or empty segment,
 * and no character UNPRINTABLE matches.
 * @param {string} path
 * @returns {boolean}
 */
function safeRelative(path) {
  return (
    !UNPRINTABLE.test(path) &&
    path.split('/').every((segment) => segment !== '' && segment !== '.' && segment !== '..' && !/[\\:\0]/.test(segment))
  );
}

/**
 * `text` with every character UNPRINTABLE matches written as a `\u` escape, for printing a message that may quote
 * manifest content.
 * @param {string} text
 * @returns {string}
 */
export function printable(text) {
  return text.replace(new RegExp(UNPRINTABLE.source, 'gu'), (char) => {
    const hex = (char.codePointAt(0) ?? 0).toString(16);

    return hex.length > 4 ? `\\u{${hex}}` : `\\u${hex.padStart(4, '0')}`;
  });
}

/**
 * Runs git in `root` with no inherited `GIT_*` variable, so the root's config and attributes apply.
 * @param {string} root
 * @param {string[]} args
 * @param {string} [input]
 * @returns {import('node:child_process').SpawnSyncReturns<string>}
 */
function gitIn(root, args, input) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^GIT_/i.test(key)));

  return spawnSync('git', args, {
    cwd: root,
    env,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
    ...(input === undefined ? {} : { input }),
  });
}

/**
 * The git blob hash of each file, as git would hash it into this checkout: line-ending conversion (core.autocrlf,
 * the `text` and `eol` attributes) applies, so a CRLF working copy of an LF blob hashes as that blob, but every
 * filter driver the config names is switched off, so a clean filter can neither hide an edit nor fail the run.
 * One `git hash-object --stdin-paths` call, run from the repository root.
 * @param {string} root
 * @param {string[]} paths  absolute, inside `root`
 * @returns {Map<string, string>}  keyed by the given path
 */
export function blobHashes(root, paths) {
  const unique = [...new Set(paths)];
  /** @type {Map<string, string>} */
  const hashes = new Map();

  if (unique.length === 0) {
    return hashes;
  }

  const relativePaths = unique.map((path) => {
    const rel = posix(root, path);

    // --stdin-paths reads one path per line and C-unquotes a line that starts with a double quote.
    if (/[\r\n]/.test(rel) || rel.startsWith('"')) {
      throw new Error(`a path with a line break or a leading double quote cannot be hashed: ${printable(rel)}`);
    }

    return rel;
  });
  const drivers = new Set(
    (gitIn(root, ['config', '--name-only', '--get-regexp', '^filter\\.']).stdout ?? '')
      .split(/\r?\n/)
      .filter((line) => line.startsWith('filter.'))
      .map((line) => line.slice('filter.'.length, line.lastIndexOf('.'))),
  );
  const off = [...drivers].flatMap((name) =>
    ['clean=', 'smudge=', 'process=', 'required=false'].flatMap((setting) => ['-c', `filter.${name}.${setting}`]),
  );
  const r = gitIn(root, [...off, 'hash-object', '--stdin-paths'], `${relativePaths.join('\n')}\n`);
  const lines = (r.stdout ?? '').split(/\r?\n/).filter((line) => line !== '');

  if (r.status !== 0 || lines.length !== unique.length || !lines.every((line) => SHA.test(line))) {
    const why = (r.stderr || String(r.error ?? '') || `${lines.length} hashes for ${unique.length} files`).trim();
    throw new Error(`git hash-object failed in ${printable(root)}: ${printable(why)}`);
  }

  unique.forEach((path, i) => hashes.set(path, lines[i] ?? ''));

  return hashes;
}

/**
 * The checkout that holds `skillDir`: the nearest folder above it with a `.git` file or folder.
 * @param {string} skillDir
 * @returns {string}
 */
export function findRoot(skillDir) {
  for (let dir = dirname(skillDir); ; dir = dirname(dir)) {
    if (lstatSync(join(dir, '.git'), { throwIfNoEntry: false }) !== undefined) {
      assertLocal(dir);

      // The on-disk spelling, so it compares equal to the real paths of the files below it.
      return realpathSync.native(dir);
    }

    if (dirname(dir) === dir) {
      throw new Error(`no git checkout holds ${skillDir}`);
    }
  }
}

/**
 * HEAD's commit, read from the git files without running git, or null when they cannot be read plainly.
 * @param {string} root
 * @returns {string | null}
 */
export function readCommit(root) {
  /** @type {(base: string, path: string) => string | null} */
  const plain = (base, path) => {
    const problem = unreadable(base, path);

    if (problem === 'missing') {
      return null;
    }

    if (problem !== null) {
      throw new Error(`${path}: ${problem}`);
    }

    return readFileSync(path, 'utf8');
  };

  try {
    const dotGit = join(root, '.git');
    let gitDir = dotGit;

    if (lstatSync(dotGit).isFile()) {
      const line = /^gitdir:\s*(.+)$/m.exec(plain(root, dotGit) ?? '')?.[1]?.trim();

      if (line === undefined) {
        return null;
      }

      gitDir = resolve(root, line);
    }

    assertLocal(gitDir);
    const commondir = plain(gitDir, join(gitDir, 'commondir'));
    const common = commondir === null ? gitDir : resolve(gitDir, commondir.trim());
    assertLocal(common);
    const head = (plain(gitDir, join(gitDir, 'HEAD')) ?? '').trim();
    const ref = /^ref:\s*(refs\/\S+)$/.exec(head)?.[1];

    if (ref === undefined) {
      return SHA.test(head) ? head : null;
    }

    if (!safeRelative(ref)) {
      return null;
    }

    for (const dir of [gitDir, common]) {
      const sha = plain(dir, join(dir, ...ref.split('/')))?.trim();

      if (sha !== undefined) {
        return SHA.test(sha) ? sha : null;
      }
    }

    const packed = plain(common, join(common, 'packed-refs'));

    if (packed !== null) {
      for (const line of packed.split(/\r?\n/)) {
        const [sha, name] = line.split(' ');

        if (name === ref && sha !== undefined && SHA.test(sha)) {
          return sha;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * The repository's own TypeScript: the nearest `node_modules/typescript` from `fromDir` up to `root`, never one
 * above the repository and never installed. Null when there is none.
 * @param {string} root
 * @param {string} fromDir
 * @returns {TypeScript | null}
 */
export function loadTypeScript(root, fromDir) {
  for (let dir = fromDir; ; dir = dirname(dir)) {
    const pkg = join(dir, 'node_modules', 'typescript');
    // The file TypeScript ships as its main, required by path so no package.json field can point elsewhere.
    const file = join(pkg, 'lib', 'typescript.js');
    assertLocal(file);
    const stat = lstatSync(file, { throwIfNoEntry: false });

    if (stat !== undefined) {
      const real = realpathSync.native(file);

      if (!stat.isFile() || below(realpathSync.native(pkg), real) === null) {
        throw new Error(`${file} is not a regular file inside its package`);
      }

      return /** @type {TypeScript} */ (createRequire(import.meta.url)(real));
    }

    if (below(root, dir) === null) {
      return null;
    }
  }
}

/**
 * The files `entries` depend on: with TypeScript, every file their imports, `export ... from`, `import()`,
 * `require()` and `/// <reference path>` reach, resolved with the nearest tsconfig.json, plus Angular `templateUrl`
 * and `styleUrl(s)` files; without it, the entries alone. That tsconfig and the files it extends are recorded only
 * for a TypeScript file, whose compiled output they change; a JavaScript file runs as written, so a tsconfig
 * reached from one only type-checks it. Only regular files inside the repository, outside node_modules and reached through no link are read or
 * returned.
 * @param {string} root
 * @param {string[]} entries  absolute
 * @param {TypeScript | null} ts
 * @returns {Set<string>} absolute paths
 */
export function closure(root, entries, ts) {
  const files = new Set(entries);

  if (ts === null) {
    return files;
  }

  /** @type {(path: string, kind?: 'file' | 'dir') => boolean} */
  const allowed = (path, kind = 'file') => admit(root, resolve(path), kind).problem === null;
  /** @type {(path: string) => string | undefined} */
  const read = (path) => (allowed(path) ? readFileSync(resolve(path), 'utf8') : undefined);
  /** @type {import('typescript').ParseConfigHost} */
  const host = {
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
    readDirectory: () => [],
    fileExists: (path) => allowed(path),
    readFile: read,
    directoryExists: (path) => allowed(path, 'dir'),
    realpath: (path) => path,
  };
  /** @type {Map<string, { options: import('typescript').CompilerOptions, files: string[] }>} */
  const configs = new Map();
  /** @type {(dir: string) => { options: import('typescript').CompilerOptions, files: string[] }} */
  const configFor = (dir) => {
    const cached = configs.get(dir);

    if (cached !== undefined) {
      return cached;
    }

    const path = join(dir, 'tsconfig.json');
    let config = { options: {}, files: /** @type {string[]} */ ([]) };

    if (allowed(path)) {
      const source = ts.readJsonConfigFile(path, read);
      const parsed = ts.parseJsonSourceFileConfigFileContent(source, host, dir, undefined, path);
      const extended = (source.extendedSourceFiles ?? []).map((file) => resolve(file));
      config = { options: parsed.options, files: [path, ...extended] };
    } else if (below(root, dir) !== null) {
      config = configFor(dirname(dir));
    }

    configs.set(dir, config);

    return config;
  };
  const queue = [...entries];

  for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
    if (!CODE.test(file)) {
      continue;
    }

    const text = readFileSync(file, 'utf8');
    const config = configFor(dirname(file));
    /** @type {string[]} */
    const found = TS_SOURCE.test(file) ? [...config.files] : [];
    const info = ts.preProcessFile(text, true, true);

    for (const reference of info.importedFiles) {
      const resolved = ts.resolveModuleName(reference.fileName, file, config.options, host).resolvedModule;

      if (resolved !== undefined && !resolved.isExternalLibraryImport) {
        found.push(resolve(resolved.resolvedFileName));
      }
    }

    // ponytail: Angular's component URLs by text match; a URL built at run time is not followed.
    const urls = [...text.matchAll(/\b(?:templateUrl|styleUrls?)\s*:\s*(\[[^\][]{0,4096}\]|(['"`])[^'"`\n]{0,4096}\2)/g)].flatMap((match) =>
      [...(match[1] ?? '').matchAll(/(['"`])([^'"`\n]+)\1/g)].map((url) => url[2] ?? ''),
    );

    for (const name of [...info.referencedFiles.map((reference) => reference.fileName), ...urls]) {
      found.push(resolve(dirname(file), name));
    }

    for (const { real: path } of found.map((item) => admit(root, resolve(item)))) {
      if (path !== null && !files.has(path)) {
        files.add(path);
        queue.push(path);
      }
    }
  }

  return files;
}

/**
 * What is wrong with an external reason, or null when it is a trimmed, non-empty, printable line of at most
 * MAX_REASON characters.
 * @param {unknown} value
 * @returns {string | null}
 */
export function reasonProblem(value) {
  if (typeof value !== 'string') {
    return 'is not a string';
  }

  if (value.trim() === '') {
    return 'is empty';
  }

  if (value !== value.trim() || value.length > MAX_REASON || UNPRINTABLE.test(value)) {
    return `is not one trimmed, printable line of at most ${MAX_REASON} characters`;
  }

  return null;
}

/**
 * Validates a parsed manifest. Throws naming the first thing that is wrong.
 * @param {unknown} value
 * @returns {Manifest}
 */
export function parseManifest(value) {
  /** @type {(item: unknown, where: string) => Record<string, unknown>} */
  const object = (item, where) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      throw new Error(`${where} is not an object`);
    }

    return /** @type {Record<string, unknown>} */ (item);
  };
  /** @type {(item: Record<string, unknown>, keys: string[], where: string) => void} */
  const exactKeys = (item, keys, where) => {
    const extra = Object.keys(item).filter((key) => !keys.includes(key));
    const missing = keys.filter((key) => !Object.hasOwn(item, key));

    if (extra.length > 0 || missing.length > 0) {
      throw new Error(`${where} has unknown keys [${extra.join(', ')}] or lacks [${missing.join(', ')}]`);
    }
  };
  const top = object(value, MANIFEST);
  exactKeys(top, ['version', 'features'], MANIFEST);

  if (top['version'] !== 1) {
    throw new Error(`${MANIFEST} version is not 1`);
  }

  /** @type {Map<string, Entry>} */
  const features = new Map();
  let count = 0;

  for (const [id, raw] of Object.entries(object(top['features'], `${MANIFEST} features`))) {
    const where = `${MANIFEST} feature ${JSON.stringify(id)}`;

    if (!FEATURE_ID.test(id) || id === 'README') {
      throw new Error(`${where}: not a feature file name`);
    }

    const entry = object(raw, where);
    const isExternal = Object.hasOwn(entry, 'external');
    exactKeys(entry, isExternal ? ['recordedAt', 'commit', 'external'] : ['provenAt', 'commit', 'method', 'entries', 'files'], where);
    const { provenAt, recordedAt, commit, external, method, entries, files } = entry;
    const at = isExternal ? 'recordedAt' : 'provenAt';
    const date = isExternal ? recordedAt : provenAt;

    // The round trip accepts only what toISOString writes: no text Date.parse skips, no rolled-over February 31.
    if (typeof date !== 'string' || Number.isNaN(Date.parse(date)) || new Date(date).toISOString() !== date) {
      throw new Error(`${where}: ${at} is not a date as toISOString writes it`);
    }

    if (commit !== null && (typeof commit !== 'string' || !SHA.test(commit))) {
      throw new Error(`${where}: commit is neither null nor a commit hash`);
    }

    if (isExternal) {
      const problem = reasonProblem(external);

      if (problem !== null || typeof external !== 'string') {
        throw new Error(`${where}: external ${problem ?? 'is not a string'}`);
      }

      features.set(id, { recordedAt: date, commit, external });
      continue;
    }

    const way = METHODS.find((item) => item === method);

    if (way === undefined) {
      throw new Error(`${where}: method is not one of ${METHODS.join(', ')}`);
    }

    /** @type {Record<string, string>} */
    const hashes = Object.create(null);

    for (const [path, hash] of Object.entries(object(files, `${where} files`))) {
      count += 1;

      if (count > MAX_FILES) {
        throw new Error(`${MANIFEST} lists more than ${MAX_FILES} files`);
      }

      if (
        !safeRelative(path) ||
        path.split('/').some((segment) => segment.toLowerCase() === 'node_modules') ||
        typeof hash !== 'string' ||
        !BLOB.test(hash)
      ) {
        throw new Error(`${where}: files has a bad path or hash: ${JSON.stringify(path)}`);
      }

      hashes[path] = hash;
    }

    if (
      !Array.isArray(entries) ||
      entries.length === 0 ||
      !entries.every((path) => typeof path === 'string' && Object.hasOwn(hashes, path))
    ) {
      throw new Error(`${where}: entries is not a non-empty list of paths in files`);
    }

    features.set(id, { provenAt: date, commit, method: way, entries: /** @type {string[]} */ (entries), files: hashes });
  }

  return { version: 1, features };
}

/**
 * @param {string} skillDir
 * @returns {Manifest} the skill's manifest, empty when it has none yet
 */
export function readManifest(skillDir) {
  const featuresDir = join(skillDir, 'features');

  if (!lstatSync(featuresDir, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`${featuresDir} is not a directory`);
  }

  const file = join(skillDir, ...MANIFEST.split('/'));
  const stat = lstatSync(file, { throwIfNoEntry: false });

  if (stat === undefined) {
    return { version: 1, features: new Map() };
  }

  if (!stat.isFile() || stat.size > MAX_MANIFEST) {
    throw new Error(`${MANIFEST} is not a regular file of at most ${MAX_MANIFEST} bytes`);
  }

  return parseManifest(JSON.parse(readFileSync(file, 'utf8')));
}

/**
 * The ids of the skill's feature files: features/<id>.md, regular files, README excluded.
 * @param {string} skillDir
 * @returns {string[]}
 */
export function featureIds(skillDir) {
  const dir = join(skillDir, 'features');

  return readdirSync(dir)
    .filter((name) => name.endsWith('.md') && name !== 'README.md' && lstatSync(join(dir, name)).isFile())
    .map((name) => name.slice(0, -'.md'.length))
    .filter((id) => FEATURE_ID.test(id));
}

/**
 * @param {string} skillDir
 * @param {string} id
 * @returns {void}
 */
function assertFeature(skillDir, id) {
  if (!FEATURE_ID.test(id) || id === 'README' || !featureIds(skillDir).includes(id)) {
    throw new Error(`no feature file features/${id}.md`);
  }
}

/**
 * Records the files feature `id` depends on and their hashes, or, with `external`, that its source lives outside
 * the checkout and why, with no files. Leaves the entry as it was when nothing changed, so a clean pass writes
 * nothing. Drops the entries of features whose feature file is gone.
 * @param {string} skillDir
 * @param {string} id
 * @param {string[] | null} entryArgs  paths relative to the repository root; null reuses the recorded entries
 * @param {string | null} [external]  the reason, trimmed; null records files
 * @returns {{ status: 'written' | 'unchanged', entry: Entry }}
 */
export function record(skillDir, id, entryArgs, external = null) {
  const root = findRoot(skillDir);
  // First: it refuses a features folder that is a link, before anything lists it.
  const manifest = readManifest(skillDir);
  assertFeature(skillDir, id);
  const previous = manifest.features.get(id);

  if (external !== null && entryArgs !== null) {
    throw new Error('give --entries or --external, not both');
  }

  const entry =
    external === null
      ? fingerprint(root, id, entryArgs ?? (previous === undefined || 'external' in previous ? undefined : previous.entries))
      : externalEntry(root, external.trim());
  const ids = featureIds(skillDir);
  const orphans = [...manifest.features.keys()].filter((key) => !ids.includes(key));

  for (const orphan of orphans) {
    manifest.features.delete(orphan);
  }

  if (orphans.length === 0 && previous !== undefined && same(previous, entry)) {
    return { status: 'unchanged', entry: previous };
  }

  manifest.features.set(id, entry);
  writeManifest(skillDir, manifest);

  return { status: 'written', entry };
}

/**
 * @param {string} root
 * @param {string} id
 * @param {string[] | undefined} entries  repository-relative
 * @returns {ProvenEntry}
 */
function fingerprint(root, id, entries) {
  if (entries === undefined || entries.length === 0) {
    throw new Error(`feature ${id} has no recorded entries; give --entries`);
  }

  const absolute = entries.map((entry) => {
    if (NETWORK.test(entry) || /^UNC[\\/]/i.test(entry)) {
      throw new Error(`entry ${entry}: a network or device path`);
    }

    const { real, problem } = admit(root, resolve(root, entry));

    if (real === null) {
      throw new Error(`entry ${entry}: ${problem}`);
    }

    return real;
  });
  const ts = loadTypeScript(root, dirname(absolute[0] ?? root));
  /** @type {Record<string, string>} */
  const files = Object.create(null);

  const paths = [...closure(root, absolute, ts)].sort();
  const hashes = blobHashes(root, paths);

  for (const path of paths) {
    files[posix(root, path)] = hashes.get(path) ?? '';
  }

  return {
    provenAt: new Date().toISOString(),
    commit: readCommit(root),
    method: ts === null ? 'entries' : 'typescript',
    entries: absolute.map((path) => posix(root, path)),
    files,
  };
}

/**
 * @param {string} root
 * @param {string} reason
 * @returns {ExternalEntry}
 */
function externalEntry(root, reason) {
  const problem = reasonProblem(reason);

  if (problem !== null) {
    throw new Error(`--external reason ${problem}`);
  }

  return { recordedAt: new Date().toISOString(), commit: readCommit(root), external: reason };
}

/**
 * Whether two entries record the same thing, their dates and commits aside.
 * @param {Entry} a
 * @param {Entry} b
 * @returns {boolean}
 */
function same(a, b) {
  if ('external' in a || 'external' in b) {
    return 'external' in a && 'external' in b && a.external === b.external;
  }

  return (
    a.method === b.method &&
    JSON.stringify(a.entries) === JSON.stringify(b.entries) &&
    JSON.stringify(sorted(a.files)) === JSON.stringify(sorted(b.files))
  );
}

/**
 * @param {Record<string, string>} record
 * @returns {Record<string, string>}
 */
function sorted(record) {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

/**
 * Writes the manifest with its features and files in sorted order, through a temporary file and a rename.
 * @param {string} skillDir
 * @param {Manifest} manifest
 * @returns {void}
 */
function writeManifest(skillDir, manifest) {
  const features = [...manifest.features.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, entry]) => [id, 'external' in entry ? entry : { ...entry, files: sorted(entry.files) }]);
  const file = join(skillDir, ...MANIFEST.split('/'));
  // A random name, so no committed link can sit where the write lands.
  const temporary = `${file}.${randomBytes(8).toString('hex')}.tmp`;
  writeFileSync(temporary, `${JSON.stringify({ version: 1, features: Object.fromEntries(features) }, null, 2)}\n`, { flag: 'wx' });
  try {
    renameSync(temporary, file);
  } catch (error) {
    rmSync(temporary, { force: true });
    throw error;
  }
}

/**
 * Compares each feature's recorded hashes with the files now. Without `only`, every feature in the manifest or in
 * the feature folder; a feature file the manifest lacks is unproven, one recorded as external is external.
 * @param {string} skillDir
 * @param {string} [only]
 * @returns {Freshness[]}
 */
export function checkFeatures(skillDir, only) {
  const root = findRoot(skillDir);
  // First: it refuses a features folder that is a link, before anything lists it.
  const manifest = readManifest(skillDir);

  if (only !== undefined && !manifest.features.has(only)) {
    assertFeature(skillDir, only);
  }

  const ids = only === undefined ? [...new Set([...manifest.features.keys(), ...featureIds(skillDir)])].sort() : [only];
  /** @type {Map<string, { real: string, problem: null } | { real: null, problem: string }>} */
  const admitted = new Map();

  for (const id of ids) {
    const proven = manifest.features.get(id);

    if (proven !== undefined && !('external' in proven)) {
      for (const path of Object.keys(proven.files)) {
        if (!admitted.has(path)) {
          admitted.set(path, admit(root, resolve(root, ...path.split('/'))));
        }
      }
    }
  }

  // Keyed by the on-disk path, so spellings of one file are hashed once.
  const hashes = blobHashes(
    root,
    [...admitted.values()].flatMap(({ real }) => (real === null ? [] : [real])),
  );

  return ids.map((id) => {
    const proven = manifest.features.get(id) ?? null;

    if (proven === null) {
      return { id, status: 'unproven', proven, changed: [] };
    }

    if ('external' in proven) {
      return { id, status: 'external', proven, changed: [] };
    }

    /** @type {Change[]} */
    const changed = [];

    for (const [path, hash] of Object.entries(proven.files)) {
      const { real, problem } = admitted.get(path) ?? admit(root, resolve(root, ...path.split('/')));

      if (real === null) {
        changed.push({ path, why: problem });
        continue;
      }

      if (hashes.get(real) !== hash) {
        changed.push({ path, why: 'changed' });
      }
    }

    return { id, status: changed.length === 0 ? 'fresh' : 'stale', proven, changed };
  });
}

/**
 * @param {Entry | null} proven
 * @returns {string}
 */
export function since(proven) {
  if (proven === null) {
    return '';
  }

  return proven.commit?.slice(0, 12) ?? ('external' in proven ? proven.recordedAt : proven.provenAt);
}

/**
 * The doctor's map-fresh line. Never throws: a manifest it cannot read is a warning, not a crash.
 * @param {string} skillDir
 * @returns {{ status: 'pass' | 'warn', detail: string }}
 */
export function mapFresh(skillDir) {
  try {
    const results = checkFeatures(skillDir);
    const stale = results.filter((result) => result.status === 'stale');
    const unproven = results.filter((result) => result.status === 'unproven');
    const fresh = results.filter((result) => result.status === 'fresh');
    const external = results.filter((result) => result.status === 'external');
    const externalPart = external.length > 0 ? `external: ${external.map((result) => result.id).join(', ')}` : '';

    if (stale.length === 0 && unproven.length === 0) {
      return { status: 'pass', detail: [`${fresh.length} features fresh`, externalPart].filter(Boolean).join('; ') };
    }

    return {
      status: 'warn',
      detail: [
        stale.length > 0
          ? `stale: ${stale.map((result) => `${result.id} (since ${since(result.proven)}, ${result.changed.length} files changed)`).join(', ')}`
          : '',
        unproven.length > 0 ? `unproven: ${unproven.map((result) => result.id).join(', ')}` : '',
        externalPart,
      ]
        .filter(Boolean)
        .join('; '),
    };
  } catch (error) {
    return { status: 'warn', detail: `could not check: ${printable(error instanceof Error ? error.message : String(error))}` };
  }
}

const USAGE =
  'usage: fingerprint.mjs record --feature <id> [--entries <path>... | --external <reason>] [--json] | fingerprint.mjs check [--feature <id>] [--json]';

/**
 * @param {string[]} argv
 * @param {string} skillDir
 * @returns {number}
 */
export function main(argv, skillDir) {
  const [command, ...rest] = argv;
  const json = rest.includes('--json');
  /** @type {string | undefined} */
  let feature;
  /** @type {string[] | null} */
  let entries = null;
  /** @type {string | null} */
  let external = null;

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    const next = rest[i + 1];
    const value = next !== undefined && !next.startsWith('--') ? next : undefined;

    if (arg === '--json') {
      continue;
    }

    if (arg === '--feature' && feature === undefined && value !== undefined) {
      feature = value;
      i += 1;
    } else if (arg === '--entries' && command === 'record' && entries === null) {
      entries = [];

      while (rest[i + 1] !== undefined && !(rest[i + 1] ?? '').startsWith('--')) {
        entries.push(/** @type {string} */ (rest[i + 1]));
        i += 1;
      }
    } else if (arg === '--external' && command === 'record' && external === null && value !== undefined) {
      external = value;
      i += 1;
    } else {
      console.log(json ? JSON.stringify({ error: USAGE }) : `[ERROR] ${USAGE}`);

      return 2;
    }
  }

  try {
    if (command === 'record' && feature !== undefined) {
      const { status, entry } = record(skillDir, feature, entries, external);
      const what = 'external' in entry ? `external: ${entry.external}` : `${entry.method}, ${Object.keys(entry.files).length} files`;
      console.log(json ? JSON.stringify({ feature, status, ...entry }, null, 2) : `[OK] ${feature}: ${status} (${what}, since ${since(entry)})`);

      return 0;
    }

    if (command !== 'check') {
      console.log(json ? JSON.stringify({ error: USAGE }) : `[ERROR] ${USAGE}`);

      return 2;
    }

    const results = checkFeatures(skillDir, feature);

    if (json) {
      console.log(JSON.stringify({ manifest: MANIFEST, features: results }, null, 2));
    } else {
      for (const { id, status, proven, changed } of results) {
        const detail = proven !== null && 'external' in proven ? proven.external : changed.map((change) => `${change.path} ${change.why}`).join(', ');
        const tag = status === 'fresh' || status === 'external' ? '[OK]' : '[WARN]';
        console.log(`${tag} ${id}: ${status}${proven === null ? '' : ` since ${since(proven)}`}${detail === '' ? '' : `: ${detail}`}`);
      }
    }

    return results.every((result) => result.status === 'fresh' || result.status === 'external') ? 0 : 1;
  } catch (error) {
    const reason = printable(error instanceof Error ? error.message : String(error));
    console.log(json ? JSON.stringify({ error: reason }) : `[ERROR] ${reason}`);

    return 2;
  }
}

const self = fileURLToPath(import.meta.url);

// import.meta.url is the real path, so compare real paths: run through a link, the CLI still runs.
if (process.argv[1] && realpathSync.native(resolve(process.argv[1])) === realpathSync.native(self)) {
  process.exitCode = main(process.argv.slice(2), realpathSync.native(join(dirname(self), '..')));
}
