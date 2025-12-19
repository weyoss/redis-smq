/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  IRedisSMQRestApiConfig,
  IRedisSMQRestApiParsedConfig,
} from 'redis-smq-rest-api';
import { EConsoleLoggerLevel, ERedisConfigClient } from 'redis-smq-common';

/**
 * CLI flags parsed by the web server entrypoint.
 */
export interface IRedisSMQWebServerCliOptions {
  port: string;
  basePath: string;
  redisClient: ERedisConfigClient;
  redisPort: string;
  redisHost: string;
  redisDb: string;
  enableLog: string;
  logLevel: EConsoleLoggerLevel;
  /**
   * If provided, the server proxies API/Swagger to this upstream target.
   * Example: http://127.0.0.1:7210
   */
  apiProxyTarget?: string;
}

/**
 * Public configuration for the RedisSMQ Web Server.
 *
 * Notes:
 * - The web server always runs the REST API in embedded mode unless apiProxyTarget is set.
 * - The REST API "apiServer" section is intentionally NOT part of this config and is derived
 *   by the web server (mounted under <webServer.basePath>/{api,swagger}).
 * - Redis and logger are reused from the REST API config since the embedded API uses them.
 */
export interface IRedisSMQWebServerConfig
  extends Omit<IRedisSMQRestApiConfig, 'apiServer'> {
  webServer?: {
    /**
     * HTTP port of the web server (serves Web UI and embedded/proxied API).
     * Default: 8080
     */
    port?: number;
    /**
     * Public base path for the Web UI and the embedded/proxied API.
     * - UI is served at <basePath>
     * - Embedded API is mounted at <basePath>/api
     * - Swagger UI is available at <basePath>/swagger
     * Default: '/'
     */
    basePath?: string;
    /**
     * Optional target for proxying API calls.
     * When set, requests to:
     *   <basePath>/api      and
     *   <basePath>/swagger
     * are forwarded to the upstream REST API, including assets under /swagger/assets.
     * If undefined, the embedded REST API is mounted in-process.
     */
    apiProxyTarget?: string;
  };
}

/**
 * Parsed configuration used internally by the web server.
 * Conforms to the REST API parsed config for redis/logger while adding the webServer section.
 */
export interface IRedisSMQWebServerParsedConfig
  extends IRedisSMQRestApiParsedConfig {
  webServer: {
    port: number;
    basePath: string;
    /**
     * Optional target for proxying API calls.
     * See IRedisSMQWebServerConfig.webServer.apiProxyTarget for details.
     */
    apiProxyTarget?: string;
  };
}
