/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { ExchangeDirect } from '../../exchange/index.js';

export class DirectExchangeFactory extends FactoryAbstract {
  /**
   * Creates a new direct exchange instance.
   *
   * A direct exchange routes messages to queues based on exact routing key matches.
   * Messages are delivered to queues whose binding key exactly matches the routing key.
   *
   * @returns {ExchangeDirect} A new direct exchange instance
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
   *   const directExchange = RedisSMQ.createDirectExchange();
   *   directExchange.bindQueue('order-queue', {
   *     exchange: 'orders',
   *     routingKey: 'order.created'
   *   }, (bindErr) => {
   *     if (bindErr) return console.error('Failed to bind queue:', bindErr);
   *     console.log('Queue bound to direct exchange');
   *   });
   * });
   * ```
   */
  static create = (): ExchangeDirect => {
    this.ensureInitialized();
    return this.track(new ExchangeDirect());
  };
}
