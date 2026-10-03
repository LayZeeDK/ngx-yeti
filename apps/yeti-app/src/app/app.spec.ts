import { TestBed } from '@angular/core/testing';
import { App } from './app';

async function setup() {
  const fixture = TestBed.createComponent(App);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);

  return { element, fixture };
}

describe(App, () => {
  it('renders the title', async () => {
    expect.assertions(1);

    const { element } = await setup();

    expect(element.querySelector('h1')?.textContent).toContain(
      'Welcome yeti-app',
    );
  });
});
