import {
  assertWithin,
  itemStyled,
  storyStates,
  usedLength,
} from './story-helpers';

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

describe(assertWithin, () => {
  it('passes inside the tolerance and at its edge', () => {
    expect.assertions(3);

    expect(() => {
      assertWithin(10.5, 10);
    }).not.toThrow();
    expect(() => {
      assertWithin(11, 10);
    }).not.toThrow();
    expect(() => {
      assertWithin(13, 10, 3);
    }).not.toThrow();
  });

  it('throws outside the tolerance, naming both numbers', () => {
    expect.assertions(2);

    expect(() => {
      assertWithin(11.5, 10);
    }).toThrow('Expected 11.5 to be within 1 of 10');
    expect(() => {
      assertWithin(14, 10, 3);
    }).toThrow('Expected 14 to be within 3 of 10');
  });

  it('throws when either number is NaN, whatever the tolerance', () => {
    expect.assertions(3);

    expect(() => {
      assertWithin(Number.NaN, 10);
    }).toThrow('Expected NaN to be within 1 of 10');
    expect(() => {
      assertWithin(10, Number.NaN);
    }).toThrow('Expected 10 to be within 1 of NaN');
    expect(() => {
      assertWithin(Number.parseFloat('auto'), 0, Number.POSITIVE_INFINITY);
    }).toThrow('Expected NaN to be within Infinity of 0');
  });
});

describe(usedLength, () => {
  function setup(): { root: HTMLElement; rem: number } {
    const root = document.createElement('div');
    root.style.setProperty('--length', '1.5rem');
    document.body.append(root);
    onTestFinished(() => {
      root.remove();
    });

    return {
      root,
      rem: Number.parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      ),
    };
  }

  it.each<'inline' | 'block'>(['inline', 'block'])(
    'reads a literal on the %s axis',
    (axis) => {
      expect.assertions(1);

      const { root } = setup();

      expect(usedLength(root, '37px', axis)).toBe(37);
    },
  );

  it.each<'inline' | 'block'>(['inline', 'block'])(
    'reads a token on the %s axis where the root sits',
    (axis) => {
      expect.assertions(1);

      const { root, rem } = setup();

      expect(usedLength(root, 'var(--length)', axis)).toBe(1.5 * rem);
    },
  );

  it('leaves no probe behind', () => {
    expect.assertions(1);

    const { root } = setup();
    usedLength(root, '10px');

    expect(root.children).toHaveLength(0);
  });
});

describe(storyStates, () => {
  it('returns a tracked state and throws for an untracked story', () => {
    expect.assertions(2);

    const states = storyStates<number>('box');
    states.track('box--default', 3);

    expect(states.get('box--default')).toBe(3);
    expect(() => states.get('box--gap')).toThrow(
      'No box state for the story box--gap',
    );
  });
});
