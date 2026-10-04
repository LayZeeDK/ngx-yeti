import { readFileSync } from 'node:fs';
import path from 'node:path';

const workspaceRoot = path.join(import.meta.dirname, '../../..');

function readWorkspaceFile(file: string): string {
  return readFileSync(path.join(workspaceRoot, file), 'utf8');
}

function stringAt(json: string, ...keys: readonly string[]): string {
  const found = keys.reduce<unknown>(
    (current, key) =>
      typeof current === 'object' && current !== null
        ? Reflect.get(current, key)
        : undefined,
    JSON.parse(json),
  );

  if (typeof found !== 'string') {
    throw new TypeError(`No string at ${keys.join('.')}`);
  }

  return found;
}

// setup.md:331 and ADR 0017's 2026-10-02 notes: 0.<Angular major><Angular
// minor, 2 digits><breaking counter, 2 digits>.<patch>-yeti.<Yeti version>.g<SHA>
const versionFormat =
  /^0\.(?<major>[1-9]\d*)(?<minor>\d{2})(?<counter>\d{2})\.(?<patch>0|[1-9]\d*)-yeti\.(?<yeti>.+)\.g(?<sha>[0-9a-f]{7,40})$/;

interface Version {
  readonly major: string;
  readonly minor: string;
  readonly yeti: string;
  readonly sha: string;
}

function parseVersion(version: string): Version {
  const { major, minor, yeti, sha } = versionFormat.exec(version)?.groups ?? {};

  if (
    major === undefined ||
    minor === undefined ||
    yeti === undefined ||
    sha === undefined
  ) {
    throw new Error(`${version} does not match the ADR 0017 format`);
  }

  return { major, minor, yeti, sha };
}

function setup() {
  const packageJson = readWorkspaceFile('packages/ngx-yeti/package.json');

  return {
    version: parseVersion(stringAt(packageJson, 'version')),
    peer: stringAt(packageJson, 'peerDependencies', '@angular/core'),
    yetiVersion: stringAt(
      readWorkspaceFile('vendor/yeti/package.json'),
      'version',
    ),
    commit: readWorkspaceFile('vendor/yeti/COMMIT').trim(),
  };
}

describe('the package version', () => {
  it('takes its Angular part from the minor of the @angular/core peer', () => {
    const { version, peer } = setup();

    expect(peer).toBe(`^${version.major}.${String(Number(version.minor))}.0`);
  });

  it('names the vendored Yeti version and a prefix of the vendored commit', () => {
    const { version, yetiVersion, commit } = setup();

    expect(version.yeti).toBe(yetiVersion);
    expect(commit.slice(0, version.sha.length)).toBe(version.sha);
  });

  it.for([
    '0.0.1',
    '0.2202.0-yeti.7.0.0-alpha.0.gf52d1e8',
    '0.220200.0+yeti.7.0.0-alpha.0.f52d1e8',
    '0.220200.0-yeti.7.0.0-alpha.0.f52d1e8',
  ])('rejects %s', (version) => {
    expect(() => parseVersion(version)).toThrow(/ADR 0017 format/);
  });
});
