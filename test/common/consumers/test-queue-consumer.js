'use strict';

const redisSMQ = require('./../../../index');
const Consumer = redisSMQ.Consumer;

class TestQueueConsumer extends Consumer {

    consume(message, cb) {
        cb();
    }
}

TestQueueConsumer.queueName = 'test_queue';

module.exports = TestQueueConsumer;