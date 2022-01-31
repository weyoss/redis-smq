import {
  defaultQueue,
  getMessageManager,
  getProducer,
  startScheduleWorker,
  validateTime,
} from '../common';
import { Message } from '../../src/message';
import { delay, promisifyAll } from 'bluebird';

test('Schedule a message: DELAY', async () => {
  const msg = new Message();
  msg
    .setScheduledDelay(10000)
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue); // seconds

  const producer = getProducer();
  await producer.produceAsync(msg);
  const producedAt = Date.now();

  await startScheduleWorker();
  await delay(30000);

  const m = promisifyAll(await getMessageManager());
  const r = await m.getPendingMessagesAsync(defaultQueue, 0, 99);
  expect(r.items.length).toBe(1);

  const diff = (r.items[0].message.getPublishedAt() ?? 0) - producedAt;
  expect(validateTime(diff, 10000)).toBe(true);
});
