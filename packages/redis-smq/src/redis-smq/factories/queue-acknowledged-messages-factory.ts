/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { QueueAcknowledgedMessages } from '../../queue-messages/index.js';

export class AcknowledgedMessagesFactory extends FactoryAbstract {
  /**
   * Creates a QueueAcknowledgedMessages instance.
   *
   * @returns {QueueAcknowledgedMessages} A new QueueAcknowledgedMessages instance
   */
  static create = (): QueueAcknowledgedMessages => {
    this.ensureInitialized();
    return this.track(new QueueAcknowledgedMessages());
  };
}
