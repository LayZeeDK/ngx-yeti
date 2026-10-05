// The JIT compiler, for the components this file defines at run time.
import '@angular/compiler';
import {
  type Binding,
  Component,
  createComponent,
  DebugElement,
  DOCUMENT,
  EnvironmentInjector,
  getDebugNode,
  inject,
  inputBinding,
  outputBinding,
  provideAppInitializer,
  type Type,
} from '@angular/core';
import { By } from '@angular/platform-browser';
import type { YetiComponent } from 'yeti-css';
import { renderServer } from './render-server';

/** The part of a Yeti manifest component the contract check reads. */
export type ContractComponent = Pick<
  YetiComponent,
  'class' | 'classes' | 'attributes' | 'markers' | 'js'
>;

/** One class, attribute, or marker, mapped to an input of a directive. */
export interface ContractMember {
  readonly directive: Type<unknown>;
  readonly input: string;
  /** The values of the input's union, for an `enum` attribute or marker. */
  readonly values?: readonly string[];
  /**
   * The attribute of the directive's selector, as in `yetiCardLink`, for a
   * marker whose `on` lists elements: the check writes it on each listed
   * element and on one other element.
   */
  readonly selectorAttribute?: string;
}

/** One event, mapped to an output of a directive. */
export interface ContractEvent {
  readonly directive: Type<unknown>;
  readonly output: string;
}

/** What a spec says its directives map from the manifest (ADR 0014 point 3). */
export interface ContractMapping {
  /** The directive whose host carries the component's class. */
  readonly class: Type<unknown>;
  /** The modifier classes; omit when the component has none. */
  readonly classes?: Readonly<Record<string, ContractMember>>;
  readonly attributes: Readonly<Record<string, ContractMember>>;
  readonly markers: Readonly<Record<string, ContractMember>>;
  readonly events: Readonly<Record<string, ContractEvent>>;
}

interface ManifestMember {
  readonly name: string;
  readonly type: string;
  readonly values?: readonly string[];
  readonly on?: string;
}

type Kind = 'class' | 'attribute' | 'marker';

/** Where the check renders: the server application's injector and page. */
interface Page {
  readonly injector: EnvironmentInjector;
  readonly document: Document;
}

/** A component compiled at run time, so its template can be built then. */
function jitComponent(metadata: Component): Type<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Angular defines a component on a class; this one needs no members.
  return Component(metadata)(class {});
}

/** The component every directive is applied to with `createComponent`. */
const ContractHost = jitComponent({
  selector: 'yeti-contract-host',
  template: '',
});

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Applies `directive` with `bindings` to a new `div` and reads the host
 * after one change detection. `directives` applies the directive without
 * matching its selector, so this proves the bindings, not the selector.
 */
function renderDirective<T>(
  page: Page,
  directive: Type<unknown>,
  bindings: Binding[],
  read: (host: Element) => T,
): T {
  const hostElement = page.document.createElement('div');
  const ref = createComponent(ContractHost, {
    environmentInjector: page.injector,
    hostElement,
    directives: [{ type: directive, bindings }],
  });

  try {
    ref.changeDetectorRef.detectChanges();

    return read(hostElement);
  } finally {
    ref.destroy();
  }
}

/** One line per name only one side lists, as `<label> <name> <message>`. */
function diffNames(
  label: string,
  manifest: readonly string[],
  mapped: readonly string[],
): string[] {
  return [
    ...manifest
      .filter((name) => !mapped.includes(name))
      .map((name) => `${label} ${name} is not mapped`),
    ...mapped
      .filter((name) => !manifest.includes(name))
      .map((name) => `${label} ${name} is mapped but absent from the manifest`),
  ];
}

function checkValues(
  label: string,
  type: string,
  manifest: readonly string[] | undefined,
  union: readonly string[] | undefined,
): string[] {
  if (type !== 'enum') {
    return union === undefined
      ? []
      : [`${label}: has a union, but is a ${type}`];
  }

  if (manifest === undefined) {
    return [`${label}: an enum the manifest lists no values for`];
  }

  if (union === undefined) {
    return [`${label}: an enum mapped without the union's values`];
  }

  return [
    ...manifest
      .filter((value) => !union.includes(value))
      .map((value) => `${label}: the union lacks the value ${value}`),
    ...union
      .filter((value) => !manifest.includes(value))
      .map(
        (value) =>
          `${label}: the union holds ${value}, which the manifest lacks`,
      ),
  ];
}

function checkClass(
  page: Page,
  name: string,
  directive: Type<unknown>,
): string[] {
  try {
    return renderDirective(page, directive, [], (host) =>
      host.classList.contains(name),
    )
      ? []
      : [`class ${name}: ${directive.name} does not write it`];
  } catch (error) {
    return [`class ${name}: ${directive.name} threw ${errorMessage(error)}`];
  }
}

/**
 * Sets the input to each value the manifest allows and reads what the host
 * renders: the class `name`, or the attribute `name` with that value (`''`
 * for a boolean).
 */
