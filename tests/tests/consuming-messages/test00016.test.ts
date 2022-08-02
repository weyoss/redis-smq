import { promisifyAll } from 'bluebird';
import { Message } from '../../../src/lib/message/message';
import { Consumer } from '../../../src/lib/consumer/consumer';
import { config } from '../../common/config';
import { untilMessageAcknowledged } from '../../common/events';
import { getProducer } from '../../common/producer';
import { createQueue } from '../../common/message-producing-consuming';

test('Consume messages from different queues using a single consumer instance: case 2', async () => {
  await createQueue('test_queue', false);
  await createQueue('another_queue', false);

  const consumer = promisifyAll(new Consumer(config));
  await consumer.consumeAsync('test_queue', (msg, cb) => {
    cb();
  });
  await consumer.consumeAsync('another_queue', (msg, cb) => {
    cb();
  });
  await consumer.runAsync();

  const producer = getProducer();
  await producer.runAsync();

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
