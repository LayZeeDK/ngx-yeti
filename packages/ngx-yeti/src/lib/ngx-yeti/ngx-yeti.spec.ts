import { TestBed } from '@angular/core/testing';
import { NgxYeti } from './ngx-yeti';

async function setup() {
  const fixture = TestBed.createComponent(NgxYeti);

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);

  return { element, fixture };
}

describe(NgxYeti, () => {
  it('displays a success message', async () => {
    expect.assertions(1);

    const { element } = await setup();

    expect(element.querySelector('p')?.textContent).toContain(
      'ngx-yeti works!',
    );
  });
});
