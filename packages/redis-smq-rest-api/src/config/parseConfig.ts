/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ConfigInvalidApiServerParamsError } from './errors/ConfigInvalidApiServerParamsError.js';
import {
  IRedisSMQRestApiConfig,
  IRedisSMQRestApiParsedConfig,
} from './types/index.js';
import {
  EConsoleLoggerLevel,
  ERedisConfigClient,
  ILoggerConfig,
  IRedisConfig,
} from 'redis-smq-common';

export const defaultConfig = {
  logger: {
    enabled: true,
    options: {
      logLevel: EConsoleLoggerLevel.DEBUG,
    },
  },
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
      db: 0,
    },
  },
  apiServer: {
    port: 8081,
    basePath: '/',
  },
};

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
  const { apiServer = {}, redis, logger, ...rest } = config;
  const port = apiServer.port ?? defaultConfig.apiServer.port;
  const basePath = normalizePath(
    apiServer.basePath ?? defaultConfig.apiServer.basePath,
  );

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigInvalidApiServerParamsError(
      `Expected a valid port number (1-65535).`,
    );
  }

  // Redis client config
  const redisCfg: IRedisConfig = {
    ...redis,
    client: redis?.client ?? defaultConfig.redis.client,
    options: {
      ...(redis?.options ?? {}),
      port: redis?.options?.port ?? defaultConfig.redis.options.port,
      host: redis?.options?.host ?? defaultConfig.redis.options.host,
      db: redis?.options?.db ?? defaultConfig.redis.options.db,
    },
  };

  // Logger config
  const loggerCfg: ILoggerConfig = {
    ...(logger ?? {}),
    enabled: logger?.enabled,
    options: {
      ...(logger?.options ?? {}),
      logLevel:
        logger?.options?.logLevel ?? defaultConfig.logger.options.logLevel,
    },
  };

  return {
    ...rest,
    redis: redisCfg,
    logger: loggerCfg,
    apiServer: {
      port,
      basePath,
    },
  };
}
