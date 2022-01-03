import { getProducer, getQueueManagerFrontend } from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Purging priority queue', async () => {
  const producer = getProducer('test_queue');
  const queue = producer.getQueue();

  const queueManager = promisifyAll(await getQueueManagerFrontend());

  const m = await queueManager.getQueueMetricsAsync(queue);
  expect(m.pendingWithPriority).toBe(0);

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setPriority(Message.MessagePriority.NORMAL);
  await producer.produceAsync(msg);

  const m2 = await queueManager.getQueueMetricsAsync(queue);
  expect(m2.pendingWithPriority).toBe(1);

  await queueManager.purgePriorityQueueAsync(queue);

  const m3 = await queueManager.getQueueMetricsAsync(queue);
  expect(m3.pendingWithPriority).toBe(0);
});
