/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { MessageManager } from '../../message-manager/index.js';

export class MessageManagerFactory extends FactoryAbstract {
  /**
   * Creates a MessageManager instance.
   *
   * @returns A new MessageManager instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const messageManager = RedisSMQ.createMessageManager();
   * messageManager.getMessageById('message-id', (err, message) => {
   *   if (err) return console.error('Failed to get message:', err);
   *   console.log('Message:', message);
   * });
   * ```
   */
  static create = (): MessageManager => {
    this.ensureInitialized();
    return this.track(new MessageManager());
  };
}
