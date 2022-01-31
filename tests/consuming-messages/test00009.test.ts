import {
  defaultQueue,
  getConsumer,
  getMessageManager,
  getProducer,
} from '../common';
import { Message } from '../../src/message';
import { events } from '../../src/system/common/events';
import { delay, promisifyAll } from 'bluebird';

test('A message is dead-lettered when messageRetryThreshold is exceeded', async () => {
  const producer = getProducer();
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

  const m = promisifyAll(await getMessageManager());
  const list = await m.getDeadLetteredMessagesAsync(defaultQueue, 0, 100);
  expect(list.total).toBe(1);
  expect(list.items[0].message.getId()).toBe(msg.getRequiredId());
});
