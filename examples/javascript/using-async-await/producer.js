const { Producer, Message } = require('../../..'); //  require('redis-smq')
const { promisifyAll } = require('bluebird');
const config = require('./config');

const producer = promisifyAll(new Producer(config));

exports.produce = async function produce() {
  const msg = new Message();
  msg.setBody({ ts: `Current time is ${Date.now()}` }).setQueue('test_queue');
  await producer.produceAsync(msg);
};
