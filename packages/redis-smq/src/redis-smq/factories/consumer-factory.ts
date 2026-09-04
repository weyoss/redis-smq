/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FactoryAbstract } from './factory-abstract.js';
import { Consumer, IConsumerOptions } from '../../consumer/index.js';
import { ICallback } from 'redis-smq-common';

export class ConsumerFactory extends FactoryAbstract {
  /**
   * Creates a Consumer instance.
   *
   * @param consumerOptions - Optional configuration options
   * @returns {Consumer} A new Consumer instance
   */
  static create(consumerOptions?: IConsumerOptions): Consumer {
    ConsumerFactory.ensureInitialized();
    return ConsumerFactory.track(new Consumer(consumerOptions));
  }

  /**
   * Creates and starts a Consumer instance.
   *
   * @param consumerOptions - Optional configuration options
   * @param cb - (err) => void. If provided, returns Consumer synchronously
   * @returns Promise with Consumer if no callback, otherwise Consumer
   */
  static startConsumer(consumerOptions?: IConsumerOptions): Promise<Consumer>;
  static startConsumer(
    consumerOptions: IConsumerOptions,
    cb: ICallback<void>,
  ): Consumer;
  static startConsumer(
    consumerOptions?: IConsumerOptions,
    cb?: ICallback<void>,
  ): Promise<Consumer> | Consumer {
    const consumer = ConsumerFactory.create(consumerOptions);

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
