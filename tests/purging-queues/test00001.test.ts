import { getProducer, getQueueManager } from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Purging pending queue', async () => {
  const producer = getProducer();

  const queueManager = promisifyAll(await getQueueManager());

  const m = await queueManager.getQueueMetricsAsync(producer.getQueueName());
  expect(m.pending).toBe(0);

  const msg = new Message();
  msg.setBody({ hello: 'world' });
  await producer.produceMessageAsync(msg);

  const m2 = await queueManager.getQueueMetricsAsync(producer.getQueueName());
  expect(m2.pending).toBe(1);

  await queueManager.purgeQueueAsync(producer.getQueueName());

  const m3 = await queueManager.getQueueMetricsAsync(producer.getQueueName());
  expect(m3.pending).toBe(0);
});
