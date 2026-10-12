import { itemStyled } from './story-helpers';

/**
 * A paragraph and the box item's link to one of the config's `/__stylesheet/`
 * responses, whose sheet paints paragraphs red.
 */
function setup(file: string): {
  readonly paragraph: HTMLElement;
  readonly teardown: () => void;
} {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `/__stylesheet/${file}?${crypto.randomUUID()}`;
  link.setAttribute('data-ngx-yeti-styles', 'box');
  const paragraph = document.createElement('p');
  document.head.append(link);
  document.body.append(paragraph);

  return {
    paragraph,
    teardown: () => {
      link.remove();
      paragraph.remove();
    },
  };
}

const red = 'rgb(255, 0, 0)';

describe(itemStyled, () => {
  it('resolves once a sheet that was still pending has applied', async () => {
    expect.assertions(3);

    const { paragraph, teardown } = setup('pending.css');

    expect(getComputedStyle(paragraph).color).not.toBe(red);

    await expect(
      itemStyled('box', paragraph, 'color', red),
    ).resolves.toBeUndefined();

    expect(getComputedStyle(paragraph).color).toBe(red);

    teardown();
  });

  it('resolves when the value satisfies a predicate', async () => {
    expect.assertions(1);

    const { paragraph, teardown } = setup('ok.css');

    await expect(
      itemStyled('box', paragraph, 'color', (value) => value === red),
    ).resolves.toBeUndefined();

    teardown();
  });

  it('rejects after its timeout, naming the item, the property, and the last value read', async () => {
    expect.assertions(1);

    const { paragraph, teardown } = setup('ok.css');

    await expect(
      itemStyled('box', paragraph, 'color', 'rgb(0, 0, 255)', { timeout: 100 }),
    ).rejects.toThrow(
      `The box file did not style color within 100 ms; the last value read was "${red}"`,
    );

    teardown();
  });
});
