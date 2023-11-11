import {
  createQueue,
  defaultQueue,
  produceMessageWithPriority,
} from '../../common/message-producing-consuming';
import { getQueueMessages } from '../../common/queue-messages';
import { getQueuePendingMessages } from '../../common/queue-pending-messages';

test('Purging priority queue', async () => {
  await createQueue(defaultQueue, true);
  const { queue } = await produceMessageWithPriority();
  const queueMessages = await getQueueMessages();

  const m2 = await queueMessages.countMessagesByStatusAsync(queue);
  expect(m2.pending).toBe(1);

  const pm = await getQueuePendingMessages();
  await pm.purgeAsync(queue);

  const m3 = await queueMessages.countMessagesByStatusAsync(queue);
  expect(m3.pending).toBe(0);
});
