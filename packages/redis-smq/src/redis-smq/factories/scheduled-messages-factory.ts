/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { QueueScheduledMessages } from '../../queue-scheduled-messages/index.js';

export class ScheduledMessagesFactory extends FactoryAbstract {
  /**
   * Creates a QueueScheduledMessages instance.
   *
   * @returns A new QueueScheduledMessages instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const scheduledMessages = RedisSMQ.createQueueScheduledMessages();
   * scheduledMessages.countMessages('my-queue', (err, count) => {
   *   if (err) return console.error('Failed to count scheduled:', err);
   *   console.log('Scheduled count:', count);
   * });
   * ```
   */
  static create = (): QueueScheduledMessages => {
    this.ensureInitialized();
    return this.track(new QueueScheduledMessages());
  };
}
