/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { QueueError } from './queue.error.js';

export class QueueHasRunningConsumersError extends QueueError {
  constructor() {
    super(
      `Before deleting a queue/namespace, make sure it is not used by a message handler. After shutting down all message handlers, wait a few seconds and try again.`,
    );
  }
}
