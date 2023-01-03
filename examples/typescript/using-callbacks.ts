import { ICallback, RedisClientName } from 'redis-smq-common/dist/types';
import { Consumer, Producer, Message, QueueManager } from '../../index'; // from 'redis-smq'
import { EQueueType, IConfig, TProduceMessageReply } from '../../types'; // from 'redis-smq/dist/types'
import { logger } from 'redis-smq-common';

export const config: IConfig = {
  namespace: 'ns1',
  redis: {
    client: RedisClientName.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
    },
  },
  logger: {
    enabled: true,
    options: {
      level: 'info',
      // streams: [
      //   {
      //     path: path.normalize(`${__dirname}/logs/redis-smq.log`),
      //   },
      // ],
    },
  },
};

// Setting up a custom logger
// This step should be also done from your application bootstrap
logger.setLogger(console);

const createQueue = (cb: ICallback<void>): void => {
  // Before producing and consuming messages to/from a given queue, we need to make sure that such queue exists
  QueueManager.createInstance(config, (err, queueManager) => {
    if (err) cb(err);
    else if (!queueManager)
      cb(new Error('Expected an instance of QueueManager'));
    else {
      queueManager.queue.exists('test_queue', (err, reply) => {
        if (err) cb(err);
        else if (!reply) {
          // Creating a queue (a LIFO queue)
          queueManager.queue.save(
            'test_queue',
            EQueueType.LIFO_QUEUE,
            (err) => {
              if (err) cb(err);
              else queueManager.quit(cb);
            },
          );
        } else cb();
      });
    }
  });
};

const produce = (cb: ICallback<TProduceMessageReply>): void => {
  const producer = new Producer(config);
  producer.run((err) => {
    if (err) cb(err);
    else {
      const msg = new Message();
      msg
        .setBody({ ts: `Current time is ${Date.now()}` })
        .setQueue('test_queue');
      producer.produce(msg, cb);
    }
  });
};

const consume = (cb: ICallback<void>): void => {
  const consumer = new Consumer(config);
  // starting the consumer and then registering a message handler
  consumer.run((err) => {
    if (err) cb(err);
    else
      consumer.consume(
        // Using the default namespace from the config
        // Same as { name: 'test_queue', ns: 'ns1' })
        'test_queue',
        (message, cb) => {
          /* eslint class-methods-use-this: 0 */
          //  console.log(`Got message to consume: `, JSON.stringify(message));
          //  throw new Error('TEST!');
          //  cb(new Error('TEST!'));
          //  const timeout = parseInt(Math.random() * 100);
          //  setTimeout(() => {
          //      cb();
          //  }, timeout);
          cb();
        },
        (err) => cb(err),
      );
  });

  // OR
  //
  // registering the message handler and then starting the consumer
  // consumer.consume(
  //   'test_queue',
  //   (message, cb) => cb(),
  //   (err) => {
  //     if (err) console.log(err);
  //     else consumer.run(cb);
  //   },
  // );
};

// For simplicity, we are using nested callbacks
createQueue((err) => {
  if (err) throw err;
  produce((err) => {
    if (err) throw err;
    consume((err) => {
      if (err) throw err;
    });
  });
});
