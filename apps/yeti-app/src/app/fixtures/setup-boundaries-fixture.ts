import { isPlatformServer } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  HostAttributeToken,
  PLATFORM_ID,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { YetiCard } from 'ngx-yeti/card';
import { NgxYetiLift } from 'ngx-yeti/lift';

/** An error the fixture's probes throw on purpose. */
export class FixtureFault extends Error {}

/**
 * Fixture-only probe: throws in its constructor on the platform its
 * attribute names (`server` or `client`), standing in for a bug in an item
 * directive on the same host. After the consumer-boundaries prototype's
 * `boundary-probe.ts` (ticket 37).
 */
@Directive({ selector: '[appConstructorFault]' })
class ConstructorFault {
  constructor() {
    const platform = isPlatformServer(inject(PLATFORM_ID))
      ? 'server'
      : 'client';

    if (inject(new HostAttributeToken('appConstructorFault')) === platform) {
      throw new FixtureFault(
        `The probe threw in its constructor on the ${platform}`,
      );
    }
  }
}

/** Fixture-only probe: a host binding that throws while its input is true. */
@Directive({
  selector: '[appUpdateFault]',
  host: { '[attr.data-app-probe]': 'probe()' },
})
class UpdateFault {
  readonly appUpdateFault = input(false);

  protected readonly probe = computed(() => {
    if (this.appUpdateFault()) {
      throw new FixtureFault('The probe threw in a host binding');
    }

    return null;
  });
}

// Each case is its own component, so upstream bug A8 (a constructor error on
// a template's first creation breaks that template for the server process)
// cannot reach another case.
//
// The `@boundary` templates sit in constants: the template linter's bundled
// compiler does not parse `@boundary` yet, and it lints only templates
// written inline in the decorator. The Angular compiler resolves the
// constants. Move them back inline once the linter parses the block.

const serverErrorTemplate = `@boundary {
    <article id="server-error-card" yetiCard appConstructorFault="server">
      <h3>A card the server could not render</h3>
    </article>
  } @error {
    <p id="server-error-fallback">Fallback: the card failed on the server.</p>
  }`;

/** The server's card constructor throws; the client's does not. */
@Component({
  selector: 'app-server-error-case',
  imports: [ConstructorFault, YetiCard],
  template: serverErrorTemplate,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ServerErrorCase {}

const replacedClickTemplate = `<p id="replaced-clicks">Clicks on the fallback: {{ clicks() }}</p>
  @boundary {
    <article id="replaced-card" yetiCard appConstructorFault="server">
      <h3>A card that replaces the fallback</h3>
    </article>
  } @error {
    <button type="button" (click)="clicks.set(clicks() + 1)">
      Count a click on the fallback
    </button>
  }`;

/** The server's fallback holds a button; the client renders the card. */
@Component({
  selector: 'app-replaced-click-case',
  imports: [ConstructorFault, YetiCard],
  template: replacedClickTemplate,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ReplacedClickCase {
  protected readonly clicks = signal(0);
}

const deferOutsideTemplate = `<section id="defer-outside" aria-label="Boundary outside the defer">
    @boundary {
      @defer (on interaction) {
        <article yetiCard appConstructorFault="client">
          <h3>A card the client cannot create</h3>
        </article>
      } @placeholder {
        <button type="button">Show the card with the boundary outside</button>
      }
    } @error {
      <p>Fallback: the boundary outside caught the error.</p>
    }
  </section>`;

/** A boundary around a client-only `@defer`: it does not catch. */
@Component({
  selector: 'app-defer-outside-case',
  imports: [ConstructorFault, YetiCard],
  template: deferOutsideTemplate,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DeferOutsideCase {}

const deferInsideTemplate = `<section id="defer-inside" aria-label="Boundary inside the defer">
    @defer (on interaction) {
      @boundary {
        <article yetiCard appConstructorFault="client">
          <h3>A card the client cannot create</h3>
        </article>
      } @error {
        <p>Fallback: the boundary inside caught the error.</p>
      }
    } @placeholder {
      <button type="button">Show the card with the boundary inside</button>
    }
  </section>`;

/** A boundary inside a client-only `@defer`: it catches. */
@Component({
  selector: 'app-defer-inside-case',
  imports: [ConstructorFault, YetiCard],
  template: deferInsideTemplate,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DeferInsideCase {}

const resetTemplate = `<button type="button" [disabled]="broken()" (click)="broken.set(true)">
    Break the card
  </button>
  @boundary {
    <article id="reset-card" yetiCard yetiLift [appUpdateFault]="broken()">
      <h3>A card that can be reset</h3>
    </article>
  } @error {
    <button type="button" (click)="broken.set(false); $reset()">Reset the card</button>
  }`;

/** An update error, recovered by `$reset()`; `card` is preloaded, `lift` not. */
@Component({
  selector: 'app-reset-case',
  imports: [NgxYetiLift, UpdateFault, YetiCard],
  template: resetTemplate,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ResetCase {
  protected readonly broken = signal(false);
}

/**
 * Consumer `@boundary` and `@error` blocks around card hosts: ticket 37's
 * cases as setup.md:343 keeps them. One control removes the server-error
 * cases, whose cards the client renders, so the reset case's card is the
 * page's only card.
 */
@Component({
  selector: 'app-setup-boundaries-fixture',
  imports: [
    DeferInsideCase,
    DeferOutsideCase,
    ReplacedClickCase,
    ResetCase,
    ServerErrorCase,
  ],
  template: `<h2>Boundaries around cards</h2>
    <p i18n>
      A consumer's boundary catches some item errors and misses others.
    </p>
    <button
      type="button"
      [disabled]="!serverCases()"
      (click)="serverCases.set(false)"
    >
      Remove the server-error cases
    </button>
    @if (serverCases()) {
      <app-server-error-case />
      <app-replaced-click-case />
    }
    <app-defer-outside-case />
    <app-defer-inside-case />
    <app-reset-case />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupBoundariesFixture {
  protected readonly serverCases = signal(true);
}
