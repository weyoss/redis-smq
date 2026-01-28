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
   * @returns A new QueueRateLimit instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const queueRateLimit = RedisSMQ.createQueueRateLimit();
   * queueRateLimit.set('my-queue', { interval: 1000, limit: 10 }, (err) => {
   *   if (err) return console.error('Failed to set rate limit:', err);
   *   console.log('Rate limit set');
   * });
   * ```
   */
  static create = (): QueueRateLimit => {
    this.ensureInitialized();
    return this.track(new QueueRateLimit());
  };
}
