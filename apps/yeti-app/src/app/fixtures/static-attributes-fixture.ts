import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * A test-only directive in the removed-kind form of ticket 50 decision 9:
 * each input is named as the presentational attribute it takes, renders that
 * value on its `data-*` attribute, and removes the attribute from the host.
 * It is not package code.
 */
@Directive({
  selector: '[appStaticAttributeProbe]',
  host: {
    '[attr.data-align]': 'align()',
    '[attr.align]': 'null',
    '[attr.data-border]': 'border()',
    '[attr.border]': 'null',
    '[attr.data-nowrap]': 'nowrap()',
    '[attr.nowrap]': 'null',
    '[attr.data-start]': 'start()',
    '[attr.start]': 'null',
    '[attr.data-disabled]': 'disabled()',
    '[attr.disabled]': 'null',
  },
})
export class StaticAttributeProbe {
  readonly align = input<string>();
  readonly border = input<string>();
  readonly nowrap = input<string>();
  readonly start = input<string>();
  readonly disabled = input<string>();
}

/**
 * The static attribute measurement route: whether hydration, which writes
 * static attributes again before a binding wins (building-blocks.md:347),
 * lets a frame paint with a removed-kind attribute on its host. Nothing is
 * hidden until hydration.
 */
@Component({
  selector: 'app-static-attributes-fixture',
  imports: [RouterLink, StaticAttributeProbe],
  template: `<h2>Static attributes</h2>
    <p i18n>Each host below takes a presentational attribute as an input.</p>
    <div id="probe-block" appStaticAttributeProbe align="end">
      A block aligned to the end
    </div>
    <table id="probe-table" appStaticAttributeProbe border="1">
      <tbody>
        <tr>
          <td id="probe-cell" appStaticAttributeProbe align="right" nowrap>
            A cell aligned right
          </td>
        </tr>
      </tbody>
    </table>
    <ol id="probe-list" appStaticAttributeProbe start="2">
      <li>The second step</li>
      <li>The third step</li>
    </ol>
    <a id="probe-link" appStaticAttributeProbe href="replay" disabled>
      A disabled link
    </a>
    <a routerLink="/replay">Leave for the replay page</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaticAttributesFixture {}
