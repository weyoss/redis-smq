/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ERedisConfigClient, IRedisConfig } from 'redis-smq-common';
import _ from 'lodash';

export class Config {
  private static instance: Config | null = null;
  private config: IRedisConfig;

  private constructor(redisConfig?: IRedisConfig) {
    this.config = this.mergeConfig(redisConfig);
  }

  private mergeConfig(redisConfig?: IRedisConfig): IRedisConfig {
    const defaultConfig: IRedisConfig = {
      client: ERedisConfigClient.IOREDIS,
      options: { host: '127.0.0.1', port: 6379, db: 0 },
    };

    // Different client? Don't merge options
    if (redisConfig?.client && redisConfig.client !== defaultConfig.client) {
      return {
        client: redisConfig.client,
        options: redisConfig.options ?? {},
      };
    }

    return _.merge({}, defaultConfig, redisConfig ?? {});
  }

  static initialize(config?: IRedisConfig): void {
    if (Config.instance) {
      throw new Error('Already initialized');
    }
    Config.instance = new Config(config);
  }

  static getConfig(): IRedisConfig {
    if (!Config.instance) {
      throw new Error('Not initialized');
    }
    return Object.freeze(Config.instance.config);
  }

  static reset(): void {
    Config.instance = null;
  }
}
