import { Message } from '../../../src/lib/message/message';
import { delay } from 'bluebird';
import { getQueueManager } from '../../common/queue-manager';
import { getMessageManager } from '../../common/message-manager';
import { startScheduleWorker } from '../../common/schedule-worker';
import { getProducer } from '../../common/producer';
import { createQueue } from '../../common/message-producing-consuming';

test("Make sure scheduled messages aren't published if destination queue is deleted", async () => {
  await createQueue('some_queue', false);

  const msg = new Message();
  msg
    .setScheduledCRON('*/3 * * * * *')
    .setBody({ hello: 'world' })
    .setQueue('some_queue');

  const producer = getProducer();
  await producer.produceAsync(msg);

  const messageManager = await getMessageManager();
  const s1 = await messageManager.scheduledMessages.listAsync(0, 99);
  expect(s1.total).toBe(1);

  const queueManager = await getQueueManager();
  await queueManager.queue.deleteAsync('some_queue');

  await startScheduleWorker();
  await delay(20000);

  await expect(
    queueManager.queueMetrics.getMetricsAsync('some_queue'),
  ).rejects.toThrow('Queue does not exist');

  const s2 = await messageManager.scheduledMessages.listAsync(0, 99);
  expect(s2.total).toBe(0);
});
