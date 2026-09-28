/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';

export class MessageNotRequeuableError extends RedisSMQError {
  static override readonly code = 'RedisSMQ.Message.NotRequeuable';
  static override readonly defaultMessage = 'Message is not requeueable.';
}
