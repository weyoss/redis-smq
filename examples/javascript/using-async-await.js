const { promisifyAll, promisify } = require('bluebird');
const { logger, RedisClientName } = require('redis-smq-common');
const {
  Consumer,
  Producer,
  Message,
  Queue,
  EQueueType,
  Configuration,
  disconnect,
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

const queue = promisifyAll(new Queue(config));
const producer = promisifyAll(new Producer(config));
const consumer = promisifyAll(new Consumer(config));

const createQueue = async () => {
  // Before producing and consuming message to/from a given queue, we need to make sure that such queue exists
  const exists = await queue.existsAsync('test_queue');
  if (!exists) {
    // Creating a queue (a LIFO queue)
    await queue.saveAsync('test_queue', EQueueType.LIFO_QUEUE);
    await promisify(disconnect)();
  }
};

const produce = async () => {
  await producer.runAsync();
  const msg = new Message();
  msg.setBody({ ts: `Current time is ${Date.now()}` }).setQueue('test_queue');
  await producer.produceAsync(msg);
};

const consume = async () => {
  // starting the consumer and then registering a message handler
  await consumer.consumeAsync(
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
  );

  // Starting the consumer.
  // The consumer can also be started before registering message handlers (before calling consumer.consumeAsync())
  await consumer.runAsync();
};

async function main() {
  await createQueue();
  await produce();
  await consume();
}

main().catch((err) => console.log(err));
