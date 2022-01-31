import {
  defaultQueue,
  getMessageManager,
  getProducer,
  startScheduleWorker,
  validateTime,
} from '../common';
import { Message } from '../../src/message';
import { delay, promisifyAll } from 'bluebird';

test('Schedule a message: CRON', async () => {
  const msg = new Message();
  msg
    .setScheduledCRON('*/6 * * * * *')
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue);

  const producer = getProducer();
  await producer.produceAsync(msg);

  await startScheduleWorker();
  await delay(60000);

  const m = promisifyAll(await getMessageManager());
  const r = await m.getPendingMessagesAsync(defaultQueue, 0, 99);
  expect(r.items.length > 8).toBe(true);

  for (let i = 0; i < r.items.length; i += 1) {
    const diff =
      (r.items[i].message.getPublishedAt() ?? 0) -
      (r.items[0].message.getPublishedAt() ?? 0);
    expect(validateTime(diff, 6000 * i)).toBe(true);
  }
});
