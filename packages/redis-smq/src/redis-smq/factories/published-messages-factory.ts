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
   * @returns {QueuePublishedMessages} A new QueuePublishedMessages instance
   */
  static create = (): QueuePublishedMessages => {
    this.ensureInitialized();
    return this.track(new QueuePublishedMessages());
  };
}
