/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { QueuePublishedMessages } from '../../queue-messages/index.js';
import { FactoryAbstract } from './factory-abstract.js';

export class PublishedMessagesFactory extends FactoryAbstract {
  /**
   * Creates a QueuePublishedMessages instance.
   *
   * @returns A new QueuePublishedMessages instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const publishedMessages = RedisSMQ.createQueuePublishedMessages();
   * publishedMessages.countMessagesByStatus('my-queue', (err, count) => {
   *   if (err) return console.error('Failed to count messages:', err);
   *   console.log('Counts:', count);
   * });
   * ```
   */
  static create = (): QueuePublishedMessages => {
    this.ensureInitialized();
    return this.track(new QueuePublishedMessages());
  };
}
