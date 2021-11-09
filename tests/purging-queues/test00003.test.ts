import {
  getQueueManagerFrontend,
  produceAndAcknowledgeMessage,
} from '../common';
import { promisifyAll } from 'bluebird';
import { redisKeys } from '../../src/system/common/redis-keys';

test('Purging acknowledged queue', async () => {
  const { producer } = await produceAndAcknowledgeMessage();
  const queueName = producer.getQueueName();
  const ns = redisKeys.getNamespace();

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const m = await queueManager.getQueueMetricsAsync(queueName, ns);

  expect(m.acknowledged).toBe(1);

  await queueManager.purgeAcknowledgedMessagesQueueAsync(queueName, ns);

  const m2 = await queueManager.getQueueMetricsAsync(queueName, ns);
  expect(m2.acknowledged).toBe(0);
});
