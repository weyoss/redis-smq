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
   * @returns {MessageManager} A new MessageManager instance
   */
  static create = (): MessageManager => {
    this.ensureInitialized();
    return this.track(new MessageManager());
  };
}
