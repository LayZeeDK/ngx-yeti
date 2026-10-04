import type { Type } from '@angular/core';
import type { YetiComponent } from 'yeti-css';

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
}

/** One event, mapped to an output of a directive. */
export interface ContractEvent {
  readonly directive: Type<unknown>;
  readonly output: string;
}

/** What a spec says its directives map from the manifest (ADR 0014 point 3). */
export interface ContractMapping {
  readonly class: string;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function directiveDef(directive: Type<unknown>): Record<string, unknown> {
  const def: unknown = Reflect.get(directive, 'ɵdir');

  return isRecord(def) ? def : {};
}

function directiveKeys(
  directive: Type<unknown>,
  field: 'inputs' | 'outputs',
): string[] {
  const keys = directiveDef(directive)[field];

  return isRecord(keys) ? Object.keys(keys) : [];
}

/** The public input names of a directive. */
export function directiveInputs(directive: Type<unknown>): string[] {
  return directiveKeys(directive, 'inputs');
}

/** The public output names of a directive. */
export function directiveOutputs(directive: Type<unknown>): string[] {
  return directiveKeys(directive, 'outputs');
}

/**
 * The element name each selector of a directive requires, `''` for a
 * selector that matches any element.
 */
function selectorElements(directive: Type<unknown>): string[] {
  const selectors = directiveDef(directive)['selectors'];

  return Array.isArray(selectors)
    ? selectors.map((selector: unknown) => {
        const element: unknown = Array.isArray(selector) ? selector[0] : '';

        return typeof element === 'string' ? element : '';
      })
    : [];
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

/**
 * A marker whose `on` is a list of element names must map to a directive
 * that matches only those elements; an `on` relative to the item root
 * (`> *`) says nothing a selector can show.
 */
function checkOn(
  label: string,
  on: string | undefined,
  member: ContractMember,
): string[] {
  const elements = on?.split(',').map((element) => element.trim()) ?? [];

  if (
    elements.length === 0 ||
    !elements.every((element) => /^[a-z][a-z0-9-]*$/.test(element))
  ) {
    return [];
  }

  return selectorElements(member.directive).some(
    (element) => !elements.includes(element),
  )
    ? [
        `${label}: ${member.directive.name} matches elements other than ${elements.join(', ')}`,
      ]
    : [];
}

function checkMembers(
  kind: 'class' | 'attribute' | 'marker',
  manifest: readonly ManifestMember[],
  mapped: Readonly<Record<string, ContractMember>>,
): string[] {
  const problems = diffNames(
    kind,
    manifest.map(({ name }) => name),
    Object.keys(mapped),
  );

  for (const { name, type, values, on } of manifest) {
    const member = mapped[name];

    if (member === undefined) {
      continue;
    }

    const label = `${kind} ${name}`;

    if (!directiveInputs(member.directive).includes(member.input)) {
      problems.push(
        `${label}: ${member.directive.name} has no input ${member.input}`,
      );
    }

    problems.push(
      ...checkValues(label, type, values, member.values),
      ...checkOn(label, on, member),
    );
  }

  return problems;
}

/**
 * Compares one manifest component with a spec's mapping and returns every
 * mismatch, as one line each; an empty list is a pass. Item-agnostic: each
 * item spec supplies its own component and mapping.
 */
export function checkContract(
  component: ContractComponent,
  mapping: ContractMapping,
): string[] {
  const events = (component.js ?? []).flatMap((module) => module.events ?? []);
  const problems = [
    ...(component.class === mapping.class
      ? []
      : [`class ${component.class} is mapped as ${mapping.class}`]),
    ...checkMembers('class', component.classes, mapping.classes ?? {}),
    ...checkMembers('attribute', component.attributes, mapping.attributes),
    ...checkMembers('marker', component.markers, mapping.markers),
    ...diffNames(
      'event',
      events.map(({ name }) => name),
      Object.keys(mapping.events),
    ),
  ];

  for (const { name } of events) {
    const event = mapping.events[name];

    if (
      event !== undefined &&
      !directiveOutputs(event.directive).includes(event.output)
    ) {
      problems.push(
        `event ${name}: ${event.directive.name} has no output ${event.output}`,
      );
    }
  }

  return problems;
}
