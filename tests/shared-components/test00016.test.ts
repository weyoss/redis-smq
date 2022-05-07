import { delay, promisifyAll } from 'bluebird';
import {
  defaultQueue,
  getConsumer,
  getQueueManager,
  startTimeSeriesWorker,
} from '../common';

test('TimeSeriesWorker', async () => {
  await startTimeSeriesWorker();
  await delay(5000);
  const queueManager = promisifyAll(await getQueueManager());
  queueManager.createQueueAsync(defaultQueue, false);
  await delay(5000);
  const consumer = await getConsumer({ queue: defaultQueue });
  await consumer.runAsync();
  await delay(5000);
});