function checkBinding(
  page: Page,
  kind: Kind,
  label: string,
  { name, type, values }: ManifestMember,
  { directive, input }: ContractMember,
): string[] {
  const samples: readonly (string | boolean)[] =
    type === 'enum' ? (values ?? []) : type === 'boolean' ? [true] : ['text'];
  const problems: string[] = [];

  for (const value of samples) {
    const expected = value === true ? '' : String(value);
    const setting = `${directive.name} with ${input} = ${JSON.stringify(value)}`;

    try {
      const rendered = renderDirective(
        page,
        directive,
        [inputBinding(input, () => value)],
        (host) =>
          kind === 'class'
            ? host.classList.contains(name)
              ? expected
              : null
            : host.getAttribute(name),
      );

      if (rendered !== expected) {
        problems.push(
          `${label}: ${setting} renders ${rendered === null ? `no ${kind === 'class' ? 'class ' : ''}${name}` : `${name}="${rendered}"`}`,
        );
      }
    } catch (error) {
      const message = errorMessage(error);

      // NG0315: the directive has no input with that public name.
      problems.push(
        message.includes('NG0315')
          ? `${label}: ${directive.name} has no input ${input}`
          : `${label}: ${setting} threw ${message}`,
      );

      break;
    }
  }

  return problems;
}

/**
 * A marker whose `on` is a list of element names must map to a directive
 * that matches those elements and no other; an `on` relative to the item
 * root (`> *`) says nothing a selector can show. The check renders the
 * selector attribute on each listed element and on one more.
 */
function checkOn(
  page: Page,
  label: string,
  on: string | undefined,
  { directive, selectorAttribute }: ContractMember,
): string[] {
  const elements = on?.split(',').map((element) => element.trim()) ?? [];

  if (
    elements.length === 0 ||
    !elements.every((element) => /^[a-z][a-z0-9-]*$/.test(element))
  ) {
    return [];
  }

  if (selectorAttribute === undefined) {
    return [`${label}: on ${on ?? ''} needs the mapping's selectorAttribute`];
  }

  const other = elements.includes('div') ? 'span' : 'div';
  // ponytail: no void elements yet; `<img x></img>` would not compile.
  const template = [...elements, other]
    .map((element) => `<${element} ${selectorAttribute}></${element}>`)
    .join('');
  const host = jitComponent({ template, imports: [directive] });
  const hostElement = page.document.createElement('div');
  const ref = createComponent(host, {
    environmentInjector: page.injector,
    hostElement,
  });

  try {
    ref.changeDetectorRef.detectChanges();

    const root = getDebugNode(hostElement);
    const matched =
      root instanceof DebugElement
        ? root.queryAll(By.directive(directive)).map(({ name }) => name)
        : [];

    return [
      ...elements
        .filter((element) => !matched.includes(element))
        .map(
          (element) =>
            `${label}: ${directive.name} does not match <${element} ${selectorAttribute}>`,
        ),
      ...(matched.includes(other)
        ? [
            `${label}: ${directive.name} matches elements other than ${elements.join(', ')}`,
          ]
        : []),
    ];
  } finally {
    ref.destroy();
  }
}

function checkMembers(
  page: Page,
  kind: Kind,
  manifest: readonly ManifestMember[],
  mapped: Readonly<Record<string, ContractMember>>,
): string[] {
  const problems = diffNames(
    kind,
    manifest.map(({ name }) => name),
    Object.keys(mapped),
  );

  for (const member of manifest) {
    const mapping = mapped[member.name];

    if (mapping === undefined) {
      continue;
    }

    const label = `${kind} ${member.name}`;

    problems.push(
      ...checkValues(label, member.type, member.values, mapping.values),
      ...checkBinding(page, kind, label, member, mapping),
      ...checkOn(page, label, member.on, mapping),
    );
  }

  return problems;
}

function checkEvent(page: Page, name: string, event: ContractEvent): string[] {
  try {
    renderDirective(
      page,
      event.directive,
      [outputBinding(event.output, () => undefined)],
      () => undefined,
    );

    return [];
  } catch (error) {
    const message = errorMessage(error);

    // NG0316: the directive has no output with that public name.
    return [
      message.includes('NG0316')
        ? `event ${name}: ${event.directive.name} has no output ${event.output}`
        : `event ${name}: ${event.directive.name} threw ${message}`,
    ];
  }
}

function check(
  page: Page,
  component: ContractComponent,
  mapping: ContractMapping,
): string[] {
  const events = (component.js ?? []).flatMap((module) => module.events ?? []);
  const problems = [
    ...checkClass(page, component.class, mapping.class),
    ...checkMembers(page, 'class', component.classes, mapping.classes ?? {}),
    ...checkMembers(
      page,
      'attribute',
      component.attributes,
      mapping.attributes,
    ),
    ...checkMembers(page, 'marker', component.markers, mapping.markers),
    ...diffNames(
      'event',
      events.map(({ name }) => name),
      Object.keys(mapping.events),
    ),
  ];

  for (const { name } of events) {
    const event = mapping.events[name];

    if (event !== undefined) {
      problems.push(...checkEvent(page, name, event));
    }
  }

  return problems;
}

/**
 * Compares one manifest component with a spec's mapping and resolves every
 * mismatch, as one line each; an empty list is a pass. It renders each
 * mapped directive in a server application and sets each input to each
 * manifest value, so it proves what the host renders, through public
 * Angular API only. Item-agnostic: each item spec supplies its own component
 * and mapping.
 */
export async function checkContract(
  component: ContractComponent,
  mapping: ContractMapping,
): Promise<string[]> {
  const problems: string[] = [];

  await renderServer(ContractHost, {
    providers: [
      provideAppInitializer(() => {
        problems.push(
          ...check(
            {
              injector: inject(EnvironmentInjector),
              document: inject(DOCUMENT),
            },
            component,
            mapping,
          ),
        );
      }),
    ],
  });

  return problems;
}
