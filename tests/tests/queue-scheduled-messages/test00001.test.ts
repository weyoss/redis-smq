import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { getProducer } from '../../common/producer';
import { Message } from '../../../src/lib/message/message';
import { MessageState } from '../../../src/lib/message/message-state';
import { getQueueMessages } from '../../common/queue-messages';
import { getQueueScheduledMessages } from '../../common/queue-scheduled-messages';

test('Scheduled message', async () => {
  await createQueue(defaultQueue, false);
  const producer = getProducer();
  await producer.runAsync();

  const msg = new Message();
  msg
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue)
    .setScheduledRepeat(5)
    .setScheduledRepeatPeriod(5000);

  expect(msg.getMessageState()).toBe(null);
  expect(msg.getId()).toBe(null);

  await producer.produceAsync(msg);

  expect((msg.getMessageState() ?? {}) instanceof MessageState).toBe(true);
  expect(typeof msg.getId() === 'string').toBe(true);

  const queueScheduledMessages = await getQueueScheduledMessages();
  const count = await queueScheduledMessages.countMessagesAsync(defaultQueue);
  expect(count).toEqual(1);

  const messages = await queueScheduledMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(Object.keys(messages)).toEqual(['cursor', 'totalItems', 'items']);
  expect(messages.cursor).toBe(0);
  expect(messages.totalItems).toBe(1);
  expect(messages.items.length).toBe(1);
  expect(messages.items[0].getId()).toBe(msg.getRequiredId());

  const queueMessages = await getQueueMessages();
  const count1 = await queueMessages.countMessagesAsync(defaultQueue);
  expect(count1).toBe(1);

  const count2 = await queueMessages.countMessagesByStatusAsync(defaultQueue);
  expect(count2).toEqual({
    pending: 0,
    acknowledged: 0,
    deadLettered: 0,
    scheduled: 1,
  });
});
