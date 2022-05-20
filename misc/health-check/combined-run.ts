import {
  Consumer,
  Producer,
  setConfiguration,
  setLogger,
  QueueManager,
  Message,
} from '../..';

setConfiguration({
  logger: {
    enabled: false,
  },
  messages: {
    store: true,
  },
});

setLogger(console);

const producer = new Producer();

const consumer = new Consumer();
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
QueueManager.getSingletonInstance((err, queueManager) => {
  if (err) console.log(err);
  else {
    queueManager?.queue.create(queue, false, (err) => {
      if (err) console.log(err);
      else consumer.consume(queue, (msg, cb) => cb(), produce);
    });
  }
});
