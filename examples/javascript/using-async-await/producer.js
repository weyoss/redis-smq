const { Producer, Message } = require('../../..'); //  require('redis-smq')
const { promisifyAll } = require('bluebird');

const producer = promisifyAll(new Producer());

exports.produce = async function produce() {
  const msg = new Message();
  msg.setBody({ ts: `Current time is ${Date.now()}` }).setQueue('test_queue');
  await producer.produceAsync(msg);

  // Publishing another message
  const anotherMsg = new Message();
  anotherMsg
    .setBody({ ts: `Current time is ${Date.now()}` })

    // another_queue is a priority queue which has been created previously
    .setQueue('another_queue')

    // Message priority needs to set as we are publish a message to a priority queue
    // Otherwise the message will not be published and an error will be returned
    .setPriority(Message.MessagePriority.HIGH);
  await producer.produceAsync(anotherMsg);
};
