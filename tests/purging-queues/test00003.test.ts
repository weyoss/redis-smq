import {
  getConsumer,
  getProducer,
  getQueueManager,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Purging acknowledged queue', async () => {
  const producer = getProducer();
  const consumer = getConsumer({
    consumeMock: jest.fn((msg, cb) => {
      cb();
    }),
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' });
  await producer.produceMessageAsync(msg);

  consumer.run();
  await untilConsumerIdle(consumer);

  const queueManager = promisifyAll(await getQueueManager());
  const m = await queueManager.getQueueMetricsAsync(producer.getQueueName());

  expect(m.acknowledged).toBe(1);

  await queueManager.purgeAcknowledgedMessagesQueueAsync(
    producer.getQueueName(),
  );

  const m2 = await queueManager.getQueueMetricsAsync(producer.getQueueName());
  expect(m2.acknowledged).toBe(0);
});
