import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { yetiPin, yetiRank } from './yeti-rank';

const workspaceRoot = join(import.meta.dirname, '../../../..');
const yetiRoot = join(workspaceRoot, 'vendor/yeti');

describe('the generated rank table', () => {
  it("is what the generator writes from Yeti's built yeti.css", () => {
    // Exits 1, and so throws, when a committed output differs.
    expect(() =>
      execFileSync(
        process.execPath,
        [join(workspaceRoot, 'tools/yeti/generate-sources.mjs'), '--check'],
        { stdio: 'pipe' },
      ),
    ).not.toThrow();
  });

  it('lists the 49 items in rank order', () => {
    expect(Object.keys(yetiRank)).toHaveLength(49);
    expect(Object.values(yetiRank).map(({ rank }) => rank)).toStrictEqual(
      Object.keys(yetiRank).map((_name, index) => index),
    );
  });

  it("names files present in Yeti's build", () => {
    expect(
      Object.values(yetiRank).filter(
        ({ path }) => !existsSync(join(yetiRoot, 'dist/css', path)),
      ),
    ).toStrictEqual([]);
  });

  it('pins the vendored Yeti commit', () => {
    expect(yetiPin).toBe(readFileSync(join(yetiRoot, 'COMMIT'), 'utf8').trim());
  });
});
