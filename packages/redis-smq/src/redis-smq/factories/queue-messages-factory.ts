/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { QueueMessages } from '../../queue-messages/index.js';
import { FactoryAbstract } from './factory-abstract.js';

export class QueueMessagesFactory extends FactoryAbstract {
  /**
   * Creates a QueueMessages instance.
   *
   * @returns A new QueueMessages instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const queueMessages = RedisSMQ.createQueueMessages();
   * queueMessages.countMessagesByStatus('my-queue', (err, count) => {
   *   if (err) return console.error('Failed to count messages:', err);
   *   console.log('Counts:', count);
   * });
   * ```
   */
  static create = (): QueueMessages => {
    this.ensureInitialized();
    return this.track(new QueueMessages());
  };
}
