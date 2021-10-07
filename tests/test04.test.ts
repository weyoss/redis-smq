import { delay } from 'bluebird';
import { getConsumer, getProducer, untilConsumerIdle } from './common';
import { Message } from '../src/message';
import { events } from '../src/events';

test('Produce a message having messageTTL and sure the message is not consumed and destroyed when messageTTL exceeds', async () => {
  const producer = getProducer();
  const consumer = getConsumer();
  const consume = jest.spyOn(consumer, 'consume');

  let messageDestroyed = 0;
  consumer.on(events.MESSAGE_DESTROYED, () => {
    messageDestroyed += 1;
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setTTL(3000);

  await producer.produceMessageAsync(msg);
  await delay(5000);
  consumer.run();

  await untilConsumerIdle(consumer);
  expect(consume).toHaveBeenCalledTimes(0);
  expect(messageDestroyed).toBe(1);
});
