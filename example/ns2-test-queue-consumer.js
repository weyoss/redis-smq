'use strict';

const config = require('./config');
const { Consumer } = require('../'); // replace with require('redis-smq)

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

// Don't forget to set the queue name
Ns2TestQueueConsumer.queueName = 'test_queue';

//
const newConfig = { ...config };
newConfig.namespace = 'ns2';

const consumer = new Ns2TestQueueConsumer(newConfig, { messageConsumeTimeout: 2000 });
consumer.run();

/*
setTimeout(() => {
    consumer.stop();
}, 2000);
*/
