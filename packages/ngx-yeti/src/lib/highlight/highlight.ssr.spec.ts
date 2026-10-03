import { Component } from '@angular/core';
import { renderServer } from '@ngx-yeti/testing/server';
import { Highlight } from './highlight';

@Component({
  selector: 'yeti-highlight-fixture',
  imports: [Highlight],
  template: '<span yetiHighlight="pink" i18n>Highlighted</span>',
})
class HighlightFixture {}

describe(Highlight, () => {
  it('renders the bound colour on the server', async () => {
    expect.assertions(2);

    const html = await renderServer(HighlightFixture);

    expect(html).toContain(
      '<span yetihighlight="pink" style="background-color: pink;">Highlighted</span>',
    );
    expect(html).toMatch(/<yeti-highlight-fixture[^>]* ngh="0"/);
  });
});
