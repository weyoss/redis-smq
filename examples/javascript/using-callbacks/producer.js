const { Producer, Message } = require('../../..'); // require('redis-smq')
const config = require('./config');

const producer = new Producer(config);

exports.produce = function produce(cb) {
  const msg = new Message();
  msg.setBody({ ts: `Current time is ${Date.now()}` }).setQueue('test_queue');
  producer.produce(msg, cb);
};
