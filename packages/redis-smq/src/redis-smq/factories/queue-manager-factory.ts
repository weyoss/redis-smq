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
   * @returns A new QueueManager instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * import { EQueueType, EQueueDeliveryModel } from 'redis-smq';
   *
   * const queueManager = RedisSMQ.createQueueManager();
   * queueManager.save(
   *   'my-queue',
   *   EQueueType.LIFO_QUEUE,
   *   EQueueDeliveryModel.POINT_TO_POINT,
   *   (err, result) => {
   *     if (err) return console.error('Failed to create queue:', err);
   *     console.log('Queue created:', result);
   *   }
   * );
   * ```
   */
  static create = (): QueueManager => {
    this.ensureInitialized();
    return this.track(new QueueManager());
  };
}
