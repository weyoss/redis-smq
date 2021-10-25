'use strict';

const config = require('./config');
const { Consumer } = require('../..'); // require('redis-smq);

class Ns2TestQueueConsumer extends Consumer {
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

//
const newConfig = { ...config, namespace: 'ns2' };
const consumer = new Ns2TestQueueConsumer('test_queue', newConfig);
consumer.run();
