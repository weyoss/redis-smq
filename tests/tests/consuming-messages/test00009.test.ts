import { Message } from '../../../src/lib/message/message';
import { events } from '../../../src/common/events/events';
import { delay } from 'bluebird';
import { getMessageManager } from '../../common/message-manager';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';

test('A message is dead-lettered when messageRetryThreshold is exceeded', async () => {
  await createQueue(defaultQueue, false);
  const producer = getProducer();
  await producer.runAsync();

  const consumer = getConsumer({
    messageHandler: jest.fn(() => {
      throw new Error('Explicit error');
    }),
  });

  let unacknowledged = 0;
  consumer.on(events.MESSAGE_UNACKNOWLEDGED, () => {
    unacknowledged += 1;
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  await producer.produceAsync(msg);
  consumer.run();

  await delay(30000);
  expect(unacknowledged).toBe(3);
  const messageManager = await getMessageManager();
  const list = await messageManager.deadLetteredMessages.listAsync(
    defaultQueue,
    0,
    100,
  );
  expect(list.total).toBe(1);
  expect(list.items[0].message.getId()).toBe(msg.getRequiredId());
});
