import {
  getQueueManagerFrontend,
  produceAndAcknowledgeMessage,
} from '../common';
import { promisifyAll } from 'bluebird';

test('Purging acknowledged queue', async () => {
  const { producer } = await produceAndAcknowledgeMessage();
  const { ns, name } = producer.getQueue();

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const m = await queueManager.getQueueMetricsAsync(name, ns);

  expect(m.acknowledged).toBe(1);

  await queueManager.purgeAcknowledgedMessagesQueueAsync(name, ns);

  const m2 = await queueManager.getQueueMetricsAsync(name, ns);
  expect(m2.acknowledged).toBe(0);
});
