/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback } from 'redis-smq-common';
import {
  Producer,
  Consumer,
  Message,
  Queue,
  disconnect,
  EQueueType,
} from '../../index';

const queueName = `queue_${Date.now()}`;
const producer = new Producer();

const produceForever = (err?: Error | null) => {
  if (err) console.log(err);
  else {
    if (producer.isGoingUp() || producer.isRunning()) {
      const message = new Message().setBody('some data').setQueue(queueName);
      producer.produce(message, produceForever);
    }
  }
};

const consumer = new Consumer();

consumer.consume(
  queueName, // using the default namespace
  (message, cb) => cb(),
  (err) => err && console.log(err),
);

consumer.on('up', () => {
  console.log('UP');
});

consumer.on('down', () => {
  console.log('DOWN');
});

const serialOnOff = (cb: ICallback<void>) =>
  async.waterfall(
    [
      (cb: ICallback<void>) => consumer.run((err) => cb(err)),
      (cb: ICallback<void>) => consumer.shutdown((err) => cb(err)),
      (cb: ICallback<void>) => consumer.run((err) => cb(err)),
      (cb: ICallback<void>) => consumer.shutdown((err) => cb(err)),
      (cb: ICallback<void>) => consumer.run((err) => cb(err)),
      (cb: ICallback<void>) => consumer.shutdown((err) => cb(err)),
      (cb: ICallback<void>) => consumer.run((err) => cb(err)),
      (cb: ICallback<void>) => consumer.shutdown((err) => cb(err)),
      (cb: ICallback<void>) => consumer.run((err) => cb(err)),
      (cb: ICallback<void>) => consumer.shutdown((err) => cb(err)),
    ],
    cb,
  );

const queue = new Queue();
async.waterfall(
  [
    (cb: ICallback<void>) =>
      queue.save(queueName, EQueueType.LIFO_QUEUE, (err) => cb(err)),
    (cb: ICallback<void>) => producer.run((err) => cb(err)),
    (cb: ICallback<void>) => {
      produceForever();
      serialOnOff(cb);
    },
  ],
  (err) => {
    if (err) console.log(err);
    else {
      producer.shutdown();
      consumer.shutdown();
      disconnect(() => void 0);
    }
  },
);
