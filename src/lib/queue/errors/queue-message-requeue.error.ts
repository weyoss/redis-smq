/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { QueueError } from './queue.error';

export class QueueMessageRequeueError extends QueueError {
  constructor() {
    super(
      `Message can not be re-queued. Either the queue has been deleted or its settings does not allow to accept the message`,
    );
  }
}
