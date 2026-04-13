/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { QueueDeadLetteredMessages } from '../../queue-messages/index.js';

export class DeadLetteredMessagesFactory extends FactoryAbstract {
  /**
   * Creates a QueueDeadLetteredMessages instance.
   *
   * @returns {QueueDeadLetteredMessages} A new QueueDeadLetteredMessages instance
   */
  static create = (): QueueDeadLetteredMessages => {
    this.ensureInitialized();
    return this.track(new QueueDeadLetteredMessages());
  };
}
