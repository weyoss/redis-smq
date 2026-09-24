/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from '../../errors/index.js';

export class WatchTransactionMaxRetriesExceededError extends RedisSMQError {
  static override readonly code =
    'RedisSMQ.RedisClient.WatchTransactionMaxRetriesExceeded';
  static override readonly defaultMessage =
    'Watch transaction has failed after reaching the maximum number of retries.';
}
