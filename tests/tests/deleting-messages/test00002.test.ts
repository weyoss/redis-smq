import {
  createQueue,
  defaultQueue,
  produceMessageWithPriority,
} from '../../common/message-producing-consuming';
import { getQueuePendingMessages } from '../../common/queue-pending-messages';
import { getQueueMessages } from '../../common/queue-messages';

test('Combined test: Delete a pending message with priority. Check pending message. Check queue metrics.', async () => {
  await createQueue(defaultQueue, true);
  const { message, queue } = await produceMessageWithPriority();
  const pendingMessages = await getQueuePendingMessages();
  const res1 = await pendingMessages.getMessagesAsync(queue, 0, 100);

  expect(res1.totalItems).toBe(1);
  expect(res1.items[0].getId()).toBe(message.getRequiredId());

  const queueMessages = await getQueueMessages();
  const count = await queueMessages.countMessagesByStatusAsync(queue);
  expect(count.pending).toBe(1);

  await pendingMessages.deleteMessageAsync(queue, message.getRequiredId());
  const res2 = await pendingMessages.getMessagesAsync(queue, 0, 100);
  expect(res2.totalItems).toBe(0);
  expect(res2.items.length).toBe(0);

  const count2 = await queueMessages.countMessagesByStatusAsync(queue);
  expect(count2.pending).toBe(0);
});
