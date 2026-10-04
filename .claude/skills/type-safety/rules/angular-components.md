# Rule: Angular components, services, and templates

The root `eslint.config.mjs` spreads angular-eslint `tsAll` and `templateAll` through `angularConfig`. These presets enable every rule, not only the recommended ones. The config turns off `component-class-suffix`, `directive-class-suffix`, `require-localize-metadata`, `runtime-localize`, `template/no-call-expression` (a signal read is a call), `template/i18n`, `template/prefer-style-binding` (it recommends `[style.x]`, which `template/no-inline-styles` bans), and `template/use-track-by-function` (it only checks `*ngFor`).

Use host bindings or classes for styles. `template/no-inline-styles` bans both `style="..."` and `[style.x]` in templates. The `host: { '[attr.data-raised]': "raised() ? '' : null" }` binding in `packages/ngx-yeti/card/src/card.ts` is metadata, not template, so the template rules do not apply to it.

## Class-side rules that apply to new code

| Write this                                 | Not this                                                      | Rule                                                  |
| ------------------------------------------ | ------------------------------------------------------------- | ----------------------------------------------------- |
| `@Service()`                               | `@Injectable({ providedIn: 'root' })`                         | `prefer-service-decorator`                            |
| `readonly value = input()`                 | `@Input()`, or a signal property without `readonly`           | `prefer-signals`                                      |
| `readonly changed = output<T>()`           | `@Output() changed = new EventEmitter<T>()`, or no `readonly` | `prefer-output-emitter-ref`, `prefer-output-readonly` |
| `readonly value = model()`                 | An `input()` plus `valueChange` output pair                   | `prefer-signal-model`                                 |
| A non-DOM output name such as `cleared`    | An output named `reset`, `click`, or `change`                 | `no-output-native`                                    |
| `readonly #service = inject(Service)`      | Constructor parameter injection                               | `prefer-inject`                                       |
| `templateUrl` and `styleUrl`               | An inline template longer than 3 lines                        | `component-max-inline-declarations`                   |
| Leave out `changeDetection`                | `ChangeDetectionStrategy.Eager`                               | `prefer-on-push-component-change-detection`           |
| `yeti` prefix in `ngx-yeti`, `app` in apps | Any other selector prefix                                     | `component-selector`, `directive-selector`            |

Angular 22 makes OnPush the default, so the change-detection rule only reports an explicit `Eager`.

```typescript
@Service()
export class Greeter {
  readonly prefix = signal('Hello');

  greet(name: string): string {
    return `${this.prefix()}, ${name}`;
  }
}

@Component({
  selector: 'yeti-counter',
  templateUrl: './counter.html',
})
export class Counter {
  readonly #greeter = inject(Greeter);
  readonly label = input.required<string>();
  readonly step = input(1);
  readonly count = model(0);
  readonly cleared = output<number>();
  protected readonly greeting = computed(() => this.#greeter.greet(this.label()));

  protected increment(): void {
    this.count.update((value) => value + this.step());
  }
}
```

## Template rules

Template type errors and template lint errors come from different tools. Run both `nx lint` and `nx typecheck`.

Lint (`templateAll`) reports:

- `$any(x)`, from `template/no-any`.
- `x!`, from `template/no-non-null-assertion`. Narrow with `@if (user(); as user) { {{ user.name }} }` instead.

`nx typecheck` reports these because `tsconfig.base.json` sets every extended diagnostic to error:

- NG8107: `?.` on a value that cannot be null or undefined.
- NG8102: `??` on a value that cannot be null or undefined.
- NG8001: an unknown element, such as `<yeti-nope />`.

`nx test` compiles with `fastCompile` and reports none of these.
