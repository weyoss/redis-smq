import { Producer, Consumer, QueueManager, Message } from '../..';
import { events } from '../../src/common/events/events';
import { waterfall } from '../../src/common/async/async';
import { ICallback } from '../../types';

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
  waterfall(
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

waterfall(
  [
    (cb: ICallback<void>) =>
      QueueManager.getSingletonInstance((err, queueManager) => {
        if (err) cb(err);
        else queueManager?.queue.create(queue, false, cb);
      }),
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
      QueueManager.getSingletonInstance((err, queueManager) =>
        queueManager?.quit(() => void 0),
      );
    }
  },
);
