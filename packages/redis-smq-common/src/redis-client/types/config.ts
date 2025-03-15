/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export enum ERedisConfigClient {
  // Represents the ioredis client.
  IOREDIS = 'ioredis',

  // Represents the @redis/client.
  REDIS = 'redis',
}

export interface IRedisConfig {
  /**
   * Specifies which Redis client should be used.
   */
  client: ERedisConfigClient;

  /**
   * Optional property to provide configuration options specific to the
   * @redis/client or ioredis. Refer to the documentation for both clients for detailed options.
   *
   * @see https://github.com/luin/ioredis/blob/master/API.md#new_Redis
   * @see https://github.com/redis/node-redis/blob/master/docs/client-configuration.md
   */
  options?: Record<string, unknown>;
}
