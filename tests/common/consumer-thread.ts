/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Consumer } from '../../src/lib/consumer/consumer';
import { defaultQueue } from './message-producing-consuming';
import { Producer } from '../../src/lib/producer/producer';
import { ProducibleMessage } from '../../src/lib/message/producible-message';

const producer = new Producer();
producer.run((err) => {
  if (err) throw err;
  producer.produce(
    new ProducibleMessage()
      .setQueue(defaultQueue)
      .setBody(123)
      .setRetryDelay(0),
    (err) => {
      console.log('GGGGGGG', err);
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
consumer.run();

setTimeout(() => {
  process.exit(0);
}, 10000);
