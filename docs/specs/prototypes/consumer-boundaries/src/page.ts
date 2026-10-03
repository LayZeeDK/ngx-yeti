// PROTOTYPE (ticket 37): consumer @boundary/@error blocks around the package's directive sketches.
// Route: <s|p>/<layout>/<where>/<phase>; s = server-rendered per request, p = prerendered at build.
//   layout: plain (one boundary), on (boundary around and inside @defer (hydrate on interaction)),
//           never (the same with hydrate never)
//   where:  none | server | client | both | reset (server throws; the client throws once per card)
//           | once (the server never throws; the client throws once per card)
//   phase:  ctor | host | effect | listener | anr | late (a host binding throws after "arm" is clicked)
import { isPlatformServer } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Fault, FaultPhase, YetiBadge, YetiProbeCard, YetiProbeLabel, YetiProbeLabelled, yetiFaultToken } from 'yeti-lib';

class RouteFault implements Fault {
  readonly #server = isPlatformServer(inject(PLATFORM_ID));
  readonly #params = inject(ActivatedRoute).snapshot.paramMap;
  readonly where = this.#params.get('where') ?? 'none';
  readonly phase = (this.#params.get('phase') ?? 'ctor') as FaultPhase;
  readonly #clientThrows = new Map<string, number>();
  readonly #armed = signal(false);

  armed(): boolean {
    return this.#armed();
  }

  arm(): void {
    this.#armed.set(true);
  }

  hit(phase: FaultPhase, name: string): boolean {
    if (phase !== this.phase || !name.startsWith('card')) {
      return false;
    }

    if (phase === 'late' && !this.#armed()) {
      return false;
    }

    switch (this.where) {
      case 'server': {
        return this.#server;
      }
      case 'client': {
        return !this.#server;
      }
      case 'both': {
        return true;
      }
      case 'reset':
      case 'once': {
        if (this.#server) {
          return this.where === 'reset';
        }

        const n = this.#clientThrows.get(name) ?? 0;
        this.#clientThrows.set(name, n + 1);

        return n < 1;
      }
      default: {
        return false;
      }
    }
  }
}

@Component({
  selector: 'app-page',
  imports: [YetiBadge, YetiProbeCard, YetiProbeLabel, YetiProbeLabelled],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RouteFault, { provide: yetiFaultToken, useExisting: RouteFault }],
  template: `
    <h1>{{ layout }} / {{ fault.where }} / {{ fault.phase }}</h1>
    <span yetiBadge data-t="badge">outside badge</span>
    <p yetiProbeLabel #o="yetiProbeLabel" data-t="outLabel">Outside label</p>
    <div [yetiProbeLabelled]="o" data-t="outLabelled">outside, labelled</div>
    <button type="button" data-t="arm" (click)="fault.arm()">arm</button>
    <p i18n data-t="i18nOut">Text outside the boundary</p>

    @switch (layout) {
      @case ('plain') {
        @boundary {
          <article yetiProbeCard data-t="cardA">
            <h3 yetiProbeLabel #ta="yetiProbeLabel">Card A</h3>
            <p [yetiProbeLabelled]="ta" i18n>Body A</p>
            <button type="button" data-t="countA" (click)="inc(a)">A clicks {{ a() }}</button>
          </article>
        } @error {
          <p data-t="fallbackA" role="alert">Fallback A: {{ $error.message }}</p>
          <button type="button" data-t="resetA" (click)="$reset()">Reset A</button>
        }
      }
      @case ('on') {
        @boundary {
          @defer (hydrate on interaction) {
            <article yetiProbeCard data-t="cardA">
              <h3 yetiProbeLabel #ta="yetiProbeLabel">Card A (boundary around the defer)</h3>
              <p [yetiProbeLabelled]="ta" i18n>Body A</p>
              <button type="button" data-t="countA" (click)="inc(a)">A clicks {{ a() }}</button>
            </article>
          }
        } @error {
          <p data-t="fallbackA" role="alert">Fallback A: {{ $error.message }}</p>
          <button type="button" data-t="resetA" (click)="$reset()">Reset A</button>
        }
        @defer (hydrate on interaction) {
          @boundary {
            <article yetiProbeCard data-t="cardB">
              <h3 yetiProbeLabel #tb="yetiProbeLabel">Card B (boundary inside the defer)</h3>
              <p [yetiProbeLabelled]="tb" i18n>Body B</p>
              <button type="button" data-t="countB" (click)="inc(b)">B clicks {{ b() }}</button>
            </article>
          } @error {
            <p data-t="fallbackB" role="alert">Fallback B: {{ $error.message }}</p>
            <button type="button" data-t="resetB" (click)="$reset()">Reset B</button>
          }
        }
      }
      @case ('never') {
        @boundary {
          @defer (hydrate never) {
            <article yetiProbeCard data-t="cardA">
              <h3 yetiProbeLabel #ta="yetiProbeLabel">Card A (boundary around the defer)</h3>
              <p [yetiProbeLabelled]="ta" i18n>Body A</p>
              <button type="button" data-t="countA" (click)="inc(a)">A clicks {{ a() }}</button>
            </article>
          }
        } @error {
          <p data-t="fallbackA" role="alert">Fallback A: {{ $error.message }}</p>
          <button type="button" data-t="resetA" (click)="$reset()">Reset A</button>
        }
        @defer (hydrate never) {
          @boundary {
            <article yetiProbeCard data-t="cardB">
              <h3 yetiProbeLabel #tb="yetiProbeLabel">Card B (boundary inside the defer)</h3>
              <p [yetiProbeLabelled]="tb" i18n>Body B</p>
              <button type="button" data-t="countB" (click)="inc(b)">B clicks {{ b() }}</button>
            </article>
          } @error {
            <p data-t="fallbackB" role="alert">Fallback B: {{ $error.message }}</p>
            <button type="button" data-t="resetB" (click)="$reset()">Reset B</button>
          }
        }
      }
    }
  `,
})
export class Page {
  protected readonly fault = inject(RouteFault);
  protected readonly layout = inject(ActivatedRoute).snapshot.paramMap.get('layout') ?? 'plain';
  protected readonly a = signal(0);
  protected readonly b = signal(0);

  protected inc(count: ReturnType<typeof signal<number>>): void {
    count.update((n) => n + 1);
  }
}
