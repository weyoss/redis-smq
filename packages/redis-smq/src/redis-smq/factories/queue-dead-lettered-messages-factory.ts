/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { QueueDeadLetteredMessages } from '../../queue-dead-lettered-messages/index.js';

export class DeadLetteredMessagesFactory extends FactoryAbstract {
  /**
   * Creates a QueueDeadLetteredMessages instance.
   *
   * @returns A new QueueDeadLetteredMessages instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const deadLetteredMessages = RedisSMQ.createQueueDeadLetteredMessages();
   * deadLetteredMessages.countMessages('my-queue', (err, count) => {
   *   if (err) return console.error('Failed to count DLQ:', err);
   *   console.log('Dead-lettered count:', count);
   * });
   * ```
   */
  static create = (): QueueDeadLetteredMessages => {
    this.ensureInitialized();
    return this.track(new QueueDeadLetteredMessages());
  };
}
