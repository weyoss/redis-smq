'use strict';

const config = require('./config');
const { Consumer } = require('../..'); // require('redis-smq);

class MyConsumer extends Consumer {
  consume(message, cb) {
    cb();
  }
}

const consumer = new MyConsumer('test_queue', config);
consumer.run();
