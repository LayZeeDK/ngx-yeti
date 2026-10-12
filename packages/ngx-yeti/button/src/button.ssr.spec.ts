import { Component, signal } from '@angular/core';
import { RouterLink, provideRouter } from '@angular/router';
import {
  allOpeningTags,
  attributeValue,
  headLinks,
  itemHref,
  itemLinkOf,
  jsactionTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import { YetiButton } from './button';
import { YetiButtonDisabledLink } from './button-disabled-link';

/**
 * Section 8's markup with translated labels, a static disabled link, and an
 * icon-only button whose name is translated (button.md, Testing Decisions,
 * layer 3).
 */
@Component({
  selector: 'yeti-button-fixture',
  imports: [RouterLink, YetiButton, YetiButtonDisabledLink],
  // eslint-disable-next-line @angular-eslint/component-max-inline-declarations -- the fixture is section 8's markup in one file, like the Fixture app's button fixture
  template: `<form>
    <button id="save" yetiButton type="button" i18n>Save</button>
    <button
      id="bold"
      yetiButton
      type="button"
      emphasis="medium"
      i18n
      [attr.aria-pressed]="bold()"
      (click)="bold.set(!bold())"
    >
      Bold
    </button>
    <button
      id="saving"
      yetiButton
      type="submit"
      i18n
      [attr.aria-busy]="saving()"
      [attr.aria-disabled]="saving()"
    >
      Saving
    </button>
    <label id="offline" yetiButton emphasis="medium"
      ><input type="checkbox" name="offline" checked />
      <span i18n>Keep maps offline</span></label
    >
    <a
      id="docs"
      yetiButton
      variant="secondary"
      size="lg"
      routerLink="/docs"
      i18n
      >Read the docs</a
    >
    <a
      id="next"
      yetiButton
      i18n
      [disabled]="last()"
      [routerLink]="last() ? null : ['/page', 3]"
      >Next</a
    >
    <a id="previous" yetiButton disabled i18n>Previous</a>
    <button id="close" yetiButton type="button">
      <svg role="img" aria-label="Close" i18n-aria-label viewBox="0 0 24 24">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  </form>`,
})
class ButtonFixture {
  protected readonly bold = signal(false);
  protected readonly saving = signal(true);
  protected readonly last = signal(true);
}

function render(): Promise<string> {
  return renderServer(ButtonFixture, { providers: [provideRouter([])] });
}

function tagById(html: string, id: string): string {
  const [tag] = allOpeningTags(html, '[a-z]+').filter(
    (candidate) => attributeValue(candidate, 'id') === id,
  );
  assert.exists(tag);

  return tag;
}

describe(YetiButton, () => {
  it('renders every host with its class and presence attribute, and no data-* for an unset input', async () => {
    expect.assertions(16);

    const html = await render();

    for (const id of ['save', 'bold', 'saving', 'offline']) {
      const tag = tagById(html, id);

      expect(attributeValue(tag, 'class')).toBe('button');
      expect(attributeValue(tag, 'data-ngx-yeti-item-button')).toBe('');
    }

    const save = tagById(html, 'save');

    expect(attributeValue(save, 'data-variant')).toBeNull();
    expect(attributeValue(save, 'data-emphasis')).toBeNull();
    expect(attributeValue(save, 'data-size')).toBeNull();
    expect(attributeValue(save, 'type')).toBe('button');
    expect(attributeValue(tagById(html, 'bold'), 'data-emphasis')).toBe(
      'medium',
    );
    expect(attributeValue(tagById(html, 'bold'), 'aria-pressed')).toBe('false');
    expect(attributeValue(tagById(html, 'saving'), 'aria-busy')).toBe('true');
    expect(attributeValue(tagById(html, 'saving'), 'aria-disabled')).toBe(
      'true',
    );
  });

  it('renders the bound attributes and the inert static size of a link', async () => {
    expect.assertions(5);

    const docs = tagById(await render(), 'docs');

    expect(attributeValue(docs, 'class')).toBe('button');
    expect(attributeValue(docs, 'data-variant')).toBe('secondary');
    expect(attributeValue(docs, 'data-size')).toBe('lg');
    expect(attributeValue(docs, 'size')).toBe('lg');
    expect(attributeValue(docs, 'href')).toBe('/docs');
  });

  it('renders the disabled links as placeholders with no href and no disabled', async () => {
    expect.assertions(10);

    const html = await render();

    for (const id of ['next', 'previous']) {
      const link = tagById(html, id);

      expect(attributeValue(link, 'class')).toBe('button');
      expect(attributeValue(link, 'role')).toBe('link');
      expect(attributeValue(link, 'aria-disabled')).toBe('true');
      expect(attributeValue(link, 'href')).toBeNull();
      expect(attributeValue(link, 'disabled')).toBeNull();
    }
  });

  it('keeps the toggle label input and the translated texts', async () => {
    expect.assertions(3);

    const html = await render();

    expect(html).toMatch(/<input[^>]*type="checkbox"[^>]*checked/);
    expect(html).toContain('Keep maps offline');
    expect(html).toContain('aria-label="Close"');
  });

  it('writes one button link and then one spinner link into the head', async () => {
    expect.assertions(7);

    const html = await render();
    const button = itemLinkOf(html, 'button');
    const spinner = itemLinkOf(html, 'spinner');

    expect(
      headLinks(html)
        .map((tag) => attributeValue(tag, 'data-ngx-yeti-styles'))
        .filter((item) => item !== null),
    ).toStrictEqual(['button', 'spinner']);
    expect(button.count).toBe(1);
    expect(button.beastiesSkip).toBe(true);
    expect(button.href).toMatch(itemHref('components', 'button'));
    expect(spinner.count).toBe(1);
    expect(spinner.beastiesSkip).toBe(true);
    expect(spinner.href).toMatch(itemHref('components', 'spinner'));
  });

  it('puts no jsaction from the package on any element', async () => {
    expect.assertions(1);

    // The consumer's (click) on the toggle and RouterLink's listener on the
    // two router links; the hosts with neither carry none.
    expect(
      jsactionTags(await render()).map((tag) => attributeValue(tag, 'id')),
    ).toStrictEqual(['bold', 'docs', 'next']);
  });
});
