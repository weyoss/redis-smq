import { delay, promisifyAll } from 'bluebird';
import {
  getConsumer,
  getMessageManager,
  getProducer,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../src/message';
import { events } from '../../src/system/common/events';

test('Message TTL: a message with TTL is not consumed and moved to DLQ when TTL is exceeded', async () => {
  const producer = getProducer();
  const consumer = getConsumer();
  const consume = jest.spyOn(consumer, 'consume');

  let unacknowledged = 0;
  consumer.on(events.MESSAGE_UNACKNOWLEDGED, () => {
    unacknowledged += 1;
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setTTL(3000);

  await producer.produceMessageAsync(msg);
  await delay(5000);
  consumer.run();

  await untilConsumerIdle(consumer);
  expect(consume).toHaveBeenCalledTimes(0);
  expect(unacknowledged).toBe(1);

  const messageManager = promisifyAll(await getMessageManager());
  const list = await messageManager.getDeadLetterMessagesAsync(
    consumer.getQueueName(),
    0,
    100,
  );
  expect(list.total).toBe(1);
  expect(list.items[0].getId()).toBe(msg.getId());
});
