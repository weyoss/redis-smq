import {
  defaultQueue,
  getConsumer,
  getProducer,
  getQueueManagerFrontend,
  validateTime,
} from '../common';
import { delay, promisifyAll } from 'bluebird';
import { Message } from '../../src/system/app/message/message';
import { events } from '../../src/system/common/events';

test('Set a rate limit for a queue and consume messages using many consumers', async () => {
  const qm = promisifyAll(await getQueueManagerFrontend());
  await qm.setQueueRateLimitAsync(defaultQueue, { limit: 3, interval: 10000 });

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

  await delay(25000);
  await expect(messages.length).toBe(9);

  for (let i = 0, j = 0; i < messages.length; i += 1, j += 1) {
    if (i === 0) {
      continue;
    }
    const diff = messages[i].ts - messages[i - 1].ts;
    if (j >= 3) {
      j = 0;
      expect(validateTime(diff, 10000)).toBe(true);
    } else {
      expect(validateTime(diff, 0)).toBe(true);
    }
  }
});
