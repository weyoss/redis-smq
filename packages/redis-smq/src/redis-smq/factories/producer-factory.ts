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

/**
 * Factory class for creating and managing Producer instances.
 *
 * Provides multiple creation patterns and a convenience method for creating
 * and starting producers in a single operation. All created producers are
 * automatically tracked for lifecycle management.
 *
 * @see {@link Producer} for detailed Producer API documentation
 *
 * @example
 * ```typescript
 * // Callback pattern
 * const producer = ProducerFactory.create();
 * producer.run((err) => {
 *   if (err) console.error('Failed to start producer:', err);
 * });
 *
 * // Promise pattern
 * const producer = ProducerFactory.create();
 * await producer.run();
 * console.log('Producer started');
 * ```
 */
export class ProducerFactory extends FactoryAbstract {
  /**
   * Creates a Producer instance.
   *
   * @returns A new Producer instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * // Create producer with default settings
   * const producer = ProducerFactory.create();
   *
   * // Create and start producer
   * const producer = ProducerFactory.create();
   * producer.run((err) => {
   *   if (err) console.error('Failed to start:', err);
   *   else console.log('Producer ready');
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
   * @param cb - Optional callback function called when producer is ready or if an error occurs
   * @returns The created Producer instance (started automatically)
   *
   * @example
   * ```typescript
   * // Callback pattern
   * const producer = ProducerFactory.startProducer((err) => {
   *   if (err) {
   *     console.error('Failed to start producer:', err);
   *     return;
   *   }
   *   console.log('Producer started');
   *   producer.produce(message, (produceErr, messageIds) => {
   *     if (produceErr) console.error('Failed to produce:', produceErr);
   *     else console.log('Message sent:', messageIds);
   *   });
   * });
   *
   * // Promise pattern
   * try {
   *   const producer = await ProducerFactory.startProducer();
   *   console.log('Producer started');
   *   const messageIds = await producer.produce(message);
   *   console.log('Message sent:', messageIds);
   * } catch (err) {
   *   console.error('Failed to start producer or send message:', err);
   * }
   * ```
   */
  static startProducer(): Promise<Producer>;
  static startProducer(cb: ICallback): Producer;
  static startProducer(cb?: ICallback): Promise<Producer> | Producer {
    const producer = ProducerFactory.create();

    if (cb) {
      producer.run((err) => {
        if (err) return cb(err);
        cb(null);
      });
      return producer;
    }

    return (async () => {
      await producer.run();
      return producer;
    })();
  }
}
