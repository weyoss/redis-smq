/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';

export class ConsumerGroupsNotSupportedError extends RedisSMQError {
  static override readonly code = 'RedisSMQ.ConsumerGroup.NotSupported';
  static override readonly defaultMessage =
    'Consumer groups are not supported for this queue.';
}
