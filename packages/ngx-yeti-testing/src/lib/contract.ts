import type { Type } from '@angular/core';

/** The part of a Yeti manifest component the contract check reads. */
export interface ContractComponent {
  readonly class: string;
  readonly attributes: readonly ContractManifestMember[];
  readonly markers: readonly ContractManifestMember[];
  readonly js: readonly ContractManifestModule[] | null;
}

export interface ContractManifestMember {
  readonly name: string;
  readonly type: string;
  readonly values?: readonly string[];
}

export interface ContractManifestModule {
  readonly events?: readonly { readonly name: string }[];
}

/** One attribute or marker, mapped to an input of a directive. */
export interface ContractMember {
  readonly directive: Type<unknown>;
  readonly input: string;
  /** The values of the input's union, for an `enum` attribute. */
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
  readonly attributes: Readonly<Record<string, ContractMember>>;
  readonly markers: Readonly<Record<string, ContractMember>>;
  readonly events: Readonly<Record<string, ContractEvent>>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function directiveKeys(
  directive: Type<unknown>,
  field: 'inputs' | 'outputs',
): string[] {
  const def: unknown = Reflect.get(directive, 'ɵdir');
  const keys = isRecord(def) ? def[field] : undefined;

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

function checkMembers(
  kind: 'attribute' | 'marker',
  manifest: readonly ContractManifestMember[],
  mapped: Readonly<Record<string, ContractMember>>,
): string[] {
  const problems: string[] = [];

  for (const { name, type, values } of manifest) {
    const member = mapped[name];

    if (member === undefined) {
      problems.push(`${kind} ${name} is not mapped`);

      continue;
    }

    if (!directiveInputs(member.directive).includes(member.input)) {
      problems.push(
        `${kind} ${name}: ${member.directive.name} has no input ${member.input}`,
      );
    }

    if (type === 'enum' && values !== undefined) {
      const union = member.values ?? [];

      for (const value of values.filter((v) => !union.includes(v))) {
        problems.push(`${kind} ${name}: the union lacks the value ${value}`);
      }

      for (const value of union.filter((v) => !values.includes(v))) {
        problems.push(
          `${kind} ${name}: the union holds ${value}, which the manifest lacks`,
        );
      }
    } else if (member.values !== undefined) {
      problems.push(`${kind} ${name}: has a union, but is a ${type}`);
    }
  }

  for (const name of Object.keys(mapped)) {
    if (!manifest.some((member) => member.name === name)) {
      problems.push(`${kind} ${name} is mapped but absent from the manifest`);
    }
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
    ...checkMembers('attribute', component.attributes, mapping.attributes),
    ...checkMembers('marker', component.markers, mapping.markers),
  ];

  for (const { name } of events) {
    const event = mapping.events[name];

    if (event === undefined) {
      problems.push(`event ${name} is not mapped`);
    } else if (!directiveOutputs(event.directive).includes(event.output)) {
      problems.push(
        `event ${name}: ${event.directive.name} has no output ${event.output}`,
      );
    }
  }

  for (const name of Object.keys(mapping.events)) {
    if (!events.some((event) => event.name === name)) {
      problems.push(`event ${name} is mapped but absent from the manifest`);
    }
  }

  return problems;
}

/** The opening tags of every element named `tag`, in document order. */
export function openingTags(html: string, tag: string): string[] {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))].map(
    ([match]) => match,
  );
}

/** The value of attribute `name` in an opening tag, or `null` when absent. */
export function attributeValue(tag: string, name: string): string | null {
  const match = new RegExp(`\\s${name}(?:="([^"]*)")?[\\s/>]`).exec(tag);

  return match === null ? null : (match[1] ?? '');
}
