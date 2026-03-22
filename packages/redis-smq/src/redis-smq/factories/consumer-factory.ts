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
import { ICallback, InvalidArgumentsError } from 'redis-smq-common';
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
 * // Create a consumer with default options
 * const consumer = ConsumerFactory.create();
 *
 * // Start the consumer
 * consumer.run((err) => {
 *   if (err) console.error('Failed to start consumer:', err);
 * });
 * ```
 */
export class ConsumerFactory extends FactoryAbstract {
  /**
   * Creates a new Consumer instance with custom configuration.
   *
   * @param {IConsumerOptions} consumerOptions - Configuration options
   * @returns {Consumer} A new Consumer instance with the specified configuration
   *
   * @see {@link IConsumerOptions} for all available configuration options
   * @see {@link Consumer.constructor} for detailed documentation
   *
   * @example
   * ```typescript
   * const consumer = ConsumerFactory.create({
   *   enableMultiplexing: true,
   *   heartbeatTTL: 60000,
   *   batchAcks: {
   *     batchSize: 500,
   *     batchTimeoutMs: 5000
   *   },
   *   batchUnacks: false
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
   * @param {IConsumerOptions} consumerOptions - Configuration options
   * @param {ICallback<void>} cb - Callback invoked when consumer starts
   * @returns {Consumer} The created Consumer instance
   *
   * @see {@link Consumer.run} for startup behavior
   * @see {@link Consumer.consume} for setting up message handlers after startup
   *
   * @example
   * ```typescript
   * const consumer = ConsumerFactory.startConsumer(
   *   {
   *     enableMultiplexing: true,
   *     batchAcks: { batchSize: 200 }
   *   },
   *   (err) => {
   *     if (err) {
   *       console.error('Failed to start:', err);
   *       return;
   *     }
   *
   *     // Consumer is running, set up message consumption
   *     consumer.consume('orders', (message, done) => {
   *       console.log('Processing order:', message);
   *       done();
   *     }, (consumeErr) => {
   *       if (consumeErr) console.error('Failed to setup consumption:', consumeErr);
   *     });
   *   }
   * );
   * ```
   */
  static startConsumer(
    consumerOptions: IConsumerOptions,
    cb: ICallback<void>,
  ): Consumer;

  /**
   * Creates and automatically starts a consumer with default configuration.
   *
   * @param {ICallback<void>} cb - Callback invoked when consumer starts
   * @returns {Consumer} The created Consumer instance
   *
   * @see {@link Consumer.run} for startup behavior
   * @see {@link Consumer.getDefaultOptions} to view default settings
   *
   * @example
   * ```typescript
   * // Create and start consumer with default settings
   * const consumer = ConsumerFactory.startConsumer((err) => {
   *   if (err) {
   *     console.error('Failed to start consumer:', err);
   *     return;
   *   }
   *
   *   // Consumer is now running, set up message consumption
   *   consumer.consume('my-queue', (message, done) => {
   *     console.log('Processing message:', message);
   *     done();
   *   }, (consumeErr) => {
   *     if (consumeErr) console.error('Failed to start consumption:', consumeErr);
   *   });
   *
   *   // Later, shut down gracefully
   *   process.on('SIGTERM', () => {
   *     consumer.shutdown(() => {
   *       console.log('Consumer shut down');
   *     });
   *   });
   * });
   * ```
   */
  static startConsumer(cb: ICallback<void>): Consumer;

  static startConsumer(
    mixed: IConsumerOptions | ICallback<void>,
    cb?: ICallback<void>,
  ): Consumer {
    let callback: ICallback<void>;
    let consumer: Consumer | null;
    if (typeof mixed === 'function') {
      callback = mixed;
      consumer = this.create();
    } else if (typeof mixed === 'object' && typeof cb === 'function') {
      callback = cb;
      consumer = this.create(mixed);
    } else {
      throw new InvalidArgumentsError();
    }

    consumer.run(callback);
    return consumer;
  }
}
