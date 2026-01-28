/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { QueuePendingMessages } from '../../queue-pending-messages/index.js';

export class PendingMessagesFactory extends FactoryAbstract {
  /**
   * Creates a QueuePendingMessages instance.
   *
   * @returns A new QueuePendingMessages instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const pendingMessages = RedisSMQ.createQueuePendingMessages();
   * pendingMessages.countMessages('my-queue', (err, count) => {
   *   if (err) return console.error('Failed to count pending:', err);
   *   console.log('Pending count:', count);
   * });
   * ```
   */
  static create = (): QueuePendingMessages => {
    this.ensureInitialized();
    return this.track(new QueuePendingMessages());
  };
}
