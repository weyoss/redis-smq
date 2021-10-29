import { delay, promisifyAll } from 'bluebird';
import {
  getConsumer,
  getMessageManager,
  getProducer,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../src/message';
import { events } from '../../src/system/events';
import { config } from '../config';

test('Default message TTL: a message without TTL is not consumed and moved to DLQ when default messageTTL is exceeded', async () => {
  const producer = getProducer('test_queue');
  const consumer = getConsumer({
    queueName: 'test_queue',
    cfg: {
      ...config,
      message: {
        ttl: 2000,
      },
    },
  });
  const consume = jest.spyOn(consumer, 'consume');

  let unacks = 0;
  consumer.on(events.MESSAGE_UNACKNOWLEDGED, () => {
    unacks += 1;
  });
  const msg = new Message();
  msg.setBody({ hello: 'world' });

  await producer.produceMessageAsync(msg);
  await delay(5000);
  consumer.run();

  await untilConsumerIdle(consumer);
  expect(consume).toHaveBeenCalledTimes(0);
  expect(unacks).toBe(1);

  const m = promisifyAll(await getMessageManager());
  const list = await m.getDeadLetterMessagesAsync(
    producer.getQueueName(),
    0,
    100,
  );
  expect(list.total).toBe(1);
  expect(list.items[0].getId()).toBe(msg.getId());
});
