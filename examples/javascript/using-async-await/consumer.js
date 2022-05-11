const { Consumer } = require('../../..');
const { promisifyAll } = require('bluebird');

const consumer = promisifyAll(new Consumer());

exports.consume = async function consume() {
  // As the consumer is not running, the message handler does not run immediately
  // At this time the message handler is just registered
  const r1 = await consumer.consumeAsync(
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
  console.log(`Is running? ${r1}`); // false

  // running the consumer
  await consumer.runAsync();

  // At this time the message handler is expected to be running
  const r2 = await consumer.consumeAsync('another_queue', (message, cb) => {
    cb();
  });
  console.log(`Is running? ${r2}`); // true
};
