import { stylesheetLoaded } from '@ngx-yeti/testing';
import { server } from 'vitest/browser';

const root = server.config.root.replaceAll('\\', '/');
const stylesheets = [
  `/@fs/${root}/../../node_modules/yeti-css/dist/css/layers.css`,
  `/@fs/${root}/../../node_modules/yeti-css/dist/css/tokens/scale.css`,
  `/@fs/${root}/../../node_modules/yeti-css/dist/css/tokens/space.css`,
  `/@fs/${root}/accessibility.css`,
];

/** The setup spec's layer statement, then Yeti's scale and the package's stylesheet. */
async function setup(): Promise<{ readonly probe: HTMLElement }> {
  const order = document.createElement('style');
  order.textContent = '@layer yeti, ngx-yeti;';
  document.head.append(order);

  for (const href of stylesheets) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.append(link);
    await stylesheetLoaded(link);
  }

  const probe = document.createElement('div');
  probe.style.paddingTop = 'var(--yeti-space-md)';
  document.body.append(probe);

  return { probe };
}

describe('ngx-yeti/accessibility.css', () => {
  // Yeti's fluid base: 1rem at the 320px viewport to 1.125rem at 1280px.
  // Without the workaround Firefox 145 to 152 compute 0px here.
  it("resolves Yeti's fluid scale in every engine", async () => {
    expect.assertions(1);

    const { probe } = await setup();
    const t = Math.min(Math.max((window.innerWidth - 320) / 960, 0), 1);

    expect(parseFloat(getComputedStyle(probe).paddingTop)).toBeCloseTo(
      16 + 2 * t,
      1,
    );
  });
});
