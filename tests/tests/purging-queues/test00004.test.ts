import {
  createQueue,
  defaultQueue,
  produceAndDeadLetterMessage,
} from '../../common/message-producing-consuming';
import { shutDownBaseInstance } from '../../common/base-instance';
import { getQueueMessages } from '../../common/queue-messages';

test('Purging dead letter queue', async () => {
  await createQueue(defaultQueue, false);
  const { queue, consumer } = await produceAndDeadLetterMessage();
  await shutDownBaseInstance(consumer);

  const queueMessages = await getQueueMessages();
  const m = await queueMessages.countMessagesByStatusAsync(queue);
  expect(m.deadLettered).toBe(1);

  await queueMessages.purgeAsync(queue);

  const m1 = await queueMessages.countMessagesByStatusAsync(queue);
  expect(m1.deadLettered).toBe(0);
});
