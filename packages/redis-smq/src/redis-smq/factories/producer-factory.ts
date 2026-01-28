/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { Producer } from '../../producer/index.js';
import { ICallback } from 'redis-smq-common';

export class ProducerFactory extends FactoryAbstract {
  /**
   * Creates a Producer instance.
   *
   * @returns A new Producer instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const producer = RedisSMQ.createProducer();
   * producer.run((err) => {
   *   if (err) return console.error('Producer failed to start:', err);
   *   // Producer is ready to send messages
   * });
   * ```
   */
  static create = (): Producer => {
    this.ensureInitialized();
    return this.track(new Producer());
  };

  /**
   * Convenience method to create and start a producer in one call.
   *
   * @param cb - Callback function called when producer is ready
   * @returns The created Producer instance
   *
   * @example
   * ```typescript
   * const producer = RedisSMQ.startProducer((err) => {
   *   if (err) return console.error('Failed to start producer:', err);
   *   producer.produce(message, (produceErr, messageIds) => {
   *     if (produceErr) return console.error('Failed to produce:', produceErr);
   *     console.log('Message sent:', messageIds);
   *   });
   * });
   * ```
   */
  static startProducer(
    cb: ICallback<boolean>,
  ): ReturnType<typeof ProducerFactory.create> {
    const producer = ProducerFactory.create();
    producer.run(cb);
    return producer;
  }
}
