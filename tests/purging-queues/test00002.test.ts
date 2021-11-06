import { getProducer, getQueueManager } from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';
import { config } from '../config';
import { redisKeys } from '../../src/system/common/redis-keys';

test('Purging priority queue', async () => {
  const producer = getProducer('test_queue', {
    ...config,
    priorityQueue: true,
  });
  const queueName = producer.getQueueName();
  const ns = redisKeys.getNamespace();

  const queueManager = promisifyAll(await getQueueManager());

  const m = await queueManager.getQueueMetricsAsync(ns, queueName);
  expect(m.pendingWithPriority).toBe(0);

  const msg = new Message();
  msg.setBody({ hello: 'world' });
  await producer.produceMessageAsync(msg);

  const m2 = await queueManager.getQueueMetricsAsync(ns, queueName);
  expect(m2.pendingWithPriority).toBe(1);

  await queueManager.purgePriorityQueueAsync(ns, queueName);

  const m3 = await queueManager.getQueueMetricsAsync(ns, queueName);
  expect(m3.pendingWithPriority).toBe(0);
});
