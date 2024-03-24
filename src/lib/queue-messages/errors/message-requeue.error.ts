/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { QueueMessageError } from './queue-message.error.js';

export class MessageRequeueError extends QueueMessageError {
  constructor(msg = 'MESSAGE_REQUEUE_ERROR') {
    super(msg);
  }
}
