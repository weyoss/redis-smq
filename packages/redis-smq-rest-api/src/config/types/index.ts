/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQConfig, IRedisSMQParsedConfig } from 'redis-smq';
import { EConsoleLoggerLevel, ERedisConfigClient } from 'redis-smq-common';

export type TRestApiConfig = {
  port?: number;
  basePath?: string;
};

export interface IRedisSMQRestApiConfig extends IRedisSMQConfig {
  apiServer?: TRestApiConfig;
}

export interface IRedisSMQRestApiParsedConfig extends IRedisSMQParsedConfig {
  apiServer: Required<TRestApiConfig>;
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
