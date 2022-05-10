import {
  createQueue,
  defaultQueue,
  getMessageManager,
  getProducer,
  startScheduleWorker,
  validateTime,
} from '../common';
import { Message } from '../../src/message';
import { delay } from 'bluebird';

test('Schedule a message: combine REPEAT, REPEAT PERIOD, DELAY. Case 1', async () => {
  await createQueue(defaultQueue, false);

  const msg = new Message();
  msg
    .setScheduledDelay(10000)
    .setScheduledRepeat(3)
    .setScheduledRepeatPeriod(3000)
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue);

  const producer = getProducer();
  await producer.produceAsync(msg);
  const producedAt = Date.now();

  await startScheduleWorker();
  await delay(30000);

  const messageManager = await getMessageManager();
  const r = await messageManager.pendingMessages.listAsync(defaultQueue, 0, 99);
  expect(r.items.length).toBe(4);

  const diff1 = (r.items[0].message.getPublishedAt() ?? 0) - producedAt;
  expect(validateTime(diff1, 10000)).toBe(true);

  const diff2 = (r.items[1].message.getPublishedAt() ?? 0) - producedAt;
  expect(validateTime(diff2, 13000)).toBe(true);

  const diff3 = (r.items[2].message.getPublishedAt() ?? 0) - producedAt;
  expect(validateTime(diff3, 16000)).toBe(true);

  const diff4 = (r.items[3].message.getPublishedAt() ?? 0) - producedAt;
  expect(validateTime(diff4, 19000)).toBe(true);
});
