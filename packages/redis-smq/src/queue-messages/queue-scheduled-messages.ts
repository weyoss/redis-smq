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
 * Handles scheduled message operations for a queue.
 *
 * Scheduled messages are those scheduled for future delivery.
 * This class provides methods to browse, count, and purge scheduled messages.
 *
 * @example
 * const scheduled = new QueueScheduledMessages();
 *
 * // Count scheduled messages
 * const count = await scheduled.countMessages('orders');
 *
 * // Get first page of scheduled messages
 * const page = await scheduled.getMessages('orders', 1, 20);
 * page.items.forEach(msg => {
 *   console.log(`Scheduled at: ${msg.getMessageState().getScheduledAt()}`);
 * });
 *
 * // Purge all scheduled messages
 * const jobId = await scheduled.purge('orders');
 */
export class QueueScheduledMessages extends QueueMessagesAbstract {
  public readonly messageType = EQueueMessageType.SCHEDULED;
}
