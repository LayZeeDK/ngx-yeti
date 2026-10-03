import { inputBinding, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Highlight } from './highlight';

async function setup({ color }: { color?: string } = {}) {
  const colorSignal = signal(color ?? '');
  const fixture = TestBed.createDirective(Highlight, {
    tagName: 'span',
    bindings:
      color === undefined ? [] : [inputBinding('yetiHighlight', colorSignal)],
  });

  await fixture.whenStable();

  const element: unknown = fixture.nativeElement;
  assert.instanceOf(element, HTMLElement);

  return { colorSignal, element, fixture };
}

describe(Highlight, () => {
  it('highlights in yellow by default', async () => {
    expect.assertions(1);

    const { element } = await setup();

    expect(element.style.backgroundColor).toBe('yellow');
  });

  it('highlights in the bound color', async () => {
    expect.assertions(1);

    const { element } = await setup({ color: 'lightblue' });

    expect(element.style.backgroundColor).toBe('lightblue');
  });

  it('applies a changed color', async () => {
    expect.assertions(1);

    const { colorSignal, element, fixture } = await setup({
      color: 'lightblue',
    });

    colorSignal.set('pink');
    fixture.detectChanges();

    expect(element.style.backgroundColor).toBe('pink');
  });
});
