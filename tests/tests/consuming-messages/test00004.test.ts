import { delay } from 'bluebird';
import { Message } from '../../../src/lib/message/message';
import { events } from '../../../src/common/events/events';
import { untilConsumerEvent } from '../../common/events';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { getQueueDeadLetteredMessages } from '../../common/queue-dead-lettered-messages';

test('A message is dead-lettered and not delivered when messageTTL is exceeded', async () => {
  await createQueue(defaultQueue, false);

  const producer = getProducer();
  await producer.runAsync();

  const consumer = getConsumer();
  const consume = jest.spyOn(consumer, 'consume');

  let unacknowledged = 0;
  consumer.on(events.MESSAGE_UNACKNOWLEDGED, () => {
    unacknowledged += 1;
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setTTL(3000).setQueue(defaultQueue);

  await producer.produceAsync(msg);
  await delay(5000);
  consumer.run();

  await untilConsumerEvent(consumer, events.MESSAGE_DEAD_LETTERED);
  expect(consume).toHaveBeenCalledTimes(0);
  expect(unacknowledged).toBe(1);
  const deadLetteredMessages = await getQueueDeadLetteredMessages();
  const list = await deadLetteredMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(list.totalItems).toBe(1);
  expect(list.items[0].getId()).toBe(msg.getRequiredId());
});
