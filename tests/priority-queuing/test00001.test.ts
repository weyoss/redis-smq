import {
  defaultQueue,
  getConsumer,
  getQueueManager,
  untilConsumerIdle,
} from '../common';
import { promisifyAll } from 'bluebird';

test('Priority queuing: case 1', async () => {
  const qm = await getQueueManager();
  await qm.queue.createQueueAsync(defaultQueue, true);

  const consumer = promisifyAll(getConsumer({ queue: defaultQueue }));
  await consumer.runAsync();
  await untilConsumerIdle(consumer);
});
