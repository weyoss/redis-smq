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
} from './types/index.js';
import { EConsoleLoggerLevel, ERedisConfigClient } from 'redis-smq-common';

export const DEFAULT_PORT = 7210;
export const DEFAULT_BASE_PATH = '/';

function normalizePath(path: string): string {
  const s = path
    .split('/')
    .map((i) => i.trim())
    .filter((i) => !!i)
    .join('/');
  return `/${s}`;
}

export function parseConfig(
  config: IRedisSMQRestApiConfig = {},
): IRedisSMQRestApiParsedConfig {
  const { apiServer = {}, redis, logger } = config;
  return {
    redis: redis ?? { client: ERedisConfigClient.IOREDIS },
    apiServer: {
      port: apiServer.port ?? DEFAULT_PORT,
      basePath: normalizePath(apiServer.basePath ?? DEFAULT_BASE_PATH),
    },
    logger: {
      enabled: logger?.enabled || false,
      options: {
        includeTimestamp: logger?.options?.includeTimestamp || true,
        colorize: logger?.options?.colorize || true,
        logLevel: logger?.options?.logLevel || EConsoleLoggerLevel.INFO,
      },
    },
  };
}
