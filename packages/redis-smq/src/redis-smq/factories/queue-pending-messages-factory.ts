/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { QueuePendingMessages } from '../../queue-messages/index.js';

export class PendingMessagesFactory extends FactoryAbstract {
  /**
   * Creates a QueuePendingMessages instance.
   *
   * @returns {QueuePendingMessages} A new QueuePendingMessages instance
   */
  static create = (): QueuePendingMessages => {
    this.ensureInitialized();
    return this.track(new QueuePendingMessages());
  };
}
