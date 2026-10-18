import { Component, signal } from '@angular/core';
import {
  attributeValue,
  headLinks,
  itemHref,
  itemLinkOf,
  jsactionTags,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import type { YetiGap } from 'ngx-yeti';
import { YetiStack } from './stack';
import { YetiStackChild } from './stack-child';

/**
 * A stack with a bound `gap` and one child carrying every marker, and a
 * stack written with the static `align` (stack.md, Testing Decisions, layer
 * 3).
 */
@Component({
  selector: 'yeti-stack-fixture',
  imports: [YetiStack, YetiStackChild],
  template:
    '<section yetiStack [gap]="gap()"><h2 i18n>Trail notes</h2><p yetiStackChild split space="3xl" sticky i18n>Pushed to the bottom when the stack has room.</p></section><article yetiStack align="center"><p i18n>A note that keeps its own width.</p></article>',
})
class StackFixture {
  protected readonly gap = signal<YetiGap>('lg');
}

function render(): Promise<string> {
  return renderServer(StackFixture);
}

describe(YetiStack, () => {
  it('renders the stack host with its class, presence attribute, and bound gap', async () => {
    expect.assertions(8);

    const html = await render();
    const [stack, ...rest] = openingTags(html, 'section');
    assert.exists(stack);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(stack, 'class')).toBe('stack');
    expect(attributeValue(stack, 'data-ngx-yeti-item-stack')).toBe('');
    expect(attributeValue(stack, 'data-gap')).toBe('lg');
    expect(attributeValue(stack, 'data-align')).toBeNull();
    expect(attributeValue(stack, 'data-fill')).toBeNull();
    expect(attributeValue(stack, 'data-rule')).toBeNull();
    expect(html).toContain('Trail notes');
  });

  it("renders the child's markers and no presence attribute on it", async () => {
    expect.assertions(4);

    const [child] = openingTags(await render(), 'p');
    assert.exists(child);

    expect(attributeValue(child, 'data-split')).toBe('');
    expect(attributeValue(child, 'data-space')).toBe('3xl');
    expect(attributeValue(child, 'data-sticky')).toBe('');
    expect(child).not.toContain('data-ngx-yeti-');
  });

  it('renders a static align on data-align and writes no align attribute', async () => {
    expect.assertions(2);

    const [stack] = openingTags(await render(), 'article');
    assert.exists(stack);

    expect(attributeValue(stack, 'data-align')).toBe('center');
    expect(attributeValue(stack, 'align')).toBeNull();
  });

  it('writes one stack item link into the head', async () => {
    expect.assertions(4);

    const html = await render();
    const link = itemLinkOf(html, 'stack');

    expect(
      headLinks(html).filter(
        (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
      ),
    ).toHaveLength(1);
    expect(link.count).toBe(1);
    expect(link.beastiesSkip).toBe(true);
    expect(link.href).toMatch(itemHref('layouts', 'stack'));
  });

  it('puts no jsaction on any element', async () => {
    expect.assertions(1);

    expect(jsactionTags(await render())).toStrictEqual([]);
  });
});
