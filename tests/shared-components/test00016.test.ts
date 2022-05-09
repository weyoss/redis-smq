import { delay } from 'bluebird';
import {
  defaultQueue,
  getConsumer,
  getQueueManager,
  startTimeSeriesWorker,
} from '../common';

test('TimeSeriesWorker', async () => {
  await startTimeSeriesWorker();
  await delay(5000);
  const queueManager = await getQueueManager();
  queueManager.queue.createQueueAsync(defaultQueue, false);
  await delay(5000);
  const consumer = await getConsumer({ queue: defaultQueue });
  await consumer.runAsync();
  await delay(5000);
});
