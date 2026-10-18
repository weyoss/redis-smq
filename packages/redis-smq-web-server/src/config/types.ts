/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type {
  EConsoleLoggerLevel,
  ERedisConfigClient,
  IConsoleLoggerOptions,
  ILoggerConfig,
  IRedisConfig,
} from 'redis-smq-common';

/**
 * Public configuration accepted by the `RedisSMQWebServer` constructor
 * and by the CLI.
 */
export interface IWebServerConfig {
  /**
   * HTTP server settings.
   */
  webServer?: {
    /**
     * TCP port for the web server (serves the SPA, and either an
     * embedded REST API or a proxy to an external one). Default: 8080.
     * Must be an integer in [1, 65535].
     */
    port?: number;

    /**
     * Public base path for the Web UI, the API, and the Swagger UI.
     * Default: '/'.
     *
     * - UI is served at `<basePath>`
     * - Embedded API at `<basePath>/api`
     * - Swagger UI at `<basePath>/swagger`
     *
     * When set to something other than '/', a request to the origin
     * root redirects to `<basePath>` so that a client that lands on
     * `https://example.com/` finds the UI.
     *
     * Normalized during parsing: leading slash added, trailing slash
     * removed (unless the path is exactly '/').
     */
    basePath?: string;

    /**
     * Target URL for proxying API requests.
     *
     * When set, the web server does not start an embedded REST API.
     * Requests to `<basePath>/api` and `<basePath>/swagger` are
     * forwarded to this target, path intact. Must be a valid
     * `http:` or `https:` URL.
     *
     * When not set, the web server starts an embedded REST API
     * in-process using the `redis` and `logger` settings below.
     */
    apiProxyTarget?: string;
  };

  /**
   * Redis connection settings for the embedded REST API. Ignored in
   * proxy mode — the upstream API owns its own Redis connection.
   */
  redis?: IRedisConfig;

  /**
   * Logger settings. Used by the web server for its own diagnostics,
   * and passed to the embedded REST API when running in embed mode.
   */
  logger?: ILoggerConfig;
}

/**
 * Configuration after normalization and validation. Every field is
 * guaranteed present, and every constraint has been checked. Produced
 * exclusively by `parseConfig`.
 */
export interface IParsedWebServerConfig {
  webServer: {
    port: number;
    /** Always starts with '/'; never ends with '/' unless it's exactly '/'. */
    basePath: string;
    apiProxyTarget: string | null;
  };

  redis: IRedisConfig;

  logger: {
    enabled: boolean;
    options: Required<IConsoleLoggerOptions>;
  };
}

/**
 * Raw options as parsed by commander. Every field is a string because
 * that's what CLI arguments arrive as; `parseConfig` does the numeric
 * conversion and validation.
 */
export interface IWebServerCliOptions {
  port: string;
  basePath: string;
  redisClient: ERedisConfigClient;
  redisPort: string;
  redisHost: string;
  redisDb: string;
  enableLog: string;
  logLevel: EConsoleLoggerLevel;
  apiProxyTarget?: string;
}
