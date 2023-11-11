import { Message } from '../../../src/lib/message/message';
import { untilMessageAcknowledged } from '../../common/events';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import { defaultQueue } from '../../common/message-producing-consuming';
import { EQueueType } from '../../../types';
import { getQueue } from '../../common/queue';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages';
import { getQueueMessages } from '../../common/queue-messages';
import { getQueuePendingMessages } from '../../common/queue-pending-messages';

test('Combined test. Requeue a priority message from acknowledged queue. Check queue metrics.', async () => {
  const queue = await getQueue();
  await queue.saveAsync(defaultQueue, EQueueType.PRIORITY_QUEUE);

  const consumer = getConsumer({
    queue: defaultQueue,
    messageHandler: jest.fn((msg, cb) => {
      setTimeout(cb, 5000);
    }),
  });

  const message = new Message();
  message
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue)
    .setPriority(Message.MessagePriority.ABOVE_NORMAL);

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(message);

  consumer.run();
  await untilMessageAcknowledged(consumer);

  const acknowledgedMessages = await getQueueAcknowledgedMessages();
  const res2 = await acknowledgedMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res2.totalItems).toBe(1);
  expect(res2.items.length).toBe(1);

  const queueMessages = await getQueueMessages();
  const count = await queueMessages.countMessagesByStatusAsync(defaultQueue);
  expect(count.pending).toBe(0);
  expect(count.acknowledged).toBe(1);

  await acknowledgedMessages.requeueMessageAsync(
    defaultQueue,
    message.getRequiredId(),
  );

  const count2 = await queueMessages.countMessagesByStatusAsync(defaultQueue);
  expect(count2.pending).toBe(1);
  expect(count2.acknowledged).toBe(0);

  const res6 = await acknowledgedMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res6.totalItems).toBe(0);
  expect(res6.items.length).toBe(0);

  const pendingMessages = await getQueuePendingMessages();
  const res7 = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res7.totalItems).toBe(1);
  expect(res7.items.length).toBe(1);
  expect(res7.items[0].getId()).toEqual(message.getRequiredId());

  await expect(
    async () =>
      await acknowledgedMessages.requeueMessageAsync(
        defaultQueue,
        message.getRequiredId(),
      ),
  ).not.toThrow();
});
