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

export class ConsumerFactory extends FactoryAbstract {
  /**
   * Creates a Consumer instance.
   *
   * @param enableMultiplexing - Optional flag to enable multiplexing
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
  static create = (enableMultiplexing?: boolean): Consumer => {
    this.ensureInitialized();
    return this.track(new Consumer(enableMultiplexing));
  };

  /**
   * Convenience method to create and start a consumer in one call.
   *
   * @param enableMultiplexing - Optional flag to enable multiplexing
   * @param cb - Callback function called when consumer is ready
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
    enableMultiplexing: boolean,
    cb: ICallback<boolean>,
  ): Consumer;

  static startConsumer(cb: ICallback<boolean>): Consumer;

  static startConsumer(
    enableMultiplexingOrCb: boolean | ICallback<boolean>,
    cb?: ICallback<boolean>,
  ): Consumer {
    let enableMultiplexing = false;
    let callback: ICallback<boolean> = () => void 0;

    if (typeof enableMultiplexingOrCb === 'function') {
      callback = enableMultiplexingOrCb;
    } else if (
      typeof enableMultiplexingOrCb === 'boolean' &&
      typeof cb === 'function'
    ) {
      enableMultiplexing = enableMultiplexingOrCb;
      callback = cb;
    } else {
      throw new InvalidArgumentsError();
    }

    const consumer = this.create(enableMultiplexing);
    consumer.run(callback);
    return consumer;
  }
}
