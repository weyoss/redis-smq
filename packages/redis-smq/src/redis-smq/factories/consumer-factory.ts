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
 * @see {@link Consumer.consume} for setting up message consumption
 * @see {@link Consumer.cancel} for stopping message consumption
 * @see {@link Consumer.getQueues} for listing active queues
 * @see {@link Consumer.run} for starting the consumer
 * @see {@link Consumer.shutdown} for graceful shutdown
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
   * Creates a new Consumer instance with default options.
   *
   * @returns {Consumer} A new Consumer instance with default configuration
   *
   * @see {@link Consumer.constructor} for detailed configuration options
   * @see {@link Consumer.getDefaultOptions} for viewing default settings
   *
   * @example
   * ```typescript
   * const consumer = ConsumerFactory.create();
   * console.log(Consumer.getDefaultOptions()); // View default settings
   * ```
   */
  static create(): Consumer;

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
  static create(consumerOptions: IConsumerOptions): Consumer;

  /**
   * Creates a new Consumer instance with multiplexing configuration.
   *
   * @param {boolean} enableMultiplexing - Enable/disable message multiplexing
   * @returns {Consumer} A new Consumer instance
   * @deprecated Use {@link IConsumerOptions} object with `enableMultiplexing` property instead
   *
   * @see {@link Consumer.constructor} for the modern configuration API
   *
   * @example
   * ```typescript
   * // Deprecated
   * const consumer = ConsumerFactory.create(true);
   *
   * // Modern equivalent
   * const consumer = ConsumerFactory.create({
   *   enableMultiplexing: true
   * });
   * ```
   */
  static create(enableMultiplexing: boolean): Consumer;

  static create(mixed?: boolean | IConsumerOptions): Consumer {
    ConsumerFactory.ensureInitialized();
    if (typeof mixed === 'boolean') return this.track(new Consumer(mixed));
    return ConsumerFactory.track(new Consumer(mixed));
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
   * Creates and automatically starts a consumer with multiplexing configuration.
   *
   * @param {boolean} enableMultiplexing - Enable/disable message multiplexing
   * @param {ICallback<void>} cb - Callback invoked when consumer starts
   * @returns {Consumer} The created Consumer instance
   * @deprecated Use {@link IConsumerOptions} object with `enableMultiplexing` property instead
   *
   * @see {@link Consumer.run} for startup behavior
   *
   * @example
   * ```typescript
   * // Deprecated
   * const consumer = ConsumerFactory.startConsumer(true, (err) => {
   *   if (err) console.error('Failed to start:', err);
   * });
   *
   * // Modern equivalent
   * const consumer = ConsumerFactory.startConsumer(
   *   { enableMultiplexing: true },
   *   (err) => {
   *     if (err) console.error('Failed to start:', err);
   *   }
   * );
   * ```
   */
  static startConsumer(
    enableMultiplexing: boolean,
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
    mixed: boolean | IConsumerOptions | ICallback<void>,
    cb?: ICallback<void>,
  ): Consumer {
    let callback: ICallback<void> = () => void 0;
    let consumer: Consumer | null = null;
    if (typeof mixed === 'function') {
      callback = mixed;
      consumer = this.create();
    } else if (typeof mixed === 'boolean' && typeof cb === 'function') {
      callback = cb;
      consumer = this.create(mixed);
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
