import { getQueueManager, produceAndAcknowledgeMessage } from '../common';
import { promisifyAll } from 'bluebird';

test('Purging acknowledged queue', async () => {
  const { producer } = await produceAndAcknowledgeMessage();

  const queueManager = promisifyAll(await getQueueManager());
  const m = await queueManager.getQueueMetricsAsync(producer.getQueueName());

  expect(m.acknowledged).toBe(1);

  await queueManager.purgeAcknowledgedMessagesQueueAsync(
    producer.getQueueName(),
  );

  const m2 = await queueManager.getQueueMetricsAsync(producer.getQueueName());
  expect(m2.acknowledged).toBe(0);
});
