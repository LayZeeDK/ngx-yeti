import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { YetiIcon } from 'ngx-yeti/icon';
import { YetiScroller } from 'ngx-yeti/scroller';
import {
  YetiNumeric,
  YetiTable,
  YetiTableCell,
  YetiTableHead,
} from 'ngx-yeti/table';
import { YetiVisuallyHidden } from 'ngx-yeti/visually-hidden';

/**
 * The table spec's Fixture-app route (table.md:405-416): section 8's two
 * tables, the second with the static `border`, `align`, and cell `nowrap`
 * forms; a wide table in a scroller; a long table with a pinned head and a
 * link in each row; all removed by one control; a table in a
 * `hydrate never` block; and a table in a client-only `@defer` (the app
 * preloads `table`).
 */
@Component({
  selector: 'app-table-fixture',
  imports: [
    RouterLink,
    YetiIcon,
    YetiNumeric,
    YetiScroller,
    YetiTable,
    YetiTableCell,
    YetiTableHead,
    YetiVisuallyHidden,
  ],
  template: `<h2 i18n>Summit tables</h2>
    <button type="button" [disabled]="!live()" (click)="live.set(false)">
      Remove the live tables
    </button>
    <a routerLink="/replay">Leave for a page without tables</a>
    @if (live()) {
      <table id="summits" yetiTable striped hover>
        <caption>
          Summits
        </caption>
        <thead>
          <tr>
            <th scope="col">Peak</th>
            <th scope="col" yetiNumeric>Height (m)</th>
          </tr>
        </thead>
        <tbody>
          @for (summit of summits; track summit.name) {
            <tr>
              <td>{{ summit.name }}</td>
              <td yetiNumeric>{{ summit.height }}</td>
            </tr>
          }
        </tbody>
      </table>
      <table
        id="plans"
        yetiTable
        fixed
        border
        aria-label="Plans compared"
        i18n-aria-label
      >
        <thead>
          <tr>
            <th scope="col" class="app-table-feature">Feature</th>
            <th id="plans-free" scope="col" yetiTableCell align="center">
              Free
            </th>
            <th scope="col" yetiTableCell align="center">Walker</th>
          </tr>
        </thead>
        <tbody>
          <tr id="plans-row" yetiTableCell align="center">
            <th id="plans-feature" scope="row" yetiTableCell align="start">
              Offline maps
            </th>
            <td id="plans-centred">No</td>
            <td>
              <span yetiIcon
                ><svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                >
                  <path
                    d="M3 8l3 3 7-7"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  /></svg></span
              ><span yetiVisuallyHidden>Included</span>
            </td>
          </tr>
          <tr>
            <th scope="row">Route notes</th>
            <td id="plans-nowrap" yetiTableCell nowrap>Kept on one line</td>
            <td>Yes</td>
          </tr>
        </tbody>
      </table>
      <div id="wide-scroller" yetiScroller aria-labelledby="quarterly-results">
        <table yetiTable size="sm" border nowrap>
          <caption id="quarterly-results">
            Quarterly results
          </caption>
          <thead>
            <tr>
              <th scope="col">Region</th>
              <th scope="col" yetiNumeric>First quarter</th>
              <th scope="col" yetiNumeric>Second quarter</th>
              <th scope="col" yetiNumeric>Third quarter</th>
              <th scope="col" yetiNumeric>Fourth quarter</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">North</th>
              <td yetiNumeric>120</td>
              <td yetiNumeric>132</td>
              <td yetiNumeric>141</td>
              <td yetiNumeric>158</td>
            </tr>
          </tbody>
        </table>
      </div>
      <table id="pinned" yetiTable aria-label="Stage notes">
        <thead id="pinned-head" yetiTableHead sticky>
          <tr>
            <th scope="col">Stage</th>
            <th scope="col">Notes</th>
          </tr>
        </thead>
        <tbody>
          @for (stage of stages; track stage) {
            <tr>
              <th scope="row">Stage {{ stage }}</th>
              <td>
                <a href="#pinned">Notes for stage {{ stage }}</a>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
    @defer (hydrate never) {
      <table id="never-table" yetiTable fixed aria-label="Archived summits">
        <tbody>
          <tr>
            <td>Ben Nevis</td>
            <td>1,345</td>
          </tr>
        </tbody>
      </table>
    }
    @defer (on interaction) {
      <table id="client-table" yetiTable fixed aria-label="Later summits">
        <tbody>
          <tr>
            <td>Helvellyn</td>
            <td>950</td>
          </tr>
        </tbody>
      </table>
    } @placeholder {
      <button type="button">Show the client-only table</button>
    }`,
  styles: `
    .app-table-feature {
      inline-size: 40%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableFixture {
  protected readonly live = signal(true);
  protected readonly summits = [
    { name: 'Ben Nevis', height: '1,345' },
    { name: 'Snowdon', height: '1,085' },
    { name: 'Scafell Pike', height: '978' },
  ];
  protected readonly stages = Array.from(
    { length: 20 },
    (_, index) => index + 1,
  );
}

/**
 * `yetiNumeric` with no table (table.md:413): the page loads no `table.css`.
 */
@Component({
  selector: 'app-table-numeric-fixture',
  imports: [RouterLink, YetiNumeric],
  template: `<h2>Trail totals</h2>
    <p id="numeric-total" i18n>
      Total ascent: <span yetiNumeric>1,345</span> metres
    </p>
    <dl>
      <dt>Distance</dt>
      <dd yetiNumeric>14.2 km</dd>
    </dl>
    <a routerLink="/replay">Leave for the replay page</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableNumericFixture {}

/**
 * A negative control (table.md:411, usage rule 1): a table written without
 * a `tbody`. The browser's parser inserts one into the server HTML, so the
 * client's DOM differs and hydration logs an error. It is what not to
 * write, and it stays out of the axe and no-mismatch checks. It has no
 * listener, so no `jsaction` marker waits for the hydration it breaks.
 */
@Component({
  selector: 'app-table-without-tbody-fixture',
  imports: [YetiTable],
  template: `<h2 i18n>What not to write: a table without a tbody</h2>
    <table id="without-tbody" yetiTable aria-label="Summits without a tbody">
      <tr>
        <td>Ben Nevis</td>
        <td>1,345</td>
      </tr>
    </table>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableWithoutTbodyFixture {}
