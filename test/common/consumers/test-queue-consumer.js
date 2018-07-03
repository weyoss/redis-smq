'use strict';

const redisSMQ = require('./../../../index');

const Consumer = redisSMQ.Consumer;

class TestQueueConsumer extends Consumer {
    /**
     *
     * @param message
     * @param cb
     */
    consume(message, cb) {
        cb();
    }
}

TestQueueConsumer.queueName = 'test_queue';

module.exports = TestQueueConsumer;
