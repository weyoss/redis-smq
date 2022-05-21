import {
  createQueue,
  defaultQueue,
  getMessageManager,
  getProducer,
  startScheduleWorker,
  validateTime,
} from '../common';
import { Message } from '../..';
import { delay } from 'bluebird';

test('Schedule a message: combine CRON, REPEAT, REPEAT PERIOD', async () => {
  await createQueue(defaultQueue, false);

  const msg = new Message();
  msg.setScheduledCRON('*/20 * * * * *'); // Schedule message for each 30 seconds
  msg.setScheduledRepeat(2); // repeat 2 times
  msg.setScheduledRepeatPeriod(5000); // 5 secs between each repeat
  msg.setQueue(defaultQueue);
  const producer = getProducer();
  await producer.produceAsync(msg);

  await startScheduleWorker();
  await delay(60000);

  const messageManager = await getMessageManager();
  const r = await messageManager.pendingMessages.listAsync(defaultQueue, 0, 99);
  expect(r.items.length > 5).toBe(true);

  for (let i = 0; i < r.items.length; i += 1) {
    const diff =
      (r.items[i].message.getPublishedAt() ?? 0) -
      (r.items[0].message.getPublishedAt() ?? 0);
    if (i === 0) {
      expect(validateTime(diff, 0)).toBe(true);
    } else if (i === 1) {
      expect(validateTime(diff, 5000)).toBe(true); // first repeat
    } else if (i === 2) {
      expect(validateTime(diff, 10000)).toBe(true); // second repeat
    } else if (i === 3) {
      expect(validateTime(diff, 20000)).toBe(true); // cron
    } else if (i === 4) {
      expect(validateTime(diff, 25000)).toBe(true); // first repeat
    } else if (i === 5) {
      expect(validateTime(diff, 30000)).toBe(true); // second repeat
    } else if (i === 6) {
      expect(validateTime(diff, 40000)).toBe(true); // con
    } else if (i === 7) {
      expect(validateTime(diff, 45000)).toBe(true); // first repeat
    } else if (i === 8) {
      expect(validateTime(diff, 50000)).toBe(true); // second repeat
    }
  }
});
