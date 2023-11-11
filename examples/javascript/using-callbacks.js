const { logger } = require('redis-smq-common');
const { RedisClientName } = require('redis-smq-common/dist/types');
const {
  Consumer,
  Producer,
  Message,
  Queue,
  Configuration,
  disconnect,
  EQueuePropertyQueueType,
} = require('../../index');

const config = {
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

Configuration.getSetConfig(config);

// Setting up a custom logger
// This step should be also done from your application bootstrap
logger.setLogger(console);

const queue = new Queue(config);

const createQueue = (cb) => {
  // Before producing and consuming message to/from a given queue, we need to make sure that such queue exists
  queue.exists('test_queue', (err, reply) => {
    if (err) cb(err);
    else if (!reply) {
      // Creating a queue (a LIFO queue)
      queue.save('test_queue', EQueuePropertyQueueType.LIFO_QUEUE, (err) => {
        if (err) cb(err);
        else disconnect(cb);
      });
    } else cb();
  });
};

const produce = (cb) => {
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

const consume = (cb) => {
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
