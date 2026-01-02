/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from '../../errors/index.js';

export class UnknownRedisServerVersionError extends RedisSMQError {
  getProps() {
    return {
      code: 'RedisSMQ.RedisClient.UnknownRedisServerVersion',
      defaultMessage: 'Could not determine Redis server version.',
    };
  }
}
