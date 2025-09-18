/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  Configuration,
  Consumer,
  IRedisSMQConfig,
  Producer,
  ProducibleMessage,
} from '../../src/index.js';
import { getDefaultQueue } from './message-producing-consuming.js';

process.on('message', function (payload: unknown) {
  const config: IRedisSMQConfig = JSON.parse(String(payload));
  Configuration.initializeWithConfig(config, (err) => {
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

    const consumer = new Consumer();
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
