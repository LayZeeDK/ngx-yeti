import { checkContract } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiTable } from './table';
import { YetiTableCell } from './table-cell';
import type { YetiTableHead } from './table-head';
import { YetiNumeric } from './table-numeric';

const sizes = ['sm', 'md', 'lg'] as const;
const alignments = ['start', 'center', 'end'] as const;

// Compile-time half: each list holds exactly the values its input accepts,
// so the runtime half below compares the inputs, not copies of their types.
expectTypeOf<ReturnType<YetiTable['size']>>().toEqualTypeOf<
  (typeof sizes)[number] | undefined
>();
expectTypeOf<ReturnType<YetiTableCell['align']>>().toEqualTypeOf<
  (typeof alignments)[number] | undefined
>();
expectTypeOf<ReturnType<YetiTable['striped']>>().toEqualTypeOf<boolean>();
expectTypeOf<ReturnType<YetiTableCell['nowrap']>>().toEqualTypeOf<boolean>();
expectTypeOf<ReturnType<YetiNumeric['yetiNumeric']>>().toEqualTypeOf<boolean>();
expectTypeOf<ReturnType<YetiTableHead['sticky']>>().toEqualTypeOf<boolean>();

// Usage rule 4: the directive declares no input for the table's name.
expectTypeOf<keyof YetiTable>().toEqualTypeOf<
  'size' | 'striped' | 'hover' | 'border' | 'nowrap' | 'fixed'
>();

describe('table contract', () => {
  it('maps the manifest component to YetiTable, YetiTableCell, and YetiNumeric', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components.table, {
        class: YetiTable,
        attributes: {
          'data-size': { directive: YetiTable, input: 'size', values: sizes },
          'data-striped': { directive: YetiTable, input: 'striped' },
          'data-hover': { directive: YetiTable, input: 'hover' },
          'data-border': { directive: YetiTable, input: 'border' },
          'data-nowrap': { directive: YetiTable, input: 'nowrap' },
          'data-fixed': { directive: YetiTable, input: 'fixed' },
        },
        markers: {
          'data-numeric': { directive: YetiNumeric, input: 'yetiNumeric' },
          'data-nowrap': {
            directive: YetiTableCell,
            input: 'nowrap',
            selectorAttribute: 'yetiTableCell',
          },
          'data-align': {
            directive: YetiTableCell,
            input: 'align',
            values: alignments,
            selectorAttribute: 'yetiTableCell',
          },
        },
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });

  // The explicit exception: YetiTableHead's `sticky` renders `data-sticky`
  // on the `thead`, which the manifest names only in a child's description
  // (upstream Y13). Layer 2 covers it. When a pin move adds the marker, this
  // fails and the mapping above takes it.
  it('finds no data-sticky marker in the manifest, so YetiTableHead stays out of the mapping', () => {
    expect(
      manifest.components.table.markers.map(({ name }) => name),
    ).not.toContain('data-sticky');
  });
});
