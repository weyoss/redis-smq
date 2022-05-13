const { Producer, Message } = require('../../..'); //  require('redis-smq')
const { promisifyAll } = require('bluebird');

const producer = promisifyAll(new Producer());

exports.produce = async function produce() {
  const msg = new Message();
  msg.setBody({ ts: `Current time is ${Date.now()}` }).setQueue('test_queue');
  await producer.produceAsync(msg);
};
