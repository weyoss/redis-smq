/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from '../../errors/index.js';

export class RedisServerBinaryNotFoundError extends RedisSMQError {
  getProps() {
    return {
      code: 'RedisSMQ.RedisServer.BinaryNotFound',
      defaultMessage:
        'A Redis server binary could not be found. Please set up Redis server first.',
    };
  }
}
