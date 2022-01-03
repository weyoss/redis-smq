'use strict';

const config = require('./config');
const { Producer, Message } = require('../..'); // require('redis-smq');

const producer = new Producer('test_queue', config);

function produceInfinitely(sequence, cb) {
  const message = new Message();
  message.setBody(`Payload sample ${sequence++}`);
  producer.produce(message, (err) => {
    if (err) cb(err);
    else produceInfinitely(sequence, cb);
  });
}

produceInfinitely(Date.now(), (err) => {
  if (err) throw err;
});
