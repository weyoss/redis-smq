import { Consumer } from '../../src/lib/consumer/consumer';
import { config } from './config';
import { defaultQueue } from './message-producing-consuming';
import { Producer } from '../../src/lib/producer/producer';
import { Message } from '../../src/lib/message/message';

const producer = new Producer(config);
producer.produce(
  new Message().setQueue(defaultQueue).setBody(123).setRetryDelay(0),
  (err) => {
    if (err) throw err;
  },
);

const consumer = new Consumer(config);
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
