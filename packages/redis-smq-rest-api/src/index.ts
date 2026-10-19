/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Public API of `redis-smq-rest-api-refactor`.
 *
 * The package has three surfaces:
 *
 *   1. **The server class** — `RedisSMQRestApi`. The primary entry
 *      point for every consumer. Construct it, call `run()`, call
 *      `shutdown()` when done.
 *
 *   2. **The configuration contract** — `IRedisSMQRestApiConfig` and
 *      its associated types. Consumers pass this to the constructor
 *      or to the CLI; `parseConfig` is exposed for tooling that wants
 *      to validate config without constructing a server.
 *
 *   3. **The extension contract** — `Controller`, `RouteDefinition`,
 *      `HttpMethod`, `RequestInput`, `Deps`. Anything a third party
 *      would need to add a feature to their own build of this package,
 *      or to write a handler for a test that exercises the pipeline
 *      without going through HTTP.
 *
 * Everything else — the Koa adapter, the AJV validators, the schema
 * loader, the OpenAPI builder, the codegen outputs — is an
 * implementation detail. Exposing it would create a public surface
 * that has to be maintained across versions for consumers who never
 * asked for it. If a need for one of those arises, export it
 * deliberately in a future version.
 */

// ── The server class ─────────────────────────────────────────────────

export { RedisSMQRestApi } from './server.js';

// ── Configuration ────────────────────────────────────────────────────

export {
  DEFAULT_BASE_PATH,
  DEFAULT_PORT,
  parseConfig,
} from './config/index.js';
export type {
  IApiCliOptions,
  IApiConfig,
  IParsedApiConfig,
} from './config/index.js';

// ── Extension contract ───────────────────────────────────────────────

export type { Deps } from './deps/index.js';
export type {
  Controller,
  ControllerResult,
  HttpMethod,
  RequestInput,
  RouteDefinition,
} from './http/index.js';

// ── Errors ───────────────────────────────────────────────────────────
//
// Only the base class and the two errors a caller might catch directly
// (config validation during construction, request validation from a
// handler they wrote themselves) are exported. The rest of the error
// hierarchy is internal — consumers catch by name or via
// `isRedisSMQError`, not by importing every subclass.

export {
  InvalidApiServerParamsError,
  RedisSMQRestApiError,
  RequestValidationError,
  isRedisSMQError,
} from './errors/index.js';
