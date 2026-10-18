import { checkContract } from '@ngx-yeti/testing/server';
import manifest from 'yeti-css/manifest';
import { YetiVisuallyHidden } from './visually-hidden';

describe('visually-hidden contract', () => {
  it('maps the manifest component to YetiVisuallyHidden with no attribute, marker, or event', async () => {
    expect.assertions(1);

    await expect(
      checkContract(manifest.components['visually-hidden'], {
        class: YetiVisuallyHidden,
        attributes: {},
        markers: {},
        events: {},
      }),
    ).resolves.toStrictEqual([]);
  });
});
