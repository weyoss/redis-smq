import {
  getConsumer,
  getProducer,
  getQueueManagerFrontend,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Purging dead letter queue', async () => {
  const producer = getProducer();
  const { ns, name } = producer.getQueue();

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

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const m = await queueManager.getQueueMetricsAsync(name, ns);

  expect(m.deadLettered).toBe(1);

  await queueManager.purgeDeadLetterQueueAsync(name, ns);

  const m2 = await queueManager.getQueueMetricsAsync(name, ns);
  expect(m2.deadLettered).toBe(0);
});
