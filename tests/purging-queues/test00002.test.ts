import { getProducer, getQueueManagerFrontend } from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';
import { config } from '../config';

test('Purging priority queue', async () => {
  const producer = getProducer('test_queue', {
    ...config,
    priorityQueue: true,
  });
  const { ns, name } = producer.getQueue();

  const queueManager = promisifyAll(await getQueueManagerFrontend());

  const m = await queueManager.getQueueMetricsAsync(name, ns);
  expect(m.pendingWithPriority).toBe(0);

  const msg = new Message();
  msg.setBody({ hello: 'world' });
  await producer.produceMessageAsync(msg);

  const m2 = await queueManager.getQueueMetricsAsync(name, ns);
  expect(m2.pendingWithPriority).toBe(1);

  await queueManager.purgePriorityQueueAsync(name, ns);

  const m3 = await queueManager.getQueueMetricsAsync(name, ns);
  expect(m3.pendingWithPriority).toBe(0);
});
