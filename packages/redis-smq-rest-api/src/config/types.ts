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
 * Public configuration accepted by the RedisSMQRestApi constructor
 * and by the CLI. Every field is optional; defaults are applied by
 * `parseConfig()`.
 */
export interface IApiConfig {
  /**
   * Redis connection settings. Passed through to redis-smq
   * (`RedisSMQ.initialize`). If omitted, defaults to ioredis on
   * localhost:6379.
   */
  redis?: IRedisConfig;

  /**
   * HTTP server settings.
   */
  apiServer?: {
    /** TCP port. Default: 7210. Must be an integer in [1, 65535]. */
    port?: number;

    /**
     * Base path the API is mounted under. Default: '/'.
     * Normalized to start with '/' and have no trailing '/'.
     * Example: 'api/v1' → '/api/v1'.
     */
    basePath?: string;
  };

  /**
   * Logger settings. Passed through to `createLogger` from
   * redis-smq-common. Logging is off by default.
   */
  logger?: ILoggerConfig;
}

/**
 * Configuration after normalization and validation. Every field is
 * guaranteed present, and every constraint has been checked.
 * Produced exclusively by `parseConfig()`.
 */
export interface IParsedApiConfig {
  redis: IRedisConfig;

  apiServer: {
    port: number;
    /** Always starts with '/'; never ends with '/' unless it's exactly '/'. */
    basePath: string;
  };

  logger: {
    enabled: boolean;
    options: Required<IConsoleLoggerOptions>;
  };
}

/**
 * Raw options as parsed by commander. Every field is a string because
 * that's what CLI arguments arrive as; `parseConfig()` performs the
 * numeric conversion and validation.
 *
 * Kept separate from `IRedisSMQRestApiConfig` because the CLI and the
 * programmatic API have different shapes (flat vs. nested).
 */
export interface IApiCliOptions {
  port: string;
  basePath: string;
  redisClient: ERedisConfigClient;
  redisHost: string;
  redisPort: string;
  redisDb: string;
  enableLog: string;
  logLevel: EConsoleLoggerLevel;
}
