'use strict';

const config = require('./benchmark/config');
const { events } = require('../dist/src/system/common/events');
const { Consumer } = require('..');
const async = require('async');

const consumer = new Consumer(config);

consumer.consume(
  'test_queue', // using the default namespace
  false,
  (message, cb) => {
    cb();
  },
  () => void 0,
);

consumer.on(events.UP, () => {
  console.log('UP');
});

consumer.on(events.DOWN, () => {
  console.log('DOWN');
});

consumer.on(events.GOING_UP, () => {
  console.log('GOING UP');
});

consumer.on(events.GOING_DOWN, () => {
  console.log('GOING DOWN');
});

async.waterfall(
  [
    (cb) => consumer.run(cb),
    (cb) => consumer.shutdown(cb),
    (cb) => consumer.run(cb),
    (cb) => consumer.shutdown(cb),
    (cb) => consumer.run(cb),
    (cb) => consumer.shutdown(cb),
    (cb) => consumer.run(cb),
    (cb) => consumer.shutdown(cb),
  ],
  (err) => {
    if (err) console.log(err);
    else console.log('done!');
  },
);
