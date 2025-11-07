/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EConsoleLoggerLevel,
  ERedisConfigClient,
  IConsoleLoggerOptions,
  ILoggerConfig,
  IRedisConfig,
} from 'redis-smq-common';

export type TRestApiConfig = {
  port?: number;
  basePath?: string;
};

export interface IRedisSMQRestApiConfig {
  redis?: IRedisConfig;
  apiServer?: TRestApiConfig;
  logger?: ILoggerConfig;
}

export interface IRedisSMQRestApiParsedConfig {
  redis: IRedisConfig;
  apiServer: Required<TRestApiConfig>;
  logger: {
    enabled: boolean;
    options: Required<IConsoleLoggerOptions>;
  };
}

export interface IRedisSMQRestApiCliOptions {
  port: string;
  redisClient: ERedisConfigClient;
  basePath: string;
  redisPort: string;
  redisHost: string;
  redisDb: string;
  enableLog: string;
  logLevel: EConsoleLoggerLevel;
}
