import {
  createQueue,
  defaultQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming';
import { shutDownBaseInstance } from '../../common/base-instance';
import { getQueueMessages } from '../../common/queue-messages';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages';

test('Purging acknowledged queue', async () => {
  await createQueue(defaultQueue, false);
  const { queue, consumer } = await produceAndAcknowledgeMessage();
  await shutDownBaseInstance(consumer);

  const queueMessages = await getQueueMessages();
  const m = await queueMessages.countMessagesByStatusAsync(queue);
  expect(m.acknowledged).toBe(1);

  const am = await getQueueAcknowledgedMessages();
  await am.purgeAsync(queue);

  const m1 = await queueMessages.countMessagesByStatusAsync(queue);
  expect(m1.acknowledged).toBe(0);
});
