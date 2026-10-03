import { TestBed } from '@angular/core/testing';
import { NgxYeti } from './ngx-yeti';

async function setup() {
  const fixture = TestBed.createComponent(NgxYeti);
  const component = fixture.componentInstance;

  await fixture.whenStable();

  return { component, fixture };
}

describe('NgxYeti', () => {
  it('displays a success message', async () => {
    const { fixture } = await setup();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('p')?.textContent).toContain(
      'ngx-yeti works!',
    );
  });
});
