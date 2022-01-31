import {
  defaultQueue,
  getMessageManager,
  getProducer,
  startScheduleWorker,
  validateTime,
} from '../common';
import { Message } from '../../src/message';
import { delay, promisifyAll } from 'bluebird';

test('Schedule a message: combine CRON, REPEAT, REPEAT PERIOD, DELAY', async () => {
  const msg = new Message();
  msg.setScheduledCron('*/20 * * * * *'); // Schedule message for each 20 seconds
  msg.setScheduledRepeat(2); // repeat 2 times
  msg.setScheduledPeriod(5000); // 5 secs between each repeat
  msg.setScheduledDelay(15000); // this will first delay the message for 15 secs before cron/repeat scheduling
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  const producer = getProducer();
  await producer.produceAsync(msg);
  const producedAt = Date.now();

  await startScheduleWorker();
  await delay(60000);

  const m = promisifyAll(await getMessageManager());
  const r = await m.getPendingMessagesAsync(defaultQueue, 0, 99);
  expect(r.items.length > 4).toBe(true);

  for (let i = 0; i < r.items.length; i += 1) {
    if (i === 0) {
      // verify that the message was first delayed
      const diff = (r.items[i].message.getPublishedAt() ?? 0) - producedAt;
      expect(validateTime(diff, 15000)).toBe(true);
      continue;
    }

    if (i === 1) {
      // we can't predict the diff
      // considering that the first message was delayed
      continue;
    }

    const diff =
      (r.items[i].message.getPublishedAt() ?? 0) -
      (r.items[1].message.getPublishedAt() ?? 0);

    if (i === 2) {
      expect(validateTime(diff, 5000)).toBe(true);
    } else if (i === 3) {
      expect(validateTime(diff, 10000)).toBe(true);
    } else if (i === 4) {
      expect(validateTime(diff, 20000)).toBe(true);
    } else if (i === 5) {
      expect(validateTime(diff, 25000)).toBe(true);
    } else if (i === 6) {
      expect(validateTime(diff, 30000)).toBe(true);
    } else if (i === 7) {
      expect(validateTime(diff, 40000)).toBe(true);
    }
  }
});
