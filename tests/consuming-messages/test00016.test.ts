import { promisifyAll } from 'bluebird';
import { Message } from '../../src/system/message';
import { getProducer, untilMessageAcknowledged } from '../common';
import { Consumer } from '../../src/consumer';
import { config } from '../config';

test('Multi queue consumer: case 1', async () => {
  const consumer = promisifyAll(new Consumer(config));
  await consumer.consumeAsync('test_queue', false, (msg, cb) => {
    cb();
  });
  await consumer.consumeAsync('another_queue', false, (msg, cb) => {
    cb();
  });
  await consumer.runAsync();

  const producer = getProducer();
  const msg1 = new Message().setQueue('test_queue').setBody('some data');
  setTimeout(() => {
    producer.produceAsync(msg1);
  }, 1000);
  await untilMessageAcknowledged(consumer, msg1);

  const msg2 = new Message().setQueue('another_queue').setBody('some data');
  setTimeout(() => {
    producer.produceAsync(msg2);
  }, 1000);
  await untilMessageAcknowledged(consumer, msg2);

  await consumer.shutdownAsync();
});
