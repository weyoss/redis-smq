import {
  getConsumer,
  getProducer,
  getQueueManager,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';
import { redisKeys } from '../../src/system/common/redis-keys';

test('Purging dead letter queue', async () => {
  const producer = getProducer();
  const queueName = producer.getQueueName();
  const ns = redisKeys.getNamespace();
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
  const m = await queueManager.getQueueMetricsAsync(queueName, ns);

  expect(m.deadLettered).toBe(1);

  await queueManager.purgeDeadLetterQueueAsync(queueName, ns);

  const m2 = await queueManager.getQueueMetricsAsync(queueName, ns);
  expect(m2.deadLettered).toBe(0);
});
