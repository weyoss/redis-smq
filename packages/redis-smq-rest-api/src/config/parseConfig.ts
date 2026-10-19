/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EConsoleLoggerLevel, ERedisConfigClient } from 'redis-smq-common';
import { InvalidApiServerParamsError } from '../errors/index.js';
import { DEFAULT_BASE_PATH, DEFAULT_PORT } from './constants.js';
import type { IApiConfig, IParsedApiConfig } from './types.js';

/**
 * Collapses a raw base path into a canonical form:
 *   'api/v1'      → '/api/v1'
 *   '/api/v1/'    → '/api/v1'
 *   '//foo//bar'  → '/foo/bar'
 *   ''            → '/'
 *   '/'           → '/'
 */
function normalizeBasePath(raw: string): string {
  const cleaned = raw
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/');
  return `/${cleaned}`;
}

function validatePort(port: number): void {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new InvalidApiServerParamsError({
      metadata: {
        field: 'port',
        value: port,
        reason: 'port must be an integer between 1 and 65535',
      },
    });
  }
}

/**
 * Turns a user-supplied configuration into a fully-populated,
 * validated config. The only place in the package where defaults are
 * applied and where `IRedisSMQRestApiConfig` invariants are enforced.
 *
 * Throws `InvalidApiServerParamsError` on invalid port or basePath.
 * Anything related to Redis is validated later by `RedisSMQ.initialize`.
 */
export function parseConfig(config: IApiConfig = {}): IParsedApiConfig {
  const port = config.apiServer?.port ?? DEFAULT_PORT;
  validatePort(port);

  const rawBasePath = config.apiServer?.basePath ?? DEFAULT_BASE_PATH;
  if (typeof rawBasePath !== 'string') {
    throw new InvalidApiServerParamsError({
      metadata: {
        field: 'basePath',
        value: rawBasePath,
        reason: 'basePath must be a string',
      },
    });
  }

  return {
    redis: config.redis ?? { client: ERedisConfigClient.IOREDIS },

    apiServer: {
      port,
      basePath: normalizeBasePath(rawBasePath),
    },

    logger: {
      enabled: config.logger?.enabled ?? false,
      options: {
        includeTimestamp: config.logger?.options?.includeTimestamp ?? true,
        colorize: config.logger?.options?.colorize ?? true,
        logLevel: config.logger?.options?.logLevel ?? EConsoleLoggerLevel.INFO,
      },
    },
  };
}
