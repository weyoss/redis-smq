/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { readFileSync } from 'fs';
import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import { constants } from '../config/index.js';

/**
 * Cache for the loaded schema file. Loaded once, on first use.
 *
 * Exposed for tests: `resetSchemaCache()` clears it so a test can
 * point `constants.jsonSchemaPath` at a different fixture and reload.
 * Production code never calls it.
 */
let cachedDefinitions: Record<string, JSONSchema7Definition> | null = null;

/**
 * Loads `dist/assets/schema.json` and returns its `definitions` object.
 *
 * The file is produced by `scripts/gen-json-schema.ts`, which runs
 * `ts-json-schema-generator` over every `*DTO.ts` file in
 * `src/features/`. Every `*RequestDTO` and `*ResponseDTO` type ends up
 * as a key in this map.
 *
 * Synchronous on purpose: called once, at router-build time, from
 * `compileRequestValidators`. Async would propagate through every
 * caller for no benefit.
 */
export function loadDefinitions(): Record<string, JSONSchema7Definition> {
  if (cachedDefinitions) return cachedDefinitions;

  const raw = JSON.parse(readFileSync(constants.jsonSchemaPath, 'utf8')) as {
    definitions?: Record<string, JSONSchema7Definition>;
  };
  cachedDefinitions = raw.definitions ?? {};
  return cachedDefinitions;
}

/**
 * Returns the raw JSON Schema definition for a given type name.
 *
 * Example:
 *   getSchema('CreateQueueControllerRequestBodyDTO')
 *   → { type: 'object', properties: { queue: {…}, queueType: {…} }, … }
 *
 * Throws if the name is absent. A missing name is a programming error:
 * either the DTO file was renamed without updating the route, or
 * `gen-json-schema.ts` hasn't run since the DTO was added. Both should
 * fail loudly, not silently degrade to a 500 at request time.
 */
export function getSchema(name: string): JSONSchema7 {
  const def = loadDefinitions()[name];
  if (!def || typeof def === 'boolean') {
    throw new Error(
      `Schema '${name}' not found in ${constants.jsonSchemaPath}. ` +
        `Did you run 'pnpm gen:json-schema'?`,
    );
  }
  return def;
}

/**
 * Converts a `*ControllerResponseDTO` schema into a per-status map of
 * the actual response body schemas a client will receive.
 *
 * Input: the DTO union, serialized by `ts-json-schema-generator` as
 *   `{ anyOf: [ [status, payload], [status, payload], … ] }`
 * where each branch is `{ type: 'array', minItems: 2, items: [status, payload] }`.
 *
 * Output: `Record<number, JSONSchema7>` where each value is the
 * *envelope-applied* body schema:
 *
 *   204            → { type: 'null' }
 *   2xx            → { type: 'object', properties: { data: payload }, … }
 *   4xx / 5xx      → { type: 'object', properties: { error: { code, message, details } }, … }
 *
 * If multiple branches declare the same status (e.g. two different 400
 * errors), their wrapped schemas are combined under a single
 * `{ anyOf: [...] }`.
 */
export function getResponseSchemas(name: string): Record<number, JSONSchema7> {
  const schema = getSchema(name);
  const branches = schema.anyOf ?? [schema];
  const grouped = new Map<number, JSONSchema7[]>();

  for (const branch of branches) {
    if (typeof branch === 'boolean') continue;
    if (branch.type !== 'array' || !Array.isArray(branch.items)) {
      throw new Error(
        `Schema '${name}' is not a valid ResponseDTO: expected an ` +
          `array-typed branch but got ${JSON.stringify(branch)}`,
      );
    }

    const [statusSchema, payloadSchema] = branch.items as [
      JSONSchema7 | boolean,
      JSONSchema7Definition,
    ];

    if (
      !statusSchema ||
      typeof statusSchema !== 'object' ||
      statusSchema.type !== 'number' ||
      typeof statusSchema.const !== 'number'
    ) {
      throw new Error(
        `Schema '${name}' has a branch whose first element is not a ` +
          `numeric const. Expected a ResponseDTO tuple like ` +
          `'readonly [200, Foo]'.`,
      );
    }

    const status = statusSchema.const;
    const wrapped = applyEnvelope(status, payloadSchema);
    const bucket = grouped.get(status);
    if (bucket) bucket.push(wrapped);
    else grouped.set(status, [wrapped]);
  }

  const result: Record<number, JSONSchema7> = {};
  for (const [status, schemas] of grouped) {
    result[status] = schemas.length === 1 ? schemas[0]! : { anyOf: schemas };
  }
  return result;
}

/**
 * Wraps a DTO's payload schema in the response envelope that the router
 * actually sends. Kept private — the envelope shape is an implementation
 * detail of this package and shouldn't be part of the public helper
 * surface.
 */
function applyEnvelope(
  status: number,
  payload: JSONSchema7Definition,
): JSONSchema7 {
  // 204 — no body, no envelope.
  if (status === 204) return { type: 'null' };

  // 2xx — { data: payload }.
  if (status >= 200 && status < 300) {
    return {
      type: 'object',
      properties: { data: payload as JSONSchema7 },
      required: ['data'],
      additionalProperties: false,
    };
  }

  // 4xx / 5xx — { error: { code, message, details } }.
  // The payload here is the *error name* const emitted by the DTO's
  // `TErrors['FooError']` branch, e.g. { const: 'QueueNotFoundError' }.
  // If a route declares a 4xx/5xx branch with a non-const payload, we
  // fall back to `{ type: 'string' }` — the error-handler always sends
  // the name as a string, so this is never wrong at runtime.
  const messageSchema =
    typeof payload === 'object' &&
    payload !== null &&
    'const' in payload &&
    typeof (payload as { const: unknown }).const === 'string'
      ? (payload as JSONSchema7)
      : ({ type: 'string' } as JSONSchema7);

  return {
    type: 'object',
    properties: {
      error: {
        type: 'object',
        properties: {
          code: { const: status },
          message: messageSchema,
          details: { type: 'object' },
        },
        required: ['code', 'message'],
        additionalProperties: true,
      },
    },
    required: ['error'],
    additionalProperties: false,
  };
}

/**
 * Test-only. Clears the module-level cache so a fixture with a
 * different `constants.jsonSchemaPath` can be loaded fresh.
 * Production code never needs this.
 */
export function resetSchemaCache(): void {
  cachedDefinitions = null;
}
