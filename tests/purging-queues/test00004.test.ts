import {
  getConsumer,
  getProducer,
  getQueueManager,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Purging dead letter queue', async () => {
  const producer = getProducer();
  const consumer = getConsumer({
    consumeMock: jest.fn(() => {
      throw new Error();
    }),
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' });
  await producer.produceMessageAsync(msg);

  consumer.run();
  await untilConsumerIdle(consumer);

  const queueManager = promisifyAll(await getQueueManager());
  const m = await queueManager.getQueueMetricsAsync(producer.getQueueName());

  expect(m.deadLettered).toBe(1);

  await queueManager.purgeDeadLetterQueueAsync(producer.getQueueName());

  const m2 = await queueManager.getQueueMetricsAsync(producer.getQueueName());
  expect(m2.deadLettered).toBe(0);
});
