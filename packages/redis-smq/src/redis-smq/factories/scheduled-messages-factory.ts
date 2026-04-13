/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { QueueScheduledMessages } from '../../queue-messages/index.js';

export class ScheduledMessagesFactory extends FactoryAbstract {
  /**
   * Creates a QueueScheduledMessages instance.
   *
   * @returns {QueueScheduledMessages} A new QueueScheduledMessages instance
   */
  static create = (): QueueScheduledMessages => {
    this.ensureInitialized();
    return this.track(new QueueScheduledMessages());
  };
}
