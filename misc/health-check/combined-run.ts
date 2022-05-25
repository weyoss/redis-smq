import { Consumer, Producer, setLogger, QueueManager, Message } from '../..';
import { IConfig } from '../../types';

setLogger(console);

const config: IConfig = {
  logger: {
    enabled: false,
  },
  messages: {
    store: true,
  },
};

const producer = new Producer(config);

const consumer = new Consumer(config);
consumer.run();

const produce = (err?: Error | null) => {
  if (err) console.log(err);
  else {
    setTimeout(() => {
      const m = new Message().setBody(Date.now()).setQueue(queue);
      producer.produce(m, produce);
    }, 1000);
  }
};

const queue = `queue_${Date.now()}`;
QueueManager.createInstance(config, (err, queueManager) => {
  if (err) console.log(err);
  else {
    queueManager?.queue.create(queue, false, (err) => {
      if (err) console.log(err);
      else consumer.consume(queue, (msg, cb) => cb(), produce);
    });
  }
});
