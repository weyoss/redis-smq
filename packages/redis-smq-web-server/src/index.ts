/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Public API of `redis-smq-web-server`.
 *
 * The package has three surfaces:
 *
 *   1. **The server class** — `RedisSMQWebServer`. The primary entry
 *      point. Construct it, call `run()`, call `shutdown()` when done.
 *      Or construct with `false` as the second argument and call
 *      `getApplication()` for embedding in a larger Express host.
 *
 *   2. **The configuration contract** — `IWebServerConfig` and its
 *      associated types. Consumers pass this to the constructor or to
 *      the CLI; `parseConfig` is exposed for tooling that wants to
 *      validate config without constructing a server.
 *
 *   3. **The error hierarchy** — the three error classes the server
 *      can throw during startup. Exported so callers that construct
 *      the server programmatically (rather than via the CLI) can
 *      format errors with the same metadata the CLI surfaces.
 *
 * Everything else — the Express middleware composition, the `Deps`
 * bag, the config parsing internals — is an implementation detail.
 * Exposing it would create public surface that has to be maintained
 * across versions for consumers who never asked for it.
 */

// ── The server class ─────────────────────────────────────────────────

export { RedisSMQWebServer } from './server.js';

// ── Configuration ────────────────────────────────────────────────────

export {
  DEFAULT_BASE_PATH,
  DEFAULT_PORT,
  parseConfig,
} from './config/index.js';
export type {
  IWebServerCliOptions,
  IWebServerConfig,
  IParsedWebServerConfig,
} from './config/index.js';

// ── Errors ───────────────────────────────────────────────────────────
//
// All three are thrown during startup — before the HTTP listener is
// bound. A caller catching them can produce a diagnostic without
// having to parse a stack trace:
//
//   - `InvalidWebServerParamsError` — config validation failed.
//   - `WebUIBundleNotFoundError` — the RedisSMQ Web UI bundle is
//     missing or malformed.
//   - `WebServerError` — the base class. Useful for a catch-all that
//     wants to distinguish "something this package threw" from "a
//     Redis error, a bug in Express, or anything else."

export {
  InvalidWebServerParamsError,
  WebServerError,
  WebUIBundleNotFoundError,
} from './errors/index.js';
