import {
  createQueue,
  defaultQueue,
  getConsumer,
  getProducer,
  getQueueManager,
  validateTime,
} from '../common';
import { delay } from 'bluebird';
import { Message } from '../../src/system/app/message/message';
import { events } from '../../src/system/common/events';

test('Rate limit a queue without priority and check message rate', async () => {
  await createQueue(defaultQueue, false);

  const qm = await getQueueManager();
  await qm.queueRateLimit.setAsync(defaultQueue, {
    limit: 3,
    interval: 10000,
  });

  const producer = await getProducer();
  await producer.produceAsync(
    new Message().setBody('msg 1').setQueue(defaultQueue),
  );
  await producer.produceAsync(
    new Message().setBody('msg 2').setQueue(defaultQueue),
  );
  await producer.produceAsync(
    new Message().setBody('msg 3').setQueue(defaultQueue),
  );
  await producer.produceAsync(
    new Message().setBody('msg 4').setQueue(defaultQueue),
  );
  await producer.produceAsync(
    new Message().setBody('msg 5').setQueue(defaultQueue),
  );
  await producer.produceAsync(
    new Message().setBody('msg 6').setQueue(defaultQueue),
  );

  const messages: { ts: number; msg: Message }[] = [];
  const consumer = await getConsumer();

  consumer.on(events.MESSAGE_ACKNOWLEDGED, (msg: Message) => {
    messages.push({ ts: Date.now(), msg });
  });

  await consumer.runAsync();
  await delay(25000);

  expect(messages.length).toBe(6);

  const diff1 = messages[1].ts - messages[0].ts;
  expect(validateTime(diff1, 0)).toBe(true);

  const diff2 = messages[2].ts - messages[1].ts;
  expect(validateTime(diff2, 0)).toBe(true);

  const diff3 = messages[3].ts - messages[2].ts;
  expect(validateTime(diff3, 10000)).toBe(true);

  const diff4 = messages[4].ts - messages[3].ts;
  expect(validateTime(diff4, 0)).toBe(true);

  const diff5 = messages[5].ts - messages[4].ts;
  expect(validateTime(diff5, 0)).toBe(true);
});
