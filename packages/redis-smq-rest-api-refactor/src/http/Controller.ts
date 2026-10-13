/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Deps } from '../deps/index.js';

/**
 * The three sources of request data, extracted from Koa and passed to
 * the handler after validation.
 *
 * Each source is parameterized so a handler can declare the exact
 * shape it expects after schema validation:
 *
 *   - `PathDTO`  — dynamic path segments. Defaults to `Record<string, string>`,
 *                  the shape `ctx.params` has at runtime.
 *   - `QueryDTO` — parsed query string. Defaults to `Record<string, unknown>`,
 *                  the widest shape `ctx.query` can carry.
 *   - `BodyDTO`  — parsed JSON body. Defaults to `unknown` — no shape
 *                  assumed until a DTO narrows it.
 *
 * Handlers that only care about one source leave the others at their
 * defaults and only narrow the one that matters.
 */
export interface RequestInput<
  PathDTO = Record<string, string>,
  QueryDTO = Record<string, unknown>,
  BodyDTO = unknown,
> {
  path: PathDTO;
  query: QueryDTO;
  body: BodyDTO;
}

/**
 * Convenience aliases for the three common cases.
 *
 * A handler that only narrows the path uses `PathInput<P>`; one that
 * only narrows the query uses `QueryInput<Q>`; one that only narrows
 * the body uses `BodyInput<B>`. The full `RequestInput<P, Q, B>`
 * spelling is reserved for handlers that narrow two or more sources,
 * where it's clearer than nesting three aliases.
 */
export type PathInput<PathDTO> = RequestInput<
  PathDTO,
  Record<string, unknown>,
  unknown
>;
export type QueryInput<QueryDTO> = RequestInput<
  Record<string, string>,
  QueryDTO,
  unknown
>;
export type BodyInput<BodyDTO> = RequestInput<
  Record<string, string>,
  Record<string, unknown>,
  BodyDTO
>;

/**
 * The handler's return value. A tuple, not an object.
 */
export type ControllerResult<Out = unknown> = readonly [number, Out];

/**
 * A handler: `(deps, input) => Promise<[status, body]>`.
 *
 * `In` defaults to `RequestInput` — every source at its runtime
 * default. Handlers narrow it via one of the three type parameters
 * (or all three at once).
 */
export type Controller<In = RequestInput, Out = unknown> = (
  deps: Deps,
  input: In,
) => Promise<ControllerResult<Out>>;
