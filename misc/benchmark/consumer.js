'use strict';

const config = require('./config');
const { Consumer } = require('../..'); // require('redis-smq);

const consumer = new Consumer(config);

consumer.consume(
  'test_queue',
  false,
  (msg, cb) => cb(),
  () => void 0,
);

consumer.run();
