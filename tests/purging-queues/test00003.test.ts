import { getQueueManager, produceAndAcknowledgeMessage } from '../common';
import { promisifyAll } from 'bluebird';
import { redisKeys } from '../../src/system/common/redis-keys';

test('Purging acknowledged queue', async () => {
  const { producer } = await produceAndAcknowledgeMessage();
  const queueName = producer.getQueueName();
  const ns = redisKeys.getNamespace();

  const queueManager = promisifyAll(await getQueueManager());
  const m = await queueManager.getQueueMetricsAsync(ns, queueName);

  expect(m.acknowledged).toBe(1);

  await queueManager.purgeAcknowledgedMessagesQueueAsync(ns, queueName);

  const m2 = await queueManager.getQueueMetricsAsync(ns, queueName);
  expect(m2.acknowledged).toBe(0);
});
