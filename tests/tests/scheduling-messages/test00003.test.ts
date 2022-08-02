import { Message } from '../../../src/lib/message/message';
import { delay } from 'bluebird';
import { getMessageManager } from '../../common/message-manager';
import { startScheduleWorker } from '../../common/schedule-worker';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { validateTime } from '../../common/validate-time';

test('Schedule a message: CRON', async () => {
  await createQueue(defaultQueue, false);

  const msg = new Message();
  msg
    .setScheduledCRON('*/6 * * * * *')
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue);

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(msg);

  await startScheduleWorker();
  await delay(60000);

  const messageManager = await getMessageManager();
  const r = await messageManager.pendingMessages.listAsync(defaultQueue, 0, 99);
  expect(r.items.length > 8).toBe(true);

  for (let i = 0; i < r.items.length; i += 1) {
    const diff =
      (r.items[i].message.getPublishedAt() ?? 0) -
      (r.items[0].message.getPublishedAt() ?? 0);
    expect(validateTime(diff, 6000 * i)).toBe(true);
  }
});
