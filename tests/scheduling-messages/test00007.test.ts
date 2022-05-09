import {
  defaultQueue,
  getMessageManager,
  getProducer,
  startScheduleWorker,
  validateTime,
} from '../common';
import { Message } from '../../src/message';
import { delay } from 'bluebird';

test('Schedule a message: combine REPEAT, REPEAT PERIOD, DELAY. Case 2', async () => {
  const msg = new Message();
  msg
    .setScheduledDelay(10000)
    .setScheduledRepeat(0) // should not be repeated
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
  expect(r.items.length).toBe(1);

  const diff = (r.items[0].message.getPublishedAt() ?? 0) - producedAt;
  expect(validateTime(diff, 10000)).toBe(true);
});
