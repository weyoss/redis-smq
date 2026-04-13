/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { QueueManager } from '../../queue-manager/index.js';

export class QueueManagerFactory extends FactoryAbstract {
  /**
   * Creates a QueueManager instance.
   *
   * @returns {QueueManager} A new QueueManager instance
   */
  static create = (): QueueManager => {
    this.ensureInitialized();
    return this.track(new QueueManager());
  };
}
