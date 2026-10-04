import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('yeti-types.ts', () => {
  it("equals Yeti's built yeti.d.ts", () => {
    expect(
      readFileSync(join(import.meta.dirname, 'yeti-types.ts'), 'utf8'),
    ).toBe(
      readFileSync(
        join(import.meta.dirname, '../../../vendor/yeti/dist/yeti.d.ts'),
        'utf8',
      ),
    );
  });
});
