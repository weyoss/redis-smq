import { delay } from 'bluebird';
import { getConsumer, getProducer, untilConsumerIdle } from './common';
import { Message } from '../src/message';
import { events } from '../src/events';

test('Message TTL: a message with TTL is not consumed and moved to DLQ when TTL is exceeded', async () => {
  const producer = getProducer();
  const consumer = getConsumer();
  const consume = jest.spyOn(consumer, 'consume');

  let messageDL = 0;
  consumer.on(events.MESSAGE_DEAD_LETTER, () => {
    messageDL += 1;
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setTTL(3000);

  await producer.produceMessageAsync(msg);
  await delay(5000);
  consumer.run();

  await untilConsumerIdle(consumer);
  expect(consume).toHaveBeenCalledTimes(0);
  expect(messageDL).toBe(1);
});
