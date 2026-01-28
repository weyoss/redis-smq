/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { QueueAcknowledgedMessages } from '../../queue-acknowledged-messages/index.js';

export class AcknowledgedMessagesFactory extends FactoryAbstract {
  /**
   * Creates a QueueAcknowledgedMessages instance.
   *
   * @returns A new QueueAcknowledgedMessages instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const acknowledgedMessages = RedisSMQ.createQueueAcknowledgedMessages();
   * acknowledgedMessages.countMessages('my-queue', (err, count) => {
   *   if (err) return console.error('Failed to count acknowledged:', err);
   *   console.log('Acknowledged count:', count);
   * });
   * ```
   */
  static create = (): QueueAcknowledgedMessages => {
    this.ensureInitialized();
    return this.track(new QueueAcknowledgedMessages());
  };
}
