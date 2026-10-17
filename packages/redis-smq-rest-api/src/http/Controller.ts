/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Deps } from '../deps/index.js';

export interface RequestInput<
  PathDTO = Record<string, string>,
  QueryDTO = Record<string, unknown>,
  BodyDTO = unknown,
> {
  path: PathDTO;
  query: QueryDTO;
  body: BodyDTO;
}

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

/** Tuple shape the router reads from a handler's return value. */
export type ControllerResult = readonly [number, unknown];

/**
 * Every 2xx status a handler is allowed to return.
 *
 * Enumerated rather than expressed as a range — TypeScript has no
 * range over numeric literals, and a template-literal trick would
 * accept `2999` (starts with 2) while rejecting `99` for the wrong
 * reason. The explicit union is unambiguous.
 */
export type SuccessStatus =
  | 200 // OK
  | 201 // Created
  | 202 // Accepted
  | 203 // Non-Authoritative Information
  | 204 // No Content
  | 205 // Reset Content
  | 206 // Partial Content
  | 207 // Multi-Status
  | 208 // Already Reported
  | 226; // IM Used

/**
 * Extracts the 2xx branches of a response DTO.
 *
 * A response DTO is a union of `readonly [status, payload]` tuples —
 * one per status the endpoint can return, plus the `TErrors['X']`
 * entries that carry the 4xx/5xx branches. This type walks the union,
 * keeps the branches whose status is a member of `SuccessStatus`, and
 * discards the rest.
 *
 *   type GetConfigurationControllerResponseDTO =
 *     | readonly [200, IRedisSMQParsedConfig]
 *     | TErrors['ConfigurationNotFoundError'];
 *
 *   SuccessOf<GetConfigurationControllerResponseDTO>
 *     // = readonly [200, IRedisSMQParsedConfig]
 *
 * When `R` doesn't match the tuple shape (the unconstrained default
 * `unknown`, for example), it's returned unchanged so the default
 * `Controller<In>` still has a usable return type.
 */
export type SuccessOf<R> = R extends readonly [infer S extends number, unknown]
  ? S extends SuccessStatus
    ? R
    : never
  : R;

/**
 * A handler: `(deps, input) => Promise<SuccessOf<ResponseType>>`.
 *
 * The second parameter is the **response DTO** — the same type the
 * route passes to `getResponseSchemas`. Its 2xx branch is what the
 * handler is expected to return; its 4xx/5xx branches are metadata for
 * the OpenAPI document and the error handler, not part of the
 * handler's contract.
 *
 * ## Why the status can't drift
 *
 * The status appears exactly once, in the DTO. Every handler return
 * site is checked against the derived `SuccessOf<ResponseType>`. A
 * handler that returns `[201, body]` when the DTO says `200` fails to
 * compile, with an error pointing at the return value. There is no
 * second place to update, and no way for the two declarations to
 * disagree.
 *
 * ## Why this replaces the old `Controller<In, Out>`
 *
 * The previous shape took the payload type as the second parameter,
 * which left the status unchecked. `Controller<In, SomePayload>`
 * compiled with a handler returning any number. Passing the DTO
 * instead — with `SuccessOf` doing the extraction — makes the status
 * part of the compile-time contract without a second type parameter.
 */
export type Controller<In = RequestInput, ResponseType = unknown> = (
  deps: Deps,
  input: In,
) => Promise<SuccessOf<ResponseType>>;
