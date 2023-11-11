import {
  createQueue,
  defaultQueue,
  produceMessage,
} from '../../common/message-producing-consuming';
import { getQueueMessages } from '../../common/queue-messages';
import { getQueuePendingMessages } from '../../common/queue-pending-messages';

test('Purging pending queue', async () => {
  await createQueue(defaultQueue, false);
  const { queue } = await produceMessage();
  const queueMessages = await getQueueMessages();

  const m2 = await queueMessages.countMessagesByStatusAsync(queue);
  expect(m2.pending).toBe(1);

  const pm = await getQueuePendingMessages();
  await pm.purgeAsync(queue);

  const m3 = await queueMessages.countMessagesByStatusAsync(queue);
  expect(m3.pending).toBe(0);
});
