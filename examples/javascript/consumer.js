'use strict';

const config = require('./config');
const { Consumer } = require('../..'); // require('redis-smq);

const consumer = new Consumer(config);

consumer.consume(
  'test_queue', // using the default namespace
  false,
  (message, cb) => {
    /* eslint class-methods-use-this: 0 */
    //  console.log(`Got message to consume: `, JSON.stringify(message));
    //  throw new Error('TEST!');
    //  cb(new Error('TEST!'));
    //  const timeout = parseInt(Math.random() * 100);
    //  setTimeout(() => {
    //      cb();
    //  }, timeout);
    cb();
  },
  (err, isRunning) => {
    if (err) console.log(err);
    else {
      // As the consumer is not running, consuming messages does not start immediately
      // At this time the message handler is just registered
      console.log(`Is running? ${isRunning}`); // false
    }
  },
);

consumer.run((err) => {
  if (err) console.log(err);
  else {
    consumer.consume(
      {
        name: 'another_queue',
        ns: 'ns2',
      },
      true,
      (message, cb) => {
        /* eslint class-methods-use-this: 0 */
        //  console.log(`Got message to consume: `, JSON.stringify(message));
        //  throw new Error('TEST!');
        //  cb(new Error('TEST!'));
        //  const timeout = parseInt(Math.random() * 100);
        //  setTimeout(() => {
        //      cb();
        //  }, timeout);
        cb();
      },
      (err, isRunning) => {
        // At this time the message handler is expected to be running
        console.log(`Is running? ${isRunning}`); // true
      },
    );
  }
});

/*
consumer.run(function () {
  console.log(
    `Consuming messages from ${consumer
      .getQueues()
      .map((i) => `${i.name}@${i.ns}`)
      .join(', ')} ...`,
  );
});
 */
