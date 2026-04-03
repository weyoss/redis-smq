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
  IMessageTransferable,
  Producer,
  ProducibleMessage,
  RedisSMQ,
} from '../../src/index.js';
import { getDefaultQueue } from './message-producing-consuming.js';
import { IConsumerParsedOptions } from '../../src/index.js';
import { ICallback, IRedisConfig } from 'redis-smq-common';

process.on('message', function (payload: unknown) {
  const {
    redisConfig,
    consumerOptions,
  }: {
    redisConfig: IRedisConfig;
    consumerOptions: IConsumerParsedOptions;
  } = JSON.parse(String(payload));
  RedisSMQ.initialize(redisConfig, (err) => {
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (msg: IMessageTransferable, cb: ICallback) => void 0, // not acknowledging
      (err) => {
        if (err) throw err;
      },
    );
    consumer.run(() => void 0);

    setTimeout(() => {
      process.exit(0);
    }, 10_000);
  });
});
