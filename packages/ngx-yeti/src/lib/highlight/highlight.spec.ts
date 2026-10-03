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

  // DirectiveFixture types its host as Element; the span host is an HTMLElement.
  const element = fixture.nativeElement as HTMLElement;

  return { colorSignal, element, fixture };
}

describe('Highlight', () => {
  it('highlights in yellow by default', async () => {
    const { element } = await setup();

    expect(element.style.backgroundColor).toBe('yellow');
  });

  it('highlights in the bound color', async () => {
    const { element } = await setup({ color: 'lightblue' });

    expect(element.style.backgroundColor).toBe('lightblue');
  });

  it('applies a changed color', async () => {
    const { colorSignal, element, fixture } = await setup({
      color: 'lightblue',
    });

    colorSignal.set('pink');
    fixture.detectChanges();

    expect(element.style.backgroundColor).toBe('pink');
  });
});
