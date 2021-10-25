'use strict';

const config = require('./config');
const { Producer, Message } = require('../..'); // require('redis-smq');

const producer = new Producer('test_queue', config);

function produceInfinitely(payload, cb) {
  const message = new Message();
  message.setBody(payload);
  producer.produceMessage(message, (err) => {
    if (err) cb(err);
    else produceInfinitely(payload, cb);
  });
}

produceInfinitely({ hello: 'world' }, (err) => {
  if (err) throw err;
});
