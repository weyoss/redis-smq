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

export class ConsumerFactory extends FactoryAbstract {
  /**
   * Creates a Consumer instance.
   *
   * @param {IConsumerOptions} consumerOptions
   *
   * @returns A new Consumer instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const consumer = RedisSMQ.createConsumer({ enableBatchAcks: false });
   * consumer.run((err) => {
   *   if (err) return console.error('Consumer failed to start:', err);
   *   // Consumer is ready to receive messages
   * });
   * ```
   */
  static create(consumerOptions?: IConsumerOptions): Consumer;

  /**
   * Creates a Consumer instance.
   *
   * @param {boolean} enableMultiplexing
   *
   * @returns A new Consumer instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const consumer = RedisSMQ.createConsumer(false);
   * consumer.run((err) => {
   *   if (err) return console.error('Consumer failed to start:', err);
   *   // Consumer is ready to receive messages
   * });
   * ```
   */
  static create(enableMultiplexing?: boolean): Consumer;

  /**
   * Creates a Consumer instance.
   *
   * @returns A new Consumer instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const consumer = RedisSMQ.createConsumer();
   * consumer.run((err) => {
   *   if (err) return console.error('Consumer failed to start:', err);
   *   // Consumer is ready to receive messages
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
   * Convenience method to create and start a consumer in one call.
   *
   * @param {IConsumerOptions} consumerOptions - An object containing Consumer options
   * @param {ICallback} cb - Callback function called when consumer is ready
   * @returns The created Consumer instance
   *
   * @example
   * ```typescript
   * const consumer = RedisSMQ.startConsumer(false, (err) => {
   *   if (err) return console.error('Failed to start consumer:', err);
   *   consumer.consume('my-queue', (message, done) => {
   *     // handle message ...
   *     done();
   *   }, (consumeErr) => {
   *     if (consumeErr) return console.error('Failed to start consumption:', consumeErr);
   *     console.log('Consumer is consuming messages');
   *   });
   * });
   * ```
   */
  static startConsumer(
    consumerOptions: IConsumerOptions,
    cb: ICallback<void>,
  ): Consumer;

  /**
   * Convenience method to create and start a consumer in one call.
   *
   * @param {boolean} enableMultiplexing - Flag to enable multiplexing
   * @param {ICallback} cb - Callback function called when consumer is ready
   * @returns The created Consumer instance
   *
   * @example
   * ```typescript
   * const consumer = RedisSMQ.startConsumer(false, (err) => {
   *   if (err) return console.error('Failed to start consumer:', err);
   *   consumer.consume('my-queue', (message, done) => {
   *     // handle message ...
   *     done();
   *   }, (consumeErr) => {
   *     if (consumeErr) return console.error('Failed to start consumption:', consumeErr);
   *     console.log('Consumer is consuming messages');
   *   });
   * });
   * ```
   *
   * @deprecated This method signature is deprecated in  favor of `startConsumer(consumerOptions?: IConsumerOptions)`
   */
  static startConsumer(
    enableMultiplexing: boolean,
    cb: ICallback<void>,
  ): Consumer;

  /**
   * Convenience method to create and start a consumer in one call.
   *
   * @param {ICallback} cb - Callback function called when consumer is ready
   * @returns The created Consumer instance
   *
   * @example
   * ```typescript
   * const consumer = RedisSMQ.startConsumer((err) => {
   *   if (err) return console.error('Failed to start consumer:', err);
   *   consumer.consume('my-queue', (message, done) => {
   *     // handle message ...
   *     done();
   *   }, (consumeErr) => {
   *     if (consumeErr) return console.error('Failed to start consumption:', consumeErr);
   *     console.log('Consumer is consuming messages');
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
