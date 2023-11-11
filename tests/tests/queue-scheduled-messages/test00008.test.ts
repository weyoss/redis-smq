import { Message } from '../../../src/lib/message/message';
import { delay } from 'bluebird';
import { startScheduleWorker } from '../../common/schedule-worker';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { validateTime } from '../../common/validate-time';
import { getQueuePendingMessages } from '../../common/queue-pending-messages';

test('Schedule a message: combine REPEAT, REPEAT PERIOD, DELAY. Case 2', async () => {
  await createQueue(defaultQueue, false);

  const msg = new Message();
  msg
    .setScheduledDelay(10000)
    .setScheduledRepeat(0) // should not be repeated
    .setScheduledRepeatPeriod(3000)
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue);

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(msg);
  const producedAt = Date.now();

  await startScheduleWorker();
  await delay(30000);

  const pendingMessages = await getQueuePendingMessages();
  const r = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(r.items.length).toBe(1);

  const diff = (r.items[0].getPublishedAt() ?? 0) - producedAt;
  expect(validateTime(diff, 10000)).toBe(true);
});
