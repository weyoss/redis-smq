'use strict';

const config = require('./config');
const { Consumer } = require('../../index'); // replace with const { Consumer } = require('redis-smq);

class Ns1TestQueueConsumer extends Consumer {
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

// Don't forget to set the queue name
Ns1TestQueueConsumer.queueName = 'test_queue';

const consumer = new Ns1TestQueueConsumer(config, { messageConsumeTimeout: 2000 });
consumer.run();

/*
setTimeout(() => {
    console.log('stopping');
    consumer.shutdown();
}, 5000);

setTimeout(() => {
    console.log('starting');
    consumer.run();
}, 30000);
*/
