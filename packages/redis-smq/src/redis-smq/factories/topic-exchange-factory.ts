/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { ExchangeTopic } from '../../exchange/index.js';

export class TopicExchangeFactory extends FactoryAbstract {
  /**
   * Creates a new topic exchange instance.
   *
   * A topic exchange routes messages to queues based on wildcard pattern matching
   * between the routing key and the binding pattern.
   *
   * @returns {ExchangeTopic} A new topic exchange instance
   * @throws Error If RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * import { RedisSMQ } from 'redis-smq';
   * import { ERedisConfigClient } from 'redis-smq-common';
   *
   * RedisSMQ.initialize({
   *   client: ERedisConfigClient.IOREDIS,
   *   options: { host: 'localhost', port: 6379 }
   * }, (err) => {
   *   if (err) return console.error('Init failed:', err);
   *
   *   const topicExchange = RedisSMQ.createTopicExchange();
   *   topicExchange.bindQueue('user-queue', {
   *     exchange: 'user-events',
   *     routingKey: 'user.*.created'
   *   }, (bindErr) => {
   *     if (bindErr) return console.error('Failed to bind queue:', bindErr);
   *     console.log('Queue bound to topic exchange');
   *   });
   * });
   * ```
   */
  static create = (): ExchangeTopic => {
    this.ensureInitialized();
    return this.track(new ExchangeTopic());
  };
}
