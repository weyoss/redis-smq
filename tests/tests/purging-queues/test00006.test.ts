import {
  createQueue,
  defaultQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming';
import { shutDownBaseInstance } from '../../common/base-instance';
import { getQueueMessages } from '../../common/queue-messages';
import { getQueue } from '../../common/queue';
import { QueueNotEmptyError } from '../../../src/lib/queue/errors';
import { QueueHasRunningConsumersError } from '../../../src/lib/queue/errors';
import { QueueNotFoundError } from '../../../src/lib/queue/errors';

test('Deleting a message queue with all of its data', async () => {
  await createQueue(defaultQueue, false);
  const { consumer, queue } = await produceAndAcknowledgeMessage();

  const queueMessages = await getQueueMessages();

  const m = await queueMessages.countMessagesByStatusAsync(defaultQueue);
  expect(m.acknowledged).toBe(1);

  const q = await getQueue();

  await expect(q.deleteAsync(queue)).rejects.toThrow(QueueNotEmptyError);

  await queueMessages.purgeAsync(defaultQueue);

  await expect(q.deleteAsync(queue)).rejects.toThrow(
    QueueHasRunningConsumersError,
  );

  await shutDownBaseInstance(consumer);
  await q.deleteAsync(queue);

  await expect(queueMessages.countMessagesByStatusAsync(queue)).rejects.toThrow(
    QueueNotFoundError,
  );

  await expect(q.deleteAsync(queue)).rejects.toThrow(QueueNotFoundError);
});
