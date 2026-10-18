/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { RedisSMQRestApi } from 'redis-smq-rest-api';
import type { ILogger } from 'redis-smq-common';

/**
 * The embedded REST API's Node request handler, as returned by
 * `RedisSMQRestApi.getApplication()`.
 *
 * Resolved once in `createDeps`, not per request. Every middleware that
 * needs it — `apiEmbed` — reads it from `Deps` synchronously. This is
 * what lets `buildApp` be a plain synchronous composition with no I/O
 * of its own.
 */
export type EmbeddedApiHandler = Awaited<
  ReturnType<RedisSMQRestApi['getApplication']>
>;

export interface Deps {
  /** Filesystem path to the Web UI static bundle directory. */
  webUIStaticDir: string;

  /**
   * Pre-rendered SPA HTML with `window.configs` already injected.
   * Rendered once in `createDeps`; served verbatim by `spaFallback`.
   */
  spaHtml: string;

  logger: ILogger;

  /**
   * `'embed'` when the web server hosts the REST API in-process;
   * `'proxy'` when it forwards API requests to `proxyTarget`.
   */
  mode: 'embed' | 'proxy';

  /**
   * The `RedisSMQRestApi` instance in embed mode, retained so that
   * `shutdown()` can dispose it. `null` in proxy mode.
   */
  restApi: RedisSMQRestApi | null;

  /**
   * The resolved request handler installed by `apiEmbed`.
   * `null` in proxy mode.
   */
  embeddedApiHandler: EmbeddedApiHandler | null;

  /**
   * The target URL for proxying, already validated by `parseConfig`.
   * `null` in embed mode.
   */
  proxyTarget: string | null;
}
