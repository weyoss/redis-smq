/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { JSONSchema7 } from 'json-schema';
import type { ControllerResult, RequestInput } from './Controller.js';
import type { Deps } from '../deps/index.js';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head';

/**
 * A route: static metadata for the OpenAPI document, runtime schemas
 * for request validation, and the handler that produces the response.
 *
 * ## Why `handler` is declared with method syntax
 *
 * TypeScript checks function-typed property parameters
 * contravariantly under `strictFunctionTypes`, but **method parameters
 * bivariantly**. Route authors write handlers with narrowed input
 * types — `Controller<BodyInput<CreateQueueDTO>, Out>` — whose `input`
 * parameter is a *subtype* of `RequestInput`. Under contravariance,
 * that subtype is not assignable to the wider slot and every narrowed
 * handler fails to compile. Under bivariance, it is assignable — and
 * the direction accepted (`narrower` assignable to `wider`) is exactly
 * the one that matches the real relationship between the two types.
 *
 * Method syntax is invisible at the call site: `route.handler(deps,
 * input)` and `{ handler: someHandler }` behave identically. The only
 * observable difference is which assignments the compiler accepts —
 * and it accepts the ones we need.
 */
export interface RouteDefinition {
  method: HttpMethod;

  /**
   * Full URL path, including any `/api` prefix. Composed with the
   * server's `basePath` at registration time.
   */
  path: string;

  tags: string[];

  /**
   * Stable identifier for the operation. Enforced unique at build time
   * by `buildDocument`.
   */
  operationId: string;

  /**
   * Request schemas, keyed by source. Compiled into AJV validators
   * once at router construction.
   */
  request: {
    path?: JSONSchema7;
    query?: JSONSchema7;
    body?: JSONSchema7;
  };

  /**
   * Response schemas, keyed by HTTP status. Each has the envelope
   * already applied.
   */
  response: Record<number, JSONSchema7>;

  /**
   * The handler. Called by the router as `handler(deps, input)` after
   * request validation has passed.
   *
   * Declared with method syntax so that handlers with narrowed input
   * types — `Controller<BodyInput<SomeDTO>, Out>` — are assignable
   * under TypeScript's bivariant method-parameter checking. See the
   * file-level comment for the reasoning.
   */
  handler(deps: Deps, input: RequestInput): Promise<ControllerResult>;
}
