import { join } from 'node:path';
import { performCompilation, readConfiguration } from '@angular/compiler-cli';

const packageRoot = join(import.meta.dirname, '..');
const fixtures = join(packageRoot, 'compile-fixtures');

/**
 * Each fixture under `compile-fixtures/` with the code of the one diagnostic
 * it must produce: `ts.Diagnostic.code`, where an Angular `NG` error is
 * `-99` followed by its number, so NG8002 is -998002.
 */
const compileErrorCases: readonly {
  readonly fixture: string;
  readonly code: number;
}[] = [
  // `max="large"` is not a `YetiWidth` (center.md:274).
  { fixture: 'center-max-large.ts', code: 2322 },
  // `[disabled]` on an `a[yetiButton]` without `YetiButtonDisabledLink`
  // (button.md:179).
  { fixture: 'button-disabled-link-not-imported.ts', code: -998002 },
];

/**
 * The package's own compiler options, strict template checking included.
 * The fixtures folder is in no tsconfig, so `typecheck` and `lint` never
 * read it.
 */
const { options } = readConfiguration(join(packageRoot, 'tsconfig.lib.json'));

/** The codes of every diagnostic the Angular compiler reports for a fixture. */
function diagnosticCodes(fixture: string): number[] {
  const { diagnostics } = performCompilation({
    rootNames: [join(fixtures, fixture)],
    options: { ...options, noEmit: true },
  });

  return diagnostics.map(({ code }) => code);
}

describe('compile-time fixtures', () => {
  it.for(compileErrorCases)(
    '$fixture fails to compile with only the diagnostic $code',
    { timeout: 60_000 },
    ({ fixture, code }) => {
      expect(diagnosticCodes(fixture)).toStrictEqual([code]);
    },
  );
});
