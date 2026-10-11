import { Component, signal } from '@angular/core';
import {
  allOpeningTags,
  attributeValue,
  headLinks,
  openingTags,
  renderServer,
} from '@ngx-yeti/testing/server';
import type { YetiVariant } from 'ngx-yeti';
import { YetiSpinner } from './spinner';

/**
 * Section 8's markup with a bound `variant`, a translated name and visible
 * text, and a `@defer` block with a spinner in its `@placeholder` (spinner.md,
 * Testing Decisions, layer 3).
 */
@Component({
  selector: 'yeti-spinner-fixture',
  imports: [YetiSpinner],
  // eslint-disable-next-line @angular-eslint/component-max-inline-declarations -- the fixture is section 8's markup in one file, like the Fixture app's spinner fixture
  template: `@if (loading()) {
      <p>
        <span
          id="loading"
          yetiSpinner
          role="status"
          aria-label="Loading"
          i18n-aria-label
        ></span>
        <span i18n>Loading the latest posts</span>
      </p>
    }
    <p>
      Searching
      <span
        id="searching"
        yetiSpinner
        size="lg"
        role="status"
        aria-label="Searching"
        [variant]="hue()"
      ></span>
    </p>
    @defer (on idle) {
      <p>Comments arrived.</p>
    } @placeholder {
      <p>
        <span
          id="placeholder"
          yetiSpinner
          role="status"
          aria-label="Loading comments"
        ></span>
        Loading comments
      </p>
    }`,
})
class SpinnerFixture {
  protected readonly loading = signal(true);
  protected readonly hue = signal<YetiVariant>('neutral');
}

function render(): Promise<string> {
  return renderServer(SpinnerFixture);
}

function spinnerById(html: string, id: string): string {
  const [tag] = openingTags(html, 'span').filter(
    (candidate) => attributeValue(candidate, 'id') === id,
  );
  assert.exists(tag);

  return tag;
}

describe(YetiSpinner, () => {
  it('renders an unset spinner with its class, presence attribute, role, and name only', async () => {
    expect.assertions(6);

    const html = await render();
    const loading = spinnerById(html, 'loading');

    expect(attributeValue(loading, 'class')).toBe('spinner');
    expect(attributeValue(loading, 'data-ngx-yeti-item-spinner')).toBe('');
    expect(attributeValue(loading, 'role')).toBe('status');
    expect(attributeValue(loading, 'aria-label')).toBe('Loading');
    expect(attributeValue(loading, 'data-variant')).toBeNull();
    expect(attributeValue(loading, 'data-size')).toBeNull();
  });

  it('renders the bound variant, the static size, and the inert size attribute', async () => {
    expect.assertions(5);

    const searching = spinnerById(await render(), 'searching');

    expect(attributeValue(searching, 'class')).toBe('spinner');
    expect(attributeValue(searching, 'data-variant')).toBe('neutral');
    expect(attributeValue(searching, 'data-size')).toBe('lg');
    expect(attributeValue(searching, 'size')).toBe('lg');
    expect(attributeValue(searching, 'aria-label')).toBe('Searching');
  });

  it("renders the spinner of a @defer block's @placeholder and the translated text", async () => {
    expect.assertions(3);

    const html = await render();
    const placeholder = spinnerById(html, 'placeholder');

    expect(attributeValue(placeholder, 'class')).toBe('spinner');
    expect(html).toContain('Loading the latest posts');
    expect(html).not.toContain('Comments arrived.');
  });

  it('writes one spinner item link into the head', async () => {
    expect.assertions(4);

    const links = headLinks(await render()).filter(
      (tag) => attributeValue(tag, 'data-ngx-yeti-styles') !== null,
    );
    const [link, ...rest] = links;
    assert.exists(link);

    expect(rest).toStrictEqual([]);
    expect(attributeValue(link, 'data-ngx-yeti-styles')).toBe('spinner');
    expect(attributeValue(link, 'data-beasties-skip')).toBe('');
    expect(attributeValue(link, 'href')).toMatch(
      /^yeti-css\/components\/spinner\/spinner\.css\?v=[0-9a-f]{40}$/,
    );
  });

  it('puts no jsaction on any element', async () => {
    expect.assertions(1);

    expect(
      allOpeningTags(await render(), '[a-z][\\w-]*').filter(
        (tag) => attributeValue(tag, 'jsaction') !== null,
      ),
    ).toStrictEqual([]);
  });
});
