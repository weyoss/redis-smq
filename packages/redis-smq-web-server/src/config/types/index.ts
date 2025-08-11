/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQRestApiParsedConfig } from 'redis-smq-rest-api';

export interface IRedisSMQWebServerConfig {
  port: number;
  basePath: string;
  redisPort: number;
  redisHost: string;
  redisDB: number;
  /**
   * If provided, the web server will proxy API requests to this target instead of embedding the REST API.
   * Example: http://127.0.0.1:7210
   */
  apiProxyTarget?: string;
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
