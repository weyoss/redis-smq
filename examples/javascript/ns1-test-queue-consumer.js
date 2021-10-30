'use strict';

const config = require('./config');
const { BaseConsumer } = require('../..'); // require('redis-smq);

class Ns1TestQueueConsumer extends BaseConsumer {
  /**
   *
   * @param message
   * @param cb
   */
  consume(message, cb) {
    /* eslint class-methods-use-this: 0 */
    //  console.log(`Got message to consume: `, JSON.stringify(message));
    //  throw new Error('TEST!');
    //  cb(new Error('TEST!'));
    //  const timeout = parseInt(Math.random() * 100);
    //  setTimeout(() => {
    //      cb();
    //  }, timeout);
    cb();
  }
}

const queueName = 'test_queue';
const consumer = new Ns1TestQueueConsumer(queueName, config);
consumer.run(function () {
  console.log(`Consuming messages from ${queueName}...`);
});
