import { delay, promisifyAll } from 'bluebird';
import {
  defaultQueue,
  getConsumer,
  getMessageManager,
  getProducer,
  mockConfiguration,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../src/message';
import { events } from '../../src/system/common/events';

test('Default message TTL: a message without TTL is not consumed and moved to DLQ when default messageTTL is exceeded', async () => {
  mockConfiguration({
    message: {
      ttl: 2000,
    },
  });
  const producer = getProducer();
  const consumer = getConsumer();
  const consume = jest.spyOn(consumer, 'consume');

  let unacks = 0;
  consumer.on(events.MESSAGE_UNACKNOWLEDGED, () => {
    unacks += 1;
  });
  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  await producer.produceAsync(msg);
  await delay(5000);
  consumer.run();

  await untilConsumerIdle(consumer);
  expect(consume).toHaveBeenCalledTimes(0);
  expect(unacks).toBe(1);

  const m = promisifyAll(await getMessageManager());
  const list = await m.getDeadLetteredMessagesAsync(defaultQueue, 0, 100);
  expect(list.total).toBe(1);
  expect(list.items[0].message.getId()).toBe(msg.getRequiredId());
});
