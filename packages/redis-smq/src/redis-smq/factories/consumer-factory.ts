/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { Consumer } from '../../consumer/index.js';
import { ICallback } from 'redis-smq-common';
import { IConsumerOptions } from '../../consumer/index.js';

/**
 * Factory class for creating and managing Consumer instances.
 *
 * Provides multiple creation patterns and a convenience method for creating
 * and starting consumers in a single operation. All created consumers are
 * automatically tracked for lifecycle management.
 *
 * @see {@link Consumer} for detailed Consumer API documentation
 *
 * @example
 * ```typescript
 * // Callback pattern
 * const consumer = ConsumerFactory.create();
 * consumer.run((err) => {
 *   if (err) console.error('Failed to start consumer:', err);
 * });
 *
 * // Promise pattern
 * const consumer = ConsumerFactory.create();
 * await consumer.run();
 * console.log('Consumer started');
 * ```
 */
export class ConsumerFactory extends FactoryAbstract {
  /**
   * Creates a new Consumer instance with custom configuration.
   *
   * @param consumerOptions - Configuration options for the consumer
   * @returns A new Consumer instance with the specified configuration
   *
   * @see {@link IConsumerOptions} for all available configuration options
   * @see {@link Consumer.constructor} for detailed documentation
   *
   * @example
   * ```typescript
   * // Create with default options
   * const consumer = ConsumerFactory.create();
   *
   * // Create with custom options
   * const consumer = ConsumerFactory.create({
   *   enableMultiplexing: true,
   *   heartbeatTTL: 60000,
   *   batchAcks: {
   *     batchSize: 500,
   *     batchTimeoutMs: 5000
   *   }
   * });
   * ```
   */
  static create(consumerOptions?: IConsumerOptions): Consumer {
    ConsumerFactory.ensureInitialized();
    return ConsumerFactory.track(new Consumer(consumerOptions));
  }

  /**
   * Creates and automatically starts a consumer with custom configuration.
   *
   * This method creates a consumer and starts it in a single operation.
   * The consumer is automatically tracked for lifecycle management.
   *
   * @param consumerOptions - Configuration options for the consumer
   * @param cb - Optional callback invoked when consumer starts or if an error occurs
   * @returns The created Consumer instance (started automatically)
   *
   * @see {@link Consumer.run} for startup behavior
   * @see {@link Consumer.consume} for setting up message handlers after startup
   *
   * @example
   * ```typescript
   * // Callback pattern
   * const consumer = ConsumerFactory.startConsumer(
   *   { enableMultiplexing: true },
   *   (err) => {
   *     if (err) {
   *       console.error('Failed to start:', err);
   *       return;
   *     }
   *     console.log('Consumer started');
   *     consumer.consume('my-queue', (message, done) => {
   *       console.log('Processing:', message);
   *       done();
   *     });
   *   }
   * );
   *
   * // Promise pattern
   * try {
   *   const consumer = await ConsumerFactory.startConsumer({
   *     enableMultiplexing: true,
   *     batchAcks: { batchSize: 200 }
   *   });
   *   console.log('Consumer started');
   *   await consumer.consume('orders', (message, done) => {
   *     console.log('Processing order:', message);
   *     done();
   *   });
   * } catch (err) {
   *   console.error('Failed to start consumer:', err);
   * }
   * ```
   */
  static startConsumer(consumerOptions: IConsumerOptions): Promise<Consumer>;
  static startConsumer(
    consumerOptions: IConsumerOptions,
    cb: ICallback<void>,
  ): Consumer;
  static startConsumer(
    consumerOptions: IConsumerOptions,
    cb?: ICallback<void>,
  ): Promise<Consumer> | Consumer {
    const consumer = new Consumer(consumerOptions);

    if (cb) {
      consumer.run((err) => {
        if (err) return cb(err);
        cb(null);
      });
      return consumer;
    }

    return (async () => {
      await consumer.run();
      return consumer;
    })();
  }
}
