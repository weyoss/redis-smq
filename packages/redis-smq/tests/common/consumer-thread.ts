/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  Consumer,
  IRedisSMQParsedConfig,
  Producer,
  ProducibleMessage,
  RedisSMQ,
} from '../../src/index.js';
import { getDefaultQueue } from './message-producing-consuming.js';
import { IConsumerParsedOptions } from '../../src/consumer/types/index.js';

process.on('message', function (payload: unknown) {
  const {
    config,
    consumerOptions,
  }: {
    config: IRedisSMQParsedConfig;
    consumerOptions: IConsumerParsedOptions;
  } = JSON.parse(String(payload));
  RedisSMQ.initializeWithConfig(config, (err) => {
    if (err) throw err;
    const defaultQueue = getDefaultQueue();
    const producer = new Producer();
    producer.run((err) => {
      if (err) throw err;
      producer.produce(
        new ProducibleMessage()
          .setQueue(defaultQueue)
          .setBody(123)
          .setRetryDelay(0),
        (err) => {
          if (err) throw err;
        },
      );
    });

    const consumer = new Consumer(consumerOptions);
    consumer.consume(
      defaultQueue,
      () => void 0, // not acknowledging
      (err) => {
        if (err) throw err;
      },
    );
    consumer.run(() => void 0);

    setTimeout(() => {
      process.exit(0);
    }, 10000);
  });
});
