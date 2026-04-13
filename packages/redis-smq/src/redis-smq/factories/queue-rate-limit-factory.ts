/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { QueueRateLimit } from '../../queue-rate-limit/index.js';

export class RateLimitFactory extends FactoryAbstract {
  /**
   * Creates a QueueRateLimit instance.
   *
   * @returns {QueueRateLimit} A new QueueRateLimit instance
   */
  static create = (): QueueRateLimit => {
    this.ensureInitialized();
    return this.track(new QueueRateLimit());
  };
}
