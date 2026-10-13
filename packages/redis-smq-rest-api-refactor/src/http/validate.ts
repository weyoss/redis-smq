/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Ajv, type ValidateFunction } from 'ajv';
import {
  RequestValidationError,
  ResponseValidationError,
} from '../errors/index.js';
import type { RequestInput } from './Controller.js';
import type { RouteDefinition } from './RouteDefinition.js';
import { loadDefinitions } from './schema.js';

/**
 * One AJV instance for request schemas, one for response schemas.
 *
 * The two differ only in `coerceTypes`:
 *   - Requests: coercion is **on**. Path parameters and query strings
 *     arrive as strings; schemas declare them as `number`, `boolean`,
 *     arrays, etc. Coercion lets a caller write `?page=1` and get a
 *     numeric `page` in the validated input.
 *   - Responses: coercion is **off**. A handler must produce a value
 *     whose runtime type already matches the schema. Silently coercing
 *     a response hides handler bugs (returning `"5"` instead of `5`)
 *     that response validation exists to catch.
 *
 * `allErrors: true` collects every failing branch instead of stopping
 * at the first one — clients get the full diagnostic in one round-trip.
 *
 * `strict: false` is required because `ts-json-schema-generator` emits
 * keywords (`const`, `anyOf`, `additionalProperties`, `readonly`, …)
 * that AJV's strict mode rejects. The schemas are trusted — they come
 * from our own codegen, not from user input.
 *
 * `verbose: false` (the default) keeps the offending data out of AJV's
 * error objects, which is what `RequestValidationError.metadata.errorObjects`
 * forwards to the client. Verbose mode would echo back the input, which
 * is a data-leak risk for anything resembling credentials.
 */
export function createRequestAjv(): Ajv {
  return new Ajv({
    coerceTypes: true,
    allErrors: true,
    strict: false,
    useDefaults: false,
    removeAdditional: false,
  });
}

export function createResponseAjv(): Ajv {
  return new Ajv({
    coerceTypes: false,
    allErrors: true,
    strict: false,
    useDefaults: false,
    removeAdditional: false,
  });
}

/**
 * Compiled validators for one route's request. Each field is `null`
 * when the route does not accept input from that source.
 *
 * Compiled once, at router-build time, and closed over by the router's
 * per-request handler. Zero compilation cost per request.
 */
export interface CompiledRequestValidators {
  path: ValidateFunction | null;
  query: ValidateFunction | null;
  body: ValidateFunction | null;
}

/**
 * Compiled response validators for one route, keyed by status code.
 *
 * Only 2xx and 204 statuses are compiled. 4xx and 5xx responses are
 * produced by `errorHandler.ts`, not by handlers, and their shape is
 * verified where that error handler lives. Validating them here would
 * be dead code — handlers never return those statuses.
 *
 * 204 is excluded because there is no body to validate — the router
 * sends `null` and the schema `{ type: 'null' }` would accept it
 * trivially. Skipping saves one compiled function per route.
 */
export type CompiledResponseValidators = ReadonlyMap<number, ValidateFunction>;

/**
 * Compiles every request schema on the route into a validator, injecting
 * the shared `definitions` object so that `$ref: '#/definitions/Foo'`
 * resolves.
 *
 * The same `definitions` object is passed by reference into every
 * compiled schema — AJV does not deep-copy, so memory is shared across
 * all routes.
 */
export function compileRequestValidators(
  route: RouteDefinition,
  ajv: Ajv,
): CompiledRequestValidators {
  const definitions = loadDefinitions();
  const compile = (
    schema: RouteDefinition['request']['body'],
  ): ValidateFunction | null =>
    schema ? ajv.compile({ ...schema, definitions }) : null;

  return {
    path: compile(route.request.path),
    query: compile(route.request.query),
    body: compile(route.request.body),
  };
}

/**
 * Compiles every 2xx response schema on the route into a validator.
 *
 * `route.response` already contains envelope-applied schemas — the
 * `{ data: … }` wrapper is baked in by `getResponseSchemas`. The
 * validators produced here therefore expect the same shape the router
 * writes to `ctx.body`.
 */
export function compileResponseValidators(
  route: RouteDefinition,
  ajv: Ajv,
): CompiledResponseValidators {
  const definitions = loadDefinitions();
  const map = new Map<number, ValidateFunction>();

  for (const [statusStr, schema] of Object.entries(route.response)) {
    const status = Number(statusStr);
    if (status < 200 || status >= 300) continue;
    if (status === 204) continue;
    map.set(status, ajv.compile({ ...schema, definitions }));
  }

  return map;
}

/**
 * Runs the request validators against the extracted input.
 *
 * Iterates the three sources in a stable order — path, query, body — so
 * that when multiple sources fail, the error a caller sees is
 * deterministic across runs. (AJV collects all errors per schema, but
 * across sources we pick the first failing one, mirroring the original
 * package's ordering.)
 *
 * Throws `RequestValidationError` on the first source whose validator
 * returns `false`. The error's `metadata.errorObjects` carries AJV's
 * full diagnostic for that source.
 */
export function validateInput(
  validators: CompiledRequestValidators,
  input: RequestInput,
): void {
  const sources = ['path', 'query', 'body'] as const;

  for (const source of sources) {
    const validator = validators[source];
    if (!validator) continue;
    if (!validator(input[source])) {
      throw new RequestValidationError({
        metadata: { errorObjects: validator.errors ?? [] },
      });
    }
  }
}

/**
 * Runs the response validator for the given status, if one exists.
 *
 * The router calls this **after** wrapping the handler's body in the
 * response envelope, so `body` is what will actually be sent:
 *
 *   - `null` for 204 (no validator compiled; skipped)
 *   - `{ data: handlerBody }` for 2xx (validated against the
 *     envelope-applied schema)
 *
 * Silent no-op when no validator is compiled for `status`. This is
 * correct behavior for two cases:
 *
 *   1. `validateResponses` is disabled in production — the router
 *      doesn't call this function at all in that mode.
 *   2. A handler returns a 4xx/5xx directly (which none do, but the
 *      type allows). No validator exists for those statuses, so the
 *      body is passed through unchecked — a bug that surfaces at the
 *      HTTP test tier, not here.
 *
 * Throws `ResponseValidationError` on mismatch, with the same
 * `errorObjects` metadata shape as its request-side sibling.
 */
export function validateOutput(
  validators: CompiledResponseValidators,
  status: number,
  body: unknown,
): void {
  const validator = validators.get(status);
  if (!validator) return;
  if (!validator(body)) {
    throw new ResponseValidationError({
      metadata: { errorObjects: validator.errors ?? [] },
    });
  }
}
