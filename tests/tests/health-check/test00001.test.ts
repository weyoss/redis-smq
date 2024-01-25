/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Producer } from '../../../src/lib/producer/producer';
import { ProducibleMessage } from '../../../src/lib/message/producible-message';
import { Consumer } from '../../../src/lib/consumer/consumer';
import { async, ICallback } from 'redis-smq-common';
import { Queue } from '../../../src/lib/queue/queue/queue';
import { EQueueDeliveryModel, EQueueType } from '../../../types';
import { disconnect } from '../../../index';

test('Health check: case 1', (done) => {
  const queueName = `queue_${Date.now()}`;

  const producer = new Producer();
  producer.on('up', () => {
    console.log('Producer UP');
  });
  producer.on('down', () => {
    console.log('Producer DOWN');
  });

  const produceForever = (err?: Error | null) => {
    if (err) {
      console.log(err);
      done(err);
    } else {
      if (producer.isGoingUp() || producer.isRunning()) {
        const message = new ProducibleMessage()
          .setBody('some data')
          .setQueue(queueName);
        producer.produce(message, produceForever);
      }
    }
  };

  const consumer = new Consumer();

  consumer.on('up', () => {
    console.log('Consumer UP');
  });

  consumer.on('down', () => {
    console.log('Consumer DOWN');
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
        queue.save(
          queueName,
          EQueueType.LIFO_QUEUE,
          EQueueDeliveryModel.POINT_TO_POINT,
          (err) => cb(err),
        ),
      (cb: ICallback<void>) => {
        consumer.consume(
          queueName, // using the default namespace
          (message, cb) => cb(),
          (err) => {
            console.log(err);
            cb(err);
          },
        );
      },
      (cb: ICallback<void>) => {
        producer.run((err) => {
          produceForever();
          cb(err);
        });
      },
      (cb: ICallback<void>) => {
        serialOnOff(cb);
      },
    ],
    (err) => {
      console.log(err);
      if (err) done(err);
      else {
        async.waterfall(
          [
            (cb: ICallback<void>) => producer.shutdown(() => cb()),
            (cb: ICallback<void>) => consumer.shutdown(() => cb()),
            disconnect,
          ],
          done,
        );
      }
    },
  );
});
