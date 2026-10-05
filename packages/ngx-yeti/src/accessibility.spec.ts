import { stylesheetLoaded } from '@ngx-yeti/testing';
import { server } from 'vitest/browser';

/** Storybook's global stylesheet, which Vite serves with its imports inlined. */
const globalStylesheet = `/@fs/${server.config.root.replaceAll('\\', '/')}/.storybook/styles.css`;

/** The global stylesheet of the setup spec, which ends with the package's. */
async function setup(): Promise<{ readonly probe: HTMLElement }> {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = globalStylesheet;
  document.head.append(link);
  await stylesheetLoaded(link);

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
