/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { QueueMessagesAbstract } from './queue-messages-abstract.js';
import { EQueueMessageType } from './types/index.js';

/**
 * Handles pending message operations for a queue.
 *
 * Pending messages are those waiting to be processed.
 * This class provides methods to browse, count, and purge pending messages.
 *
 * @example
 * const pending = new QueuePendingMessages();
 *
 * // Count pending messages
 * const count = await pending.countMessages('orders');
 *
 * // Get first page of pending messages
 * const page = await pending.getMessages('orders', 1, 20);
 * page.items.forEach(msg => {
 *   console.log(`Message: ${msg.getId()}`);
 * });
 *
 * // Purge all pending messages
 * const jobId = await pending.purge('orders');
 */
export class QueuePendingMessages extends QueueMessagesAbstract {
  public readonly messageType = EQueueMessageType.PENDING;
}
