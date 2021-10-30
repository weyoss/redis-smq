'use strict';

const config = require('./config');
const { BaseConsumer } = require('../..'); // require('redis-smq);

class MyConsumer extends BaseConsumer {
  consume(message, cb) {
    cb();
  }
}

const consumer = new MyConsumer('test_queue', config);
consumer.run();
