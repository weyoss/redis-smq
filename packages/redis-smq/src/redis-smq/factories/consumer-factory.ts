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
import { IConsumerOptions } from '../../consumer/types/index.js';

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
   * Creates a new Consumer instance with the specified configuration options.
   *
   * @param {IConsumerOptions} consumerOptions - Configuration options for the consumer:
   *   - `enableMultiplexing` - When true, enables handling multiple queues with one connection. Default: false.
   *   - `heartbeatTTL` - Consumer heartbeat TTL in milliseconds. Default: 120000 (2 minutes).
   *   - `enableBatchAcks` - When true, enables batch acknowledgment of messages. Default: true.
   *   - `batchSize` - Maximum number of messages to acknowledge in a batch. Default: 100.
   *   - `batchTimeoutMs` - Maximum time to wait for batch to fill before acknowledging. Default: 10000 (10 seconds).
   * @returns {Consumer} A new configured Consumer instance.
   * @throws {Error} If RedisSMQ has not been initialized via `RedisSMQ.initialize()`.
   *
   * @example
   * ```typescript
   * // Create consumer with custom options
   * const consumer = ConsumerFactory.create({
   *   enableMultiplexing: true,
   *   heartbeatTTL: 60000,
   *   enableBatchAcks: false
   * });
   *
   * consumer.run((err) => {
   *   if (err) return console.error('Consumer failed to start:', err);
   *   console.log('Consumer is ready to receive messages');
   * });
   * ```
   */
  static create(consumerOptions: IConsumerOptions): Consumer;

  /**
   * Creates a new Consumer instance with multiplexing configuration.
   *
   * @deprecated This method signature is deprecated. Use {@link create} with {@link IConsumerOptions} instead.
   * @param {boolean} enableMultiplexing - When true, enables message multiplexing across multiple queues.
   * @returns {Consumer} A new Consumer instance with the specified multiplexing setting.
   * @throws {Error} If RedisSMQ has not been initialized via `RedisSMQ.initialize()`.
   *
   * @example
   * ```typescript
   * // Deprecated: Create consumer with multiplexing disabled
   * const consumer = ConsumerFactory.create(false);
   *
   * consumer.run((err) => {
   *   if (err) return console.error('Consumer failed to start:', err);
   *   console.log('Consumer is ready to receive messages');
   * });
   * ```
   */
  static create(enableMultiplexing: boolean): Consumer;

  /**
   * Creates a new Consumer instance with default configuration.
   *
   * @returns {Consumer} A new Consumer instance with default settings.
   * @throws {Error} If RedisSMQ has not been initialized via `RedisSMQ.initialize()`.
   *
   * @example
   * ```typescript
   * // Create consumer with default options
   * const consumer = ConsumerFactory.create();
   *
   * consumer.run((err) => {
   *   if (err) return console.error('Consumer failed to start:', err);
   *   console.log('Consumer is ready to receive messages');
   * });
   * ```
   */
  static create(): Consumer;

  static create(mixed?: boolean | IConsumerOptions): Consumer {
    ConsumerFactory.ensureInitialized();
    if (typeof mixed === 'boolean') return this.track(new Consumer(mixed));
    return ConsumerFactory.track(new Consumer(mixed));
  }

  /**
   * Creates and automatically starts a consumer in a single operation.
   *
   * This is a convenience method that combines:
   * 1. Creating a consumer with {@link create}
   * 2. Starting the consumer with `consumer.run()`
   *
   * The consumer is returned immediately and will start asynchronously.
   * The callback is invoked when the consumer has successfully started.
   *
   * @param {IConsumerOptions} consumerOptions - Configuration options for the consumer.
   * @param {ICallback<void>} cb - Callback invoked when the consumer successfully starts.
   *   The callback receives an error if startup fails.
   * @returns {Consumer} The created Consumer instance (already started asynchronously).
   * @throws {Error} If RedisSMQ has not been initialized via `RedisSMQ.initialize()`.
   *
   * @example
   * ```typescript
   * // Create and start consumer with custom options
   * const consumer = ConsumerFactory.startConsumer(
   *   { enableBatchAcks: false },
   *   (err) => {
   *     if (err) {
   *       console.error('Failed to start consumer:', err);
   *       return;
   *     }
   *
   *     // Consumer is now running, set up message consumption
   *     consumer.consume('my-queue', (message, done) => {
   *       console.log('Processing message:', message);
   *       // Process the message...
   *       done(); // Acknowledge message processing
   *     }, (consumeErr) => {
   *       if (consumeErr) {
   *         console.error('Failed to start consumption:', consumeErr);
   *       } else {
   *         console.log('Consumer is now consuming messages');
   *       }
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
   * @deprecated This method signature is deprecated. Use {@link startConsumer} with {@link IConsumerOptions} instead.
   * @param {boolean} enableMultiplexing - When true, enables message multiplexing.
   * @param {ICallback<void>} cb - Callback invoked when the consumer successfully starts.
   * @returns {Consumer} The created Consumer instance (already started asynchronously).
   * @throws {Error} If RedisSMQ has not been initialized via `RedisSMQ.initialize()`.
   *
   * @example
   * ```typescript
   * // Deprecated: Create and start consumer with multiplexing setting
   * const consumer = ConsumerFactory.startConsumer(false, (err) => {
   *   if (err) return console.error('Failed to start consumer:', err);
   *
   *   // Consumer is now running
   *   consumer.consume('my-queue', (message, done) => {
   *     console.log('Processing message:', message);
   *     done();
   *   });
   * });
   * ```
   */
  static startConsumer(
    enableMultiplexing: boolean,
    cb: ICallback<void>,
  ): Consumer;

  /**
   * Creates and automatically starts a consumer with default configuration.
   *
   * @param {ICallback<void>} cb - Callback invoked when the consumer successfully starts.
   * @returns {Consumer} The created Consumer instance (already started asynchronously).
   * @throws {Error} If RedisSMQ has not been initialized via `RedisSMQ.initialize()`.
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
