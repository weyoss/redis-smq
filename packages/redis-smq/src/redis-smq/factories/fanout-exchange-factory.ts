/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { ExchangeFanout } from '../../exchange/index.js';

export class FanoutExchangeFactory extends FactoryAbstract {
  /**
   * Creates a new fanout exchange instance.
   *
   * A fanout exchange routes messages to all queues bound to it, regardless of routing keys.
   * This is useful for broadcasting messages to multiple consumers.
   *
   * @returns {ExchangeFanout} A new fanout exchange instance
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
   *   const fanoutExchange = RedisSMQ.createFanoutExchange();
   *   fanoutExchange.saveExchange('notifications', (saveErr) => {
   *     if (saveErr) return console.error('Failed to save exchange:', saveErr);
   *     console.log('Fanout exchange saved');
   *   });
   * });
   * ```
   */
  static create = (): ExchangeFanout => {
    this.ensureInitialized();
    return this.track(new ExchangeFanout());
  };
}
