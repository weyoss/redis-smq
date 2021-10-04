import { delay } from 'bluebird';
import { getConsumer, getProducer, untilConsumerIdle } from './common';
import { Message } from '../src/message';
import { events } from '../src/events';

test('Construct a consumer with messageTTL parameter and make sure it does not consume a message which has been in the queue longer than messageTTL', async () => {
  const producer = getProducer('test_queue');
  const consumer = getConsumer({
    queueName: 'test_queue',
    options: { messageTTL: 2000 },
  });
  const consume = jest.spyOn(consumer, 'consume');

  let messageDestroyed = 0;
  consumer.on(events.GC_MC_MESSAGE_DESTROYED, () => {
    messageDestroyed += 1;
  });
  const msg = new Message();
  msg.setBody({ hello: 'world' });

  await producer.produceMessageAsync(msg);
  await delay(5000);
  consumer.run();

  await untilConsumerIdle(consumer);
  expect(consume).toHaveBeenCalledTimes(0);
  expect(messageDestroyed).toBe(1);
});
