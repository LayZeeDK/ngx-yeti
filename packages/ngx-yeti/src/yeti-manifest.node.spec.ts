import manifest from 'yeti-css/manifest';

describe('yeti-css/manifest', () => {
  it('lists the 49 components of the pinned Yeti', () => {
    const { components, framework } = manifest;

    expect(framework).toBe('yeti');
    expect(Object.keys(components)).toHaveLength(49);
  });

  it('keys each component by its own name', () => {
    const { components } = manifest;

    expect(
      Object.entries(components).filter(([key, { name }]) => key !== name),
    ).toStrictEqual([]);
    expect(components.alert.class).toBe('alert');
  });
});
