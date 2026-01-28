/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { ConsumerGroups } from '../../consumer-groups/index.js';

export class ConsumerGroupsFactory extends FactoryAbstract {
  /**
   * Creates a ConsumerGroups instance.
   *
   * @returns A new ConsumerGroups instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const consumerGroups = RedisSMQ.createConsumerGroups();
   * consumerGroups.saveConsumerGroup('my-queue', 'group1', (err, result) => {
   *   if (err) return console.error('Failed to save group:', err);
   *   console.log('Group saved, code:', result);
   * });
   * ```
   */
  static create = (): ConsumerGroups => {
    this.ensureInitialized();
    return this.track(new ConsumerGroups());
  };
}
