/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from '../../errors/index.js';

export class WatchedKeysChangedError extends RedisSMQError {
  getProps() {
    return {
      code: 'RedisSMQ.RedisClient.WatchedKeysChanged',
      defaultMessage:
        'Redis transaction failed. One or more watched keys were modified by another client.',
    };
  }
}
