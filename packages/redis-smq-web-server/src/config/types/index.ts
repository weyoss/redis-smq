/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
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

export interface IRedisSMQWebServerCliOptions {
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

export interface IRedisSMQWebServerConfig extends IRedisSMQRestApiConfig {
  webServer?: {
    port?: number;
    basePath?: string;
    /**
     * Optional target for proxying API calls (/api, /docs, /assets).
     * If undefined, the embedded REST API will be mounted.
     */
    apiProxyTarget?: string;
  };
}

export interface IRedisSMQWebServerParsedConfig
  extends IRedisSMQRestApiParsedConfig {
  webServer: {
    port: number;
    basePath: string;
    /**
     * Optional target for proxying API calls (/api, /docs, /assets).
     * If undefined, the embedded REST API will be mounted.
     */
    apiProxyTarget?: string;
  };
}
