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

test('Schedule a message: DELAY', async () => {
  await createQueue(defaultQueue, false);

  const msg = new Message();
  msg
    .setScheduledDelay(10000)
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue); // seconds

  const producer = getProducer();
  await producer.runAsync();

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
