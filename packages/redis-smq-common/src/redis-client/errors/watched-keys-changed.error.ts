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
  static override readonly code = 'RedisSMQ.RedisClient.WatchedKeysChanged';
  static override readonly defaultMessage =
    'Redis transaction failed. One or more watched keys were modified by another client.';
}
