/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from './redis-smq.error.js';

export class CallbackEmptyReplyError extends RedisSMQError {
  static override readonly code = 'RedisSMQ.Callback.EmptyReply';
  static override readonly defaultMessage =
    'Callback returned an empty reply. A reply is required.';
}
