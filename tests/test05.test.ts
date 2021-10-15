import { delay } from 'bluebird';
import { getConsumer, getProducer, untilConsumerIdle } from './common';
import { Message } from '../src/message';
import { events } from '../src/system/events';

test('Consumer message TTL: a message without TTL is not consumed and moved to DLQ when consumer messageTTL is exceeded', async () => {
  const producer = getProducer('test_queue');
  const consumer = getConsumer({
    queueName: 'test_queue',
    options: { messageTTL: 2000 },
  });
  const consume = jest.spyOn(consumer, 'consume');

  let messageDL = 0;
  consumer.on(events.MESSAGE_DEAD_LETTER, () => {
    messageDL += 1;
  });
  const msg = new Message();
  msg.setBody({ hello: 'world' });

  await producer.produceMessageAsync(msg);
  await delay(5000);
  consumer.run();

  await untilConsumerIdle(consumer);
  expect(consume).toHaveBeenCalledTimes(0);
  expect(messageDL).toBe(1);
});
