'use strict';

const config = require('./benchmark/config');
const { events } = require('../dist/src/system/common/events');
const { Consumer } = require('..');

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

const consumer = new Ns1TestQueueConsumer('test_queue', config);

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

console.log('start');
consumer.run(() => {
  console.log('a');
  consumer.shutdown(() => {
    console.log('b');
    consumer.run(() => {
      console.log('c');
      consumer.shutdown(() => {
        console.log('d');
        consumer.run(() => {
          console.log('e');
          consumer.shutdown(() => {
            console.log('f');
            console.log('Done.');
          });
        });
      });
    });
  });
});
