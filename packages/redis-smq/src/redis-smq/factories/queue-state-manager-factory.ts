/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { QueueStateManager } from '../../queue-state-manager/index.js';

export class QueueStateManagerFactory extends FactoryAbstract {
  /**
   * Creates a QueueStateManager instance.
   *
   * @returns {QueueStateManager} A new QueueStateManager instance
   */
  static create = (): QueueStateManager => {
    this.ensureInitialized();
    return this.track(new QueueStateManager());
  };
}
