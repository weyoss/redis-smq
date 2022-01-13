import { getProducer, getQueueManagerFrontend } from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Purging pending queue', async () => {
  const producer = getProducer();
  const queue = producer.getQueue();

  const queueManager = promisifyAll(await getQueueManagerFrontend());

  const m = await queueManager.getQueueMetricsAsync(queue);
  expect(m.pending).toBe(0);

  const msg = new Message();
  msg.setBody({ hello: 'world' });
  await producer.produceAsync(msg);

  const m2 = await queueManager.getQueueMetricsAsync(queue);
  expect(m2.pending).toBe(1);

  await queueManager.purgePendingQueueAsync(queue);

  const m3 = await queueManager.getQueueMetricsAsync(queue);
  expect(m3.pending).toBe(0);
});
