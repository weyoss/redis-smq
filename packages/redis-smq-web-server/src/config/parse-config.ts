/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  IRedisSMQWebServerConfig,
  IRedisSMQWebServerParsedConfig,
} from './types/index.js';
import { ERedisConfigClient } from 'redis-smq-common';

export const defaultConfig: IRedisSMQWebServerConfig = {
  port: 8080,
  basePath: '/',
  redisPort: 6379,
  redisHost: '127.0.0.1',
  redisDB: 0,
  apiProxyTarget: undefined,
};

export function parseConfig(
  config: Partial<IRedisSMQWebServerConfig> = {},
): IRedisSMQWebServerParsedConfig {
  const cfg: IRedisSMQWebServerConfig = {
    ...defaultConfig,
    ...config,
  };
  const webServerCfg = {
    port: cfg.port,
    basePath: cfg.basePath,
    apiProxyTarget: cfg.apiProxyTarget,
  };
  return {
    redis: {
      client: ERedisConfigClient.IOREDIS,
      options: {
        port: cfg.redisPort,
        host: cfg.redisHost,
        db: cfg.redisDB,
        showFriendlyErrorStack: true,
      },
    },
    webServer: webServerCfg,
    // Note: apiServer is used by the embedded REST API; when proxying, this is ignored by the web server.
    apiServer: {
      port: cfg.port,
      basePath: cfg.basePath,
    },
  };
}
