import { stylesheetLoaded } from './item-links';

/** A stylesheet link to one of the config's `/__stylesheet/` responses. */
function setup(file: string): { readonly link: HTMLLinkElement } {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `/__stylesheet/${file}?${crypto.randomUUID()}`;
  document.head.append(link);

  return { link };
}

describe(stylesheetLoaded, () => {
  it('resolves once a stylesheet with rules has loaded', async () => {
    expect.assertions(2);

    const { link } = setup('ok.css');

    await expect(stylesheetLoaded(link)).resolves.toBeUndefined();
    await expect(stylesheetLoaded(link)).resolves.toBeUndefined();

    link.remove();
  });

  it('rejects with an Error naming the href after a 404', async () => {
    expect.assertions(2);

    const { link } = setup('missing.css');

    await expect(stylesheetLoaded(link)).rejects.toThrow(
      `${link.href} did not load`,
    );
    // The failed link now has an empty sheet; a later call still rejects.
    await expect(stylesheetLoaded(link)).rejects.toThrow(
      `${link.href} did not load`,
    );

    link.remove();
  });

  it('rejects for a 200 served as text/html', async () => {
    expect.assertions(1);

    const { link } = setup('html.css');

    await expect(stylesheetLoaded(link)).rejects.toThrow(
      `${link.href} did not load`,
    );

    link.remove();
  });

  it('rejects when the link is removed while its stylesheet is pending', async () => {
    expect.assertions(1);

    const { link } = setup('pending.css');
    const loaded = stylesheetLoaded(link);
    link.remove();

    await expect(loaded).rejects.toThrow(
      `${link.href} was removed before it loaded`,
    );
  });
});
