import { async } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';
import { Producer, Consumer, QueueManager, Message } from '../..';
import { events } from '../../src/common/events/events';

const queue = `queue_${Date.now()}`;
const producer = new Producer();

const produceForever = (err?: Error | null) => {
  if (err) console.log(err);
  else {
    if (producer.isGoingUp() || producer.isRunning()) {
      const message = new Message().setBody('some data').setQueue(queue); // using the default namespace
      producer.produce(message, produceForever);
    }
  }
};

const consumer = new Consumer();

consumer.consume(
  queue, // using the default namespace
  (message, cb) => cb(),
  (err) => err && console.log(err),
);

consumer.on(events.UP, () => {
  console.log('UP');
});

consumer.on(events.DOWN, () => {
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

let queueManager: QueueManager | null | undefined = null;
async.waterfall(
  [
    (cb: ICallback<void>) =>
      QueueManager.createInstance({}, (err, instance) => {
        if (err) cb(err);
        else {
          queueManager = instance;
          queueManager?.queue.create(queue, false, cb);
        }
      }),
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
      queueManager?.quit(() => void 0);
    }
  },
);
