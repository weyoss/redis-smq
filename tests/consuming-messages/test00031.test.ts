import {
  createQueue,
  defaultQueue,
  getConsumer,
  getProducer,
  getQueueManager,
  validateTime,
} from '../common';
import { delay } from 'bluebird';
import { Message } from '../../src/app/message/message';
import { events } from '../../src/common/events';

test('Set a rate limit for a queue and consume messages using many consumers', async () => {
  await createQueue(defaultQueue, false);

  const qm = await getQueueManager();
  await qm.queueRateLimit.setAsync(defaultQueue, {
    limit: 3,
    interval: 10000,
  });

  const messages: { ts: number; msg: Message }[] = [];
  for (let i = 0; i < 6; i += 1) {
    const consumer = await getConsumer();
    consumer.on(events.MESSAGE_ACKNOWLEDGED, (msg: Message) => {
      messages.push({ ts: Date.now(), msg });
    });
    await consumer.runAsync();
  }

  const producer = await getProducer();
  for (let i = 0; i < 100; i += 1) {
    await producer.produceAsync(
      new Message().setBody(`msg ${i}`).setQueue(defaultQueue),
    );
  }

  await delay(30000);
  expect(messages.length > 6).toBe(true);

  for (let i = 0; i < messages.length; i += 1) {
    if (i === 0) {
      continue;
    }
    const diff = messages[i].ts - messages[i - 1].ts;
    if (i % 3 === 0) {
      expect(validateTime(diff, 10000)).toBe(true);
    } else {
      expect(validateTime(diff, 1)).toBe(true);
    }
  }
});
