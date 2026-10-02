import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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

    expect(
      fixture.debugElement.query(By.css('p')).nativeElement.textContent,
    ).toContain('ngx-yeti works!');
  });
});
